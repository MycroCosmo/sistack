# PetClinic 소유주 검색 — 정답 승인 GATE

상태: **DRAFT / 미채점**. CONFIRMED는 파일:라인에서 확인한 정적 연결이며 실제 실행이나 정답 승인이 아니다. 범위·근거·파일 해시는 [JSON](expected.draft.json)에 있다.

- 공식 저장소: https://github.com/spring-projects/spring-petclinic.git
- 고정 커밋: `500158f732419217507c7656904b8e6aa1bcc0d6`
- 로컬 루트: `.testbeds/spring-petclinic/` (소스 커밋 금지)
- 라이선스: Apache-2.0 (`LICENSE.txt`, `pom.xml:317`)
- 기술 선언: Java 17 (`pom.xml:19`), Spring Boot 4.1.0 (`pom.xml:8`), Thymeleaf starter (`pom.xml:56`). JPA starter 선언은 있지만 JPA 분석은 범위 밖이다.

구현 동결 후 클론해 origin·HEAD·깨끗한 작업 트리와 gitignore를 확인했다. 원문으로만 작성했고 인덱서·질의·eval·빌드·서버 실행은 하지 않았다. upstream 원문은 저장소 산출물에 복사하지 않는다.

| 출발 | 종류 | 도착 | 소스 근거 |
|---|---|---|---|
| src/main/resources/templates/owners/findOwners.html | requests | GET /owners | 화면:9의 form action/method, :14의 검색 입력, :25의 submit |
| GET /owners | maps_to | org.springframework.samples.petclinic.owner.OwnerController#processFindForm | Controller.java:16,48,94–96 |

승인 요청은 위 **2개 연결**이다. 수치는 초안 크기이며 점수가 아니다. 화면 :9의 GET 검색 form만 범위에 포함한다. lastName/page는 요청 데이터이며 경로는 `/owners`다. 클래스 매핑 prefix 없이 메서드의 GET 매핑으로 Controller를 결정한다.

같은 화면의 `/owners/new` 링크(:29), 화면 진입/반환 뷰·프래그먼트·레이아웃은 제외한다. Controller 이후 helper·Repository 메서드명·@Query·Entity·Table·SQL·DB는 **구현과 평가 모두 범위 밖**이다. 따라서 이 사례 통과는 JPA 흐름 수집 성공을 뜻하지 않는다.

승인 JSP 서버 기준선이 없는 독립 외부 held-out으로 학습 parity/screen과 합산하지 않는다. Java 버전은 이 프로젝트의 pom 선언을 따르며 Java 8 조건을 강제로 적용하지 않는다.

재확인 시 기존 폴더를 리셋하거나 덮어쓰지 말고 아래 읽기 명령으로 먼저 확인한다. 새 환경에서는 빈 경로에 clone --no-checkout 후 위 SHA를 fetch하고 detach checkout한다. SHA를 최신 브랜치로 대체하지 않는다.

```powershell
git -C .testbeds/spring-petclinic remote get-url origin
git -C .testbeds/spring-petclinic rev-parse HEAD
git -C .testbeds/spring-petclinic status --porcelain
git check-ignore .testbeds/spring-petclinic/pom.xml
git ls-files .testbeds
node scripts/check-expected.mjs
```

정답 두 건 승인 전 구현 수정·채점을 하지 않는다. 승인 후 같은 동결 구현으로 각각 첫 점수와 원본을 보존해 다시 GATE 보고한다.
