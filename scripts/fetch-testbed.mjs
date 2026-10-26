import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { cli, isMain, root, exists, noLinks } from './common.mjs';

export const egovframe = Object.freeze({
  url: 'https://github.com/eGovFramework/egovframe-common-components.git',
  tag: 'v4.2.4',
  revision: '2303751d76c119b56dc2e6b6fe1002adafbef938'
});

function git(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', timeout: 180000, windowsHide: true, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  if (result.error || result.status !== 0) throw new Error('BLOCKED: git 실행 또는 공개 저장소 접근 실패. 기존 경로를 보존했습니다');
  return result.stdout.trim();
}

export async function fetchTestbed(base = root, spec = egovframe) {
  const dest = path.join(base, '.testbeds/egovframe');
  await noLinks(dest);
  if (await exists(dest)) {
    if (!await exists(path.join(dest, '.git'))) throw new Error('기존 폴더가 Git 저장소가 아닙니다. 덮어쓰지 않습니다');
    if (git(['remote', 'get-url', 'origin'], dest) !== spec.url || git(['rev-parse', 'HEAD'], dest) !== spec.revision
      || git(['status', '--porcelain', '--untracked-files=all'], dest)) throw new Error('기존 테스트베드의 출처·커밋·변경 상태를 검토하세요. 변경하지 않았습니다');
    return spec.revision;
  }
  await mkdir(path.dirname(dest), { recursive: true });
  git(['clone', '--depth', '1', '--branch', spec.tag, '--no-checkout', spec.url, dest], base);
  if (git(['rev-parse', 'HEAD'], dest) !== spec.revision) throw new Error('고정 커밋과 태그가 다릅니다. 체크아웃하지 않았습니다');
  git(['checkout', '--detach', spec.revision], dest);
  return spec.revision;
}

if (isMain(import.meta.url)) await cli(async () => {
  if (process.argv.length !== 3 || process.argv[2] !== 'egovframe') throw new Error('사용법: node scripts/fetch-testbed.mjs egovframe');
  console.log(`PASS: eGovFrame ${await fetchTestbed()}`);
});
