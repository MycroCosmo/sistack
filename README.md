# SIStack

한국 SI 개발자의 코드 흐름 파악·에러 분석·테스트·산출물 작성을 돕는 Agent Skills 모음입니다.

**개발 상태: M0~M5a 완료, M5b 선행조건 GATE.** 프로그램 행 선정 v2와 제공 일반 양식의 형식 일반성 검증을 완료했습니다. 현장 검증을 뜻하지 않습니다. M5b는 계정 ID·수행 차수 확인 전 구현/실행하지 않습니다. [M5a v2 보고](docs/m5a-selection-v2-report.md) · [M5b 선행 확인](docs/m5b-preflight-report.md) · [인덱서 사용법](docs/indexer.md)

| v0.1 예정 스킬 | 역할 | 구현 시점 |
|---|---|---|
| si-trace | 화면 이벤트부터 SQL·테이블까지 흐름 파악 | M2 완료, 활성화 2문항 미실행 |
| si-debug | 로그·증상에서 원인과 수정안 도출 | M3 완료 |
| si-unit-test | 레거시 Java 단위 테스트 작성·실행 | M4 완료 |
| si-docs | 코드 근거로 프로그램 목록·테이블 정의서 xlsx 작성 | M5a v2 완료, M5b 실행 선행조건 GATE |

[pstack](https://github.com/backnotprop/pstack)의 원칙·스킬 구조를 한국 SI 현장에 맞게 재해석합니다. 단일 모델, 기존 동작 보존, PL 승인 지점, 코드 기반 문서 산출물과 재현하지 못한 단계의 기록을 우선합니다.

## 개발·검증

Node.js 18 이상과 Git이 필요합니다. M5a는 ExcelJS 4.4.0을 사용합니다. 승인된 playwright-core 1.64.1은 M5b용이며 Node >=20이 필요합니다. M5a는 이를 불러오지 않습니다. 브라우저를 다운로드하지 않습니다.

```sh
npm ci --ignore-scripts
node scripts/fetch-testbed.mjs egovframe
npm test
node scripts/validate-manifest.mjs <manifest.json>
node scripts/validate-skills.mjs
node scripts/sync-shared.mjs --check
```

npm test는 정답의 소스 해시·근거 라인도 검사합니다. 미승인 초안은 DRAFT_SOURCES_VALID로 구별하며 채점하지 않습니다. 첫 실행 전 위 fetch-testbed 명령으로 고정 eGovFrame 소스를 준비하세요. 소스가 없으면 검사를 건너뛰지 않고 BLOCKED로 종료합니다.

Windows PowerShell에서 실행 정책 때문에 npm.ps1이 차단되면 `npm.cmd test`를 사용합니다. 임시 Git 저장소 쓰기를 막는 샌드박스에서는 테스트 실행 권한이 필요합니다.

## 스킬 설치·사용

```sh
node scripts/install.mjs --target codex --scope repo
node scripts/install.mjs --target claude --scope user
node scripts/install.mjs --target codex --scope repo --dest .tmp/install-check
```

Codex는 저장소 `.agents/skills/` 또는 사용자 `~/.agents/skills/`, Claude Code는 `.claude/skills/` 또는 `~/.claude/skills/`에 설치합니다. `--dest`는 최종 스킬 상위 폴더를 지정합니다. 기존 경로를 먼저 나열하고 중단하며, 검토 후 `--force`를 주면 같은 파일을 덮어씁니다.

설치 확인용 si-example과 si-trace, si-debug, si-unit-test, si-docs가 설치됩니다. si-docs는 설치된 스킬 폴더에서 별도로 `npm ci --ignore-scripts`를 실행해 자체 lock 의존성을 준비합니다. 새 Codex 세션에서 `$si-trace examples/legacy-board의 /board/list.do 흐름을 추적해 줘`로 사용합니다. 산출물은 대상 프로젝트 `.sistack/runs/<run-id>/`에 남습니다. 활성화 수동 확인은 [절차](docs/manual-checks.md)를 참고하세요.

## 테스트베드

`examples/legacy-board`는 **의도적으로 구버전을 쓰는 테스트베드이며 운영 용도가 아님**을 명시합니다. Spring 5.3 등의 EOL·CVE 경고가 예상되며 승인된 버전을 유지합니다. 합성 데이터와 localhost만 사용합니다.

```sh
cd examples/legacy-board
# JAVA_HOME을 JDK 11 또는 17로 설정
mvn -q test
mvn -q package
mvn jetty:run
# 다른 터미널에서
node smoke.mjs
```

브라우저 주소는 `http://127.0.0.1:8080/legacy-board/auth/login.do`입니다. H2는 test 스코프이며 Jetty 로컬 실행만 테스트 클래스패스를 사용합니다. 실제 DB·운영 서버는 필요하지 않습니다.

[테스트베드 기능·URL·클래스 목록](examples/README.md), [함정 목록](evals/legacy-board-traps.md), [설계 결정·출처](docs/decisions.md), [한계](docs/limitations.md)를 참고하세요. AI의 PASS는 PL/PM 승인이나 고객 검수 완료를 뜻하지 않습니다.

MIT 라이선스입니다. 제3자 출처는 [NOTICE](NOTICE)에 기록합니다.
