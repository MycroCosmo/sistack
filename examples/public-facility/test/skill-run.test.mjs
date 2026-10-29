import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,environment,unitSkill} from '../scripts/runtime.mjs';
test('si-unit-test의 공식 실행기로 업무 테스트를 실행하고 표준 결과를 검증한다',{timeout:240000},()=>{
  const env=environment(),runId='facility-unit-'+Date.now();
  const directory=path.join(root,'.sistack');fs.mkdirSync(directory,{recursive:true});
  const configFile=path.join(directory,runId+'.json');
  fs.writeFileSync(configFile,JSON.stringify({run_id:runId,test_pattern:'ReservationServiceTest,ReservationMapperTest',
    plan_file:path.join(root,'test/test-plan.json'),maven:env.maven,java_home:env.javaHome,allow_test_execution:true,
    parent_run_ids:['facility-reference-20261029']},null,2),{flag:'wx'});
  const result=spawnSync(process.execPath,[unitSkill(),root,configFile],{cwd:root,windowsHide:true,encoding:'utf8',timeout:210000});
  assert.equal(result.error,undefined,result.error?.message);
  assert.equal(result.status,0,`${result.stdout}\n${result.stderr}`);
  const output=JSON.parse(fs.readFileSync(path.join(directory,'runs',runId,'test-results.json')));
  assert.equal(output.execution_status,'SUCCESS');
  assert.equal(output.summary.total,19);
  assert.equal(output.summary.passed,19);
  console.log(`si-unit-test: JUnit 19/19 PASS, 보고서 .sistack/runs/${runId}/report.md`);
});
