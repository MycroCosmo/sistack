import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, cp } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { prepareTrace, finishTrace, hiddenCategories, complexity } from '../lib/trace/index.mjs';
import { validateManifest } from '../lib/manifest/index.mjs';
import { json, save } from '../lib/trace/io.mjs';
import { validateIndex } from '../lib/indexer/graph.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'sistack-trace-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'data.sql'), 'SELECT * FROM BOARD;');
  return root;
}
async function reviewRun(root, runId) {
  const dir = path.join(root, '.sistack/runs', runId), graph = await json(path.join(dir, 'evidence/index-query.json'));
  const stage = await json(path.join(dir, 'evidence/stage.json'));
  const review = { source_reviewed: true, checked_files: ['data.sql'], overview: ['합성 SELECT 흐름.', 'BOARD를 읽는다.'], flow: ['SQL → BOARD 읽기.'], traps: [], hidden_paths: hiddenCategories.map(category => ({ category, status: 'NOT_FOUND', note: '단일 SQL fixture 범위', evidence: [] })), unverified: ['DB 미실행'], next_actions: ['필요하면 실행 환경에서 확인'], execution: { mode: stage.complexity.mode, strategy: 'direct', note: 'fixture 원문과 대조' } };
  await save(path.join(dir, 'evidence/trace.json'), graph);
  await save(path.join(dir, 'evidence/review.json'), review);
  return { dir, graph, review };
}

test('prepare→원문 검토→finish 산출물과 manifest, 소스 보존·새 인덱스', async t => {
  const root = await fixture(t), original = await readFile(path.join(root, 'data.sql'));
  const prepared = await prepareTrace(root, { from: ['data.sql'], runId: 'first' });
  assert.equal(prepared.complexity.mode, 'simple'); assert.equal(prepared.status, 'PARTIAL');
  await assert.rejects(finishTrace(root, 'first'), /JSON/);
  const { dir } = await reviewRun(root, 'first');
  assert.equal((await finishTrace(root, 'first')).status, 'PASS');
  const report = await readFile(path.join(dir, 'report.md'), 'utf8');
  assert.match(report, /BOARD/); assert.match(report, /mermaid/); assert.match(report, /PL\/PM/);
  assert.deepEqual(validateManifest(await json(path.join(dir, 'manifest.json'))), []);
  assert.deepEqual(await readFile(path.join(root, 'data.sql')), original);
  await assert.rejects(finishTrace(root, 'first'), /EEXIST/);
  await writeFile(path.join(root, 'new.sql'), 'SELECT * FROM NEW_TABLE;');
  const next = await prepareTrace(root, { from: ['new.sql'], runId: 'new' });
  assert.ok(next.nodes > 0); // Git revision이 없어도 추가 소스를 반영한다.
});

test('소스 변경·허위 라인·미검토 파일은 최종 보고 생성을 차단한다', async t => {
  const root = await fixture(t);
  await prepareTrace(root, { from: ['data.sql'], runId: 'stale' });
  const { dir, graph } = await reviewRun(root, 'stale');
  graph.edges[0].evidence[0].line = 999;
  await save(path.join(dir, 'evidence/trace.json'), graph, { exclusive: false });
  await assert.rejects(finishTrace(root, 'stale'), /라인/);
  graph.edges[0].evidence[0].line = 1;
  await save(path.join(dir, 'evidence/trace.json'), graph, { exclusive: false });
  await writeFile(path.join(root, 'data.sql'), 'SELECT * FROM CHANGED;');
  await assert.rejects(finishTrace(root, 'stale'), /소스가 변경/);
});

test('시작점 0건과 경로 이탈, 복잡 분기의 실제 탐색 기록을 검증한다', async t => {
  const root = await fixture(t);
  assert.equal((await prepareTrace(root, { from: ['missing'], runId: 'zero' })).status, 'BLOCKED');
  await assert.rejects(prepareTrace(root, { from: ['data.sql'], runId: '../escape' }));
  await prepareTrace(root, { from: ['data.sql'], scope: 'menu', runId: 'menu' });
  const { dir, review } = await reviewRun(root, 'menu');
  await assert.rejects(finishTrace(root, 'menu'), /탐색자/);
  review.execution = { mode: 'complex', strategy: 'sequential', note: '합성 테스트는 순차 역할 수행', explorers: [] };
  for (const role of ['screen', 'server', 'sql']) {
    const file = `evidence/explorer-${role}.md`; review.execution.explorers.push({ role, path: file });
    await save(path.join(dir, file), `${role}: data.sql:1을 확인한 합성 fixture 결과`);
  }
  await save(path.join(dir, 'evidence/review.json'), review, { exclusive: false });
  assert.equal((await finishTrace(root, 'menu')).status, 'PASS');
});

test('복잡도는 긴 단일 체인과 20개 분기 경로를 구분한다', () => {
  const chain = { direction: 'forward', roots: ['0'], edges: Array.from({ length: 25 }, (_, i) => ({ from: String(i), to: String(i + 1) })) };
  assert.equal(complexity(chain, 'single').mode, 'simple');
  const fan = { ...chain, edges: Array.from({ length: 20 }, (_, i) => ({ from: '0', to: String(i + 1) })) };
  assert.equal(complexity(fan, 'single').mode, 'complex');
});

test('DB 선택 후 부분 그래프가 질의 밖 후보 id 때문에 깨지지 않는다', async t => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'D.java'), 'class D {\nprivate SqlSessionTemplate sql;\npublic void run() { sql.selectList("M.list"); }\n}');
  await writeFile(path.join(root, 'spring.xml'), '<beans><bean class="org.mybatis.spring.SqlSessionFactoryBean"><property name="mapperLocations" value="classpath:/M_mysql.xml"/></bean></beans>');
  for (const db of ['mysql', 'oracle']) await writeFile(path.join(root, `M_${db}.xml`), '<mapper namespace="M"><select id="list">SELECT * FROM BOARD</select></mapper>');
  const run = await prepareTrace(root, { from: ['D#run'], runId: 'selection' });
  const graph = await json(path.join(run.directory, 'evidence/index-query.json'));
  validateIndex(graph);
  assert.equal(graph.edges.find(e => e.kind === 'executes').status, 'CONFIRMED');
  assert.ok(!graph.nodes.some(n => n.file === 'M_oracle.xml'));
  const full = await json(path.join(root, '.sistack/index/index.json'));
  assert.equal(full.edges.find(e => e.kind === 'executes').candidates.length, 1);
});

test('si-trace 폴더만 복사해 CLI를 실행해도 상위 저장소 없이 동작한다', async t => {
  const root = await fixture(t), installed = path.join(root, 'installed/si-trace');
  await cp('skills/si-trace', installed, { recursive: true });
  const target = path.join(root, 'project'); await mkdir(target); await writeFile(path.join(target, 'data.sql'), 'SELECT * FROM T;');
  const result = spawnSync(process.execPath, [path.join(installed, 'scripts/trace.mjs'), 'prepare', target, '--to', 'T', '--run-id', 'standalone'], { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr); assert.ok(JSON.parse(result.stdout).edges > 0);
  assert.deepEqual(validateManifest(await json(path.join(target, '.sistack/runs/standalone/manifest.json'))), []);
  await writeFile(path.join(target, 'page.html'), '<form method="post" th:action="@{/go}"></form>');
  await writeFile(path.join(target, 'C.java'), '@Controller\npublic class C {\n@PostMapping("/go")\npublic void go() {}\n}');
  const html = spawnSync(process.execPath, [path.join(installed, 'scripts/trace.mjs'), 'prepare', target, '--from', 'page.html', '--run-id', 'standalone-html'], { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(html.status, 0, html.stderr);
  const graph = await json(path.join(target, '.sistack/runs/standalone-html/evidence/index-query.json'));
  assert.ok(graph.nodes.some(n => n.name === 'POST /go')); assert.ok(graph.edges.some(e => e.kind === 'requests'));
});
