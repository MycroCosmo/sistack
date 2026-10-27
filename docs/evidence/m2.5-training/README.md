# Thymeleaf 학습 검증 원본

`npm-test.txt`는 최종 수집기의 97/97 테스트·승인 정답 11건·스킬/복사본 검사 로그다. `learning-results.json`은 실제 설치본의 prepare → 원문 검토 → finish → evalTrace를 마친 학습 3건의 parity/screen 결과다. `legacy-regression.json`은 최종 수집기로 원문을 다시 인덱싱한 기존 JSP/eGovFrame 승인 8건의 결과이며 과거 점수는 덮어쓰지 않았다.

`originals.json.gz`에는 54개 원본이 있다. 학습 run 3개의 원본 index-query·scope trace·검토·순차 역할별 소스 검토 노트·manifest·보고서·eval, 기존 8개 사례의 새 scope 그래프, 승인 정답 11개와 결과 요약을 보존했다. source/kind/위치로 범위를 정했으며 기대 도착 노드로 출력을 여과하지 않았다. 학습 manifest는 실제 앱·DB 재실행 및 외부 설정 미확인 때문에 PARTIAL이다. 점수 PASS와 구별한다. 단일 에이전트가 화면/서버/SQL 역할을 순차 수행했다.

아카이브 형식은 UTF-8 파일별 본문·SHA-256 맵이다. upstream 대상 소스 원문은 포함하지 않는다. 크기·전체 해시는 `archive.json`에 있다. 저장소 루트에서 다음을 `node --input-type=module`로 실행하면 파일을 생성하지 않고 검증한다.

```js
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
const sha = b => createHash('sha256').update(b).digest('hex');
const meta = JSON.parse(await readFile('docs/evidence/m2.5-training/archive.json'));
const bytes = await readFile(meta.path);
if (sha(bytes) !== meta.sha256) throw Error('archive hash');
const payload = gunzipSync(bytes);
if (sha(payload) !== meta.payload_sha256) throw Error('payload hash');
const { files } = JSON.parse(payload);
if (Object.keys(files).length !== meta.files) throw Error('file count');
for (const [name, item] of Object.entries(files)) {
  if (sha(Buffer.from(item.utf8)) !== item.sha256) throw Error(name);
}
console.log(`PASS: ${meta.files} files`);
```

이는 학습 자기 적용과 기존 사례 회귀 증거다. 새 held-out 두 건은 이 결과에 포함되지 않으며 아직 미채점이다.
