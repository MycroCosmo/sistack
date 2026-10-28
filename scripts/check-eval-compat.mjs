import {readEvidenceBytes} from '../lib/evidence-assets.mjs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { evalIndex } from '../lib/indexer/eval.mjs';
import { checkExpected } from './check-expected.mjs';
import { cli, isMain, root } from './common.mjs';
import { digest, json, save } from '../lib/trace/io.mjs';

export async function checkEvalCompatibility(reference, output) {
  const oldSource = execFileSync('git', ['show', `${reference}:lib/indexer/eval.mjs`], { cwd: root, encoding: 'utf8', windowsHide: true });
  const moduleSource = oldSource.replace(/(['"])\.\/([^'"]+)\1/g, (_,quote,name)=>JSON.stringify(new URL('../lib/indexer/'+name,import.meta.url).href));
  const previous = await import('data:text/javascript;base64,' + Buffer.from(moduleSource).toString('base64'));
  const summary = await json(path.join(root, 'docs/evidence/m2-v2/results.json'));
  const archive = await readEvidenceBytes(path.join(root, summary.archive.path));
  if (digest(archive) !== summary.archive.sha256) throw new Error('보존 원본 압축 해시 불일치');
  const snapshot = JSON.parse(gunzipSync(archive));
  const metrics = score => ({ status: score.status, expected: score.expected_edges, matched: score.matched,
    false_negatives: score.false_negatives, false_positives: score.false_positives, status_mismatches: score.status_mismatches });
  const results = [];
  for (const entry of summary.results) {
    const item = snapshot.files[entry.output];
    if (!item || digest(item.utf8) !== item.sha256) throw new Error('보존 실행 파일 해시 불일치');
    const trace = JSON.parse(item.utf8).raw.trace;
    const expected = await json(path.join(root, `evals/trace/${entry.case_id}/expected.json`));
    await checkExpected(expected);
    const before = metrics(previous.evalIndex(trace, expected)), after = metrics(evalIndex(trace, expected));
    results.push({ case_id: entry.case_id, dataset: entry.dataset, unchanged: isDeepStrictEqual(before, after), before, after });
  }
  const result = { reference, comparator_sha256: digest(oldSource), status: results.every(r => r.unchanged) ? 'PASS' : 'FAIL',
    method: '보존된 v2-final trace와 현재 승인 정답을 이전/현재 비교기에 동일하게 입력. 전체 누락·과탐·상태 불일치 배열까지 비교. 새 앱/수집기 실행이 아님.', results };
  await save(output, result);
  return { status: result.status, cases: results.length, unchanged: results.filter(r => r.unchanged).length, output };
}

if (isMain(import.meta.url)) await cli(async () => {
  const [reference, output, ...extra] = process.argv.slice(2);
  if (!reference || !output || extra.length) throw new Error('사용법: check-eval-compat.mjs <수정 전 git-ref> <새 결과.json>');
  const result = await checkEvalCompatibility(reference, output);
  console.log(JSON.stringify(result, null, 2));
  if (result.status === 'FAIL') process.exitCode = 1;
});
