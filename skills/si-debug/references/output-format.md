# 검토 파일 계약

prepare가 만든 `.sistack/runs/<run-id>/evidence/diagnosis.json`을 아래 형태로 작성한다. 원본 로그를 복사하지 않는다.

```json
{
  "source_reviewed": true,
  "symptom": "검색 요청에서 오류 발생",
  "candidates": [{
    "cause": "form.html:16 textarea name=contents — Board/InitBinder는 content",
    "identifiers": ["contents", "content"],
    "status": "UNRESOLVED",
    "level": 2,
    "locations": [{"file": "src/main/java/app/Controller.java", "line": 12}],
    "reason": "해당 분기와 설정을 확인한 근거, 반증이 아직 필요한 부분"
  }],
  "eliminated": ["후보 A를 소스/설정의 어느 조건으로 소거했는지"],
  "reproduction": {"executed": false, "note": "실행 환경 없음"},
  "proposal": {"diff": "", "note": "원인이 미확정이라 변경 제안 보류"},
  "same_pattern": ["확인 범위와 같은 원인의 다른 위치 또는 미확인 사유"],
  "verification": ["수정 후 실행할 테스트/입력/기대 결과"],
  "unverified": ["실제 실행과 활성 설정 미확인"],
  "next_actions": ["활성 설정과 재현 입력을 확보"]
}
```

증거 1은 주장, 2는 소스 위치 확인, 3은 실패 경로 소거, 4는 실제 코드 테스트, 5는 실제 앱 재현이다.
위치는 프로젝트 상대 경로·1부터 시작하는 라인이다. 프레임 줄은 증상 위치일 수 있으므로 원인 위치와 구분한다.
승인 eval 정답에는 enclosing(소속 메서드/요소 이름과 종류)이 필요하다. 삭제된 줄은 소속 구조의 승인된 `{file,start,end,enclosing}` 범위로 표현하고 실제 진단 line이 범위 안인지 비교한다. 진단 자체는 실제 확인한 구체적 line을 유지하며 정답 범위로 답안을 넓히지 않는다. 스킬의 일반 분석 출력과 승인 eval 정답은 서로 다른 계약이다.
재현 실행 시 reproduction에 command, artifact(`evidence/<파일>`)를 추가한다. artifact는 실제 실행 결과여야 하며 수동 작성 설명은 실행 증거가 아니다.
finish의 계약 검사는 실행의 진실성을 대신 검증하지 않는다. 에이전트가 명령과 실제 출력·실패 전후를 확인해야 한다.
실행 원본도 저장 전에 mask를 거친다. finish는 제출된 파일을 마스킹해 reproduction.txt로 저장하지만 이미 유출된 원본을 되돌리지는 않는다.
원인 문장은 실제 소스에서 대조한 식별자·값을 생략하지 않는다. identifiers의 각 문자열은 cause에 그대로 포함해야 하며 소스·로그 근거로 검토한다. 예를 들어 textarea의 contents와 바인딩 속성 content, SQL 별칭, Controller 모델 키와 템플릿 참조 키를 모두 쓴다. 이 검사는 문장에 값이 있다는 계약 검사이며 값의 진실성은 실제 소스 검토로 확인한다.
제안 diff는 기존 텍스트 파일에 적용 가능한 unified diff로 작성하며 원본에 적용하지 않는다. CONFIRMED와 LIKELY는 빈 diff를 허용하지 않는다. 모든 후보가 UNRESOLVED일 때만 빈 diff와 보류 이유를 허용한다.
사용자에게 주는 report.md에는 실제 식별자와 diff를 담는다. docs/의 공개 held-out 보고서만 위치·적중 여부와 수정안 정합성 결과로 제한한다. 비밀값·개인정보는 두 종류 모두 마스킹한다.
평가의 수정안 정합성은 진단 보존·위치 채점 후에만 실행한다. `node scripts/verify-debug-proposal.mjs <run-dir> <score.json> <training|held-out> <bug.patch|출제원본경로> <새결과.json>`은 저장된 진단/보고서 해시와 채점 기록을 검사한 뒤 임시 복사본만 수정한다. 학습은 결함 패치를 역적용한 복사본, held-out은 examples/의 출제 원본과 전체 파일을 비교한다. CRLF/LF만 정규화하고 다른 문자·파일 집합은 정확히 비교한다. 스크립트는 SIStack 개발 평가 도구이며 단독 설치 스킬의 실행 의존성이 아니다.
정합성은 PASS/FAIL/UNRESOLVED로 별도 보고한다. 빈 diff인 UNRESOLVED는 성공으로 세거나 제안이 있는 사례의 분모에 넣지 않는다. 정합성 PASS를 수정 후 기능·보안·런타임 검증으로 해석하지 않는다.
원인 하나를 CONFIRMED로 확정해도 미검증 범위는 비우지 않는다. 결과 재실행은 새 run-id를 사용한다.
