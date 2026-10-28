import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { save, digest } from '../lib/trace/io.mjs';

// 설치된 lock의 전체 전이 의존성. 네트워크·설치 스크립트를 실행하지 않는다.
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const verified=JSON.parse(await readFile('docs/buffers-license-verification.json','utf8'));
const packages = [];
for (const [location, entry] of Object.entries(lock.packages)) {
  if (!location) continue;
  const pkg = JSON.parse(await readFile(path.join(location, 'package.json'), 'utf8'));
  const licenses = [];
  for (const name of ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'LICENCE', 'LICENCE.txt']) {
    try { licenses.push({ file: name, sha256: digest(await readFile(path.join(location, name))) }); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  packages.push({ ...(pkg.name==='buffers'&&pkg.version==='0.1.1'&&verified.index_equal?{license_evidence:verified.source}:{}),location, name: pkg.name, version: pkg.version, license: pkg.license ?? (pkg.name==='buffers'&&pkg.version==='0.1.1'&&verified.index_equal?verified.license:'UNRESOLVED'), integrity: entry.integrity, licenses });
}
await save('docs/dependency-licenses.json', { lockfile_version: lock.lockfileVersion, packages }, { exclusive: false });
console.log(`라이선스 기록: ${packages.length}개 패키지, 미확인 ${packages.filter(p => p.license === 'UNRESOLVED').length}개`);
