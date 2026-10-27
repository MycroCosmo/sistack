import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, cp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { parseTrace } from '../lib/debug/parse.mjs';
import { prepareDebug, finishDebug, debugFingerprint } from '../lib/debug/index.mjs';
import { digest, json, save } from '../lib/trace/io.mjs';
import { validateManifest } from '../lib/manifest/index.mjs';
import { prepareCase, scoreDebug } from '../scripts/eval-debug.mjs';
import { root } from '../scripts/common.mjs';

async function temp(t) { const dir = await mkdtemp(path.join(os.tmpdir(), 'si-debug-test-')); t.after(() => rm(dir, { recursive: true, force: true })); return dir; }
async function fixture(t) {
  const project = await temp(t);
  await mkdir(path.join(project, 'src/app'), { recursive: true });
  await writeFile(path.join(project, 'src/app/C.java'), 'package app;\n@Controller\nclass C {\n@GetMapping("/x")\npublic String go() { return "x"; }\n}\n');
  const prep = await prepareDebug(project, { log: 'java.lang.IllegalStateException: phone=010-0000-0000\n\tat app.C.go(C.java:5)', packagePrefix: 'app', runId: 'run' });
  return { project, dir: prep.directory };
}
function review() { return { source_reviewed: true, symptom: 'GET /x 오류 phone=010-0000-0000', candidates: [{ cause: '확인한 조건 불일치', status: 'CONFIRMED', level: 2, locations: [{ file: 'src/app/C.java', line: 5 }], reason: '요청 분기와 반환 값을 직접 확인' }], eliminated: ['오류 전에 URL 매핑 도달 확인'], reproduction: { executed: false, note: 'WAS 미실행' }, proposal: { diff: '', note: '호출 조건 확인 후 제안' }, same_pattern: ['src/app 확인'], verification: ['GET /x 확인'], unverified: ['런타임 미확인'], next_actions: ['로컬 재현'] }; }

test('parser: causes, suppressed branches, modules and unknown/native frames remain distinguishable', () => {
  const parsed = parseTrace('java.lang.IllegalStateException: wrapper\n\tat java.base/java.lang.Thread.run(Thread.java:840)\n\tSuppressed: java.io.IOException: close\n\t\tat app.IO.close(Native Method)\nCaused by: app.BusinessException: inner\n\tat app.C.go(C.java:5)\n\tat app.Other.run(Unknown Source)\n\t... 2 more', { packagePrefix: 'app' });
  assert.deepEqual(parsed.exceptions.map(e => [e.relation, e.parent]), [['root', null], ['suppressed', 0], ['cause', 0]]);
  assert.equal(parsed.exceptions[2].elided_frames, 2);
  assert.equal(parsed.project_frames.length, 3);
  assert.equal(parsed.frames[0].class, 'java.lang.Thread');
  assert.equal(parsed.project_frames[0].line, null);
  assert.equal(parsed.project_frames[1].line, 5);
  assert.equal(parseTrace('total=11 pageSize=10').exceptions.length, 0);
  assert.equal(parseTrace('ORA-00904').database_codes[0], 'ORA-00904');
});

test('prepare and finish persist masked evidence, source candidates and valid manifest without modifying source', async t => {
  const { project, dir } = await fixture(t), file = path.join(project, 'src/app/C.java'), before = await readFile(file);
  const parsed = await json(path.join(dir, 'evidence/parsed.json'));
  assert.deepEqual(parsed.mapped_frames[0].candidates, [{ file: 'src/app/C.java', line: 5 }]);
  assert.equal(parsed.mapped_frames[0].status, 'UNRESOLVED');
  await save(path.join(dir, 'evidence/diagnosis.json'), review());
  assert.equal((await finishDebug(project, 'run')).status, 'PASS');
  assert.deepEqual(validateManifest(await json(path.join(dir, 'manifest.json'))), []);
  assert.ok(!(await readFile(path.join(dir, 'report.md'), 'utf8')).includes('010-0000-0000'));
  assert.ok(!(await readFile(path.join(dir, 'evidence/diagnosis.json'), 'utf8')).includes('010-0000-0000'));
  assert.deepEqual(await readFile(file), before);
  await assert.rejects(finishDebug(project, 'run'));
  await assert.rejects(prepareDebug(project, { symptom: 'x', runId: 'run' }));
});

test('finish rejects nonexistent locations, changed sources and fabricated execution levels', async t => {
  const { project, dir } = await fixture(t), file = path.join(dir, 'evidence/diagnosis.json');
  const data = review(); data.candidates[0].level = 4;
  await save(file, data); await assert.rejects(finishDebug(project, 'run'), /실행 없이/);
  data.candidates[0].level = 2; data.candidates[0].locations[0].line = 500;
  await save(file, data, { exclusive: false }); await assert.rejects(finishDebug(project, 'run'), /라인/);
  data.candidates[0].locations[0].line = 5;
  data.candidates.push({ ...data.candidates[0], status: 'LIKELY' });
  await save(file, data, { exclusive: false }); await assert.rejects(finishDebug(project, 'run'), /미소거/);
  data.candidates.pop(); await save(file, data, { exclusive: false });
  await writeFile(path.join(project, 'src/app/C.java'), 'changed'); await assert.rejects(finishDebug(project, 'run'), /변경/);
});

test('Oracle log-only remains unresolved and needs external evidence', async t => {
  const { project, dir } = await fixture(t), data = review();
  data.candidates[0].status = 'UNRESOLVED'; data.candidates[0].cause = 'ORA-00904: schema/alias 후보';
  data.next_actions = ['사용자에게 실행 SQL 및 컬럼 메타데이터 요청'];
  await save(path.join(dir, 'evidence/diagnosis.json'), data);
  assert.equal((await finishDebug(project, 'run')).status, 'PARTIAL');
  const report = await readFile(path.join(dir, 'report.md'), 'utf8'); assert.match(report, /미재현/); assert.match(report, /메타데이터/);
});

test('standalone skill CLI runs with only copied skill files', async t => {
  const dir = await temp(t), isolated = path.join(dir, 'skill');
  await cp(path.join(root, 'skills/si-debug'), isolated, { recursive: true });
  const log = path.join(dir, 'input.txt'); await writeFile(log, 'java.lang.Exception: JSESSIONID=opaque');
  const child = spawnSync(process.execPath, [path.join(isolated, 'scripts/parse-trace.mjs'), log], { encoding: 'utf8', windowsHide: true });
  assert.equal(child.status, 0); assert.ok(!child.stdout.includes('opaque')); assert.equal(JSON.parse(child.stdout).exceptions.length, 1);
  const p = spawnSync(process.execPath, [path.join(isolated, 'scripts/debug.mjs'), 'prepare', dir, '--log', log, '--run-id', 'isolated'], { encoding: 'utf8', windowsHide: true });
  assert.equal(p.status, 0, p.stderr); assert.equal(JSON.parse(p.stdout).status, 'PARTIAL');
});

test('all ten training patches apply only to isolated copies and draft source locations stay fresh', async t => {
  const ids = ['01-binding', '02-js-url', '03-request-encoding', '04-session-bypass', '05-paging', '06-sort-sql', '07-oracle-log-only', '08-thymeleaf-utilities', '09-view-resolver', '10-fragment-encoding'];
  for (const id of ids) {
    const prepared = await prepareCase(id); t.after(() => rm(prepared.project, { recursive: true, force: true }));
    assert.ok(prepared.project.startsWith(path.join(os.tmpdir(), 'sistack-debug-')));
    const expected = await json(path.join(root, 'evals/debug/cases', id, 'expected.draft.json'));
    for (const [file, sha] of Object.entries(expected.source_files)) assert.equal(digest(await readFile(path.join(prepared.project, file))), sha, `${id}: ${file}`);
    for (const p of expected.locations) assert.ok(p.line <= (await readFile(path.join(prepared.project, p.file), 'utf8')).split('\n').length);
  }
});

test('eval rejects draft answers and keeps held-out first score immutable without exporting content', async t => {
  const privateRoot = await temp(t), repository = await temp(t), marker = path.join(repository, 'marker'); await writeFile(marker, 'frozen');
  const frozen = path.join(repository, 'freeze.json');
  await save(frozen, { created_at: '2020-01-01T00:00:00.000Z', revision: 'test', tool_fingerprint: await debugFingerprint(), files: { marker: digest('frozen') } });
  const project = path.join(privateRoot, 'synthetic/project'); await mkdir(project, { recursive: true });
  await writeFile(path.join(project, 'C.java'), 'class C {}\n');
  const prep = await prepareDebug(project, { symptom: 'private synthetic sentinel', runId: 'first' });
  const data = review(); data.candidates[0].locations = [{ file: 'C.java', line: 1 }];
  await save(path.join(prep.directory, 'evidence/diagnosis.json'), data); await finishDebug(project, 'first');
  const expectedFile = path.join(privateRoot, 'synthetic/expected.json');
  const expected = { case_id: 'synthetic', dataset: 'held-out', review_status: 'draft', approved_by: null, locations: [{ file: 'C.java', line: 1, enclosing: { kind: 'java-type', name: 'C' } }], status: 'CONFIRMED', source_files: { 'C.java': digest('class C {}\n') } };
  await save(expectedFile, expected);
  const options = { dataset: 'held-out', output: path.join(privateRoot, 'synthetic/score.json'), freeze: frozen, repository, privateRoot };
  await assert.rejects(scoreDebug(prep.directory, expectedFile, options), /승인/);
  expected.review_status = 'approved'; expected.approved_by = 'synthetic test fixture'; await save(expectedFile, expected, { exclusive: false });
  const score = await scoreDebug(prep.directory, expectedFile, options);
  assert.deepEqual(score, { locations: [{ file: 'C.java', line: 1, hit: true }], hit: true });
  assert.ok(!(await readFile(options.output, 'utf8')).includes('sentinel'));
  const baseline = await readFile(path.join(privateRoot, 'synthetic/first-run.json'));
  await assert.rejects(scoreDebug(prep.directory, expectedFile, { ...options, output: path.join(privateRoot, 'synthetic/second.json') }), /이미 보존/);
  assert.deepEqual(await readFile(path.join(privateRoot, 'synthetic/first-run.json')), baseline);
  expected.case_id = 'synthetic-miss'; expected.status = 'LIKELY'; await save(expectedFile, expected, { exclusive: false });
  const miss = await scoreDebug(prep.directory, expectedFile, { ...options, output: path.join(privateRoot, 'synthetic/miss.json') });
  assert.equal(miss.hit, false); assert.equal(miss.locations[0].hit, false);
  await assert.rejects(scoreDebug(prep.directory, expectedFile, { ...options, output: path.join(repository, 'leak.json') }), /범위/);
  await writeFile(marker, 'changed'); await assert.rejects(scoreDebug(prep.directory, expectedFile, options), /변경/);
});
