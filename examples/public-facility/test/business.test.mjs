import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {project,runMaven} from '../scripts/runtime.mjs';

test('실제 Spring·MyBatis·H2에서 권한, 신청, 심사, 중복·동시성, 이력, HTTP를 검증한다', {timeout:120000},()=>{
  const result=runMaven(['-o','-q','test']);
  assert.equal(result.error,undefined,result.error?.message);
  assert.equal(result.status,0,`${result.stdout}\n${result.stderr}`);
  const report=fs.readFileSync(path.join(project,'target/surefire-reports/TEST-kr.sistack.facility.FacilityFlowTest.xml'),'utf8');
  const suite=report.match(/<testsuite\b[^>]*>/)?.[0];
  assert.ok(suite,'JUnit 실행 보고서 누락');
  assert.match(suite,/errors="0"/);
  assert.match(suite,/failures="0"/);
  assert.match(suite,/skipped="0"/);
  const count=Number(suite.match(/tests="(\d+)"/)?.[1]);
  assert.ok(count>=13,`업무 테스트 누락: ${count}`);
  console.log(`JUnit ${count}건 PASS (Node 래퍼 1건과 별도 집계)`);
});
