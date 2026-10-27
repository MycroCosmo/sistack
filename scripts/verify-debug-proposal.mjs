import path from 'node:path';
import os from 'node:os';
import { readFile, readdir, mkdir, mkdtemp, copyFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { root, isMain, cli } from './common.mjs';
import { json, save, digest, inside, checkSources } from '../lib/trace/io.mjs';
import { proposalPaths } from '../lib/debug/proposal.mjs';

const ignored = new Set(['.git', '.sistack', 'target', 'node_modules', '.agents', '.claude']);
async function files(base, prefix = '') {
  const result = [];
  for (const entry of await readdir(path.join(base, prefix), { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('비교 대상 링크 금지');
    const file = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory() && !ignored.has(entry.name)) result.push(...await files(base, file));
    else if (entry.isFile()) result.push(file);
  }
  return result.sort();
}
const normalized = bytes => new TextDecoder('utf-8', { fatal: true }).decode(bytes).replaceAll('\r\n', '\n');
async function snapshot(base) {
  return Object.fromEntries(await Promise.all((await files(base)).map(async file => [file, digest(normalized(await readFile(await inside(base, file))))])));
}
async function copy(base, dest) {
  await mkdir(dest);
  for (const file of await files(base)) {
    const target = await inside(dest, file); await mkdir(path.dirname(target), { recursive: true });
    await copyFile(await inside(base, file), target);
  }
}
function apply(base, patch, reverse = false) {
  for (const check of [true, false]) {
    const p = spawnSync('git', ['-c', 'core.autocrlf=false', 'apply', ...(check ? ['--check'] : []), ...(reverse ? ['--reverse'] : []), '--ignore-space-change', patch], { cwd: base, windowsHide: true, encoding: 'utf8', timeout: 15000 });
    if (p.status !== 0) return false;
  }
  return true;
}

export async function verifyProposal(runDir, scoreFile, { dataset, bugPatch, reference, output, privateRoot = path.join(root, 'evals/private') } = {}) {
  if (!['training', 'held-out'].includes(dataset) || !output) throw new Error('dataset/output 필요');
  if (dataset === 'held-out') for (const file of [runDir, scoreFile, output]) await inside(privateRoot, path.relative(path.resolve(privateRoot), path.resolve(file)).replaceAll('\\', '/'));
  // 기준 원본은 보존 진단과 일치하는 채점 결과를 확인한 뒤에만 읽는다.
  let score;
  try { score = await json(scoreFile); } catch { throw new Error('진단 보존·채점 후에만 수정안 정합성을 검증합니다'); }
  const diagnosisFile = path.join(runDir, 'evidence/diagnosis.json');
  const diagnosis = await json(diagnosisFile), manifest = await json(path.join(runDir, 'manifest.json'));
  if (score.dataset !== dataset || score.run_id !== manifest.run_id || !Number.isFinite(Date.parse(score.scored_at)) || score.diagnosis_sha256 !== digest(await readFile(diagnosisFile)) || score.report_sha256 !== digest(await readFile(path.join(runDir, 'report.md')))) throw new Error('채점 시 보존한 진단·보고서와 일치하지 않습니다');
  const diff = diagnosis.proposal.diff;
  if (!diff.trim()) {
    if (diagnosis.candidates.some(c => c.status !== 'UNRESOLVED')) throw new Error('UNRESOLVED 외에는 diff 보류 금지');
    const result = { status: 'UNRESOLVED', run_id: manifest.run_id, reason: '원인 미확정으로 diff 보류. 정합성 분모에서 제외', score_sha256: digest(await readFile(scoreFile)) };
    await save(output, result); return result;
  }
  const project = path.resolve(runDir, '../../..'), stage = await json(path.join(runDir, 'evidence/stage.json'));
  await checkSources(project, stage.source_files);
  for (const file of proposalPaths(diff)) {
    await inside(project, file);
    if (!Object.hasOwn(stage.source_files, file)) throw new Error('diff 경로가 검토 소스 범위 밖입니다');
  }
  const before = await snapshot(project), temporary = await mkdtemp(path.join(os.tmpdir(), 'sistack-proposal-'));
  try {
    const proposed = path.join(temporary, 'proposed'); await copy(project, proposed);
    const patch = path.join(temporary, 'proposal.patch'); await save(patch, diff.endsWith('\n') ? diff : diff + '\n');
    const applied = apply(proposed, patch);
    let baseline;
    if (dataset === 'training') {
      if (!bugPatch) throw new Error('학습 bug.patch 필요');
      const originalPatch = await readFile(bugPatch, 'utf8'); proposalPaths(originalPatch);
      baseline = path.join(temporary, 'reversed'); await copy(project, baseline);
      const patchFile = path.join(temporary, 'bug.patch'); await save(patchFile, originalPatch);
      if (!apply(baseline, patchFile, true)) throw new Error('bug.patch 역적용 실패');
    } else {
      if (!reference) throw new Error('출제 원본 경로 필요');
      baseline = path.resolve(reference);
    }
    const actual = await snapshot(proposed), expected = await snapshot(baseline);
    const different = [...new Set([...Object.keys(actual), ...Object.keys(expected)])].filter(file => actual[file] !== expected[file]).sort();
    if (JSON.stringify(before) !== JSON.stringify(await snapshot(project))) throw new Error('분석 프로젝트가 변경됐습니다');
    await checkSources(project, stage.source_files);
    const result = { status: applied && !different.length ? 'PASS' : 'FAIL', run_id: manifest.run_id, applied_to_temporary_copy: applied,
      comparison: dataset === 'training' ? 'bug.patch reverse' : 'author original', normalization: 'CRLF→LF only; all other characters and file sets exact',
      compared_files: Object.keys(expected).length, different_files: different, project_unchanged: true,
      diagnosis_sha256: score.diagnosis_sha256, score_sha256: digest(await readFile(scoreFile)), proposal_sha256: digest(diff), verified_at: new Date().toISOString() };
    await save(output, result); return result;
  } finally {
    if (path.dirname(temporary) !== path.resolve(os.tmpdir()) || !path.basename(temporary).startsWith('sistack-proposal-')) throw new Error('임시 경로 범위 오류');
    await rm(temporary, { recursive: true, force: true });
  }
}

if (isMain(import.meta.url)) await cli(async () => {
  const [runDir, scoreFile, dataset, baseline, output] = process.argv.slice(2);
  console.log(JSON.stringify(await verifyProposal(runDir, scoreFile, { dataset, output, ...(dataset === 'training' ? { bugPatch: baseline } : { reference: baseline }) }), null, 2));
});
