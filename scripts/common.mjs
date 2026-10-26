import { lstat, readdir, mkdir, copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const isMain = (url) => Boolean(process.argv[1]) && pathToFileURL(path.resolve(process.argv[1])).href === url;

export async function exists(file) {
  try { await lstat(file); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

export async function noLinks(file) {
  let current = path.resolve(file);
  while (true) {
    if (await exists(current) && (await lstat(current)).isSymbolicLink()) throw new Error('심볼릭 링크 경로는 지원하지 않습니다');
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

export async function files(dir, prefix = '') {
  await noLinks(dir);
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error('심볼릭 링크는 복사하지 않습니다');
    if (entry.isDirectory()) found.push(...await files(path.join(dir, entry.name), relative));
    else if (entry.isFile()) found.push(relative);
    else throw new Error('일반 파일만 지원합니다');
  }
  return found.sort();
}

export async function skillDirs(base) {
  await noLinks(base);
  const dirs = [];
  for (const entry of await readdir(base, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('스킬 심볼릭 링크는 지원하지 않습니다');
    if (entry.isDirectory()) dirs.push(path.join(base, entry.name));
  }
  return dirs.sort();
}

export async function copyFiles(source, destination, names, overwrite = false) {
  for (const name of names) {
    const target = path.join(destination, name);
    await noLinks(target);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(source, name), target, overwrite ? 0 : 1);
  }
}

export async function sameFile(left, right) {
  return await exists(right) && (await readFile(left)).equals(await readFile(right));
}

export async function cli(action) {
  try { await action(); }
  catch (error) {
    // 시스템 오류에 입력 데이터나 비밀값이 포함될 수 있어 메시지를 제한한다.
    const { mask } = await import('../lib/mask/index.mjs');
    console.error(mask(error.code ? `실패: ${error.code}` : error.message));
    process.exitCode = 1;
  }
}
