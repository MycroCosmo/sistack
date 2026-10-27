import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { cli, isMain } from './common.mjs';
import { sanitize } from '../lib/indexer/graph.mjs';
import { evalIndex } from '../lib/indexer/eval.mjs';

if (isMain(import.meta.url)) await cli(async () => {
  const args = process.argv.slice(2), indexFile = args.shift(), expectedFile = args.shift();
  const draft = args.includes('--draft');
  if (!indexFile || !expectedFile || args.some(a => a !== '--draft')) throw new Error('사용법: eval-index.mjs <index.json> <expected.json|expected.draft.json> [--draft]');
  if (path.basename(expectedFile).includes('.draft.') && !draft) throw new Error('expected.draft는 --draft로만 실행할 수 있습니다');
  let index, expected;
  try { [index, expected] = await Promise.all([indexFile, expectedFile].map(async f => JSON.parse(await readFile(f, 'utf8')))); }
  catch { throw new Error('인덱스/정답 JSON을 읽을 수 없습니다'); }
  const result = sanitize(evalIndex(index, expected, { draft }));
  console.log(JSON.stringify(result, null, 2));
  if (result.status === 'FAIL') process.exitCode = 1;
});
