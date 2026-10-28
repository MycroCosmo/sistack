import ExcelJS from 'exceljs';
import path from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';
import { isDeepStrictEqual } from 'node:util';
import { noLinks, digest } from '../trace/io.mjs';
import { columns, requiredColumns, validateDocument, clean } from './contract.mjs';

export const limitations = [
  '수식은 식과 캐시를 보존하며 계산하지 않음. Excel/LibreOffice 실제 표시·재계산 검증은 별도',
  '피벗·차트·매크로·전자서명·외부 연결·도형·스레드 댓글·고급 확장은 보존 보장 안 함. 발견 시 PARTIAL 경고',
  '검증 범위: 기본 드롭다운, 기본 조건부 서식, 병합, PNG 이미지, 셀 메모, 수식, 셀 서식, 다른 시트. 모든 OOXML 변형을 보장하지 않음',
  '행 삽입/이동·자동 범위 확장 없음. 사용자 양식은 충분한 빈 입력 행과 end_row를 명시해야 함'
];

// 이름/확장 기능 감지용 읽기 전용 ZIP 검사. 압축 해제 크기를 제한하며 디스크에 풀지 않는다.
export function inspectPackage(bytes) {
  if (bytes.length > 40 * 1024 * 1024) throw new Error('xlsx 40 MiB 제한');
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0 || bytes.readUInt32LE(end) !== 0x06054b50) throw new Error('유효하지 않은 xlsx ZIP');
  const count = bytes.readUInt16LE(end + 10), offset = bytes.readUInt32LE(end + 16), names = [], warnings = [];
  if (count === 65535 || offset === 0xffffffff || count > 10000) throw new Error('ZIP64/과다 항목 미지원');
  let at = offset, total = 0;
  for (let i = 0; i < count; i++) {
    if (at + 46 > bytes.length || bytes.readUInt32LE(at) !== 0x02014b50) throw new Error('잘못된 ZIP 디렉터리');
    const method = bytes.readUInt16LE(at + 10), size = bytes.readUInt32LE(at + 24), packed = bytes.readUInt32LE(at + 20);
    const length = bytes.readUInt16LE(at + 28), extra = bytes.readUInt16LE(at + 30), comment = bytes.readUInt16LE(at + 32), local = bytes.readUInt32LE(at + 42);
    const name = bytes.subarray(at + 46, at + 46 + length).toString('utf8'); names.push(name);
    if (size > 30 * 1024 * 1024 || (total += size) > 100 * 1024 * 1024 || ![0, 8].includes(method)) throw new Error('지원 범위 밖 ZIP 압축/크기');
    if (/^(?:xl\/(?:charts|pivot|externalLinks|activeX|slicer|queryTables|threadedComments)|customXml|_xmlsignatures)|vbaProject|vmlDrawing/i.test(name)) {
      // vmlDrawing은 기본 셀 메모에도 필요하므로 그 자체로는 경고하지 않는다.
      if (!/vmlDrawing/i.test(name)) warnings.push('보존 보장 밖 OOXML 부품 발견');
    }
    if (name.endsWith('.xml')) {
      if (local + 30 > bytes.length || bytes.readUInt32LE(local) !== 0x04034b50) throw new Error('잘못된 ZIP 항목');
      const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
      if (start + packed > bytes.length) throw new Error('잘린 ZIP 항목');
      const compressed = bytes.subarray(start, start + packed);
      let xml = (method === 8 ? inflateRawSync(compressed, { maxOutputLength: 30 * 1024 * 1024 }) : compressed).toString('utf8');
      // ExcelJS가 항상 쓰는 미사용 기본 스타일 선언 2개만 허용. 사용자 확장은 남겨 경고한다.
      if (name === 'xl/styles.xml') {
        xml = xml.replace('<ext uri="{EB79DEF2-80B8-43e5-95BD-54CBDDF9020C}" xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"><x14:slicerStyles defaultSlicerStyle="SlicerStyleLight1"/></ext>', '')
          .replace('<ext uri="{9260A510-F301-46a8-8635-F512D64BE5F5}" xmlns:x15="http://schemas.microsoft.com/office/spreadsheetml/2010/11/main"><x15:timelineStyles defaultTimelineStyle="TimeSlicerStyleLight1"/></ext>', '').replace('<extLst></extLst>', '');
      }
      if (/^xl\/drawings\/drawing\d+\.xml$/.test(name)) xml = xml.replaceAll('<a:extLst><a:ext uri="{FF2B5EF4-FFF2-40B4-BE49-F238E27FC236}"><a16:creationId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" id="{00000000-0008-0000-0000-000002000000}"/></a:ext></a:extLst>', '');
      if (/<(?:\w+:)?(?:extLst|oleObjects|controls|sparklineGroups)\b|<(?:xdr:)?(?:sp|graphicFrame|cxnSp)\b/.test(xml)) warnings.push('고급 확장/도형/컨트롤 XML 발견: 보존 보장 불가');
    }
    at += 46 + length + extra + comment;
  }
  return { parts: names.length, warnings: [...new Set(warnings)] };
}

function stable(value) {
  if (Buffer.isBuffer(value)) return digest(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().filter(k => value[k] !== undefined).map(k => [k, stable(value[k])]));
  return value;
}
export function snapshot(book) {
  return stable(book.worksheets.map(sheet => {
    const cells = {}, rows = {};
    sheet.eachRow({ includeEmpty: true }, r => { rows[r.number] = { height: r.height, hidden: r.hidden, outlineLevel: r.outlineLevel, style: r.style }; });
    sheet.eachRow({ includeEmpty: true }, r => r.eachCell({ includeEmpty: true }, c => {
      if (c.value !== null || Object.keys(c.style).length || c.note) cells[c.address] = { value: c.value, style: c.style, note: c.note ?? null };
    }));
    return { name: sheet.name, state: sheet.state, cells, rows, merges: [...sheet.model.merges].sort(), validations: sheet.dataValidations.model, conditional: sheet.conditionalFormattings, images: sheet.getImages().map(i => ({ range: { tl: { col: i.range.tl.col, row: i.range.tl.row }, br: i.range.br ? { col: i.range.br.col, row: i.range.br.row } : null, ext: i.range.ext, editAs: i.range.editAs }, hash: digest(book.getImage(i.imageId).buffer) })), columns: sheet.columns.map(c => ({ width: c.width, hidden: c.hidden, style: c.style })), views: sheet.views, pageSetup: sheet.pageSetup, autoFilter: sheet.autoFilter };
  }));
}
export async function readWorkbook(file) {
  await noLinks(file); const bytes = await readFile(file); inspectPackage(bytes);
  const book = new ExcelJS.Workbook(); await book.xlsx.load(bytes); return book;
}
export async function writeWorkbook(file, book) {
  await noLinks(file); await mkdir(path.dirname(file), { recursive: true });
  // 4.4.0은 read가 채운 기본 firstPageNumber=1도 명시 시작 번호로 다시 쓴다.
  // 비활성 기본값만 직렬화 중 제외하고 사용자가 설정한 시작 번호는 유지한다.
  const defaults = book.worksheets.filter(s => s.pageSetup.useFirstPageNumber === false && s.pageSetup.firstPageNumber === 1);
  for (const s of defaults) s.pageSetup.firstPageNumber = undefined;
  try { await writeFile(file, Buffer.from(await book.xlsx.writeBuffer()), { flag: 'wx' }); }
  finally { for (const s of defaults) s.pageSetup.firstPageNumber = 1; }
}
const colNumber = text => [...text].reduce((v, c) => v * 26 + c.charCodeAt(0) - 64, 0);
export function colLetter(n) { let result = ''; do { n--; result = String.fromCharCode(65 + n % 26) + result; n = Math.floor(n / 26); } while (n); return result; }

export async function createDefaultTemplate(kind, output) {
  if (!Object.hasOwn(columns, kind)) throw new Error('지원하지 않는 문서 종류');
  const book = new ExcelJS.Workbook(), sheet = book.addWorksheet(kind === 'program-list' ? '프로그램 목록' : '테이블 정의서');
  sheet.views = [{ state: 'frozen', ySplit: 4 }];
  const fields = Object.keys(columns[kind]);
  sheet.mergeCells(1, 1, 1, fields.length); sheet.getCell('A1').value = sheet.name;
  sheet.getCell('A1').font = { size: 20, bold: true, color: { argb: 'FF17365D' } }; sheet.getRow(1).height = 36;
  sheet.mergeCells(2, 1, 2, fields.length); sheet.getCell('A2').value = '소스 기준 초안 · 빈 칸은 미확인 · AI의 PASS는 승인/검수 완료가 아닙니다'; sheet.getRow(2).height = 26;
  fields.forEach((f, i) => {
    const c = sheet.getCell(4, i + 1); c.value = columns[kind][f];
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } };
    sheet.getColumn(i + 1).width = /evidence|controller|service|mapper|screen/.test(f) ? 48 : 23;
    for (let r = 5; r <= 204; r++) {
      const cell = sheet.getCell(r, i + 1); cell.font = { name: '맑은 고딕', size: 10 }; cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFD9E2F3' } } };
    }
  });
  for (let r = 5; r <= 204; r++) sheet.getRow(r).height = kind === 'program-list' ? 160 : 30;
  sheet.getRow(4).height = 24;
  sheet.autoFilter = { from: 'A4', to: `${colLetter(fields.length)}204` };
  sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  await writeWorkbook(output, book);
  return { template: path.resolve(output), sheet: sheet.name, header_row: 4, start_row: 5, end_row: 204, columns: Object.fromEntries(fields.map((f, i) => [f, colLetter(i + 1)])), id_rule: null, fixed: {} };
}

export async function proposeMapping(kind, template, sheetName, headerRow, startRow, endRow) {
  const sheet = (await readWorkbook(template)).getWorksheet(sheetName); if (!sheet) throw new Error('양식 시트 없음');
  const mapping = { template: path.resolve(template), sheet: sheetName, header_row: headerRow, start_row: startRow, end_row: endRow, columns: {}, id_rule: null, fixed: {}, confirmed: false };
  const found = new Map();
  sheet.getRow(headerRow).eachCell(c => {
    for (const [key, label] of Object.entries(columns[kind] ?? {})) if (c.text.trim() === label) {
      if (found.has(key)) throw new Error('중복 헤더: 수동 매핑 필요');
      found.set(key, c.col); mapping.columns[key] = colLetter(c.col);
    }
  });
  return mapping; // 저장 후 사용자 확인; 이 초안으로 채우기 금지
}

export async function fillTemplate(doc, mapping, output) {
  await validateDocument(doc);
  if (mapping.confirmed !== true) throw new Error('양식 매핑 확인 필요');
  if (Object.keys(mapping).some(k => !['template', 'sheet', 'header_row', 'start_row', 'end_row', 'columns', 'id_rule', 'fixed', 'confirmed'].includes(k))) throw new Error('미지원 매핑 항목');
  const { header_row: header, start_row: start, end_row: end } = mapping;
  if (![header, start, end].every(Number.isInteger) || header < 1 || start <= header || end < start || end > 1048576 || start + doc.rows.length - 1 > end) throw new Error('양식 입력 행 범위 오류/부족');
  if (!mapping.columns || !Object.keys(mapping.columns).length || requiredColumns[doc.kind].some(k => !mapping.columns[k])) throw new Error('필수 열 매핑 누락');
  const targetCols = Object.values(mapping.columns);
  if (new Set(targetCols).size !== targetCols.length || targetCols.some(c => !/^[A-Z]{1,3}$/.test(c) || colNumber(c) > 16384) || Object.keys(mapping.columns).some(k => !Object.hasOwn(columns[doc.kind], k))) throw new Error('열 매핑 오류/중복');
  const fixed = mapping.fixed ?? {};
  if (Object.keys(fixed).some(k => !['program_id', 'program_name'].includes(k) || doc.kind !== 'program-list' || typeof fixed[k] !== 'string')) throw new Error('fixed는 사용자 프로그램 ID/업무명만 지원');
  if (mapping.id_rule && (doc.kind !== 'program-list' || Object.keys(mapping.id_rule).some(k => !['prefix', 'start', 'width'].includes(k)) || typeof mapping.id_rule.prefix !== 'string' || !Number.isInteger(mapping.id_rule.start) || mapping.id_rule.start < 0 || !Number.isInteger(mapping.id_rule.width) || mapping.id_rule.width < 1 || mapping.id_rule.width > 12 || Object.hasOwn(fixed, 'program_id'))) throw new Error('ID 규칙 오류');
  await noLinks(mapping.template); await noLinks(output);
  if (path.resolve(mapping.template).toLowerCase() === path.resolve(output).toLowerCase()) throw new Error('원본 양식 덮어쓰기 금지');
  const bytes = await readFile(mapping.template), originalHash = digest(bytes), info = inspectPackage(bytes);
  const book = new ExcelJS.Workbook(); await book.xlsx.load(bytes);
  const before = snapshot(book), sheet = book.getWorksheet(mapping.sheet); if (!sheet) throw new Error('양식 시트 없음');
  const missing = [], expected = [];
  for (const [i, source] of doc.rows.entries()) {
    const evidence = source.evidence.slice(0, 2).map(e => `${e.file}:${e.line}`);
    if (source.evidence.length > 2) evidence.push(`외 ${source.evidence.length - 2}건: evidence/data.json`);
    const values = { ...source.values, ...fixed, evidence: evidence.join('\n'), status: source.status };
    if (mapping.id_rule) values.program_id = mapping.id_rule.prefix + String(mapping.id_rule.start + i).padStart(mapping.id_rule.width, '0');
    for (const [field, column] of Object.entries(mapping.columns)) {
      const cell = sheet.getCell(`${column}${start + i}`);
      if (cell.isMerged || cell.value !== null) throw new Error('입력 영역에 병합/수식/기존 값 존재: 매핑 조정 필요');
      const rawValue = clean(values[field] ?? null), value = rawValue === '' ? null : rawValue;
      cell.value = value;
      if (rawValue === null) {
        missing.push({ row: start + i, field });
        // 원본 메모는 유지하며 미확인 강조는 셀 배경+보고서에만 남긴다.
        cell.style = structuredClone(cell.style);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
      }
      expected.push({ address: cell.address, value });
    }
  }
  const expectedBook = snapshot(book);
  await writeWorkbook(output, book);
  const reopened = await readWorkbook(output), after = snapshot(reopened);
  const same = isDeepStrictEqual(expectedBook, after);
  const rowsValid = expected.every(c => isDeepStrictEqual(reopened.getWorksheet(mapping.sheet).getCell(c.address).value, c.value));
  const sourceUnchanged = digest(await readFile(mapping.template)) === originalHash;
  const warnings = [...info.warnings, ...(!same ? ['양식 요소 재읽기 불일치: 보존 검사 FAIL'] : []), ...(!sourceUnchanged ? ['원본 양식 해시 변경'] : [])];
  return { status: !same || !rowsValid || !sourceUnchanged ? 'FAIL' : missing.length || warnings.length || doc.unverified.length || doc.rows.some(r => r.status !== 'CONFIRMED' || r.unverified.length) ? 'PARTIAL' : 'PASS', rows: doc.rows.length, mapped_columns: Object.keys(mapping.columns).length, missing, warnings, limitations, original_sha256: originalHash, original_unchanged: sourceUnchanged, preserved: same, values_verified: rowsValid, template_features: { sheets: before.length, merges: before.reduce((s, w) => s + w.merges.length, 0), images: before.reduce((s, w) => s + w.images.length, 0), validations: before.reduce((s, w) => s + Object.keys(w.validations).length, 0), conditional_formats: before.reduce((s, w) => s + w.conditional.length, 0), notes: before.reduce((s, w) => s + Object.values(w.cells).filter(c => c.note).length, 0), formulas: before.reduce((s, w) => s + Object.values(w.cells).filter(c => c.value?.formula).length, 0) } };
}
