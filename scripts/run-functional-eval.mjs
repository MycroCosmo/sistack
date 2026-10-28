import {loadAuth} from '../lib/functional/auth.mjs';
import path from 'node:path';
import {mkdir,readFile,readdir} from 'node:fs/promises';
import {functionalInventory,generateCases,supplementalCases,compareCases} from '../lib/functional/inventory.mjs';
import {startServer} from '../lib/functional/server.mjs';
import {executeCases} from '../lib/functional/execute.mjs';
import {writeFunctionalWorkbook} from '../lib/functional/workbook.mjs';
import {json,save,digest} from '../lib/trace/io.mjs';
import {applyUnitPatch} from './eval-unit-test.mjs';
import {validateManifest} from '../lib/manifest/index.mjs';
import {checkFunctionalExpected} from './audit-functional-inventory.mjs';

const [configFile]=process.argv.slice(2),config=await json(configFile);
if(config.allow_execution!==true||config.round!==1||config.tester_ids?.admin!=='admin'||config.tester_ids?.viewer!=='viewer')throw Error('명시된 1차/승인 계정 설정 필요');
await checkFunctionalExpected();
const mapping=await json(config.mapping),template=path.resolve(config.template),output=path.resolve(config.output);await mkdir(output);
const summarize=records=>records.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{});
async function manifest(run,id,status,revision,round) {
 const m={schema_version:'1.0.0',run_id:id,skill:'si-docs',created_at:new Date().toISOString(),source_revision:revision,status,inputs:{phase:'M5b 화면 기능 테스트',round:String(round)},evidence:[{path:'results-chrome.json',level:5,description:'실제 로컬 앱의 API/UI 결과와 요청·화면 증거'},{path:'evidence/db-preservation.json',level:4,description:'파일 H2와 비밀번호 제외 SQL 덤프 보존'}],unverified:['소스 선택자/기대 요청이 미확정인 UI는 BLOCKED','팝업 실제 표본 0개로 감지/실행 미검증'],next_actions:[]};
 if(round===2)m.parent_run_ids=[`m5b-first-${config.version??'v1'}`];
 m.inputs.cases_sha256=digest(await readFile(path.join(run,'cases.json')));
 if(validateManifest(m).length)throw Error('manifest 오류');await save(path.join(run,'manifest.json'),m);
 await save(path.join(run,'report.md'),`> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.\n\n# M5b ${round}차\n\n상태: ${status}. results-chrome.json 및 evidence의 화면/요청/DB 보존 기록 참조. 실제 id/name이 없는 UI는 BLOCKED이며 SKIP은 삭제/다운로드만이다.\n`);
}
const baselines={},evaluation=[];
for(const name of ['legacy-board','legacy-board-thymeleaf']) {
 const source=path.resolve('examples',name),id=`m5b-first-${config.version??'v1'}`,run=path.join(source,'.sistack/runs',id);await mkdir(run);
 const inventory=await functionalInventory(source),cases=[...generateCases(inventory),...supplementalCases(inventory)];
 const coverage=compareCases(inventory,cases);if(Object.values(coverage).some(v=>v.length))throw Error('인벤토리/TC 대조 실패');
 await save(path.join(run,'inventory.json'),inventory);await save(path.join(run,'cases.json'),cases);await save(path.join(run,'coverage.json'),coverage);
 await save(path.join(run,'coverage-map.json'),inventory.items.filter(i=>i.covered_by).map(i=>({inventory_item_id:i.inventory_item_id,kind:i.kind,file:i.file,line:i.line,covered_by:i.covered_by})));
 console.log(`${name}: 1차 시작 (${cases.length} TC)`);
 const server=await startServer(source,run,config);let result,edge;
 try {
   result=await executeCases({base:server.base,cases,inventory,run,auth:await loadAuth(server.project),round:1});
   const cross=cases.filter(c=>['SEARCH','CODES'].includes(c.operation));
   edge=await executeCases({base:server.base,cases:cross,inventory,run,auth:await loadAuth(source),channel:'msedge',round:1});
 }finally{await server.stop([...(result?.created??[]),...(edge?.created??[])].map(r=>r.key.ID));}
 const m4=await json(path.resolve('docs/evidence/m4-final',name,'test-results.json'));
 const workbook=path.join(run,'functional-results.xlsx');await writeFunctionalWorkbook({template,mapping,cases,results:result,output:workbook,m4,round:1});
 const counts=summarize(result.records),status=counts.FAIL?'FAIL':counts.BLOCKED?'PARTIAL':'PASS';
 await manifest(run,id,status,inventory.source_revision,1);
 const frozen={case_sha256:digest(await readFile(path.join(run,'cases.json'))),first_workbook_sha256:digest(await readFile(workbook)),first_results_sha256:digest(await readFile(path.join(run,'results-chrome.json')))};
 await save(path.join(run,'freeze.json'),frozen);
 baselines[name]={run,source,inventory,cases,result,m4,workbook,frozen};
 console.log(`${name}: 1차 보존 ${JSON.stringify(counts)} / Edge ${JSON.stringify(summarize(edge.records))}`);
}
await save(path.join(output,'first-summary.json'),Object.fromEntries(Object.entries(baselines).map(([name,b])=>[name,{run:b.run,counts:summarize(b.result.records),frozen:b.frozen}])));
console.log('두 1차 결과 보존 완료. 이후 동일 TC로 학습 패치 2차 실행');
for(const entry of (await readdir('evals/debug/cases',{withFileTypes:true})).filter(e=>e.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))) {
 const spec=await json(`evals/debug/cases/${entry.name}/case.json`),baseline=baselines[spec.testbed];
 if(!baseline)throw Error('정상 기준선 없음');
 if(spec.mode==='log-only'){evaluation.push({case_id:spec.id,status:'BLOCKED',reason:'로그 전용 Oracle 사례. 로컬 앱 패치 실행 불가'});continue;}
 const id=`m5b-second-${spec.id}-${config.version??'v1'}`,run=path.join(baseline.source,'.sistack/runs',id);await mkdir(run);
 await assertFrozen(baseline);
 await save(path.join(run,'cases.json'),baseline.cases);
 if(digest(await readFile(path.join(run,'cases.json')))!==baseline.frozen.case_sha256)throw Error('2차 TC 변경');
 await save(path.join(run,'first-reference.json'),{parent_run_id:path.basename(baseline.run),...baseline.frozen});
 console.log(`${spec.id}: 2차 시작`);
 const server=await startServer(baseline.source,run,config,project=>applyUnitPatch(project,path.resolve(`evals/debug/cases/${spec.id}/bug.patch`)));
 let result;try{result=await executeCases({base:server.base,cases:baseline.cases,inventory:baseline.inventory,run,auth:await loadAuth(server.project),round:2});}finally{await server.stop((result?.created??[]).map(r=>r.key.ID));}
 await writeFunctionalWorkbook({template,mapping,cases:baseline.cases,results:result,output:path.join(run,'functional-results.xlsx'),m4:baseline.m4,round:2,first:baseline.workbook});
 const failures=result.records.filter(r=>r.status==='FAIL'&&baseline.result.records.some(a=>a.case_id===r.case_id&&a.status==='PASS'));
 await save(path.join(run,'failure-review.json'),{status_values_changed:false,notes:result.records.filter(r=>r.status==='FAIL').map(r=>{const previous=baseline.result.records.find(p=>p.case_id===r.case_id);return {case_id:r.case_id,classification:previous?.status==='PASS'?'제품 결함(학습 패치)':'미확정(기준선 미통과/파생 실패)',baseline_status:previous?.status,request_evidence:r.request_evidence,original_reason:r.reason};})});
 evaluation.push({case_id:spec.id,status:failures.length?'DETECTED':'MISSED',baseline_pass_cases:baseline.result.records.filter(r=>r.status==='PASS').length,detected_by:failures.map(r=>r.case_id),counts:summarize(result.records),run});
 await save(path.join(run,'evaluation.json'),evaluation.at(-1));await manifest(run,id,result.records.some(r=>r.status==='FAIL')?'FAIL':'PARTIAL',baseline.inventory.source_revision,2);
 await assertFrozen(baseline);console.log(`${spec.id}: ${evaluation.at(-1).status} ${JSON.stringify(summarize(result.records))}`);
}
async function assertFrozen(b) {
 if(digest(await readFile(b.workbook))!==b.frozen.first_workbook_sha256||digest(await readFile(path.join(b.run,'results-chrome.json')))!==b.frozen.first_results_sha256||digest(await readFile(path.join(b.run,'cases.json')))!==b.frozen.case_sha256)throw Error('보존한 1차 결과 변경');
}
await save(path.join(output,'training-evaluation.json'),{dataset:'M3 승인 학습 10건',generalization:false,cases:evaluation});
console.log('M5b 1차/학습 패치 2차 완료');
