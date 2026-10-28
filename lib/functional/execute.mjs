import path from 'node:path';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {save,digest} from '../trace/io.mjs';

const role={admin:'ADMIN',viewer:'READER'};
class Blocked extends Error {}
const requireCheck=(condition,message)=>{if(!condition)throw new Blocked(message);};
const csrf=text=>/name="csrf"[^>]*value="([^"]+)"/.exec(text)?.[1];
const locator=s=>`[${s.kind}="${s.value.replaceAll('\\','\\\\').replaceAll('"','\\"')}"]`;

export async function executeCases({base,cases,inventory,run,channel='chrome',round=1}) {
  const browser=await chromium.launch({channel,headless:true}),contexts={},records=[],created=[],state={id:null};
  const marker=`M5b${digest(run).slice(0,8)}`;
  async function context(account) {
    if(contexts[account])return contexts[account];
    requireCheck(role[account],'승인 계정 ID가 없습니다');
    const c=await browser.newContext(),r=await c.request.get(base+'/auth/login.do',{maxRedirects:0}),token=csrf(await r.text());
    requireCheck(r.status()===200&&token,'로그인/CSRF 사전 조건을 확인하지 못했습니다');
    const login=await c.request.post(base+'/auth/login.do',{form:{role:role[account],csrf:token},maxRedirects:0});
    requireCheck(login.status()===302,'역할 로그인 실패');contexts[account]=c;return c;
  }
  function route(url) {return url+(url.includes('?')?'&':'?')+(url.endsWith('/board/detail.do')?`id=${state.id??1}`:url.endsWith('/board/form.do')?'':'page=1');}
  function entryFor(c) {
    const candidates=c.entries??[];
    return candidates.find(e=>c.account_id==='admin'&&e.url.startsWith('/code/'))??candidates.find(e=>e.url==='/board/list.do')??candidates[0];
  }
  async function perform(c,ctx,trace) {
    async function request(url,method='GET',form=null,expected=200) {
      const res=await ctx.request.fetch(base+url,{method,...(form?{form}:{}),maxRedirects:0,timeout:20000});
      const text=await res.text();trace.push({url:new URL(base+url).pathname+new URL(base+url).search,method,status:res.status(),expected_status:expected});
      assert.equal(res.status(),expected,`${method} ${url} 응답 코드가 기대와 다릅니다`);
      return {text,location:res.headers().location,res};
    }
    async function create(count=1) {
      const form=await request('/board/form.do'),token=csrf(form.text);requireCheck(token,'등록 입력의 CSRF가 없습니다');
      for(let i=0;i<count;i++) {
        const title=`한글${marker}${created.length}`,result=await request('/board/create.do','POST',{title,content:`등록 내용 ${marker}`,category:'FREE',csrf:token},302);
        const id=/[?&]id=(\d+)/.exec(result.location??'')?.[1];requireCheck(id,'등록 결과 키를 확인하지 못했습니다');state.id??=id;
        created.push({table:'BOARD',key:{ID:+id},expected_title:title,operation:'INSERT'});
        const detail=await request(`/board/detail.do?id=${id}`);assert.ok(detail.text.includes(title),'등록한 한글 제목을 재조회할 수 있어야 합니다');
      }
      return `확인 테이블 BOARD, ID=${created.map(r=>r.key.ID).join(',')}`;
    }
    async function update() {
      if(!state.id)await create();
      const form=await request(`/board/form.do?id=${state.id}`),token=csrf(form.text),title=`수정${marker}`;
      requireCheck(token,'수정 입력의 CSRF가 없습니다');
      await request(`/board/update.do?id=${state.id}`,'POST',{title,content:`수정 내용 ${marker}`,category:'NOTICE',csrf:token},302);
      created.push({table:'BOARD',key:{ID:+state.id},expected_title:title,operation:'UPDATE'});
      const detail=await request(`/board/detail.do?id=${state.id}`);assert.ok(detail.text.includes(title),'수정한 제목을 재조회할 수 있어야 합니다');
      return `확인 테이블 BOARD, ID=${state.id}`;
    }
    if(c.operation==='CREATE')return create(12);
    if(c.operation==='UPDATE')return update();
    if(c.operation==='ANONYMOUS') {
      const anonymous=await browser.newContext();try{const r=await anonymous.request.get(base+'/board/list.do',{maxRedirects:0});trace.push({url:new URL(base).pathname+'/board/list.do',method:'GET',status:r.status(),expected_status:302});assert.equal(r.status(),302,'미로그인 조회는 로그인으로 이동해야 합니다');assert.ok(r.headers().location?.includes('/auth/login.do'),'로그인 위치가 있어야 합니다');return '미로그인 요청의 로그인 이동 확인';}finally{await anonymous.close();}
    }
    if(c.operation==='SORT') {for(const sort of ['title','createdAt']){const r=await request(`/board/list.do?sort=${sort}`);assert.ok(r.text.includes('게시판 목록'),'정렬 목록 화면을 확인해야 합니다');}return '제목/등록일 정렬 조회 확인';}
    if(c.operation==='BOUNDARY') {await request('/board/list.do?keyword='+encodeURIComponent('가'.repeat(100)));await request('/board/list.do?keyword='+encodeURIComponent('가'.repeat(101)),'GET',null,400);return '검색어 100자 허용·101자 거부 확인';}
    if(c.operation==='PAGING') {const first=await request('/board/list.do?page=1'),second=await request('/board/list.do?page=2');assert.ok(/data-page="2"/.test(first.text),'다음 페이지 이동 값이 있어야 합니다');assert.ok(first.text.includes('페이지 이동'),'페이징 공통 화면의 한글이 보존돼야 합니다');assert.ok(second.text.includes(marker),'두 번째 페이지에서 등록 자료를 조회해야 합니다');return `확인 테이블 BOARD, 생성 ID=${created.filter(r=>r.operation==='INSERT').map(r=>r.key.ID).join(',')}`;}
    if(c.operation==='ERROR') {const r=await request('/board/detail.do?id=-1','GET',null,404);assert.ok(r.text.includes('요청'),'오류 화면의 업무 안내를 확인해야 합니다');return '없는 게시글 오류 화면 확인';}
    if(c.mode==='AUTO-UI') {
      const allowed=new Set(inventory.selectors.map(s=>`${s.kind}:${s.value}`));
      let selectors=c.selector?[c.selector]:c.selector_candidates??[],entry=entryFor(c);
      if(c.operation==='SEARCH'){selectors=[{kind:'id',value:'searchForm'}];entry={url:'/board/list.do'};}
      if(c.operation==='CODES') {
        selectors=inventory.items.filter(i=>i.kind==='button'&&i.selector&&['loadCodes','loadCategories','refreshCategories'].includes(i.selector.value)).map(i=>i.selector);
        entry={url:selectors.some(s=>s.value==='loadCodes')?'/code/list.do':'/board/list.do'};
      }
      requireCheck(selectors.length&&selectors.every(s=>allowed.has(`${s.kind}:${s.value}`)),'실제 id/name 선택자가 없어 UI 동작을 확인할 수 없습니다');
      requireCheck(entry,'화면 진입 요청이 미확정입니다');
      const page=await ctx.newPage(),network=[];
      page.on('response',r=>{if(r.url().startsWith(base))network.push({url:new URL(r.url()).pathname+new URL(r.url()).search,method:r.request().method(),status:r.status()});});
      try {
        const response=await page.goto(base+route(entry.url),{waitUntil:'networkidle',timeout:20000});
        assert.equal(response.status(),200,'UI 진입 화면이 정상 응답해야 합니다');
        const actionStart=network.length;
        for(const s of selectors) {
          if(c.operation==='CODES'&&await page.locator(locator(s)).count()!==1) {
            const declaration=inventory.items.find(i=>i.kind==='button'&&i.selector?.value===s.value);
            const destination=inventory.pages.filter(p=>declaration?.screens.includes(p.file)).flatMap(p=>p.routes).find(r=>r.method==='GET');
            requireCheck(destination,'분류 버튼의 실제 소속 화면 진입 경로가 없습니다');
            const moved=await page.goto(base+route(destination.url),{waitUntil:'networkidle'});assert.equal(moved.status(),200,'버튼 소속 화면이 정상이어야 합니다');
          }
          const target=page.locator(locator(s));requireCheck(await target.count()===1,'선택자가 화면에서 유일하지 않습니다');
          const tag=await target.evaluate(e=>e.tagName.toLowerCase());
          if(c.kind==='hidden') {
            assert.equal(await target.getAttribute('type'),'hidden','숨김 입력 속성이어야 합니다');
            assert.ok((await target.inputValue()).length>0,'숨김 입력이 실제 값을 가져야 합니다');
          }else if(tag==='form') {
            const [arrived]=await Promise.all([page.waitForNavigation({waitUntil:'networkidle',timeout:15000}),target.evaluate(e=>e.requestSubmit()).catch(e=>{if(!e.message.includes('Execution context was destroyed'))throw e;})]);
            assert.equal(arrived.status(),200,'검색 제출 후 도착 응답이 정상이어야 합니다');
            assert.ok((await page.evaluate(()=>document.body.innerText)).includes('게시'),'검색 결과 화면을 확인해야 합니다');
          }else {
            requireCheck(c.requests?.length,'동작의 기대 요청이 미확정입니다');
            const [actionResponse]=await Promise.all([page.waitForResponse(r=>c.requests.some(q=>r.url().split('?')[0]===base+q.url&&r.request().method()===q.method),{timeout:10000}),target.click({timeout:7000})]);
            assert.equal(actionResponse.status(),200,'버튼 동작의 응답이 정상이어야 합니다');
            await page.waitForTimeout(350);
            const statusIds=['codeStatus','categoryStatus'].filter(id=>allowed.has(`id:${id}`));
            let status='';for(const id of statusIds){const loc=page.locator(`[id="${id}"]`);if(await loc.count()===1)status+=await loc.innerText();}
            requireCheck(statusIds.length,'화면 결과를 확인할 실제 id가 없습니다');
            await page.waitForFunction(ids=>ids.some(id=>document.getElementById(id)?.textContent.includes('건 조회 완료')),statusIds,{timeout:7000});
            for(const id of ['codeRows','categoryItems'].filter(id=>allowed.has(`id:${id}`))){const loc=page.locator(`[id="${id}"]`);if(await loc.count()===1)assert.ok((await loc.innerText()).includes('공지'),'조회 결과의 분류 내용을 확인해야 합니다');}
          }
        }
        requireCheck(network.length>0,'네트워크 증거가 없습니다');
        const expected=c.requests??[];
        if(c.kind!=='hidden')assert.ok(expected.length&&expected.some(r=>network.slice(actionStart).some(n=>n.method===r.method&&new URL(base+r.url).pathname===n.url.split('?')[0]&&n.status===200)),'동작 이후의 기대 요청 URL·메서드·응답을 확인해야 합니다');
        await mkdir(path.join(run,'evidence/screenshots'),{recursive:true});
        await page.screenshot({path:path.join(run,'evidence/screenshots',`${c.case_id}-${channel}.png`),fullPage:true});
        trace.push(...network);return '화면 결과와 네트워크 요청을 함께 확인';
      }finally {
        trace.push(...network.filter(n=>!trace.includes(n)));
        await mkdir(path.join(run,'evidence/screenshots'),{recursive:true});
        await page.screenshot({path:path.join(run,'evidence/screenshots',`${c.case_id}-${channel}-final.png`),fullPage:true}).catch(()=>{});
        await page.close();
      }
    }
    const req=c.requests?.[0];
    if(req?.url==='/board/create.do')return create();
    if(req?.url==='/board/update.do')return update();
    if(req?.url==='/auth/login.do'&&req.method==='POST') {
      const form=await request('/auth/login.do');await request('/auth/login.do','POST',{role:role[c.account_id],csrf:csrf(form.text)},302);return '역할 세션 로그인 확인';
    }
    if(req?.url==='/auth/logout.do'){const form=await request('/board/list.do'),token=csrf(form.text);requireCheck(token,'로그아웃 CSRF 입력을 확인하지 못했습니다');await request(req.url,'POST',{csrf:token},302);delete contexts[c.account_id];return '로그아웃 후 로그인 이동 확인';}
    const entry=entryFor(c),url=req?.method==='GET'?req.url:entry?.url;
    requireCheck(url,'직접 실행할 요청 연결이 없습니다');
    const r=await request(route(url));
    if(url.endsWith('listJson.do')){const data=JSON.parse(r.text);assert.ok(Array.isArray(data.codes)&&data.codes.some(x=>x.code==='NOTICE'),'공통 분류 조회 내용을 확인해야 합니다');}
    else {const markers=entry?.markers??inventory.pages.find(p=>p.routes.some(r=>r.url===url))?.markers??[];requireCheck(markers.length,'업무 화면 기대값이 미확정입니다');assert.ok(markers.some(s=>r.text.includes(s)),'업무 화면 제목/내용이 일치해야 합니다');}
    return '요청 응답과 업무 화면 내용 확인';
  }
  try {
    const ordered=[...cases.filter(c=>['CREATE','UPDATE'].includes(c.operation)),...cases.filter(c=>!['CREATE','UPDATE'].includes(c.operation))];
    for(const c of ordered) {
      const trace=[],start=new Date().toISOString(),createdBefore=created.length;let result;
      if(c.mode==='SKIP')result=c.inventory?.download||c.requests?.some(r=>/\/(?:delete|remove|download)\.do$/.test(r.url))?{status:'SKIP',reason:'삭제/다운로드는 호출하지 않음'}:{status:'BLOCKED',reason:'삭제/다운로드 외 항목은 SKIP으로 처리할 수 없습니다'};
      else try{const ctx=await context(c.account_id);result={status:'PASS',reason:await perform(c,ctx,trace)};}catch(e){result={status:e instanceof Blocked?'BLOCKED':'FAIL',classification:e instanceof Blocked?'미확정':'제품 결함 또는 자동화 오탐 검토 필요',reason:e.message.split('\n')[0].slice(0,400)};}
      const touched=created.slice(createdBefore);if(touched.length)result.reason+=`; 확인 테이블 BOARD, ID=${[...new Set(touched.map(r=>r.key.ID))].join(',')}`;
      await save(path.join(run,'evidence/requests',`${c.case_id}-${channel}.json`),{case_id:c.case_id,channel,round,expected:c.expected_requests??[],actual:trace});
      records.push({case_id:c.case_id,inventory_item_id:c.inventory_item_id,mode:c.mode,account_id:c.account_id,round,channel,started_at:start,...result,request_evidence:`evidence/requests/${c.case_id}-${channel}.json`,screenshot:c.mode==='AUTO-UI'?`evidence/screenshots/${c.case_id}-${channel}-final.png`:null});
    }
  }finally{for(const c of Object.values(contexts))await c.close();await browser.close();}
  await save(path.join(run,`results-${channel}.json`),{round,channel,records,created,cleanup_performed:false});
  return {records,created};
}
