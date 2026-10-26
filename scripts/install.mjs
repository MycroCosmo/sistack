import path from 'node:path';
import os from 'node:os';
import { cli, isMain, root, files, exists, noLinks, copyFiles } from './common.mjs';
import { validateSkills } from './validate-skills.mjs';
import { syncShared } from './sync-shared.mjs';
import { mask } from '../lib/mask/index.mjs';

export function destination({ target, scope, dest, cwd = process.cwd(), home = os.homedir() }) {
  if (!['codex', 'claude'].includes(target) || !['repo', 'user'].includes(scope)) throw new Error('--target codex|claude --scope repo|user가 필요합니다');
  return path.resolve(dest ?? path.join(scope === 'repo' ? cwd : home, target === 'codex' ? '.agents' : '.claude', 'skills'));
}

export async function install(options, base = root) {
  const dest = destination(options);
  await noLinks(dest);
  const dirs = await validateSkills(path.join(base, 'skills'));
  await syncShared({ base, check: true });
  const plan = [];
  const conflicts = [];
  for (const source of dirs) {
    const target = path.join(dest, path.basename(source));
    const a = path.relative(source, target), b = path.relative(target, source);
    if (!a || (!a.startsWith('..' + path.sep) && a !== '..' && !path.isAbsolute(a)) || (!b.startsWith('..' + path.sep) && b !== '..' && !path.isAbsolute(b))) throw new Error('원본과 설치 경로가 겹칩니다');
    await noLinks(target);
    const names = await files(source);
    if (await exists(target)) {
      await files(target);
      conflicts.push(path.basename(source) + '/');
    }
    for (const name of names) if (await exists(path.join(target, name))) conflicts.push(path.join(path.basename(source), name));
    plan.push({ source, target, names });
  }
  if (conflicts.length) {
    console.log('기존 경로:\n' + conflicts.map(mask).join('\n'));
    if (!options.force) throw new Error('설치 중단: 덮어쓰려면 목록 검토 후 --force를 지정하세요');
  }
  for (const { source, target, names } of plan) await copyFiles(source, target, names, options.force);
  return plan.length;
}

if (isMain(import.meta.url)) await cli(async () => {
  const options = {};
  const args = process.argv.slice(2);
  while (args.length) {
    const arg = args.shift();
    if (arg === '--force' && !options.force) options.force = true;
    else if (['--target', '--scope', '--dest'].includes(arg) && args[0] && !args[0].startsWith('--') && !Object.hasOwn(options, arg.slice(2))) options[arg.slice(2)] = args.shift();
    else throw new Error('사용법: node scripts/install.mjs --target codex|claude --scope repo|user [--dest <dir>] [--force]');
  }
  console.log(`PASS: 스킬 ${await install(options)}개 설치`);
});
