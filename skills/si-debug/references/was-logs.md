# WAS 로그 확보

| WAS | 후보 위치·형식 | 확인 절차 |
|---|---|---|
| Tomcat | CATALINA_BASE/logs, logging.properties, 앱 logback/log4j 설정; catalina/localhost/access 로그 | 실행 인스턴스 CATALINA_BASE와 logging 설정을 확인. catalina.out은 실행 방식에 따라 없을 수 있음 |
| JEUS | 도메인/서버별 로그 디렉터리, 서버 로그와 앱 로그 분리 | JEUS 버전·도메인 설정의 실제 log 경로와 rotation 규칙 요청. 고정 경로 추정 금지 |
| WebLogic | DOMAIN_HOME/servers/<server>/logs 후보, 서버·도메인·앱 로그 | 해당 managed server의 로그 설정·파일명·로테이션을 확인. admin 로그만으로 앱 실패 부재 단정 금지 |

timestamp·thread·request correlation으로 같은 요청을 묶되 여러 스택이 섞이면 분리한다. 멀티라인 예외의 Caused by/Suppressed/생략 프레임을 보존한다.
현재 parser는 표준 Java 스택 줄을 지원한다. WAS가 모든 줄에 접두사를 붙이거나 JSON으로 감싸면 원본 형식을 유지한 채 마스킹한 사본을 별도로 정규화하고 변환 규칙을 기록한다. 지원하지 않는 줄을 원인 없음으로 해석하지 않는다.
사용자에게 오류 전후 최소 구간과 버전·배포 revision만 요청한다. 원본 로그·쿠키·Authorization을 외부로 보내지 않는다.
