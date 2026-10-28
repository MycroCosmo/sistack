import { createDefaultTemplate, readWorkbook, writeWorkbook } from '../../lib/docs/workbook.mjs';
import path from 'node:path';

export async function richTemplate(dir) {
  const mapping = await createDefaultTemplate('table-spec', path.join(dir, 'base.xlsx'));
  const book = await readWorkbook(mapping.template), sheet = book.getWorksheet(mapping.sheet);
  sheet.getCell('H5').dataValidation = { type: 'list', allowBlank: true, formulae: ['"Y,N"'], showErrorMessage: true, error: '허용 값을 선택하세요' };
  sheet.addConditionalFormatting({ ref: 'E5:E204', rules: [{ type: 'expression', formulae: ['LEN(E5)>0'], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFE2F0D9' } } } }] });
  sheet.getCell('J5').note = '원래 셀 메모';
  sheet.mergeCells('A210:B210'); sheet.getCell('A210').value = '입력 영역 아래 보존';
  sheet.getCell('E210').value = { formula: '1+2', result: 3 };
  const image = book.addImage({ base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aU1sAAAAASUVORK5CYII=', extension: 'png' });
  sheet.addImage(image, { tl: { col: 11, row: 1 }, ext: { width: 24, height: 24 } });
  const other = book.addWorksheet('보존 시트'); other.getCell('A1').value = '사용자 안내'; other.getCell('B2').value = { formula: '2*3', result: 6 };
  const template = path.join(dir, 'rich.xlsx'); await writeWorkbook(template, book);
  return { ...mapping, template, confirmed: true };
}
