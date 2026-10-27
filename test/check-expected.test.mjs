import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { checkExpected } from '../scripts/check-expected.mjs';

test('정답 freshness: 정상 근거, 소스 변경, 없는 라인/파일, 누락 소스, 경로 이탈', async () => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), 'sistack-expected-'));
  try {
    await mkdir(path.join(repositoryRoot, 'source'));
    const content = 'first\nsecond\n', file = path.join(repositoryRoot, 'source/A.java');
    await writeFile(file, content);
    const expected = { schema_version: '1.0', review_status: 'approved', case_id: 'fixture', source_root: 'source', source_files: { 'A.java': createHash('sha256').update(content).digest('hex') }, edges: [{ evidence: [{ file: 'A.java', line: 2 }] }] };
    const check = e => checkExpected(e, { repositoryRoot });
    assert.equal((await check(expected)).evidence_locations, 1);
    for (const point of [{ file: 'A.java', line: 3 }, { file: 'B.java', line: 1 }, { file: 'A.java', line: 0 }]) {
      await assert.rejects(check({ ...expected, extra: { evidence: [point] } }), /라인/);
    }
    await assert.rejects(check({ ...expected, edges: [{}] }), /evidence/);
    await assert.rejects(check({ ...expected, source_root: '../source' }), /경로/);
    await writeFile(file, 'changed\nsecond\n');
    await assert.rejects(check(expected), /해시 불일치/);
    await rm(file);
    await assert.rejects(check(expected), /BLOCKED/);
  } finally { await rm(repositoryRoot, { recursive: true, force: true }); }
});
