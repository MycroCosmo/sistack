import path from 'node:path';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {json,save,digest} from '../lib/trace/io.mjs';
import {writeFunctionalWorkbook} from '../lib/functional/workbook.mjs';
if(process.argv.length!==3)throw Error('사용법: node scripts/finalize-functional-delivery.mjs <실행-config.json>');
const config=await json(process.argv[2]),mapping=await json(config.mapping),aggregate=await json(path.join(config.output,'training-evaluation.json')),delivery=path.join(config.output,'delivery'),receipts=[];
for(const project of ['legacy-board','legacy-board-thymeleaf']){
 const run=path.resolve(`examples/${project}/.sistack/runs/m5b-first-${config.version}`),cases=await json(path.join(run,'cases.json')),results=await json(path.join(run,'results-chrome.json')),m4=await json(`docs/evidence/m4-final/${project}/test-results.json`),original=path.join(run,'functional-results.xlsx'),frozen=await json(path.join(run,'freeze.json'));
 const first=path.resolve(delivery,project,'first.xlsx');
 await writeFunctionalWorkbook({template:config.template,mapping,cases,results,output:first,m4,round:1});
 const firstHash=digest(await readFile(first));
 for(const c of aggregate.cases.filter(c=>c.run&&path.resolve(c.run).startsWith(path.dirname(run)+path.sep))){
  const second=await json(path.join(c.run,'results-chrome.json')),review=await json(path.join(c.run,'failure-review.json'));
  second.records=second.records.map(r=>{const note=review.notes.find(n=>n.case_id===r.case_id);return note?{...r,reason:`${r.reason}\n판정: ${note.classification}. 같은 TC 기준선 ${note.baseline_status}; 상세 요청 근거 ${note.request_evidence}`}:r;});
  const output=path.resolve(delivery,project,`second-${c.case_id}.xlsx`);
  await writeFunctionalWorkbook({template:config.template,mapping,cases,results:second,output,m4,round:2,first});
  assert.equal(digest(await readFile(first)),firstHash);
  receipts.push({project,case_id:c.case_id,output,first_sha256:firstHash,status_values_changed:false});
 }
 assert.equal(digest(await readFile(original)),frozen.first_workbook_sha256);assert.equal(digest(await readFile(path.join(run,'results-chrome.json'))),frozen.first_results_sha256);assert.equal(digest(await readFile(path.join(run,'cases.json'))),frozen.case_sha256);
 receipts.push({project,output:first,sha256:firstHash,raw_first_unchanged:true,change:'SKIP 미실행 행의 수행일/테스터 공란; 상태 및 TC 결과 변경 없음'});
}
await save(path.join(config.output,'delivery-receipts.json'),receipts);console.log(`PASS: 최종 배포본 ${receipts.length}개, 1차·원시 결과 보존`);
