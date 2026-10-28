import { EDGE_KINDS } from './graph.mjs';

export const SCORE_GROUPS = ['parity', 'screen'];
export const selectorKey = selector => JSON.stringify(Object.fromEntries(Object.entries(selector).sort()));
const requestName = name => /^[A-Z]+ \/\S*/.test(name) ? name.replace(/[?#].*$/, '') : name;
export function matches(node, selector, requestTarget = false) {
  return node && (!selector.name || (requestTarget ? requestName(node.name) === requestName(selector.name) : node.name === selector.name))
    && (!selector.kind || node.kind === selector.kind) && (!selector.file || node.file === selector.file)
    && (!selector.pattern || node.details?.pattern === selector.pattern);
}
export const edgeKey = e => `${selectorKey(e.from)}|${e.kind}|${selectorKey(e.kind === 'requests' && e.to.name ? { ...e.to, name: requestName(e.to.name) } : e.to)}`;
const selectorValid = s => s && typeof s === 'object' && !Array.isArray(s) && Object.keys(s).length
  && Object.entries(s).every(([k, v]) => ['name', 'kind', 'file', 'pattern'].includes(k) && typeof v === 'string' && v.length);

export function validateExpected(expected) {
  if (expected.schema_version !== '1.0' || !expected.edges?.length || !expected.scope?.length) throw new Error('정답 계약 또는 비교 범위 누락');
  const grouped = expected.score_groups !== undefined;
  if (grouped && JSON.stringify(expected.score_groups) !== JSON.stringify(SCORE_GROUPS)) throw new Error('채점 그룹은 parity, screen이어야 합니다');
  const validGroup = item => grouped ? SCORE_GROUPS.includes(item.group) : item.group === undefined;
  for (const s of expected.scope) {
    if (!selectorValid(s.from) || !validGroup(s) || s.kinds !== undefined && (!Array.isArray(s.kinds) || !s.kinds.length || s.kinds.some(k => !EDGE_KINDS.includes(k)))) throw new Error('정답 scope 종류/선택자/그룹 오류');
    if (s.line !== undefined && (!s.file || !Number.isInteger(s.line) || s.line < 1)) throw new Error('정답 scope 위치 오류');
  }
  const keys = new Set();
  for (const e of expected.edges) {
    if (!e.evidence?.length) throw new Error('정답 연결 evidence 누락');
    if (!selectorValid(e.from) || !selectorValid(e.to) || !EDGE_KINDS.includes(e.kind) || !validGroup(e)
      || !['CONFIRMED', 'LIKELY', 'UNRESOLVED'].includes(e.status)
      || e.evidence.some(p => !p.file || !Number.isInteger(p.line) || p.line < 1)
      || e.status !== 'CONFIRMED' && !e.reason) throw new Error('정답 연결 종류/그룹/근거/상태/이유 오류');
    const scopes = expected.scope.filter(s => selectorKey(s.from) === selectorKey(e.from) && (!s.kinds || s.kinds.includes(e.kind))
      && (s.line === undefined || e.evidence.some(p => p.file === s.file && p.line === s.line)));
    if (!scopes.length || scopes.some(s => s.group !== e.group)) throw new Error('정답 연결의 비교 범위/그룹 불일치');
    const key = edgeKey(e);
    if (keys.has(key)) throw new Error('정답 연결 중복');
    keys.add(key);
  }
  if (grouped) for (let i = 0; i < expected.scope.length; i++) for (const b of expected.scope.slice(i + 1)) {
    const a = expected.scope[i];
    if (a.group === b.group) continue;
    const disjoint = Object.keys(a.from).some(k => b.from[k] && a.from[k] !== b.from[k])
      || a.kinds && b.kinds && !a.kinds.some(k => b.kinds.includes(k))
      || a.line && b.line && (a.line !== b.line || a.file !== b.file);
    if (!disjoint) throw new Error('그룹 간 비교 scope가 겹칩니다');
  }
  return grouped;
}

export function assertParity(expected, reference) {
  const signature = e => JSON.stringify({ from: selectorKey(e.from), to: selectorKey(e.to), kind: e.kind, status: e.status });
  const baseline = reference.edges.filter(e => e.kind !== 'requests').map(signature).sort();
  const actual = expected.edges.filter(e => e.group === 'parity').map(signature).sort();
  if (JSON.stringify(actual) !== JSON.stringify(baseline)) throw new Error('FAIL: parity 연결의 from/to/kind/status가 JSP 승인 정답과 다릅니다');
  return baseline.length;
}
