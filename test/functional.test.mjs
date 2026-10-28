import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import ExcelJS from 'exceljs';
import {functionalInventory,generateCases,compareCases} from '../lib/functional/inventory.mjs';
import {writeFunctionalWorkbook} from '../lib/functional/workbook.mjs';
import {readWorkbook,writeWorkbook} from '../lib/docs/workbook.mjs';
import {digest} from '../lib/trace/io.mjs';
async function temp(t){const d=await mkdtemp(path.join(os.tmpdir(),'sistack-functional-'));t.after(()=>rm(d,{recursive:true,force:true}));return d;}
test('기능 선언·숨김 입력·팝업·공통 조각을 근거와 함께 수집하고 선택자를 추측하지 않는다',async t=>{
 const root=await temp(t),dir=path.join(root,'src/main/webapp');await mkdir(dir,{recursive:true});
 await writeFile(path.join(dir,'screen.html'),'<html><title>조회</title><form id="search" action="/list.do"><input type="hidden" name="page"><button>조회</button></form><a href="/popup.do" target="new">열기</a><div th:fragment="common"></div><button id="load" data-url="/data.do">더 보기</button><script>$("#load").on("click",function(){ $.ajax({url:"/data.do"}); }); window.open("/popup.do");</script></html>');
 const i=await functionalInventory(root);
 for(const kind of ['form','hidden','button','link','fragment','data-url','handler','ajax','popup'])assert.ok(i.items.some(x=>x.kind===kind),`${kind} 선언을 빠뜨리지 않아야 한다`);
 assert.ok(i.items.every(x=>x.file&&x.line>0),'모든 항목에 파일과 라인이 있어야 한다');
 assert.equal(i.items.find(x=>x.kind==='button').selector,null,'식별자 없는 버튼의 선택자를 만들지 않아야 한다');
 const cases=generateCases(i);assert.deepEqual(compareCases(i,cases),{missing:[],duplicate:[],orphan:[],expected_request_omissions:[]},'선언별 TC가 정확히 연결돼야 한다');
 const bad=[...cases.slice(1),cases[1]];const audit=compareCases(i,bad);assert.ok(audit.missing.length&&audit.duplicate.length,'누락과 중복을 실제로 검출해야 한다');
});
test('삭제만 SKIP으로 분류하고 알려진 요청 메서드와 URL을 기대 결과에 남긴다',()=>{
 const i={items:[{inventory_item_id:'a',kind:'form',file:'a',line:1,screens:[],requests:[{url:'/board/delete.do',method:'POST'}]},{inventory_item_id:'b',kind:'form',file:'a',line:2,screens:[],requests:[{url:'/board/list.do',method:'GET'}]}],pages:[]};
 const c=generateCases(i);assert.equal(c[0].mode,'SKIP','삭제 요청을 호출하지 않아야 한다');assert.equal(c[1].mode,'AUTO-API','일반 조회를 SKIP으로 숨기지 않아야 한다');assert.deepEqual(c[1].expected_requests,['GET /board/list.do'],'기대 요청은 메서드까지 남겨야 한다');
});
test('권한이 필요한 화면의 구조 항목도 관리자 세션으로 확인한다',()=>{
 const i={items:[{inventory_item_id:'a',kind:'fragment',file:'part',line:1,screens:['form'],requests:[]},{inventory_item_id:'b',kind:'form',file:'form',line:2,screens:['form'],requests:[]}],pages:[{file:'form',routes:[{url:'/board/form.do',method:'GET'}],markers:['등록']}]};
 const cases=generateCases(i);assert.equal(cases[0].account_id,'admin','등록 화면에 포함된 구조 항목을 조회자로 실행하지 않아야 한다');assert.equal(i.items[0].covered_by,cases[0].case_id,'공통 조각은 관리자 화면 TC에 연결해야 한다');
 const cancel={items:[{inventory_item_id:'cancel',kind:'link',file:'form',line:3,screens:['form'],requests:[{method:'GET',url:'/board/list.do'}]}],pages:i.pages};assert.equal(generateCases(cancel)[0].account_id,'admin','조회 링크라도 진입할 등록 화면의 관리자 권한이 필요하다');
});
test('결과서 2차는 1차·원본·요약 수식을 보존하고 BLOCKED를 빈 결과+비고로 기록한다',async t=>{
 const dir=await temp(t),book=new ExcelJS.Workbook(),s=book.addWorksheet('사례');s.mergeCells('A1:O1');s.getCell('A1').value='기능 확인';
 for(let c=1;c<=15;c++)s.getCell(2,c).value=`항목${c}`;
 s.getCell('H3').dataValidation={type:'list',allowBlank:true,formulae:['"PASS,FAIL,SKIP"']};s.getCell('L3').dataValidation={...s.getCell('H3').dataValidation};
 const summary=book.addWorksheet('합계');summary.getCell('A1').value={formula:'COUNTIF(사례!H3:H20,"PASS")',result:0};
 const template=path.join(dir,'template.xlsx');await writeWorkbook(template,book);const hash=digest(await readFile(template));
 const fields=['case_id','screen_or_menu','test_item','steps_and_inputs','expected_result','first.executed_at','first.tester_id','first.result','first.defect_notes','second.executed_at','second.tester_id','second.result','second.defect_notes','actions','execution_mode'];
 const mapping={confirmed:true,sheet:'사례',start_row:3,end_row:20,columns:Object.fromEntries(fields.map((f,i)=>[f,String.fromCharCode(65+i)]))};
 const cases=[{case_id:'TC-001',file:'screen.jsp',line:4,kind:'form',title:'조회 기능',expected_requests:['GET /list.do']}],record={case_id:'TC-001',account_id:'viewer',mode:'AUTO-API',started_at:'2026-10-28T15:30:00Z',status:'PASS',reason:'자료 조회 확인'},m4={run_id:'server',tests:[{display_name:'서버 목록 검증',status:'PASS',report_file:'evidence/test.xml'}]};
 const first=path.join(dir,'first.xlsx');await writeFunctionalWorkbook({template,mapping,cases,results:{records:[record]},output:first,m4,round:1});const firstHash=digest(await readFile(first));
 assert.equal((await readWorkbook(first)).getWorksheet('사례').getCell('F3').value,'2026-10-29','UTC 자정 전 시각도 한국 수행일로 표시해야 한다');
 const skipped=path.join(dir,'skipped.xlsx');await writeFunctionalWorkbook({template,mapping,cases,results:{records:[{...record,status:'SKIP',mode:'SKIP',reason:'삭제 호출 안 함'}]},output:skipped,m4,round:1});const skippedSheet=(await readWorkbook(skipped)).getWorksheet('사례');assert.equal(skippedSheet.getCell('F3').value,null,'미실행 삭제에는 수행일을 기재하지 않아야 한다');assert.equal(skippedSheet.getCell('G3').value,null,'미실행 삭제에는 실제 수행 계정을 기재하지 않아야 한다');assert.equal(skippedSheet.getCell('H3').value,'SKIP','미실행 상태는 SKIP으로 보존해야 한다');
 const output=path.join(dir,'second.xlsx');const check=await writeFunctionalWorkbook({template,mapping,cases,results:{records:[{...record,status:'BLOCKED',reason:'식별자 없음'}]},output,m4,round:2,first});
  await assert.rejects(writeFunctionalWorkbook({template,mapping,cases:[{...cases[0],case_id:'TC-OTHER'}],results:{records:[{...record,case_id:'TC-OTHER'}]},output:path.join(dir,'mismatch.xlsx'),m4,round:2,first}),/1차 TC와 2차 TC 불일치/,'2차 케이스를 다른 1차 행에 기록하지 않아야 한다');
 assert.equal(check.first_columns_preserved,true,'1차 열을 유지해야 한다');assert.equal(digest(await readFile(first)),firstHash,'1차 파일을 바꾸지 않아야 한다');assert.equal(digest(await readFile(template)),hash,'원본을 바꾸지 않아야 한다');
 const result=await readWorkbook(output),sheet=result.getWorksheet('사례');assert.equal(sheet.getCell('H3').value,'PASS','1차 PASS를 유지해야 한다');assert.equal(sheet.getCell('L3').value,null,'BLOCKED를 PASS/SKIP으로 바꾸지 않아야 한다');assert.match(sheet.getCell('M3').value,/BLOCKED: 식별자 없음/,'차단 사유를 비고에 남겨야 한다');assert.equal(result.getWorksheet('서버로직검증').rowCount,2,'M4 근거는 별도 시트여야 한다');assert.equal(result.getWorksheet('합계').getCell('A1').value.formula,'COUNTIF(사례!H3:H20,"PASS")','기존 요약 수식을 유지해야 한다');
});

test('소스 선택자는 id·name·해석 href·텍스트·폼 범위 텍스트 순서와 위치를 보존한다',async t=>{
 const root=await temp(t),dir=path.join(root,'src/main/webapp');await mkdir(dir,{recursive:true});
 await writeFile(path.join(dir,'screen.html'),'<html><title>조회</title><form id="find" action="/list.do"><button id="query" name="queryName">조회</button><input type="hidden" name="csrf"></form><a th:href="@{/list.do(page=1)}">목록</a><div th:fragment="area"></div></html>');
 const inventory=await functionalInventory(root),button=inventory.items.find(i=>i.kind==='button'),link=inventory.items.find(i=>i.kind==='link');
 assert.deepEqual(button.selection_candidates.map(s=>s.kind),['id','name','text','form-text'],'선언된 선택자만 승인 우선순위로 제안해야 한다');
 assert.equal(link.selection_candidates.find(s=>s.kind==='href').value,'/list.do?page=1','정적 Thymeleaf href를 해석해야 한다');
 assert.ok(button.selection_candidates.every(s=>s.file.endsWith('screen.html')&&s.line===1),'선택자마다 실제 선언 위치를 남겨야 한다');
 const cases=generateCases(inventory);assert.ok(cases.every(c=>!['hidden','fragment'].includes(c.kind)),'구조 선언은 결과서 행을 만들지 않아야 한다');
 for(const item of inventory.items.filter(i=>['hidden','fragment'].includes(i.kind)))assert.ok(cases.some(c=>c.case_id===item.covered_by),'구조 선언마다 실제 화면 TC를 연결해야 한다');
 assert.deepEqual(compareCases(inventory,cases).missing,[],'연결된 구조 선언을 누락으로 세지 않아야 한다');
 inventory.items.find(i=>i.kind==='hidden').covered_by='없는-TC';assert.ok(compareCases(inventory,cases).missing.length,'없는 TC로 덮은 구조 항목은 누락으로 검출해야 한다');
});

test('같은 id나 문구가 다른 화면에 있어도 핸들러 근거를 다른 소스로 바꾸지 않는다',async t=>{
 const root=await temp(t),dir=path.join(root,'src/main/webapp');await mkdir(dir,{recursive:true});
 await writeFile(path.join(dir,'one.html'),'<html><button id="send">조회</button><script>$("#send").on("click",function(){});</script></html>');await writeFile(path.join(dir,'two.html'),'<html><button id="send">조회</button></html>');
 const inventory=await functionalInventory(root),handler=inventory.items.find(i=>i.kind==='handler');assert.deepEqual(handler.screens,['src/main/webapp/one.html'],'이벤트를 포함한 화면에만 연결해야 한다');assert.ok(handler.selection_candidates.every(s=>s.file.endsWith('one.html')),'다른 화면의 같은 id를 근거로 삼지 않아야 한다');
});
