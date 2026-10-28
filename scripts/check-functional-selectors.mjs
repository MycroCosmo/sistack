import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {sourceSelections,chooseSourceSelection} from '../lib/functional/selectors.mjs';
const file='synthetic-selector-fixture.html',form={selection_candidates:[{kind:'id',value:'first',tag:'form',file,line:1}]};
for(const channel of ['chrome','msedge']){
 const browser=await chromium.launch({channel,headless:true});try{
  const page=await browser.newPage();await page.setContent('<form id="first"><button id="same" name="firstSave">저장</button></form><form id="second"><button id="same">저장</button></form><a href="/list.do">목록</a>');
  const byName=await chooseSourceSelection(page,sourceSelections({attributes:{id:'same',name:'firstSave'},tag:'button',text:'저장',form,file,line:2}),'http://fixture.invalid');assert.equal(byName.selection.kind,'name','중복 id 뒤 실제 유일 name을 사용해야 한다');
  const scoped=await chooseSourceSelection(page,sourceSelections({attributes:{},tag:'button',text:'저장',form,file,line:2}),'http://fixture.invalid');assert.equal(scoped.selection.kind,'form-text','중복 문구는 소스 폼 범위에서 유일해야 한다');
  const ambiguous=await chooseSourceSelection(page,sourceSelections({attributes:{},tag:'button',text:'저장',file,line:2}),'http://fixture.invalid');assert.equal(ambiguous.target,null,'폼 근거 없는 중복 문구를 선택하지 않아야 한다');
  const link=await chooseSourceSelection(page,sourceSelections({attributes:{href:'/list.do'},tag:'a',text:'목록',file,line:3}),'http://fixture.invalid');assert.equal(link.selection.kind,'href','링크 텍스트보다 실제 href를 우선해야 한다');
  console.log(`PASS: ${channel} 소스 선택자 우선순위·중복 거부·폼 범위·href 4개 검증`);
 }finally{await browser.close();}
}
