import path from 'node:path';
import {mkdir} from 'node:fs/promises';
import {json,save,checkSources,digest} from '../trace/io.mjs';
import {validateManifest} from '../manifest/index.mjs';
import {functionalInventory,generateCases,supplementalCases,compareCases} from './inventory.mjs';
export async function main(args) {
  const[command,project,out]=args;
  if(command==='run'&&args.length===5) {
    const [,_project,planFile,configFile,runId]=args,config=await json(configFile),plan=await json(planFile);
    if(config.allow_execution!==true||![1,2].includes(config.round)||!/^[-\w]+$/.test(runId))throw Error('명시 실행 승인/차수 필요');
    await checkSources(_project,plan.inventory.source_files);
    const [{startServer},{executeCases},{writeFunctionalWorkbook}]=await Promise.all([import('./server.mjs'),import('./execute.mjs'),import('./workbook.mjs')]);
    const run=path.resolve(_project,'.sistack/runs',runId);await mkdir(path.dirname(run),{recursive:true});await mkdir(run);
    const server=await startServer(path.resolve(_project),run,config);let results;
    try{results=await executeCases({base:server.base,cases:plan.cases,inventory:plan.inventory,run,round:config.round,channel:config.channel??'chrome'});}finally{await server.stop();}
    await writeFunctionalWorkbook({template:config.template,mapping:await json(config.mapping),cases:plan.cases,results,output:path.join(run,'functional-results.xlsx'),m4:await json(config.m4),round:config.round,first:config.first_workbook??null});
    await save(path.join(run,'cases.json'),plan.cases);
    const status=results.records.some(r=>r.status==='FAIL')?'FAIL':results.records.some(r=>r.status==='BLOCKED')?'PARTIAL':'PASS';
    const manifest={schema_version:'1.0.0',run_id:runId,skill:'si-docs',created_at:new Date().toISOString(),source_revision:plan.inventory.source_revision,status,inputs:{round:String(config.round),cases_sha256:digest(JSON.stringify(plan.cases))},evidence:[{path:`results-${config.channel??'chrome'}.json`,level:5,description:'로컬 앱의 화면/요청/업무 검증'},{path:'evidence/db-preservation.json',level:4,description:'DB/덤프 및 생성 수정 키 보존'}],unverified:results.records.filter(r=>r.status==='BLOCKED').map(r=>`${r.case_id}: ${r.reason}`),next_actions:[]};
    if(validateManifest(manifest).length)throw Error('manifest 형식 오류');await save(path.join(run,'manifest.json'),manifest);
    await save(path.join(run,'report.md'),`> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.\n\n상태 ${status}. ${results.records.length}건의 결과·요청·화면·DB 증거는 해당 JSON과 evidence 참조.\n`);
    return {run,records:results.records.length};
  }
  if(command!=='plan'||args.length!==3)throw Error('사용법: functional.mjs plan project new-plan.json | run project plan.json config.json new-run-id');
  const inventory=await functionalInventory(project),cases=[...generateCases(inventory),...supplementalCases(inventory)],coverage=compareCases(inventory,cases);
  await save(out,{inventory,cases,coverage});return {items:inventory.items.length,cases:cases.length,coverage};
}
