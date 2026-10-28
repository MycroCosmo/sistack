import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseSurefire } from './lib/unit/results.mjs';
import { json } from './lib/trace/io.mjs';
import { mask } from './lib/mask/index.mjs';
try {
  if (process.argv.length !== 4) throw new Error('사용법: surefire-to-json.mjs <report.xml> <plan.json>');
  console.log(JSON.stringify(parseSurefire(await readFile(process.argv[2], 'utf8'), await json(process.argv[3]), path.basename(process.argv[2])), null, 2));
} catch (e) { console.error(mask(e.code || e.message)); process.exitCode = 1; }
