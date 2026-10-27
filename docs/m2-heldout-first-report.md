> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M2 — 수정 전 held-out 첫 실행 보고

**수정 전 held-out: 66개 연결 중 60개 일치, 누락 6개, 선언한 범위 내 과탐·상태 불일치 0개.** 게시물 목록과 등록은 FAIL, 중복확인 AJAX는 연결 비교 PASS다. 분석 manifest는 세 건 모두 PARTIAL이다. 사례 대응 구현 수정은 하지 않았다.

## 한 일

- 사용자 검토 조건을 반영해 정답 3건을 `expected.json` / `expected.md`로 확정했다. 승인 커밋은 `c01c908`이다.
- 게시물 목록의 `propertyService.getInt(pageUnit/pageSize)`는 `calls → unknown:external-injection`, UNRESOLVED 한 논리 연결에 두 호출 위치를 기록했다. 공통 인증 Helper 내부 연결 두 건은 보충 정답으로 옮겼다. 두 기준을 [decisions.md](decisions.md)에 기록했다.
- [동결 기준](evidence/m2-baseline.json)의 구현 파일 46개와 설치본 해시를 실행 전·후 대조했다. 모두 동일하며 도구 지문은 `5d142300da62cf138bcdd57f8a53c54e4d2f6d8402b122b52585ff7e6da398e3`이다.
- 설치된 `si-trace`의 prepare/finish를 실행했다. 게시물 목록과 등록은 화면·서버·SQL 탐색자를 실제 병렬 실행했고, 중복확인은 직접 원문 확인했다. 탐색자는 정답·점수를 보지 않았다. 주 에이전트는 승인 정답을 알고 있는 자기 적용 평가자이므로 독립 블라인드 평가가 아니다.

## 검증

### held-out 첫 점수

| 사례 | 정답 연결 | 일치 | 누락 | 범위 내 과탐 | 상태 불일치 | 연결 비교 |
|---|---:|---:|---:|---:|---:|---|
| egov-article-list | 38 | 35 | 3 | 0 | 0 | FAIL |
| egov-user-insert | 11 | 8 | 3 | 0 | 0 | FAIL |
| egov-id-dplct-ajax | 17 | 17 | 0 | 0 | 0 | PASS |
| 합계 | **66** | **60** | **6** | **0** | **0** | FAIL |

이 수치는 승인된 source/kind/위치 범위에 한한다. 전체 프로젝트 정확도가 아니며 아래 범위 밖 결함을 과탐 0개라는 수치로 가리지 않는다.

자동 골격 원본은 실행 즉시 저장했다. 보고용 trace에는 요청한 endpoint와 그 아래 경로를 남겨 다른 화면 동작·forward 이후·Controller 이전 경로를 제외했다. **누락 연결은 추가하지 않았고**, 자동 골격과 최종 스킬 결과의 위 점수가 같은지 검사했다. 첫 전방 결과·역방향 결과·원문 검토·최종 스킬 결과를 각각 보존했다.

AJAX는 등록 JSP의 두 함수만 전방 추적하면 9/17이다. 사용자가 지정한 `--to /uss/umt/EgovIdDplctCnfirmAjax.do` 첫 역방향 질의를 함께 사용한 결과가 표의 17/17이다. 역방향에서 **5개 JSP, 10개 요청 함수**가 모두 일치했고 누락·추가 JSP는 0개다. 9/17 원본도 덮어쓰지 않았다.

### 학습 세트 — held-out과 별도

이전 M1 수정에 사용한 학습 세트는 5건/55개 연결 일치, 누락·과탐·상태 불일치 0개다. [기존 학습 평가](evidence/m2-training-summary.json)를 그대로 참조하며 이번 held-out과 합산하지 않는다. 이번 작업에서 학습 스킬 실행을 다시 하지 않았다.

### 실행·무결성

- `npm test`: **65/65 PASS**. 승인 정답 8건의 근거 해시·라인, 스킬 형식 2개, 공통 복사본 일치 검사 통과. 이 PASS는 연결 eval의 FAIL을 대체하지 않는다.
- 첫 prepare/finish 3건: 모두 종료 코드 0. 최종 manifest 3/3 계약 검증 PASS, 분석 상태는 모두 PARTIAL.
- 복잡 분기 2건 / 단순 분기 1건. 실제 앱·HTTP·DB 요청은 실행하지 않았다.
- 압축 원본 59개 파일의 해시·복원 검사 PASS. 구현 동결 지문과 설치본 일치 확인.
- 스킬 평가 저장기의 일반 마스킹이 AJAX 정답 SHA-256 내부 숫자열을 개인정보로 오인했다. 첫 평가 레코드의 마스킹된 값은 그대로 보존했고, 첫 골격 기록의 유효한 해시를 results.json에 출처와 함께 별도 기록했다. 압축 원본 안 승인 정답 바이트·해시와 일치함을 확인했으며 점수는 변하지 않았다. 저장기 코드는 수정하지 않았다.
- 보충 정답 26개는 연결 점수와 별도로 확인했다. 첫 보고서에 25개 기록, ID 생성기 상세 형식값(cipers/fillChar) 1개는 부분 기록이다. 외부 구현·런타임 경계 8개는 UNRESOLVED를 유지한다. 이는 보고서 수록 여부의 수동 자기 평가이며 실행 정확도 점수가 아니다.

## 결정

첫 결과의 누락과 source review 의견을 그대로 남기고 사례 대응 수정은 하지 않았다. 이후 개선 결과는 새 run-id·새 점수 파일로 남겨 이 기준선을 보존한다. 승인 정답 안의 `approval.first_execution=NOT_RUN`은 **승인본 확정 시점**의 기록이며 현재 실행 상태는 datasets.json과 이 결과 파일을 따른다. 첫 실행 후 정답 해시를 바꾸지 않았다.

원본은 [기계 판독 결과](evidence/m2-heldout-first/results.json), [압축 원본](evidence/m2-heldout-first/originals.json.gz), [복원 형식 설명](evidence/m2-heldout-first/README.md)에 남겼다. 압축 원본에는 승인 정답, 전체 골격, 최초 전방/역방향 질의, 점수, manifest, 검토 기록, 탐색 요약과 명령 로그를 포함한다. 원본 JSON 파일은 대상 프로젝트 `.sistack/runs/`와 저장소 `.sistack/held-out-first/`에도 유지한다.

## 남은 문제

### 연결 누락 6개

| 사례 | 누락 연결 | 원문 |
|---|---|---|
| 게시물 목록 | Controller → EgovUserDetailsHelper#getAuthenticatedUser | EgovArticleController.java:151 |
| 게시물 목록 | Controller → EgovUserDetailsHelper#isAuthenticated | EgovArticleController.java:153 |
| 게시물 목록 | EgovBBSMasterServiceImpl → EgovComponentChecker#hasComponent | EgovBBSMasterServiceImpl.java:69 |
| 사용자 등록 | Controller → EgovUserDetailsHelper#isAuthenticated | EgovUserManageController.java:186 |
| 사용자 등록 | Service → EgovFileScrty#encryptPassword | EgovUserManageServiceImpl.java:101 |
| 사용자 등록 | Service → EgovStringUtil#isNullToString | EgovUserManageServiceImpl.java:101 |

여섯 건 모두 실제 로컬 static 호출이다. 공통 인증 Helper에서 더 깊은 security 구현으로 가는 두 연결은 승인 기준에 따라 점수에서 제외했다. 외부 PropertyService/validator/ID 생성기 호출을 지우거나 확정해 점수를 올리지 않았다.

### 연결 점수 범위 밖에서 발견한 문제

- 등록 JSP의 `fnInsert`가 목록 URL로 연결된 첫 골격은 잘못이다. 실제 form action은 등록 URL이고 `fnListPage`의 action과 구별해야 한다. 원본 오연결을 보존했다.
- 등록 JSP의 모달 `href="#"` 두 곳을 unknown 네트워크 요청으로 수집했다. 실질 요청은 onclick의 AJAX다.
- `dummy` 프로필 AuthenticInterceptor를 현재 요청에 CONFIRMED로 적용한 골격은 프로필 조건을 빠뜨렸다. 실제 프로필·서버 override는 미검증이며 기본 security 설정과 구별해야 한다.
- table/view 노드의 Altibase DDL 대표 위치는 활성 mysql DDL 위치가 아니다. 보고서에서 구별했으며 구현은 수정하지 않았다.
- 평가 저장기는 `expected_sha256`에 일반 마스킹을 적용해 해시를 손상시킬 수 있다. AJAX 첫 레코드에서 실제 발생했다. 원본 레코드를 고치거나 첫 실행을 다시 하지 않았으며 원래 해시는 골격·압축 원본·요약에 별도 보존했다.
- JSP 전체 탐색은 상세 링크의 조회수 UPDATE나 등록 후 목록 SQL까지 확장한다. 요청 범위를 명시해야 하며 목록 조회 자체가 DB를 갱신한다고 설명하면 안 된다.

각 사례 보고서: [게시물 목록](evidence/m2-heldout-first/egov-article-list.md), [사용자 등록](evidence/m2-heldout-first/egov-user-insert.md), [중복확인 AJAX](evidence/m2-heldout-first/egov-id-dplct-ajax.md). 보충 항목은 [별도 기록](evidence/m2-heldout-first/supplemental-review.json)을 따른다.

Codex에서 설치 스킬이 현재 세션 목록에 나타나고 해당 설치본을 실행했다. 별도의 `$si-trace` 명시 질문과 한국어 3문항 자동 선택 검증은 이번 첫 평가 범위에서 수행하지 않았다. [수동 확인 절차](manual-checks.md)의 미검증 항목으로 남는다. M2 완료 처리는 하지 않았다.

## 사용자 확인 필요

추가 승인을 요구하는 작업은 없다. 요청한 **수정 전 첫 결과 보고까지** 완료했으며, 이 보고 전에 사례 대응 구현을 수정하지 않았다. M3는 시작하지 않았다.
