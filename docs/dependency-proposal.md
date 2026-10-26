# M0 테스트베드 의존성 승인안

상태: 승인 대기. Node 도구에는 외부 의존성이 없다.

M0에서 요청한 Java 테스트베드를 구성하기 위한 직접 의존성과 빌드 도구다. 승인 시 아래 고정 버전을 `examples/legacy-board/pom.xml`에 추가한다. Maven은 이들의 전이 의존성도 내려받는다. 구형 SI 재현용이며 운영 배포 대상이 아니다.

| 구성 | 버전 | 라이선스 | 용도 |
|---|---|---|---|
| Spring spring-webmvc, spring-jdbc, spring-test | 5.3.39 | Apache-2.0 | XML MVC, DB, 통합 검증 |
| MyBatis | 3.5.19 | Apache-2.0 | Mapper XML·인터페이스 |
| mybatis-spring | 2.1.2 | Apache-2.0 | SqlSessionTemplate |
| javax.servlet-api | 4.0.1 | CDDL-1.1 / GPL-2.0 with Classpath Exception | 컨테이너 제공 API |
| javax.servlet:jstl | 1.2 | CDDL-1.0 / GPL-2.0 with Classpath Exception | JSP 출력·URL |
| org.webjars:jquery | 3.7.1 | MIT | CDN 없이 jQuery 사용 |
| H2 | 2.2.224 | MPL-2.0 / EPL-1.0 | 로컬 메모리 DB, Oracle 모드 |
| JUnit | 4.13.2 | EPL-1.0 | 기존 테스트 |
| Mockito | 4.11.0 | MIT | Java 8 호환 모킹 |
| Maven compiler / surefire / war plugin | 3.13.0 / 3.2.5 / 3.4.0 | Apache-2.0 | release 8, 테스트, WAR |
| Jetty maven plugin | 9.4.57.v20241219 | Apache-2.0 / EPL-1.0 | 로컬 JSP 실행 |

승인 범위는 위 의존성 선언·다운로드와 localhost 테스트베드 실행이다. JDK/Maven의 시스템 설치나 운영 서버 접근은 포함하지 않는다.
