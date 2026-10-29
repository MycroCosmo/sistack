# SIStack 스킬 실습 안내

현재 SIStack 저장소 채팅에서 아래 요청을 하나씩 사용하면 된다. 분석 대상은 항상 `examples/public-facility`로 명시한다. 다른 프로젝트로 이 폴더를 복사했다면 대상 경로를 바꾼다. 새 프로젝트 채팅에서는 SIStack 스킬 설치·인식 여부를 먼저 확인한다.

## 1. 흐름 파악 — si-trace

```text
$si-trace examples/public-facility의 시설 사용 신청 화면에서
'신청 접수'를 누르면 어떤 Controller·Service·Mapper·SQL을 거치는지 추적해 줘.
세션의 신청자 결정, CSRF, 중복 시간 검사, 신청과 이력 저장을 구분하고
각 연결에 파일:라인 근거와 CONFIRMED/LIKELY/UNRESOLVED를 남겨 줘.
```

다음 실습은 신청 상세의 승인/반려 또는 `booking_history`에 쓰는 호출자 역추적이다. 검색 결과만으로 확정하거나 인덱서가 놓친 분기를 없다고 판단하지 않는다.

## 2. 증상 분석 — si-debug

```text
$si-debug examples/public-facility에서 시설 정원보다 많은 인원으로 신청하면
저장이 거부돼. 현재 요구사항과 소스를 대조해 정상적인 제한인지 결함인지 분석해 줘.
소스는 수정하지 말고 입력 검증과 DB 저장까지의 경로를 설명해 줘.
```

이 증상은 현재 요구사항상 정상 검증이다. 오류처럼 보이는 현상을 무조건 패치하는지 확인하는 실습이다. 실제 결함 수정 실습을 하고 싶으면 **별도 사본의 경로와 허용할 변경**을 먼저 지정한다. 정상본에 오류를 주입하거나 승인 정답 파일을 자동 생성하지 않는다.

## 3. 테스트 작성 — si-unit-test

```text
$si-unit-test examples/public-facility의 FacilityService에서
중복 신청과 승인·반려·취소를 검증하는 기존 테스트를 검토해 줘.
요구사항 대비 빠진 경계를 찾아 중복되지 않는 테스트를 제안해 줘.
추가 테스트는 먼저 별도 산출물로 만들고 적용 전에 변경 범위를 보여 줘.
```

추가 테스트를 승인한 뒤에는 `npm test`를 실행하고 JUnit 보고서를 확인한다. Node 래퍼 통과를 JUnit 개별 검증과 중복 집계하지 않는다. 현재 테스트 파일은 `src/test/java/kr/sistack/facility/FacilityFlowTest.java`다.

## 4. 산출물 작성 — si-docs

```text
$si-docs examples/public-facility의 소스와 src/main/resources/db/schema.sql을 기준으로
프로그램 목록과 테이블 정의서를 만들어 줘.
기본 양식과 매핑을 먼저 제시하고, 미확인 업무명·ID는 추측해서 채우지 마.
```

화면 TC 결과서는 프로그램/테이블 문서와 별도 작업이다. 실행 시 계정·차수·실행 환경·데이터 보존 조건을 구체적으로 제공한다. 이 앱은 종료하면 사라지는 메모리 DB이므로, **si-docs TC 실행에 필요한 DB 보존 조건을 그대로 만족한다고 가정하면 안 된다.** 파일 DB 실행 사본 등의 준비가 먼저 필요하며 이번 작업에서는 TC 실행이나 xlsx 채우기를 완료했다고 주장하지 않는다.

## CLI 구조 추출만 빠르게 확인

SIStack 저장소 루트에서 아래 명령을 실행한다. 설치된 스킬의 소스 검토·최종 보고와 CLI의 결정적 추출은 서로 다른 단계다.

```powershell
node bin/sistack.mjs trace examples/public-facility --from /bookings --mode structure-only --run-id facility-practice-01
node bin/sistack.mjs unit-plan examples/public-facility --mode structure-only --out examples/public-facility/.sistack/unit-practice-01.json
node bin/sistack.mjs docs program-list examples/public-facility --mode structure-only --out examples/public-facility/.sistack/program-practice-01.json
```

기존 run-id와 출력 경로는 재사용하지 않는다. 첫 실행 확인은 `.sistack/runs/facility-trace-first/`, `.sistack/unit-plan.json`, `.sistack/program-list.json`에 보존했다. 화면 소스 줄 정리 후의 현재 결과는 `.sistack/runs/facility-trace-readable/`, `.sistack/unit-plan-readable.json`, `.sistack/program-list-readable.json`이다. 추출 결과는 `PARTIAL`이며, 4개 스킬의 전체 평가나 정확도 점수가 아니다.
