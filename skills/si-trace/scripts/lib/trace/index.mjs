import path from 'node:path';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildIndex } from '../indexer/index.mjs';
import { queryIndex } from '../indexer/query.mjs';
import { sanitize, validateIndex } from '../indexer/graph.mjs';
import { validateManifest } from '../manifest/index.mjs';
import { noLinks, inside, json, save, digest, checkSources } from './io.mjs';
import { disclaimer, renderReport } from './report.mjs';

export const hiddenCategories = ['interceptor', 'filter', 'aop', 'paging', 'common-code', 'exception'];
const runIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;
export async function toolFingerprint() {
  const base = fileURLToPath(new URL('../', import.meta.url)), entries = [];
  for (const group of ['indexer', 'trace', 'mask', 'manifest']) {
    for (const name of (await readdir(path.join(base, group))).sort()) if (name.endsWith('.mjs')) entries.push([`${group}/${name}`, digest(await readFile(path.join(base, group, name)))]);
  }
  return digest(JSON.stringify(entries));
}

export function complexity(graph, scope) {
  if (scope === 'menu') return { mode: 'complex', reason: '메뉴 전체 또는 여러 화면 범위', paths_at_least: null };
  const adjacent = new Map();
  for (const e of graph.edges) { const key = graph.direction === 'reverse' ? e.to : e.from; const list = adjacent.get(key) || []; list.push(graph.direction === 'reverse' ? e.from : e.to); adjacent.set(key, list); }
  let count = 0;
  const visit = (id, seen) => {
    if (count >= 20) return;
    if (seen.has(id) || !adjacent.has(id)) { count++; return; }
    for (const next of adjacent.get(id)) visit(next, new Set([...seen, id]));
  };
  for (const id of graph.roots) visit(id, new Set());
  return { mode: count >= 20 ? 'complex' : 'simple', reason: count >= 20 ? '도달 경로가 20개 이상' : '단일 범위, 도달 경로 20개 미만', paths_at_least: count };
}

export async function prepareTrace(target, { from = [], to = [], scope = 'single', depth = 8, runId = `trace-${randomUUID()}` } = {}) {
  if (!runIdPattern.test(runId) || !['single', 'menu'].includes(scope) || Boolean(from.length) === Boolean(to.length) || !Number.isInteger(depth) || depth < 0 || depth > 100) throw new Error('from/to 한 방향, 유효한 run-id/scope/depth가 필요합니다');
  const root = path.resolve(target); await noLinks(root);
  const dir = await inside(root, `.sistack/runs/${runId}`);
  await mkdir(path.dirname(dir), { recursive: true });
  await mkdir(dir); // 기존 run은 수정하지 않는다.
  const index = await buildIndex(root);
  await save(await inside(root, '.sistack/index/index.json'), index, { exclusive: false });
  const results = [], misses = [];
  for (const start of from.length ? from : to) {
    try { results.push(queryIndex(index, { [from.length ? 'from' : 'to']: start, depth })); }
    catch (e) { if (e.message !== '시작 노드를 찾지 못했습니다') throw e; misses.push(start); }
  }
  const unique = (items, key) => [...new Map(items.map(x => [key(x), x])).values()];
  const graph = { meta: index.meta, direction: from.length ? 'forward' : 'reverse', depth,
    roots: [...new Set(results.flatMap(r => r.roots))], nodes: unique(results.flatMap(r => r.nodes), n => n.id),
    edges: unique(results.flatMap(r => r.edges), e => JSON.stringify([e.from, e.to, e.kind, e.status])),
    frontier: [...new Set(results.flatMap(r => r.frontier))], unresolved: unique(results.flatMap(r => r.unresolved), u => JSON.stringify(u)), skipped: index.skipped };
  const mode = complexity(graph, scope);
  const stage = sanitize({ run_id: runId, created_at: new Date().toISOString(), inputs: { starts: JSON.stringify(from.length ? from : to), direction: graph.direction, scope, depth: String(depth) }, complexity: mode, missing_starts: misses, tool_fingerprint: await toolFingerprint() });
  await save(path.join(dir, 'evidence/index-query.json'), graph);
  await save(path.join(dir, 'evidence/stage.json'), stage);
  const manifest = { schema_version: '1.0.0', run_id: runId, skill: 'si-trace', created_at: stage.created_at, source_revision: index.meta.source_revision, status: graph.roots.length ? 'PARTIAL' : 'BLOCKED', inputs: stage.inputs, evidence: [{ path: 'evidence/index-query.json', level: 4, description: '인덱서·질의 실행 결과. 소스 의미 검토 전 골격' }], unverified: ['골격의 연결은 에이전트 원문 확인 전', ...(!index.meta.source_revision ? ['Git revision을 얻지 못함'] : []), ...misses.map(s => `시작점 0건: ${s}`)], next_actions: ['소스 확인 후 evidence/trace.json과 evidence/review.json 작성, finish 실행'] };
  await save(path.join(dir, 'manifest.json'), sanitize(manifest));
  await save(path.join(dir, 'draft-report.md'), `${disclaimer}\n\n# si-trace 골격\n\n상태: ${manifest.status}. 소스 의미 검토 전이며 분석 완료 결과가 아니다.\n\n분기: ${mode.mode}, ${mode.reason}. 노드 ${graph.nodes.length}개, 연결 ${graph.edges.length}개, 시작점 없음 ${misses.length}개.\n`);
  return { run_id: runId, directory: dir, status: manifest.status, complexity: mode, nodes: graph.nodes.length, edges: graph.edges.length, missing_starts: stage.missing_starts };
}

export async function finishTrace(target, runId) {
  if (!runIdPattern.test(runId)) throw new Error('잘못된 run-id');
  const root = path.resolve(target), dir = await inside(root, `.sistack/runs/${runId}`);
  const stage = await json(path.join(dir, 'evidence/stage.json'));
  if (stage.tool_fingerprint !== await toolFingerprint()) throw new Error('분석 도구가 바뀌었습니다. 새 run으로 다시 시작하세요');
  const skeleton = await json(path.join(dir, 'evidence/index-query.json'));
  const trace = validateIndex(await json(path.join(dir, 'evidence/trace.json')));
  const review = await json(path.join(dir, 'evidence/review.json'));
  if (JSON.stringify(trace.meta) !== JSON.stringify(skeleton.meta)) throw new Error('원본 인덱스 메타데이터를 보존해야 합니다');
  if (review.source_reviewed !== true || !Array.isArray(review.checked_files) || !review.execution || review.execution.mode !== stage.complexity.mode) throw new Error('소스 확인과 실제 실행 분기 기록이 필요합니다');
  for (const key of ['overview', 'flow', 'unverified', 'next_actions']) if (!Array.isArray(review[key]) || !review[key].length || review[key].some(x => typeof x !== 'string' || !x.trim())) throw new Error('검토 설명/미검증/다음 확인 항목 누락');
  if (!Array.isArray(review.traps) || !Array.isArray(review.hidden_paths) || hiddenCategories.some(c => review.hidden_paths.filter(h => h.category === c).length !== 1)) throw new Error('숨은 경로 6종과 함정 확인 기록이 필요합니다');
  const extraPoints = [];
  for (const t of review.traps) {
    if (!t.text || !t.evidence?.length) throw new Error('함정 설명·근거 누락');
    extraPoints.push(...t.evidence);
  }
  for (const h of review.hidden_paths) {
    if (!['CONFIRMED', 'UNRESOLVED', 'NOT_FOUND'].includes(h.status) || !h.note || !Array.isArray(h.evidence) || (h.status === 'CONFIRMED' && !h.evidence.length)) throw new Error('숨은 경로 상태·확인 범위·근거 누락');
    extraPoints.push(...h.evidence);
  }
  if (!['direct', 'parallel', 'sequential'].includes(review.execution.strategy) || !review.execution.note) throw new Error('실행 전략 기록 누락');
  if (stage.complexity.mode === 'complex') {
    if (review.execution.strategy === 'direct' || !Array.isArray(review.execution.explorers) || review.execution.explorers.length !== 3) throw new Error('복잡 분기는 계층별 탐색자 3개의 실제 기록이 필요합니다');
    for (const item of review.execution.explorers) {
      if (!['screen', 'server', 'sql'].includes(item.role) || !item.path?.startsWith('evidence/')) throw new Error('탐색자 역할/기록 경로 오류');
      const text = await readFile(await inside(dir, item.path), 'utf8'); if (!text.trim()) throw new Error('탐색자 기록이 비었습니다');
    }
    if (new Set(review.execution.explorers.map(x => x.role)).size !== 3) throw new Error('탐색자 역할 중복');
  }
  const points = [...trace.nodes.map(n => ({ file: n.file, line: n.line })), ...trace.edges.flatMap(e => e.evidence), ...extraPoints];
  if (points.some(p => !review.checked_files.includes(p.file))) throw new Error('근거 파일을 모두 직접 확인해야 합니다');
  await checkSources(root, trace.meta.source_files, points);
  const pending = trace.edges.some(e => e.status !== 'CONFIRMED') || trace.frontier?.length || stage.missing_starts.length || review.hidden_paths.some(h => h.status === 'UNRESOLVED');
  const status = !trace.nodes.length ? 'BLOCKED' : pending ? 'PARTIAL' : 'PASS';
  const manifest = sanitize({ schema_version: '1.0.0', run_id: runId, skill: 'si-trace', created_at: stage.created_at, source_revision: trace.meta.source_revision, status, inputs: stage.inputs,
    evidence: [{ path: 'evidence/trace.json', level: 2, description: '에이전트가 소스로 확인·보완한 연결 그래프' }, { path: 'evidence/review.json', level: 2, description: '원문 확인 파일·숨은 경로·실제 분기 기록' }],
    unverified: [...new Set([...review.unverified, ...(!trace.meta.source_revision ? ['Git revision을 얻지 못함'] : [])])], next_actions: review.next_actions });
  const errors = validateManifest(manifest); if (errors.length) throw new Error('실행 manifest 검증 실패');
  await save(path.join(dir, 'report.md'), renderReport(sanitize(trace), sanitize(review), status));
  await save(path.join(dir, 'manifest.json'), manifest, { exclusive: false });
  return { run_id: runId, status, directory: dir, reviewed_connections: trace.edges.length };
}
