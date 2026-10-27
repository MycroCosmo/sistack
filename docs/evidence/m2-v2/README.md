# M2 v2 보존 기록

v2는 결함 수정 확인이며 일반화 성능이 아니다. 첫 60/66과 해당 압축 원본은 `../m2-heldout-first/`에 그대로 둔다. `results.json`은 학습 55개 연결과 held-out 66개 연결을 별도로 기록한다. 학습 추가 호출 1건의 비교 FAIL도 보존한다.

`originals.json.gz`는 Node 표준 `gzip`으로 압축한 JSON이다. `files[상대경로]`에 원문 `utf8`과 파일별 `sha256`이 있다. 193개 파일에는 초기 v2 시도와 최종 v2-final 실행, 승인 정답, 실제 탐색 기록, TDD·실행 로그가 들어 있다. 경로는 기록용이며 자동 복원하거나 실행하지 않는다. 개인정보를 사용하지 않은 합성 실패 테스트 로그는 별도 `.txt`로도 제공한다. `.txt`는 Git 표시용으로 후행 공백을 제거하고 줄바꿈을 정규화하며, 로그 원본 바이트는 압축 파일에 보존했다. 종료 문서 갱신 후 다시 실행한 `closure-npm-test.txt`는 별도 추가 검증 기록이다.

저장소 루트에서 다음 읽기 전용 검사를 수행할 수 있다. 기존 경로에 파일을 쓰지 않는다.

```js
// node --input-type=module 로 실행
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
const sha = b => createHash('sha256').update(b).digest('hex');
const summary = JSON.parse(await readFile('docs/evidence/m2-v2/results.json'));
const bytes = await readFile(summary.archive.path);
if (sha(bytes) !== summary.archive.sha256) throw Error('archive hash');
const payload = gunzipSync(bytes);
if (sha(payload) !== summary.archive.payload_sha256) throw Error('payload hash');
const snapshot = JSON.parse(payload);
for (const [name, item] of Object.entries(snapshot.files)) {
  if (sha(Buffer.from(item.utf8)) !== item.sha256) throw Error(name);
}
console.log(`PASS: ${Object.keys(snapshot.files).length} files`);
```

압축 원본에는 target 소스 본문을 복제하지 않는다. 실행 메타데이터의 source_files 해시·근거 위치를 고정 eGovFrame revision `2303751d76c119b56dc2e6b6fe1002adafbef938` 및 legacy-board 원문과 대조한다. 정답 JSON의 소스 라인·해시는 `node scripts/check-expected.mjs`로 검사한다. 결과는 정적 연결 비교와 소스 검토 기록이며 실제 앱·DB 실행을 증명하지 않는다.
