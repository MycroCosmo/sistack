import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { root } from '../scripts/common.mjs';
import { descriptions, privacyFixture, mixPrivacyFixture } from '../scripts/refresh-debug-inputs.mjs';
import { mask } from '../lib/mask/index.mjs';
import { parseTrace } from '../lib/debug/parse.mjs';
import { digest, json, save } from '../lib/trace/io.mjs';
import { prepareDebug, finishDebug, debugFingerprint } from '../lib/debug/index.mjs';
import { scoreDebug } from '../scripts/eval-debug.mjs';

test('MyBatis diagnostic blocks do not replace the real exception chain', async () => {
  const log = await readFile(path.join(root, 'evals/debug/repro/oracle-format.log'), 'utf8');
  const parsed = parseTrace(mixPrivacyFixture(log).text, { packagePrefix: 'app.board' });
  assert.deepEqual(parsed.exceptions.map(e => [e.type, e.relation, e.parent]), [
    ['org.apache.ibatis.exceptions.PersistenceException', 'root', null],
    ['java.sql.SQLSyntaxErrorException', 'cause', 0]
  ]);
  assert.equal(parsed.project_frames.length, 2);
  assert.ok(parsed.project_frames.every(f => f.exception === 0));
  assert.deepEqual(parsed.database_codes, ['ORA-00904']);
  const sql = log.split('\n').find(l => l.startsWith('### SQL:'));
  assert.equal((sql.match(/b\.CREATED_AT/g) ?? []).length, 3);
  assert.equal((sql.match(/\?/g) ?? []).length, 4);
  assert.ok(parsed.text.includes(sql));
  const jetty = parseTrace('javax.servlet.ServletException: failed\nCaused by: \njava.lang.IllegalStateException: inner\n\tat app.View.render(View.java:7)');
  assert.deepEqual(jetty.exceptions.map(e => [e.relation, e.parent]), [['root', null], ['cause', 0]]);
});

test('all ten inputs preserve captured lines and mask only the inserted synthetic privacy values', async () => {
  for (const id of Object.keys(descriptions)) {
    const base = path.join(root, 'evals/debug/cases', id);
    const provenance = await json(path.join(base, 'input-provenance.json'));
    const source = (await readFile(path.join(root, provenance.source), 'utf8')).replaceAll('\r\n', '\n');
    assert.equal(provenance.source_newlines, 'LF');
    assert.equal(digest(source), provenance.source_sha256, id);
    const selected = provenance.selection === 'access-only'
      ? source.split(/\r?\n/).filter(l => /^\S+ ACCESS (GET|POST) \S+ \d{3}$/.test(l)).join('\n') + '\n'
      : source.replaceAll('\r\n', '\n');
    const log = await readFile(path.join(base, 'symptom.log'), 'utf8');
    const lines = log.split('\n');
    assert.equal(lines[provenance.fixture_line - 1], privacyFixture, id);
    assert.ok(provenance.fixture_line > 1 && provenance.fixture_line < lines.length - 1, id);
    lines.splice(provenance.fixture_line - 1, 1);
    assert.equal(digest(lines.join('\n')), digest(selected), id);
    assert.equal(digest(selected), provenance.selected_sha256, id);
    assert.equal(digest(log), provenance.symptom_sha256, id);
    const masked = mask(log);
    const expectedFixture = '[SYNTHETIC MASK FIXTURE] phone=[REDACTED] [REDACTED] account=[REDACTED] JSESSIONID=[REDACTED] transactionId=12345678-1234-1234-1234-123456789012 classHash=abcdef12345678901234567890abcdef12';
    assert.equal(digest(masked), digest(log.replace(privacyFixture, expectedFixture)), id);
    assert.equal(digest(mask(masked)), digest(masked), id);
    assert.equal(digest(parseTrace(log).text), digest(masked), id);
    const maskedFile = path.join(root, provenance.masked_output);
    assert.equal(digest(await readFile(maskedFile, 'utf8')), digest(masked), id);
    assert.doesNotMatch(log, /(?:[a-z]:[\\/]Users[\\/]|\/(?:home|Users)\/)[^\\/\r\n]+[\\/]/i, id);
    if (id !== '07-oracle-log-only') {
      assert.equal(provenance.kind, 'captured-runtime');
      const run = await json(path.join(root, provenance.source.replace(/\.server\.txt$/, '')));
      assert.equal(run.status, 'PASS');
      assert.equal(run.reproduction_level, 5);
      assert.match(source, /Initializing Spring (?:root WebApplicationContext|DispatcherServlet)/);
      assert.match(source, /INFO:.*jetty-9\.4/);
      assert.match(source, /qtp\d+-\d+/, id);
      assert.doesNotMatch(source, /qtp\[REDACTED\]/, id);
    }
  }
});

test('runtime exception inputs keep full frames and MyBatis SQL context; no-exception inputs contain only access events', async () => {
  for (const [id, type] of [['01-binding', 'BindingException'], ['04-session-bypass', 'NullPointerException'], ['06-sort-sql', 'JdbcSQLSyntaxErrorException'], ['08-thymeleaf-utilities', 'TemplateProcessingException']]) {
    const log = await readFile(path.join(root, 'evals/debug/cases', id, 'symptom.log'), 'utf8');
    const parsed = parseTrace(log, { packagePrefix: 'kr.sistack.board' });
    assert.ok(parsed.exceptions.some(e => e.type.endsWith(type)), id);
    assert.ok(parsed.frames.length > 20, id);
    if (id === '08-thymeleaf-utilities') {
      assert.ok(parsed.frames.some(f => f.class.startsWith('org.thymeleaf.')), id);
      assert.equal(parsed.exceptions.filter(e => e.relation === 'root').length, 2, id);
      assert.equal(parsed.exceptions.filter(e => e.relation === 'cause').length, 5, id);
    }
    else assert.ok(parsed.project_frames.length > 0, id);
    if (id === '06-sort-sql') {
      for (const label of ['Error querying database', 'The error may exist in file', 'The error may involve', 'SQL:']) assert.ok(log.includes('### ' + label), label);
    }
  }
  for (const id of ['05-paging', '10-fragment-encoding']) {
    const log = await readFile(path.join(root, 'evals/debug/cases', id, 'symptom.log'), 'utf8');
    const events = log.trimEnd().split('\n').filter(l => l !== privacyFixture);
    assert.ok(events.length > 1);
    assert.ok(events.every(l => /^\S+ ACCESS (GET|POST) \S+ \d{3}$/.test(l)), id);
    assert.equal(parseTrace(log).exceptions.length, 0);
    assert.doesNotMatch(log, /displayedLastPage|next_link|fragment_korean|total=|pageSize=/);
  }
});

test('Oracle draft keeps all three SQL references unresolved', async () => {
  const draft = await json(path.join(root, 'evals/debug/cases/07-oracle-log-only/expected.draft.json'));
  assert.equal(draft.review_status, 'draft');
  assert.equal(draft.status, 'UNRESOLVED');
  assert.deepEqual(draft.locations.map(l => l.line), [23, 26, 34]);
});

test('scoring fails a single SQL candidate or a definitive claim; three unresolved candidates pass', async t => {
  const repository = await mkdtemp(path.join(os.tmpdir(), 'si-debug-score-'));
  t.after(() => rm(repository, { recursive: true, force: true }));
  const source = 'class Query {\n// first reference\n// second reference\n// third reference\n}\n';
  await writeFile(path.join(repository, 'Query.java'), source);
  const freeze = path.join(repository, 'freeze.json');
  await save(freeze, { created_at: '2020-01-01T00:00:00.000Z', revision: 'synthetic', tool_fingerprint: await debugFingerprint(), files: { 'Query.java': digest(source) } });
  const locations = [2, 3, 4].map(line => ({ file: 'Query.java', line }));
  const expectedFile = path.join(repository, 'expected.json');
  await save(expectedFile, { case_id: 'synthetic-oracle', dataset: 'training', review_status: 'approved', approved_by: 'synthetic test fixture only', status: 'UNRESOLVED', locations, source_files: { 'Query.java': digest(source) } });
  for (const [runId, candidates, hit] of [
    ['one', [{ status: 'UNRESOLVED', locations: locations.slice(0, 1) }], false],
    ['definitive', [{ status: 'CONFIRMED', locations }], false],
    ['all', [{ status: 'UNRESOLVED', locations }], true]
  ]) {
    const prep = await prepareDebug(repository, { symptom: '날짜 검색 오류', runId });
    await save(path.join(prep.directory, 'evidence/diagnosis.json'), {
      source_reviewed: true, symptom: '날짜 검색 오류',
      candidates: candidates.map(c => ({ ...c, cause: '식별자 후보', level: 2, reason: '각 SQL 참조 위치 확인' })),
      eliminated: ['제공된 소스 외의 경로는 확인 불가'], reproduction: { executed: false, note: 'DB 없음' }, proposal: { diff: '', note: '추가 증거 필요' }, same_pattern: ['세 참조 위치 비교'], verification: ['실행 SQL 확인'], unverified: ['DB 메타데이터'], next_actions: ['실행 SQL과 메타데이터 요청']
    });
    await finishDebug(repository, runId);
    const result = await scoreDebug(prep.directory, expectedFile, { dataset: 'training', output: path.join(repository, `${runId}.json`), freeze, repository });
    assert.equal(result.hit, hit, runId);
  }
});
