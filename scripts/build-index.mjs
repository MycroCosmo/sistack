import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { cli, isMain, noLinks } from './common.mjs';
import { buildIndex, summarize } from '../lib/indexer/index.mjs';

if (isMain(import.meta.url)) await cli(async () => {
  const args = process.argv.slice(2), target = args.shift();
  if (!target || target.startsWith('--')) throw new Error('사용법: build-index.mjs <대상경로> [--out 파일] [--summary] [--force]');
  let out = path.join(path.resolve(target), '.sistack/index/index.json'), summary = false, force = false;
  while (args.length) {
    const arg = args.shift();
    if (arg === '--out' && args[0] && !args[0].startsWith('--')) out = path.resolve(args.shift());
    else if (arg === '--summary') summary = true;
    else if (arg === '--force') force = true;
    else throw new Error('알 수 없거나 값이 없는 옵션');
  }
  await noLinks(out);
  if (!out.endsWith('.json')) throw new Error('출력은 JSON 파일이어야 합니다');
  const index = await buildIndex(target);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(index, null, 2) + '\n', { flag: force ? 'w' : 'wx' });
  if (summary) console.log(JSON.stringify(summarize(index), null, 2));
  else console.log(JSON.stringify(index));
});
