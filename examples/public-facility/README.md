# 온마을 시설관리

가상 공공기관의 시설 사용 신청·승인·관리 실습 프로젝트다. 기존 구현을 삭제한 뒤 theHands의 업무 계층을 `si-trace`로 분석하고, 새 코드를 작성하면서 `si-unit-test`, `si-debug`, `si-docs`를 실제 실행했다. 실행 결과와 자동화 한계는 [스킬 실행 기록](docs/skill-execution-report.md)에 구분했다.

## 실행

Node.js 18 이상, JDK 17 이상, Maven 3.9가 필요하다. 이 PC에서는 기존 Maven 저장소의 의존성을 사용한다. `npm install`은 필요 없다.

```powershell
cd examples/public-facility
npm start
```

접속: http://127.0.0.1:8092/public-facility/login

`JAVA_HOME`, `MAVEN_HOME` 또는 `SISTACK_MAVEN`으로 경로를 지정할 수 있다. 미지정 시 사용자 `.jdks`와 `.m2/wrapper/dists`를 탐색한다. 기본 실행은 Maven 오프라인 모드다. 다른 PC에 의존성이 없으면 승인된 환경에서 `mvn jetty:run`으로 의존성을 먼저 준비해야 한다.

| 계정 | 역할 | 가능한 업무 |
|---|---|---|
| applicant | 신청자 | 신청, 본인 목록·상세·이력, 본인 취소 |
| neighbor | 다른 신청자 | 동일 역할, applicant 신청 접근 불가 |
| reviewer | 대관 담당자 | 전체 신청 조회, 승인·반려 |
| admin | 시설 관리자 | 담당자 업무, 시설 운영 중지·재개 |

비밀번호 없는 합성 계정을 선택하는 로컬 실습 앱이다. 실제 기관 인증·운영 배포용 구성이 아니다. 서버는 127.0.0.1에만 바인딩한다.

## 기능과 업무 규칙

- 시설 안내, 업무 현황, 신청·상세·검색·10건 단위 페이징을 제공한다.
- 내일부터 90일 이내, 09:00~18:00 중 최대 4시간, 정원 이내 인원만 신청할 수 있다.
- 동일 시설의 접수·승인 일정은 겹칠 수 없다. 종료 시각과 다음 시작 시각이 같은 일정은 허용한다.
- 담당자는 접수 건을 승인·반려한다. 신청자는 본인의 접수·승인 건을 취소한다. 반려·취소에는 사유가 필요하다.
- 사용 당일부터 상태를 바꿀 수 없다. 이미 처리된 건을 다시 승인할 수 없다.
- 운영 중지 시설은 신규 신청·승인이 차단된다. 기존 승인과 처리 이력은 보존한다.
- 신청과 이력 저장은 하나의 트랜잭션이다. 시설 행 잠금으로 같은 시설의 동시 중복 신청을 제어한다.
- 세션에서 역할을 결정하고 변경 요청에 CSRF 토큰을 검증한다. HTML 출력은 Thymeleaf 이스케이프를 사용한다.

## 저장소와 소스

Spring MVC + MyBatis + Thymeleaf이며 Java 소스 수준은 17이다. 참고 프로젝트의 Spring Boot·Nuxt 구성을 그대로 복제하지 않고 기존 SIStack Thymeleaf 예제의 실행 환경을 재사용했다.

- `src/main/java/.../web`: HTTP 입력, 세션, 화면, 오류 응답
- `src/main/java/.../service`: 조회 권한과 업무 상태 전이
- `src/main/resources/mapper`: 실제 MyBatis SQL
- `src/main/webapp/WEB-INF/templates`: 화면 7개와 공통 조각
- `src/test/resources/db`: 시설·신청·이력 테이블 DDL과 합성 시설 초기값
- `src/test/java`: 서비스 단위 테스트 11건, H2 연동 테스트 8건

로컬 데이터는 `.sistack/data/facility.mv.db`에 저장되며 서버 재시작으로 지워지지 않는다. 초기화 스크립트는 없는 테이블과 시설만 추가한다. 테스트는 매번 별도 메모리 H2를 사용하므로 이 파일을 바꾸지 않는다. DB를 초기화하려면 먼저 서버를 종료하고 해당 파일을 별도 위치로 백업한 뒤 새로 시작한다.

## 검증 재실행

```powershell
npm test
# 실행 중인 로컬 앱에 합성 신청 1건을 만들고 취소하는 HTTP 검증
node scripts/smoke.mjs
# 위 검증 후 서버를 재시작한 다음 데이터 보존 확인
node scripts/smoke.mjs --verify-persistence
```

`npm test`는 설치된 **si-unit-test 공식 실행기**를 호출하고 JUnit 19건의 표준 결과를 확인한다. `.agents/skills`를 자동 탐색하며 필요하면 `SISTACK_SKILLS`를 스킬 부모 폴더로 지정한다. 스킬 없이 Java 테스트만 실행하려면 `mvn -o test`를 사용한다.

`.sistack/runs/<run-id>/`에 manifest·report·근거가 남는다. 로컬 DB, 실행 로그, 작업 결과는 Git에서 제외한다. 이 프로젝트는 전체 SIStack 루트 테스트와 별도로 위 명령으로 검증한다.

## 산출물

- [프로그램 목록](.sistack/runs/facility-programs-01/program-list.xlsx): 23행
- [테이블 정의서](.sistack/runs/facility-tables-01/table-spec.xlsx): 3개 테이블, 22개 컬럼
- [스킬 실행 기록과 한계](docs/skill-execution-report.md)

두 엑셀은 사용자가 승인한 기본 양식과 매핑으로 작성했다. 미확인 프로그램 ID·업무명·컬럼 한글명은 임의로 채우지 않아 결과 상태는 PARTIAL이다. 위 로컬 산출물 링크는 이번 실행 환경에서 유효하며 Git 복제본에는 포함되지 않는다.
