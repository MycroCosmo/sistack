> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M3 held-out 첫 위치 평가 — 2026-10-28

동결 구현: v4 · `9bd0161f623303bb3d0b5b9ef437a901e80c8899`.

| 사례 | 위치 (제공 project/ 기준) | 위치 적중 |
|---|---|---|
| heldout-01 | src/main/webapp/WEB-INF/templates/board/form.html:16 | 적중 |
| heldout-02 | src/main/resources/mapper/BoardMapper.xml:32 | 적중 |
| heldout-03 | src/main/webapp/WEB-INF/templates/board/list.html:30 | 적중 |

세 첫 진단을 모두 private에 보존한 후에만 정답을 열었다. README 출제 정보와 examples 원본 비교는 사용하지 않았다. 제공된 draft 키는 그대로 보존하고, 이번 첫 채점 지시를 키 사용 승인으로 기록한 private 사본으로 비교했다. 위치·상태 등 정답 내용은 바꾸지 않았다.

첫 진단·점수·실행 원본·동결 리비전과 접근 순서 기록은 evals/private/ 안에만 보존했다. 동결 구현과 제공 project/·증상 입력은 변경하지 않았다. 결과 보고 후 중지하며 수정은 후속 지시를 기다린다.
