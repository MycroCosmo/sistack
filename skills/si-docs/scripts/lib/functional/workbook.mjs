import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {readWorkbook,writeWorkbook,snapshot,inspectPackage} from '../docs/workbook.mjs';
import {save,digest,noLinks} from '../trace/io.mjs';
import {mask} from '../mask/index.mjs';

function firstCells(sheet,mapping,count) {
  const cols=['first.executed_at','first.tester_id','first.result','first.defect_notes'].map(k=>mapping.columns[k]);
  return Array.from({length:count},(_,i)=>cols.map(col=>{const c=sheet.getCell(`${col}${mapping.start_row+i}`);return {address:c.address,value:c.value,style:structuredClone(c.style),note:c.note??null};}));
}
function resultValues(result) {return {executed_at:result.status==='SKIP'?null:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(result.started_at)),tester_id:result.status==='SKIP'?null:result.account_id,result:result.status==='BLOCKED'||result.status==='PARTIAL'?null:result.status,defect_notes:mask(`${result.status==='BLOCKED'?'BLOCKED: ':''}${result.reason}`)};}
function differences(a,b,p='',out=[]) {if(isDeepStrictEqual(a,b))return out;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))differences(a[k],b[k],`${p}.${k}`,out);}else if(out.length<20)out.push(p);return out;}
export async function writeFunctionalWorkbook({template,mapping,cases,results,output,m4,round=1,first=null}) {
  if(!mapping.confirmed||![1,2].includes(round))throw Error('승인 매핑/명시한 차수 필요');
  if(round===2&&!first)throw Error('2차는 보존한 1차 원본 필요');
  if(cases.length>mapping.end_row-mapping.start_row+1)throw Error('결과서 입력 행 부족');
  await noLinks(template);await noLinks(output);
  if(path.resolve(output).toLowerCase()==path.resolve(template).toLowerCase()||(first&&path.resolve(first).toLowerCase()==path.resolve(output).toLowerCase()))throw Error('원본 덮어쓰기 금지');
  const original=await readFile(template),originalHash=digest(original),source=first??template,sourceHash=digest(await readFile(source));
  const book=await readWorkbook(source),sheet=book.getWorksheet(mapping.sheet);if(!sheet)throw Error('결과서 시트 없음');
  const existingSheets=book.worksheets.length;
  const font=inspectPackage(await readFile(source)).default_font,firstBefore=round===2?firstCells(sheet,mapping,cases.length):null;
  const outcome=new Map(results.records.map(r=>[r.case_id,r]));
  for(const [i,c]of cases.entries()) {
    const row=mapping.start_row+i,result=outcome.get(c.case_id);if(!result)throw Error('케이스 결과 누락');
    if(round===2&&sheet.getCell(`${mapping.columns.case_id}${row}`).value!==c.case_id)throw Error('1차 TC와 2차 TC 불일치');
    if(!['admin','viewer'].includes(result.account_id)||result.mode==='수동')throw Error('승인한 계정/실행 방식 필요');
    const values={case_id:c.case_id,screen_or_menu:path.posix.basename(c.file??c.screen_files?.[0]??''),test_item:c.title,steps_and_inputs:c.supplemental?`업무 조건 확인: ${c.operation}`:`${c.kind} 기능 수행. 근거 ${c.file}:${c.line}`,expected_result:[...(c.expected_requests??[]),'기대 응답과 업무 화면/자료 확인'].join('\n'),execution_mode:result.mode,actions:null};
    const prefix=round===1?'first':'second';for(const[k,v]of Object.entries(resultValues(result)))values[`${prefix}.${k}`]=v;
    for(const[field,col]of Object.entries(mapping.columns)) {
      if(round===2&&!field.startsWith('second.'))continue;
      if(round===1&&field.startsWith('second.'))continue;
      const cell=sheet.getCell(`${col}${row}`);if(cell.isMerged||cell.value!==null)throw Error('결과서 기존 셀/수식 덮어쓰기 금지');
      const v=values[field]??null;cell.value=typeof v==='string'?mask(v):v;
    }
  }
  if(round===1) {
    if(book.getWorksheet('서버로직검증'))throw Error('서버 로직 근거 시트 충돌');
    const server=book.addWorksheet('서버로직검증');server.addRow(['서버 검증 run','업무 테스트명','대상 클래스','대상 메서드','결과','원본 근거']);
    for(const t of m4.tests)server.addRow([m4.run_id,t.display_name,t.target_class??null,t.target_method??null,t.status,t.report_file]);
    server.columns.forEach(c=>{c.width=30;});server.getRow(1).font={bold:true};
  }
  const expected=snapshot(book,font);await writeWorkbook(output,book);
  const afterBook=await readWorkbook(output),afterSheet=afterBook.getWorksheet(mapping.sheet);
  const preserved=isDeepStrictEqual(expected.slice(0,existingSheets),snapshot(afterBook,font).slice(0,existingSheets));
  const serverBefore=book.getWorksheet('서버로직검증'),serverAfter=afterBook.getWorksheet('서버로직검증');
  const serverValues=serverAfter&&Array.from({length:m4.tests.length+1},(_,r)=>Array.from({length:6},(_,c)=>isDeepStrictEqual(serverBefore.getCell(r+1,c+1).value,serverAfter.getCell(r+1,c+1).value))).flat().every(Boolean);
  const firstPreserved=round===1||isDeepStrictEqual(firstBefore,firstCells(afterSheet,mapping,cases.length));
  const unchanged=digest(await readFile(template))===originalHash&&digest(await readFile(source))===sourceHash;
  const check={round,rows:cases.length,template_unchanged:unchanged,preserved,first_columns_preserved:firstPreserved,server_values_verified:serverValues,source_sha256:sourceHash,template_sha256:originalHash,status:preserved&&firstPreserved&&unchanged&&serverValues?'PASS':'FAIL',server_logic_sheet_rows:m4.tests.length};
  await save(output+'.verification.json',check);if(check.status==='FAIL')throw Error(`결과서 재읽기/1차 보존 실패: ${differences(expected,snapshot(afterBook,font)).join(',')}`);
  return check;
}
