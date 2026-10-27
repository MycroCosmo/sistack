import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { buildIndex } from '../lib/indexer/index.mjs';

const root = 'src/main/resources/', html = root + 'templates/editor.html';
const pom = '<project><dependencies><dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-thymeleaf</artifactId></dependency></dependencies></project>';
const xml = `<beans><bean id="tr" class="x.TemplateResolver"><property name="prefix" value="classpath:/templates/"/><property name="suffix" value=".html"/></bean>
<bean id="e" class="x.TemplateEngine"><property name="templateResolver" ref="tr"/></bean>
<bean class="x.ThymeleafViewResolver"><property name="templateEngine" ref="e"/><property name="order" value="1"/></bean></beans>`;
const java = `package demo;
@Controller
public class Editor {
 @GetMapping("/edit") public String edit() { return "editor"; }
 @PostMapping("/send") @ResponseBody public String send() { return "ok"; }
 @PostMapping("/other") @ResponseBody public String other() { return "ok"; }
}`;
async function fixture(files, check) {
  const dir = await mkdtemp(path.join(tmpdir(), 'sistack-th-v2-'));
  try {
    for (const [file, text] of Object.entries({ 'Editor.java': java, ...files })) {
      await mkdir(path.dirname(path.join(dir,file)), {recursive:true}); await writeFile(path.join(dir,file),text);
    }
    const index=await buildIndex(dir);
    assert.ok(!index.skipped.some(s=>s.pattern==='parse-failure'));
    const nodes=new Map(index.nodes.map(n=>[n.id,n]));
    await check(index.edges.map(e=>({...e,from:nodes.get(e.from).name,to:nodes.get(e.to).name})),index);
  } finally { await rm(dir,{recursive:true,force:true}); }
}
const form = (url='/send',method='POST',prevent='event.preventDefault();') => `<form id="sender" method="post" th:action="@{/send}"></form>
<script th:inline="javascript">
$('#sender').on('submit', function(event) {
 ${prevent}
 $.ajax({url: /*[[@{${url}}]]*/ '${url}', type:'${method}'});
});</script>`;

test('v2 submit: 같은 URL+method AJAX와 차단된 action은 한 requests, 양쪽 근거',async()=>{
  await fixture({'spring.xml':xml,[html]:form()},edges=>{
    const requests=edges.filter(e=>e.kind==='requests'&&e.to==='POST /send');
    assert.equal(requests.length,1);
    assert.ok(requests[0].from.endsWith('#handler:3'));
    assert.ok(requests[0].evidence.some(p=>p.file===html&&p.line===1));
    assert.ok(requests[0].evidence.some(p=>p.file===html&&p.line===5));
  });
});
test('v2 submit: 다른 URL이면 기본 action은 차단 이유의 LIKELY',async()=>{
  await fixture({'spring.xml':xml,[html]:form('/other')},edges=>{
    const action=edges.find(e=>e.from===html&&e.to==='POST /send'&&e.kind==='requests');
    assert.equal(action.status,'LIKELY'); assert.match(action.reason,/기본 submit 차단/);
    assert.ok(edges.some(e=>e.to==='POST /other'&&e.status==='CONFIRMED'));
  });
});
test('v2 submit: HTTP method가 다르면 병합하지 않고 차단 없는 폼도 보존',async()=>{
  await fixture({'spring.xml':xml,'Editor.java':java.replace(/}\s*$/, '@GetMapping("/send") @ResponseBody public String getSend() { return "ok"; }\n}'),[html]:form('/send','GET')},edges=>{
    assert.equal(edges.find(e=>e.from===html&&e.to==='POST /send').status,'LIKELY');
    assert.ok(edges.some(e=>e.to==='GET /send'&&e.status==='CONFIRMED'));
  });
  await fixture({'spring.xml':xml,[html]:form('/send','POST','')},edges=>assert.equal(edges.filter(e=>e.to==='POST /send'&&e.status==='CONFIRMED').length,2));
});
test('v2 fragment: html 루트·따옴표 템플릿·중첩 인자·공백·자기 참조',async()=>{
  await fixture({'spring.xml':xml,
    [html]: `<html th:replace="~{'shell' :: frame (~{::body},'a::b')}"><body><div th:insert="~{::local}"></div><p th:fragment="local(x)"></p></body></html>`,
    [root+'templates/shell.html']:'<html th:fragment="frame (content,label)"><main th:insert="${content}"></main></html>'},edges=>{
    assert.ok(edges.some(e=>e.from===html&&e.to===root+'templates/shell.html#frame'&&e.kind==='includes'&&e.status==='CONFIRMED'));
    assert.ok(edges.some(e=>e.from===html&&e.to===html+'#local'&&e.status==='CONFIRMED'));
  });
});
test('v2 fragment: 닫히지 않은 인자·동적 이름을 확정하지 않는다',async()=>{
  await fixture({'spring.xml':xml,[html]:'<div th:replace="~{shell :: frame (broken}"></div><div th:insert="~{${choice} :: frame}"></div>',
    [root+'templates/shell.html']:'<p th:fragment="frame(x)"></p>'},(edges,index)=>{
    assert.ok(!edges.some(e=>e.from===html&&e.to.endsWith('#frame')&&e.status==='CONFIRMED'));
    assert.ok(index.unresolved.length>=2);
  });
});
test('v2 Boot: Maven starter 기본 뷰·fragment, starter 없는 경우는 추정하지 않는다',async()=>{
  const files={'pom.xml':pom,[html]:'<html th:replace="~{shell :: frame (~{::body})}"></html>',[root+'templates/shell.html']:'<html th:fragment="frame(content)"></html>'};
  await fixture(files,edges=>{
    assert.ok(edges.some(e=>e.from==='demo.Editor#edit'&&e.to===html&&e.kind==='renders'&&e.status==='CONFIRMED'));
    assert.ok(edges.some(e=>e.from===html&&e.to.endsWith('shell.html#frame')&&e.status==='CONFIRMED'));
  });
  await fixture({...files,'pom.xml':'<project/>'},edges=>assert.ok(!edges.some(e=>e.kind==='renders')));
});
test('v2 Boot: Gradle·중첩 YAML prefix/suffix와 profile 별 상충',async()=>{
  await fixture({'build.gradle.kts':'dependencies { implementation("org.springframework.boot:spring-boot-starter-thymeleaf") }',
    [root+'application.yml']:'spring:\n  thymeleaf:\n    prefix: "classpath:/pages/"\n    suffix: .htm\n',
    [root+'pages/editor.htm']:'<h1>editor</h1>'},edges=>assert.ok(edges.some(e=>e.to===root+'pages/editor.htm'&&e.kind==='renders'&&e.status==='CONFIRMED')));
  await fixture({'pom.xml':pom,[html]:'default', [root+'alternate/editor.html']:'profile',
    [root+'application-local.properties']:'spring.thymeleaf.prefix=classpath:/alternate/'},edges=>{
    const views=edges.filter(e=>e.from==='demo.Editor#edit'&&e.kind==='renders');
    assert.ok(views.some(e=>e.to===html)); assert.ok(views.some(e=>e.to===root+'alternate/editor.html'));
    assert.ok(views.every(e=>e.status==='LIKELY'));
  });
});
test('v2 Boot: YAML 문서·flow mapping 미지원은 확정하지 않는다',async()=>{
  await fixture({'pom.xml':pom,[html]:'editor',[root+'application.yml']:'spring: {thymeleaf: {prefix: classpath:/elsewhere/}}'},edges=>{
    assert.ok(edges.some(e=>e.kind==='renders'&&e.status==='LIKELY'));
    assert.ok(!edges.some(e=>e.kind==='renders'&&e.status==='CONFIRMED'));
  });
});
test('v2 반환 뷰: 같은 클래스 상수·private 반환 깊이 2와 근거',async()=>{
  await fixture({'spring.xml':xml,[html]:'editor','Editor.java':`package demo;
@Controller
public class Editor {
 private static final String VIEW = "editor";
 @GetMapping("/edit") public String edit() { return one(); }
 private String one() { return this.two(); }
 private String two() { return VIEW; }
}`},edges=>{
    const view=edges.find(e=>e.from==='demo.Editor#edit'&&e.to===html&&e.kind==='renders');
    assert.equal(view?.status,'CONFIRMED');
    for(const line of [4,5,6,7]) assert.ok(view.evidence.some(p=>p.file==='Editor.java'&&p.line===line));
  });
});
test('v2 반환 뷰: 깊이 초과·순환·비private·동적 반환은 LIKELY',async()=>{
  await fixture({'spring.xml':xml,[html]:'editor','Editor.java':`package demo;
@Controller
public class Editor {
 @GetMapping("/edit") public String edit() { return one(); }
 private String one() { return two(); }
 private String two() { return three(); }
 private String three() { return "editor"; }
 @GetMapping("/loop") public String loop() { return cycle(); }
 private String cycle() { return cycle(); }
 @GetMapping("/external") public String external() { return exposed(); }
 public String exposed() { return "editor"; }
}`},edges=>{
    for(const method of ['edit','loop','external']) {
      const results=edges.filter(e=>e.from==='demo.Editor#'+method&&e.kind==='renders');
      assert.ok(results.length); assert.ok(results.every(e=>e.status==='LIKELY'&&e.reason));
    }
  });
});
