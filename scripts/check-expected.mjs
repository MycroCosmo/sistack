import path from 'node:path';
import { readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { root, noLinks, cli, isMain, exists } from './common.mjs';
import { prepareCase } from './eval-debug.mjs';
import { validateDebugExpected } from '../lib/debug/expected.mjs';
import { validateExpected, assertParity } from '../lib/indexer/expected.mjs';

function within(base, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.includes(':') || relative.split('/').includes('..') || path.isAbsolute(relative)) throw new Error('정답 소스 경로는 내부 상대 경로여야 합니다');
  const target = path.resolve(base, relative);
  if (!target.startsWith(path.resolve(base) + path.sep) || /(?:^|\/)evals\/private(?:\/|$)/.test(relative)) throw new Error('정답 소스 경로 범위 위반');
  return target;
}

export async function checkExpected(expected, { repositoryRoot = root, sourceRoot: debugSource, allowDraft = false } = {}) {
  if (['training', 'held-out'].includes(expected.dataset) && Array.isArray(expected.locations)) {
    if (!debugSource) throw new Error('debug 정답은 패치 적용 임시 sourceRoot 필요');
    return validateDebugExpected(expected, debugSource, { allowDraft });
  }
  if (expected.schema_version !== '1.0' || !(expected.review_status === 'approved' || allowDraft && expected.review_status === 'draft') || !expected.source_files || !Object.keys(expected.source_files).length || !expected.edges?.length) throw new Error('승인 정답 계약 또는 source_files 누락');
  const grouped = validateExpected(expected);
  if (grouped && (expected.parity_reference || expected.edges.some(e => e.group === 'parity'))) {
    const reference = expected.parity_reference;
    if (!reference?.file || !/^[a-f0-9]{64}$/.test(reference.expected_sha256)) throw new Error('parity 기준 정답/해시 누락');
    const referenceFile = within(repositoryRoot, reference.file);
    await noLinks(referenceFile);
    const bytes = await readFile(referenceFile), approved = JSON.parse(bytes);
    if (createHash('sha256').update(bytes).digest('hex') !== reference.expected_sha256 || approved.review_status !== 'approved') throw new Error('parity 기준 승인 정답/해시 불일치');
    validateExpected(approved);
    assertParity(expected, approved);
  }
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
  return { case_id: expected.case_id, status: expected.review_status === 'draft' ? 'DRAFT_SOURCES_VALID' : 'PASS', source_files: lines.size, evidence_locations: evidenceCount,
    ...(grouped ? { groups: Object.fromEntries(expected.score_groups.map(group => [group, { expected_edges: expected.edges.filter(e => e.group === group).length }])) } : {}) };
}

export async function checkAllExpected(repositoryRoot = root) {
  const base = path.join(repositoryRoot, 'evals/trace');
  await noLinks(base);
  const cases = (await readdir(base, { withFileTypes: true })).filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
  if (!cases.length) throw new Error('승인 정답이 없습니다');
  const results = [];
  for (const entry of cases) {
    const names = await readdir(path.join(base, entry.name));
    const draft = !names.includes('expected.json') && names.includes('expected.draft.json');
    const file = path.join(base, entry.name, draft ? 'expected.draft.json' : 'expected.json');
    await noLinks(file);
    const expected = JSON.parse(await readFile(file, 'utf8'));
    if (draft && expected.review_status !== 'draft') throw new Error('draft 파일을 승인 정답으로 사용할 수 없습니다');
    results.push(await checkExpected(expected, { repositoryRoot, allowDraft: draft }));
  }
  const debugCases = path.join(repositoryRoot, 'evals/debug/cases');
  if (await exists(debugCases)) {
    for (const entry of (await readdir(debugCases, { withFileTypes: true })).filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      const expectedFile = path.join(debugCases, entry.name, 'expected.json');
      if (!await exists(expectedFile)) continue;
      const expected = JSON.parse(await readFile(expectedFile, 'utf8'));
      const prepared = await prepareCase(entry.name, { repository: repositoryRoot });
      try { results.push(await checkExpected(expected, { repositoryRoot, sourceRoot: prepared.project })); }
      finally {
        if (!path.resolve(prepared.project).startsWith(path.join(os.tmpdir(), 'sistack-debug-'))) throw new Error('임시 경로 정리 범위 오류');
        await rm(prepared.project, { recursive: true, force: true });
      }
    }
  }
  return results;
}

if (isMain(import.meta.url)) await cli(async () => {
  if (process.argv.length > 2) throw new Error('사용법: node scripts/check-expected.mjs');
  console.log(JSON.stringify(await checkAllExpected(), null, 2));
});
