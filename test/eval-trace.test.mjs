import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { Graph } from '../lib/indexer/graph.mjs';
import { hiddenCategories } from '../lib/trace/index.mjs';
import { save, digest, json } from '../lib/trace/io.mjs';
import { evalTrace } from '../scripts/eval-trace.mjs';
import { root } from '../scripts/common.mjs';

async function fixture(t) {
  const base = path.join(root, '.sistack'); await mkdir(base, { recursive: true });
  const dir = await mkdtemp(path.join(base, 'eval-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const source = 'class C { void run() { S.run(); } }\nclass S { static void run() {} }\n';
  await writeFile(path.join(dir, 'fixture.java'), source);
  const at = { file: 'fixture.java', line: 1 }, g = new Graph();
  const a = g.add('method', 'C#run', at), b = g.add('method', 'S#run', { ...at, line: 2 });
  g.edge(a, b, 'calls', [at]);
  const hashes = { 'fixture.java': digest(source) };
  const trace = { meta: { indexer_version: '0.1.0', processed_files: 1, duration_ms: 1, source_revision: null, source_files: hashes }, nodes: g.nodes, edges: g.edges, unresolved: [], skipped: [] };
  const expected = { schema_version: '1.0', case_id: 'synthetic', review_status: 'approved', source_revision: null, source_root: path.relative(root, dir).replaceAll('\\', '/'), source_files: hashes, scope: [{ from: { name: 'C#run' }, kinds: ['calls'] }], edges: [{ from: { name: 'C#run' }, to: { name: 'S#run' }, kind: 'calls', status: 'CONFIRMED', evidence: [at] }] };
  const manifest = { schema_version: '1.0.0', run_id: 'fixture', skill: 'si-trace', created_at: new Date().toISOString(), source_revision: null, status: 'PASS', inputs: {}, evidence: [{ path: 'evidence/trace.json', level: 2, description: '합성 fixture 검토' }], unverified: ['Git 없는 합성 fixture'], next_actions: ['없음'] };
  await save(path.join(dir, 'manifest.json'), manifest);
  await save(path.join(dir, 'evidence/trace.json'), trace);
  await save(path.join(dir, 'evidence/review.json'), { source_reviewed: true, hidden_paths: hiddenCategories });
  await save(path.join(dir, 'evidence/stage.json'), { tool_fingerprint: 'f5ba71140b5275fb235f7686563039ec03b6cfe453bae4327f936487ff1256c1' });
  await save(path.join(dir, 'report.md'), '> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.\n\n## 함정\n\n합성 fixture');
  const expectedFile = path.join(dir, 'expected.json'), registry = path.join(dir, 'sets.json');
  await save(expectedFile, expected); await save(registry, { training: ['synthetic'], 'held-out': [] });
  return { dir, expected, expectedFile, registry, trace };
}

test('스킬 eval은 세트를 분리하고 원본·점수를 보존하며 첫 결과를 덮어쓰지 않는다', async t => {
  const s = await fixture(t), output = path.join(s.dir, 'first.json');
  const options = { dataset: 'training', output, registry: s.registry };
  await assert.rejects(evalTrace(s.dir, s.expectedFile, { ...options, dataset: 'held-out' }), /세트/);
  const result = await evalTrace(s.dir, s.expectedFile, options);
  assert.equal(result.matched, 1); assert.equal(result.status, 'PASS');
  const before = await readFile(output);
  const record = await json(output);
  assert.equal(record.dataset, 'training'); assert.deepEqual(record.raw.trace, s.trace);
  assert.equal(record.tool_fingerprint, 'f5ba71140b5275fb235f7686563039ec03b6cfe453bae4327f936487ff1256c1');
  assert.equal(record.expected_sha256, digest(await readFile(s.expectedFile)));
  assert.equal(record.report_sha256, digest(await readFile(path.join(s.dir, 'report.md'))));
  await assert.rejects(evalTrace(s.dir, s.expectedFile, options), /EEXIST/);
  assert.deepEqual(await readFile(output), before);
  s.trace.edges = [];
  await save(path.join(s.dir, 'evidence/trace.json'), s.trace, { exclusive: false });
  const after = await evalTrace(s.dir, s.expectedFile, { ...options, output: path.join(s.dir, 'next.json') });
  assert.equal(after.status, 'FAIL'); assert.equal(after.false_negatives, 1);
  assert.deepEqual(await readFile(output), before);
});

test('스킬 eval은 등록된 held-out이어도 미승인 초안과 낡은 소스를 채점하지 않는다', async t => {
  const s = await fixture(t), options = { dataset: 'held-out', output: path.join(s.dir, 'first.json'), registry: s.registry };
  await save(s.registry, { training: [], 'held-out': ['synthetic'] }, { exclusive: false });
  await save(s.expectedFile, { ...s.expected, review_status: 'draft' }, { exclusive: false });
  await assert.rejects(evalTrace(s.dir, s.expectedFile, options), /승인/);
  await save(s.expectedFile, s.expected, { exclusive: false });
  await writeFile(path.join(s.dir, 'fixture.java'), 'changed');
  await assert.rejects(evalTrace(s.dir, s.expectedFile, options), /해시/);
});

test('스킬 eval 출력과 저장 결과는 그룹별 점수만 내고 JSP parity 변형을 차단한다', async t => {
  const s = await fixture(t), reference = path.join(s.dir, 'reference.json');
  await save(reference, s.expected);
  s.expected.score_groups = ['parity', 'screen'];
  s.expected.parity_reference = { file: path.relative(root, reference).replaceAll('\\', '/'), expected_sha256: digest(await readFile(reference)) };
  s.expected.edges[0].group = 'parity'; s.expected.scope[0].group = 'parity';
  s.expected.edges.push({ from: { name: 'C#run' }, to: { name: 'page.html' }, kind: 'renders', group: 'screen', status: 'CONFIRMED', evidence: [{ file: 'fixture.java', line: 1 }] });
  s.expected.scope.push({ from: { name: 'C#run' }, kinds: ['renders'], group: 'screen' });
  s.trace.nodes.push({ id: 'page', name: 'page.html', kind: 'template', file: 'fixture.java', line: 1 });
  s.trace.edges.push({ from: s.trace.nodes[0].id, to: 'page', kind: 'renders', status: 'CONFIRMED', evidence: [{ file: 'fixture.java', line: 1 }] });
  await save(s.expectedFile, s.expected, { exclusive: false });
  await save(path.join(s.dir, 'evidence/trace.json'), s.trace, { exclusive: false });
  const options = { dataset: 'training', output: path.join(s.dir, 'grouped.json'), registry: s.registry };
  const result = await evalTrace(s.dir, s.expectedFile, options), record = await json(options.output);
  assert.equal(result.groups.parity.matched, 1); assert.equal(result.groups.screen.matched, 1);
  assert.ok(!('matched' in result)); assert.ok(!('expected' in result)); assert.ok(!('expected_edges' in record.score));
  assert.equal(record.score.groups.screen.matched, 1);
  const groupedExpected = structuredClone(s.expected);
  s.expected.edges = s.expected.edges.filter(e => e.group !== 'parity');
  s.expected.scope = s.expected.scope.filter(s => s.group !== 'parity');
  await save(s.expectedFile, s.expected, { exclusive: false });
  await assert.rejects(evalTrace(s.dir, s.expectedFile, { ...options, output: path.join(s.dir, 'missing-parity.json') }), /parity.*JSP/);
  s.expected = groupedExpected;
  s.expected.edges[0].to.name = 'Changed#run';
  await save(s.expectedFile, s.expected, { exclusive: false });
  await assert.rejects(evalTrace(s.dir, s.expectedFile, { ...options, output: path.join(s.dir, 'invalid.json') }), /parity.*JSP/);
});
