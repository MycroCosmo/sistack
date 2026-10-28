import { xmlElements, stripComments, lineAt, closing, hideStrings } from '../indexer/source.mjs';
import { collectJava } from '../indexer/java.mjs';
import { Graph } from '../indexer/graph.mjs';
import { digest } from '../trace/io.mjs';

export function boundaryPair(operator, constant) {
  if (!Number.isSafeInteger(constant)) throw new Error('정수 경계 상수 필요');
  const pair = { '>': [constant, constant + 1], '>=': [constant - 1, constant], '<': [constant, constant - 1], '<=': [constant + 1, constant] }[operator];
  if (!pair) throw new Error('지원하지 않는 비교식');
  return { allowed: pair[0], rejected: pair[1] };
}
const decode = s => s.replaceAll('&gt;', '>').replaceAll('&lt;', '<').replaceAll('&amp;', '&');
const ownerOf = node => node.details?.namespace || node.name.slice(0, node.name.lastIndexOf('.'));
const plainSql = s => s.replace(/<set\b[^>]*>/gi, ' SET ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const property = s => s[0].toLowerCase() + s.slice(1);

export function deriveCoverage(index, sources) {
  const items = [], statements = [], classes = [], declarations = new Map();
  const add = item => { const id = digest(JSON.stringify(item)).slice(0, 16).replace(/[0-9a-f]/g, c => String.fromCharCode(97 + parseInt(c, 16))); items.push({ id, ...item, tests: [] }); };
  for (const node of index.nodes.filter(n => n.kind === 'class')) {
    if (!sources[node.file] || classes.some(c => c.file === node.file)) continue;
    const cls = collectJava(node.file, sources[node.file], new Graph());
    if (cls) classes.push({ ...cls, service: Boolean(node.details?.bean) && (cls.annotations.some(a => a.name === 'Service') || /Service(?:Impl)?$/.test(node.name)) });
  }
  for (const file of [...new Set(index.nodes.filter(n => ['sql', 'fragment'].includes(n.kind) && n.details?.dialect === 'mybatis').map(n => n.file))]) {
    const text = stripComments(sources[file], 'markup'), elements = xmlElements(text), root = elements.find(e => e.tag === 'mapper');
    if (!root) continue;
    for (const e of elements.filter(e => e.parent === root && ['sql', 'select', 'update', 'insert', 'delete'].includes(e.tag))) {
      const name = `${root.attrs.namespace}.${e.attrs.id}`;
      const node = index.nodes.find(n => n.name === name && n.file === file);
      if (!node) continue;
      declarations.set(name, { name, node, file, text, e, namespace: root.attrs.namespace });
    }
  }
  function expand(rec, seen = []) {
    if (seen.includes(rec.name)) throw new Error('SQL include 순환');
    const raw = rec.text.slice(rec.e.bodyStart, rec.e.bodyEnd);
    return raw.replace(/<(if|when|otherwise)\b/g, (m, tag, offset) => `<${tag} data-origin-file="${rec.file}" data-origin-line="${lineAt(rec.text, rec.e.bodyStart + offset)}"`)
      .replace(/<include\b[^>]*refid=["']([^"']+)["'][^>]*\/>/g, (m, ref) => {
        const target = declarations.get(ref.includes('.') ? ref : `${rec.namespace}.${ref}`);
        if (!target) throw new Error('SQL include 대상 미확정');
        return expand(target, [...seen, rec.name]);
      });
  }
  for (const rec of declarations.values()) {
    if (rec.e.tag === 'sql') continue;
    let expanded;
    try { expanded = `<statement>${expand(rec)}</statement>`; }
    catch (error) { add({ kind: 'sql-unresolved', file: rec.file, line: rec.node.line, owner: rec.namespace, method: rec.e.attrs.id, unresolved: error.message }); continue; }
    const elements = xmlElements(expanded), branches = elements.filter(e => ['if', 'when', 'otherwise'].includes(e.tag));
    const conditionsFor = (element, includeSelf = true) => {
      const chain = [];
      for (let e = includeSelf ? element : element.parent; e; e = e.parent) {
        if (['if', 'when'].includes(e.tag)) chain.unshift({ expression: decode(e.attrs.test ?? ''), truth: true });
        if (e.tag === 'otherwise') chain.unshift(...elements.filter(x => x.parent === e.parent && x.tag === 'when').map(x => ({ expression: decode(x.attrs.test ?? ''), truth: false })));
      }
      return chain;
    };
    const methodNode = index.nodes.find(n => n.kind === 'method' && n.details?.owner === rec.namespace && n.name.endsWith(`#${rec.e.attrs.id}`));
    const inputType = methodNode?.details?.parameters?.[0]?.type || rec.e.attrs.parameterType || null;
    const sql = plainSql(expanded), table = (rec.e.tag === 'insert' ? /\bINSERT\s+INTO\s+([A-Za-z_]\w*)/i : rec.e.tag === 'update' ? /\bUPDATE\s+([A-Za-z_]\w*)/i : /\bFROM\s+([A-Za-z_]\w*)/i).exec(sql)?.[1] ?? null;
    const rownumAlias = /\bROWNUM\s+AS\s+(\w+)/i.exec(sql)?.[1];
    const predicates = [];
    for (const m of expanded.matchAll(/\b(?:AND|WHERE)\s+(?:\w+\.)?([A-Za-z_]\w*)\s*(LIKE|&gt;=|&lt;=|&gt;|&lt;|>=|<=|=|>|<)\s*(?:'%'\s*\|\|\s*)?#\{(\w+)\}/gi)) {
      const enclosing = branches.filter(e => e.bodyStart <= m.index && e.bodyEnd > m.index).at(-1);
      predicates.push({ column: m[1], operator: decode(m[2]).toUpperCase(), property: m[3], role: rownumAlias && (rownumAlias === m[1] || m[1].toUpperCase() === 'ROWNUM') ? 'pagination' : 'filter', conditions: enclosing ? conditionsFor(enclosing) : [] });
    }
    const statement = { owner: rec.namespace, method: rec.e.attrs.id, file: rec.file, line: rec.node.line,
      statement: rec.name, tag: rec.e.tag, input_type: inputType, table, predicates };
    statements.push(statement);
    for (const branch of branches) for (const outcome of branch.tag === 'if' ? [true, false] : [true]) {
      const conditions = conditionsFor(branch);
      if (!outcome) conditions.at(-1).truth = false;
      add({ kind: 'sql-branch', owner: rec.namespace, method: rec.e.attrs.id, statement: rec.name,
        file: branch.attrs['data-origin-file'], line: Number(branch.attrs['data-origin-line']),
        branch_tag: branch.tag, branch_offset: branch.start, outcome, conditions, input_type: inputType });
    }
    if (rec.e.tag === 'update') {
      const set = /\bSET\s+([\s\S]+?)\bWHERE\b/i.exec(sql)?.[1];
      const key = /\bWHERE\s+(\w+)\s*=\s*#\{(\w+)\}/i.exec(sql);
      for (const assignment of set?.split(',').filter(s => s.trim()) ?? []) {
        const m = /^\s*(\w+)\s*=\s*#\{(\w+)\}\s*$/.exec(assignment);
        add({ ...statement, kind: 'update-column', column: /^\s*(\w+)/.exec(assignment)?.[1] || '?',
          property: m?.[2] ?? null, key_column: key?.[1] ?? null, key_property: key?.[2] ?? null,
          ...(!m || !key ? { unresolved: '단순 SET 바인딩/기본키 조건 수동 확인 필요' } : {}) });
      }
      if (!set) add({ ...statement, kind: 'update-unresolved', unresolved: 'UPDATE SET 파싱 불가' });
    }
    if (rec.e.tag === 'insert') {
      const insert = /\bINSERT\s+INTO\s+\w+\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i.exec(sql);
      if (!insert) add({ ...statement, kind: 'insert-unresolved', unresolved: '명시 INSERT 컬럼/VALUES 파싱 불가' });
      else {
        const columns = insert[1].split(',').map(s => s.trim()), values = insert[2].split(',').map(s => s.trim());
        for (let i = 0; i < columns.length; i++) {
          const bound = /^#\{(\w+)\}$/.exec(values[i] ?? '');
          add({ ...statement, kind: 'insert-column', column: columns[i], property: bound?.[1] ?? null,
            ...(!bound ? { unresolved: '계산식 INSERT 값은 독립 기대값 fixture 필요' } : {}) });
        }
      }
    }
  }
  for (const cls of classes.filter(c => c.service)) {
    const constants = Object.fromEntries([...cls.text.matchAll(/\b(?:int|long)\s+(\w+)\s*=\s*(-?\d+)[lL]?\s*;/g)].map(m => [m[1], Number(m[2])]));
    for (const method of cls.methods) for (const guard of method.body.matchAll(/\bif\s*\(/g)) {
      const start = guard.index + guard[0].lastIndexOf('('), end = closing(method.body, start);
      if (end < 0) continue;
      const after = method.body.slice(end + 1), blockStart = after.search(/\S/);
      const guardBody = after[blockStart] === '{' ? after.slice(blockStart, closing(after, blockStart, '{', '}') + 1) : after.slice(0, after.indexOf(';') + 1);
      if (!/throw\s+new\s+IllegalArgumentException\b/.test(guardBody)) continue;
      const condition = method.body.slice(start + 1, end).replace(/(-?\d+|[A-Z_]\w*)\s*(>=|<=|>|<)\s*(\w+\.get\w+\(\)(?:\.length\(\))?)/g,
        (match, value, op, target) => `${target} ${{ '>': '<', '>=': '<=', '<': '>', '<=': '>=' }[op]} ${value}`);
      let comparisons = 0;
      for (const m of condition.matchAll(/(\w+)\.get(\w+)\(\)(\.length\(\))?\s*(>=|<=|>|<)\s*(-?\d+|[A-Z_]\w*)/g)) {
        comparisons++;
        const parameter = method.node.details.parameters.find(p => p.name === m[1]);
        const value = /^-?\d+$/.test(m[5]) ? Number(m[5]) : constants[m[5]];
        const entrypoints = cls.methods.filter(x => /\bpublic\b/.test(cls.plain.slice(x.start, x.bodyStart)) && (x === method || new RegExp(`\\b${method.name}\\s*\\(`).test(x.body)));
        for (const entry of entrypoints.length ? entrypoints : [method]) add({ kind: 'service-boundary', owner: cls.name, method: entry.name,
          validator: method.name, input_type: parameter?.type ?? null, property: property(m[2]), measure: m[3] ? 'length' : 'number',
          operator: m[4], constant: m[5], file: cls.file, line: lineAt(cls.text, method.bodyStart + start + 1 + m.index),
          ...(Number.isSafeInteger(value) && !condition.split('||').find(t => t.includes(m[0]))?.includes('&&') ? { pair: boundaryPair(m[4], value) } : { unresolved: '상수 또는 결합 조건 수동 확인 필요' }) });
      }
      if ([...hideStrings(condition).matchAll(/>=|<=|>|</g)].length > comparisons) add({ kind: 'service-comparison-unresolved', owner: cls.name, method: method.name,
        file: cls.file, line: lineAt(cls.text, method.bodyStart + start), unresolved: 'getter 이외 비교식은 입력·경계 수동 도출 필요' });
    }
  }
  const metadata = classes.map(c => ({ name: c.name, file: c.file, fields: c.fields.map(f => ({ name: f.name, type: f.type })),
    methods: c.methods.map(m => ({ name: m.name, parameters: m.node.details.parameters, return_type: m.node.details.return_type, body: m.body })) }));
  return { schema_version: '1.0.0', source_revision: index.meta.source_revision ?? null, source_files: index.meta.source_files,
    items, statements, classes: metadata };
}

export function coverageSummary(plan, tests) {
  const results = new Map(tests.map(t => [`${t.class_name}#${t.method_name}`, t.status]));
  return { planned: plan.items.length, generated: plan.items.filter(i => i.tests.length).length,
    executed: plan.items.filter(i => i.tests.length && i.tests.every(id => results.has(id) && results.get(id) !== 'SKIP')).length,
    passed: plan.items.filter(i => i.tests.length && i.tests.every(id => results.get(id) === 'PASS')).length,
    unresolved: plan.items.filter(i => i.unresolved).length };
}
