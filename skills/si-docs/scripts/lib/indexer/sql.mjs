import { stripComments, blank, location } from './source.mjs';

export function collectSql(file, source, graph, owner = null, offset = 0, fullSource = source) {
  const text = stripComments(source, 'sql').replace(/'(?:''|[^'])*'/g, blank);
  const at = i => location(file, fullSource, offset + i);
  const root = owner || graph.add('config', file, { file, line: 1 });
  for (const m of text.matchAll(/\bCREATE\s+(?:OR\s+REPLACE\s+)?(TABLE|VIEW|PROCEDURE)\s+([\w.$]+)/gi)) graph.add(m[1].toLowerCase(), m[2].toUpperCase(), at(m.index), { declaration: true });
  const ctes = new Set([...text.matchAll(/\b(?:WITH|,)\s*(\w+)\s+AS\s*\(/gi)].map(m => m[1].toUpperCase()));
  for (const m of text.matchAll(/\b(FROM|JOIN|INSERT\s+INTO|UPDATE|DELETE\s+FROM|MERGE\s+INTO|CALL)\s+([\w.$]+|"[^"]+")/gi)) {
    const name = m[2].replace(/"/g, '').toUpperCase();
    if (ctes.has(name) || name === 'SET' || name === '$') continue;
    const operation = m[1].toUpperCase();
    const kind = operation === 'CALL' ? 'executes' : /^(?:FROM|JOIN)$/.test(operation) ? 'reads' : 'writes';
    let target = graph.find(name, ['table', 'view', 'procedure'])[0];
    if (!target) target = graph.add(operation === 'CALL' ? 'procedure' : 'table', name, at(m.index), { declaration: false, object_type: operation === 'CALL' ? 'procedure' : 'table-or-view' });
    graph.edge(root, target, kind, [at(m.index)], 'CONFIRMED');
  }
  for (const m of text.matchAll(/\$\{([^}]+)\}/g)) graph.unresolved.push({ ...at(m.index), from: root.id, pattern: 'sql-substitution', reason: '${}는 문자열 치환이며 허용 값/분기 안전성을 정적 인덱서가 보증하지 않음', constants: [] });
  if (/\b(?:FROM|JOIN|INTO)\s+\$\{/.test(text)) graph.unknown(root, 'reads', at(0), 'dynamic-table', '테이블 식별자가 런타임 문자열 치환임');
  for (const m of text.matchAll(/\bFROM\s+[\w.$]+(?:\s+(?:AS\s+)?\w+)?(?:\s*,\s*[\w.$]+(?:\s+(?:AS\s+)?\w+)?)+/gi)) {
    for (const part of m[0].matchAll(/,\s*([\w.$]+)/g)) {
      const name = part[1].toUpperCase();
      if (ctes.has(name)) continue;
      const point = at(m.index + part.index);
      const target = graph.find(name, ['table', 'view'])[0] || graph.add('table', name, point, { declaration: false, object_type: 'table-or-view' });
      graph.edge(root, target, 'reads', [point]);
    }
  }
  if (/\bMERGE\s+INTO/i.test(text)) for (const m of text.matchAll(/\bUSING\s+([\w.$]+)/gi)) {
    const name = m[1].toUpperCase();
    const target = graph.find(name, ['table', 'view'])[0] || graph.add('table', name, at(m.index), { declaration: false, object_type: 'table-or-view' });
    graph.edge(root, target, 'reads', [at(m.index)]);
  }
}
