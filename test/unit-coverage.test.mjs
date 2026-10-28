import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveCoverage, boundaryPair, coverageSummary } from '../lib/unit/coverage.mjs';
import { buildIndex } from '../lib/indexer/index.mjs';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { sanitize } from '../lib/indexer/graph.mjs';
import { parseSurefire } from '../lib/unit/results.mjs';
import { branchWitness, evaluateCondition, generateCoverage } from '../lib/unit/generate.mjs';
import { json } from '../lib/trace/io.mjs';

test('비교 연산자와 상수에서 허용/거부 양쪽 경계를 만든다', () => {
  assert.deepEqual(boundaryPair('>', 200), { allowed: 200, rejected: 201 });
  assert.deepEqual(boundaryPair('>=', 200), { allowed: 199, rejected: 200 });
  assert.deepEqual(boundaryPair('<', 10), { allowed: 10, rejected: 9 });
  assert.deepEqual(boundaryPair('<=', 10), { allowed: 11, rejected: 10 });
});

test('실제 인덱스의 SQL과 Service에서 모든 분기·쓰기 컬럼·경계를 도출한다', async () => {
  const index = await buildIndex('examples/legacy-board');
  const sources = Object.fromEntries(await Promise.all(Object.keys(index.meta.source_files).map(async f => [f, await readFile(`examples/legacy-board/${f}`, 'utf8')])));
  const plan = deriveCoverage(index, sources);
  const branches = plan.items.filter(i => i.kind === 'sql-branch');
  for (const tag of ['if', 'when', 'otherwise']) assert.ok(branches.some(i => i.branch_tag === tag), tag);
  assert.ok(branches.some(i => i.branch_tag === 'if' && i.outcome === false));
  assert.deepEqual(plan.items.filter(i => i.kind === 'update-column').map(i => i.column).sort(), ['CATEGORY', 'CONTENT', 'TITLE']);
  assert.deepEqual(plan.items.filter(i => i.kind === 'insert-column').map(i => i.column).sort(), ['AUTHOR', 'CATEGORY', 'CONTENT', 'ID', 'TITLE']);
  for (const property of ['title', 'content']) assert.ok(plan.items.some(i => i.kind === 'service-boundary' && i.property === property && i.pair.rejected === i.pair.allowed + 1));
  for (const item of plan.items) {
    const method = `계획_${item.id}_분기결과`;
    const testPlan = sanitize({ [`C#${method}`]: { display_name: '분기 결과를 검증한다', target_class: 'Target', target_method: 'find' } });
    assert.equal(parseSurefire(`<testsuite tests="1"><testcase classname="C" name="${method}" time="0"/></testsuite>`, testPlan, 'suite.xml').length, 1);
  }
});

test('이름이 다른 합성 Mapper도 동일 규칙으로 수집하고 SQL 주석을 무시한다', () => {
  const file = 'src/main/resources/Item.xml';
  const source = `<mapper namespace="acme.ItemMapper"><sql id="filters"><if test="term != null and term != ''"><choose><when test="mode == 'owner'">AND i.OWNER LIKE '%' || #{term} || '%'</when><otherwise>AND i.NAME LIKE '%' || #{term} || '%'</otherwise></choose></if></sql><select id="find" resultType="map">SELECT i.* FROM ITEM i <include refid="filters"/></select><update id="save">UPDATE ITEM SET NAME=#{name}, OWNER=#{owner} WHERE KEY=#{key}</update><insert id="add">INSERT INTO ITEM (KEY, NAME, OWNER) VALUES (#{key},#{name},#{owner})</insert><!-- UPDATE ITEM SET WRONG=1 --></mapper>`;
  const nodes = ['filters', 'find', 'save', 'add'].map(statement => ({ id: statement, kind: statement === 'filters' ? 'fragment' : 'sql', name: `acme.ItemMapper.${statement}`, file, line: 1, details: { namespace: 'acme.ItemMapper', statement, dialect: 'mybatis' } }));
  const p = deriveCoverage({ nodes, edges: [{ from: 'find', to: 'filters', kind: 'includes' }], meta: { source_files: {} } }, { [file]: source });
  assert.deepEqual(p.items.filter(i => i.kind === 'update-column').map(i => i.column), ['NAME', 'OWNER']);
  assert.equal(p.items.filter(i => i.kind === 'insert-column').length, 3);
  assert.ok(p.items.some(i => i.kind === 'sql-branch' && i.branch_tag === 'otherwise' && i.method === 'find'));
});

test('경계 상수를 해석하되 해석 못 한 비교식을 성공 범위로 숨기지 않는다', () => {
  const file = 'src/main/java/acme/ItemService.java';
  const source = `package acme; public class ItemService { private static final int LIMIT = 30;
 public void add(Item x) { validate(x); }
 private void validate(Item x) { if (x.getName().length() >= LIMIT || x.getCount() <= 2) { throw new IllegalArgumentException(); } }
}`;
  const nodes = [{ id: 'svc', kind: 'class', name: 'acme.ItemService', file, line: 1, details: { bean: 'itemService' } }];
  const p = deriveCoverage({ nodes, edges: [], meta: { source_files: {} } }, { [file]: source });
  const items = p.items.filter(i => i.kind === 'service-boundary');
  assert.ok(items.some(i => i.property === 'name' && i.pair.allowed === 29 && i.pair.rejected === 30));
  assert.ok(items.some(i => i.property === 'count' && i.pair.allowed === 3 && i.pair.rejected === 2));
});

test('계획 충족률은 실제 실행 결과와 연결하고 누락·스킵·실패를 구분한다', () => {
  const plan = { items: [{ id: 'a', tests: ['C#가'] }, { id: 'b', tests: ['C#나'] }, { id: 'c', tests: [], unresolved: '수동 fixture 필요' }] };
  assert.deepEqual(coverageSummary(plan, [{ class_name: 'C', method_name: '가', status: 'PASS' }, { class_name: 'C', method_name: '나', status: 'SKIP' }]),
    { planned: 3, generated: 2, executed: 1, passed: 1, unresolved: 1 });
  assert.equal(coverageSummary(plan, []).executed, 0);
  assert.equal(coverageSummary(plan, [{ class_name: 'C', method_name: '가', status: 'FAIL' }]).passed, 0);
});

test('동적 분기 입력은 기본 fixture를 바꾸어 부모 조건과 비기본 조건을 함께 만족시킨다', () => {
  const plan = { classes: [{ name: 'acme.Query', fields: [{ name: 'term', type: 'String' }, { name: 'mode', type: 'String' }], methods: [
    { name: 'getTerm', body: 'return term;' }, { name: 'getMode', body: 'return mode;' }
  ] }] };
  const item = { input_type: 'acme.Query', conditions: [{ expression: "term != null and term != ''", truth: true }, { expression: "mode == 'owner'", truth: true }] };
  const w = branchWitness(item, plan, { beans: { 'acme.Query': { term: '', mode: 'title' } } });
  assert.equal(w.bean.mode, 'owner'); assert.ok(w.bean.term.length > 0);
  assert.ok(item.conditions.every(c => evaluateCondition(c.expression, w.parameters) === c.truth));
  assert.throws(() => evaluateCondition('custom(term)', {}), /자동 해석 범위/);
});

test('역방향 상수와 이름이 다른 Service도 도출하고 미지원 비교식을 분모에 남긴다', () => {
  const file = 'src/main/java/acme/PaymentHandler.java';
  const source = `package acme; @org.springframework.stereotype.Service public class PaymentHandler {
 public void save(Item x) { if (30 < x.getName().length()) throw new IllegalArgumentException(); }
 public void scalar(int value) { if (value > 50) throw new IllegalArgumentException(); }
}`;
  const p = deriveCoverage({ nodes: [{ id: 's', kind: 'class', name: 'acme.PaymentHandler', file, line: 1, details: { bean: 'paymentHandler' } }], edges: [], meta: { source_files: {} } }, { [file]: source });
  assert.ok(p.items.some(i => i.pair?.allowed === 30 && i.pair?.rejected === 31));
  assert.ok(p.items.some(i => i.kind === 'service-comparison-unresolved' && i.unresolved));
});

test('정상 소스만으로 실행 가능한 테스트·입력 증거·모든 컬럼 계획을 생성한다', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'coverage-generate-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const out = path.join(dir, 'new');
  const result = await generateCoverage(path.resolve('examples/legacy-board'), out, {
    fixtureFile: path.resolve('evals/unit/fixtures.json'), templateDirectory: path.resolve('skills/si-unit-test/templates')
  });
  assert.equal(result.plan.items.length, 28);
  assert.equal(result.plan.items.filter(i => i.unresolved).length, 0);
  assert.equal(Object.keys(result.tests).length, 32);
  const stored = await json(path.join(out, 'coverage-plan.json'));
  assert.equal(Object.keys(stored.generated_files).length, 2);
  assert.ok(stored.items.filter(i => i.kind === 'sql-branch').every(i => i.witness && i.tests.length));
  assert.equal(Object.hasOwn(stored, 'classes'), false);
  assert.ok(Object.keys(stored.source_files).every(f => f.startsWith('src/') || ['pom.xml', 'README.md'].includes(f)));
});
