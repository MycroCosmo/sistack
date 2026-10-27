# M2.5 v2 — 결함 수정 확인

v2는 승인된 일반 결함의 수정 확인이며 **일반화 성능이 아니다**. 첫 FAIL 정답·점수·49개 원본을 덮어쓰거나 합산하지 않았다.

- `failing-before.txt`: 일반 합성 10건 수정 전 10 FAIL. `0add4e1`에 먼저 커밋했다.
- `dual-build-failing-before.txt`: 같은 루트 Maven/Gradle starter 중복의 추가 실패 1건. 일반 테스트로 재현 후 정규화했다.
- `npm-test-final.txt`: 최종 **108/108 PASS**, 승인 정답 13건·스킬/복사본 검사 PASS.
- `baseline.json`: 최종 구현 `2ff7c22`, 도구 지문·파일별 해시. `results.json`은 새 run-id의 held-out 2건·학습 3건 결과다.
- `comparison.json`: 두 held-out의 첫 점수와 v2를 screen/server별로 나란히 보존했다. `legacy-regression.json`은 최종 수집기로 다시 인덱싱한 기존 JSP 8건이다.
- `runtime.json`: Java 17/Maven JUnit 2건·HTTP smoke·실제 브라우저 등록/검색/삭제·data AJAX/JSP 공존 결과. Java 8 런타임은 BLOCKED다. 두 PNG는 실제 삭제 전후 화면이다.
- `attempt01.json`과 `*-attempt01.json`: Maven/Gradle 중복 선언을 발견한 **미채점 준비 단계**의 원본. 이를 보존하고 최종 run-id는 `m25-v2-{delete,petclinic,search,create,coexist}-20261027-02`로 분리했다. -01을 첫 score나 성공 실행으로 보고하지 않는다.
- `postflight.json`: 첫 기준선·정답·테스트베드·도구·소스 해시/manifest 검증.

`originals.json.gz`는 136개 UTF-8 파일의 본문/SHA-256 맵이다. 최종 5개 run의 전체 인덱스·query·trace·검토·manifest·보고서·native eval 7개, 미채점 준비 5개 run, 기존 8개 회귀 scope 그래프, 승인본과 실행 절차를 보존했다. 외부 프로젝트 원문 소스는 포함하지 않는다. `archive.json`에 압축/해제 payload SHA-256·파일 수가 있다.

```powershell
node docs/evidence/m2.5-v2/verify.mjs
node scripts/check-expected.mjs
```

위 verify는 보존한 그래프를 같은 비교기로 다시 비교하고 첫 원본 49개·현재 v2 136개 해시, 승인 정답/테스트베드 불변, 최종 native eval 7개와 회귀 8건을 검사한다. 수집기·앱을 다시 실행하거나 첫 결과를 덮어쓰지 않는다. 첫 전용 verify는 원래 동결 구현 checkout용으로 그대로 남겨 두었다.

두 샌드박스 재시도 로그도 보존했다. npm 임시 Git config 쓰기와 HTTP localhost EACCES는 코드 수정 없이 권한 있는 동일 명령에서 통과했다. Java 17/Maven·localhost 서버만 사용했으며 새 의존성·운영 DB·배포 서버 접근은 없다. 검증 서버·임시 브라우저 탭은 종료했다.
