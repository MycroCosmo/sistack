import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { root, isMain, cli } from './common.mjs';
import { inside, json, save } from '../lib/trace/io.mjs';
import { proposalPaths } from '../lib/debug/proposal.mjs';
import { verifyProposal } from './verify-debug-proposal.mjs';

const ignored = new Set(['.git', '.sistack', 'target', 'node_modules', '.agents', '.claude']);
async function providedFiles(base, prefix = '') {
  const result = [];
  for (const entry of await readdir(path.join(base, prefix), { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('비교 대상 링크 금지');
    const file = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory() && !ignored.has(entry.name)) result.push(...await providedFiles(base, file));
    else if (entry.isFile()) result.push(file);
  }
  return result;
}

// v5 비교기는 보존한다. 새 결과만 만들고 사람의 판정은 자동 비교와 분리한다.
export async function rejudgeProposal(runDir, scoreFile, { reference, outputDir, humanApproval,
  privateRoot = path.join(root, 'evals/private') } = {}) {
  await inside(privateRoot, path.relative(path.resolve(privateRoot), path.resolve(outputDir)).replaceAll('\\', '/'));
  const comparisonFile = path.join(outputDir, 'all-files-comparison.json');
  const raw = await verifyProposal(runDir, scoreFile, { dataset: 'held-out', reference, privateRoot, output: comparisonFile });
  if (raw.status === 'UNRESOLVED') throw new Error('수정안이 없어 재판정할 수 없습니다');
  const diagnosis = await json(path.join(runDir, 'evidence/diagnosis.json'));
  const project = path.resolve(runDir, '../../..');
  const scope = [...new Set([...await providedFiles(project), ...proposalPaths(diagnosis.proposal.diff)])].sort();
  const different = raw.different_files.filter(file => scope.includes(file));
  const excluded = raw.different_files.filter(file => !scope.includes(file));
  const automatic = raw.applied_to_temporary_copy && !different.length ? 'EXACT' : 'FAIL';
  if (humanApproval && (automatic !== 'FAIL' || !raw.applied_to_temporary_copy ||
    humanApproval.decision !== 'EQUIVALENT' || humanApproval.run_id !== raw.run_id ||
    humanApproval.proposal_sha256 !== raw.proposal_sha256 ||
    JSON.stringify(humanApproval.different_files) !== JSON.stringify(different) ||
    !humanApproval.approver?.trim() || !humanApproval.reason?.trim() ||
    !humanApproval.source?.trim() || !Number.isFinite(Date.parse(humanApproval.approved_at)))) {
    throw new Error('동등 수정 승인에는 적용된 제안·차이 범위와 일치하는 사람의 승인자·사유·일시·출처가 필요합니다');
  }
  const result = {
    policy: 'provided-project-and-proposal-v1', run_id: raw.run_id,
    status: humanApproval ? 'EQUIVALENT' : automatic, automatic_verdict: automatic,
    human_approval: humanApproval ?? null,
    comparison_scope: 'provided project files + proposal targets; generated directories excluded as in v5',
    compared_files: scope.length, compared_paths: scope, different_files: different,
    excluded_original_files: excluded,
    exclusion_reason: '제공 project/에 없는 출제 원본 파일은 비교 제외',
    normalization: 'CRLF→LF only', applied_to_temporary_copy: raw.applied_to_temporary_copy,
    project_unchanged: raw.project_unchanged, diagnosis_sha256: raw.diagnosis_sha256,
    score_sha256: raw.score_sha256, proposal_sha256: raw.proposal_sha256,
    all_files_comparison: 'all-files-comparison.json', verified_at: new Date().toISOString()
  };
  await save(path.join(outputDir, 'rejudgment.json'), result);
  return result;
}

if (isMain(import.meta.url)) await cli(async () => {
  const [run, score, reference, outputDir, approvalFile] = process.argv.slice(2);
  const result = await rejudgeProposal(run, score, { reference, outputDir,
    ...(approvalFile ? { humanApproval: await json(approvalFile) } : {}) });
  console.log(JSON.stringify({ status: result.status, automatic_verdict: result.automatic_verdict }));
});
