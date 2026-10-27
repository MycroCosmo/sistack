import path from 'node:path';
import { lstat, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export async function noLinks(file) {
  let current = path.resolve(file);
  while (true) {
    try { if ((await lstat(current)).isSymbolicLink()) throw new Error('심볼릭 링크 경로는 지원하지 않습니다'); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
    const parent = path.dirname(current); if (parent === current) return; current = parent;
  }
}
export async function inside(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.includes(':') || path.isAbsolute(relative) || relative.split('/').includes('..') || /(?:^|\/)evals\/private(?:\/|$)/.test(relative)) throw new Error('소스 상대 경로 범위 위반');
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw new Error('소스 상대 경로 범위 위반');
  await noLinks(target); return target;
}
export async function json(file) {
  await noLinks(file);
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch { throw new Error('JSON 파일을 읽을 수 없습니다'); }
}
export async function save(file, value, { exclusive = true } = {}) {
  await noLinks(file); await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n', { flag: exclusive ? 'wx' : 'w' });
}

export async function checkSources(root, hashes, points = []) {
  const counts = new Map();
  for (const [file, hash] of Object.entries(hashes)) {
    const bytes = await readFile(await inside(root, file));
    if (digest(bytes) !== hash) throw new Error('소스가 변경됐습니다. 새 run으로 다시 분석하세요');
    const lines = new TextDecoder('utf-8', { fatal: true }).decode(bytes).split(/\r\n|\n|\r/);
    if (lines.at(-1) === '') lines.pop(); counts.set(file, lines.length);
  }
  for (const p of points) if (!counts.has(p.file) || !Number.isInteger(p.line) || p.line < 1 || p.line > counts.get(p.file)) throw new Error('소스 근거의 파일/라인이 유효하지 않습니다');
}
