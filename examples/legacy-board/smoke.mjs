import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:8080/legacy-board';
let cookie = '';
async function request(route, values) {
  const response = await fetch(base + route, {
    method: values ? 'POST' : 'GET',
    redirect: 'manual',
    headers: { cookie, ...(values ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
    body: values ? new URLSearchParams(values) : undefined,
    signal: AbortSignal.timeout(15000)
  });
  const session = response.headers.get('set-cookie')?.match(/JSESSIONID=[^;, ]+/)?.[0];
  if (session) {
    cookie = session;
  }
  return {
    status: response.status,
    text: await response.text(),
    location: response.headers.get('location'),
    contentType: response.headers.get('content-type')
  };
}

function csrf(html) {
  const value = /name="csrf" value="([^"]+)"/.exec(html)?.[1];
  assert.ok(value, 'CSRF 입력 누락');
  return value;
}

function json(response) {
  assert.equal(response.status, 200);
  assert.ok(response.contentType.startsWith('application/json'));
  return JSON.parse(response.text);
}

assert.equal((await request('/board/list.do')).status, 302);
let login = await request('/auth/login.do');
assert.equal(login.status, 200);
assert.equal((await request('/auth/login.do', { csrf: csrf(login.text), role: 'READER' })).status, 302);
assert.equal((await request('/code/list.do')).status, 403);
assert.equal((await request('/code/listJson.do')).status, 403);
let list = await request('/board/list.do');
assert.equal(list.status, 200);
assert.ok(list.text.includes('게시판 안내'));
assert.ok(list.text.includes('로그아웃'));
assert.ok(list.text.includes('페이지 이동'));
assert.equal((await request('/board/delete.do', { csrf: csrf(list.text), id: '1' })).status, 403);
await request('/auth/logout.do', { csrf: csrf(list.text) });
login = await request('/auth/login.do');
await request('/auth/login.do', { csrf: csrf(login.text), role: 'ADMIN' });
list = await request('/board/list.do');
const token = csrf(list.text);
assert.equal((await request('/resources/vendor/jquery-3.7.1.min.js')).status, 200);
assert.equal((await request('/board/form.do')).status, 200);
assert.equal((await request('/code/list.do')).status, 200);
const codes = json(await request('/code/listJson.do?page=1'));
assert.equal(codes.total, 2);
assert.deepEqual(codes.codes, [{ code: 'FREE', label: '자유' }, { code: 'NOTICE', label: '공지' }]);
assert.deepEqual(json(await request('/code/listJson.do?page=2')).codes, []);
assert.equal((await request('/code/listJson.do?page=0')).status, 400);
const created = await request('/board/create.do', { csrf: token, title: 'HTTP 합성 글', content: '<script>fixture</script>', category: 'FREE' });
assert.equal(created.status, 302);
const id = new URL(created.location, base).searchParams.get('id');
assert.ok(id);
const detail = await request('/board/detail.do?id=' + id);
assert.equal(detail.status, 200);
assert.ok(detail.text.includes('&lt;script&gt;fixture&lt;/script&gt;'));
assert.equal((await request('/board/form.do?id=' + id)).status, 200);
assert.equal((await request('/board/update.do', { csrf: token, id, title: 'HTTP 수정 글', content: '수정 본문', category: 'NOTICE' })).status, 302);
assert.ok((await request('/board/list.do?keyword=' + encodeURIComponent('HTTP 수정 글'))).text.includes('HTTP 수정 글'));
assert.equal((await request('/board/delete.do', { id })).status, 403);
assert.equal((await request('/board/detail.do?id=' + id)).status, 200);
assert.deepEqual(json(await request('/board/delete.do', { csrf: token, id })), { success: true });
assert.equal((await request('/board/detail.do?id=' + id)).status, 404);
assert.equal((await request('/auth/logout.do', { csrf: token })).status, 302);
console.log('PASS: 실제 HTTP 로그인·권한·JSP·CRUD·검색·JSON GET/POST·map 페이징·CSRF·출력 이스케이프·로그아웃');
