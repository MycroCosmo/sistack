import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { buildIndex } from '../lib/indexer/index.mjs';
import { queryIndex } from '../lib/indexer/query.mjs';
import { evalIndex } from '../lib/indexer/eval.mjs';

const web = 'src/main/webapp/', templates = web + 'WEB-INF/templates/';
const controller = `package p;
@Controller
public class C {
 @GetMapping("/list")
 public String list() { return "list"; }
 @PostMapping("/save")
 public String save() { return "redirect:/list"; }
 @GetMapping("/detail/{key}")
 public String detail() { return "detail"; }
 @GetMapping("/image/{key}")
 @ResponseBody
 public String image() { return "image-body"; }
 @GetMapping("/codes")
 @ResponseBody
 public String codes() { return "[]"; }
}`;
function config({ names = 'list,detail', check = false, order = 1, prefix = '/WEB-INF/templates/', layout = true } = {}) {
  return `<beans><bean id="tr" class="org.thymeleaf.spring5.templateresolver.SpringResourceTemplateResolver">
    <property name="prefix" value="${prefix}"/><property name="suffix" value=".html"/><property name="checkExistence" value="${check}"/>
  </bean><bean id="engine" class="org.thymeleaf.spring5.SpringTemplateEngine"><property name="templateResolver" ref="tr"/>
    ${layout ? '<property name="additionalDialects"><set><bean class="nz.net.ultraq.thymeleaf.layoutdialect.LayoutDialect"/></set></property>' : ''}
  </bean><bean class="org.thymeleaf.spring5.view.ThymeleafViewResolver"><property name="templateEngine" ref="engine"/>
    <property name="order" value="${order}"/>${names === null ? '' : '<property name="viewNames" value="' + names + '"/>'}
  </bean><bean class="org.springframework.web.servlet.view.InternalResourceViewResolver"><property name="order" value="2"/>
    <property name="prefix" value="/WEB-INF/views/"/><property name="suffix" value=".jsp"/>
  </bean></beans>`;
}
async function fixture(files, action, options) {
  const dir = await mkdtemp(path.join(tmpdir(), 'sistack-thymeleaf-'));
  try {
    for (const [name, content] of Object.entries({ 'C.java': controller, 'spring.xml': config(options), ...files })) {
      const dest = path.join(dir, name); await mkdir(path.dirname(dest), { recursive: true }); await writeFile(dest, content);
    }
    const index = await buildIndex(dir);
    assert.ok(!index.skipped.some(s => s.pattern === 'parse-failure'));
    return await action(index);
  } finally { await rm(dir, { recursive: true, force: true }); }
}
const edges = i => i.edges.map(e => ({ ...e, from: i.nodes.find(n => n.id === e.from).name, to: i.nodes.find(n => n.id === e.to).name }));
const has = (i, from, to, kind, status = 'CONFIRMED') => edges(i).some(e => e.from === from && e.to === to && e.kind === kind && e.status === status);

test('form 조건 분기·URL 경로 변수/쿼리와 img endpoint를 읽고 정적 리소스는 제외한다', async () => {
  await fixture({ [templates + 'list.html']: `<form method="post" th:action="\${ok} ? @{/save} : @{/save}"></form>
    <a th:href="@{/detail/{id}(id=\${row.id},q=\${#session.getAttribute('query')})}">상세</a>
    <img th:src="@{/image/{id}(id=\${id})}"><img th:src="@{/logo.png}"><a href="#local">local</a>` }, i => {
    for (const [target, kind] of [['POST /save', 'requests'], ['GET /detail/{key}', 'requests'], ['GET /image/{key}', 'requests']]) assert.ok(has(i, templates + 'list.html', target, kind));
    assert.ok(!i.unresolved.some(u => /logo|local/.test(u.pattern)));
    assert.ok(!edges(i).some(e => e.kind === 'renders' && e.to.includes('image-body')));
    assert.ok(!edges(i).some(e => e.kind === 'renders' && e.to.includes('redirect:')));
  });
});

for (const attr of ['th:replace', 'th:insert', 'th:include']) test(`${attr}의 매개변수 fragment와 내부 요청이 질의로 이어진다`, async () => {
  await fixture({ [templates + 'list.html']: `<section ${attr}="~{parts/menu :: menu(\${user})}"></section>`,
    [templates + 'parts/menu.html']: '<nav th:fragment="menu(user)"><a th:href="@{/list}">목록</a></nav>' }, i => {
    assert.ok(has(i, templates + 'list.html', templates + 'parts/menu.html#menu', 'includes'));
    assert.ok(has(i, templates + 'parts/menu.html#menu', 'GET /list', 'requests'));
    assert.ok(queryIndex(i, { from: templates + 'list.html' }).nodes.some(n => n.name === 'p.C#list'));
  });
});

test('레이아웃 등록·본문을 연결하고 동적/순환/누락 fragment를 확정하지 않는다', async () => {
  await fixture({ [templates + 'list.html']: '<html layout:decorate="~{base}"><section layout:fragment="content"></section></html>',
    [templates + 'base.html']: '<main><section layout:fragment="content"></section></main>' }, i => {
    assert.ok(has(i, templates + 'list.html', templates + 'base.html', 'decorates'));
    const binding = i.nodes.find(n => n.name === templates + 'list.html').details.layout_bindings[0];
    assert.equal(binding.from, templates + 'list.html#content'); assert.equal(binding.to, templates + 'base.html#content');
  });
  await fixture({ [templates + 'list.html']: '<div th:replace="~{\${choice} :: menu}"></div><div th:insert="~{absent :: menu}"></div>' }, i => {
    assert.ok(i.unresolved.some(u => u.pattern === 'dynamic-fragment')); assert.ok(i.unresolved.some(u => u.pattern === 'missing-fragment'));
  });
  await fixture({ [templates + 'list.html']: '<div th:insert="~{base}"></div>', [templates + 'base.html']: '<div th:replace="~{list}"></div>' }, i => assert.ok(edges(i).some(e => e.kind === 'includes' && e.status === 'LIKELY' && /순환/.test(e.reason))));
});

test('같은 파일의 fragment 참조는 자체 파일 순환과 구별한다', async () => {
  await fixture({ [templates + 'list.html']: '<div th:replace="~{:: menu}"></div><nav th:fragment="menu"><a th:href="@{/list}">목록</a></nav>' }, i => {
    assert.ok(has(i, templates + 'list.html', templates + 'list.html#menu', 'includes'));
    assert.ok(has(i, templates + 'list.html#menu', 'GET /list', 'requests'));
  });
});

test('viewNames 공존은 Controller 반환 뷰와 실제 템플릿/JSP를 선택한다', async () => {
  await fixture({ [templates + 'list.html']: '<h1>목록</h1>', [web + 'WEB-INF/views/detail.jsp']: '상세' }, i => {
    assert.ok(has(i, 'p.C#list', templates + 'list.html', 'renders'));
    assert.ok(has(i, 'p.C#detail', web + 'WEB-INF/views/detail.jsp', 'renders'));
  }, { names: 'list' });
});

test('checkExistence=true·viewNames 무제한: 파일 존재는 Thymeleaf, 부재는 다음 JSP', async () => {
  await fixture({ [templates + 'list.html']: '<h1>목록</h1>', [web + 'WEB-INF/views/list.jsp']: '다른 목록', [web + 'WEB-INF/views/detail.jsp']: '상세' }, i => {
    assert.ok(has(i, 'p.C#list', templates + 'list.html', 'renders'));
    assert.ok(!has(i, 'p.C#list', web + 'WEB-INF/views/list.jsp', 'renders'));
    assert.ok(has(i, 'p.C#detail', web + 'WEB-INF/views/detail.jsp', 'renders'));
  }, { names: null, check: true });
});

test('존재 검사 없음·리졸버 동순위·동적 prefix의 판정 불가는 LIKELY다', async () => {
  await fixture({ [web + 'WEB-INF/views/list.jsp']: '목록' }, i => {
    assert.ok(has(i, 'p.C#list', web + 'WEB-INF/views/list.jsp', 'renders', 'LIKELY'));
  }, { names: null, check: false });
  await fixture({ [templates + 'list.html']: '목록', [web + 'WEB-INF/views/list.jsp']: '목록' }, i => {
    assert.ok(has(i, 'p.C#list', templates + 'list.html', 'renders', 'LIKELY'));
    assert.ok(!edges(i).some(e => e.from === 'p.C#list' && e.kind === 'renders' && e.status === 'CONFIRMED'));
  }, { names: null, check: true, order: 2 });
  await fixture({ [web + 'WEB-INF/views/list.jsp']: '목록' }, i => assert.ok(has(i, 'p.C#list', web + 'WEB-INF/views/list.jsp', 'renders', 'LIKELY')), { names: null, check: true, prefix: '${root}/' });
});

test('3.0 유틸 객체를 실행하지 않고 정적 경로와 런타임 URL 베이스를 구분한다', async () => {
  await fixture({ [templates + 'list.html']: `<a th:href="@{/list(q=\${#session.getAttribute('q')})}"></a>
    <a th:href="@{\${#request.contextPath} + '/list'}"></a>
    <a th:href="@{\${#session.getAttribute('target')}}"></a>
    <p th:text="\${#request.remoteAddr}"></p>` }, i => {
    assert.ok(has(i, templates + 'list.html', 'GET /list', 'requests'));
    assert.ok(i.unresolved.some(u => u.pattern === 'thymeleaf-url'));
    assert.equal(edges(i).filter(e => e.from === templates + 'list.html' && e.kind === 'requests' && e.status === 'CONFIRMED').length, 1);
  });
});

test('inline javascript URL과 단일 URL 변수는 fallback을 중복 요청으로 세지 않는다', async () => {
  await fixture({ [templates + 'list.html']: `<script th:inline="javascript">
    var endpoint = /*[[@{/codes(page=1)}]]*/ '/WRONG_FALLBACK';
    $.ajax({url: endpoint, type:'GET'});
    $.ajax({url: /*[[@{\${dynamicBase}}]]*/ '/WRONG_DYNAMIC', type:'GET'});
    </script>` }, i => {
    assert.equal(edges(i).filter(e => e.to === 'GET /codes' && e.kind === 'requests').length, 1);
    assert.ok(!JSON.stringify(i).includes('WRONG_FALLBACK')); assert.ok(!JSON.stringify(i).includes('WRONG_DYNAMIC'));
    assert.ok(i.unresolved.some(u => u.pattern === 'string-url'));
  });
});

test('data URL은 포함된 외부 JS의 실제 요소·접근자·AJAX 메서드로 연결한다', async () => {
  await fixture({ [templates + 'list.html']: `<button id="a" th:data-url="@{/codes(page=1)}"></button>
    <button id="b" th:attr="data-label='분류',data-url=@{/codes(page=2)}"></button>
    <button id="unused" th:data-url="@{/save}"></button><script th:src="@{/resources/use.js}"></script>`,
    [web + 'resources/use.js']: `$('#a, #b').on('click',function(){var el=$(this); $.ajax({url:el.data('url'),type:'GET'});});` }, i => {
    for (const id of ['a', 'b']) assert.ok(has(i, templates + 'list.html#' + id, 'GET /codes', 'requests'));
    assert.ok(!edges(i).some(e => e.from.endsWith('#unused') && e.kind === 'requests'));
  });
});

test('data URL의 별칭 재할당·다른 요소·미포함 JS를 CONFIRMED로 오인하지 않는다', async () => {
  await fixture({ [templates + 'list.html']: `<button id="a" th:data-url="@{/codes}"></button><script th:src="@{/resources/use.js}"></script>`,
    [web + 'resources/use.js']: `$('#a').on('click',function(){var el=$(this); el.data('url',dynamic); $.ajax({url:el.data('url'),type:'GET'});});`,
    [web + 'resources/not-included.js']: `$('#a').on('click',function(){$.ajax({url:$(this).data('url'),type:'GET'});});` }, i => {
    assert.ok(!has(i, templates + 'list.html#a', 'GET /codes', 'requests'));
    assert.ok(i.unresolved.some(u => u.pattern === 'data-url-binding'));
  });
});

test('data URL 접근자 data/attr/dataset은 해당 요소별로 연결한다', async () => {
  await fixture({ [templates + 'list.html']: `<button id="a" th:data-url="@{/codes}"></button><button id="b" th:data-url="@{/codes}"></button>
    <button id="c" th:data-url="@{/codes}"></button><script th:src="@{/resources/use.js}"></script>`,
    [web + 'resources/use.js']: `$('#a').on('click',function(){$.ajax({url:$(this).data('url'),type:'GET'});});
      $('#b').on('click',function(){$.ajax({url:$(this).attr('data-url'),type:'GET'});});
      $('#c').on('click',function(){$.ajax({url:this.dataset.url,type:'GET'});});` }, i => {
    for (const id of ['a', 'b', 'c']) assert.ok(has(i, templates + 'list.html#' + id, 'GET /codes', 'requests'));
  });
});

test('classpath 템플릿을 해석하고 조건 미확정 resolver의 fallback을 확정하지 않는다', async () => {
  await fixture({ 'src/main/resources/templates/list.html': '<h1>목록</h1>' }, i => assert.ok(has(i, 'p.C#list', 'src/main/resources/templates/list.html', 'renders')), { prefix: 'classpath:/templates/' });
  const xml = config({ names: null, check: true }).replace('<bean id="tr"', '<beans profile="unknown"><bean id="tr"').replace('</bean><bean id="engine"', '</bean></beans><bean id="engine"');
  await fixture({ 'spring.xml': xml, [web + 'WEB-INF/views/list.jsp']: '목록' }, i => assert.ok(has(i, 'p.C#list', web + 'WEB-INF/views/list.jsp', 'renders', 'LIKELY')));
});

test('승인한 학습 3건은 실제 수집 결과에서 parity/screen을 따로 통과한다', async () => {
  const target = new URL('../examples/legacy-board-thymeleaf/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const index = await buildIndex(target);
  for (const suffix of ['search', 'create', 'coexist']) {
    const expected = JSON.parse(await readFile(new URL(`../evals/trace/legacy-board-thymeleaf-${suffix}/expected.json`, import.meta.url)));
    assert.equal(expected.review_status, 'approved');
    const result = evalIndex(index, expected);
    assert.equal(result.groups.parity.status, 'PASS', suffix + ' parity');
    assert.equal(result.groups.screen.status, 'PASS', suffix + ' screen');
    assert.ok(!('matched' in result));
  }
});
