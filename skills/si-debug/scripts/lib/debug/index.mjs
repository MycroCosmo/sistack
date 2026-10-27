import path from 'node:path';
import { readFile, mkdir, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseTrace } from './parse.mjs';
import { buildIndex } from '../indexer/index.mjs';
import { queryIndex } from '../indexer/query.mjs';
import { sanitize } from '../indexer/graph.mjs';
import { mask } from '../mask/index.mjs';
import { validateManifest } from '../manifest/index.mjs';
import { noLinks, inside, json, save, digest, checkSources } from '../trace/io.mjs';
import { proposalPaths } from './proposal.mjs';

export const disclaimer = '> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.';
const runPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;
export async function debugFingerprint() {
  const base = fileURLToPath(new URL('../', import.meta.url)), entries = [];
  for (const group of ['debug', 'indexer', 'mask', 'manifest', 'trace']) {
    for (const name of (await readdir(path.join(base, group))).sort()) if (name.endsWith('.mjs')) entries.push([`${group}/${name}`, digest(await readFile(path.join(base, group, name)))]);
  }
  return digest(JSON.stringify(entries));
}

export async function prepareDebug(target, { log = '', symptom = '', packagePrefix = '', starts = [], runId = `debug-${randomUUID()}` } = {}) {
  if (!runPattern.test(runId) || (!log.trim() && !symptom.trim()) || !Array.isArray(starts) || starts.some(s => typeof s !== 'string')) throw new Error('로그 또는 증상과 유효한 run-id/시작점이 필요합니다');
  const root = path.resolve(target); await noLinks(root);
  const parsed = parseTrace(log, { packagePrefix }), index = await buildIndex(root);
  const mapped = parsed.project_frames.map(frame => {
    const classPath = frame.class.split('$$')[0].split('$')[0].replaceAll('.', '/') + '.java';
    const candidates = Object.keys(index.meta.source_files).filter(f => f.endsWith('/' + classPath) || f === classPath);
    return { ...frame, candidates: candidates.map(file => ({ file, line: frame.line })), status: 'UNRESOLVED' };
  });
  const queries = [], missing = [];
  for (const start of [...new Set([...starts, ...mapped.map(f => `${f.class.split('$$')[0].split('$')[0]}.${f.method}`)])]) {
    try { queries.push(queryIndex(index, { from: start })); }
    catch (e) { if (e.message !== '시작 노드를 찾지 못했습니다') throw e; missing.push(start); }
  }
  const dir = await inside(root, `.sistack/runs/${runId}`);
  await mkdir(path.dirname(dir), { recursive: true }); await mkdir(dir);
  const stage = sanitize({ run_id: runId, created_at: new Date().toISOString(), tool_fingerprint: await debugFingerprint(),
    source_revision: index.meta.source_revision, source_files: index.meta.source_files,
    inputs: { symptom: mask(symptom), starts: JSON.stringify(starts), package_prefix: packagePrefix }, missing_starts: missing });
  await save(path.join(dir, 'evidence/log.txt'), parsed.text);
  await save(path.join(dir, 'evidence/parsed.json'), { ...parsed, text: undefined, mapped_frames: mapped });
  await save(path.join(dir, 'evidence/index.json'), index);
  await save(path.join(dir, 'evidence/queries.json'), queries);
  await save(path.join(dir, 'evidence/stage.json'), stage);
  const manifest = { schema_version: '1.0.0', run_id: runId, skill: 'si-debug', created_at: stage.created_at,
    source_revision: stage.source_revision, status: 'PARTIAL', inputs: stage.inputs,
    evidence: [{ path: 'evidence/parsed.json', level: 2, description: '마스킹한 로그의 예외·프레임 후보. 소스 원인 검토 전' }],
    unverified: ['원인 후보 소거·재현 미실행'], next_actions: ['원문을 확인하고 evidence/diagnosis.json 작성 후 finish 실행'] };
  await save(path.join(dir, 'manifest.json'), manifest);
  await save(path.join(dir, 'draft-report.md'), `${disclaimer}\n\n# si-debug 준비\n\nPARTIAL: 원인 검토 전. 후보 프레임 ${mapped.length}개, 예외 ${parsed.exceptions.length}개.\n`);
  return { run_id: runId, directory: dir, status: 'PARTIAL', project_frames: mapped.length, exceptions: parsed.exceptions.length };
}

const strings = v => Array.isArray(v) && v.length > 0 && v.every(x => typeof x === 'string' && x.trim());
export async function finishDebug(target, runId) {
  if (!runPattern.test(runId)) throw new Error('run-id 오류');
  const root = path.resolve(target), dir = await inside(root, `.sistack/runs/${runId}`);
  const stage = await json(path.join(dir, 'evidence/stage.json'));
  if (stage.tool_fingerprint !== await debugFingerprint()) throw new Error('도구 변경: 새 run이 필요합니다');
  const diagnosis = await json(path.join(dir, 'evidence/diagnosis.json'));
  if (diagnosis.source_reviewed !== true || typeof diagnosis.symptom !== 'string' || !diagnosis.symptom.trim() || !Array.isArray(diagnosis.candidates) || !diagnosis.candidates.length) throw new Error('소스 검토와 증상·후보가 필요합니다');
  for (const key of ['eliminated', 'verification', 'unverified', 'next_actions', 'same_pattern']) if (!strings(diagnosis[key])) throw new Error('소거/검증/미확정/다음 확인/동일 패턴 기록 누락');
  const points = [];
  for (const c of diagnosis.candidates) {
    if (!['CONFIRMED', 'LIKELY', 'UNRESOLVED'].includes(c.status) || !c.cause?.trim() || !c.reason?.trim() || !Number.isInteger(c.level) || c.level < 1 || c.level > 5 || !Array.isArray(c.locations)) throw new Error('후보 계약 오류');
    if (!strings(c.identifiers) || c.identifiers.some(id => !c.cause.includes(id))) throw new Error('원인 문장에 불일치하는 실제 식별자·값을 그대로 기록하세요');
    if ((c.level >= 2 && !c.locations.length) || (c.status === 'CONFIRMED' && c.level < 2)) throw new Error('근거 없는 원인 확정 금지');
    if (c.level >= 4 && !diagnosis.reproduction?.executed) throw new Error('실행 없이 증거 단계 상향 금지');
    points.push(...c.locations);
  }
  if (diagnosis.candidates.some(c => c.status === 'CONFIRMED') && diagnosis.candidates.length > 1) throw new Error('미소거 후보가 있으면 원인을 확정하지 마세요');
  await checkSources(root, stage.source_files, points);
  const repro = diagnosis.reproduction;
  if (!repro || typeof repro.executed !== 'boolean' || !repro.note?.trim()) throw new Error('재현 여부·제한 필요');
  if (repro.executed) {
    if (!repro.command?.trim() || !repro.artifact?.startsWith('evidence/') || repro.artifact === 'evidence/diagnosis.json') throw new Error('재현 명령·독립 실행 증거 필요');
    const proof = await readFile(await inside(dir, repro.artifact), 'utf8');
    if (!proof.trim()) throw new Error('빈 재현 증거');
    await save(path.join(dir, 'evidence/reproduction.txt'), mask(proof));
  }
  if (!diagnosis.proposal || typeof diagnosis.proposal.diff !== 'string' || !diagnosis.proposal.note?.trim()) throw new Error('diff 또는 제안 보류 이유 필요');
  if (!diagnosis.proposal.diff.trim() && diagnosis.candidates.some(c => c.status !== 'UNRESOLVED')) throw new Error('UNRESOLVED 외에는 구체적 수정 diff가 필요합니다');
  if (diagnosis.proposal.diff.trim()) for (const file of proposalPaths(diagnosis.proposal.diff)) {
    await inside(root, file);
    if (!Object.hasOwn(stage.source_files, file)) throw new Error('diff 대상은 검토한 소스 파일이어야 합니다');
  }
  const status = diagnosis.candidates.some(c => c.status === 'CONFIRMED') ? 'PASS' : 'PARTIAL';
  const safe = sanitize(diagnosis);
  // 입력 검토 파일도 마스킹하며 최종 결과는 exclusive 저장한다.
  await save(path.join(dir, 'evidence/diagnosis.json'), safe, { exclusive: false });
  const report = `${disclaimer}\n\n# si-debug\n\n상태: ${status} (원인 분석 범위). 수정 적용 없음.\n\n## 증상 요약\n${safe.symptom}\n\n## 원인\n${safe.candidates.map(c => `- ${c.status} · 증거 ${c.level}단계 · ${c.cause}\n  ${c.locations.map(p => `${p.file}:${p.line}`).join(', ') || '위치 미확정'}\n  ${c.reason}`).join('\n')}\n\n재현: ${safe.reproduction.executed ? '실행' : '미재현'} — ${safe.reproduction.note}\n\n## 원인까지의 경로\n${safe.eliminated.join('\n')}\n\n## 수정안\n${safe.proposal.note}\n\n\`\`\`diff\n${safe.proposal.diff}\n\`\`\`\n\n동일 패턴 확인: ${safe.same_pattern.join('; ')}\n\n## 확인 방법\n${safe.verification.join('\n')}\n\n## 확정 못 한 것\n${safe.unverified.join('\n')}\n\n## 다음 작업\n${safe.next_actions.join('\n')}\n`;
  const manifest = sanitize({ schema_version: '1.0.0', run_id: runId, skill: 'si-debug', created_at: stage.created_at, source_revision: stage.source_revision,
    status, inputs: stage.inputs, evidence: [{ path: 'evidence/diagnosis.json', level: Math.max(...safe.candidates.map(c => c.level)), description: '소스 검토·후보 소거와 재현 한계' }],
    unverified: [...new Set(safe.unverified)], next_actions: [...new Set(safe.next_actions)] });
  if (validateManifest(manifest).length) throw new Error('manifest 계약 오류');
  await save(path.join(dir, 'report.md'), mask(report));
  await save(path.join(dir, 'manifest.json'), manifest, { exclusive: false });
  return { run_id: runId, status, directory: dir };
}
