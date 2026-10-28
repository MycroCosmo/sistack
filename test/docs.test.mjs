import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { extractPrograms as extractProgramsWithMode, extractTables, parseDDL, parseCSV } from '../lib/docs/extract.mjs';
import { validateDocument } from '../lib/docs/contract.mjs';
import { fillTemplate, createDefaultTemplate, readWorkbook, writeWorkbook, proposeMapping, inspectPackage } from '../lib/docs/workbook.mjs';
import { fillRun } from '../lib/docs/run.mjs';
import { digest } from '../lib/trace/io.mjs';
import { richTemplate } from './helpers/docs-fixture.mjs';

const project = path.resolve('examples/legacy-board');
const extractPrograms = root => extractProgramsWithMode(root, { rowMode: 'endpoint' });
async function temp(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'sistack-docs-'));
  t.after(() => rm(dir, { recursive: true, force: true })); return dir;
}
const tables = () => extractTables(project, ['src/main/resources/db/oracle/ddl.sql'], 'a'.repeat(40));

test('프로그램 목록은 요청별 소스 연결을 남기고 업무명·ID를 추측하지 않는다', async () => {
  const doc = await extractPrograms(project);
  assert.equal(doc.rows.length, 11, '정상 테스트베드 요청 11개가 문서에 있어야 한다');
  const list = doc.rows.find(r => r.values.url === '/board/list.do');
  assert.ok(list, '게시글 목록 요청이 있어야 한다');
  assert.match(list.values.controller, /BoardController#list/, '목록 Controller를 표시해야 한다');
  assert.match(list.values.service, /BoardService/, '호출된 Service를 표시해야 한다');
  assert.match(list.values.mapper, /selectList/, '목록 SQL 근거를 표시해야 한다');
  assert.match(list.values.screen, /board\/list.jsp/, '화면 파일 근거를 표시해야 한다');
  assert.equal(list.values.program_id, null, '사용자 프로그램 ID를 만들지 않아야 한다');
  assert.equal(list.values.program_name, null, '업무명을 추측하지 않아야 한다');
  assert.ok(list.evidence.every(e => doc.source_files[e.file] && e.line > 0), '근거는 해시가 있는 소스 라인이어야 한다');
});

test('새 기본 엑셀은 AI 안내를 넣지 않고 프로그램 참조를 클래스명.메서드명으로 표시한다', async t => {
  const dir = await temp(t);
  for (const kind of ['program-list', 'table-spec']) {
    const m = await createDefaultTemplate(kind, path.join(dir, `${kind}.xlsx`));
    const sheet = (await readWorkbook(m.template)).getWorksheet(m.sheet);
    const text = [];
    sheet.eachRow(r => r.eachCell(c => { if (typeof c.value === 'string') text.push(c.value); }));
    assert.doesNotMatch(text.join('\n'), /AI|자동화/, '기본 엑셀에 AI/자동화 안내 문구를 넣지 않아야 한다');
    if (kind === 'program-list') {
      const doc = await extractPrograms(project), i = doc.rows.findIndex(r => r.values.url === '/board/list.do');
      assert.ok(i >= 0, '게시글 목록 요청이 있어야 한다');
      await fillTemplate(doc, { ...m, confirmed: true }, path.join(dir, 'program-filled.xlsx'));
      const filled = (await readWorkbook(path.join(dir, 'program-filled.xlsx'))).getWorksheet(m.sheet);
      assert.equal(filled.getCell(`F${5 + i}`).value, 'BoardController.list', 'Controller는 클래스명.메서드명으로 표시해야 한다');
      assert.match(filled.getCell(`G${5 + i}`).value, /^BoardServiceImpl\.list$/m, 'Service는 클래스명.메서드명으로 표시해야 한다');
      assert.match(filled.getCell(`H${5 + i}`).value, /^BoardMapper\.selectList$/m, 'SQL은 네임스페이스명.SQL ID로 표시해야 한다');
      assert.match(doc.rows[i].values.controller, /kr\.sistack\.board\.web\.BoardController#list/, '분석 JSON에는 원래 식별자를 남겨야 한다');
    }
  }
});

test('DDL에서 세 테이블 열 12개와 설명·PK·FK·기본값을 도출한다', async () => {
  const doc = await tables();
  assert.equal(doc.rows.length, 12, '12개 열을 빠짐없이 추출해야 한다');
  assert.equal(new Set(doc.rows.map(r => r.values.table)).size, 3, '3개 테이블이어야 한다');
  const id = doc.rows.find(r => r.values.table === 'BOARD' && r.values.column === 'ID').values;
  assert.equal(id.primary_key, 'Y', '게시글 식별자는 기본키여야 한다');
  assert.equal(id.nullable, 'N', '기본키는 NULL을 허용하지 않아야 한다');
  assert.equal(doc.rows.find(r => r.values.column === 'CATEGORY').values.foreign_key, 'COMMON_CODE(CODE)', '분류 참조키가 보존돼야 한다');
  assert.equal(doc.rows.find(r => r.values.column === 'CREATED_AT').values.default_value, 'CURRENT_TIMESTAMP', '등록일 기본값이 보존돼야 한다');
});

test('DDL은 복합 PK·FK와 괄호/문자열 쉼표를 구별하고 ALTER 한계를 표시한다', () => {
  const { rows, unverified } = parseDDL("CREATE TABLE T (A NUMERIC(10,2), B VARCHAR(20) DEFAULT 'a,b', CONSTRAINT T_PK PRIMARY KEY(A,B), FOREIGN KEY(B) REFERENCES R(C)); ALTER TABLE T ADD C INT;", 'schema.sql');
  assert.equal(rows.length, 2, '숫자형과 기본값의 쉼표는 열 구분이 아니어야 한다');
  assert.equal(rows[0].values.data_type, 'NUMERIC(10,2)', '자리수와 소수 자릿수를 유지해야 한다');
  assert.equal(rows[1].values.default_value, "'a,b'", '문자열 기본값을 유지해야 한다');
  assert.equal(rows[1].values.primary_key, 'Y', '복합 기본키를 열에 반영해야 한다');
  assert.equal(rows[1].values.foreign_key, 'R(C)', '테이블 제약 참조키를 열에 반영해야 한다');
  assert.ok(unverified.length, 'ALTER 최종 스키마 미확인을 표시해야 한다');
});

test('CSV는 인용 줄바꿈·쉼표를 보존하고 필수 값 오류를 거부한다', () => {
  const rows = parseCSV('table,column,data_type,nullable,column_name\nT,A,"NUMERIC(10,2)",N,"금액,\n합계"\n', 'meta.csv');
  assert.equal(rows.length, 1, '줄바꿈 설명을 한 열로 읽어야 한다');
  assert.equal(rows[0].values.column_name, '금액,\n합계', '설명을 보존해야 한다');
  assert.ok(rows[0].unverified.includes('primary_key'), '미제공 메타데이터는 미확인 표시해야 한다');
  assert.throws(() => parseCSV('table,column,data_type,nullable\nT,A,INT,maybe', 'meta.csv'), /값 오류/, 'NULL 허용 값 오류를 거부해야 한다');
  assert.throws(() => parseCSV('table,column,data_type,nullable\nT,A,"INT,N', 'meta.csv'), /닫히지/, '잘린 인용 값을 거부해야 한다');
});

test('문서 스키마는 필수 열·근거 해시·미확인 표시가 빠진 입력을 거부한다', async () => {
  const doc = await tables();
  const broken = structuredClone(doc); delete broken.rows[0].values.column;
  await assert.rejects(validateDocument(broken), /스키마/, '열 이름이 없는 문서를 거부해야 한다');
  const blank = structuredClone(doc); blank.rows[0].values.column_name = null; blank.rows[0].unverified = [];
  await assert.rejects(validateDocument(blank), /미확인/, '빈 칸을 확인한 것처럼 쓰지 않아야 한다');
  const noHash = structuredClone(doc); noHash.source_files = {};
  await assert.rejects(validateDocument(noHash), /근거/, '해시 없는 근거를 거부해야 한다');
});

test('드롭다운·조건부 서식·병합·이미지·메모·수식을 채운 뒤 재읽어 보존한다', async t => {
  const dir = await temp(t), mapping = await richTemplate(dir), original = await readFile(mapping.template);
  const result = await fillTemplate(await tables(), mapping, path.join(dir, 'filled.xlsx'));
  assert.equal(result.preserved, true, `모든 양식 요소가 보존돼야 한다: ${result.warnings}`);
  assert.equal(result.values_verified, true, '채운 열의 값을 재확인해야 한다');
  assert.deepEqual(result.warnings, [], '검증한 기본 6종 요소를 보존 밖 기능으로 오탐하지 않아야 한다');
  for (const feature of ['validations', 'conditional_formats', 'merges', 'images', 'notes', 'formulas']) assert.ok(result.template_features[feature] >= 1, `${feature} 요소가 있는 양식으로 검사해야 한다`);
  assert.equal(result.original_unchanged, true, '원본 양식이 바뀌지 않아야 한다');
  assert.deepEqual(await readFile(mapping.template), original, '원본 바이트가 동일해야 한다');
  const book = await readWorkbook(path.join(dir, 'filled.xlsx')), sheet = book.getWorksheet(mapping.sheet);
  assert.equal(sheet.getCell('A5').value, 'COMMON_CODE', '첫 테이블명이 채워져야 한다');
  assert.equal(sheet.getCell('I5').value, null, '기본값 없음은 수식/공유문자열 인덱스가 아닌 빈 셀이어야 한다');
  assert.ok(!result.missing.some(c => c.row === 5 && c.field === 'default_value'), '기본값 없음과 값 미확인을 구별해야 한다');
  assert.equal(sheet.getCell('J5').note, '원래 셀 메모', '입력 칸의 기존 메모가 유지돼야 한다');
  assert.equal(sheet.getCell('E210').value.formula, '1+2', '입력 영역 밖 수식이 유지돼야 한다');
  assert.equal(book.getWorksheet('보존 시트').getCell('B2').value.result, 6, '다른 시트의 수식 캐시를 유지해야 한다');
});

test('헤더 매핑 초안은 확인 전 채우지 않고 미확인 칸을 빈 값과 색으로 남긴다', async t => {
  const dir = await temp(t), base = await createDefaultTemplate('program-list', path.join(dir, 'template.xlsx'));
  const draft = await proposeMapping('program-list', base.template, base.sheet, 4, 5, 204), doc = await extractPrograms(project);
  assert.equal(draft.confirmed, false, '초안은 사용자 확인 전 상태여야 한다');
  await assert.rejects(fillTemplate(doc, draft, path.join(dir, 'unapproved.xlsx')), /매핑 확인/, '확인하지 않은 매핑을 실행하지 않아야 한다');
  const result = await fillTemplate(doc, { ...draft, confirmed: true }, path.join(dir, 'filled.xlsx'));
  assert.equal(result.status, 'PARTIAL', '미확인을 PASS로 바꾸지 않아야 한다');
  assert.ok(result.missing.some(m => m.field === 'program_id'), 'ID 미확인 셀 위치를 보고해야 한다');
  const sheet = (await readWorkbook(path.join(dir, 'filled.xlsx'))).getWorksheet(base.sheet);
  assert.equal(sheet.getCell('A5').value, null, '미확인 ID는 빈 칸이어야 한다');
  assert.equal(sheet.getCell('A5').fill.fgColor.argb, 'FFFFE699', '미확인 칸을 강조해야 한다');
  assert.notEqual(sheet.getCell('C5').fill.fgColor?.argb, 'FFFFE699', '확인된 요청 URL의 서식에 미확인 강조가 번지지 않아야 한다');
});

test('원본·기존 출력·수식·병합·기존 데이터 덮어쓰기를 거부한다', async t => {
  const dir = await temp(t), mapping = await richTemplate(dir), doc = await tables();
  await assert.rejects(fillTemplate(doc, mapping, mapping.template), /덮어쓰기/, '원본을 결과로 지정할 수 없어야 한다');
  const output = path.join(dir, 'existing.xlsx'); await writeFile(output, '기존 파일');
  await assert.rejects(fillTemplate(doc, mapping, output), /EEXIST/, '기존 결과를 보존해야 한다');
  for (const value of ['기존 입력', { formula: '1+2', result: 3 }]) {
    const book = await readWorkbook(mapping.template); book.getWorksheet(mapping.sheet).getCell('A5').value = value;
    const input = path.join(dir, `conflict-${typeof value}.xlsx`); await writeWorkbook(input, book);
    await assert.rejects(fillTemplate(doc, { ...mapping, template: input }, path.join(dir, `out-${typeof value}.xlsx`)), /기존 값/, '기존 값/수식을 보호해야 한다');
  }
  await assert.rejects(fillTemplate(doc, { ...mapping, columns: { ...mapping.columns, table: 'A' }, start_row: 210, end_row: 230 }, path.join(dir, 'merged.xlsx')), /병합/, '병합 영역에 쓰지 않아야 한다');
});

test('사용자 ID 규칙만 적용하고 자료형 덮어쓰기·열 중복·부족한 영역을 거부한다', async t => {
  const dir = await temp(t), m = { ...await createDefaultTemplate('program-list', path.join(dir, 't.xlsx')), confirmed: true }, doc = await extractPrograms(project);
  await fillTemplate(doc, m, path.join(dir, 'out.xlsx'), { id_rule: { prefix: 'PGM-', start: 1, width: 3 } });
  assert.equal((await readWorkbook(path.join(dir, 'out.xlsx'))).getWorksheet(m.sheet).getCell('A5').value, 'PGM-001', '사용자가 지정한 ID 규칙을 적용해야 한다');
  await assert.rejects(fillTemplate(doc, { ...m, fixed: { url: '가짜 경로' } }, path.join(dir, 'bad.xlsx')), /fixed/, '소스 사실을 고정 값으로 바꾸지 않아야 한다');
  await assert.rejects(fillTemplate(doc, { ...m, end_row: 5 }, path.join(dir, 'short.xlsx')), /범위/, '행 용량이 모자라면 멈춰야 한다');
  await assert.rejects(fillTemplate(doc, { ...m, columns: { ...m.columns, controller: 'A' } }, path.join(dir, 'dup.xlsx')), /중복/, '중복 열 매핑을 거부해야 한다');
});

test('소스가 달라진 run을 거부하고 기존 run을 덮어쓰지 않는다', async t => {
  const dir = await temp(t), doc = await tables(), mapping = await richTemplate(dir);
  await assert.rejects(fillRun(project, { ...doc, source_files: { ...doc.source_files, 'src/main/resources/db/oracle/ddl.sql': '0'.repeat(64) } }, mapping, 'docs-bad-source'), /소스가 변경/, '원본 해시 불일치를 거부해야 한다');
  const source = path.join(dir, 'project'); await cp(path.join(project, 'src/main/resources/db/oracle'), path.join(source, 'schema'), { recursive: true });
  const local = await extractTables(source, ['schema/ddl.sql']);
  const result = await fillRun(source, local, mapping, 'docs-first');
  assert.equal(result.preserved, true, '독립 프로젝트에서도 양식을 보존해야 한다');
  await assert.rejects(fillRun(source, local, mapping, 'docs-first'), /EEXIST/, '첫 run을 보존해야 한다');
  assert.match(await readFile(path.join(result.run, 'report.md'), 'utf8'), /PL\/PM 승인/, '보고서에 승인 한계를 표시해야 한다');
});

test('불러오기 전 보존 밖 부품을 감지해 실제 보고서에 경고한다', async t => {
  const dir = await temp(t), mapping = await richTemplate(dir);
  // 테스트에서만 ExcelJS의 잠긴 전이 의존성으로 확장 부품을 주입한다.
  const requireExcel = createRequire(import.meta.resolve('exceljs')), JSZip = requireExcel('jszip');
  const zip = await JSZip.loadAsync(await readFile(mapping.template)); zip.file('xl/charts/chart1.xml', '<chartSpace/>');
  const template = path.join(dir, 'unsupported.xlsx'); await writeFile(template, await zip.generateAsync({ type: 'nodebuffer' }));
  const local = path.join(dir, 'project'); await cp(path.join(project, 'src/main/resources/db/oracle'), path.join(local, 'schema'), { recursive: true });
  const result = await fillRun(local, await extractTables(local, ['schema/ddl.sql']), { ...mapping, template }, 'warning');
  assert.equal(result.status, 'PARTIAL', '보존 보장 밖 요소는 PASS로 바꾸지 않아야 한다');
  assert.ok(result.warnings.length, 'OOXML 경고를 남겨야 한다');
  assert.match(await readFile(path.join(result.run, 'report.md'), 'utf8'), /보존 보장 밖 OOXML/, '실제 보고서에서 경고를 볼 수 있어야 한다');
  assert.throws(() => inspectPackage(Buffer.from('xlsx가 아님')), /ZIP/, '잘못된 입력을 거부해야 한다');
});

test('JSON과 셀의 민감 문자열을 마스킹하고 문자열 수식을 실행하지 않는다', async t => {
  const dir = await temp(t), mapping = await richTemplate(dir), doc = await tables();
  doc.rows[0].values.column_name = 'secret=fixture'; doc.rows[1].values.column_name = '=HYPERLINK("https://example.invalid")';
  await fillTemplate(doc, mapping, path.join(dir, 'out.xlsx'));
  const sheet = (await readWorkbook(path.join(dir, 'out.xlsx'))).getWorksheet(mapping.sheet);
  assert.equal(sheet.getCell('D5').value, 'secret=[REDACTED]', '셀 문자열의 비밀값을 마스킹해야 한다');
  assert.equal(typeof sheet.getCell('D6').value, 'string', '등호로 시작하는 소스 문자열은 수식이 아니어야 한다');
});

test('설치본은 저장소 밖에서 lock 의존성만 준비해 추출·양식·채우기를 실행한다', { timeout: 120000 }, async t => {
  const dir = await temp(t), skill = path.join(dir, 'si-docs');
  await cp(path.resolve('skills/si-docs'), skill, { recursive: true, filter: src => !src.split(path.sep).includes('node_modules') });
  const npm = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--offline', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: skill, encoding: 'utf8', shell: process.platform === 'win32', windowsHide: true, timeout: 90000 });
  assert.equal(npm.status, 0, `잠긴 의존성을 독립 설치해야 한다: ${npm.stderr}`);
  const requireSkill = createRequire(path.join(skill, 'package.json'));
  assert.ok(requireSkill.resolve('exceljs').startsWith(skill + path.sep), '루트 node_modules를 빌려 쓰지 않아야 한다');
  const cli = path.join(skill, 'scripts/si-docs.mjs');
  const run = args => spawnSync(process.execPath, [cli, ...args], { cwd: dir, encoding: 'utf8', windowsHide: true, timeout: 30000 });
  const data = path.join(dir, 'data.json');
  assert.equal(run(['extract-program-list', project, data]).status, 0, '독립 추출 명령이 실행돼야 한다');
  const template = path.join(dir, 'standalone.xlsx'), mapFile = path.join(dir, 'mapping.json');
  assert.equal(run(['default-template', 'program-list', template, mapFile]).status, 0, '독립 기본 양식을 만들 수 있어야 한다');
  const mapping = JSON.parse(await readFile(mapFile)); mapping.confirmed = true;
  const local = path.join(dir, 'project'); await cp(path.join(project, 'src/main/resources/db/oracle'), path.join(local, 'schema'), { recursive: true });
  const sources = path.join(dir, 'sources.json'), tableData = path.join(dir, 'table-data.json'); await writeFile(sources, '["schema/ddl.sql"]');
  assert.equal(run(['extract-table-spec', local, sources, tableData]).status, 0, '독립 테이블 추출 명령이 실행돼야 한다');
  const tableTemplate = path.join(dir, 'table.xlsx'), tableMapping = path.join(dir, 'table-mapping.json');
  assert.equal(run(['default-template', 'table-spec', tableTemplate, tableMapping]).status, 0, '독립 테이블 양식을 만들 수 있어야 한다');
  const approved = JSON.parse(await readFile(tableMapping)); approved.confirmed = true; await writeFile(tableMapping, JSON.stringify(approved));
  const filled = run(['fill-template', local, tableData, tableMapping, 'standalone-first']);
  assert.equal(filled.status, 0, `독립 채우기 명령이 실행돼야 한다: ${filled.stderr}`);
  const evidence = JSON.parse(await readFile(path.join(local, '.sistack/runs/standalone-first/evidence/verification.json')));
  assert.equal(evidence.values_verified, true, '독립 설치본의 값이 재확인돼야 한다');
  assert.equal(evidence.preserved, true, '독립 설치본의 양식이 보존돼야 한다');
});
