import path from 'node:path';
import { mkdir, cp } from 'node:fs/promises';
import { extractPrograms, extractTables } from '../lib/docs/extract.mjs';
import { createDefaultTemplate, proposeMapping } from '../lib/docs/workbook.mjs';
import { fillRun } from '../lib/docs/run.mjs';
import { save } from '../lib/trace/io.mjs';
import { richTemplate } from '../test/helpers/docs-fixture.mjs';

const [project, output, prefix] = process.argv.slice(2);
if (!project || !output || !/^[A-Za-z0-9_-]+$/.test(prefix ?? '')) throw new Error('사용법: node scripts/demo-docs.mjs project new-output run-prefix');
await mkdir(output); await mkdir(path.join(output, 'templates'));
const programs = await extractPrograms(project);
const tables = await extractTables(project, ['src/main/resources/db/oracle/ddl.sql'], programs.source_revision);
const summary = { source_revision: programs.source_revision, documents: {}, scope: '공개 합성 테스트베드. 사용자 실제 양식 미검증; 실제 Excel 표시/재계산 미검증' };
for (const doc of [programs, tables]) {
  const template = path.join(output, 'templates', `${doc.kind}.xlsx`);
  const base = await createDefaultTemplate(doc.kind, template);
  const draft = await proposeMapping(doc.kind, base.template, base.sheet, 4, 5, 204);
  await save(path.join(output, 'templates', `${doc.kind}.mapping.draft.json`), { ...draft, template: '<원본 양식 절대 경로>' });
  // 사용자 승인 범위의 기본 양식 시연. 실제 사용자 양식의 확인을 대체하지 않는다.
  const result = await fillRun(project, doc, { ...draft, confirmed: true }, `${prefix}-${doc.kind}`);
  await cp(result.run, path.join(output, doc.kind), { recursive: true, errorOnExist: true });
  summary.documents[doc.kind] = { rows: result.rows, status: result.status, preserved: result.preserved, values_verified: result.values_verified, original_unchanged: result.original_unchanged, missing: result.missing.length };
}
const fixtureDir = path.join(output, 'roundtrip'); await mkdir(fixtureDir);
const rich = await richTemplate(fixtureDir), roundtrip = await fillRun(project, tables, rich, `${prefix}-roundtrip`);
await cp(roundtrip.run, path.join(fixtureDir, 'run'), { recursive: true, errorOnExist: true });
summary.roundtrip = { preserved: roundtrip.preserved, values_verified: roundtrip.values_verified, original_unchanged: roundtrip.original_unchanged, features: roundtrip.template_features, warnings: roundtrip.warnings };
await save(path.join(output, 'summary.json'), summary);
console.log(JSON.stringify(summary, null, 2));
