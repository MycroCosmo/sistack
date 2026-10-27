# Thymeleaf 삭제 AJAX — 정답 승인 GATE

상태: **DRAFT / 미채점**. 연결의 CONFIRMED는 소스로 확인한 정적 관계이며 정답 승인이나 실제 요청 실행을 뜻하지 않는다. 기계 판독 범위·근거·파일 SHA-256은 [JSON](expected.draft.json)에 있다.

소스 루트는 `examples/legacy-board-thymeleaf/`, 작성 기준 revision은 `fd1b93c69a64db5e54d72bb8eee0cefb19405f5b`다. 구현 동결 후 원문으로 작성했으며 인덱서·질의·eval을 실행하지 않았다.

| 출발 | 종류 | 도착 | 소스 근거 |
|---|---|---|---|
| detail.html#handler:7 | requests | POST /board/delete.do | detail.html:7–15의 submit 취소·인라인 URL·POST·serialize, :39–42의 폼 |
| POST /board/delete.do | maps_to | BoardController#delete | BoardController.java:18,68–71 |
| BoardController#delete | calls | BoardServiceImpl#delete | Controller:20,71, 구현체:13,58 |
| BoardServiceImpl#delete | calls | BoardMapper#delete | 구현체:15,59, Mapper.java:18 |
| BoardMapper#delete | executes | BoardMapper.delete | Mapper.java:18, Mapper.xml:3,53, root-context.xml:6–11 |
| BoardMapper.delete | writes | BOARD | BoardMapper.xml:53–54 |
| POST /board/delete.do | intercepted_by | LoginInterceptor#preHandle | dispatcher-servlet.xml:10,13, Interceptor:18,27,33 |
| LoginInterceptor#preHandle | calls | MenuMapper#selectList | Interceptor:13,38, dispatcher-servlet.xml:14 |
| MenuMapper#selectList | executes | MenuMapper.selectList | MenuMapper.java:9–10 |
| MenuMapper.selectList | reads | APP_MENU | MenuMapper.java:9 |

승인 요청 범위는 위 **10개 연결**이다. 수치는 초안 크기이며 점수가 아니다. requests는 AJAX URL이 있는 **detail.html:12**로 한정한다. 선언한 source/kind/위치 scope 안의 다른 실제 연결도 향후 과탐 비교 대상이며 기대 도착 노드만 추려 통과시키지 않는다.

ADMIN 로그인·유효 CSRF를 만족하는 경로를 가정한다. 로그인 부재·권한 부족·CSRF 실패는 인터셉터에서 중단된다. 삭제 건수가 1이 아니면 NotFoundException이며 삭제 전에 get/selectOne을 호출하지 않는다. 이 값·실행 결과는 정적 연결 채점과 구별한다.

성공 후 목록 이동(:18), 기본 폼 요청(:39), 화면 진입·레이아웃·수정 링크, 실제 HTTP·DB 결과는 이번 scope 밖이다. 기본 action과 자연 템플릿 fallback을 AJAX 요청과 중복 합산하지 않는다. APP_MENU는 인증 부수 읽기이고 BOARD는 업무 삭제 쓰기다.

승인된 JSP 삭제 기준선이 없으므로 parity를 새로 만들지 않는 독립 held-out이다. 학습 parity/screen 및 외부 사례와 점수를 합산하지 않는다. 테스트베드 전체는 앞선 학습 인덱싱 입력에 포함됐으므로 외부 블라인드 표본으로 주장하지 않는다. 삭제 흐름에 대한 개별 채점·사례 대응 튜닝은 하지 않았다.

이 초안 승인 전에는 동결 구현 수정·채점·튜닝을 하지 않는다. 두 held-out이 모두 승인되면 같은 동결 지문으로 각각 첫 실행하고 실패까지 원본으로 보존한 뒤 다시 GATE 보고한다.
