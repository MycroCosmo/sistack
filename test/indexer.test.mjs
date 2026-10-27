import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildIndex } from '../lib/indexer/index.mjs';
import { queryIndex } from '../lib/indexer/query.mjs';
import { validateIndex, Graph, sanitize } from '../lib/indexer/graph.mjs';
import { collectJava } from '../lib/indexer/java.mjs';
import { collectJs } from '../lib/indexer/js.mjs';
import { collectJsp } from '../lib/indexer/jsp.mjs';
import { collectMybatis } from '../lib/indexer/mybatis.mjs';
import { collectIbatis } from '../lib/indexer/ibatis.mjs';
import { collectSql } from '../lib/indexer/sql.mjs';
import { stripComments } from '../lib/indexer/source.mjs';

async function fixture(files, action) {
  const root = await mkdtemp(path.join(tmpdir(), 'sistack-index-'));
  try {
    for (const [file, content] of Object.entries(files)) { const dest = path.join(root, file); await mkdir(path.dirname(dest), { recursive: true }); await writeFile(dest, content); }
    return await action(await buildIndex(root), root);
  } finally { await rm(root, { recursive: true, force: true }); }
}
const namedEdges = index => index.edges.map(e => ({ ...e, fromName: index.nodes.find(n => n.id === e.from).name, toName: index.nodes.find(n => n.id === e.to).name }));
const has = (index, from, to, kind, status = 'CONFIRMED') => namedEdges(index).some(e => e.fromName === from && e.toName === to && e.kind === kind && e.status === status);
const board = await buildIndex(new URL('../examples/legacy-board/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const controller = 'kr.sistack.board.web.BoardController';
const impl = 'kr.sistack.board.service.impl.BoardServiceImpl';
const mapper = 'kr.sistack.board.mapper.BoardMapper';

test('정적 인터셉터 매핑은 요청 URL에서 메뉴 조회 SQL까지 이어진다', () => {
  const interceptor = 'kr.sistack.board.web.LoginInterceptor#preHandle';
  for (const url of ['GET /board/list.do', 'POST /board/create.do', 'POST /board/update.do']) assert.ok(has(board, url, interceptor, 'intercepted_by'));
  assert.ok(has(board, interceptor, 'kr.sistack.board.mapper.MenuMapper#selectList', 'calls'));
  const result = queryIndex(board, { from: '/board/create.do', depth: 5 });
  assert.ok(result.nodes.some(n => n.name === 'APP_MENU'));
});

test('인터셉터 exclude-mapping은 해당 endpoint 연결을 제외한다', async () => {
  await fixture({
    'C.java': 'package p;\n@Controller\npublic class C {\n@GetMapping({"/board/a", "/board/public/a"})\npublic void run() {}\n}',
    'I.java': 'package p;\npublic class I {\npublic boolean preHandle() { return true; }\n}',
    'spring.xml': '<beans><mvc:interceptors><mvc:interceptor><mvc:mapping path="/board/**"/><mvc:exclude-mapping path="/board/public/**"/><bean class="p.I"/></mvc:interceptor></mvc:interceptors></beans>'
  }, index => {
    assert.ok(has(index, 'GET /board/a', 'p.I#preHandle', 'intercepted_by'));
    assert.ok(!namedEdges(index).some(e => e.fromName === 'GET /board/public/a' && e.kind === 'intercepted_by'));
  });
});

test('JSP c:url 리터럴 삼항식은 두 도달 가능 요청과 선언 근거를 남긴다', () => {
  const form = 'src/main/webapp/WEB-INF/views/board/form.jsp';
  for (const url of ['POST /board/create.do', 'POST /board/update.do']) {
    assert.ok(has(board, form, url, 'requests'));
    assert.ok(namedEdges(board).find(e => e.fromName === form && e.toName === url).evidence.some(p => p.file === form && p.line === 12));
  }
});

test('JSP 삼항식의 동적 분기는 임의로 확정하지 않는다', async () => {
  await fixture({ 'a.jsp': '<c:url var="u" value="${ok ? target : \'/save\'}"/><form action="${fn:escapeXml(u)}" method="post"></form>' }, index => {
    assert.ok(index.unresolved.some(u => u.pattern === 'dynamic-url'));
    assert.ok(!index.edges.some(e => e.kind === 'requests' && e.status === 'CONFIRMED'));
  });
});

for (const db of ['mysql', 'oracle', 'missing']) test(`mapperLocations 프로퍼티 선택: ${db}`, async () => {
  const files = {
    'D.java': 'package p;\npublic class D {\nprivate SqlSessionTemplate sql;\npublic void run() { sql.selectList("p.M.list"); }\n}',
    'M.java': 'package p;\npublic interface M {\nvoid list();\n}',
    'spring.xml': '<beans><bean class="org.mybatis.spring.SqlSessionFactoryBean"><property name="mapperLocations"><list><value>classpath:/maps/**/*_${Globals.DbType}.xml</value></list></property></bean><bean class="org.springframework.beans.factory.config.PropertyPlaceholderConfigurer"><property name="locations"><list><value>classpath:/globals.properties</value><!-- <value>file:/external.properties</value> --></list></property></bean></beans>',
    'src/main/resources/globals.properties': db === 'missing' ? '# no DB choice' : `Globals.DbType = ${db}`,
    'src/main/resources/maps/M_mysql.xml': '<mapper namespace="p.M"><select id="list">SELECT * FROM MYSQL_TABLE</select></mapper>',
    'src/main/resources/maps/M_oracle.xml': '<mapper namespace="p.M"><select id="list">SELECT * FROM ORACLE_TABLE</select></mapper>'
  };
  await fixture(files, index => {
    for (const from of ['p.D#run', 'p.M#list']) {
      const edges = namedEdges(index).filter(e => e.fromName === from && e.kind === 'executes');
      assert.equal(edges.length, db === 'missing' ? 2 : 1);
      if (db === 'missing') assert.ok(edges.every(e => e.status === 'LIKELY'));
      else {
        assert.equal(edges[0].status, 'CONFIRMED');
        assert.ok(index.nodes.find(n => n.id === edges[0].to).file.endsWith(`_${db}.xml`));
        assert.equal(edges[0].candidates.length, 1);
        assert.ok(edges[0].evidence.some(e => e.file.endsWith('globals.properties') && e.line === 1));
      }
    }
  });
});

test('extends와 implements를 함께 선언한 구현체로 주입 호출을 연결한다', async () => {
  const cls = collectJava('Generic.java', 'package p; public class Generic extends Base<Map<String, List<Integer>>> implements S, Other {}', new Graph());
  assert.deepEqual(cls.parents, ['p.Base', 'p.S', 'p.Other']);
  await fixture({
    'C.java': 'package p;\npublic class C {\n@Autowired\nprivate S svc;\npublic void run() { svc.go(); }\n}',
    'S.java': 'package p;\npublic interface S {\nvoid go();\n}',
    'Impl.java': 'package p;\n@Service\npublic class Impl extends Base implements S, Other {\npublic void go() {}\n}'
  }, index => {
    assert.ok(has(index, 'p.C#run', 'p.Impl#go', 'calls'));
    assert.ok(!has(index, 'p.C#run', 'p.S#go', 'calls'));
  });
});

for (const ambiguity of ['missing-property', 'multiple-factories', 'conflicting-property']) test(`설정 미확정이면 단일 SQL 선언도 LIKELY: ${ambiguity}`, async () => {
  const factory = '<bean class="org.mybatis.spring.SqlSessionFactoryBean"><property name="mapperLocations" value="classpath:/maps/*_${db}.xml"/></bean>';
  await fixture({
    'D.java': 'class D {\nprivate SqlSessionTemplate sql;\npublic void run() { sql.selectList("M.list"); }\n}',
    'spring.xml': `<beans>${factory}${ambiguity === 'multiple-factories' ? factory : ''}<context:property-placeholder location="classpath:/db.properties"/></beans>`,
    'src/main/resources/db.properties': ambiguity === 'missing-property' ? '# missing' : ambiguity === 'conflicting-property' ? 'db=mysql\ndb=oracle' : 'db=mysql',
    'src/main/resources/maps/M_mysql.xml': '<mapper namespace="M"><select id="list">SELECT * FROM T</select></mapper>'
  }, index => {
    assert.ok(has(index, 'D#run', 'M.list', 'executes', 'LIKELY'));
    assert.ok(index.skipped.some(s => s.pattern === 'mapper-selection'));
  });
});

test('주석 제거는 문자열의 //와 라인 번호를 보존한다', () => {
  const text = '"http://local"; // old\n/* obsolete */ call();';
  const clean = stripComments(text);
  assert.ok(clean.includes('"http://local"')); assert.ok(!clean.includes('obsolete')); assert.equal(clean.split('\n').length, 2);
});
test('jsp 수집: c:url form, include, 인라인 요청을 분리한다', () => {
  const g = new Graph(), p = collectJsp('src/main/webapp/a.jsp', `<%@ include file="head.jspf" %><form action="<c:url value='/save'/>" method="post"></form><script>$.get('/read');</script><%-- <a href="/old"> --%>`, g);
  assert.ok(p.requests.some(r => r.route === '/save' && r.verb === 'POST')); assert.equal(p.includes[0].ref, 'head.jspf'); assert.equal(p.inline[0].requests[0].raw, "'/read'"); assert.ok(!p.requests.some(r => r.route === '/old'));
});
test('js 수집: ajax/post/get/fetch/location/submit과 주석을 구분한다', () => {
  const g = new Graph(), s = collectJs('a.js', `$.ajax({url:'/a',type:'POST'}); $.get('/b'); $.post('/c'); fetch('/d'); location.href='/e'; form.submit(); // $.get('/old')`, g);
  assert.equal(s.requests.length, 6); assert.equal(s.requests[0].verb, 'POST'); assert.ok(!s.requests.some(r => r.raw.includes('old')));
});
test('java 수집: 클래스/메서드/주입 선언을 실제 구문으로 식별한다', () => {
  const g = new Graph(), cls = collectJava('C.java', 'package p;\n@Controller\npublic class C {\n@Resource(name="svc")\nprivate S service;\n@GetMapping("/x")\npublic void run() { service.list(); }\n}', g);
  assert.equal(cls.methods[0].name, 'run'); assert.equal(cls.fields[0].type, 'p.S'); assert.equal(cls.fields[0].bean, 'svc'); assert.ok(cls.methods[0].annotations.some(a => a.name === 'GetMapping'));
});
test('mybatis 수집: namespace, 조각, resultMap, 치환 위치', () => {
  const g = new Graph(), records = collectMybatis('m.xml', '<mapper namespace="p.M"><resultMap id="r" type="A"/><sql id="f">FROM T</sql><select id="list" resultMap="r">SELECT * <include refid="f"/> ORDER BY ${sort}</select></mapper>', g);
  assert.equal(records.length, 3); assert.equal(records[2].refs[0].name, 'p.M.f'); assert.ok(g.unresolved.some(u => u.pattern === 'sql-substitution')); assert.ok(g.nodes.some(n => n.name === 'T'));
});
test('ibatis2 수집: sqlMap namespace/id와 include를 연결할 자료 수집', () => {
  const g = new Graph(), records = collectIbatis('i.xml', '<sqlMap namespace="old"><sql id="where">WHERE ID=#id#</sql><select id="find">SELECT * FROM LEGACY <include refid="where"/></select><!--<select id="dead"/>--></sqlMap>', g);
  assert.equal(records.length, 2); assert.equal(records[1].refs[0].name, 'old.where'); assert.equal(records[1].node.details.dialect, 'ibatis2');
});
test('SQL 수집: 읽기/쓰기/procedure와 문자열·주석을 구분한다', () => {
  const g = new Graph(); collectSql('q.sql', "SELECT 'FROM FAKE' FROM A JOIN B ON A.ID=B.ID; INSERT INTO C VALUES(1); UPDATE D SET X=1; DELETE FROM E; MERGE INTO F USING A ON (1=1); CALL PROC(); -- FROM OLD", g);
  const refs = g.edges.map(e => [g.byId.get(e.to).name, e.kind]);
  for (const pair of [['A','reads'],['B','reads'],['C','writes'],['D','writes'],['E','writes'],['F','writes'],['PROC','executes']]) assert.ok(refs.some(r => r[0] === pair[0] && r[1] === pair[1]));
  assert.ok(!g.nodes.some(n => ['FAKE','OLD'].includes(n.name)));
});
test('spring 수집: 클래스 경로, 배열, method 속성과 XML handler mapping', async () => {
  await fixture({
    'C.java': 'package p;\n@Controller\n@RequestMapping({"/a","/b"})\npublic class C {\n@RequestMapping(value={"/x","/y"},method={RequestMethod.GET,RequestMethod.POST})\npublic void run() {}\n}',
    'H.java': 'package p;\npublic class H {\npublic void handleRequest() {}\n}',
    'c.xml': '<beans><bean id="handler" class="p.H"/><bean class="org.springframework.web.servlet.handler.SimpleUrlHandlerMapping"><property name="mappings"><props><prop key="/old">handler</prop></props></property></bean></beans>'
  }, index => { assert.equal(index.nodes.filter(n => n.kind === 'endpoint').length, 9); assert.ok(has(index, 'POST /b/y', 'p.C#run', 'maps_to')); assert.ok(has(index, 'ANY /old', 'p.H#handleRequest', 'maps_to')); });
});

test('함정 01: 목록 form.submit의 함수 반환 action은 UNRESOLVED', () => assert.ok(board.unresolved.some(u => u.pattern === 'string-url' && u.file === 'src/main/webapp/resources/board.js' && u.line === 15)));
test('함정 02: JSP contextPath 선언 + 단일 리터럴 삭제 경로는 CONFIRMED', () => assert.ok(namedEdges(board).some(e => e.toName === 'POST /board/delete.do' && e.fromName.includes('#handler:44') && e.status === 'CONFIRMED' && e.evidence.some(p => p.file.endsWith('detail.jsp') && p.line === 7))));
test('함정 03: 동명 list는 주입 타입으로 구분', () => { assert.ok(has(board, `${controller}#list`, `${impl}#list`, 'calls')); assert.ok(!has(board, `${controller}#list`, 'kr.sistack.board.service.impl.CommonCodeServiceImpl#list', 'calls')); });
test('함정 04: 공통 paging.jspf는 두 목록에서 공유', () => { const links = namedEdges(board).filter(e => e.kind === 'includes' && e.toName.endsWith('/common/paging.jspf')); assert.ok(links.some(e => e.fromName.endsWith('/board/list.jsp'))); assert.ok(links.some(e => e.fromName.endsWith('/code/list.jsp'))); });
test('함정 05: namespace 내부·외부 SQL include', () => { assert.ok(has(board, `${mapper}.selectList`, 'commonSql.pageStart', 'includes')); assert.ok(has(board, `${mapper}.selectList`, `${mapper}.filters`, 'includes')); });
test('함정 06: ${sortColumn}는 치환 위험 위치로 남김', () => assert.ok(board.unresolved.some(u => u.pattern === 'sql-substitution' && u.file.endsWith('BoardMapper.xml') && u.line === 34)));
test('함정 07: 주석 속 oldList 요청은 미수집', () => assert.ok(!JSON.stringify(board).includes('oldList')));
test('함정 08: 인터셉터 request 속성과 Controller 소비를 기록하되 값 전파는 미확정', () => { assert.ok(board.nodes.some(n => n.name.endsWith('LoginInterceptor#preHandle') && n.details.request_writes.includes('currentUser'))); assert.ok(board.nodes.some(n => n.name === `${controller}#list` && n.details.request_attributes.includes('currentUser'))); assert.ok(board.skipped.some(s => s.pattern === 'interceptor-runtime-order')); });
test('함정 09: SqlSessionTemplate 문자열 sqlId', () => assert.ok(has(board, 'kr.sistack.board.dao.CommonCodeDao#selectList', 'commonCode.selectList', 'executes')));
test('함정 10: XML·어노테이션 Mapper 둘 다 SQL로 연결', () => { assert.ok(has(board, `${mapper}#selectList`, `${mapper}.selectList`, 'executes')); assert.ok(namedEdges(board).some(e => e.fromName.includes('MenuMapper#') && e.kind === 'executes')); });
test('함정 11: 이름 주입→서비스 Impl 및 타입 주입→Mapper', () => { assert.ok(has(board, `${controller}#create`, `${impl}#create`, 'calls')); assert.ok(has(board, `${impl}#create`, `${mapper}#insert`, 'calls')); });
test('함정 12: HashMap offset/endRow와 parameterType map 기록', () => { const n = board.nodes.find(n => n.name === 'kr.sistack.board.service.impl.CommonCodeServiceImpl#list'); assert.deepEqual(n.details.map_keys, ['offset', 'endRow']); assert.equal(board.nodes.find(n => n.name === 'commonCode.selectList').details.parameter_type, 'map'); });
test('함정 13: 공통코드 AJAX 문자열 조합은 endpoint 선언과 별개로 UNRESOLVED', () => { assert.ok(board.unresolved.some(u => u.pattern === 'string-url' && u.line === 21 && u.constants.includes('Json.do'))); assert.ok(board.nodes.some(n => n.name === 'GET /code/listJson.do')); });
test('함정 14: 삭제 endpoint→controller→서비스→SQL', () => { const result = queryIndex(board, { from: '/board/delete.do', depth: 8 }); assert.ok(result.nodes.some(n => n.name === `${mapper}.delete`)); assert.ok(result.edges.some(e => e.kind === 'writes')); });
test('정상 흐름: 게시판 목록 화면에서 BOARD까지 확정 연결과 역방향 질의', () => { const result = queryIndex(board, { from: 'src/main/webapp/WEB-INF/views/board/list.jsp', depth: 8 }); assert.ok(result.nodes.some(n => n.name === 'BOARD')); assert.ok(queryIndex(board, { to: 'BOARD', depth: 8 }).nodes.some(n => n.name === `${controller}#list`)); });
test('구현 다중 후보는 LIKELY이고 후보 id를 제공', async () => {
  await fixture({ 'C.java': 'package p;\npublic class C {\n@Autowired\nprivate S svc;\npublic void run() { svc.go(); }\n}', 'S.java': 'package p;\npublic interface S {\nvoid go();\n}', 'A.java': 'package p;\n@Service\npublic class A implements S {\npublic void go() {}\n}', 'B.java': 'package p;\n@Service\npublic class B implements S {\npublic void go() {}\n}' }, index => { const edges = namedEdges(index).filter(e => e.fromName === 'p.C#run'); assert.equal(edges.length, 2); assert.ok(edges.every(e => e.status === 'LIKELY' && e.candidates.length === 2)); });
});
test('파싱 실패·비공개·테스트 제외·마스킹·Git 없는 대상', async () => {
  await fixture({ 'broken.xml': '<mapper><select></mapper>', 'good.sql': 'SELECT * FROM SAFE_TABLE', 'evals/private/secret.sql': 'SELECT * FROM PRIVATE_TABLE', 'src/test/Test.java': 'class Test {}' }, index => { assert.equal(index.meta.source_revision, null); assert.ok(index.skipped.some(s => s.pattern === 'parse-failure')); assert.ok(index.nodes.some(n => n.name === 'SAFE_TABLE')); assert.ok(!JSON.stringify(index).includes('PRIVATE_TABLE')); validateIndex(index); });
});
test('contextPath가 선언되지 않은 ctx 조합을 확정하지 않는다', async () => {
  await fixture({ 'a.js': "$.post(ctx + '/delete');", 'C.java': 'package p;\n@Controller\npublic class C {\n@PostMapping("/delete")\npublic void run() {}\n}' }, index => assert.ok(index.unresolved.some(u => u.pattern === 'string-url')));
});
test('호출처럼 보이는 Java/JS 문자열을 실행 연결로 오인하지 않는다', async () => {
  await fixture({ 'C.java': 'package p;\npublic class C {\n@Autowired\nprivate S svc;\npublic void run() { String example = "svc.go()"; }\n}', 'S.java': 'package p;\n@Service\npublic class S {\npublic void go() {}\n}', 'a.js': `const example = "$.post('/fake')"; $.get('/real');` }, index => { assert.ok(!has(index,'p.C#run','p.S#go','calls')); assert.ok(!JSON.stringify(index).includes('/fake')); });
});
test('콤마 JOIN 및 MERGE USING 읽기 대상을 구분한다', () => {
  const g = new Graph(); collectSql('x.sql', 'SELECT * FROM A x, B y, C z WHERE x.ID=y.ID; MERGE INTO D USING E ON (D.ID=E.ID);', g);
  for (const name of ['A','B','C','E']) assert.ok(g.edges.some(e => e.kind === 'reads' && g.byId.get(e.to).name === name));
  assert.ok(g.edges.some(e => e.kind === 'writes' && g.byId.get(e.to).name === 'D'));
});
test('개인정보는 마스킹하되 불투명 해시는 식별자로 보존한다', () => {
  const hash = '1234567890123456789012345678901234567890123456789012345678901234';
  const result = sanitize({ id: hash, name: 'synthetic@example.invalid', reason: 'password=synthetic' });
  assert.equal(result.id, hash); assert.equal(result.name, '[REDACTED]'); assert.ok(!result.reason.includes('synthetic'));
  assert.equal(sanitize({ name: 'token=' + hash }).name, 'token=[REDACTED]');
});
test('반복 SQL은 연결 하나로 묶고 근거 위치 제한을 표시한다', () => {
  const g = new Graph(); collectSql('seed.sql', Array.from({length:20}, (_, i) => `INSERT INTO A VALUES (${i});`).join('\n'), g);
  assert.equal(g.edges.length, 1); assert.equal(g.edges[0].evidence.length, 8); assert.equal(g.edges[0].evidence_truncated, true);
});
