# 온마을 시설관리

공공기관의 시설 사용 신청·승인·관리를 수행하는 **독립 실행 가능한 SIStack 실습 프로젝트**다. 실제 기관이나 고객 데이터는 사용하지 않는다.

theHands의 신청 목록·상세·승인/반려와 Controller → Service → MyBatis XML 구조를 참고해 새 업무로 작성했다. 화면은 사용자가 선택한 Thymeleaf이며, 기존 SIStack 테스트베드의 Spring MVC 설정과 라이브러리를 재사용했다. theHands의 Spring Boot/Nuxt 프로젝트 복제본은 아니다.

## 바로 실행

이 폴더에서 실행한다. Node.js 22 이상, JDK 17 이상, Maven 3.9 및 기존 테스트베드에서 사용하는 Maven 캐시가 필요하다. 새 npm 의존성은 없으므로 `npm install`은 필요 없다.

```powershell
npm start
```

브라우저 주소: **http://127.0.0.1:8092/public-facility/auth/login**

설치 경로를 자동으로 찾지 못하면 아래 환경 변수를 설정한다. 자동 탐색은 `JAVA_HOME`, `MAVEN_HOME`/`SISTACK_MAVEN`, 사용자 `.jdks`·`.m2/wrapper/dists` 범위다.

```powershell
$env:JAVA_HOME = 'C:/사용자/JDK17설치경로'
$env:MAVEN_HOME = 'C:/도구/apache-maven-3.9.x'
npm start
```

일반 Maven이 PATH에 등록되어 있다면 `mvn -o jetty:run`도 가능하다. 실행기는 기존 캐시만 사용하는 오프라인 모드이며, 새 컴퓨터에서 캐시가 없다면 의존성 준비가 먼저 필요하다. 자동으로 다운로드하지 않는다.

종료는 실행 터미널에서 `Ctrl+C`. H2 메모리 DB는 서버를 종료하면 사라지고 다음 실행에서 합성 초기 데이터로 시작한다. 실행 중 검증으로 생성한 신청·이력은 삭제하지 않는다. 실제 데이터 보관 용도로 사용하지 않는다.

## 실습 계정

로그인 화면에서 선택한다. 비밀번호 없는 역할 선택은 이 로컬 실습 앱에만 적용된다.

| 계정 | 역할 | 가능한 업무 |
|---|---|---|
| applicant | 신청자 | 본인 신청 조회·등록·취소 |
| neighbor | 다른 신청자 | 다른 사람의 신청에 접근할 수 없는지 확인 |
| reviewer | 대관 담당자 | 전체 신청 조회·승인·반려 |
| admin | 시설 관리자 | 전체 심사 + 시설 운영 중지·재개 |

## 구현한 기능

- 업무 현황: 권한에 따른 전체·승인 대기·승인 완료 건수, 최근 신청
- 시설 안내: 4개 시설의 위치·정원·운영 상태
- 신청 관리: 시설명/사용 목적 검색, 상태 필터, 10건 단위 페이지
- 대관 신청: 날짜·시간·인원·사용 목적 입력, 서버 검증
- 중복 방지: 같은 시설의 접수/승인된 시간과 겹치는 신청 차단, 동시 요청 직렬화
- 승인/반려: 담당자만 심사, 반려 사유 필수, 중복 처리 차단
- 취소: 본인 접수/승인 신청만 취소, 취소 사유 필수
- 처리 이력: 신청·심사·취소 이력 저장, 상태 변경과 같은 트랜잭션
- 시설 운영: 관리자만 운영 상태 변경, 운영 중지 시 신규 신청/승인 차단
- 세션·CSRF: 본인 데이터 접근 제한, 변경 요청의 CSRF 검증

상세 업무 규칙과 후속 변경 요청은 [요구사항](docs/requirements.md), 스킬에 넣을 요청 문구는 [실습 안내](docs/skill-practice.md)에 있다.

## 검증

```powershell
npm test
```

Node의 `node:test`가 실제 Maven/JUnit 테스트를 실행한다. Node 래퍼 1건과 JUnit 업무 검증 13건을 별도로 집계한다. H2 데이터·Spring MVC 응답·Thymeleaf 렌더링·권한·동시 신청·트랜잭션 롤백을 검증한다.

서버가 실행 중인 상태에서 별도 터미널에서:

```powershell
npm run smoke
```

합성 계정 4개로 로그인하고 신청→승인→취소, 권한·중복 차단을 실제 HTTP로 검증한다. 날짜는 실행일부터 40일 후, 동아리 연습실 16:00~17:00이다. 같은 슬롯을 사용자가 먼저 예약했으면 충돌을 실패로 보고한다. 성공 시 취소 상태의 신청과 이력을 남기므로 다음 실행에서 시간대가 다시 열린다.

## 구조

```text
src/main/java/kr/sistack/facility/
  web/       Controller, 세션·CSRF 인터셉터, 예외 화면
  service/   업무 규칙과 트랜잭션
  mapper/    MyBatis 인터페이스
  domain/    시설·신청·이력·현재 사용자
src/main/resources/
  mapper/    동적 검색 SQL, 잠금·저장·상태 변경 SQL
  db/        schema.sql, 합성 data.sql
  spring/    서비스·MyBatis 설정
src/main/webapp/
  WEB-INF/templates/  7개 화면과 공통 조각
  WEB-INF/spring/     MVC·Thymeleaf 설정
  resources/         로컬 CSS
src/test/            JUnit 13건, 로컬 H2 설정
scripts/             실행·HTTP 검증 도구
docs/                요구사항·스킬 실습·결정·검증 보고
.sistack/            스킬 산출물과 로컬 화면 증거 (Git 제외)
```

JDK 17 소스, Spring MVC 5.3.39, MyBatis 3.5.19, Thymeleaf 3.1.5.RELEASE, H2 2.2.224, Jetty 9.4.57을 기존 테스트베드와 동일한 버전으로 사용한다. H2는 test scope이며 Jetty 실습 실행은 `useTestScope=true`다. WAR를 별도 WAS에 배포하는 구성은 제공하지 않는다.

실제 기관용 SSO/회원가입·외부 DB·파일 첨부·요금/결제·알림·시설 CRUD·팝업은 이번 범위에 포함하지 않았다. UI는 Thymeleaf 폼 제출 방식으로 구성했다. 생성한 정답으로 스킬 성능을 채점하지 않는다.
