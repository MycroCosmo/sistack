# held-out 정답 초안과 구현 동결

`baseline.json`은 신규 두 흐름의 전용 탐색·초안 작성 전에 기록한 구현 revision·도구 지문·138개 파일 해시다. `draft-source-check.json`은 작성 후 같은 파일/설치본 지문, 초안 근거·해시, PetClinic origin/HEAD/작업트리/미추적 상태, 학습 아카이브 54개 파일과 원본 일치를 검사한 기록이다. 채점 결과가 아니며 두 신규 held-out은 미실행이다.

저장소 루트에서 다음을 `node --input-type=module`로 실행하면 **수집기·eval 실행 없이** 동결과 승인본/초안의 소스 근거를 다시 확인한다.

```js
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { toolFingerprint } from './lib/trace/index.mjs';
import { checkAllExpected } from './scripts/check-expected.mjs';
const sha = b => createHash('sha256').update(b).digest('hex');
const freeze = JSON.parse(await readFile('docs/evidence/m2.5-heldout/baseline.json'));
for (const [file, expected] of Object.entries(freeze.files)) {
  if (sha(await readFile(file)) !== expected) throw Error(`동결 변경: ${file}`);
}
if (await toolFingerprint() !== freeze.tool_fingerprint) throw Error('도구 지문 변경');
console.log(`PASS: ${Object.keys(freeze.files).length} frozen files`);
console.log(await checkAllExpected());
```

외부 소스가 없는 새 환경에서는 저장소 루트 PowerShell에서 아래를 실행한다. 기존 경로가 있으면 중단하며 작업 트리를 리셋·덮어쓰지 않는다. 고정 SHA를 최신 브랜치로 바꾸지 않는다.

```powershell
$petclinicTarget = Join-Path (Get-Location) '.testbeds/spring-petclinic'
if (Test-Path -LiteralPath $petclinicTarget) { throw '기존 경로를 먼저 읽기 전용으로 확인하세요.' }
git clone --no-checkout --depth 1 https://github.com/spring-projects/spring-petclinic.git $petclinicTarget
if ($LASTEXITCODE -ne 0) { throw 'clone 실패' }
git -C $petclinicTarget fetch --depth 1 origin 500158f732419217507c7656904b8e6aa1bcc0d6
if ($LASTEXITCODE -ne 0) { throw '고정 SHA fetch 실패' }
git -C $petclinicTarget checkout --detach 500158f732419217507c7656904b8e6aa1bcc0d6
if ($LASTEXITCODE -ne 0) { throw 'checkout 실패' }
git -C $petclinicTarget remote get-url origin
git -C $petclinicTarget rev-parse HEAD
git -C $petclinicTarget status --porcelain
git check-ignore .testbeds/spring-petclinic/pom.xml
git ls-files .testbeds
```

기대 origin은 공식 저장소 URL, HEAD는 위 SHA, 작업 트리와 tracked 목록은 빈 값, check-ignore는 pom 경로다. 빌드/JPA 추적은 이 GATE 범위 밖이다. 정답 승인 후에만 같은 동결 구현으로 두 사례를 개별 첫 실행·채점하고 원본을 보존한다.
