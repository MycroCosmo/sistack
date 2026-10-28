# M6 스킬 로딩·자동 활성화 수동 확인

> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

2026-10-29. 설치 파일/CLI 검증과 실제 새 세션의 스킬 선택은 다르다. 다음 실제 세션 항목은 이 작업에서 관측하지 못해 BLOCKED로 남긴다.

| 확인 | 상태 | 근거/멈춘 지점 |
|---|---|---|
| 과거 Codex si-trace 명시 호출 | PASS(이력) | 2026-10-27 사용자가 보고한 trace-list-explicit-20261027-01. 현재 버전 재호출로 주장하지 않음 |
| 과거 Codex 자동 질문 1 | PASS(이력) | 사용자 기록 trace-board-list-20261027. 기존 증거 유지 |
| Codex 자동 질문 2 | BLOCKED | 새 독립 세션에서 실제 선택/스크립트 실행을 관측하지 못함 |
| Codex 자동 질문 3 | BLOCKED | 새 독립 세션에서 실제 선택/복잡 분기를 관측하지 못함 |
| Codex 신규 나머지 스킬 실제 로딩/호출 | BLOCKED | 파일 설치만으로 로딩/활성화를 대신하지 않음 |
| Claude Code 실제 4개 스킬 로딩/호출 | BLOCKED | Claude Code 실제 세션 관측·호출을 수행하지 않음 |

## 설치와 실제 확인

1. npm ci --ignore-scripts 후 node scripts/install.mjs --target codex --scope repo를 실행한다. Claude는 --target claude다. 갱신은 충돌 목록을 확인한 뒤 --force를 지정한다. 실제 기능 4개와 설치 확인 si-example을 구별한다.
2. 해당 저장소에서 새 Codex/Claude Code 로컬 세션을 연다. Codex는 스킬 목록에서 네 이름/한국어 설명을 확인하고, Claude는 / 메뉴와 /si-trace 등 직접 호출을 확인한다. 모델의 설명만으로 성공 처리하지 않는다.
3. 각각 새 Codex 세션에서 아래 두 문항을 스킬 이름 없이 입력한다.
   - examples/legacy-board의 상세 화면에서 삭제 버튼을 누르면 뭐가 실행돼?
   - examples/legacy-board의 게시판 메뉴 전체 코드 흐름을 정리해 줘.
4. 사용한 SKILL.md 경로, 선택 여부, 실제 설치본 스크립트 호출, 분기, run-id, report/manifest 경로를 기록한다. 단순 CLI 실행이나 설명만은 활성화 PASS가 아니다. 삭제 기능 실행 자체를 요구하지 않는다.
5. 나머지 스킬은 README의 예시를 사용하되 실제 코드 변경/테스트/TC 실행은 승인된 로컬 사본·계정·차수를 지정한다. Claude Code에서 네 스킬이 로딩되고 지시가 적용되는지 직접 확인한다.
6. PASS는 실제 선택·소스 확인·산출물 생성을 관측했을 때만 기록한다. 미관측/정책/환경 부족은 BLOCKED, 선택했으나 필수 절차 누락은 FAIL이다. 원래 기록을 덮어쓰지 않고 새 실행으로 남긴다.

공식 경로 확인(2026-10-29): [Codex](https://learn.chatgpt.com/docs/build-skills), [Claude Code](https://code.claude.com/docs/en/skills). 저장소/사용자 디렉터리 경로는 설치기와 README를 따른다. 외부 서비스 연결·계정 로그인·다른 모델 실행을 자동으로 추가하지 않는다.
