import { mask } from '../mask/index.mjs';
import { createHash } from 'node:crypto';

export const loc = node => ({ file: node.file, line: node.line });
export function sanitize(value) {
  if (typeof value === 'string') return mask(value);
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, ['id', 'from', 'to', 'candidates', 'roots', 'frontier'].includes(k) ? v : sanitize(v)]));
  return value;
}

export class Graph {
  nodes = []; edges = []; unresolved = []; skipped = [];
  byId = new Map(); byName = new Map(); edgeKeys = new Set();
  add(kind, name, at, details = {}) {
    const id = createHash('sha256').update(JSON.stringify([kind, name, at.file, at.line])).digest('hex');
    if (this.byId.has(id)) return this.byId.get(id);
    const node = { id, kind, name, ...at, details };
    this.nodes.push(node); this.byId.set(id, node);
    const group = this.byName.get(name) || []; group.push(node); this.byName.set(name, group);
    return node;
  }
  find(name, kinds) { return (this.byName.get(name) || []).filter(n => !kinds || kinds.includes(n.kind)); }
  edge(from, to, kind, evidence, status = 'CONFIRMED', reason, candidates) {
    const edge = { from: from.id, to: to.id, kind, status, evidence };
    if (reason) edge.reason = reason;
    if (candidates) edge.candidates = candidates.map(n => n.id);
    const key = JSON.stringify(edge);
    if (!this.edgeKeys.has(key)) { this.edges.push(edge); this.edgeKeys.add(key); }
    return edge;
  }
  unknown(from, kind, at, pattern, reason, constants = []) {
    const node = this.add('unknown', `${pattern}:${at.file}:${at.line}`, at, { pattern, constants });
    this.edge(from, node, kind, [at], 'UNRESOLVED', reason);
    this.unresolved.push({ ...at, from: from.id, pattern, reason, constants });
    return node;
  }
  link(from, candidates, kind, at, reason = '선언 후보가 여러 개여서 활성 구현/설정을 확정할 수 없음', extra = []) {
    if (!candidates.length) return this.unknown(from, kind, at, 'missing-declaration', '연결 대상 선언을 찾지 못함');
    const status = candidates.length === 1 ? 'CONFIRMED' : 'LIKELY';
    for (const to of candidates) this.edge(from, to, kind, [at, loc(to), ...extra], status, status === 'LIKELY' ? reason : undefined, status === 'LIKELY' ? candidates : undefined);
  }
  skip(at, pattern, reason) { this.skipped.push({ ...at, pattern, reason }); }
}

export function validateIndex(index) {
  if (!index.meta || index.meta.indexer_version !== '0.1.0' || !Number.isInteger(index.meta.processed_files) || !Number.isFinite(index.meta.duration_ms)) throw new Error('잘못된 index meta');
  const ids = new Set(index.nodes.map(n => n.id));
  if (ids.size !== index.nodes.length) throw new Error('중복 node id');
  for (const n of index.nodes) if (!n.file || !Number.isInteger(n.line) || n.line < 1) throw new Error('잘못된 노드 위치');
  for (const e of index.edges) {
    if (!ids.has(e.from) || !ids.has(e.to) || !['CONFIRMED', 'LIKELY', 'UNRESOLVED'].includes(e.status)
      || !e.evidence?.length || e.evidence.some(x => !x.file || !Number.isInteger(x.line) || x.line < 1)
      || (e.status !== 'CONFIRMED' && !e.reason) || e.candidates?.some(id => !ids.has(id))) throw new Error('잘못된 연결 계약');
  }
  for (const item of [...index.unresolved, ...index.skipped]) if (!item.pattern || !item.reason || !item.file || item.line < 1) throw new Error('잘못된 미처리 기록');
  return index;
}
