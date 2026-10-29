import assert from 'node:assert/strict';
const base='http://127.0.0.1:8092/public-facility';
function client() {
  let cookie='', csrf='';
  return {
    async request(url, fields) {
      const response=await fetch(base+url,{method:fields?'POST':'GET',redirect:'manual',
        headers:cookie?{cookie}:{},body:fields?new URLSearchParams({...fields,csrf}):undefined});
      const setCookie=response.headers.getSetCookie();
      if(setCookie.length) cookie=setCookie.map(v=>v.split(';')[0]).join('; ');
      const body=await response.text();
      const token=body.match(/name="csrf"[^>]*value="([^"]+)"/);
      if(token) csrf=token[1];
      return {status:response.status,body,location:response.headers.get('location')};
    },
    async login(account) {
      assert.equal((await this.request('/auth/login')).status,200);
      assert.equal((await this.request('/auth/login',{account})).status,302);
    }
  };
}
const applicant=client(), neighbor=client(), reviewer=client(), admin=client();
await applicant.login('applicant'); await neighbor.login('neighbor');
await reviewer.login('reviewer'); await admin.login('admin');
for(const route of ['/dashboard','/facilities','/bookings','/bookings/new'])
  assert.equal((await applicant.request(route)).status,200,route);
const date=new Date(); date.setDate(date.getDate()+40);
const useDate=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
const purpose='HTTP 실습 검증 '+Date.now();
const fields={facilityId:'3',useDate,startTime:'16:00',endTime:'17:00',attendees:'5',purpose};
const submission=await applicant.request('/bookings',fields);
assert.equal(submission.status,302,submission.body);
const id=submission.location.match(/bookings\/(\d+)/)?.[1];
assert.ok(id);
assert.equal((await neighbor.request('/bookings/'+id)).status,403);
assert.equal((await neighbor.request('/bookings',fields)).status,400);
assert.equal((await applicant.request('/bookings/'+id+'/decision',{action:'approve'})).status,403);
assert.equal((await reviewer.request('/bookings/'+id+'/decision',{action:'reject',reason:''})).status,400);
assert.equal((await reviewer.request('/bookings/'+id+'/decision',{action:'approve',reason:'시설 일정 확인'})).status,302);
const approved=await applicant.request('/bookings/'+id);
assert.match(approved.body,/id="booking-status"[^>]*>승인</);
assert.equal((await applicant.request('/bookings/'+id+'/decision',{action:'cancel',reason:'실습 후 일정 변경'})).status,302);
const cancelled=await applicant.request('/bookings/'+id);
assert.match(cancelled.body,/id="booking-status"[^>]*>취소</);
assert.match(cancelled.body,/시설 일정 확인/);
const results=await applicant.request('/bookings?keyword='+encodeURIComponent(purpose));
assert.match(results.body,new RegExp(purpose));
assert.equal((await reviewer.request('/facilities/4/availability',{active:'true'})).status,403);
console.log(JSON.stringify({status:'PASS',roles:4,flow:'신청→중복 차단→권한 차단→승인→취소→검색·이력',booking_id:id,data_preserved:true}));
