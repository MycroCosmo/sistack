# pstack 원칙과 SIStack

pstack(MIT)을 한국 SI에 맞게 재해석하며 차용 출처는 NOTICE에 남긴다.

| 원칙/스킬 | 판정 | SIStack 적용/이유 |
|---|---|---|
| how | 변형 | si-trace: 화면·서버·SQL과 파일:라인, 숨은 경로·미확정을 함께 기록 |
| fix-root-causes | 채택 | si-debug: 증상 재현·후보 소거 후 수정안. 공통 Java 메서드는 다른 호출자 및 국소/공통 diff, 국소 기본 추천 |
| test-behavior-not-implementation / tdd | 변형 | si-unit-test: 승인된 레거시 의존성에서 실패 전/통과 후, SQL 분기·저장 컬럼·경계 검증 |
| 문서 최소화 | 미채택 | si-docs: 프로그램 목록·테이블 정의·화면 TC 결과서가 검수 산출물 |
| 레거시 즉시 삭제 | 미채택 | 정상 기준선·첫 점수·1차·DB·기존 동작 보존 |
| 사람을 기다리지 않음 | 변형 | 읽기는 진행, 변경·실행·반영에 명시 승인 경계 |
| 다중 모델 비교 | 미채택 | 단일 도구/모델, 역할별 순차 근거 확인 가능 |
| build-the-lever | 채택 | 인덱서·생성기·CLI·재실행/검증 스크립트 |
| prove-it-works | 채택 | 소스 의미·실행·앱 관측을 구분, 못 한 단계는 BLOCKED |
| guard-the-context-window | 변형 | 필요한 파일/근거만 읽고 요약. 병렬 에이전트는 사용자 승인 시에만 |
| explain-the-number | 채택 | 분모·학습/held-out·일반화 한계를 분리 |
| encode-lessons-in-structure | 채택 | 실패 회귀·스키마·해시·출력 보존 제약 |
| blast-radius / si-impact, si-migrate | v0.2 | v0.1에서 구현하지 않음 |

CLI의 no-ai는 AI를 호출하지 않는 결정적 추출이다. 스킬의 사람/에이전트 검토를 대체하거나 PL/PM 승인을 자동화한다는 뜻이 아니다.
