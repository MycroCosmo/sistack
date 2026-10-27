import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:8080/legacy-board-thymeleaf';
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
  if (session) cookie = session;
  return { status: response.status, text: await response.text(), location: response.headers.get('location') };
}
function csrf(html) {
  const value = /name="csrf" value="([^"]+)"/.exec(html)?.[1];
  assert.ok(value, 'CSRF 입력 누락');
  return value;
}
async function login(role) {
  const response = await request('/auth/login.do');
  assert.equal(response.status, 200);
  assert.equal((await request('/auth/login.do', { csrf: csrf(response.text), role })).status, 302);
}

assert.equal((await request('/board/list.do')).status, 302);
await login('READER');
let list = await request('/board/list.do');
assert.equal(list.status, 200);
assert.ok(!list.text.includes('id="loadCategories"'));
assert.equal((await request('/code/list.do')).status, 403);
await request('/auth/logout.do', { csrf: csrf(list.text) });
await login('ADMIN');
list = await request('/board/list.do');
assert.equal(list.status, 200);
assert.equal((list.text.match(/aria-label="주 메뉴"/g) || []).length, 1);
assert.ok(list.text.includes('페이지 이동'));
assert.ok(!/\b(?:th|layout):/.test(list.text));
for (const id of ['loadCategories', 'refreshCategories']) {
  const tag = list.text.match(new RegExp('<button[^>]*id="' + id + '"[^>]*>'))?.[0];
  const url = tag?.match(/data-url="([^"]+)"/)?.[1];
  assert.equal(url, '/legacy-board-thymeleaf/code/listJson.do?page=1');
  const json = await request(url.replace('/legacy-board-thymeleaf', ''));
  assert.equal(json.status, 200);
  assert.deepEqual(JSON.parse(json.text).codes, [{ code: 'FREE', label: '자유' }, { code: 'NOTICE', label: '공지' }]);
}
const jsp = await request('/code/list.do');
assert.equal(jsp.status, 200);
assert.ok(jsp.text.includes('게시판 분류 코드'));
assert.ok(jsp.text.includes('/resources/board.js'));
const form = await request('/board/form.do');
assert.equal(form.status, 200);
assert.ok(form.text.includes('action="/legacy-board-thymeleaf/board/create.do"'));
const token = csrf(form.text);
assert.equal((await request('/board/create.do', { title: 'CSRF 거부', content: '본문', category: 'FREE' })).status, 403);
const title = 'Thymeleaf HTTP 합성 ' + Date.now();
const created = await request('/board/create.do', { csrf: token, title, content: '<script>fixture</script>', category: 'FREE' });
assert.equal(created.status, 302);
const id = new URL(created.location, base).searchParams.get('id');
assert.ok(id);
const detail = await request('/board/detail.do?id=' + id);
assert.equal(detail.status, 200);
assert.ok(detail.text.includes('&lt;script&gt;fixture&lt;/script&gt;'));
const edit = await request('/board/form.do?id=' + id);
assert.equal(edit.status, 200);
assert.ok(edit.text.includes('action="/legacy-board-thymeleaf/board/update.do"'));
const search = await request('/board/list.do?keyword=' + encodeURIComponent(title));
assert.equal(search.status, 200);
assert.ok(search.text.includes(title));
assert.ok(!search.text.includes('게시판 안내'));
assert.equal((await request('/board/list.do?keyword=NO_MATCH_SYNTHETIC')).text.includes('조회 결과가 없습니다.'), true);
assert.equal((await request('/auth/logout.do', { csrf: token })).status, 302);
console.log('PASS: HTTP 로그인·권한·레이아웃·data URL 2종·JSP 공존·등록·검색·CSRF·이스케이프. 외부 JS 클릭은 별도 브라우저 검증.');
