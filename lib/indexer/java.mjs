import { stripComments, hideStrings, annotations, blank, closing, location, literal } from './source.mjs';
import { loc } from './graph.mjs';

const typeName = type => type.replace(/<.*>/s, '').replace(/\[\]/g, '').trim();
export function collectJava(file, source, graph) {
  const text = stripComments(source), ann = annotations(text);
  let plain = text;
  for (const a of [...ann].reverse()) plain = plain.slice(0, a.start) + blank(plain.slice(a.start, a.end)) + plain.slice(a.end);
  const shape = hideStrings(plain);
  const declaration = /\b(class|interface|enum|record)\s+(\w+)([^{}]*)\{/.exec(shape);
  if (!declaration) { graph.skip({ file, line: 1 }, 'java-declaration', '지원하는 최상위 클래스 선언 없음'); return null; }
  const pkg = /\bpackage\s+([\w.]+)\s*;/.exec(shape)?.[1] || '';
  const imports = new Map([...shape.matchAll(/\bimport\s+([\w.]+)\s*;/g)].map(m => [m[1].split('.').at(-1), m[1]]));
  const qualify = type => { const t = typeName(type); return t.includes('.') ? t : imports.get(t) || (pkg ? `${pkg}.${t}` : t); };
  const name = qualify(declaration[2]);
  const classStart = declaration.index + declaration[0].length - 1;
  const depth = new Uint16Array(shape.length + 1); let level = 0;
  for (let i = 0; i < shape.length; i++) { depth[i] = Math.max(0, level); if (shape[i] === '{') level++; if (shape[i] === '}') level--; }
  if (level !== 0) throw new Error('unbalanced-java');
  if ([...shape.matchAll(/\b(?:class|interface|record)\s+\w+[^{}]*\{/g)].length > 1) graph.skip(location(file, text, classStart), 'nested-java-type', '내부 클래스의 독립 타입 해석 미지원');
  const classAnn = ann.filter(a => a.start < declaration.index);
  const bean = classAnn.find(a => ['Service', 'Repository', 'Component', 'Controller', 'RestController'].includes(a.name));
  const node = graph.add('class', name, location(file, text, declaration.index), { java_kind: declaration[1], bean: bean ? literal(bean.args) || declaration[2][0].toLowerCase() + declaration[2].slice(1) : null });
  let inheritance = '', genericDepth = 0;
  for (const ch of declaration[3]) {
    if (ch === '<') genericDepth++;
    else if (ch === '>') genericDepth--;
    else if (genericDepth === 0) inheritance += ch;
  }
  const parents = [...inheritance.matchAll(/\b(?:extends|implements)\s+(.+?)(?=\b(?:implements|permits)\b|$)/g)]
    .flatMap(m => m[1].split(',').map(t => qualify(t.trim())));
  const cls = { node, text, plain, shape, file, name, simple: declaration[2], kind: declaration[1], imports, qualify, parents, annotations: classAnn, methods: [], fields: [] };
  const methodPattern = /^[ \t]*(?:(?:public|protected|private|static|final|abstract|synchronized|default|native)\s+)*(?:<[^>\n]+>\s*)?([\w$.[\]<>?, \t]+?)\s+(\w+)\s*\(/gm;
  for (const m of plain.matchAll(methodPattern)) {
    const pos = m.index + m[0].search(/\S/);
    if (depth[pos] !== 1 || pos < classStart) continue;
    const open = m.index + m[0].lastIndexOf('('), close = closing(plain, open);
    if (close < 0) throw new Error('unbalanced-method');
    const suffix = /^\s*(?:throws\s+[\w.,\s]+)?\s*([;{])/.exec(plain.slice(close + 1));
    if (!suffix) continue;
    const bodyStart = close + 1 + suffix[0].length - 1;
    const end = suffix[1] === '{' ? closing(plain, bodyStart, '{', '}') : bodyStart;
    if (end < 0) throw new Error('unbalanced-method-body');
    const preceding = Math.max(classStart, ...cls.methods.map(x => x.end));
    const methodAnn = ann.filter(a => a.start > preceding && a.end <= pos && !plain.slice(a.end, pos).trim());
    // Multiple adjacent annotations are blanked in plain, so all belong to this declaration.
    const params = text.slice(open + 1, close);
    const details = { owner: name, parameters: [...params.matchAll(/(?:^|,)\s*(?:@[\w]+(?:\([^)]*\))?\s*)*(?:final\s+)?([\w.<>?\[\]]+)\s+(\w+)/g)].map(p => ({ type: qualify(p[1]), name: p[2] })) };
    const methodNode = graph.add('method', `${name}#${m[2]}`, location(file, text, pos), details);
    cls.methods.push({ node: methodNode, name: m[2], start: pos, end, bodyStart: suffix[1] === '{' ? bodyStart + 1 : end, body: suffix[1] === '{' ? text.slice(bodyStart + 1, end) : '', annotations: methodAnn, params });
  }
  for (const m of plain.matchAll(/^[ \t]*(?:(?:private|protected|public|static|final|transient|volatile)\s+)+([\w.$<>?, \[\]]+)\s+(\w+)\s*(?:=[^;]*)?;/gm)) {
    const pos = m.index + m[0].search(/\S/);
    if (depth[pos] !== 1) continue;
    const attached = ann.filter(a => a.end <= pos && !plain.slice(a.end, pos).trim());
    const resource = attached.find(a => ['Resource', 'Qualifier', 'Named'].includes(a.name));
    cls.fields.push({ name: m[2], type: qualify(m[1]), at: location(file, text, pos), bean: resource ? /name\s*=\s*"([^"]+)"/.exec(resource.args)?.[1] || literal(resource.args) : null, injected: attached.some(a => ['Resource', 'Autowired', 'Inject'].includes(a.name)) });
  }
  // Constructor and setter assignments bind parameter types to fields without assuming field names.
  for (const m of text.matchAll(/\bthis\.(\w+)\s*=\s*(\w+)\s*;/g)) {
    const field = cls.fields.find(f => f.name === m[1]);
    if (field && new RegExp(`\\b${m[2]}\\s*[,)]`).test(plain.slice(Math.max(0, m.index - 1000), m.index))) field.injected = true;
  }
  for (const method of cls.methods) {
    method.node.details.request_attributes = [...method.params.matchAll(/@RequestAttribute\(\s*"([^"]+)"/g)].map(m => m[1]);
    method.node.details.map_keys = [...method.body.matchAll(/\b\w+\.put\(\s*"([\w]+)"/g)].map(m => m[1]);
    method.node.details.session_reads = [...method.body.matchAll(/\b(?:session|getSession\(\))\.getAttribute\(\s*"([\w]+)"/g)].map(m => m[1]);
    method.node.details.request_writes = [...method.body.matchAll(/\brequest\.setAttribute\(\s*"([\w]+)"/g)].map(m => m[1]);
  }
  return cls;
}

export function linkJava(classes, graph) {
  const byType = new Map();
  for (const cls of classes) { const list = byType.get(cls.name) || []; list.push(cls); byType.set(cls.name, list); }
  const isA = (cls, type, seen = new Set()) => {
    if (cls.name === type || cls.parents.includes(type)) return true;
    if (seen.has(cls.name)) return false; seen.add(cls.name);
    return cls.parents.some(p => (byType.get(p) || []).some(parent => isA(parent, type, seen)));
  };
  for (const cls of classes) {
    const fieldByName = new Map(cls.fields.map(f => [f.name, f]));
    const fieldTargets = new Map();
    for (const method of cls.methods) {
      const at = index => location(cls.file, cls.text, method.bodyStart + index);
      const bodyShape = hideStrings(method.body);
      for (const m of bodyShape.matchAll(/\b(?:this\.)?(\w+)\s*\.\s*(\w+)\s*\(/g)) {
        const field = fieldByName.get(m[1]);
        if (!field) continue;
        if (!fieldTargets.has(field.name)) fieldTargets.set(field.name, classes.filter(c => isA(c, field.type) && (!field.bean || c.node.details.bean === field.bean || c.kind === 'interface')));
        const candidates = fieldTargets.get(field.name);
        let implementations = candidates.filter(c => c.kind !== 'interface').flatMap(c => c.methods.filter(x => x.name === m[2]).map(x => x.node));
        if (!implementations.length) implementations = candidates.filter(c => c.kind === 'interface').flatMap(c => c.methods.filter(x => x.name === m[2]).map(x => x.node));
        if (/\b(SqlSessionTemplate|SqlSession|SqlMapClient)\b/.test(field.type)) continue;
        if (implementations.length) {
          if (field.injected) graph.link(method.node, implementations, 'calls', at(m.index), '주입 타입/이름으로 구현 또는 overload 하나를 결정할 수 없음', [field.at]);
          else for (const candidate of implementations) graph.edge(method.node, candidate, 'calls', [at(m.index), field.at, loc(candidate)], 'LIKELY', '필드 타입은 확인했으나 주입/할당 근거가 없음', implementations);
        } else if (field.injected) graph.unknown(method.node, 'calls', at(m.index), 'external-injection', '주입 필드의 호출 대상 구현이 소스 범위에 없음');
      }
      for (const m of bodyShape.matchAll(/(?<![\w.])(?:this\.)?(\w+)\s*\(/g)) {
        const own = cls.methods.filter(x => x.name === m[1] && x !== method).map(x => x.node);
        if (own.length) graph.link(method.node, own, 'calls', at(m.index), '동일 이름 overload의 인자 타입 해석 미지원');
      }
      for (const m of method.body.matchAll(/(?:(\w+)\s*\.\s*)?\b(selectList|selectOne|selectByPk|list|insert|update|delete|queryForObject|queryForList)\s*\(\s*([^,;\n]+)[,)]/g)) {
        if (!bodyShape[m.index]?.trim()) continue;
        const field = fieldByName.get(m[1]);
        const session = field && /(?:SqlSessionTemplate|SqlSession|SqlMapClient)$/.test(field.type);
        const inherited = (!m[1] || m[1] === 'super') && (isA(cls, 'egovframework.com.cmm.service.impl.EgovComAbstractDAO') || cls.parents.some(p => /(?:EgovAbstractDAO|EgovAbstractMapper)$/.test(p)));
        if (!session && !inherited) continue;
        const sqlId = literal(m[3].replace(/\)\s*$/, ''));
        if (sqlId) graph.link(method.node, graph.find(sqlId, ['sql']), 'executes', at(m.index), '동일 sqlId의 DB별 매핑이 여러 개이며 활성 DB 미확정');
        else graph.unknown(method.node, 'executes', at(m.index), 'dynamic-sqlId', 'sqlId가 단일 문자열 리터럴이 아님');
      }
      for (const m of bodyShape.matchAll(/\b(?:prepareStatement|getTables|getColumns)\s*\(/g)) graph.unknown(method.node, 'executes', at(m.index), 'jdbc-runtime-sql', 'JDBC SQL/메타데이터 대상은 런타임 값이며 정적 테이블 확정 불가');
    }
  }
}
