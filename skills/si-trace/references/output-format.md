# 실행 산출물

prepare가 `.sistack/runs/<run-id>/`에 manifest.json(PARTIAL 또는 BLOCKED), draft-report.md,
evidence/index-query.json, evidence/stage.json을 만든다. 골격은 최종 답이 아니다.

에이전트는 직접 원문을 확인한 뒤 다음 두 파일을 같은 evidence 폴더에 작성한다.

## trace.json

index-query.json의 meta를 그대로 보존한다. nodes·edges·unresolved·skipped·roots·frontier를 포함한다.
소스 확인으로 고친 연결만 변경하고 이유와 파일:라인을 유지한다. LIKELY/UNRESOLVED에는 reason이 필수다.
추가 노드는 기존 노드와 같은 id/kind/name/file/line/details 구조를 사용한다. 실제 선언이 없으면 unknown으로 표시한다.
모든 근거 파일은 meta.source_files에 있는 원본이어야 한다. 인덱싱 제외 파일에서 근거를 찾았다면
이를 미검증 항목에 적고 자동 확정하지 않는다. 임의로 source_files 해시를 바꾸지 않는다.
depth 경계에서 남은 frontier를 삭제해 완전한 추적으로 꾸미지 않는다.

## review.json

```json
{
  "source_reviewed": true,
  "checked_files": ["src/main/java/example/Controller.java"],
  "overview": ["기능 설명 첫 문장.", "범위와 결과 설명."],
  "flow": ["요청부터 DB까지 실제 흐름을 설명한다."],
  "traps": [{"text": "확인한 함정", "evidence": [{"file": "src/main/java/example/Controller.java", "line": 10}]}],
  "hidden_paths": [
    {"category": "interceptor", "status": "UNRESOLVED", "note": "확인한 범위와 남은 의문", "evidence": []},
    {"category": "filter", "status": "NOT_FOUND", "note": "web.xml과 해당 패키지에서 확인한 범위", "evidence": []},
    {"category": "aop", "status": "NOT_FOUND", "note": "설정과 어노테이션 탐색 범위", "evidence": []},
    {"category": "paging", "status": "NOT_FOUND", "note": "이번 상세 요청에는 목록 페이징 없음", "evidence": []},
    {"category": "common-code", "status": "UNRESOLVED", "note": "별도 요청의 연결 근거 미확인", "evidence": []},
    {"category": "exception", "status": "UNRESOLVED", "note": "공통 예외 응답 매핑 확인 필요", "evidence": []}
  ],
  "unverified": ["실제 앱/DB 실행은 확인하지 않았다."],
  "next_actions": ["미확정 항목을 담당자에게 확인한다."],
  "execution": {"mode": "simple", "strategy": "direct", "note": "주 에이전트가 원문 확인"}
}
```

checked_files에는 실제 읽은 파일만 적는다. 모든 trace 노드·연결·함정·숨은 경로 근거 파일을 포함한다.
hidden_paths는 6종 모두 포함한다. 확인한 항목은 CONFIRMED + 근거, 미발견은 NOT_FOUND + 탐색 범위,
확정 불가는 UNRESOLVED + 이유다. 없는 항목을 빈 근거로 CONFIRMED 처리하지 않는다.

complex execution은 strategy를 parallel 또는 sequential로 하고 explorers를 추가한다.
`[{"role":"screen","path":"evidence/explorer-screen.md"}, {"role":"server","path":"evidence/explorer-server.md"}, {"role":"sql","path":"evidence/explorer-sql.md"}]`
각 파일은 실제 탐색 결과다. 실제 병렬 실행 없이 parallel이라고 기록하지 않는다.

finish는 report.md와 최종 manifest.json을 만든다. 원문과 결과를 다시 읽어 검사한다.
원문 존재·해시 검증이 주장 내용의 진실성을 자동 보증하지 않는다. 자동 생성 표만으로 충분하지 않으며
overview/flow에 목적·데이터 이동·분기 조건을 직접 설명해야 한다.

최종 보고는 개요 → 동작 흐름(트리·Mermaid) → 파일 위치 → 연결 근거 → 테이블 → 함정 → 숨은 경로 → 미확정 순서다.
정적 분석의 연결 근거는 증거 2단계. 인덱서/검사기 실행 4단계를 앱 동작 4~5단계로 바꾸지 않는다.
