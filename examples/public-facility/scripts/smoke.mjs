import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const base='http://127.0.0.1:8092/public-facility';
const checks=[];
class Session {
  cookie=''; csrf='';
  async request(path,fields) {
    const response=await fetch(base+path,{method:fields?'POST':'GET',redirect:'manual',headers:{cookie:this.cookie,...(fields?{'content-type':'application/x-www-form-urlencoded'}:{})},body:fields?new URLSearchParams(fields):undefined});
    const cookie=response.headers.get('set-cookie'); if(cookie)this.cookie=cookie.split(';')[0];
    const html=await response.text();
    const token=html.match(/name="csrf"[^>]*value="([^"]+)"/); if(token)this.csrf=token[1];
    return {status:response.status,location:response.headers.get('location'),html};
  }
  async login(user){await this.request('/login');assert.ok(this.csrf,'CSRF 토큰 발급');assert.equal((await this.request('/login',{user,csrf:this.csrf})).status,302);}
  post(path,fields){return this.request(path,{...fields,csrf:this.csrf});}
}
async function check(name,work){await work();checks.push({name,status:'PASS'});console.log('PASS '+name);}
await mkdir('.sistack/http',{recursive:true});
const applicant=new Session(),reviewer=new Session(),neighbor=new Session();
await applicant.login('applicant');await reviewer.login('reviewer');await neighbor.login('neighbor');
if(process.argv.includes('--verify-persistence')){
  const saved=JSON.parse(await readFile('.sistack/http/persistence.json','utf8'));
  await check('재시작 후 신청 상태와 이력 보존',async()=>{
    const detail=await applicant.request(saved.path);assert.equal(detail.status,200);assert.ok(detail.html.includes(saved.purpose));assert.ok(detail.html.includes('취소'));assert.ok(detail.html.includes('일정 변경'));
  });
  await writeFile('.sistack/http/persistence-result.json',JSON.stringify({at:new Date().toISOString(),checks},null,2));
}else{
  await check('비로그인 접근 차단',async()=>assert.equal((await new Session().request('/requests')).status,401));
  await check('CSRF 없는 변경 차단',async()=>assert.equal((await applicant.request('/requests',{facilityId:2})).status,403));
  await check('신청자의 시설 운영 변경 차단',async()=>assert.equal((await applicant.post('/facilities/2',{enabled:false})).status,403));
  const date=new Date();date.setDate(date.getDate()+20);const day=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  const purpose='HTTP 검증 '+Date.now();
  const form={facilityId:2,useDate:day,startTime:'13:00',endTime:'14:00',people:3,purpose};
  await check('잘못된 날짜는 400',async()=>assert.equal((await applicant.post('/requests',{...form,useDate:'2026-02-30'})).status,400));
  let path;
  await check('신청 저장 및 화면 반영',async()=>{const response=await applicant.post('/requests',form);assert.equal(response.status,302);path=new URL(response.location,base).pathname.replace('/public-facility','');assert.match(path,/^\/requests\/\d+$/);assert.ok((await applicant.request(path)).html.includes(purpose));});
  await check('타인 신청 상세 차단',async()=>assert.equal((await neighbor.request(path)).status,403));
  await check('동일 시간 중복 차단',async()=>assert.equal((await neighbor.post('/requests',form)).status,400));
  await check('신청자 승인 권한 차단',async()=>assert.equal((await applicant.post(path,{action:'approve'})).status,403));
  await check('반려 사유 누락 차단',async()=>assert.equal((await reviewer.post(path,{action:'reject'})).status,400));
  await check('담당자 승인 및 중복 처리 차단',async()=>{assert.equal((await reviewer.post(path,{action:'approve'})).status,302);assert.equal((await reviewer.post(path,{action:'approve'})).status,400);});
  await check('본인 취소와 사유 이력 저장',async()=>{assert.equal((await applicant.post(path,{action:'cancel',reason:'일정 변경'})).status,302);const response=await applicant.request(path);assert.ok(response.html.includes('일정 변경'));assert.ok(response.html.includes('취소'));});
  await check('검색 결과에서 권한 범위 적용',async()=>{const url='/requests?keyword='+encodeURIComponent(purpose);assert.ok((await applicant.request(url)).html.includes(purpose));assert.ok(!(await neighbor.request(url)).html.includes('>'+purpose+'<'));});
  await writeFile('.sistack/http/persistence.json',JSON.stringify({path,purpose},null,2));
  await writeFile('.sistack/http/results.json',JSON.stringify({at:new Date().toISOString(),checks},null,2));
}
