import { generateCoverage } from './lib/unit/generate.mjs';
import { json } from './lib/trace/io.mjs';
import { mask } from './lib/mask/index.mjs';
import { fileURLToPath } from 'node:url';
try {
  if (process.argv.length !== 5) throw new Error('사용법: generate-tests.mjs <정상 프로젝트> <새 출력 폴더> <생성 설정.json>');
  const { plan } = await generateCoverage(process.argv[2], process.argv[3], { templateDirectory: fileURLToPath(new URL('../templates/final/', import.meta.url)), ...await json(process.argv[4]) });
  console.log(JSON.stringify({ planned: plan.items.length, generated: plan.items.filter(i => i.tests.length).length, unresolved: plan.items.filter(i => i.unresolved).length }));
} catch (e) { console.error(mask(e.code || e.message)); process.exitCode = 1; }
