import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { buildIndex } from '../lib/indexer/index.mjs';
import { mask } from '../lib/mask/index.mjs';
import { sanitize } from '../lib/indexer/graph.mjs';

async function fixture(t, files) {
  const root=await mkdtemp(path.join(tmpdir(),'si-m2-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  for(const [name,text]of Object.entries(files)){const p=path.join(root,name);await mkdir(path.dirname(p),{recursive:true});await writeFile(p,text);}
  const index=await buildIndex(root),nodes=new Map(index.nodes.map(n=>[n.id,n]));
  return index.edges.map(e=>({...e,fromNode:nodes.get(e.from),toNode:nodes.get(e.to)}));
}
const java=(name,body,pkg='app')=>`package ${pkg};\npublic class ${name} {\n${body}\n}`;

test('static: import·같은 패키지·중첩 반환 타입으로 로컬 static overload를 연결한다',async t=>{
  const edges=await fixture(t,{
    'Caller.java':'package app;\nimport util.Codec;\npublic class Caller {\npublic void run(Input value) { Codec.encode(value.getText(), Helpers.trim(value.getText())); Helpers.check(); }\n}',
    'Codec.java':java('Codec','public static String encode(String a, String b) { return a; }\npublic static String encode(String a, byte[] b) { return a; }','util'),
    'Helpers.java':java('Helpers','public static String trim(Object x) { return "text"; }\npublic static void check() {}'),
    'Input.java':java('Input','public String getText() { return "text"; }')
  });
  const calls=edges.filter(e=>e.fromNode.name==='app.Caller#run'&&e.kind==='calls');
  assert.ok(calls.some(e=>e.toNode.name==='app.Helpers#check'&&e.status==='CONFIRMED'));
  assert.ok(calls.some(e=>e.toNode.name==='app.Helpers#trim'&&e.status==='CONFIRMED'));
  const encode=calls.filter(e=>e.toNode.name==='util.Codec#encode');
  assert.equal(encode.length,1); assert.equal(encode[0].status,'CONFIRMED'); assert.equal(encode[0].toNode.line,3);
});

test('static: 외부 import 호출은 내부를 만들지 않고 external로 기록한다',async t=>{
  const edges=await fixture(t,{'Caller.java':'package app;\nimport vendor.Client;\npublic class Caller {\npublic void run() { Client.send(); }\n}'});
  const call=edges.find(e=>e.fromNode.name==='app.Caller#run'&&e.kind==='calls');
  assert.ok(call);assert.equal(call.status,'UNRESOLVED');assert.equal(call.toNode.details.pattern,'external-static');assert.match(call.reason,/vendor.Client/);
});

test('JSP: 다른 함수 action을 가져오지 않고 submit 수신 폼의 기본 action을 쓴다',async t=>{
  const edges=await fixture(t,{
    'C.java':'@Controller\nclass C {\n@PostMapping("/save.do")\npublic void save() {}\n@PostMapping("/list.do")\npublic void list() {}\n}',
    'page.jsp':'<form id="main" method="POST" action="/save.do" onSubmit="return save(this)"></form>\n<script>\nfunction list(){ document.forms[0].action="/list.do"; document.forms[0].submit(); }\nfunction save(form){ form.submit(); }\n</script>'
  });
  const requests=edges.filter(e=>e.kind==='requests');
  assert.ok(requests.some(e=>e.fromNode.name==='page.jsp#list'&&e.toNode.name==='POST /list.do'));
  const save=requests.filter(e=>e.fromNode.name==='page.jsp#save');
  assert.equal(save.length,1);assert.equal(save[0].toNode.name,'POST /save.do');assert.equal(save[0].status,'CONFIRMED');
});

const profiles={
 'C.java':'@Controller\nclass C {\n@GetMapping("/run.do")\npublic void run() {}\n}',
 'Guard.java':java('Guard','public boolean preHandle() { return true; }'),
 'Caller.java':'package app;\nclass Caller {\n@Resource(name="svc")\nprivate S service;\npublic void call() { service.go(); }\n}',
 'S.java':'package app;\ninterface S {\nvoid go();\n}',
 'Prod.java':'package app;\nclass Prod implements S {\npublic void go() {}\n}',
 'Dev.java':'package app;\nclass Dev implements S {\npublic void go() {}\n}',
 'spring.xml':'<beans xmlns:mvc="mvc" xmlns:context="ctx"><context:property-placeholder location="classpath:app.properties"/><beans profile="prod"><bean id="svc" class="app.Prod"/><mvc:interceptor><mvc:mapping path="/**"/><bean class="app.Guard"/></mvc:interceptor></beans><beans profile="dev"><bean id="svc" class="app.Dev"/></beans></beans>'
};
test('profile: 활성 프로필 미확정이면 빈·인터셉터를 조건이 적힌 LIKELY로 둔다',async t=>{
 const edges=await fixture(t,{...profiles,'src/main/resources/app.properties':'feature=true'});
 const guard=edges.find(e=>e.kind==='intercepted_by');assert.ok(guard);assert.equal(guard.status,'LIKELY');assert.match(guard.reason,/prod/);
 const calls=edges.filter(e=>e.fromNode.name==='app.Caller#call'&&e.kind==='calls');assert.equal(calls.length,2);assert.ok(calls.every(e=>e.status==='LIKELY'&&/profile/.test(e.reason)));
});
test('profile: 등록된 설정의 활성 프로필로 비활성 빈·인터셉터를 제외한다',async t=>{
 const edges=await fixture(t,{...profiles,'src/main/resources/app.properties':'spring.profiles.active=dev'});
 assert.ok(!edges.some(e=>e.kind==='intercepted_by'));
 const calls=edges.filter(e=>e.fromNode.name==='app.Caller#call'&&e.kind==='calls');assert.equal(calls.length,1);assert.equal(calls[0].toNode.name,'app.Dev#go');assert.equal(calls[0].status,'CONFIRMED');
});
test('profile: 바깥 인터셉터가 조건부 ref 빈을 쓰는 경우도 LIKELY다',async t=>{
 const edges=await fixture(t,{
  'C.java':profiles['C.java'],'Guard.java':profiles['Guard.java'],
  'spring.xml':'<beans xmlns:mvc="mvc"><mvc:interceptor><mvc:mapping path="/**"/><ref bean="guard"/></mvc:interceptor><beans profile="prod"><bean id="guard" class="app.Guard"/></beans></beans>'
 });
 const edge=edges.find(e=>e.kind==='intercepted_by');assert.equal(edge.status,'LIKELY');assert.match(edge.reason,/prod/);
});

test('fragment: href=#와 javascript:void(0)는 요청이 아니며 실제 링크는 유지한다',async t=>{
 const edges=await fixture(t,{'C.java':'@Controller\nclass C {\n@GetMapping("/real.do")\npublic void real() {}\n}','page.jsp':'<a href="#">modal</a><a href="javascript:void(0)">modal</a><a href="/real.do">real</a>'});
 const requests=edges.filter(e=>e.kind==='requests');assert.equal(requests.length,1);assert.equal(requests[0].toNode.name,'GET /real.do');
});

test('mask: 32/40/64자 16진수·UUID를 보존하면서 실제 개인정보는 마스킹한다',()=>{
 for(const value of ['abcdef12345678901234567890abcdef12','1234567890123456789012345678901234567890','f5ba71140b5275fb235f7686563039ec03b6cfe453bae4327f936487ff1256c1','12345678-1234-1234-1234-123456789012']){
  assert.equal(mask(value),value);assert.equal(mask(`hash=${value} phone=010-0000-0000`),`hash=${value} phone=[REDACTED]`);
 }
 assert.equal(mask('123456789012'),'[REDACTED]');assert.equal(mask('password=abcdef12345678901234567890abcdef12'),'password=[REDACTED]');
 assert.equal(mask('계좌번호: 12345678901234567890123456789012'),'계좌번호: [REDACTED]');
});
test('eval 해시 필드는 일반 마스킹과 분리해 유효한 식별자를 보존한다',()=>{
 const hash='f5ba71140b5275fb235f7686563039ec03b6cfe453bae4327f936487ff1256c1';
 assert.deepEqual(sanitize({expected_sha256:hash,report_sha256:hash,tool_fingerprint:hash,run_id:'12345678-1234-1234-1234-123456789012',password:'phone=010-0000-0000'}),{expected_sha256:hash,report_sha256:hash,tool_fingerprint:hash,run_id:'12345678-1234-1234-1234-123456789012',password:'phone=[REDACTED]'});
});
