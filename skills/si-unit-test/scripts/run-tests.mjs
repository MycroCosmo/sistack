import { runTests } from './lib/unit/run.mjs';
import { json } from './lib/trace/io.mjs';
import { mask } from './lib/mask/index.mjs';
try {
  if (process.argv.length !== 4) throw new Error('사용법: run-tests.mjs <project> <config.json>');
  const { result } = await runTests(process.argv[2], await json(process.argv[3]));
  console.log(JSON.stringify({ status: result.status, execution_status: result.execution_status, summary: result.summary }));
  if (result.status !== 'PASS') process.exitCode = 1;
} catch (e) { console.error(mask(e.code || e.message)); process.exitCode = 1; }
