import { validateIndex } from './graph.mjs';

export function queryIndex(index, { from, to, depth = 8 }) {
  validateIndex(index);
  if (Boolean(from) === Boolean(to) || !Number.isInteger(depth) || depth < 0 || depth > 100) throw new Error('from/to 중 하나와 depth 0~100을 지정하세요');
  const value = from || to;
  const roots = index.nodes.filter(n => n.id === value || n.name === value || n.details?.path === value || (n.kind === 'method' && n.name.split('.').at(-1) === value));
  if (!roots.length) throw new Error('시작 노드를 찾지 못했습니다');
  const adjacency = new Map();
  for (const edge of index.edges) { const key = from ? edge.from : edge.to; const group = adjacency.get(key) || []; group.push(edge); adjacency.set(key, group); }
  const seen = new Set(roots.map(n => n.id)), edges = new Set(); let frontier = [...seen];
  for (let level = 0; level < depth && frontier.length; level++) {
    const next = [];
    for (const id of frontier) for (const edge of adjacency.get(id) || []) {
      edges.add(edge); const target = from ? edge.to : edge.from;
      if (!seen.has(target)) { seen.add(target); next.push(target); }
    }
    frontier = next;
  }
  return { direction: from ? 'forward' : 'reverse', depth, roots: roots.map(n => n.id), nodes: index.nodes.filter(n => seen.has(n.id)), edges: [...edges], frontier: frontier.filter(id => (adjacency.get(id) || []).length), unresolved: index.unresolved.filter(u => seen.has(u.from)) };
}

export function queryText(result) {
  const nodes = new Map(result.nodes.map(n => [n.id, n]));
  return result.edges.map(e => `${e.status} ${nodes.get(e.from).name} --${e.kind}--> ${nodes.get(e.to).name} [${e.evidence.map(p => `${p.file}:${p.line}`).join(', ')}]${e.reason ? ' ' + e.reason : ''}`).join('\n') || '연결 없음';
}
