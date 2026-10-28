import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile, stat} from 'node:fs/promises';
import {json, digest, save} from '../lib/trace/io.mjs';
import {validateManifest} from '../lib/manifest/index.mjs';

const root = process.argv[2];
assert.ok(root, '사용법: check-integration.mjs <통합 run> [검증 JSON]');
const registry = await json(path.join(root, 'registry.json'));
const seen = new Set(), runs = [];
for (const run of registry.runs) {
  const manifest = await json(path.join(run.path, 'manifest.json'));
  assert.deepEqual(validateManifest(manifest), []);
  assert.equal(manifest.request_id, registry.request_id);
  assert.ok(manifest.requirement_ids.includes(registry.request_id));
  for (const parent of manifest.parent_run_ids) assert.ok(seen.has(parent), '선행 run이 존재해야 합니다');
  for (const item of manifest.evidence) await stat(path.join(run.path, item.path));
  seen.add(manifest.run_id);
  runs.push({run_id: manifest.run_id, status: manifest.status, parent_run_ids: manifest.parent_run_ids});
}
assert.equal(runs.length, 8);
const locate = id => registry.runs.find(r => r.run_id === id).path;
const units = [];
for (const phase of ['red', 'green']) {
  const result = await json(path.join(locate(`req001-unit-${phase}`), 'test-results.json'));
  units.push({phase, status: result.status, summary: result.summary});
}
assert.equal(units[0].status, 'FAIL');
assert.equal(units[1].status, 'PASS');
assert.equal(units[0].summary.total, units[1].summary.total);
const rounds = [];
let firstCases;
for (const round of [1, 2]) {
  const dir = locate(`req001-tc-${round}`), cases = await readFile(path.join(dir, 'cases.json'));
  if (round === 1) firstCases = cases; else assert.deepEqual(cases, firstCases);
  const result = await json(path.join(dir, 'results-chrome.json'));
  const edge = await json(path.join(dir, 'results-msedge.json'));
  const verification = await json(path.join(dir, 'functional-results.xlsx.verification.json'));
  assert.equal(verification.preserved, true);
  assert.equal(verification.template_unchanged, true);
  assert.equal(verification.server_values_verified, true);
  if (round === 2) {
    assert.equal(verification.first_columns_preserved, true);
    assert.equal(verification.source_sha256, digest(await readFile(path.join(locate('req001-tc-1'), 'functional-results.xlsx'))));
  }
  for (const file of ['evidence/db/application.mv.db', 'evidence/db/snapshot.sql']) await stat(path.join(dir, file));
  const author = result.records.find(r => r.case_id === 'REQ001-AUTHOR');
  const edgeAuthor = edge.records.find(r => r.case_id === 'REQ001-AUTHOR');
  assert.equal(author.status, round === 1 ? 'FAIL' : 'PASS');
  assert.equal(edgeAuthor.status, author.status);
  rounds.push({round, cases: result.records.length, author: author.status, edge_author: edgeAuthor.status,
    counts: result.records.reduce((a, r) => (a[r.status] = (a[r.status] ?? 0) + 1, a), {}),
    workbook_sha256: digest(await readFile(path.join(dir, 'functional-results.xlsx'))),
    first_columns_preserved: round === 2 ? verification.first_columns_preserved : null});
}
const verification = {request_id: registry.request_id, status: 'PASS',
  scope: '보존 산출물의 스키마·연결·수정 전후 결과·양식 검증·DB 파일 존재 대조; 앱 재실행 아님',
  manifests: runs, units, tc: rounds, same_cases: true};
if (process.argv[3]) await save(process.argv[3], verification);
console.log(JSON.stringify({status: verification.status, manifests: runs.length, units, tc: rounds.map(({workbook_sha256: _, ...r}) => r)}));
