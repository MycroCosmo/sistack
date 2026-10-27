# PetClinic 검색 — 확장 승인 정답

2026-10-27 사용자 검토에 따라 요청 매핑·Boot 기본 뷰·레이아웃·추가 링크·private helper 반환 뷰를 포함해 확정했다. [JSON](expected.json)이 근거·해시·scope 계약이다. 이전 [초안](expected.draft.md)은 검토 이력이다. CONFIRMED는 소스로 확인한 관계이며 현재 구현이 수집할 수 있는지와 무관하다.

공식 저장소 `https://github.com/spring-projects/spring-petclinic.git`의 커밋 `500158f732419217507c7656904b8e6aa1bcc0d6`을 `.testbeds/spring-petclinic/`에 고정한다. Java 17/Boot 4.1.0/Apache-2.0이며 소스 커밋·빌드·서버 실행은 하지 않는다.

## screen — 6개

| 출발 | 종류 | 도착 | 근거 |
|---|---|---|---|
| OwnerController#initFindForm | renders | templates/owners/findOwners.html | Controller:91, pom:56, application.properties:7, Application:28, 실제 템플릿 |
| templates/owners/findOwners.html | includes | templates/fragments/layout.html#layout | 화면:3 html 루트 th:replace의 인자, layout:3 선언 |
| templates/owners/findOwners.html | requests | GET /owners | 화면:9 form GET, :14 검색 입력, :25 submit |
| templates/owners/findOwners.html | requests | GET /owners/new | 화면:29 th:href |
| OwnerController#processFindForm | renders | templates/owners/findOwners.html | Controller:119, Boot 구성·실제 파일 |
| OwnerController#processFindForm | renders | templates/owners/ownersList.html | Controller:129 → private addPaginationModel:132 → 반환:138, Boot 구성·실제 파일 |

템플릿 경로는 소스 루트 아래 `src/main/resources/`를 생략해 표시했다. JSON에서는 전체 상대 경로다. `spring-boot-starter-thymeleaf`, `@SpringBootApplication`, application.properties 및 두 profile properties에 prefix/suffix 재정의가 없고 실제 파일이 존재함을 확인했다. WebConfiguration은 locale 설정이며 독자 view resolver/EnableWebMvc를 선언하지 않는다. [Spring Boot 공식 MVC 설명](https://docs.spring.io/spring-boot/how-to/spring-mvc.html)의 기본 `classpath:/templates/`와 `.html`을 적용해 세 renders를 CONFIRMED로 둔다. 외부 서버 override를 임의 가정해 상태를 낮추지 않는다.

## server — 3개

| 출발 | 종류 | 도착 | OwnerController 근거 |
|---|---|---|---|
| GET /owners/find | maps_to | initFindForm | :89–91 |
| GET /owners | maps_to | processFindForm | :94–96 |
| GET /owners/new | maps_to | initCreationForm | :72–74 |

검색 화면의 requests/includes, 세 endpoint의 maps_to, initFindForm/processFindForm의 renders를 scope로 고정한다. source/kind scope 안의 과탐도 비교하며 private helper를 거친 ownersList의 renders를 정답에서 제외하지 않는다.

## 보충 항목·범위 밖

processFindForm의 :113 `redirect:/owners`와 :125의 id 상세 redirect는 HTTP 이동 응답이다. 템플릿 renders 연결로 세지 않고 JSON supplemental_assertions에 남긴다. addPaginationModel 호출은 반환 뷰를 확인하는 근거이며 호출 자체는 채점하지 않는다.

**JPA Repository 메서드명·@Query·Entity·Table·SQL·DB는 구현·평가 모두 범위 밖**이다. Controller의 뷰 반환을 확인한 범위를 JPA 흐름 성공으로 표현하지 않는다. initCreationForm의 반환 뷰 등 추가 흐름은 승인 범위에 넣지 않는다. LICENSE.txt 해시는 provenance_files에 보존하고 eval source_files에는 인덱싱 지원 대상인 실제 근거 파일을 기록한다.

## 채점·동결

승인 JSON의 `report_group`으로 screen/server를 구분하고 각 승인 scope/edges를 그대로 투영해 동결 evalTrace로 별도 채점한다. 기본 비교기의 parity/screen enum과 구현을 수정하지 않는다. 합산 점수·임의 JSP parity는 만들지 않는다.

구현 `fd1b93c`·동결 도구 지문을 유지해 삭제 AJAX와 각각 첫 실행하고, 결과·실패 원본까지 보존한 뒤 수정 전 점수 GATE에서 멈춘다. 소스 재수집은 [동결 기록의 안전한 절차](../../../docs/evidence/m2.5-heldout/README.md)를 따른다.
