import { readFile } from 'node:fs/promises';
import { parseTrace } from './lib/debug/parse.mjs';
import { mask } from './lib/mask/index.mjs';
try {
  const [file, packagePrefix = '', ...extra] = process.argv.slice(2);
  if (!file || extra.length) throw new Error('사용법: parse-trace.mjs <log-file> [project.package]');
  console.log(JSON.stringify(parseTrace(await readFile(file, 'utf8'), { packagePrefix }), null, 2));
} catch (e) { console.error(mask(e.code ? `실패: ${e.code}` : e.message)); process.exitCode = 1; }
