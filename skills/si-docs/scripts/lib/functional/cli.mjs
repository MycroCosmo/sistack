import path from 'node:path';
import {mkdir} from 'node:fs/promises';
import {json,save,checkSources} from '../trace/io.mjs';
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
    return {run,records:results.records.length};
  }
  if(command!=='plan'||args.length!==3)throw Error('사용법: functional.mjs plan project new-plan.json | run project plan.json config.json new-run-id');
  const inventory=await functionalInventory(project),cases=[...generateCases(inventory),...supplementalCases(inventory)],coverage=compareCases(inventory,cases);
  await save(out,{inventory,cases,coverage});return {items:inventory.items.length,cases:cases.length,coverage};
}
