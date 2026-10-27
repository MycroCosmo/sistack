# Thymeleaf held-out — 수정 전 첫 실행 원본

`approval.json`은 수집기 실행 전 138개 동결 파일·설치본 지문·소스 근거·승인 정답 해시와 screen/server scope를 확인한 기록이다. 승인 정답은 `39c30c1`에 먼저 커밋했다. `prepares.json`은 이후 설치본 CLI를 각각 한 번 실행한 명령·run-id·복잡도다. `results.json`은 수정 전 첫 결과이며 합산 점수가 없다. `postflight.json`은 실행 후 동결·정답 해시·manifest·원본 보존 검사다.

| 사례 | screen | server | 결과 |
|---|---:|---:|---|
| thymeleaf-board-delete-ajax | 4/4, 누락 0·과탐 1·상태 불일치 0 | 9/9, 모두 0 | FAIL |
| petclinic-owner-find | 2/6, 누락 4·과탐 1·상태 불일치 0 | 3/3, 모두 0 | FAIL |

## 그룹 보고 방식

동결 비교기의 `score_groups` enum은 parity/screen이다. 이를 수정하거나 server를 의미가 다른 parity로 위장하지 않았다. 승인본의 `report_group` 라벨이 screen/server 범위를 고정한다. 각 그룹의 scope/edges를 그대로 투영한 승인 JSON 두 개를 만들어 **같은 frozen evalTrace**로 별도 평가했다. 투영본의 case-id·source_files·원본 승인 해시를 유지하고 각 사례의 두 그룹 결과만 보고한다. 투영은 실제 출력을 변환하거나 정답 출발/도착 노드로 걸러내는 작업이 아니다.

raw full-index에서 승인 source/kind scope에 해당하는 **모든 실제 연결**을 trace에 보존했다. 도착 노드로 여과하거나 누락 연결을 수동 추가하지 않았다. raw full-index와 scope trace의 그룹별 frozen evalIndex 결과가 완전히 같음을 검증했다. 삭제의 from.file scope는 화면·인라인·handler를 포함해 th:action 중복 POST를 실제 과탐으로 잡았다.

## 원본

`originals.json.gz`는 **49개 파일**의 UTF-8 본문/SHA-256 맵이다. 두 run의 전체 원본 인덱스·index-query·stage·scope trace·검토·manifest·보고서·그룹별 승인 투영본/첫 eval 4개·최초 registry와 승인 정답 MD/JSON·실행 절차를 보존했다. 라이브 대상 소스 원문을 읽기 위해 로컬에 만든 숨김 snippets 파일은 아카이브·커밋에서 제외했다. 외부 프로젝트의 원문 소스를 커밋하지 않는다.

`archive.json`에 압축/해제 payload 해시·파일 수가 있다. 두 실제 run은 각각 대상 `.sistack/runs/` 아래에 남아 있다.

- `m25-heldout-delete-first-20261027-01`
- `m25-heldout-petclinic-first-20261027-01`

저장소 루트에서 다음을 실행하면 첫 결과를 덮어쓰거나 수집기를 재실행하지 않고 검증한다.

```powershell
node docs/evidence/m2.5-heldout-first/verify.mjs
node scripts/check-expected.mjs
```

verify는 동결 138개 파일, 아카이브 49개 해시, 승인본→그룹별 투영의 완전 분할, 보존한 full-index/trace를 동일 frozen 비교기에 넣은 결과와 첫 eval 4개·보고서/정답 해시를 확인한다. 이 재검증은 새로운 held-out 실행이나 수정 후 점수가 아니다.

테스트베드·코드·스키마·비교기·설치본은 수정하지 않았다. 이 실패 원본은 후속 수정 결과로 덮어쓰지 않는다. 다음 작업은 사용자 지시를 받은 뒤 새 run-id로 수행해야 한다.
