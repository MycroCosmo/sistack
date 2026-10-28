import path from 'node:path';
import { cli, isMain, root, files, exists, sameFile, copyFiles, noLinks } from './common.mjs';
import { validateSkills } from './validate-skills.mjs';

export async function syncShared({ base = root, check = false } = {}) {
  const dirs = await validateSkills(path.join(base, 'skills'));
  const differences = [];
  for (const dir of dirs) {
    const groups = ['mask', ...(['si-trace', 'si-debug', 'si-unit-test', 'si-docs'].includes(path.basename(dir)) ? ['indexer', 'trace', 'manifest'] : []), ...(path.basename(dir) === 'si-debug' ? ['debug'] : []), ...(path.basename(dir) === 'si-unit-test' ? ['unit'] : []), ...(path.basename(dir) === 'si-docs' ? ['docs'] : [])];
    for (const group of groups) {
      const source = path.join(base, 'lib', group), names = await files(source);
      const destination = path.join(dir, 'scripts/lib', group);
      await noLinks(destination);
      const current = await exists(destination) ? await files(destination) : [];
      if (current.some((name) => !names.includes(name))) throw new Error('동기화 대상에 원본에 없는 파일이 있습니다. 삭제 여부를 직접 검토하세요');
      for (const name of names) if (!await sameFile(path.join(source, name), path.join(destination, name))) differences.push(`${path.basename(dir)}/${group}/${name}`);
      if (!check) await copyFiles(source, destination, names, true);
    }
    if (['si-trace', 'si-debug', 'si-unit-test', 'si-docs'].includes(path.basename(dir))) {
      const source = path.join(base, 'schemas'), destination = path.join(dir, 'scripts/schemas');
      for (const name of ['manifest.schema.json', ...(path.basename(dir) === 'si-unit-test' ? ['test-results.schema.json'] : []), ...(path.basename(dir) === 'si-docs' ? ['docs/program-list.schema.json', 'docs/table-spec.schema.json'] : [])]) {
      if (!await sameFile(path.join(source, name), path.join(destination, name))) differences.push(`${path.basename(dir)}/${name}`);
      if (!check) await copyFiles(source, destination, [name], true);
      }
    }
  }
  if (check && differences.length) throw new Error(`공통 모듈 불일치 ${differences.length}개`);
  return dirs.length;
}

if (isMain(import.meta.url)) await cli(async () => {
  if (process.argv.slice(2).some((arg) => arg !== '--check')) throw new Error('사용법: node scripts/sync-shared.mjs [--check]');
  const count = await syncShared({ check: process.argv.includes('--check') });
  console.log(`PASS: 공통 모듈 ${count}개 스킬 ${process.argv.includes('--check') ? '확인' : '동기화'}`);
});
