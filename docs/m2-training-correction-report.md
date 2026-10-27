> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M2 학습 정답 누락 보정

### 한 일

2026-10-27 사용자 승인에 따라 `egov-clcode-delete/expected.json`·`expected.md`에 Controller#deleteCmmnClCode → EgovUserDetailsHelper#getAuthenticatedUser를 `calls / CONFIRMED`로 추가했다. Controller:184 호출·Helper:41 선언을 직접 확인했고 Helper 파일 해시를 정답에 추가했다. 증거 단계는 2(소스 위치·호출과 선언 확인)이며 실제 인증 실행 성공을 뜻하지 않는다.

### 검증

기존 `m2-v2-final-training-*` 완료 산출물을 입력으로 `scripts/eval-trace.mjs`의 `evalTrace`를 학습 5건에 재실행했다. 결과는 [results.json](evidence/m2-training-correction/results.json)에 기록했다. 사례별 JSON 5건은 로컬 `.sistack/m2-training-correction/`에 두고 동일 바이트·파일별 해시를 [압축 원본](evidence/m2-training-correction/originals.json.gz)에 보존했다.

- `npm.cmd test`: **74/74 PASS**, 승인 정답 8건의 소스 해시·근거 라인, 스킬 2개 형식과 공통 모듈 복사본 검사 통과.
- `git diff --check`: PASS. 이전 평가·압축 원본과 구현 파일의 Git 차이 없음 확인.

| 학습 사례 | 일치/정답 | 누락 | 과탐 | 상태 불일치 | 결과 |
|---|---:|---:|---:|---:|---|
| legacy-board-search | 17/17 | 0 | 0 | 0 | PASS |
| legacy-board-create | 14/14 | 0 | 0 | 0 | PASS |
| egov-clcode-delete | 7/7 | 0 | 0 | 0 | PASS |
| egov-detailcode-list | 13/13 | 0 | 0 | 0 | PASS |
| egov-rss-columns | 5/5 | 0 | 0 | 0 | PASS |
| 합계(5건) | **56/56** | **0** | **0** | **0** | **PASS** |

재실행 예시(저장소 루트, 출력 경로는 매번 새 경로):

```powershell
node scripts/eval-trace.mjs .testbeds/egovframe/.sistack/runs/m2-v2-final-training-clcode evals/trace/egov-clcode-delete/expected.json --dataset training --output .sistack/clcode-correction-recheck.json
```

기존 로컬 실행 폴더가 없으면 `docs/evidence/m2-v2/originals.json.gz`의 보존 기록을 확인한다. 기존 실행 결과를 새 실행으로 표현하지 않는다. 원본과 동일한 학습 출력에 정답만 보정한 재채점이며 일반화 평가가 아니다.

### 결정

[decisions.md](decisions.md)의 공통 인증 Helper 기준에 따른 정답 누락 보정이다. 구현과 scope를 바꾸지 않았고 Helper 내부 위임은 연결 점수에서 제외한다. 기존 FAIL, held-out 첫 60/66·v2 66/66과 모든 압축 원본은 그대로 남긴다.

### 남은 문제

이번 작업에서 인덱싱·스킬 분석·앱·HTTP·DB 실행을 다시 수행하지 않았다. 기존 분석 manifest의 PARTIAL과 미실행 자동 활성화 두 문항은 그대로다.

### 사용자 확인 필요

요청한 정답 보정은 승인 범위 안에서 완료했다. M2.5는 계획 문서만 작성하며 테스트베드·수집기 구현과 의존성 추가는 시작하지 않는다.
