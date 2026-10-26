# M0 테스트베드 의존성 승인안

## GATE 재검토 변경안

- 승인됨: `com.fasterxml.jackson.core:jackson-databind:2.20.2`와 전이 core/annotations. Java 8 호환 JSON 응답 변환용, Apache-2.0. 테스트베드 pom에만 추가한다.
- 추가 승인 완료: `javax.annotation:javax.annotation-api:1.3.2` (CDDL-1.1 / GPL-2.0 with Classpath Exception). 요청한 `@Resource(name=...)` 주입을 JDK 11/17에서 사용하기 위한 API다. JDK 11부터 JDK에 포함되지 않아 테스트베드 pom에만 compile 스코프로 추가했다. Jakarta API는 사용하지 않는다.

상태: 2026-10-27 사용자 조건부 승인 반영 완료. Node 도구에는 외부 의존성이 없다.

M0에서 요청한 Java 테스트베드를 구성하기 위한 직접 의존성과 빌드 도구다. Java 의존성은 `examples/legacy-board/pom.xml`에만 추가한다. Maven은 이들의 전이 의존성도 내려받는다. 구형 SI 재현용이며 운영 배포 대상이 아니다.

| 구성 | 버전 | 라이선스 | 용도 |
|---|---|---|---|
| Spring spring-webmvc, spring-jdbc, spring-test | 5.3.39 | Apache-2.0 | XML MVC, DB, 통합 검증 |
| MyBatis | 3.5.19 | Apache-2.0 | Mapper XML·인터페이스 |
| mybatis-spring | 2.1.2 | Apache-2.0 | SqlSessionTemplate |
| javax.servlet-api | 4.0.1 | CDDL-1.1 / GPL-2.0 with Classpath Exception | 컨테이너 제공 API |
| javax.servlet:jstl | 1.2 | CDDL-1.0 / GPL-2.0 with Classpath Exception | JSP 출력·URL |
| jQuery 정적 파일 (Maven 의존성 아님) | 3.7.1 | MIT | webapp/resources/vendor에 보관 |
| H2 | 2.2.224 | MPL-2.0 / EPL-1.0 | test 스코프만, 메모리 DB·Oracle 모드 |
| JUnit | 4.13.2 | EPL-1.0 | 기존 테스트 |
| Mockito | 4.11.0 | MIT | Java 8 호환 모킹 |
| Maven compiler / surefire / war plugin | 3.13.0 / 3.2.5 / 3.4.0 | Apache-2.0 | release 8, 테스트, WAR |
| Jetty maven plugin | 9.4.57.v20241219 | Apache-2.0 / EPL-1.0 | 로컬 JSP 실행 |

승인 범위는 위 의존성 선언·다운로드와 localhost 테스트베드 실행이다. JDK/Maven의 시스템 설치나 운영 서버 접근은 포함하지 않는다. compiler release는 8이며 JDK 11·17을 사용한다. Jakarta·Mockito 5·mybatis-spring 3은 도입하지 않는다. EOL·CVE 경고를 문서화하며 버전을 자동으로 올리지 않는다.
