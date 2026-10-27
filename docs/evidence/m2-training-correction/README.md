# 학습 정답 보정 재채점 기록

`results.json`은 사용자 승인으로 인증 Helper 호출을 추가한 후 기존 v2-final 학습 산출물을 재채점한 결과다. 학습 5건 56/56이며 새 인덱싱이나 독립 평가가 아니다. 과거 결과는 수정하지 않았다.

`originals.json.gz`에는 사례별 eval JSON 5건의 원문과 SHA-256이 있다. 로컬 원본은 `.sistack/m2-training-correction/`에 보존한다. 기존 v2 산출물의 반복 본문을 저장소에 텍스트로 중복 추가하지 않도록 압축했다.

저장소 루트에서 다음을 `node --input-type=module`로 실행하면 압축 원본을 검증할 수 있다(파일 생성 없음).

```js
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const sha = b => createHash('sha256').update(b).digest('hex');
const summary = JSON.parse(await readFile('docs/evidence/m2-training-correction/results.json'));
const bytes = await readFile(summary.archive.path);
if (sha(bytes) !== summary.archive.sha256) throw Error('archive hash');
const payload = gunzipSync(bytes);
if (sha(payload) !== summary.archive.payload_sha256) throw Error('payload hash');
const { files } = JSON.parse(payload);
if (Object.keys(files).length !== summary.archive.files) throw Error('file count');
for (const [name, item] of Object.entries(files)) {
  if (sha(Buffer.from(item.utf8)) !== item.sha256) throw Error(name);
}
console.log(`PASS: ${Object.keys(files).length} files`);
```
