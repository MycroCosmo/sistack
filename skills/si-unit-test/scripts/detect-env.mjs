import { detectEnvironment } from './lib/unit/env.mjs';
import { mask } from './lib/mask/index.mjs';
try {
  if (process.argv.length !== 3) throw new Error('사용법: detect-env.mjs <project>');
  console.log(JSON.stringify(await detectEnvironment(process.argv[2]), null, 2));
} catch (e) { console.error(mask(e.code || e.message)); process.exitCode = 1; }
