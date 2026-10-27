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
  await save(path.join(dir, 'evidence/stage.json'), { tool_fingerprint: 'fixture-version' });
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
