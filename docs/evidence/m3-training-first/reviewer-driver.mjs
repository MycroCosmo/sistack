import path from 'node:path';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { finishDebug, debugFingerprint } from '../lib/debug/index.mjs';
import { scoreDebug } from '../scripts/eval-debug.mjs';
import { json, save, digest, checkSources } from '../lib/trace/io.mjs';
import { mask } from '../lib/mask/index.mjs';

// 동결 후 에이전트가 로그·인덱스·실제 소스를 읽고 작성한 진단이다. 정답을 진단으로 복사하지 않는다.
const repository = fileURLToPath(new URL('../', import.meta.url));
const j = 'src/main/java/kr/sistack/board/', w = 'src/main/webapp/', r = 'src/main/resources/';
const location = (file, ...lines) => lines.map(line => ({ file, line }));
const reviews = {
  '01-binding': {
    cause: 'MenuMapper의 @Param 이름 roleKey가 SQL의 role 키와 달라 메뉴 조회 바인딩이 실패한다.',
    locations: location(j + 'mapper/MenuMapper.java', 10),
    reason: '로그의 Available parameters=[roleKey,param1]와 @Select의 #{role}, 메서드의 @Param("roleKey")를 대조했다. LoginInterceptor:38은 실패가 전파된 호출부다.',
    eliminated: ['LoginInterceptor:19~24의 로그인 검사는 통과해야 메뉴 조회에 도달한다.', 'DB 문법 오류가 아니라 파라미터 맵에서 role을 찾지 못하는 BindingException이 가장 깊은 예외다.'],
    same_pattern: ['동일 MenuMapper는 인증된 게시판/공통코드 요청의 LoginInterceptor에서 공유된다.'],
    edits: [[j + 'mapper/MenuMapper.java', '    List<Menu> selectList(@Param("roleKey") String role);', '    List<Menu> selectList(@Param("role") String role);']],
    verification: ['ADMIN 로그인 후 목록 200, 익명은 로그인으로 이동, USER/ADMIN 메뉴 역할별 결과 확인']
  },
  '02-js-url': {
    cause: '검색 submit 핸들러가 정상 폼 action을 /board/lists.do로 바꿔 Controller /board/list.do 매핑과 어긋난다.',
    locations: location(w + 'resources/board.js', 4),
    reason: 'list.jsp:14의 기본 action은 list.do다. 같은 폼의 submit에서 listUrl()이 lists.do를 생성하고 action을 덮어쓴다. 실제 JS 실행으로 만든 URL도 lists.do/404다.',
    eliminated: ['초기 JSP form action과 Controller GetMapping은 list.do로 일치한다.', '정적 board.js 요청은 200이므로 JS 다운로드 실패에 의한 증상은 아니다.'],
    same_pattern: ['페이지 버튼도 board.js:12~15에서 같은 listUrl()을 호출하므로 검색과 함께 확인해야 한다.'],
    edits: [[w + 'resources/board.js', "    return form.attr('data-base') + '/' + 'lists' + '.do';", "    return form.attr('data-base') + '/' + 'list' + '.do';"]],
    verification: ['검색 버튼과 페이지 버튼에서 /board/list.do 요청 및 200 응답, 검색어/페이지 값 유지 확인']
  },
  '03-request-encoding': {
    cause: 'CharacterEncodingFilter가 UTF-8 폼 요청을 ISO-8859-1로 강제 해석한다.',
    locations: location(w + 'WEB-INF/web.xml', 15),
    reason: '필터 매핑 /*와 forceEncoding=true는 살아 있으나 encoding 값이 ISO-8859-1이다. 폼 JSP는 UTF-8이고 저장 후 제목이 달라졌으며 요청 자체는 성공했다.',
    eliminated: ['필터 매핑 자체 누락은 아니다. web.xml:22~25에서 모든 경로에 적용된다.', 'Controller create는 바인딩된 Board를 전달하며 JSP 파일은 UTF-8을 선언한다. 오류 응답/바인딩 거부에 따른 저장 실패도 아니다.'],
    same_pattern: ['같은 필터를 쓰는 게시글 수정과 한글 검색 파라미터도 영향 범위다.'],
    edits: [[w + 'WEB-INF/web.xml', '            <param-value>ISO-8859-1</param-value>', '            <param-value>UTF-8</param-value>']],
    verification: ['한글 제목/본문 등록·수정·검색 왕복 일치, ASCII 입력과 로그인 동작 회귀 확인']
  },
  '04-session-bypass': {
    cause: '게시판 경로가 인증 인터셉터 매핑에서 빠진 상태로 currentUser를 선택 인자로 받아 익명 요청이 null 사용자 역참조까지 진행한다.',
    locations: [...location(w + 'WEB-INF/spring/dispatcher-servlet.xml', 10), ...location(j + 'web/BoardController.java', 37)],
    reason: '인터셉터 매핑은 /code/**와 logout뿐이다. currentUser는 LoginInterceptor:37에서만 넣는데 Controller는 required=false로 받아 :39에서 user.getName()을 실행한다. 익명 요청의 실제 NPE도 그 줄을 가리킨다.',
    eliminated: ['인터셉터 내부에는 user=null 로그인 redirect/return false가 있어 null 검사의 부재가 아니다.', 'service.list 이후 user.getName에서 NPE가 발생했으므로 SQL 예외나 뷰 렌더링 실패가 아니다.'],
    same_pattern: ['빠진 /board/**에 속하는 등록·수정·삭제도 인증/권한/CSRF 검사 보호가 필요하다.'],
    edits: [[w + 'WEB-INF/spring/dispatcher-servlet.xml', '            <mvc:mapping path="/code/**"/>', '            <mvc:mapping path="/board/**"/>\n            <mvc:mapping path="/code/**"/>'],
      [j + 'web/BoardController.java', '    public String list(@ModelAttribute("search") BoardSearch search, @RequestAttribute(value = "currentUser", required = false) UserSession user, Model model) {', '    public String list(@ModelAttribute("search") BoardSearch search, @RequestAttribute("currentUser") UserSession user, Model model) {']],
    verification: ['로그아웃/만료 후 게시판 직접 접근이 로그인 302, 로그인 목록 200, 변경 요청의 권한/CSRF 거부 확인']
  },
  '05-paging': {
    cause: '마지막 페이지 계산이 나머지를 버려 11건을 한 페이지로 계산하고 다음 버튼을 숨긴다.',
    locations: location(j + 'common/Pagination.java', 39),
    reason: 'pageSize=10일 때 total/getPageSize()는 11/10=1이다. paging.jspf:8은 현재 페이지<lastPage일 때만 다음 버튼을 만들며 service는 실제 count를 total에 넣는다. 2페이지 직접 요청은 200이다.',
    eliminated: ['총건수는 count로 입력되고 2페이지 직접 조회가 가능하므로 마지막 데이터 자체 삭제나 조회 경로 404가 아니다.', 'JSP의 조건은 계산된 lastPage를 사용하므로 가장 이른 잘못된 값은 Pagination 계산이다.'],
    same_pattern: ['Pagination을 상속한 BoardSearch 및 JSP/Thymeleaf 페이징 조각에서 같은 lastPage를 소비한다.'],
    edits: [[j + 'common/Pagination.java', '        return Math.max(1, total / getPageSize());', '        return Math.max(1, (total + getPageSize() - 1) / getPageSize());']],
    verification: ['총건수 0/1/10/11/20/21에서 lastPage와 이전/다음 링크, 마지막 행 접근 확인']
  },
  '06-sort-sql': {
    cause: '정렬 식별자 변환이 제거되어 UI 값 createdAt이 SQL ORDER BY에 그대로 삽입된다.',
    locations: location(j + 'domain/BoardSearch.java', 78),
    reason: 'setter는 createdAt/title만 허용하지만 getSortColumn은 sort를 그대로 반환한다. Mapper:34는 ${sortColumn}으로 직접 치환하며 실제 SQL과 H2 예외는 CREATEDAT 미존재를 가리킨다. title 정렬은 200이다.',
    eliminated: ['정렬 setter의 허용 목록은 남아 있어 임의 값이 무제한 허용된다는 주장은 하지 않는다.', '같은 SELECT의 title 정렬은 성공하므로 테이블 전체 부재나 공통 날짜 필터 오류를 원인으로 잡지 않는다.'],
    same_pattern: ['ORDER BY가 같은 DTO getter를 쓰는 조회를 확인했다. createdAt에는 물리 컬럼 b.CREATED_AT 변환이 필요하다.'],
    edits: [[j + 'domain/BoardSearch.java', '        return sort;', '        return "title".equals(sort) ? "b.TITLE" : "b.CREATED_AT";']],
    verification: ['sort=title/createdAt 모두 200, 알 수 없는 정렬 값은 거부, 바인딩 SQL과 정렬 결과 확인']
  },
  '07-oracle-log-only': {
    cause: 'Oracle 로그의 B.CREATED_AT 식별자 오류는 기간 조건 두 곳과 ORDER BY 중 어느 참조에서 발생했는지 확정할 수 없다.',
    locations: location(r + 'mapper/BoardMapper.xml', 23, 26, 34), status: 'UNRESOLVED',
    reason: 'MyBatis selectList의 ? 바인딩 SQL은 같은 식별자를 세 번 참조한다. XML filters의 23/26행과 sortColumn이 b.CREATED_AT을 반환해 삽입되는 34행이 대응한다. Oracle 로그는 합성이고 실제 배포 SQL/스키마가 없다.',
    eliminated: ['PersistenceException의 하위 예외는 ORA-00904 식별자 오류이므로 로컬 요청 인코딩이나 뷰 오류만으로 설명하지 않는다.', '로컬 소스와 공통 Oracle 페이징 SQL만으로 배포 스키마/동의어/컬럼 대소문자 차이를 소거할 수 없다.'],
    same_pattern: ['같은 filters를 사용하는 count에도 날짜 참조가 있으나 제공된 오류 SQL은 selectList다. 채점 후보를 실제 오류 SQL의 세 참조로 한정한다.'],
    edits: [],
    verification: ['사용자에게 마스킹된 실제 배포 SQL/바인딩 타입, current_schema와 ALL_TAB_COLUMNS 결과 요청'],
    next_actions: ['승인된 환경에서 사용자가 schema/컬럼/동의어 정보를 확인하고 배포 Mapper 리비전을 제공하도록 요청'],
    unverified: ['실제 Oracle DB 미접속·미재현', '합성 로그와 실제 배포 SQL/바인딩 값 일치 여부, 세 참조 중 실패 지점 미확정']
  },
  '08-thymeleaf-utilities': {
    cause: 'Thymeleaf 3.1 템플릿에 제거된 #request/#session 유틸리티가 남아 표현식 평가가 실패한다.',
    locations: [...location(w + 'WEB-INF/templates/board/list.html', 7), ...location(w + 'WEB-INF/templates/fragments/common.html', 7)],
    reason: 'pom은 thymeleaf-spring5 3.1.5다. 실제 예외는 #session.getAttribute 및 utility objects unavailable을 명시하고, 소스 전체 템플릿 검색에서 #request.getAttribute(viewer)도 찾았다. Controller는 viewer 모델을 이미 제공한다.',
    eliminated: ['Controller 반환명 board/list에 맞는 HTML 파일이 존재하며 404가 아닌 TemplateProcessingException이다.', '템플릿 파일 인코딩 문제가 아니라 표현식 객체를 사용할 수 없다는 가장 깊은 예외다.'],
    same_pattern: ['모든 HTML에서 두 제거 유틸리티를 검색해 목록 viewer와 공통 csrf 두 곳을 확인했다.'],
    edits: [[w + 'WEB-INF/templates/board/list.html', '        <p><span th:text="${#request.getAttribute(\'viewer\')}"></span>님</p>', '        <p><span th:text="${viewer}"></span>님</p>'],
      [w + 'WEB-INF/templates/fragments/common.html', '            <input type="hidden" name="csrf" th:value="${#session.getAttribute(\'csrf\')}">', '            <input type="hidden" name="csrf" th:value="${session.csrf}">']],
    verification: ['로그인 목록 렌더링 200, viewer/CSRF 값 제공, 공통 조각을 사용하는 다른 화면과 로그아웃 POST 확인']
  },
  '09-view-resolver': {
    cause: '공존 뷰 설정에서 Thymeleaf 대상에서 board/*를 빼고 JSP에 먼저 맡겨 존재하지 않는 JSP 경로로 해석된다.',
    locations: location(w + 'WEB-INF/spring/dispatcher-servlet.xml', 35, 40, 41),
    reason: 'Controller는 board/list를 반환한다. Thymeleaf viewNames는 login,error뿐이고 JSP resolver는 order=0, viewNames=code/*,board/*다. 실제 인덱스에는 templates/board/list.html이 있고 views/board JSP는 없으며 요청은 404다.',
    eliminated: ['@GetMapping(/list.do)와 board/list HTML이 있으므로 컨트롤러 경로나 HTML 파일 자체 부재가 아니다.', 'JSP resolver가 먼저 board/*를 수용하므로 Thymeleaf 표현식 평가에 도달하는 08번 오류와 경로가 다르다.'],
    same_pattern: ['board/detail·form도 같은 board/* 뷰 그룹이므로 목록 외 두 화면의 resolver 선택을 확인해야 한다.'],
    edits: [[w + 'WEB-INF/spring/dispatcher-servlet.xml', '        <property name="viewNames" value="login,error"/>', '        <property name="viewNames" value="board/*,login,error"/>'],
      [w + 'WEB-INF/spring/dispatcher-servlet.xml', '        <property name="order" value="0"/>', '        <property name="order" value="2"/>'],
      [w + 'WEB-INF/spring/dispatcher-servlet.xml', '        <property name="viewNames" value="code/*,board/*"/>', '        <property name="viewNames" value="code/*"/>']],
    verification: ['board/list/detail/form은 HTML로 200, code/list는 JSP로 200, resolver 선택과 양쪽 인코딩 회귀 확인']
  },
  '10-fragment-encoding': {
    cause: '한글 공통 JSP 조각에 pageEncoding 선언이 없어 본문과 다른 소스 인코딩으로 번역된다.',
    locations: location(w + 'WEB-INF/views/common/paging.jspf', 1),
    reason: 'paging.jspf는 한글을 포함하지만 첫 줄이 div이고 pageEncoding이 없다. header.jspf는 UTF-8을 선언하며 list.jsp:70이 paging.jspf를 정적으로 포함한다. 실제 HTTP 본문은 정상 한글이고 조각만 불일치한다.',
    eliminated: ['전체 응답은 200이고 게시판 본문 한글이 정상이므로 저장 데이터 전체 손상이나 전체 응답 인코딩 실패로 좁히지 않는다.', '공통 header는 UTF-8을 선언하고 해당 조각만 선언이 없는 차이를 확인했다.'],
    same_pattern: ['다른 JSP 조각의 pageEncoding 선언을 확인했다. 한글 조각 파일마다 소스 인코딩을 명시해야 한다.'],
    edits: [[w + 'WEB-INF/views/common/paging.jspf', '<div class="paging" aria-label="페이지 이동">', '<%@ page pageEncoding="UTF-8" %>\n<div class="paging" aria-label="페이지 이동">']],
    verification: ['페이지 이동/건수 안내·이전/다음 한글 정상, 본문/메뉴 및 다른 조각 회귀 확인']
  }
};

const catalog = await json(path.join(repository, '.tmp/m3-training-first-projects.json'));
const freeze = path.join(repository, 'docs/evidence/m3-freeze-v3.json'), frozen = await json(freeze);
await checkSources(repository, frozen.files);
if (frozen.tool_fingerprint !== await debugFingerprint()) throw new Error('동결 도구 불일치');
const output = path.join(repository, 'docs/evidence/m3-training-first');
await mkdir(output);
const submitted = [];
for (const entry of catalog) {
  const data = reviews[entry.id], oracle = entry.id === '07-oracle-log-only';
  const diffs = [];
  for (const [file, before, after] of data.edits) {
    const source = await readFile(path.join(entry.project, file), 'utf8');
    if (!source.includes(before)) throw new Error(entry.id + ': 수정안 원문 불일치');
    const line = source.slice(0, source.indexOf(before)).split('\n').length;
    diffs.push(`--- a/${file}\n+++ b/${file}\n@@ -${line},${before.split('\n').length} +${line},${after.split('\n').length} @@\n${before.split('\n').map(l => '-' + l).join('\n')}\n${after.split('\n').map(l => '+' + l).join('\n')}`);
  }
  const reproduction = oracle ? { executed: false, note: '실제 Oracle 환경이 없어 미재현. 입력은 MyBatis 형식 합성 로그다.' }
    : { executed: true, command: `node scripts/reproduce-debug.mjs ${entry.id} <mvn.cmd> <JAVA_HOME> docs/evidence/m3-mask-v3/runtime/${entry.id}.json capture`, artifact: 'evidence/runtime-observed.json',
        note: '입력 수집 때 실제 앱에서 결함을 재현했다(동결 전). 같은 패치의 새 임시 복사본을 동결 후 소스로 분석했다. 수정 적용/수정 후 검증은 미실행이다.' };
  if (!oracle) {
    const runtime = await readFile(path.join(repository, 'docs/evidence/m3-mask-v3/runtime', entry.id + '.json'), 'utf8');
    if (JSON.parse(runtime).status !== 'PASS') throw new Error('실제 재현 실패');
    await save(path.join(entry.directory, 'evidence/runtime-observed.json'), mask(runtime));
  }
  const diagnosis = { source_reviewed: true,
    symptom: (await readFile(path.join(repository, 'evals/debug/cases', entry.id, 'symptom.md'), 'utf8')).trim(),
    candidates: [{ cause: data.cause, status: data.status ?? 'CONFIRMED', level: oracle ? 2 : 5, locations: data.locations, reason: data.reason }],
    eliminated: data.eliminated, same_pattern: data.same_pattern, verification: data.verification,
    reproduction, proposal: { diff: diffs.join('\n\n'), note: oracle ? '실제 배포 SQL/스키마 확인 전 수정 제안 보류.' : '원인을 바로잡는 최소 diff 제안이며 적용하지 않았다.' },
    unverified: data.unverified ?? ['수정안 미적용·수정 후 앱 회귀 미실행', 'Java 8/11 및 JEUS/WebLogic 실환경 미검증'],
    next_actions: data.next_actions ?? ['사용자가 수정 범위를 승인한 뒤 제안 diff 적용 및 verification 절차 실행'] };
  await save(path.join(entry.directory, 'evidence/diagnosis.json'), diagnosis);
  const result = await finishDebug(entry.project, entry.run_id);
  const dest = path.join(output, entry.id);
  await cp(entry.directory, dest, { recursive: true, errorOnExist: true, force: false });
  submitted.push({ case_id: entry.id, run_id: entry.run_id, status: result.status, diagnosis_sha256: digest(await readFile(path.join(dest, 'evidence/diagnosis.json'))), report_sha256: digest(await readFile(path.join(dest, 'report.md'))) });
}
// 모든 진단·보고서를 먼저 보존한 뒤에만 승인 정답을 읽고 첫 채점한다.
await save(path.join(output, 'submitted-before-scoring.json'), { created_at: new Date().toISOString(), frozen_revision: frozen.revision, submitted });
const approval = await json(path.join(repository, 'evals/debug/approval-20261028.json'));
const scores = [];
for (const entry of catalog) {
  const expected = path.join(repository, 'evals/debug/cases', entry.id, 'expected.json');
  if (digest(await readFile(expected)) !== approval.records.find(r => r.case_id === entry.id)?.approved_sha256) throw new Error('승인 정답 해시 변경');
  const score = await scoreDebug(entry.directory, expected, { dataset: 'training', output: path.join(output, entry.id, 'score.json'), freeze, repository });
  scores.push({ ...score, analysis_status: submitted.find(s => s.case_id === entry.id).status,
    evidence_level: reviews[entry.id].status === 'UNRESOLVED' ? 2 : 5 });
  console.log(JSON.stringify(score));
}
const summary = { dataset: 'training', first_scoring: true, frozen_revision: frozen.revision, tool_fingerprint: frozen.tool_fingerprint,
  cases: scores.length, hit_cases: scores.filter(s => s.hit).length, expected_locations: scores.flatMap(s => s.locations).length,
  hit_locations: scores.flatMap(s => s.locations).filter(l => l.hit).length, extra_locations: scores.flatMap(s => s.extra_locations).length,
  caveat: 'Codex 자기 작성 학습 세트·기존 작성 문맥을 아는 에이전트의 수동 소스 검토. 블라인드/일반화 성능이 아니다. 실제 held-out 미열람·미실행.', scores };
await save(path.join(output, 'summary.json'), summary);
await writeFile(path.join(output, 'reviewer-driver.mjs'), await readFile(fileURLToPath(import.meta.url)), { flag: 'wx' });
await checkSources(repository, frozen.files);
console.log(JSON.stringify({ cases: summary.cases, hit_cases: summary.hit_cases, hit_locations: summary.hit_locations, expected_locations: summary.expected_locations, extra_locations: summary.extra_locations }));
