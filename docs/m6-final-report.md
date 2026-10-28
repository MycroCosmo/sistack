# M6 종료 보고 — v0.1.0

> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

2026-10-29. M6의 구현·로컬 검증 범위는 완료했다. 통합 실행 상태는 **PARTIAL**이다. 화면 BLOCKED와 실제 도구 세션 로딩 미검증을 남겼으며 공개·push·패키지 배포는 수행하지 않는다. 로컬 태그는 `v0.1.0`이다.

### 한 일

- 시작 전 사용자 추가 조건을 `prompts/M6.md`와 AGENTS.md에 반영해 d96e9b4로 먼저 커밋했다. 설정 인증·단일 CLI·공통 함수 수정안 분기는 8567d08에서 구현하고, 실행 중 발견한 직렬화·비밀값 제거·증거 보존 문제를 후속 커밋으로 보정했다.
- REQ-001 작성자 검색 SQL 오류를 독립 사본에서 재현했다. 화면→Controller→Service→Mapper 추적, 로그 분석, 승인된 수정, JUnit 수정 전후 실행, 프로그램 목록과 화면 TC 1차/2차까지 **manifest 8개**를 `request_id`, `requirement_ids`, `parent_run_ids`로 연결했다. 실행기는 `scripts/run-integration.mjs`, 사후 대조기는 `scripts/check-integration.mjs`, 조회기는 `scripts/trace-request.mjs`다.
- 인증을 `sistack-docs.json.auth`로 분리했다. 로그인 URL·입력 필드·성공 URL/요소·실제 계정 ID를 설정하며 암호는 `password_env` 환경 변수 참조만 받는다. 요청 본문·쿠키·암호는 증거로 저장하지 않고, 알려진 암호의 원문·URL/JSON 인코딩 값도 로그와 스크린샷에서 제거한다. 기존 역할 선택 로그인은 `examples/configs/` 설정으로 재현한다.
- `npx ... sistack`의 trace / debug-parse / unit-plan / docs program-list / docs table-spec / docs tc를 제공한다. full은 결정적 설명을 추가하고, structure-only는 구조만, no-ai는 상세 JSON을 출력한다. 모든 모드가 외부 AI 호출 없이 실행된다. CLI의 계획/파싱 결과를 원인 확정이나 실행 PASS로 승격하지 않는다.
- 여러 호출자가 쓰는 Java 메서드 수정안에는 국소/공통 diff와 인덱서 역방향 호출자 근거를 모두 요구한다. 기본 추천은 국소 수정이다. REQ-001은 SQL 수정이므로 이 조건과 별도로 공통 메서드 두 호출자 fixture에서 거부·승인 동작을 검증했다.
- README, CLI/인증 가이드, pstack 관계, 기여 절차, CHANGELOG, NOTICE와 실제 로딩 수동 확인 절차를 정리했다. 승인 버전 두 개와 전이 의존성은 lock 및 배포용 npm-shrinkwrap으로 고정했다.

### 검증

| 실제 실행/대조 | 결과와 범위 |
|---|---|
| `npm test` | **195/195 PASS**, 승인 정답·인벤토리 검사, 스킬 5개(실제 4개+설치 예제), 공통 복사본 검사 PASS |
| `node scripts/run-integration.mjs <승인 로컬 설정>` | `.sistack/runs/m6-req001-v2/`에 완료. 초기 v1의 패치 컨텍스트 적용 실패도 덮어쓰지 않고 보존 |
| JUnit 동일 생성 테스트 48건 | 수정 전 PASS 46·SQL 오류 2 → 수정 후 **48/48 PASS**. JUnit 4·Mockito 4·spring-test·H2, pom 변경 없음 |
| 동일 화면 TC 37건 | 1차 PASS 29·FAIL 1·BLOCKED 3·SKIP 4 → 2차 PASS 30·FAIL 0·BLOCKED 3·SKIP 4 |
| 작성자 검색 UI/네트워크 | Chrome·Edge 각각 **FAIL→PASS**. 소스의 검색 form과 searchType/keyword를 사용. SQL 오류 HTTP 500 및 수정 후 요청/화면을 함께 확인 |
| `node scripts/check-integration.mjs .sistack/runs/m6-req001-v2` | 스키마·선행 연결 8/8, 동일 TC 바이트, 원래 1차 xlsx 해시, 2차의 1차 열 보존, JUnit 보조 시트 48건, DB/SQL 덤프 존재 PASS |
| 프로그램 목록 | 화면/클래스/SQL 25행. 공유 Service 병합·기본 제외 유지. 미확인 업무명/ID/메타데이터는 빈 칸. 기본 양식 채우기·재읽기 PASS, 내용 상태 PARTIAL |
| xlsx | 프로그램 및 화면 1차/2차 재읽기·양식 보존 PASS. 별도 서버로직검증 시트만 추가. 읽기 전용 미리보기 확인, 원시 파일 재저장 없음 |
| 설정 기반 인증 | 설치 Chrome에서 임의 필드·암호 ENV·CSRF·리디렉션·성공 요소, 루트/컨텍스트 경로 및 실패 로그인 거부 PASS. legacy-board 통합 실행과 Thymeleaf admin/viewer **2/2** 로그인 PASS |
| CLI | 소스에서 npx 6개 명령 실행 PASS. 추가 프로그램 xlsx 작성 및 TC 36건 실제 실행(PASS 29·BLOCKED 3·SKIP 4). 최종 tarball을 빈 디렉터리에서 **오프라인 npx**로 실행하고 full 추적·structure-only의 TC 실행 거부 PASS |
| 설치 | Codex·Claude repo 설치 파일 각각 5개 PASS. 실제 새 세션 로딩/자동 활성화와 구별 |
| 이전 비교기 호환 | 보존된 기존 trace 8건의 이전/현재 비교 결과 **8/8 동일**. 새 수집·일반화 평가가 아님 |

Windows, Node 22, JDK 17, Maven 3.9 및 설치 Chrome/Edge에서 확인했다. Java target 8과 Java 8 JVM 실측은 구별한다. 이 통합은 합성 결함 한 건의 동작 검증이며 일반화 성능이나 현장 검수를 뜻하지 않는다. 사용자 결과서 양식도 Claude가 만든 공공 SI 일반 형식으로, 형식 일반성 검증이다.

최종 CLI 검사에서 구조 모드가 TC run으로 진행하는 경로를 실패 테스트로 확인해 설정 읽기 전에 거부하도록 보정했다(해당 회귀 2/3→3/3). 전체 검사의 격리 실행은 임시 Git 쓰기/오프라인 npm 캐시 제약으로 2건 실패했으며 로그를 보존하고 기존 로컬 권한에서 195/195를 다시 확인했다. 통합 원시 결과와 이전 194건 로그도 보존했다.

공개 집계 근거는 [통합 검증](evidence/m6/integration-verification.json), [검증 요약](evidence/m6/checks.json), [패키지](evidence/m6/release-package.json), [식별자 검사](evidence/m6/privacy.json)에 있다. 상세 로그·결과서·DB는 무시된 run에 보존한다.

| 로컬 산출물 | 위치(저장소 기준) |
|---|---|
| 전체 manifest/보고/단계 조회 | `.sistack/runs/m6-req001-v2/{manifest.json,report.md,registry.json}` |
| JUnit 수정 전/후 JSON | `.sistack/runs/m6-req001-v2/evidence/unit-{red,green}/.sistack/runs/req001-unit-{red,green}/test-results.json` |
| 프로그램 목록 | `.sistack/runs/m6-req001-v2/evidence/fixed-project/.sistack/runs/req001-program/program-list.xlsx` |
| 화면 1차·2차 | `.sistack/runs/m6-req001-v2/req001-tc-{1,2}/functional-results.xlsx` |
| 요청·스크린샷·보존 DB | 각 TC run의 `evidence/{requests,screenshots,db}` |

JUnit JSON은 `schemas/test-results.schema.json`의 계약을 유지한다. 결과서는 해당 JSON의 실제 테스트 표시명/상태를 별도 시트에 대조하며 화면 TC의 PASS로 대신 쓰지 않는다. 생성/수정 데이터와 사본은 삭제하지 않았다.

### 결정

- 사용자 승인처럼 examples 소스는 그대로 두고 실행 사본에서만 파일 H2 datasource를 사용했다. 로그인 설정 샘플도 원본 테스트베드에 추가하지 않아 기존 동결 소스 해시와 평가 입력을 유지했다.
- `docs/evidence` 대용량 원본 12개(19,883,596바이트)는 `.release-assets/`로 이동했다. 식별자 포함 과거 증거 73개도 원본을 먼저 보관하고 공개 사본만 마스킹했다. 총 **85개, 21,305,153바이트** 원본의 SHA-256을 모두 대조했고 [해시 목록](evidence-assets.json)만 추적한다. 기존 첫 결과와 점수는 수정하지 않았다. 보관 폴더는 별도로 백업해야 한다.
- buffers@0.1.1 README에는 라이선스가 없어 고정 upstream package.json의 MIT/X11 선언을 확인했다. 설치 index.js와 같은 커밋의 원본 SHA-256도 일치한다. MIT로 기록해 전이 의존성 194개 중 미확인 0개다. [1차 출처](https://raw.githubusercontent.com/bitpay/node-buffers/1b745ee35d33eb166e15ef1866073a07c6d7de87/package.json), [확인 기록](buffers-license-verification.json). ExcelJS의 오랜 안정 릴리스 간격과 설치 시 전이 패키지 deprecation 경고는 남기며 승인 없는 버전 교체는 하지 않았다.
- 현재 추적 텍스트 1,419개의 경로·이메일·전화·주민번호·계좌 패턴 검사에서 0건이었다. 회사별 키워드는 제공되지 않아 특정 회사 식별자의 전수 탐지로 주장하지 않는다. 합성 키워드를 넣은 음성 대조에서 실제로 탐지됨도 확인했다.
- **과거 Git 커밋에는 마스킹 전 경로와 대용량 blob이 남아 있다.** 원시 결과/커밋 보존을 위해 이력을 재작성하지 않았다. 현재 tree·허용 목록 기반 로컬 패키지 검사와 이력 전체의 공개 적합성을 구별한다. push/공개 전에 이력 정리 또는 별도 정제 snapshot 배포 방식을 결정해야 한다.

### 남은 문제

v0.1의 확인된 한계 상위 5개다.

1. 실제 새 Codex/Claude 세션의 로딩·선택은 미관측이다. Codex 남은 자동 질문 2개와 Claude 로딩은 **BLOCKED**이며 [수동 절차](manual-checks.md)에 문항·판정·기록 필드를 남겼다.
2. 동적 링크·미확정 진입 등 통합 TC 3개는 BLOCKED다. 팝업은 두 테스트베드 실제 표본 0개라 감지/실행 미검증이다. 삭제/다운로드 4개는 승인된 SKIP 범위다.
3. 인덱서는 지원하는 정적 Java/SQL/템플릿 패턴만 해석한다. 공통 함수 호출자 목록도 동적 호출의 전수 목록이 아니다. 런타임/DDL을 모두 대조하는 정적 검증기는 아니다.
4. 로그인은 단순 동일 출처 폼/CSRF/리디렉션이다. SSO/MFA·복합 인증은 지원하지 않는다. 실측 OS/JVM 범위도 위 환경에 한정한다.
5. 제공 양식은 일반 형식이며 실제 고객 양식·Excel 전체 기능/재계산 보장을 뜻하지 않는다. 보존 미지원 요소는 경고/PARTIAL로 남긴다. 공개 전 Git 이력 정리와 비공개 보관 폴더 백업도 남아 있다.

v0.2 우선순위는 Service↔Mapper map 키 대조를 유지하고, 이번 결함처럼 SQL 참조 컬럼↔제공 DDL 대조를 그 다음 후보로 올렸다. 화면 기능 확대 전에 팝업 실표본·동적 진입 근거 검증을 우선한다. 모두 백로그 기록만 했으며 구현하지 않았다.

### 사용자 확인 필요

M6 종료 보고에서 멈춘다. 남은 수동 로딩 확인과 실무 일주일 사용 뒤 공개 여부 결정은 사용자 단계다. 일주일 동안 요청 문구·활성화 여부·선택된 스킬/분기·run-id·오답의 파일:라인·BLOCKED 사유·소요 시간·수동 보정 내용을 기록하면 된다. 회사명·계정 비밀값·실제 개인정보는 기록하지 않는다. 공개 이력 처리 방식은 실제 공개 작업 전에 별도로 결정해야 한다. 후속 마일스톤·v0.2는 시작하지 않는다.
