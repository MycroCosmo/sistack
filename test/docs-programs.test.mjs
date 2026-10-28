import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { extractPrograms } from '../lib/docs/extract.mjs';
import { fillTemplate, readWorkbook, writeWorkbook } from '../lib/docs/workbook.mjs';
import { fillRun } from '../lib/docs/run.mjs';
import ExcelJS from 'exceljs';

async function temp(t) { const p = await mkdtemp(path.join(os.tmpdir(), 'sistack-programs-')); t.after(() => rm(p, {recursive:true,force:true})); return p; }

// 제공 양식의 헤더/고유 문구를 복사하지 않은 최소 합성 양식.
async function template(dir) {
  const book = new ExcelJS.Workbook(), sheet = book.addWorksheet('목록');
  sheet.mergeCells('B1:D1'); sheet.getCell('A1').value = '설정 항목';
  sheet.getCell('E1').value = {formula:'1+2',result:3};
  for(let c=1;c<=7;c++)sheet.getCell(3,c).value=`항목 ${c}`;
  for(let r=4;r<=90;r++) {
    sheet.getCell(`B${r}`).dataValidation={type:'list',allowBlank:true,formulae:['"화면,클래스,SQL"']};
    for(let c=1;c<=7;c++)sheet.getCell(r,c).alignment={wrapText:true};
  }
  const file=path.join(dir,'template.xlsx'); await writeWorkbook(file,book);
  return {template:file,sheet:'목록',header_row:3,start_row:4,end_row:90,columns:{row_number:'A',program_type:'B',program_name:'C',program_id:'D',url:'E',related_sources:'F',remarks:'G'},cells:{'meta.business_name':'B1'},confirmed:true,id_rule:null,fixed:{}};
}

test('프로그램을 화면 파일·클래스·SQL별 한 행으로 나누고 공유 항목과 선택자 노드를 중복 생성하지 않는다', async () => {
  for(const project of ['legacy-board','legacy-board-thymeleaf']) {
    const doc=await extractPrograms(`examples/${project}`);
    assert.equal(doc.schema_version,'1.1.0','분리 행 스키마를 표시해야 한다');
    assert.equal(new Set(doc.rows.map(r=>r.identity)).size,doc.rows.length,'공유 프로그램은 한 행이어야 한다');
    const classes=doc.rows.filter(r=>r.values.program_type==='클래스'), sql=doc.rows.filter(r=>r.values.program_type==='SQL');
    assert.equal(classes.length,19,'클래스/인터페이스 소스 19개를 각각 한 행으로 남겨야 한다');
    assert.equal(sql.length,9,'SQL 선언 9개가 요청 수와 무관하게 한 행씩 있어야 한다');
    assert.equal(classes.filter(r=>r.values.related_sources.includes('BoardController#')).length,1,'공유 Controller는 한 행이어야 한다');
    assert.equal(sql.filter(r=>r.values.mapper?.endsWith('.selectList')).length,3,'서로 다른 네임스페이스의 동명 SQL은 합치지 않아야 한다');
    assert.ok([...classes,...sql].every(r=>r.values.program_name===null),'클래스/SQL의 업무명을 추정하지 않아야 한다');
    assert.ok(doc.rows.filter(r=>r.values.program_type==='화면').every(r=>!r.values.screen.endsWith('.jspf')),'공통 조각을 독립 화면으로 세지 않아야 한다');
  }
});

test('화면 title 우선·첫 h1 대체를 LIKELY와 정확한 근거로 제안하고 동적 제목은 추정하지 않는다', async t => {
  const root=await temp(t), views=path.join(root,'src/main/webapp'); await mkdir(views,{recursive:true});
  await writeFile(path.join(views,'first.jsp'),'<!-- <title>주석 제목</title> -->\n<title>목록 &amp; 상세</title>\n<h1>다른 이름</h1>');
  await writeFile(path.join(views,'second.html'),'<html><h1>조회 화면</h1><h1>두 번째</h1></html>');
  await writeFile(path.join(views,'dynamic.jsp'),'<title>${name}</title><h1>${caption}</h1>');
  const doc=await extractPrograms(root);
  const first=doc.rows.find(r=>r.values.screen?.endsWith('first.jsp'));
  assert.ok(first,'제목이 있는 화면 행이 있어야 한다');
  assert.equal(first.values.program_name,'목록 & 상세','title을 첫 h1보다 우선해야 한다');
  assert.equal(first.status,'LIKELY','화면 제목은 확정 업무명이 아닌 제안이어야 한다');
  assert.equal(first.field_evidence[0].line,2,'주석을 제외한 title 라인을 남겨야 한다');
  assert.equal(doc.rows.find(r=>r.values.screen?.endsWith('second.html')).values.program_name,'조회 화면','title이 없으면 첫 h1만 사용해야 한다');
  assert.equal(doc.rows.find(r=>r.values.screen?.endsWith('dynamic.jsp')).values.program_name,null,'동적 문자열을 업무명으로 만들지 않아야 한다');
});

test('복합 열·상단 병합 입력을 채우고 미확인 및 LIKELY 셀만 강조하며 양식 요소를 보존한다', async t => {
  const dir=await temp(t), map=await template(dir), doc=await extractPrograms('examples/legacy-board');
  const before=await readFile(map.template), out=path.join(dir,'out.xlsx');
  const result=await fillTemplate(doc,map,out);
  assert.equal(result.preserved,true,`원래 병합·수식·드롭다운·서식이 보존돼야 한다: ${result.preservation_differences}`);
  assert.equal(result.values_verified,true,'채운 모든 값을 재읽어 확인해야 한다');
  assert.equal(result.status,'PARTIAL','미확인과 LIKELY를 PASS로 올리지 않아야 한다');
  assert.deepEqual(await readFile(map.template),before,'원본 바이트를 유지해야 한다');
  const sheet=(await readWorkbook(out)).getWorksheet(map.sheet);
  assert.equal(sheet.getCell('B1').value,null,'설정 없는 상단 메타데이터를 채우지 않아야 한다');
  const screen=doc.rows.findIndex(r=>r.values.program_type==='화면'&&r.values.program_name), cls=doc.rows.findIndex(r=>r.values.program_type==='클래스');
  assert.ok(screen>=0&&cls>=0,'화면과 클래스 행이 있어야 한다');
  assert.equal(sheet.getCell(`C${4+screen}`).fill.fgColor.argb,'FFFFE699','LIKELY 화면명을 노란색으로 표시해야 한다');
  assert.match(sheet.getCell(`G${4+screen}`).value,/LIKELY.*\.jsp:\d+/s,'화면명 근거 파일과 라인을 비고에 남겨야 한다');
  assert.doesNotMatch(sheet.getCell(`G${4+screen}`).value,/unknown\.|program_name/,'비고의 미확인 항목은 내부 키 대신 양식 헤더로 표시해야 한다');
  assert.equal(sheet.getCell(`C${4+cls}`).value,null,'클래스 업무명을 비워야 한다');
  assert.notEqual(sheet.getCell(`E${4+cls}`).fill.fgColor?.argb,'FFFFE699','클래스의 URL 해당 없음은 미확인과 구별해야 한다');
  assert.ok(result.missing.some(m=>m.address==='B1'),'상단 미확인 셀 주소를 보고해야 한다');
  assert.ok(result.suggested.length>0,'LIKELY 제안 셀을 별도로 보고해야 한다');
});

test('메타데이터·작성일·프로그램 ID는 설정 파일 값만 사용하고 없으면 비운다', async t => {
  const dir=await temp(t), map=await template(dir), doc=await extractPrograms('examples/legacy-board');
  const project=path.join(dir,'project'); await mkdir(project);
  // 실행 가능한 소스 사본을 만들어 fillRun의 설정 파일 경계를 검증한다.
  await mkdir(path.join(project,'src/main/webapp'),{recursive:true});
  await writeFile(path.join(project,'src/main/webapp/page.jsp'),'<title>설정 검증</title>');
  const local=await extractPrograms(project);
  await writeFile(path.join(project,'sistack-docs.json'),JSON.stringify({meta:{business_name:'합성 입력',created_date:'2026-01-02'},id_rule:{prefix:'P-',start:7,width:3}}));
  map.cells['meta.created_date']='F1';
  const run=await fillRun(project,local,map,'config-check');
  const sheet=(await readWorkbook(path.join(run.run,'program-list.xlsx'))).getWorksheet(map.sheet);
  assert.equal(sheet.getCell('B1').value,'합성 입력','설정 파일 사업명만 사용해야 한다');
  assert.equal(sheet.getCell('F1').value,'2026-01-02','작성일을 실행일로 바꾸지 않아야 한다');
  assert.equal(sheet.getCell('D4').value,'P-007','설정 파일 ID 규칙을 적용해야 한다');
  await assert.rejects(fillTemplate(doc,{...map,id_rule:{prefix:'X',start:1,width:2}},path.join(dir,'bad.xlsx')),/설정 파일/,'매핑에 ID 규칙을 숨겨 설정 정책을 우회하지 않아야 한다');
});
