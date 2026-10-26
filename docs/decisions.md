# 설계 결정

## 2026-10-27 — M0 공식 문서 확인

- [Agent Skills 명세](https://agentskills.io/specification): name은 1~64자 소문자·숫자·하이픈, 앞뒤 및 연속 하이픈 금지, 디렉터리명과 일치. description은 1~1024자. 선택 필드는 license, compatibility(500자), metadata, allowed-tools. SIStack은 본문 300줄 제한을 추가한다.
- M0의 `_example`은 name 규칙에 어긋나므로 `skills/si-example/`로 대체한다. 기능 없는 설치 검증용 예제이며 네 제품 스킬은 M2~M5에서 만든다.
- [Codex 공식 문서](https://developers.openai.com/codex/skills)는 확인 당시 [Build skills](https://learn.chatgpt.com/docs/build-skills)로 이동한다. 저장소 `.agents/skills/`, 사용자 `~/.agents/skills/`를 사용한다. 이름으로 명시 호출하거나 설명에 맞춰 자동 선택한다. `agents/openai.yaml`은 선택 UI 메타데이터·호출 정책·도구 의존성 설정이다.
- [Claude Code 공식 문서](https://code.claude.com/docs/en/skills): 저장소 `.claude/skills/`, 사용자 `~/.claude/skills/`, `/skill-name` 호출. argument-hint, disable-model-invocation, user-invocable, model, context, agent, hooks 등 확장이 있으나 공통 배포 원본에는 표준 필드만 사용한다.
- [pstack README](https://github.com/backnotprop/pstack), [how 원문](https://github.com/backnotprop/pstack/blob/main/skills/how/SKILL.md): 스킬별 폴더와 짧은 지침·상세 참조 분리 구조를 참고한다. SIStack은 단일 모델, 승인 절차, 문서 산출물, 실행 불가 기록을 우선한다. M0에서 how 워크플로를 실행하지 않는다.

## M0 구현 범위

- Node.js 18+ 표준 라이브러리와 node:test만 사용한다. npm 외부 의존성은 추가하지 않는다.
- manifest 검증기는 저장소 스키마가 사용하는 JSON Schema 키워드만 지원하고, 미지원 키워드는 오류로 처리한다. 범용 JSON Schema 엔진을 구현하지 않는다.
- 스킬 frontmatter는 저장소에서 사용하는 YAML 부분집합(문자열, 접힌/리터럴 블록, metadata 문자열 맵)을 검증한다. 지원하지 않는 YAML 문법은 성공으로 처리하지 않는다. 범용 YAML 라이브러리는 이후 필요 시 승인받는다.
- 설치는 전체 충돌 목록을 먼저 보여주고 `--force` 없이 쓰지 않는다. 심볼릭 링크는 복사·동기화 대상에서 거부한다.
- 공통 모듈은 `lib/mask/`만 각 예제/제품 스킬의 `scripts/lib/mask/`에 복사한다. 복사본을 독립 경로에서 실행해 단독 설치를 확인한다.
- Git 메타데이터가 없는 시작 폴더이므로 로컬 `git init`을 수행한다. 기존 지시 문서는 보존하고 원격은 만들지 않는다.
- Java 테스트베드 의존성은 별도 [승인안](dependency-proposal.md)에 명시한다. 승인 전 실제 pom 의존성은 추가하지 않는다.
