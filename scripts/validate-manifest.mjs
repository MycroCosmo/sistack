import { readFile } from 'node:fs/promises';
import { cli, isMain } from './common.mjs';
import { validateManifest } from '../lib/manifest/index.mjs';
export { validateManifest, schema } from '../lib/manifest/index.mjs';

if (isMain(import.meta.url)) await cli(async () => {
  if (process.argv.length !== 3) throw new Error('사용법: node scripts/validate-manifest.mjs <path>');
  let value;
  try { value = JSON.parse(await readFile(process.argv[2], 'utf8')); }
  catch { throw new Error('manifest JSON을 읽을 수 없습니다'); }
  const errors = validateManifest(value);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('PASS: manifest');
});
