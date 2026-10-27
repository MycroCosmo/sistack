# Thymeleaf 삭제 AJAX — 승인 정답

2026-10-27 사용자 검토 수정에 따라 확정했다. [JSON](expected.json)의 source_files·근거·scope가 기계 판독 계약이다. 이전 [초안](expected.draft.md)은 검토 이력으로 보존하며 채점하지 않는다. CONFIRMED는 정적 소스 관계이며 실행 결과가 아니다.

## screen — 4개

| 출발 | 종류 | 도착 | detail.html 근거 |
|---|---|---|---|
| detail.html#handler:7 | requests | POST /board/delete.do | :7–15 submit 취소·인라인 URL·POST·serialize, :39–42 폼 |
| detail.html#handler:7 | requests | GET /board/list.do | :16–18 성공 분기의 location.href 인라인 URL |
| detail.html | requests | GET /board/list.do | :36 목록 링크 |
| detail.html | requests | GET /board/form.do | :37–38 ADMIN 수정 링크, id 쿼리 |

scope는 **detail.html 파일에서 나가는 모든 requests**다. `from.file`로 화면·인라인·handler를 모두 포함하며 행이나 목적지로 출력 범위를 제한하지 않는다. frozen validateExpected가 정답과 scope의 선택자 일치를 요구하므로 실제 정답 출발 이름 scope도 함께 선언했다. 이는 파일 전체 scope를 좁히지 않는다.

POST 정답은 handler의 **1개**뿐이다. `event.preventDefault()`가 기본 submit을 막으므로 :39의 th:action에서 별도 POST가 생성되면 과탐이다. th:inline과 fallback도 별도 요청으로 합산하지 않는다. 같은 파일의 모든 requests를 비교하므로 기존 :36 목록·:38 수정 링크도 소스 사실에 따라 정답에 포함했다. :18의 이동과 :36의 클릭은 출발 노드가 다른 별도 관계다.

## server — 9개

| 출발 | 종류 | 도착 | 근거 |
|---|---|---|---|
| POST /board/delete.do | maps_to | BoardController#delete | Controller:18,68–71 |
| BoardController#delete | calls | BoardServiceImpl#delete | Controller:20,71, 구현체:13,58 |
| BoardServiceImpl#delete | calls | BoardMapper#delete | 구현체:15,59, Mapper.java:18 |
| BoardMapper#delete | executes | BoardMapper.delete | Mapper.java:18, XML:3,53, root-context:6–11 |
| BoardMapper.delete | writes | BOARD | BoardMapper.xml:53–54 |
| POST /board/delete.do | intercepted_by | LoginInterceptor#preHandle | dispatcher-servlet:10,13, Interceptor:18,27,33 |
| LoginInterceptor#preHandle | calls | MenuMapper#selectList | Interceptor:13,38, dispatcher-servlet:14 |
| MenuMapper#selectList | executes | MenuMapper.selectList | MenuMapper.java:9–10 |
| MenuMapper.selectList | reads | APP_MENU | MenuMapper.java:9 |

ADMIN 로그인·유효 CSRF를 전제로 한다. 인증·권한·CSRF 실패는 인터셉터에서 중단되며 실제 BOARD 삭제를 주장하지 않는다. 서비스는 선행 get/selectOne 없이 삭제 건수를 확인하고 1이 아니면 NotFoundException을 던진다. APP_MENU는 인증 부수 읽기다.

화면 진입·레이아웃, 목록/수정 요청 이후 서버 흐름, 실제 HTTP/DB 실행은 범위 밖이다. 로컬 템플릿은 이전 전체 학습 인덱싱에 포함돼 외부 블라인드 표본으로 주장하지 않는다.

## 채점·동결

screen/server는 JSON의 `report_group` 라벨로 고정한다. 현재 frozen 비교기의 기본 그룹 enum은 parity/screen이므로 비교기를 수정하지 않고 각 라벨의 승인 scope/edges를 그대로 투영해 같은 evalTrace로 별도 채점한다. 두 그룹·다른 사례·학습 점수를 합산하지 않는다. 승인 JSP 삭제 기준선이 없어 parity를 임의 생성하지 않는다.

구현 `fd1b93c`·도구 지문 `8e5bdc83d9c4da2a4efee1b5d709ff1bb6126ddb9475ae9c7b3d7973a367eec0`을 유지한다. 첫 결과는 누락·과탐·상태 불일치와 원본을 보존하고 수정 전 점수 GATE에서 멈춘다.
