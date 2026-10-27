import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Graph, EDGE_KINDS, validateIndex } from '../lib/indexer/graph.mjs';
import { evalIndex } from '../lib/indexer/eval.mjs';
import { validateExpected, assertParity } from '../lib/indexer/expected.mjs';

function fixture() {
  const g = new Graph(), at = { file: 'fixture.html', line: 1 };
  const controller = g.add('method', 'C#run', at), service = g.add('method', 'S#run', at);
  const page = g.add('template', 'page.html', at), layout = g.add('template', 'layout.html', at);
  const fragment = g.add('fragment', 'common.html#menu', at), button = g.add('template', 'page.html#load', at);
  const endpoint = g.add('endpoint', 'GET /codes?page=1', at);
  g.edge(controller, service, 'calls', [at]);
  g.edge(controller, page, 'renders', [at]);
  g.edge(page, layout, 'decorates', [at]);
  g.edge(layout, fragment, 'includes', [at]);
  g.edge(button, endpoint, 'requests', [at]);
  const edge = (from, to, kind, group) => ({ from: { name: from }, to: { name: to }, kind, group, status: 'CONFIRMED', evidence: [at] });
  const expected = { schema_version: '1.0', case_id: 'groups', review_status: 'approved', source_revision: null, score_groups: ['parity', 'screen'],
    scope: [
      { from: { name: 'C#run' }, kinds: ['calls'], group: 'parity' },
      { from: { name: 'C#run' }, kinds: ['renders'], group: 'screen' },
      { from: { name: 'page.html' }, kinds: ['decorates'], group: 'screen' },
      { from: { name: 'layout.html' }, kinds: ['includes'], group: 'screen' },
      { from: { name: 'page.html#load' }, kinds: ['requests'], group: 'screen' }
    ], edges: [edge('C#run', 'S#run', 'calls', 'parity'), edge('C#run', 'page.html', 'renders', 'screen'),
      edge('page.html', 'layout.html', 'decorates', 'screen'), edge('layout.html', 'common.html#menu', 'includes', 'screen'),
      edge('page.html#load', 'GET /codes', 'requests', 'screen')] };
  const index = { meta: { indexer_version: '0.1.0', processed_files: 1, duration_ms: 1, source_revision: null }, nodes: g.nodes, edges: g.edges, unresolved: [], skipped: [] };
  return { index, expected, controller, page, endpoint };
}

test('두 그룹을 따로 채점하고 합산 필드를 제공하지 않는다', () => {
  const { index, expected } = fixture(), result = evalIndex(index, expected);
  assert.equal(result.status, 'PASS');
  assert.equal(result.groups.parity.matched, 1); assert.equal(result.groups.parity.expected_edges, 1);
  assert.equal(result.groups.screen.matched, 4); assert.equal(result.groups.screen.expected_edges, 4);
  for (const key of ['expected_edges', 'matched', 'false_negatives', 'false_positives', 'status_mismatches']) assert.ok(!(key in result));
  const preview = evalIndex(index, { ...expected, review_status: 'draft' }, { draft: true });
  assert.equal(preview.status, 'DRAFT_PREVIEW'); assert.equal(preview.scoring, false);
});

test('screen 누락·과탐·상태 오류가 parity 점수에 섞이지 않는다', () => {
  for (const kind of ['renders', 'decorates', 'includes', 'requests']) {
    const { index, expected } = fixture();
    index.edges = index.edges.filter(e => e.kind !== kind);
    const result = evalIndex(index, expected);
    assert.equal(result.status, 'FAIL'); assert.equal(result.groups.parity.status, 'PASS');
    assert.equal(result.groups.screen.false_negatives.length, 1);
  }
  const { index, expected, controller } = fixture();
  const rendered = index.edges.find(e => e.kind === 'renders'); rendered.to = controller.id;
  let result = evalIndex(index, expected);
  assert.equal(result.groups.screen.false_positives.length, 1); assert.equal(result.groups.screen.false_negatives.length, 1);
  rendered.to = index.nodes.find(n => n.name === 'page.html').id; rendered.status = 'LIKELY'; rendered.reason = 'ambiguous resolver';
  result = evalIndex(index, expected);
  assert.equal(result.groups.screen.status_mismatches.length, 1); assert.equal(result.groups.parity.status, 'PASS');
});

test('requests만 쿼리 없는 경로와 메서드로 비교하고 다른 경로·메서드는 실패한다', () => {
  const { index, expected, endpoint, page } = fixture();
  endpoint.name = 'GET /codes?page=2&sort=name'; assert.equal(evalIndex(index, expected).status, 'PASS');
  for (const name of ['GET /other?page=1', 'POST /codes?page=1']) {
    endpoint.name = name; const r = evalIndex(index, expected);
    assert.equal(r.groups.screen.false_negatives.length, 1); assert.equal(r.groups.screen.false_positives.length, 1);
  }
  endpoint.name = 'GET /codes'; page.name = 'page.html?other';
  assert.ok(evalIndex(index, expected).groups.screen.false_negatives.length > 0);
});

test('그룹 누락·겹친 scope·중복·허용하지 않은 종류와 parity 변형을 거부한다', () => {
  const { expected } = fixture();
  const reference = { edges: [{ from: { name: 'C#run' }, to: { name: 'S#run' }, kind: 'calls', status: 'CONFIRMED' }] };
  assert.equal(assertParity(expected, reference), 1);
  const altered = structuredClone(expected); altered.edges[0].status = 'LIKELY'; altered.edges[0].reason = 'changed';
  assert.throws(() => assertParity(altered, reference), /JSP/);
  for (const change of [e => delete e.edges[0].group, e => e.edges[0].kind = 'unknown', e => e.scope.push({ from: { name: 'C#run' }, kinds: ['calls'], group: 'screen' }), e => e.edges.push({ ...e.edges.at(-1), to: { name: 'GET /codes?page=4' } })]) {
    const e = structuredClone(expected); change(e); assert.throws(() => validateExpected(e));
  }
});

test('공존 전용 사례의 parity 0건을 적용 대상 없음으로 표시한다', () => {
  const { index, expected } = fixture();
  expected.edges = expected.edges.filter(e => e.kind === 'renders'); expected.scope = expected.scope.filter(s => s.kinds.includes('renders'));
  const result = evalIndex(index, expected);
  assert.equal(result.groups.parity.applicable, false); assert.equal(result.groups.parity.expected_edges, 0);
  assert.equal(result.groups.screen.matched, 1);
});

test('스키마·실제 그래프·정답 검증기가 같은 연결 종류를 사용한다', async () => {
  const schema = JSON.parse(await readFile(new URL('../schemas/index.schema.json', import.meta.url)));
  assert.deepEqual(schema.$defs.edge.properties.kind.enum, EDGE_KINDS);
  const expectedSchema = JSON.parse(await readFile(new URL('../schemas/expected.schema.json', import.meta.url)));
  assert.deepEqual(expectedSchema.$defs.kind.enum, EDGE_KINDS);
  const { index } = fixture(); validateIndex(index);
  index.edges[0].kind = 'unknown'; assert.throws(() => validateIndex(index), /계약/);
});
