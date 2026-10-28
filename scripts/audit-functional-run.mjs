import path from 'node:path';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {json,save,digest} from '../lib/trace/io.mjs';
import {validateManifest} from '../lib/manifest/index.mjs';
import {compareCases} from '../lib/functional/inventory.mjs';
import {compareCensus} from './audit-functional-inventory.mjs';
const [configFile,priorFile,outFile]=process.argv.slice(2);if(!outFile)throw Error('사용법: node scripts/audit-functional-run.mjs <config> <이전-해시.json> <새-summary.json>');
const config=await json(configFile),evaluation=await json(path.join(config.output,'training-evaluation.json')),approved=await json('evals/functional/expected.json'),definition=await json('schemas/docs/functional-results.schema.json'),prior=await json(priorFile),projects={};
for(const [file,hash]of Object.entries(prior.files))assert.equal(digest(await readFile(file)),hash,`이전 결과 보존: ${file}`);
const counts=records=>records.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{});
async function resultCheck(run){
 const result=await json(path.join(run,'results-chrome.json'));assert.deepEqual(validateManifest(result,definition),[]);assert.deepEqual(validateManifest(await json(path.join(run,'manifest.json'))),[]);
 const db=await json(path.join(run,'evidence/db-preservation.json'));for(const k of ['file_database','script_dump','source_unchanged','keys_verified'])assert.equal(db[k],true);
 for(const file of ['application.mv.db','snapshot.sql'])assert.ok((await stat(path.join(run,'evidence/db',file))).size>0);
 const book=await json(path.join(run,'functional-results.xlsx.verification.json'));assert.equal(book.status,'PASS');
 for(const r of result.records.filter(r=>r.mode==='AUTO-UI'&&r.status==='PASS')){assert.ok(r.selection_evidence.length);for(const s of r.selection_evidence)assert.equal(s.selected.count,1);assert.ok((await stat(path.join(run,r.screenshot))).size>0);const request=await json(path.join(run,r.request_evidence));assert.ok(request.actual.length>0);}
 return result;
}
for(const project of ['legacy-board','legacy-board-thymeleaf']){
 const run=path.resolve(`examples/${project}/.sistack/runs/m5b-first-${config.version}`),result=await resultCheck(run),inventory=await json(path.join(run,'inventory.json')),cases=await json(path.join(run,'cases.json')),frozen=await json(path.join(run,'freeze.json')),map=await json(path.join(run,'coverage-map.json'));
 assert.equal(digest(await readFile(path.join(run,'cases.json'))),frozen.case_sha256);assert.equal(digest(await readFile(path.join(run,'results-chrome.json'))),frozen.first_results_sha256);assert.equal(digest(await readFile(path.join(run,'functional-results.xlsx'))),frozen.first_workbook_sha256);
 for(const value of Object.values(compareCases(inventory,cases)))assert.deepEqual(value,[]);assert.equal(cases.filter(c=>['hidden','fragment'].includes(c.kind)).length,0);
 const structural=inventory.items.filter(i=>['hidden','fragment'].includes(i.kind));assert.equal(map.length,structural.length);for(const item of structural)assert.equal(map.filter(m=>m.inventory_item_id===item.inventory_item_id&&m.covered_by===item.covered_by).length,1);
 const comparison=compareCensus(approved.projects[project].census,inventory);assert.equal(comparison.missing.length,0);assert.equal(comparison.extra.length,0);
 const edge=await json(path.join(run,'results-msedge.json'));assert.deepEqual(validateManifest(edge,definition),[]);for(const r of edge.records.filter(r=>r.mode==='AUTO-UI'&&r.status==='PASS')){assert.ok((await stat(path.join(run,r.screenshot))).size>0);assert.ok(r.selection_evidence.length);for(const chosen of r.selection_evidence)assert.equal(chosen.selected.count,1);const request=await json(path.join(run,r.request_evidence));assert.ok(request.actual.length>0);}
 const previous=await json(path.resolve(`examples/${project}/.sistack/runs/m5b-first-v2/results-chrome.json`));
 projects[project]={source_revision:inventory.source_revision,inventory:inventory.items.length,missing:0,extra:0,cases:cases.length,v2_cases:previous.records.length,case_delta:cases.length-previous.records.length,counts:counts(result.records),v2_counts:counts(previous.records),modes:result.records.reduce((a,r)=>{const key=`${r.mode}:${r.status}`;a[key]=(a[key]??0)+1;return a;},{}),blocked_reasons:result.records.filter(r=>r.status==='BLOCKED').reduce((a,r)=>{const key=r.reason.split(';')[0];a[key]=(a[key]??0)+1;return a;},{}),covered_structural:structural.length,covered_by_outcomes:structural.reduce((a,i)=>{const status=result.records.find(r=>r.case_id===i.covered_by).status;a[status]=(a[status]??0)+1;return a;},{}),selector_kinds:result.records.flatMap(r=>r.selection_evidence??[]).filter(s=>s.selected).reduce((a,s)=>(a[s.selected.kind]=(a[s.selected.kind]??0)+1,a),{}),edge:counts(edge.records),db_preserved:true,first_frozen:true};
}
for(const c of evaluation.cases.filter(c=>c.run)){
 const result=await resultCheck(c.run),ref=await json(path.join(c.run,'first-reference.json')),check=await json(path.join(c.run,'functional-results.xlsx.verification.json'));assert.equal(check.first_columns_preserved,true);assert.equal(digest(await readFile(path.join(c.run,'cases.json'))),ref.case_sha256);
 const project=c.run.includes('legacy-board-thymeleaf')?'legacy-board-thymeleaf':'legacy-board',base=await json(path.resolve(`examples/${project}/.sistack/runs/m5b-first-${config.version}/results-chrome.json`));
 const detected=result.records.filter(r=>r.status==='FAIL'&&base.records.some(b=>b.case_id===r.case_id&&b.status==='PASS')).map(r=>r.case_id);assert.deepEqual(c.detected_by,detected);assert.equal(c.status,detected.length?'DETECTED':'MISSED');
}
const deliveries=await json(path.join(config.output,'delivery-receipts.json'));assert.equal(deliveries.length,11);for(const d of deliveries){const check=await json(d.output+'.verification.json');assert.equal(check.status,'PASS');if(d.sha256)assert.equal(digest(await readFile(d.output)),d.sha256);if(d.case_id){assert.equal(check.first_columns_preserved,true);assert.equal(check.source_sha256,d.first_sha256);}}
const summary={version:config.version,implementation_revision:Object.values(projects)[0].source_revision,status:'PARTIAL',milestone:'M5b 완료; 실행 제한은 상태/보고서에 별도 명시',inventory_approval:{approved_by:approved.approved_by,approved_at:approved.approved_at,sha256:digest(await readFile('evals/functional/expected.json'))},projects,training:{generalization:false,counts:counts(evaluation.cases),cases:evaluation.cases.map(c=>({case_id:c.case_id,status:c.status,detected_by:c.detected_by??[]}))},preservation:{previous_result_files:Object.keys(prior.files).length,already_absent_old_files:prior.already_absent.length,all_preexisting_hashes_unchanged:true,delivery_workbooks:deliveries.length},popup:{actual_samples:0,status:'UNVERIFIED'}};
await save(outFile,summary);console.log(JSON.stringify({projects,training:summary.training.counts,preservation:summary.preservation},null,2));
