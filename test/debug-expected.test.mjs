import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { checkExpected } from '../scripts/check-expected.mjs';
import { validateEnclosing } from '../lib/debug/expected.mjs';
import { scoreDebug } from '../scripts/eval-debug.mjs';
import { prepareDebug, finishDebug, debugFingerprint } from '../lib/debug/index.mjs';
import { digest, save } from '../lib/trace/io.mjs';

async function temp(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'sistack-location-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('check-expected distinguishes identical return text in different Java methods', async t => {
  const sourceRoot = await temp(t);
  const source = 'class Search {\n public String getSort() {\n  return sort;\n }\n public String getSortColumn() {\n  return sort;\n }\n}\n';
  await writeFile(path.join(sourceRoot, 'Search.java'), source);
  const expected = { case_id: 'method', dataset: 'training', review_status: 'approved', approved_by: 'synthetic fixture', status: 'CONFIRMED',
    source_files: { 'Search.java': digest(source) }, locations: [{ file: 'Search.java', line: 6, enclosing: { kind: 'java-method', name: 'Search#getSortColumn' } }] };
  const check = e => checkExpected(e, { sourceRoot });
  assert.equal((await check(expected)).status, 'PASS');
  const wrong = structuredClone(expected); wrong.locations[0].line = 3;
  await assert.rejects(check(wrong), /enclosing/);
  const missing = structuredClone(expected); delete missing.locations[0].enclosing;
  await assert.rejects(check(missing), /enclosing/);
  const other = structuredClone(expected); other.locations[0].enclosing.name = 'Search#getSort';
  await assert.rejects(check(other), /enclosing/);
  await writeFile(path.join(sourceRoot, 'Search.java'), source.replace('class Search', 'class Changed'));
  await assert.rejects(check(expected), /소스가 변경/);
});

test('XML enclosing selectors distinguish repeated property text and reject ambiguous elements', () => {
  const source = '<beans>\n <bean class="A">\n  <property name="viewNames" value="board/*"/>\n </bean>\n <bean class="B">\n  <property name="viewNames" value="board/*"/>\n </bean>\n</beans>\n';
  const point = { file: 'views.xml', line: 6, enclosing: { kind: 'xml-element', name: 'bean', attributes: { class: 'B' } } };
  assert.doesNotThrow(() => validateEnclosing(point.file, source, point));
  assert.throws(() => validateEnclosing(point.file, source, { ...point, line: 3 }), /enclosing/);
  assert.throws(() => validateEnclosing(point.file, source, { ...point, enclosing: { kind: 'xml-element', name: 'bean' } }), /모호/);
});

test('JS/HTML and missing JSP directive insertion regions are checked structurally', () => {
  const js = 'function listUrl() {\n return "x";\n}\nfunction other() {\n return "x";\n}\n';
  const point = { file: 'a.js', line: 2, enclosing: { kind: 'javascript-function', name: 'listUrl' } };
  assert.doesNotThrow(() => validateEnclosing(point.file, js, point));
  assert.throws(() => validateEnclosing(point.file, js, { ...point, line: 5 }), /enclosing/);
  const html = '<div>\n<input name="csrf">\n<input name="other">\n</div>\n';
  const tag = { file: 'a.html', line: 2, enclosing: { kind: 'markup-tag', name: 'input', attributes: { name: 'csrf' } } };
  assert.doesNotThrow(() => validateEnclosing(tag.file, html, tag));
  assert.throws(() => validateEnclosing(tag.file, html, { ...tag, line: 3 }), /enclosing/);
  const jsp = '<div>\n <span>body</span>\n</div>\n';
  const preamble = { file: 'p.jspf', start: 1, end: 1, enclosing: { kind: 'jsp-preamble', name: 'directives' } };
  assert.doesNotThrow(() => validateEnclosing(preamble.file, jsp, preamble));
  for (const invalid of [{ start: 1, end: 2 }, { start: 0, end: 1 }, { start: 2, end: 1 }, { line: 1, start: 1, end: 1 }]) {
    assert.throws(() => validateEnclosing(preamble.file, jsp, { ...preamble, ...invalid }), /범위|enclosing/);
  }
});

test('deletion ranges match inclusive endpoints but reject outside lines, wrong status and extras', async t => {
  const repository = await temp(t), source = 'class C {\n void run() {\n  int x = 1;\n  int y = 2;\n }\n}\n';
  await writeFile(path.join(repository, 'C.java'), source);
  const freeze = path.join(repository, 'freeze.json');
  await save(freeze, { created_at: '2020-01-01T00:00:00.000Z', revision: 'synthetic', tool_fingerprint: await debugFingerprint(), files: { 'C.java': digest(source) } });
  const expectedFile = path.join(repository, 'expected.json');
  await save(expectedFile, { case_id: 'range', dataset: 'training', review_status: 'approved', approved_by: 'synthetic fixture', status: 'CONFIRMED',
    source_files: { 'C.java': digest(source) }, locations: [{ file: 'C.java', start: 3, end: 4, enclosing: { kind: 'java-method', name: 'C#run' } }] });
  for (const [id, lines, status, hit] of [['start', [3], 'CONFIRMED', true], ['end', [4], 'CONFIRMED', true],
    ['before', [2], 'CONFIRMED', false], ['after', [5], 'CONFIRMED', false], ['status', [3], 'UNRESOLVED', false], ['extra', [3, 6], 'CONFIRMED', false]]) {
    const run = await prepareDebug(repository, { symptom: '누락', runId: id });
    await save(path.join(run.directory, 'evidence/diagnosis.json'), { source_reviewed: true, symptom: '누락',
      candidates: [{ cause: 'C#run의 x 초기값 확인', identifiers: ['C#run', 'x'], status, level: 2, locations: lines.map(line => ({ file: 'C.java', line })), reason: '블록 직접 확인' }],
      eliminated: ['다른 경로 소거'], same_pattern: ['다른 메서드 확인'], verification: ['실제 요청 확인'], unverified: ['미재현'], next_actions: ['실행 확인'],
      reproduction: { executed: false, note: '합성 fixture' }, proposal: { diff: status === 'UNRESOLVED' ? '' : '--- a/C.java\n+++ b/C.java\n@@ -3,1 +3,1 @@\n-  int x = 1;\n+  int x = 2;\n', note: '미적용' } });
    await finishDebug(repository, id);
    const score = await scoreDebug(run.directory, expectedFile, { dataset: 'training', output: path.join(repository, id + '.json'), freeze, repository });
    assert.equal(score.hit, hit, id);
    assert.deepEqual(score.locations[0], { file: 'C.java', start: 3, end: 4, hit: status === 'CONFIRMED' && lines.some(line => line >= 3 && line <= 4) });
  }
});
