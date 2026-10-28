import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, cp, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { inspectPom, detectEnvironment } from '../lib/unit/env.mjs';
import { parseSurefire, summarize, validateTestResults } from '../lib/unit/results.mjs';
import { runTests } from '../lib/unit/run.mjs';
import { save, json } from '../lib/trace/io.mjs';
import { detection, applyUnitPatch, runBlindUnit } from '../scripts/eval-unit-test.mjs';
import { root } from '../scripts/common.mjs';

const plan = { 'OrderTest#등록': { display_name: '주문 등록 결과를 전달한다', target_class: 'Order', target_method: 'create' } };
const xml = (outcome = '', attrs = '') => `<testsuite tests="1" failures="${outcome.startsWith('<failure') ? 1 : 0}" errors="0" skipped="${outcome.startsWith('<skipped') ? 1 : 0}"><testcase classname="OrderTest" name="등록" time="0.012" ${attrs}>${outcome}</testcase></testsuite>`;
async function temp(t) { const p = await mkdtemp(path.join(os.tmpdir(), 'unit-skill-')); t.after(() => rm(p, { recursive: true, force: true })); return p; }

test('두 실제 POM의 Java target과 test 의존성을 읽고 미지원 환경은 보류한다', async () => {
  for (const p of ['legacy-board', 'legacy-board-thymeleaf']) {
    const detected = await detectEnvironment(`examples/${p}`);
    assert.equal(detected.status, 'PASS'); assert.equal(detected.java_target, '8');
    assert.equal(detected.libraries.junit, '4.13.2'); assert.equal(detected.libraries.mockito, '4.11.0');
  }
  const pom = await readFile('examples/legacy-board/pom.xml', 'utf8');
  assert.equal(inspectPom(pom.replace('<scope>test</scope>', '<scope>compile</scope>')).status, 'BLOCKED');
  assert.equal(inspectPom(pom.replace('<version>4.13.2</version>', '<version>5.0.0</version>')).status, 'BLOCKED');
  assert.equal(inspectPom(pom.replace('</project>', '<profiles/></project>')).status, 'BLOCKED');
});

test('Surefire 실제 상태·시간·한국어 표시 이름을 변환하고 비밀값을 마스킹한다', () => {
  const pass = parseSurefire(xml(), plan, 'suite.xml')[0];
  assert.equal(pass.status, 'PASS'); assert.equal(pass.duration_ms, 12); assert.equal(pass.display_name, plan['OrderTest#등록'].display_name);
  const failure = parseSurefire(xml('<failure message="secret=fixture">nobody@example.invalid</failure>'), plan, 'suite.xml')[0];
  assert.equal(failure.status, 'FAIL'); assert.ok(!failure.failure_message.includes('fixture'));
  assert.equal(parseSurefire(xml('<skipped/>'), plan, 'suite.xml')[0].status, 'SKIP');
  for (const bad of [xml().replace('tests="1"', 'tests="2"'), '<testsuite>', '<!DOCTYPE testsuite>' + xml(), xml().replace('time="0.012"', 'time="NaN"')]) assert.throws(() => parseSurefire(bad, plan, 'suite.xml'));
  assert.throws(() => parseSurefire(xml(), {}, 'suite.xml'), /계획/);
});

test('M5 결과 계약은 집계 위조·빈 성공·중복·영문 표시 이름을 거부한다', () => {
  const tests = parseSurefire(xml(), plan, 'suite.xml');
  const result = { schema_version: '1.0.0', run_id: 'sample', created_at: new Date().toISOString(), source_revision: null,
    status: 'PASS', execution_status: 'SUCCESS', environment: { java_runtime: '17', java_target: '8', build_tool: 'Maven', junit: '4', mockito: '4', spring_test: '5', h2: '2' },
    summary: summarize(tests), tests, unverified: [] };
  assert.deepEqual(validateTestResults(result), []);
  assert.ok(validateTestResults({ ...result, summary: { ...result.summary, passed: 99 } }).length);
  assert.ok(validateTestResults({ ...result, tests: [], summary: summarize([]) }).length);
  assert.ok(validateTestResults({ ...result, tests: [...tests, ...tests], summary: summarize([...tests, ...tests]) }).length);
  assert.ok(validateTestResults({ ...result, tests: [{ ...tests[0], display_name: 'English only' }] }).length);
});

test('실행 승인·fresh run을 강제하고 과거 XML로 환경 BLOCKED를 PASS로 바꾸지 않는다', async t => {
  const p = await temp(t);
  await cp('examples/legacy-board/pom.xml', path.join(p, 'pom.xml'));
  await save(path.join(p, 'plan.json'), plan);
  await save(path.join(p, 'target/surefire-reports/TEST-old.xml'), xml());
  const config = { run_id: 'blocked', test_pattern: 'OrderTest', java_home: path.join(p, 'missing-jdk'), maven: path.join(p, 'missing-maven'), plan_file: path.join(p, 'plan.json') };
  await assert.rejects(runTests(p, config), /승인/);
  const r = await runTests(p, { ...config, allow_test_execution: true });
  assert.equal(r.result.status, 'BLOCKED'); assert.equal(r.result.summary.total, 0);
  assert.equal((await json(path.join(r.run, 'manifest.json'))).status, 'BLOCKED');
  await assert.rejects(runTests(p, { ...config, allow_test_execution: true }), { code: 'EEXIST' });
});

test('si-unit-test 단독 복사본에서 환경 탐지와 M5 변환을 실행한다', async t => {
  const p = await temp(t); await cp('skills/si-unit-test', path.join(p, 'skill'), { recursive: true });
  const env = await import(pathToFileURL(path.join(p, 'skill/scripts/lib/unit/env.mjs')));
  const results = await import(pathToFileURL(path.join(p, 'skill/scripts/lib/unit/results.mjs')));
  assert.equal((await env.detectEnvironment(path.resolve('examples/legacy-board'))).status, 'PASS');
  assert.equal(results.parseSurefire(xml(), plan, 'suite.xml')[0].status, 'PASS');
});

test('평가기는 테스트 실패만 탐지로 세고 빌드 오류·테스트 누락은 BLOCKED로 둔다', () => {
  const tests = parseSurefire(xml(), plan, 'suite.xml');
  const baseline = { status: 'PASS', tests };
  const fail = { status: 'FAIL', execution_status: 'TEST_FAILURE', tests: [{ ...tests[0], status: 'ERROR' }] };
  assert.equal(detection(baseline, fail), 'DETECTED');
  assert.equal(detection(baseline, { ...fail, execution_status: 'BUILD_FAILURE' }), 'BLOCKED');
  assert.equal(detection(baseline, { ...fail, tests: [] }), 'BLOCKED');
  assert.equal(detection(baseline, { status: 'PASS', tests }), 'MISSED');
});

test('평가 패치의 테스트/빌드 변경과 private 외부 held-out 출력을 거부한다', async t => {
  const p = await temp(t), patch = path.join(p, 'bad.patch');
  await save(patch, '--- a/pom.xml\n+++ b/pom.xml\n@@ -1 +1 @@\n-old\n+new\n');
  await assert.rejects(applyUnitPatch(p, patch), /src\/main/);
  await assert.rejects(runBlindUnit({ output: p, freeze: 'must-not-read' }, {}), /범위/);
});

test('저장소 내부 임시 사본에서도 Git 성공 코드뿐 아니라 실제 패치 적용을 확인한다', async t => {
  await mkdir(path.join(root, '.tmp'), { recursive: true });
  const p = await mkdtemp(path.join(root, '.tmp/unit-patch-'));
  t.after(() => rm(p, { recursive: true, force: true }));
  await save(path.join(p, 'src/main/C.java'), 'old\n');
  await save(path.join(p, 'patch.diff'), 'diff --git a/src/main/C.java b/src/main/C.java\n--- a/src/main/C.java\n+++ b/src/main/C.java\n@@ -1 +1 @@\n-old\n+new\n');
  await applyUnitPatch(p, path.join(p, 'patch.diff'));
  assert.equal(await readFile(path.join(p, 'src/main/C.java'), 'utf8'), 'new\n');
});

test('신규 held-out은 패치에 접근하기 전에 동결 구현의 변화를 거부한다', async t => {
  const p = await temp(t), freeze = path.join(p, 'freeze.json');
  await save(freeze, { files: { 'package.json': 'stale-hash' } });
  await assert.rejects(runBlindUnit({ output: path.join(root, 'evals/private/m4-heldout-first'), freeze }, {
    test_pattern: 'M4*Test', plan_file: path.join(root, 'evals/unit/test-plan.json')
  }), /변경/);
});
