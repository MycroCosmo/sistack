import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { digest, save } from '../lib/trace/io.mjs';
import { rejudgeProposal } from '../scripts/rejudge-debug-proposal.mjs';

async function setup(t, replacement = 'right', before = 'wrong') {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'debug-rejudge-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const project = path.join(dir, 'project'), reference = path.join(dir, 'reference');
  await mkdir(project); await mkdir(reference);
  await save(path.join(project, 'source.txt'), 'wrong\n');
  await save(path.join(reference, 'source.txt'), 'right\r\n');
  await save(path.join(reference, 'README.md'), 'omitted from provided copy');
  const run = path.join(project, '.sistack/runs/v5');
  const diff = `--- a/source.txt\n+++ b/source.txt\n@@ -1,1 +1,1 @@\n-${before}\n+${replacement}\n`;
  await save(path.join(run, 'evidence/diagnosis.json'), { candidates: [{ status: 'CONFIRMED' }], proposal: { diff } });
  await save(path.join(run, 'evidence/stage.json'), { source_files: { 'source.txt': digest('wrong\n') } });
  await save(path.join(run, 'manifest.json'), { run_id: 'v5' });
  await save(path.join(run, 'report.md'), 'preserved');
  const score = path.join(dir, 'score.json');
  await save(score, { run_id: 'v5', dataset: 'held-out', diagnosis_sha256: digest(await readFile(path.join(run, 'evidence/diagnosis.json'))), report_sha256: digest('preserved'), scored_at: new Date().toISOString() });
  const options = { reference, privateRoot: dir, outputDir: path.join(dir, 'new') };
  const approval = { decision: 'EQUIVALENT', run_id: 'v5', proposal_sha256: digest(diff), different_files: ['source.txt'], approver: 'human reviewer', approved_at: '2026-10-28', source: 'explicit user instruction', reason: 'reviewed equivalent behavior' };
  return { dir, project, run, score, options, approval };
}

test('rejudgment excludes absent author files and preserves v5 and the project', async t => {
  const f = await setup(t);
  await save(path.join(f.run, 'proposal-consistency.json'), { status: 'FAIL' });
  const result = await rejudgeProposal(f.run, f.score, f.options);
  assert.equal(result.status, 'EXACT');
  assert.deepEqual(result.excluded_original_files, ['README.md']);
  assert.deepEqual(result.compared_paths, ['source.txt']);
  assert.equal(await readFile(path.join(f.project, 'source.txt'), 'utf8'), 'wrong\n');
  assert.deepEqual(JSON.parse(await readFile(path.join(f.run, 'proposal-consistency.json'))), { status: 'FAIL' });
  await assert.rejects(rejudgeProposal(f.run, f.score, f.options), { code: 'EEXIST' });
});

test('all provided files remain in scope even outside the proposal', async t => {
  const f = await setup(t);
  await save(path.join(f.project, 'extra.txt'), 'present only in provided copy');
  const result = await rejudgeProposal(f.run, f.score, f.options);
  assert.equal(result.status, 'FAIL');
  assert.deepEqual(result.different_files, ['extra.txt']);
});

test('different proposals fail automatically; EQUIVALENT only records a bound human approval', async t => {
  const f = await setup(t, 'equivalent');
  const automatic = await rejudgeProposal(f.run, f.score, f.options);
  assert.equal(automatic.status, 'FAIL');
  assert.equal(automatic.human_approval, null);
  const approved = await rejudgeProposal(f.run, f.score, { ...f.options, outputDir: path.join(f.dir, 'approved'), humanApproval: f.approval });
  assert.equal(approved.status, 'EQUIVALENT');
  assert.equal(approved.automatic_verdict, 'FAIL');
  assert.deepEqual(approved.human_approval, f.approval);
  for (const key of ['approver', 'reason', 'source', 'approved_at', 'proposal_sha256', 'run_id']) {
    await assert.rejects(rejudgeProposal(f.run, f.score, { ...f.options, outputDir: path.join(f.dir, key), humanApproval: { ...f.approval, [key]: '' } }), /승인/);
  }
  await assert.rejects(rejudgeProposal(f.run, f.score, { ...f.options, outputDir: path.join(f.dir, 'scope'), humanApproval: { ...f.approval, different_files: [] } }), /승인/);
});

test('unapplicable diff cannot become EQUIVALENT and public output is rejected', async t => {
  const f = await setup(t, 'right', 'missing');
  await assert.rejects(rejudgeProposal(f.run, f.score, { ...f.options, humanApproval: f.approval }), /승인/);
  await assert.rejects(rejudgeProposal(f.run, f.score, { ...f.options, outputDir: path.join(os.tmpdir(), 'public') }), /범위/);
});
