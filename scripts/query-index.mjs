import { readFile } from 'node:fs/promises';
import { cli, isMain } from './common.mjs';
import { sanitize } from '../lib/indexer/graph.mjs';
import { queryIndex, queryText } from '../lib/indexer/query.mjs';

if (isMain(import.meta.url)) await cli(async () => {
  const args = process.argv.slice(2), file = args.shift(), options = {}; let format = 'json';
  if (!file) throw new Error('사용법: query-index.mjs <index.json> --from 값|--to 값 [--depth N] [--format text|json]');
  while (args.length) {
    const key = args.shift(), value = args.shift();
    if (!value) throw new Error('옵션 값 누락');
    if (key === '--from' || key === '--to') options[key.slice(2)] = value;
    else if (key === '--depth') options.depth = Number(value);
    else if (key === '--format' && ['text', 'json'].includes(value)) format = value;
    else throw new Error('알 수 없는 옵션');
  }
  const result = sanitize(queryIndex(JSON.parse(await readFile(file, 'utf8')), options));
  console.log(format === 'text' ? queryText(result) : JSON.stringify(result, null, 2));
});
