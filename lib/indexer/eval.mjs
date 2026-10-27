import { validateIndex } from './graph.mjs';

function matches(node, selector) {
  return node && (!selector.name || node.name === selector.name) && (!selector.kind || node.kind === selector.kind)
    && (!selector.file || node.file === selector.file) && (!selector.pattern || node.details?.pattern === selector.pattern);
}
const selectorKey = selector => JSON.stringify(Object.fromEntries(Object.entries(selector).sort()));
const edgeKey = e => `${selectorKey(e.from)}|${e.kind}|${selectorKey(e.to)}`;

export function evalIndex(index, expected, { draft = false } = {}) {
  validateIndex(index);
  if (expected.schema_version !== '1.0' || !Array.isArray(expected.edges) || !expected.edges.length || !Array.isArray(expected.scope) || !expected.scope.length) throw new Error('정답 계약 또는 비교 범위 누락');
  if (!draft && expected.review_status !== 'approved') throw new Error('승인되지 않은 정답입니다. 초안은 --draft로만 미리보기 가능');
  if (!['draft', 'approved'].includes(expected.review_status)) throw new Error('잘못된 정답 상태');
  if (expected.source_revision !== index.meta.source_revision) throw new Error('정답과 인덱스의 source_revision이 다릅니다');
  const ids = new Map(index.nodes.map(n => [n.id, n]));
  const inScope = edge => expected.scope.some(s => matches(ids.get(edge.from), s.from) && (!s.kinds || s.kinds.includes(edge.kind)) && (!s.line || edge.evidence.some(e => e.file === s.file && e.line === s.line)));
  const actual = index.edges.filter(inScope);
  const expectedKeys = new Set();
  for (const e of expected.edges) {
    if (!e.from || !e.to || !e.kind || !['CONFIRMED', 'LIKELY', 'UNRESOLVED'].includes(e.status) || !e.evidence?.length || e.evidence.some(p => !p.file || !Number.isInteger(p.line) || p.line < 1) || (e.status !== 'CONFIRMED' && !e.reason)) throw new Error('정답 연결에 근거/상태/이유가 누락됨');
    if (!expected.scope.some(s => JSON.stringify(s.from) === JSON.stringify(e.from) && (!s.kinds || s.kinds.includes(e.kind)))) throw new Error('정답 연결이 선언한 비교 범위에 없음');
    const key = edgeKey(e); if (expectedKeys.has(key)) throw new Error('정답 연결 중복'); expectedKeys.add(key);
  }
  const missing = [], mismatch = []; let matched = 0;
  for (const e of expected.edges) {
    const found = actual.filter(a => a.kind === e.kind && matches(ids.get(a.from), e.from) && matches(ids.get(a.to), e.to));
    if (!found.length) missing.push(e);
    else if (found.some(a => a.status !== e.status)) mismatch.push({ expected: e, actual_statuses: [...new Set(found.map(a => a.status))] });
    else matched++;
  }
  const extras = new Map();
  for (const a of actual) {
    if (expected.edges.some(e => a.kind === e.kind && matches(ids.get(a.from), e.from) && matches(ids.get(a.to), e.to))) continue;
    const descriptor = { from: { name: ids.get(a.from).name }, to: { name: ids.get(a.to).name }, kind: a.kind, status: a.status, evidence: a.evidence };
    extras.set(edgeKey(descriptor), descriptor);
  }
  return { case_id: expected.case_id, status: draft ? 'DRAFT_PREVIEW' : missing.length || extras.size || mismatch.length ? 'FAIL' : 'PASS', scoring: !draft, scope: expected.scope, expected_edges: expected.edges.length, matched, false_negatives: missing, false_positives: [...extras.values()], status_mismatches: mismatch, source_dirty: index.meta.source_dirty, caveat: '선언한 source/kind/위치 범위의 연결 비교. 동일 이름 DB 변형은 논리 연결로 묶으며 분기·값 전파·전체 프로젝트 정확도가 아님.' };
}
