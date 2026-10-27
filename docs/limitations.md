# 지원 범위와 한계

- M0·M1을 완료했고 M2 si-trace 공통 구현과 학습 평가를 수행했다. held-out 승인·첫 평가와 하네스 활성화는 남아 있다. si-debug/si-unit-test/si-docs는 미구현이다.
- 스킬 검증기는 전체 YAML 파서가 아니다. 저장소에서 쓰는 문자열·블록·metadata 맵만 지원하며 앵커·태그·배열과 제품별 확장 필드는 거부한다. 참조 검사는 공백 없는 `references/`·`scripts/` 상대 경로만 지원한다. 본문 경로에 공백·동적 치환을 쓰지 않는다.
- manifest 검증은 스키마에 선언된 자료형·필수 필드·열거값·범위·날짜·중복 등을 확인한다. 증거의 진실성이나 CONFIRMED 판단을 자동 보증하지 않는다. `source_revision: null`이면 unverified에 이유를 기록해야 한다.
- 마스킹은 패턴 기반이다. 긴 숫자 ID를 계좌로 오인할 수 있고, 라벨 없는 짧은 계좌번호·이름·주소·인코딩/분할된 비밀값은 놓칠 수 있다. 실제 로그 외부 전송을 허용하는 보안 경계로 쓰지 않는다. 산출물 저장 전 마스킹 결과를 검토한다.
- 스킬 설치는 심볼릭 링크를 지원하지 않는다. 기존 스킬 폴더는 --force 없이는 건드리지 않는다. --force는 같은 이름의 파일만 덮어쓰며 사용자 전용 파일을 삭제하지 않는다. 쓰기 도중 디스크 오류가 발생하면 부분 설치가 남을 수 있다.
- 공통 모듈 동기화는 지정된 모듈을 복사한다. si-trace에는 mask/indexer/trace/manifest와 스키마를 포함한다. 원본에 없는 복사본 파일은 자동 삭제하지 않고 검토를 요구한다.
- Java 테스트베드는 Java 8 소스 수준의 구형 SI 재현용이다. EOL 라이브러리를 의도적으로 고정하므로 운영에 사용하지 않는다. localhost·합성 데이터만 사용한다.

## M1 — 정적 분석의 한계

- **조건부 JSP:** c:url 변수와 fn:escapeXml, 단순 리터럴 삼항식의 두 요청을 해석한다. 중첩 삼항식·동적 분기·실제 조건의 참/거짓은 해석하지 않는다.
- Java는 단일 최상위 타입·일반 메서드·필드 주입, 단순 constructor/setter 필드 대입 패턴을 수집한다. 내부 타입, overload 인자 타입, wildcard import, 복잡한 generic/record/lambda/동적 프록시, Spring profile/조건부 빈 선택, 필드 shadowing의 완전한 타입 분석은 지원하지 않는다. 이름 후보 하나가 실제 런타임 빈이라는 뜻은 아니다.
- Spring은 클래스/메서드 매핑의 리터럴 경로·배열·HTTP method와 일부 XML handler mapping을 지원한다. params/headers/consumes/produces, 패턴 URL의 실제 요청 매칭, interceptor 우선순위·세션 값 전파는 완전히 해석하지 않는다. 리터럴 interceptor 포함·제외 Ant 경로는 endpoint에 적용하지만 동적 경로·URI 템플릿·교차 XML 빈 참조와 런타임 순서는 미지원이다.
- JS는 열거된 jQuery/fetch/location/form 호출의 제한된 구문만 다룬다. 임의 변수 값 전파, 모듈 import, 함수 반환 URL, 정규식 리터럴·템플릿 표현식·복잡한 event 위임은 완전한 JS AST 분석이 아니다. 모든 미지원 문법이 skipped로 탐지되는 것은 아니다. form.submit의 앞선 action 추적은 단순 구문만 지원한다.
- JSP include와 JS 파일 포함은 소스 관계다. 함수/handler의 includes 연결은 소속 관계이며 그 함수가 실제로 실행됐다는 증거가 아니다. scriptlet Java를 해석하지 않고 외부/벤더 JS를 내려받거나 실행하지 않는다.
- MyBatis/iBatis namespace·statement·include·resultMap 연결을 수집하지만 동적 SQL 분기·resultMap 중첩 association/collection·provider 생성 SQL·map 값 전파를 완전히 해석하지 않는다. `${}` 위치는 표시하되 허용 목록 검증 성공으로 간주하지 않는다. iBatis 2는 합성 fixture 검증이며 실제 eGovFrame 실행 증거가 아니다.
- SQL은 정적 객체 참조를 수집한다. CTE 별칭의 제한된 제외와 단순 콤마 JOIN을 지원하지만 복합 CTE/서브쿼리 별칭/DB 전용 문법/동적 프로시저 내부 SQL의 완전한 해석은 아니다. DDL 선언이 없는 FROM/JOIN 객체의 table-or-view 구분은 미확정이다. JDBC의 동적 테이블명은 UNRESOLVED다.
- SqlSessionFactoryBean 하나의 mapperLocations와 classpath properties 설정으로 선택된 DB XML은 CONFIRMED로 연결한다. factory가 여러 개이거나 프로퍼티/위치가 미해결·중복이면 LIKELY다. Java 설정·환경변수/서버 override·profiles의 활성 컨텍스트·임의 리소스 루트·properties escape/continuation/복잡한 우선순위는 지원하지 않는다. 현재 판단은 소스에 선언된 기본 구성 기준이다.
- `.git`, `.sistack`, `.testbeds`, 빌드/도구 폴더, `src/test`, `evals/private`, 심볼릭 링크, vendor/minified JS는 제외한다. 2 MiB 초과 파일과 UTF-8이 아닌 파일도 제외한다. 따라서 전체 인덱싱 완료는 전체 트리를 순회하고 제외 사유를 기록했다는 의미다.
- 동일 연결은 묶고 근거 위치를 8개까지만 저장한다. `evidence_truncated: true`면 추가 위치가 있다. 파일별 줄 위치는 파서가 보존한 위치이며 모든 위치의 의미를 검수한 것은 아니다. 대규모 통계에 초기 데이터 SQL도 포함된다.
- validateIndex는 그래프 참조·위치·상태·이유의 필수 불변조건을 검사한다. 범용 JSON Schema 엔진이 아니다. 스키마 파일은 별도 소비자가 사용할 계약이다.
- draft 비교는 기대 연결의 누락·범위 내 과탐·상태 불일치를 분리한다. 사용자 승인 전 정확도 점수나 통과 판정으로 보고하지 않는다. source_revision이 바뀌어도 근거 파일 해시가 모두 같으면 비교를 허용하지만 범위 밖 환경 변경의 영향을 보증하지 않는다.

승인 정답과 현재 소스의 모든 해시·근거 라인은 check-expected로 검사한다. 파일 변경 시 자동 정답 갱신 없이 실패한다. 이 검사는 라인에 적힌 주장의 의미나 범위 밖 설정 변경을 검수하지 않는다.

최종 처리 수·skipped 분포·승인 eval은 [M1 종료 보고](m1-final-report.md), 승인 전 기록은 [GATE 보고](m1-report.md)를 따른다.

## M2 — 스킬 검토와 평가의 한계

- 소스 검토는 에이전트가 수행한다. finish의 해시·라인·검토 파일 목록 검사는 근거의 존재를 확인하며 주장 의미의 진실성을 자동 보증하지 않는다.
- prepare는 매번 전체 인덱스를 다시 만든다. 부분 질의의 비선택 DB 후보 ID는 질의 내부 노드로 제한하며 전체 후보는 원본 전체 인덱스에 남는다.
- 기본 security profile과 dummy interceptor, 중첩 JSP 태그의 href는 학습 실행에서 소스로 보완했다. M1 파서의 일반 규칙은 고치지 않았으므로 같은 검토가 다른 사례에도 필요할 수 있다.
- report의 includes는 파일/함수 소속 관계다. 공통 스크립트가 포함됐다는 이유만으로 모든 이벤트 실행을 주장하지 않는다.
- M1에서 수정에 쓴 5건의 55개 연결 일치는 학습 평가다. 사용자 지정 held-out은 아직 미승인 초안이며 점수는 없다. 자기 적용 평가의 편향과 비교 scope 밖 연결은 별도로 남는다.
- forward/redirect, 응답 view, 외부 라이브러리 경계와 역방향 호출 JSP 집합은 held-out 보충 정답에 있다. 기존 연결 비교만으로 이 항목까지 통과했다고 보고할 수 없다.
- 설치본 CLI를 실행한 사실은 Codex 스킬 활성화 증거가 아니다. 새 세션 명시 호출·한국어 3문항 확인은 [수동 절차](manual-checks.md)의 BLOCKED 항목이다.
