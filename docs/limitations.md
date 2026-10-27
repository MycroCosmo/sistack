# 지원 범위와 한계

- M0는 설치·검증 기반과 합성 테스트베드를 제공한다. M1 인덱서·질의·eval CLI를 추가했으나 정답 초안 승인 전이며, 네 업무 스킬은 미구현이다.
- 스킬 검증기는 전체 YAML 파서가 아니다. 저장소에서 쓰는 문자열·블록·metadata 맵만 지원하며 앵커·태그·배열과 제품별 확장 필드는 거부한다. 참조 검사는 공백 없는 `references/`·`scripts/` 상대 경로만 지원한다. 본문 경로에 공백·동적 치환을 쓰지 않는다.
- manifest 검증은 스키마에 선언된 자료형·필수 필드·열거값·범위·날짜·중복 등을 확인한다. 증거의 진실성이나 CONFIRMED 판단을 자동 보증하지 않는다. `source_revision: null`이면 unverified에 이유를 기록해야 한다.
- 마스킹은 패턴 기반이다. 긴 숫자 ID를 계좌로 오인할 수 있고, 라벨 없는 짧은 계좌번호·이름·주소·인코딩/분할된 비밀값은 놓칠 수 있다. 실제 로그 외부 전송을 허용하는 보안 경계로 쓰지 않는다. 산출물 저장 전 마스킹 결과를 검토한다.
- 스킬 설치는 심볼릭 링크를 지원하지 않는다. 기존 스킬 폴더는 --force 없이는 건드리지 않는다. --force는 같은 이름의 파일만 덮어쓰며 사용자 전용 파일을 삭제하지 않는다. 쓰기 도중 디스크 오류가 발생하면 부분 설치가 남을 수 있다.
- 공통 모듈 동기화는 지정된 mask 모듈만 복사한다. 원본에 없는 복사본 파일은 자동 삭제하지 않고 검토를 요구한다.
- Java 테스트베드는 Java 8 소스 수준의 구형 SI 재현용이다. EOL 라이브러리를 의도적으로 고정하므로 운영에 사용하지 않는다. localhost·합성 데이터만 사용한다.

## M1 — 정적 분석의 한계

- **현재 확인된 누락:** extends와 implements가 함께 있는 eGovFrame 서비스 선언의 부모 타입 구분이 불완전하다. 이번 초안 3개 메뉴에서 Controller 호출이 구현체 대신 인터페이스 선언에서 멈춘다. 초안 승인 후 수정·회귀 검증 대상으로 남긴다.
- **조건부 JSP:** 게시글 등록의 `${board.id == 0 ? ... : ...}`와 `fn:escapeXml(saveUrl)` 값 전파는 미지원이다. 요청을 UNRESOLVED로 표시하며 등록 분기의 정답 상태는 사용자 검토가 필요하다.
- Java는 단일 최상위 타입·일반 메서드·필드 주입, 단순 constructor/setter 필드 대입 패턴을 수집한다. 내부 타입, overload 인자 타입, wildcard import, 복잡한 generic/record/lambda/동적 프록시, Spring profile/조건부 빈 선택, 필드 shadowing의 완전한 타입 분석은 지원하지 않는다. 이름 후보 하나가 실제 런타임 빈이라는 뜻은 아니다.
- Spring은 클래스/메서드 매핑의 리터럴 경로·배열·HTTP method와 일부 XML handler mapping을 지원한다. params/headers/consumes/produces, 패턴 URL의 실제 요청 매칭, interceptor 우선순위·exclude 적용·세션 값 전파는 완전히 해석하지 않는다. 설정과 request 속성의 읽기/쓰기 위치만 남긴다.
- JS는 열거된 jQuery/fetch/location/form 호출의 제한된 구문만 다룬다. 임의 변수 값 전파, 모듈 import, 함수 반환 URL, 정규식 리터럴·템플릿 표현식·복잡한 event 위임은 완전한 JS AST 분석이 아니다. 모든 미지원 문법이 skipped로 탐지되는 것은 아니다. form.submit의 앞선 action 추적은 단순 구문만 지원한다.
- JSP include와 JS 파일 포함은 소스 관계다. 함수/handler의 includes 연결은 소속 관계이며 그 함수가 실제로 실행됐다는 증거가 아니다. scriptlet Java를 해석하지 않고 외부/벤더 JS를 내려받거나 실행하지 않는다.
- MyBatis/iBatis namespace·statement·include·resultMap 연결을 수집하지만 동적 SQL 분기·resultMap 중첩 association/collection·provider 생성 SQL·map 값 전파를 완전히 해석하지 않는다. `${}` 위치는 표시하되 허용 목록 검증 성공으로 간주하지 않는다. iBatis 2는 합성 fixture 검증이며 실제 eGovFrame 실행 증거가 아니다.
- SQL은 정적 객체 참조를 수집한다. CTE 별칭의 제한된 제외와 단순 콤마 JOIN을 지원하지만 복합 CTE/서브쿼리 별칭/DB 전용 문법/동적 프로시저 내부 SQL의 완전한 해석은 아니다. DDL 선언이 없는 FROM/JOIN 객체의 table-or-view 구분은 미확정이다. JDBC의 동적 테이블명은 UNRESOLVED다.
- 같은 sqlId가 DB별로 중복될 때 활성 설정을 추정하지 않는다. 모든 후보를 LIKELY로 남긴다. 목록의 CONFIRMED는 제한된 소스 관계 확인이며, DB 접근·실제 실행·보안 보증·승인 완료를 의미하지 않는다.
- `.git`, `.sistack`, `.testbeds`, 빌드/도구 폴더, `src/test`, `evals/private`, 심볼릭 링크, vendor/minified JS는 제외한다. 2 MiB 초과 파일과 UTF-8이 아닌 파일도 제외한다. 따라서 전체 인덱싱 완료는 전체 트리를 순회하고 제외 사유를 기록했다는 의미다.
- 동일 연결은 묶고 근거 위치를 8개까지만 저장한다. `evidence_truncated: true`면 추가 위치가 있다. 파일별 줄 위치는 파서가 보존한 위치이며 모든 위치의 의미를 검수한 것은 아니다. 대규모 통계에 초기 데이터 SQL도 포함된다.
- validateIndex는 그래프 참조·위치·상태·이유의 필수 불변조건을 검사한다. 범용 JSON Schema 엔진이 아니다. 스키마 파일은 별도 소비자가 사용할 계약이다.
- draft 비교는 기대 연결의 누락·범위 내 과탐·상태 불일치를 분리한다. 사용자 승인 전 정확도 점수나 통과 판정으로 보고하지 않는다. source_revision이 바뀌어도 근거 파일 해시가 모두 같으면 비교를 허용하지만 범위 밖 환경 변경의 영향을 보증하지 않는다.

실제 eGovFrame 처리 수·skipped 분포와 초안 차이는 [M1 GATE 보고](m1-report.md)를 따른다.
