# 프로그램 목록

`node <skill>/scripts/si-docs.mjs extract-program-list <project> <output.json>`

인덱서 endpoint당 1행이다. HTTP 메서드·URL과 CONFIRMED maps_to/calls/executes/renders 연결을 추적한다. Controller/Service 구분은 클래스명 관례다. 메서드/SQL/화면 이름은 근거에서 그대로 수집하며 동적 연결·런타임 도달은 확정하지 않는다. endpoint에 연결되지 않은 배치/유틸/화면의 전수 프로그램 목록은 지원 범위 밖이다.

프로그램 ID·업무명은 null이다. 사용자 mapping의 id_rule/fixed로만 채운다. 연결 없는 Service/Mapper/화면은 빈 칸이며 미확인 목록으로 남긴다. 단순 문자열 검색을 연결 확정으로 쓰지 않는다. LIKELY 경로는 제외하고 이유를 행에 기록한다.

표준 JSON 스키마는 설치본 scripts/schemas/docs/program-list.schema.json이다. values에는 문서 필드, evidence에는 소스 파일/라인, status/reason에는 관계의 근거 수준을 둔다. source_files 해시가 달라지면 새로 추출해야 한다.
