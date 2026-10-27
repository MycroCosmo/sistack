import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const run = (script, args) => spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], { encoding: 'utf8', windowsHide: true });
test('CLI 실제 빌드·양방향 질의·기존 출력 보존·잘못된 JSON 비노출', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'sistack-cli-'));
  try {
    await writeFile(path.join(dir, 'a.sql'), 'CREATE TABLE A (ID INT); SELECT * FROM A;');
    const built = run('build-index.mjs', [dir, '--summary']); assert.equal(built.status, 0, built.stderr);
    assert.equal(JSON.parse(built.stdout).processed_files, 1);
    const index = path.join(dir, '.sistack/index/index.json'), original = await readFile(index, 'utf8');
    const repeated = run('build-index.mjs', [dir, '--summary']); assert.equal(repeated.status, 1); assert.equal(await readFile(index, 'utf8'), original);
    const forward = run('query-index.mjs', [index, '--from', 'a.sql']); assert.equal(forward.status, 0, forward.stderr); assert.ok(JSON.parse(forward.stdout).edges.some(e => e.kind === 'reads'));
    const reverse = run('query-index.mjs', [index, '--to', 'A', '--format', 'text']); assert.equal(reverse.status, 0, reverse.stderr); assert.ok(reverse.stdout.includes('a.sql --reads--> A'));
    const malformed = path.join(dir, 'broken.json'); await writeFile(malformed, '{ secret = "synthetic-never-print"');
    const failed = run('query-index.mjs', [malformed, '--from', 'A']); assert.equal(failed.status, 1); assert.ok(!failed.stderr.includes('synthetic-never-print'));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
