# 기여 방법

1. AGENTS.md와 해당 prompts/Mx.md를 확인한다. 범위·승인 지점과 기존 결과 보존을 우선한다.
2. 새 프레임워크/DB/로그 패턴은 작은 합성 fixture와 실패 회귀부터 추가하고 파일:라인·미지원 상태를 보존한다. 실제 회사 식별자/코드/로그는 evals/private에만 두고 커밋하지 않는다.
3. eval 정답은 사람이 승인한 것만 expected.json으로 확정한다. 에이전트 초안은 expected.draft.*로 두며 점수를 고치기 위해 정답을 바꾸지 않는다. 첫 결과와 보정 결과는 새 run으로 분리한다.
4. scripts/sync-shared.mjs로 독립 스킬 사본을 갱신하고 npm test를 통과시킨다. 새 의존성은 버전·라이선스·이유를 제시해 승인받는다. Node >=18, tc만 >=20, Python은 사용하지 않는다.
5. 실사용 검증은 테스트 환경·표본·PASS/FAIL/BLOCKED·직접 관측한 증거를 적는다. 도구가 실제 스킬을 선택했는지와 CLI가 실행됐는지를 혼동하지 않는다.
6. 공개 전 scripts/scan-release.mjs와 docs/evidence-assets.json의 무결성을 확인한다. 원본은 .release-assets에 보존하고 공개 사본은 마스킹한다. 승인된 정답·기존 점수·원본 양식을 덮어쓰지 않는다.

커밋 제목은 Conventional Commits + 한국어 설명이다. 자동 push·패키지 배포·Git 이력 재작성은 하지 않는다. 공급망/라이선스 근거는 원출처와 고정 해시를 기록한다.
