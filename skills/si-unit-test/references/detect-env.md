# 환경 탐지

단일 Maven POM에서 직접 선언한 의존성과 properties를 확인한다. Java release/source/target, JUnit·Mockito·spring-test·H2 버전과 test scope를 보고한다. 부모 POM, profile, multi-module, Gradle은 현재 자동 실행 범위 밖이며 BLOCKED로 남겨 effective 설정 확인을 요청한다. 버전을 추측하지 않는다.

M4 실행 범위는 기존 JUnit 4·Mockito 4·spring-test·H2(test)다. POM 변경이 필요하면 이유와 변경안을 제시하고 멈춘다. Maven 실행은 offline(`-o`)이므로 캐시 부족을 의존성 다운로드로 우회하지 않는다. 실제 실행 JDK와 POM target을 구분한다.
