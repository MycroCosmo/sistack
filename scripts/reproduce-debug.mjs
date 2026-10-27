import path from 'node:path';
import { readFile, copyFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as pause } from 'node:timers/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { prepareCase } from './eval-debug.mjs';
import { root, isMain, cli } from './common.mjs';
import { json, save } from '../lib/trace/io.mjs';
import { mask } from '../lib/mask/index.mjs';
import { installCapture } from './debug-capture.mjs';
import { StringDecoder } from 'node:string_decoder';

export async function probeCase(id, base) {
  const url = new URL(base);
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('로컬 테스트 서버만 허용합니다');
  let cookie = '';
  async function request(route, values) {
    const response = await fetch(base + route, { method: values ? 'POST' : 'GET', redirect: 'manual',
      headers: { cookie, ...(values ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
      body: values ? new URLSearchParams(values) : undefined, signal: AbortSignal.timeout(15000) });
    const session = response.headers.get('set-cookie')?.match(/JSESSIONID=[^;, ]+/)?.[0]; if (session) cookie = session;
    return { status: response.status, text: await response.text(), location: response.headers.get('location') };
  }
  const csrf = html => {
    const value = /name="csrf"[^>]*value="([^"]+)"/.exec(html)?.[1]; assert.ok(value, 'CSRF 입력 필요'); return value;
  };
  if (id === '04-session-bypass') { const res = await request('/board/list.do'); return { healthy: res.status === 302, bug: res.status === 500, observed: { anonymous_status: res.status } }; }
  const login = await request('/auth/login.do'); assert.equal(login.status, 200);
  assert.equal((await request('/auth/login.do', { role: 'ADMIN', csrf: csrf(login.text) })).status, 302);
  if (['01-binding', '08-thymeleaf-utilities', '09-view-resolver'].includes(id)) {
    const res = await request('/board/list.do');
    return { healthy: res.status === 200, bug: res.status === (id === '09-view-resolver' ? 404 : 500), observed: { list_status: res.status } };
  }
  if (id === '02-js-url') {
    const script = await request('/resources/board.js'); assert.equal(script.status, 200);
    const events = {}, form = { attr(key, value) { if (value !== undefined) { this[key] = value; return this; } return key === 'data-base' ? url.pathname + '/board' : this[key]; }, find() { return { val() {} }; }, on(event, handler) { events[event] = handler; } };
    const $ = arg => typeof arg === 'function' ? arg() : arg === '#searchForm' ? form : { on() {} };
    vm.runInNewContext(script.text, { $ }, { timeout: 1000 }); events.submit();
    const response = await request(form.action.slice(url.pathname.length));
    return { healthy: response.status === 200, bug: response.status === 404, observed: { url: form.action, status: response.status } };
  }
  if (id === '06-sort-sql') {
    const title = await request('/board/list.do?sort=title'), date = await request('/board/list.do?sort=createdAt');
    assert.equal(title.status, 200); return { healthy: date.status === 200, bug: date.status === 500, observed: { title_status: title.status, date_status: date.status } };
  }
  if (id === '10-fragment-encoding') {
    const res = await request('/board/list.do'); assert.equal(res.status, 200); assert.ok(res.text.includes('게시판 목록'));
    return { healthy: res.text.includes('페이지 이동'), bug: !res.text.includes('페이지 이동'), observed: { status: res.status, body_korean: true, fragment_korean: res.text.includes('페이지 이동') } };
  }
  if (['03-request-encoding', '05-paging'].includes(id)) {
    const form = await request('/board/form.do'); assert.equal(form.status, 200); const token = csrf(form.text);
    const created = [];
    try {
      for (let i = 0; i < (id === '05-paging' ? 10 : 1); i++) {
        const result = await request('/board/create.do', { title: `한글 검증 ${i}`, content: '합성 테스트', category: 'FREE', csrf: token });
        assert.equal(result.status, 302); created.push(result.location);
      }
      if (id === '03-request-encoding') {
        const res = await request(new URL(created[0], base).pathname.replace(url.pathname, '') + new URL(created[0], base).search);
        assert.equal(res.status, 200); return { healthy: res.text.includes('한글 검증 0'), bug: !res.text.includes('한글 검증 0'), observed: { status: res.status, stored_title_matches: res.text.includes('한글 검증 0') } };
      }
      const first = await request('/board/list.do'), second = await request('/board/list.do?page=2');
      assert.equal(first.status, 200); assert.equal(second.status, 200);
      const next = /data-page="2"/.test(first.text);
      return { healthy: next, bug: !next, observed: { created: 10, total: 11, second_page_status: second.status, next_link: next } };
    } finally {
      for (const loc of created) await request('/board/delete.do', { id: new URL(loc, base).searchParams.get('id'), csrf: token });
    }
  }
  throw new Error('실행 가능한 학습 사례가 아닙니다');
}

export async function reproduceCase(id, { maven, javaHome, output, baseline = false, capture = false } = {}) {
  if (process.platform !== 'win32') throw new Error('자동 서버 실행은 Windows용입니다. 다른 OS는 README의 수동 Jetty 절차를 따르세요');
  if (!maven || !javaHome || !output) throw new Error('Maven/JAVA_HOME/새 출력 경로 필요');
  try { await fetch('http://127.0.0.1:8080', { signal: AbortSignal.timeout(1000) }); throw new Error('8080 포트 사용 중'); }
  catch (e) { if (e.message === '8080 포트 사용 중') throw e; }
  const prepared = await prepareCase(id);
  if (prepared.mode === 'log-only') throw new Error('Oracle 사례는 재현하지 않습니다');
  if (baseline) {
    const spec = await json(path.join(root, 'evals/debug/cases', id, 'case.json'));
    for (const file of Object.keys(spec.source_files)) await copyFile(path.join(root, 'examples', prepared.testbed, file), path.join(prepared.project, file));
  }
  const instrumentation = capture ? await installCapture(prepared.project) : [];
  let log = '', closed = false;
  const command = capture ? "& $env:SISTACK_MAVEN -q '-Dfile.encoding=UTF-8' '-Dorg.eclipse.jetty.util.log.class=org.eclipse.jetty.util.log.StdErrLog' jetty:run" : '& $env:SISTACK_MAVEN -q jetty:run';
  const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], {
    cwd: prepared.project, env: { ...process.env, JAVA_HOME: path.resolve(javaHome), SISTACK_MAVEN: path.resolve(maven) }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.on('close', () => { closed = true; });
  const outDecoder = new StringDecoder('utf8'), errDecoder = new StringDecoder('utf8');
  child.stdout.on('data', data => { log += outDecoder.write(data); });
  child.stderr.on('data', data => { log += errDecoder.write(data); });
  const base = `http://127.0.0.1:8080/${prepared.testbed}`;
  try {
    let ready = false;
    for (let n = 0; n < 120 && !closed; n++) {
      try { const res = await fetch(base + '/auth/login.do', { signal: AbortSignal.timeout(1000) }); await res.arrayBuffer(); if (res.status === 200) { ready = true; break; } } catch {}
      await pause(1000);
    }
    if (!ready) throw new Error('BLOCKED: Jetty 시작 실패/시간 초과. 마스킹한 서버 로그 확인');
    const result = await probeCase(id, base);
    const expected = baseline ? result.healthy : result.bug;
    await save(output, { case_id: id, mode: baseline ? 'baseline' : 'patched', status: expected ? 'PASS' : 'FAIL', observed: result.observed,
      reproduction_level: 5, java_home: javaHome, project: prepared.project, instrumentation, note: '증상 재현 확인이며 원인 위치 적중 평가가 아니다.' });
    if (!expected) throw new Error('예상한 정상/결함 동작과 다릅니다');
    return { case_id: id, mode: baseline ? 'baseline' : 'patched', status: 'PASS', observed: result.observed };
  } finally {
    if (!closed) spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    if (!closed) await Promise.race([new Promise(resolve => child.once('close', resolve)), pause(3000)]);
    log += outDecoder.end() + errDecoder.end();
    await save(output + '.server.txt', mask(log));
  }
}

if (isMain(import.meta.url)) await cli(async () => {
  const [id, maven, javaHome, output, mode] = process.argv.slice(2);
  if (mode && !['baseline', 'capture'].includes(mode)) throw new Error('마지막 옵션은 baseline 또는 capture만 허용합니다');
  console.log(JSON.stringify(await reproduceCase(id, { maven, javaHome, output, baseline: mode === 'baseline', capture: mode === 'capture' }), null, 2));
});
