# 단일 CLI

`npx --offline --no-install sistack --help`로 명령을 확인한다. 저장소에서 `npm ci --ignore-scripts` 후 실행하거나 로컬 패키지 tarball을 `npx --offline --package <tgz> sistack ...`으로 실행한다. 이 릴리스는 레지스트리에 배포하지 않는다.

- trace: `프로젝트 --from URL/메서드/sqlId` 또는 `--to 대상`, `--depth 0..100`.
- debug-parse: 로그 파일의 예외/프레임 파싱. 원인 확정이나 수정 적용이 아니다.
- unit-plan: 정상 소스의 서비스 비교 경계·Mapper 분기·저장 컬럼 계획. 테스트 실행이 아니다.
- docs program-list: 프로그램 JSON. `--mapping 승인매핑 --run-id 새ID`면 기존 si-docs writer로 xlsx 작성.
- docs table-spec: `--sources`의 프로젝트 상대 DDL/CSV 목록(JSON 배열)에서 테이블 JSON 추출. 같은 매핑/새ID로 xlsx 작성 가능.
- docs tc plan: 인벤토리·TC·covered_by가 있는 계획 JSON 생성.
- docs tc run: 계획·명시한 실행 설정으로 로컬 사본의 API/UI 실행 및 차수별 xlsx 생성. 실행 설정은 allow_execution=true, round=1/2, JDK/Maven 경로, template/mapping, 실제 M4 JSON 경로 m4가 필요하다. 2차는 first_workbook을 지정한다.

full은 전체 JSON에 결정적 설명 보고를 추가하고, structure-only는 구조만 출력하며, no-ai는 상세 결정적 JSON을 출력한다. 모두 ai_used=false이고 외부 AI를 호출하지 않는다. 읽기만으로 사람의 원인/업무 판단을 대신하지 않고 PARTIAL과 검토 필요를 명시한다.

`--out`은 새 파일만 생성한다. 일반 추출 명령의 `--run-id`는 공통 manifest/report/evidence를 만든다. 자료/양식 원본을 자동 덮어쓰지 않는다. 구조 모드는 xlsx 채우기와 TC run을 거부한다. TC plan은 저장할 실행 계획을 바꾸지 않고 콘솔에 인벤토리·TC 수/연결 검사 구조를 요약한다. Node >=18, tc만 >=20이다.
