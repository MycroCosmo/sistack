import { xmlElements, stripComments, blank, location, strings } from './source.mjs';
import { collectSql } from './sql.mjs';
import { loc } from './graph.mjs';

export function collectMapper(file, source, graph, dialect = 'mybatis') {
  const text = stripComments(source, 'markup'), elements = xmlElements(text);
  const root = elements.find(e => e.tag === (dialect === 'mybatis' ? 'mapper' : 'sqlMap'));
  if (!root) return [];
  const namespace = root.attrs.namespace || '';
  const records = [];
  for (const e of elements.filter(e => e.parent === root && ['select', 'insert', 'update', 'delete', 'procedure', 'sql', 'resultMap'].includes(e.tag))) {
    if (!e.attrs.id) { graph.skip(location(file, text, e.start), 'mapper-no-id', '매핑 id 누락'); continue; }
    const kind = e.tag === 'sql' ? 'fragment' : e.tag === 'resultMap' ? 'resultMap' : 'sql';
    const name = `${namespace ? namespace + '.' : ''}${e.attrs.id}`;
    const node = graph.add(kind, name, location(file, text, e.start), { namespace, statement: e.attrs.id, dialect, parameter_type: e.attrs.parameterType || e.attrs.parameterClass || null });
    const record = { node, namespace, id: e.attrs.id, refs: [] }; records.push(record);
    const localName = ref => ref.includes('.') ? ref : `${namespace ? namespace + '.' : ''}${ref}`;
    for (const child of elements.filter(x => x.start > e.start && x.end < e.end && x.tag === 'include')) {
      const ref = child.attrs.refid;
      if (ref && !ref.includes('${')) record.refs.push({ name: localName(ref), kinds: ['fragment'], at: location(file, text, child.start), kind: 'includes' });
      else graph.unknown(node, 'includes', location(file, text, child.start), 'dynamic-include', 'refid가 없거나 동적 치환임');
    }
    if (e.attrs.resultMap) record.refs.push({ name: localName(e.attrs.resultMap), kinds: ['resultMap'], at: loc(node), kind: 'maps_to' });
    if (kind !== 'resultMap') {
      let sql = text.slice(e.bodyStart, e.bodyEnd).replace(/<!\[CDATA\[|\]\]>/g, blank).replace(/<\/?[A-Za-z][^>]*>/g, blank);
      collectSql(file, sql, graph, node, e.bodyStart, text);
      node.details.parameters = [...sql.matchAll(/#\{(\w+)|#(\w+)#/g)].map(m => m[1] || m[2]);
      node.details.substitutions = [...sql.matchAll(/\$\{(\w+)\}/g)].map(m => m[1]);
    }
  }
  return records;
}

export const collectMybatis = (file, text, graph) => collectMapper(file, text, graph, 'mybatis');

export function linkMappers(records, classes, graph) {
  for (const record of records) {
    for (const ref of record.refs) {
      let candidates = graph.find(ref.name, ref.kinds);
      const local = candidates.filter(n => n.file === record.node.file);
      if (local.length) candidates = local;
      graph.link(record.node, candidates, ref.kind, ref.at, '동일 SQL 조각/resultMap의 DB별 매핑이 여러 개임');
    }
    if (record.node.kind !== 'sql') continue;
    for (const cls of classes.filter(c => c.kind === 'interface' && c.name === record.namespace)) {
      for (const method of cls.methods.filter(m => m.name === record.id)) graph.link(method.node, graph.find(record.node.name, ['sql']), 'executes', loc(method.node), '동일 namespace.id 매핑이 여러 개임');
    }
  }
  for (const cls of classes) for (const method of cls.methods) {
    for (const annotation of method.annotations.filter(a => ['Select', 'Insert', 'Update', 'Delete'].includes(a.name))) {
      const node = graph.add('sql', `${cls.name}.${method.name}`, location(cls.file, cls.text, annotation.start), { dialect: 'mybatis-annotation' });
      graph.edge(method.node, node, 'executes', [loc(method.node), loc(node)]);
      collectSql(cls.file, strings(annotation.args).join(' '), graph, node, annotation.start, cls.text);
    }
  }
}
