import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { root, noLinks, cli, isMain } from './common.mjs';

function within(base, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.includes(':') || relative.split('/').includes('..') || path.isAbsolute(relative)) throw new Error('정답 소스 경로는 내부 상대 경로여야 합니다');
  const target = path.resolve(base, relative);
  if (!target.startsWith(path.resolve(base) + path.sep) || /(?:^|\/)evals\/private(?:\/|$)/.test(relative)) throw new Error('정답 소스 경로 범위 위반');
  return target;
}

export async function checkExpected(expected, { repositoryRoot = root } = {}) {
  if (expected.schema_version !== '1.0' || expected.review_status !== 'approved' || !expected.source_files || !Object.keys(expected.source_files).length || !expected.edges?.length) throw new Error('승인 정답 계약 또는 source_files 누락');
  const sourceRoot = within(repositoryRoot, expected.source_root);
  await noLinks(sourceRoot);
  const lines = new Map();
  for (const [file, hash] of Object.entries(expected.source_files)) {
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('정답 source_files SHA-256 형식 오류');
    const target = within(sourceRoot, file);
    await noLinks(target);
    let bytes;
    try { bytes = await readFile(target); }
    catch { throw new Error('BLOCKED: 정답 소스 파일 없음/읽기 실패. eGovFrame은 node scripts/fetch-testbed.mjs egovframe 실행 후 재검사'); }
    if (createHash('sha256').update(bytes).digest('hex') !== hash) throw new Error(`FAIL: 정답 source_files 해시 불일치: ${file}`);
    const content = new TextDecoder('utf-8', { fatal: true }).decode(bytes).split(/\r\n|\n|\r/);
    if (content.at(-1) === '') content.pop();
    lines.set(file, content.length);
  }
  let evidenceCount = 0;
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (key === 'evidence') {
        if (!Array.isArray(item) || !item.length) throw new Error('정답 evidence 누락');
        for (const point of item) {
          if (!lines.has(point?.file) || !Number.isInteger(point.line) || point.line < 1 || point.line > lines.get(point.file)) throw new Error('FAIL: 정답 evidence 파일/라인이 source_files에 존재하지 않음');
          evidenceCount++;
        }
      }
      visit(item);
    }
  };
  if (expected.edges.some(e => !Array.isArray(e.evidence) || !e.evidence.length)) throw new Error('정답 연결 evidence 누락');
  visit(expected);
  return { case_id: expected.case_id, status: 'PASS', source_files: lines.size, evidence_locations: evidenceCount };
}

export async function checkAllExpected(repositoryRoot = root) {
  const base = path.join(repositoryRoot, 'evals/trace');
  await noLinks(base);
  const cases = (await readdir(base, { withFileTypes: true })).filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  if (!cases.length) throw new Error('승인 정답이 없습니다');
  const results = [];
  for (const entry of cases) {
    const file = path.join(base, entry.name, 'expected.json');
    await noLinks(file);
    const expected = JSON.parse(await readFile(file, 'utf8'));
    results.push(await checkExpected(expected, { repositoryRoot }));
  }
  return results;
}

if (isMain(import.meta.url)) await cli(async () => {
  if (process.argv.length > 2) throw new Error('사용법: node scripts/check-expected.mjs');
  console.log(JSON.stringify(await checkAllExpected(), null, 2));
});
