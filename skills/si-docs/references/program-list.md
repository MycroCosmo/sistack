# 프로그램 목록

`node <skill>/scripts/si-docs.mjs extract-program-list <project> <output.json>`

기본은 화면 파일/클래스(인터페이스 포함)/SQL 선언별 1행이다. 공유 클래스/SQL은 원래 노드 식별자로 중복 제거하고, 템플릿 선택자 노드는 별도 화면으로 세지 않는다. JSPF와 독립 렌더 연결 없이 공통 조각/레이아웃으로 선언된 파일은 제외 이유를 남긴다. 미지원 기술/중첩 클래스/동적 실행까지 전수 수집했다고 표현하지 않는다.

기본 선정은 자료 전달/보조 타입(필드+getter/setter 위주), 예외 상속 타입, 상태/의존성 없는 정적 계산 유틸 후보를 제외한다. 자료형/유틸 판정은 보수적 정적 휴리스틱이며 제외 사유·파일:라인·근거 상태를 JSON excluded에 남긴다. 생성자는 getter/setter 비율에서 제외한다. 프레임워크 진입점/빈과 Mapper는 getter처럼 생긴 메서드만으로 제외하지 않는다.

Service 인터페이스는 실제 extends/implements 관계와 Service 선언으로 구현체 행에 병합한다. 구현체가 여러 개면 각각 행을 유지하며 인터페이스의 병합 대상들을 JSON에 남긴다. 관련 소스에는 인터페이스 이름/파일과 원래 메서드를 포함하고 엑셀에도 인터페이스명을 표시한다. Mapper 인터페이스와 SQL 선언은 각각 유지한다. 인터셉터 및 ControllerAdvice/RestControllerAdvice는 프로그램 구분 공통으로 유지한다.

화면명은 주석을 제외한 정적 title 또는 첫 h1 텍스트를 LIKELY로 제안한다. 동적 표현/치환 속성은 추정하지 않는다. 제안 셀은 노란색, 비고에는 근거 파일:라인을 기록한다. 클래스/SQL 업무명은 빈 칸/미확인이다. 프로그램 ID는 사용자 sistack-docs.json의 id_rule만 사용한다. URL이 해당 없는 클래스/SQL과 연결을 확인하지 못한 화면을 구별한다.

엑셀은 Controller/Service를 `클래스명.메서드명`, Mapper/SQL을 `네임스페이스명.SQL ID`로 표시한다. 패키지를 포함한 원래 식별자는 표준 JSON/인덱스에 유지한다. 동일 클래스명은 원래 식별자와 근거 파일로 구별한다.

표준 JSON 스키마는 scripts/schemas/docs/program-list.schema.json이다. 선정 보정은 1.2.0이며 기존 1.1.0/endpoint 1.0.0도 읽는다. identity/not_applicable/field_evidence와 excluded/interface_sources로 중복·해당 없음·LIKELY·제외/병합을 보존한다. source_files 또는 선정 설정 해시가 달라지면 새로 추출해야 한다.

기존 요청 단위 비교가 필요하면 추출 명령 마지막 인자로 `endpoint`를 명시한다. 기본값은 `separate`다. CONFIRMED 연결만 URL 근거로 사용하며 실행 도달을 보증하지 않는다.
