import { json, save } from '../trace/io.mjs';
import { buildIndex } from '../indexer/index.mjs';
import { extractPrograms, extractTables } from './extract.mjs';
import { createDefaultTemplate, proposeMapping } from './workbook.mjs';
import { fillRun } from './run.mjs';

export async function main(args = process.argv.slice(2)) {
  const [command, ...rest] = args;
  if (command === 'extract-program-list' && [2,3,4].includes(rest.length)) {
    const doc = await extractPrograms(rest[0], {rowMode:rest[2]??'separate',settingsFile:rest[3]??'sistack-docs.json'}); await save(rest[1], doc); return `${doc.rows.length}행 추출`;
  }
  if (command === 'extract-table-spec' && rest.length === 3) {
    const index = await buildIndex(rest[0]);
    const doc = await extractTables(rest[0], await json(rest[1]), index.meta.source_revision); await save(rest[2], doc); return `${doc.rows.length}행 추출`;
  }
  if (command === 'default-template' && rest.length === 3) {
    const mapping = await createDefaultTemplate(rest[0], rest[1]); await save(rest[2], { ...mapping, confirmed: false }); return '기본 양식과 미확인 매핑 생성';
  }
  if (command === 'propose-mapping' && rest.length === 7) {
    const [kind, template, sheet, header, start, end, output] = rest;
    await save(output, await proposeMapping(kind, template, sheet, +header, +start, +end)); return '헤더 매핑 초안 생성: 확인 후 confirmed=true로 승인';
  }
  if (command === 'fill-template' && [4,5].includes(rest.length)) {
    const result = await fillRun(rest[0], await json(rest[1]), await json(rest[2]), rest[3], rest[4]?{settingsFile:rest[4]}:{}); return `${result.status}: ${result.rows}행 (${result.run})`;
  }
  throw new Error('사용법: si-docs.mjs extract-program-list project output.json [separate|endpoint] [settings-relative-path] | extract-table-spec project sources.json output.json | default-template kind output.xlsx mapping.json | propose-mapping kind template sheet header start end mapping.json | fill-template project data.json mapping.json run-id [settings-relative-path]');
}
