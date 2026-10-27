# M3 v5 출력 계약·수정안 정합성

- 구현: 6a750e5, 동결: ../m3-freeze-v5.json, 190개 파일. 원래 v4 동결과 첫 학습/held-out은 변경하지 않았다.
- contract-red.txt: 추상 원인·빈 diff 허용의 기존 결함 검출 1 FAIL, 기존 실제 식별자 보존 1 PASS.
- proposal-red.txt: 정합성 도구 구현 전 새 검사 3 FAIL. followup-red.txt: 기존 후속 실행 거부 재현 1 FAIL.
- npm-test-final.txt: 139/139 및 승인 정답 freshness·스킬·공통 복사본 PASS. npm-test.txt의 최초 실패도 보존한다.
- training/: 새 run-id 10건의 진단·위치 점수·정합성 원본. 자기 작성 편향과 기존 분석 재사용이 있는 대응 평가다. 새 앱 실행을 주장하지 않는다.
- all-location-scores-before-comparison.json: 13건 진단 보존·위치 채점 완료 후 원본 비교 전 경계 기록.
- heldout-public-results.json: 후속 held-out 위치·적중·정합성 결과만 담는다. 실제 내용과 사용자용 report.md·상세 비교는 private에 있다.
- verification.json 및 final-artifact-check.json: 첫 원본/정답·이전 기록·동결·제공 프로젝트·examples 불변, manifest·마스킹·구체적 원인/제안 검사.
- temporary-lifetime-recovery.json: OS 임시 폴더 정리로 중단된 채점 준비를 동일 해시 소스로 복원한 기록. 진단·제안은 변경하지 않았다.

학습 위치 10/10·16/16, 정합성 9/9 PASS·Oracle 1건 UNRESOLVED. 후속 held-out 위치 3/3, 정합성 0/3 PASS·3 FAIL. 최초 held-out 3/3과 합산하지 않는다. 전체 파일 비교의 FAIL을 런타임 실패율로 해석하지 않는다.

정합성 재실행 명령은 저장된 run-dir·score.json에 대해 다음과 같다. 결과 파일은 새 경로를 사용한다.

```sh
node scripts/verify-debug-proposal.mjs <run-dir> <score.json> training <bug.patch> <새결과.json>
node scripts/verify-debug-proposal.mjs <private-run-dir> <private-score.json> held-out <examples/출제원본> <private-새결과.json>
```

과거 run의 재현 환경은 원래 경로와 다를 수 있다. stage의 소스 해시와 일치하는 임시 복사본을 사용해야 하며 보존한 첫 파일은 덮어쓰지 않는다.
