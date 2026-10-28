import path from 'node:path';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {json,digest} from '../lib/trace/io.mjs';
import {validateManifest} from '../lib/manifest/index.mjs';
import {compareCensus,checkFunctionalExpected} from '../scripts/audit-functional-inventory.mjs';
const definition=await json('schemas/docs/functional-results.schema.json'),approved=await json('evals/functional/expected.json');
const summary={scope:'M5b 두 로컬 테스트베드 기능 검증. 형식 일반성 검증이며 현장 검증 아님',status:'PARTIAL',inventory_approval:{approved_by:approved.approved_by,approved_at:approved.approved_at,evidence:approved.approval_evidence,sha256:digest(await readFile('evals/functional/expected.json'))},popup:{actual_testbed_samples:0,status:'UNVERIFIED',backlog:'v0.2 검증용 화면 추가'},inventory:await checkFunctionalExpected(),versions:{},training:{},preservation:{}};
const evidence=[];
for(const version of ['v1','v2']) {
 const aggregate=await json(`.sistack/runs/m5b-evaluation-${version}/training-evaluation.json`),projects={};
 for(const name of ['legacy-board','legacy-board-thymeleaf']){
  const run=path.resolve(`examples/${name}/.sistack/runs/m5b-first-${version}`),first=await json(path.join(run,'results-chrome.json')),freeze=await json(path.join(run,'freeze.json')),cases=await json(path.join(run,'cases.json'));
  assert.deepEqual(validateManifest(await json(path.join(run,'manifest.json'))),[]);assert.deepEqual(validateManifest(first,definition),[]);assert.equal(digest(await readFile(path.join(run,'functional-results.xlsx'))),freeze.first_workbook_sha256);assert.equal(digest(await readFile(path.join(run,'results-chrome.json'))),freeze.first_results_sha256);assert.equal(digest(await readFile(path.join(run,'cases.json'))),freeze.case_sha256);
  const inv=await json(path.join(run,'inventory.json')),comparison=compareCensus(approved.projects[name].census,inv);assert.equal(comparison.missing.length,0);assert.equal(comparison.extra.length,0);
  const counts=first.records.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{}),modes=first.records.reduce((a,r)=>{const k=`${r.mode}:${r.status}`;a[k]=(a[k]??0)+1;return a;},{}),reasons=first.records.filter(r=>r.status==='BLOCKED').reduce((a,r)=>(a[r.reason]=(a[r.reason]??0)+1,a),{});
  for(const r of first.records.filter(r=>r.status==='PASS'&&r.mode==='AUTO-UI')){assert.ok(r.screenshot);assert.ok((await stat(path.join(run,r.screenshot))).size>0);const request=await json(path.join(run,r.request_evidence));assert.ok(request.actual.length);}
  const bookCheck=await json(path.join(run,'functional-results.xlsx.verification.json')),db=await json(path.join(run,'evidence/db-preservation.json'));assert.equal(bookCheck.status,'PASS');assert.equal(db.file_database,true);assert.equal(db.script_dump,true);assert.equal(db.source_unchanged,true);if(version==='v2')assert.equal(db.keys_verified,true);
  const edge=await json(path.join(run,'results-msedge.json'));
  projects[name]={run_id:path.basename(run),cases:cases.length,counts,modes,blocked_reasons:reasons,edge_counts:edge.records.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{}),first_frozen:true,workbook_preserved:true,m4_server_logic_rows:bookCheck.server_logic_sheet_rows,created_or_updated_records:first.created.length,db_preserved:true,keys_verified:db.keys_verified??null,approved_inventory_comparison:{missing:0,extra:0}};
  evidence.push({version,project:name,run,freeze});
 }
 for(const c of aggregate.cases.filter(c=>c.run)) {
  const run=c.run,check=await json(path.join(run,'functional-results.xlsx.verification.json')),db=await json(path.join(run,'evidence/db-preservation.json')),results=await json(path.join(run,'results-chrome.json'));
  assert.deepEqual(validateManifest(await json(path.join(run,'manifest.json'))),[]);assert.deepEqual(validateManifest(results,definition),[]);assert.equal(check.status,'PASS');assert.equal(check.first_columns_preserved,true);assert.equal(db.file_database,true);assert.equal(db.script_dump,true);assert.equal(db.source_unchanged,true);
  if(version==='v2'){assert.equal(db.keys_verified,true);const ref=await json(path.join(run,'first-reference.json'));assert.equal(digest(await readFile(path.join(run,'cases.json'))),ref.case_sha256);}
 }
 summary.versions[version]={projects};summary.training[version]={dataset:'승인된 M3 학습 10건',generalization:false,detected:aggregate.cases.filter(c=>c.status==='DETECTED').length,missed:aggregate.cases.filter(c=>c.status==='MISSED').length,blocked:aggregate.cases.filter(c=>c.status==='BLOCKED').length,cases:aggregate.cases.map(c=>({case_id:c.case_id,status:c.status,detected_by:c.detected_by??[],reason:c.reason??null}))};
}
summary.preservation={first_versions_unchanged:true,second_workbooks_preserve_first_columns:true,db_files_and_sql_dumps_retained:true,v2_created_update_keys_verified:true,source_examples_unchanged:true};
assert.deepEqual(await json('docs/evidence/m5b-final/summary.json'),summary);
const receipts=await json('.sistack/runs/m5b-evaluation-v2/delivery-receipts.json');
assert.equal(receipts.length,11);
for(const receipt of receipts){const check=await json(receipt.output+'.verification.json');assert.equal(check.status,'PASS');if(receipt.sha256)assert.equal(digest(await readFile(receipt.output)),receipt.sha256);if(receipt.case_id){assert.equal(check.first_columns_preserved,true);assert.equal(check.source_sha256,receipt.first_sha256);}}
console.log('PASS: 승인 인벤토리·v1/v2 원본·2차 TC·UI 증거·DB 키·최종 배포본 11개 보존 감사');
