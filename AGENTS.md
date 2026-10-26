# SIStack — 에이전트 작업 규칙

이 파일은 이 저장소에서 작업하는 모든 코딩 에이전트(Codex, Claude Code 등)가 매 세션 따라야 하는 공통 규칙이다. 마일스톤별 작업 지시는 `prompts/Mx.md`에 있다.

## 1. 프로젝트 정의

SIStack은 **한국 SI(System Integration) 현장의 개발자가 AI 코딩 도구로 반복 업무를 처리하도록 돕는 Agent Skills 모음**이다.

- 대상: 이제 막 AI 도구를 도입한 한국 SI 회사의 개발자
- 기반: pstack(https://github.com/backnotprop/pstack, MIT)의 원칙과 스킬 구조를 **한국 SI 환경에 맞게 재해석**한다. 복제·번역이 아니다.
- v0.1 스킬 4개:

| 스킬 | 하는 일 | pstack 대응 |
|---|---|---|
| `si-trace` | 화면 이벤트 → Controller → Service → Mapper → SQL·테이블 흐름 파악 | `how` |
| `si-debug` | 에러·오동작의 원인 분석과 수정안 | bug-fix 플레이북, `principle-fix-root-causes` |
| `si-unit-test` | 레거시 Java 프로젝트에 단위 테스트 작성·실행 | `tdd`, `principle-test-behavior-not-implementation` |
| `si-docs` | 코드·테스트 결과로 SI 산출물(xlsx) 작성 | 대응 없음 (SI 고유) |

v0.2 이후: `si-impact`(← `blast-radius`), `si-migrate`. **v0.1에서 구현하지 않는다.**

## 2. pstack을 SI에 맞게 바꾸는 원칙

pstack의 일부 전제는 한국 SI와 정반대다. 아래 표가 SIStack 설계의 기준이다.

| pstack 전제 | 한국 SI 현실 | SIStack 원칙 |
|---|---|---|
| 최고의 스펙은 코드, 문서 최소화 | 문서가 계약 산출물, 검수가 문서로 진행 | 코드에서 산출물을 뽑아내는 것을 핵심 기능으로 둔다 |
| 레거시 API는 이관과 동시에 삭제 | 기존 동작 보존, 병행 운영, 단계 이관 | 기존 동작을 기준선으로 고정하고 보존한다 |
| 사람을 기다리지 않는다 | PL 승인, 형상관리, 반영 절차 | 읽기·분석은 묻지 않고 진행, 코드·설정 변경과 반영은 승인 지점을 둔다 |
| 다중 모델 비교 | 회사가 허용한 도구 하나 | 단일 모델 기준으로 설계한다 |
| 로컬 재현·실행 증명 | DB 접근 제한, 개발 서버 의존, 망분리 | 로그·스택트레이스 기반 분석을 기본으로, 재현 못 하면 멈춘 단계를 기록한다 |

그대로 유지하는 pstack 원칙:

- **build-the-lever**: 반복 분석은 재실행 가능한 스크립트로 만든다.
- **prove-it-works**: "컴파일된다", "그럴듯하다"로 완료를 선언하지 않는다.
- **guard-the-context-window**: 대량 탐색은 서브에이전트에 맡기고 요약만 받는다.
- **test-behavior-not-implementation**: 구현이 망가져도 통과하는 테스트는 쓰지 않는다.
- **explain-the-number**: 수치를 보고할 때 표본 크기와 한계를 같이 적는다.
- **encode-lessons-in-structure**: 반복되는 실수는 문서가 아니라 스크립트·검증·eval로 고정한다.

구현 중 pstack 원문을 참고해야 하면 해당 `SKILL.md`를 직접 읽는다. 문장이나 구조를 실제로 가져오면 `NOTICE`에 출처를 남긴다.

## 3. 증거 단계와 상태

스킬이 내놓는 핵심 주장에는 도달한 증거 단계를 표시한다.

1. 주장만 함 — 단독으로는 근거가 아니다.
2. 위치를 가리킴 — 실제 `파일:라인`
3. 실패 경로를 소거함 — 문제 경우를 단계별로 따라가 도달하지 않음을 보임
4. 실행해서 증명함 — 실제 코드를 호출하는 테스트·스크립트를 실행
5. 실제 앱에서 재현함

4~5단계가 막히면 억지로 올리지 말고 **어디서, 왜 멈췄는지** 적는다.

연결 관계에는 `CONFIRMED`(2단계 이상) / `LIKELY`(추정, 이유 기록) / `UNRESOLVED`(확정 불가, 이유 기록)를 붙인다. 문자열 검색 결과만으로 CONFIRMED를 붙이지 않는다.

실행 결과 상태:

- `PASS` — 선언한 범위를 실제로 검증해 통과
- `FAIL` — 확인된 결함·실패 존재
- `PARTIAL` — 일부만 확인, 또는 근거 부족
- `BLOCKED` — 필요한 정보·환경·권한 부족

AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아니다. 모든 `report.md` 상단에 이를 명시한다.

## 4. 공통 산출물 계약

스킬 실행 결과는 대상 프로젝트의 다음 위치에 남는다.

```text
.sistack/
├── index/index.json          # 공통 인덱서 결과
└── runs/<run-id>/
    ├── manifest.json         # schemas/manifest.schema.json 준수
    ├── report.md
    └── evidence/
```

manifest 필수 필드: `schema_version`, `run_id`, `skill`, `created_at`, `source_revision`, `status`, `inputs`, `evidence`, `unverified`, `next_actions`

선택 필드(스킬 간 연결·향후 PL/PM 연계): `request_id`, `requirement_ids`, `parent_run_ids`

`parent_run_ids`로 스킬 결과를 잇는다 (예: `si-debug` 결과를 `si-unit-test`가 이어받음).

## 5. 기술 규칙

### 언어와 의존성

- 스크립트는 **Node.js 18 이상**으로 작성한다. **Python은 사용하지 않는다.**
- 외부 의존성은 최소화한다. 추가할 때는 라이선스와 이유를 `docs/decisions.md`에 기록한다.
- 테스트는 `node:test`를 쓴다. `npm test` 하나로 전체 검증이 돌아야 한다.

### 스킬 형식

- Agent Skills 명세(https://agentskills.io/specification)를 따른다.
- 원본은 `skills/<name>/`에 둔다. 폴더명 = frontmatter `name`.
- `description`은 한국어로 쓰고, 실제 사용자가 칠 법한 한국어 요청 문구를 활성화 조건으로 포함한다.
- `SKILL.md` 본문은 300줄 이하로 유지하고, 상세 규칙은 `references/`로 분리한다.
- 각 스킬은 **단독 설치로 동작**해야 한다. 공통 코드(`lib/`)는 `scripts/sync-shared.mjs`로 각 스킬의 `scripts/`에 복사하고, 테스트에서 복사본이 원본과 같은지 검사한다.

### 설치 경로

- Codex: 저장소 `.agents/skills/` 또는 사용자 `~/.agents/skills/`
- Claude Code: 저장소 `.claude/skills/` 또는 사용자 `~/.claude/skills/`
- `scripts/install.mjs`가 대상 경로로 복사한다. 경로가 바뀌었을 수 있으니 구현 전에 각 공식 문서를 확인한다.

### 대상 기술 환경

Java 8/11/17/21, Spring MVC/Boot(어노테이션·XML 설정), JSP/JSTL/jQuery, MyBatis·iBatis 2, Oracle/PostgreSQL/Tibero, Maven/Gradle.
버전을 가정하지 말고 대상 프로젝트의 설정 파일에서 판단한다. 기술별 판단 규칙은 `references/`에 기술별 파일로 나눈다 (향후 Nexacro, Vue 확장 대비).

## 6. 보안 규칙 (예외 없음)

- 스킬의 기본 동작은 읽기 전용이다.
- 운영 DB 접속·변경 금지. 테스트 DB도 사용자가 명시한 경우에만 SELECT 위주로 사용한다.
- 배포·운영 서버 접근 금지.
- 비밀키·비밀번호·개인정보(주민번호, 전화번호, 이메일, 계좌 등)를 로그·산출물에 출력하지 않는다. `lib/mask`로 마스킹한다.
- 분석 대상 코드나 로그를 외부 API·공개 저장소로 보내지 않는다.
- `evals/private/`는 사용자의 실제 사례용이다. `.gitignore`에 포함하고, 내용을 커밋·인용·출력하지 않는다.

## 7. 작업 방식

### 마일스톤 단위로 일한다

- 지시받은 `prompts/Mx.md` 하나만 수행한다. 다른 마일스톤의 기능을 미리 만들지 않는다.
- 시작할 때: `git status` 확인 → `MILESTONES.md`에서 선행 마일스톤의 완료 기준이 충족됐는지 확인 → 미충족이면 멈추고 보고한다.
- 작업은 검증 가능한 작은 단위로 나누고, 단위마다 커밋한다. 커밋 제목은 Conventional Commits 형식(`feat:`, `test:`, `docs:` 등) + 한국어 설명.
- `git push`, 태그 푸시, 원격 저장소 생성은 하지 않는다.

### 멈출 때와 진행할 때

- 프롬프트의 `[GATE]` 지점에서는 반드시 멈추고 보고한다. 사용자가 승인하기 전에는 넘어가지 않는다.
- 다음 경우에도 멈추고 승인을 받는다: 파일 삭제·덮어쓰기, 의존성 추가, 범위 밖 변경, 외부 서비스에 쓰기.
- 그 외의 되돌리기 쉬운 결정은 해석을 밝히고 진행한다. 사소한 확인을 요청하지 않는다.
- 이 멈춤 규칙은 **SIStack 개발 작업**에 대한 것이다. 완성된 스킬이 사용자 프로젝트에서 실행될 때의 규칙은 각 `SKILL.md`에 정의한다.

### 검증

- 실행하지 않은 테스트를 성공으로 보고하지 않는다.
- JDK, Maven, 네트워크 등 환경이 없어 못 한 검증은 BLOCKED로 보고하고, 사용자가 직접 실행할 명령을 남긴다.
- eval 정답(`evals/**/expected*`)은 사용자가 승인한 것만 정답으로 쓴다. 에이전트가 만든 초안은 `expected.draft.*`로 둔다.
- 테스트베드 코드에 정답 힌트(주석 등)를 남기지 않는다. 정답은 `evals/`에만 둔다.

## 8. 보고 형식

마일스톤 종료 또는 GATE에서 다음 형식으로 보고한다.

```markdown
### 한 일
작성·변경한 파일과 기능

### 검증
실행한 명령과 결과 (성공/실패/미실행, 수치는 표본 크기와 함께)

### 결정
무엇을 왜 골랐는지 (docs/decisions.md에도 기록)

### 남은 문제
제한 사항, 처리 못 한 패턴, BLOCKED 항목

### 사용자 확인 필요
승인·검토가 필요한 항목 (GATE면 검토할 파일 경로 명시)
```
