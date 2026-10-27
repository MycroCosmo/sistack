import test from 'node:test';
import assert from 'node:assert/strict';
import { Graph } from '../lib/indexer/graph.mjs';
import { evalIndex } from '../lib/indexer/eval.mjs';

function scenario() {
  const graph = new Graph(), at = { file: 'fixture.java', line: 1 };
  const a = graph.add('method', 'C#run', at), b = graph.add('method', 'S#run', at), c = graph.add('method', 'Wrong#run', at);
  graph.edge(a, b, 'calls', [at]);
  return { index: { meta: { indexer_version: '0.1.0', processed_files: 1, duration_ms: 1, source_revision: null }, nodes: graph.nodes, edges: graph.edges, unresolved: [], skipped: [] }, expected: { schema_version: '1.0', case_id: 'synthetic', review_status: 'draft', source_revision: null, scope: [{ from: { name: 'C#run' }, kinds: ['calls'] }], edges: [{ from: { name: 'C#run' }, to: { name: 'S#run' }, kind: 'calls', status: 'CONFIRMED', evidence: [at] }] }, a, b, c, graph };
}
test('초안을 정식 채점하지 않고 명시적 미리보기만 허용', () => { const s = scenario(); assert.throws(() => evalIndex(s.index, s.expected), /승인/); const r = evalIndex(s.index, s.expected, { draft: true }); assert.equal(r.status, 'DRAFT_PREVIEW'); assert.equal(r.scoring, false); assert.equal(r.matched, 1); });
test('연결을 잘못된 대상으로 바꾸면 누락과 과탐을 각각 검출', () => { const s = scenario(); s.index.edges[0].to = s.c.id; const r = evalIndex(s.index, s.expected, { draft: true }); assert.equal(r.false_negatives.length, 1); assert.equal(r.false_positives.length, 1); });
test('상태 불일치는 연결 누락과 구분', () => { const s = scenario(); s.index.edges[0].status = 'LIKELY'; s.index.edges[0].reason = 'synthetic ambiguity'; const r = evalIndex(s.index, s.expected, { draft: true }); assert.equal(r.status_mismatches.length, 1); assert.equal(r.false_negatives.length, 0); });
test('범위 밖 연결을 과탐으로 세지 않고 비교 revision을 강제', () => { const s = scenario(); s.graph.edge(s.b, s.c, 'calls', [{ file: 'fixture.java', line: 2 }]); const r = evalIndex(s.index, s.expected, { draft: true }); assert.equal(r.false_positives.length, 0); s.expected.source_revision = 'different'; assert.throws(() => evalIndex(s.index, s.expected, { draft: true }), /source_revision/); });
test('커밋이 달라도 모든 근거 파일 해시가 같을 때만 비교하고 차이를 표시', () => {
  const s = scenario(); s.expected.source_revision = 'earlier'; s.expected.source_files = { 'fixture.java': 'same-hash' }; s.index.meta.source_files = { 'fixture.java': 'same-hash' };
  assert.equal(evalIndex(s.index, s.expected, { draft: true }).revision_changed_sources_match, true);
  s.index.meta.source_files['fixture.java'] = 'changed'; assert.throws(() => evalIndex(s.index, s.expected, { draft: true }), /다릅니다/);
});
