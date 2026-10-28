# SIStack 0.1.0

한국 SI 개발자의 코드 추적·오류 분석·서버 테스트·엑셀 산출물 작성을 돕는 Agent Skills와 로컬 CLI입니다. 기존 동작을 보존하고 파일:라인·실행 증거·미확인을 함께 기록합니다.

| 스킬 | 예시 요청 |
|---|---|
| si-trace | “이 JSP 검색 버튼에서 SQL까지 흐름을 찾아 줘.” |
| si-debug | “이 로그의 원인 후보를 소스로 확인하고 수정안을 제시해 줘.” |
| si-unit-test | “서비스와 Mapper의 경계·분기·저장 컬럼 테스트를 만들어 줘.” |
| si-docs | “프로그램 목록과 화면 TC 결과서를 이 양식으로 작성해 줘.” |

## 설치

Node.js >=18과 Git이 필요합니다. 화면 TC 실행만 Node >=20·이미 설치된 Chrome/Edge가 필요합니다. ExcelJS 4.4.0과 playwright-core 1.64.1을 고정하며 브라우저는 다운로드하지 않습니다.

```sh
npm ci --ignore-scripts
node scripts/install.mjs --target codex --scope repo
node scripts/install.mjs --target claude --scope repo
```

사용자 범위는 `--scope user`입니다. 기존 설치 갱신은 충돌 목록 확인 후 `--force`를 지정합니다. 실제 기능 스킬 4개와 설치 확인용 si-example이 함께 설치됩니다. 스킬은 각각 독립 설치할 수 있습니다.

[Codex 공식 설치 위치](https://learn.chatgpt.com/docs/build-skills)는 `.agents/skills`·`~/.agents/skills`, [Claude Code 공식 위치](https://code.claude.com/docs/en/skills)는 `.claude/skills`·`~/.claude/skills`입니다. 설치 파일 검증은 새 세션의 실제 로딩/자동 활성화 검증과 다릅니다. [수동 확인과 BLOCKED 항목](docs/manual-checks.md)을 따릅니다.

## AI 없는 CLI

```sh
npx --offline --no-install sistack trace examples/legacy-board --from /board/list.do --mode no-ai
npx --offline --no-install sistack debug-parse <로그파일> --mode full
npx --offline --no-install sistack unit-plan <프로젝트> --mode structure-only
npx --offline --no-install sistack docs program-list <프로젝트> --out <새JSON>
npx --offline --no-install sistack docs table-spec <프로젝트> --sources <DDL목록JSON> --out <새JSON>
npx --offline --no-install sistack docs tc plan <프로젝트> <새계획JSON>
```

세 모드 모두 외부 AI 호출·API 키가 필요 없습니다. `full`은 전체 근거/후보와 읽기용 보고, `structure-only`는 구조·확정 간선, `no-ai`는 상세 결정적 추출 JSON과 검토 필요 항목을 출력합니다. `full`도 원인이나 업무 의미를 자동 확정하지 않습니다. 기본은 `no-ai`입니다. [전체 CLI·xlsx 작성·실행 설정](docs/cli.md), [로그인 설정](docs/auth.md)을 참고하세요.

프로그램/테이블 작성은 `--mapping <승인매핑JSON> --run-id <새ID>`를 추가합니다. TC 실행은 아래처럼 명시한 승인·차수·계정·도구 경로·양식/M4 근거를 가진 설정이 필요합니다.

```sh
npx --offline --no-install sistack docs tc run <프로젝트> <계획JSON> <실행설정JSON> <새run-id>
```

## 3분 읽기 예시

저장소에서 첫 번째 trace 명령을 실행하면 HTTP 매핑 → Controller → Service → Mapper/SQL 연결과 미확정을 확인할 수 있습니다. 변경이나 DB 실행은 하지 않습니다. 이후 `$si-trace`, `$si-debug`, `$si-unit-test`, `$si-docs`로 검토/실행을 요청하면 `.sistack/runs/<run-id>/`의 manifest·보고서·증거를 이어갑니다.

Java/Spring MVC·Boot, JSP/JSTL/jQuery·Thymeleaf, MyBatis/iBatis, Maven/Gradle 관련 선언을 제한된 정적 규칙으로 분석합니다. 선언 수집과 실제 런타임 지원 범위는 다릅니다. [한계](docs/limitations.md)를 확인하세요.

## 보안과 검수

기본은 읽기 전용입니다. 운영 DB·배포 서버 접근, 원본 덮어쓰기·자동 반영, 코드/로그의 외부 전송을 하지 않습니다. 테스트 실행과 수정은 승인된 로컬 사본에서 수행합니다. 비밀번호는 환경 변수 참조만 허용하며 파일·로그·결과서에 쓰지 않습니다. 삭제/다운로드는 SKIP, 근거·선택자가 부족하면 BLOCKED입니다. 생성/수정 자료와 DB/덤프를 보존하고 1차 결과를 덮어쓰지 않습니다. AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

공개 트리의 과거 증거는 마스킹 사본이며 원본은 무결성 해시와 함께 로컬 `.release-assets/`에 분리했습니다. [해시 목록](docs/evidence-assets.json)을 사용합니다. Git 과거 이력은 재작성하지 않았으므로 공개 저장소로 push하기 전에 별도 이력 검토가 필요합니다. `evals/private`, `.sistack`, `.testbeds`, `.release-assets`는 배포하지 않습니다.

## pstack과의 관계

[pstack](https://github.com/backnotprop/pstack)의 MIT 원칙을 한국 SI에 맞게 재해석했습니다. 문서가 검수 산출물인 환경, 기존 동작 보존, 사람 승인, 단일 모델, 재현이 막힐 때의 증거 한계를 우선합니다. [채택/변형/미채택 표](docs/pstack-mapping.md)와 [NOTICE](NOTICE)를 봅니다. 복제나 번역 스킬 모음이 아닙니다.

## 검증·기여

`npm test`로 전체 회귀를 실행합니다. 실제 앱/JDK/브라우저 검증은 별도 실행 증거로 구분합니다. [CONTRIBUTING](CONTRIBUTING.md), [CHANGELOG](CHANGELOG.md)를 따릅니다. v0.1은 회사 현장 검증 완료를 뜻하지 않으며 M6 종료 보고의 BLOCKED 범위를 확인해야 합니다.
