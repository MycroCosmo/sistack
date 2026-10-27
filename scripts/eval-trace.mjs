import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { cli, isMain, root } from './common.mjs';
import { evalIndex } from '../lib/indexer/eval.mjs';
import { sanitize } from '../lib/indexer/graph.mjs';
import { validateManifest } from '../lib/manifest/index.mjs';
import { json, save, digest } from '../lib/trace/io.mjs';
import { checkExpected } from './check-expected.mjs';

export async function evalTrace(runDir, expectedFile, { dataset, output, registry = path.join(root, 'evals/trace/datasets.json') } = {}) {
  const sets = await json(registry), expected = await json(expectedFile);
  if (!['training', 'held-out'].includes(dataset) || !sets[dataset]?.includes(expected.case_id)) throw new Error('평가 세트에 등록된 사례가 아닙니다');
  if (!output) throw new Error('기존 결과를 덮어쓰지 않을 출력 경로가 필요합니다');
  await checkExpected(expected);
  const manifest = await json(path.join(runDir, 'manifest.json'));
  if (manifest.skill !== 'si-trace' || validateManifest(manifest).length) throw new Error('si-trace manifest 계약 오류');
  const trace = await json(path.join(runDir, 'evidence/trace.json')), review = await json(path.join(runDir, 'evidence/review.json'));
  const stage = await json(path.join(runDir, 'evidence/stage.json'));
  const report = await readFile(path.join(runDir, 'report.md'), 'utf8');
  if (!review.source_reviewed || !report.includes('## 함정') || !report.startsWith('> AI의 PASS는 PL/PM')) throw new Error('스킬 실행·소스 검토·보고서가 완료되지 않았습니다');
  const score = evalIndex(trace, expected);
  const record = sanitize({ dataset, case_id: expected.case_id, recorded_at: new Date().toISOString(), run_id: manifest.run_id,
    tool_fingerprint: stage.tool_fingerprint, expected_sha256: digest(await readFile(expectedFile)), report_sha256: digest(report),
    caveat: '에이전트 자기 적용 평가. training은 M1 수정에 사용한 사례다. held-out은 승인 후 첫 실행 원본을 별도 보존하고 후속 수정 결과와 합산하지 않는다.',
    score, raw: { trace, review, manifest, report } });
  await save(output, record); // 첫 결과든 후속 결과든 기존 기록은 덮어쓰지 않는다.
  const summary = s => ({ status: s.status, expected: s.expected_edges, matched: s.matched, false_negatives: s.false_negatives.length,
    false_positives: s.false_positives.length, status_mismatches: s.status_mismatches.length });
  return { dataset, case_id: expected.case_id, status: score.status,
    ...(score.groups ? { groups: Object.fromEntries(Object.entries(score.groups).map(([group, s]) => [group, { ...summary(s), applicable: s.applicable }])) } : summary(score)), output };
}

if (isMain(import.meta.url)) await cli(async () => {
  const [runDir, expected, ...args] = process.argv.slice(2), options = {};
  while (args.length) {
    const key = args.shift(), value = args.shift();
    if (!['--dataset', '--output'].includes(key) || !value || options[key.slice(2)]) throw new Error('사용법: eval-trace.mjs <run-dir> <expected.json> --dataset training|held-out --output <새 결과.json>');
    options[key.slice(2)] = value;
  }
  const result = await evalTrace(runDir, expected, options); console.log(JSON.stringify(result, null, 2));
  if (result.status === 'FAIL') process.exitCode = 1;
});
