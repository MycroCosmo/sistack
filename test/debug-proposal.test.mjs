import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { digest, save } from '../lib/trace/io.mjs';

const change = (before, after) => `--- a/C.java\n+++ b/C.java\n@@ -1,1 +1,1 @@\n-${before}\n+${after}\n`;
async function setup(t, diff = change('class Wrong {}', 'class Right {}')) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'debug-proposal-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const project = path.join(dir, 'project'), reference = path.join(dir, 'reference');
  await mkdir(project); await mkdir(reference);
  await writeFile(path.join(project, 'C.java'), 'class Wrong {}\n');
  await writeFile(path.join(reference, 'C.java'), 'class Right {}\r\n');
  const run = path.join(project, '.sistack/runs/new');
  const diagnosis = { candidates: [{ status: 'CONFIRMED' }], proposal: { diff } };
  await save(path.join(run, 'evidence/diagnosis.json'), diagnosis);
  await save(path.join(run, 'evidence/stage.json'), { source_files: { 'C.java': digest('class Wrong {}\n') } });
  await save(path.join(run, 'manifest.json'), { run_id: 'new' });
  await save(path.join(run, 'report.md'), 'preserved report');
  const score = path.join(dir, 'score.json');
  await save(score, { run_id: 'new', dataset: 'training', diagnosis_sha256: digest(await readFile(path.join(run, 'evidence/diagnosis.json'))), report_sha256: digest('preserved report'), scored_at: new Date().toISOString() });
  const bugPatch = path.join(dir, 'bug.patch');
  await writeFile(bugPatch, change('class Right {}', 'class Wrong {}'));
  return { dir, project, reference, run, score, bugPatch };
}

test('proposal consistency applies diff only to a copy and compares against reverse bug patch', async t => {
  const { verifyProposal } = await import('../scripts/verify-debug-proposal.mjs');
  const f = await setup(t);
  const result = await verifyProposal(f.run, f.score, { dataset: 'training', bugPatch: f.bugPatch, output: path.join(f.run, 'proposal.json') });
  assert.equal(result.status, 'PASS');
  assert.equal(await readFile(path.join(f.project, 'C.java'), 'utf8'), 'class Wrong {}\n');
  const bad = await setup(t, change('class Wrong {}', 'class Other {}'));
  const failed = await verifyProposal(bad.run, bad.score, { dataset: 'training', bugPatch: bad.bugPatch, output: path.join(bad.run, 'proposal.json') });
  assert.equal(failed.status, 'FAIL');
  assert.deepEqual(failed.different_files, ['C.java']);
  const unapplicable = await setup(t, change('class Missing {}', 'class Right {}'));
  const rejected = await verifyProposal(unapplicable.run, unapplicable.score, { dataset: 'training', bugPatch: unapplicable.bugPatch, output: path.join(unapplicable.run, 'proposal.json') });
  assert.equal(rejected.status, 'FAIL');
  assert.equal(rejected.applied_to_temporary_copy, false);
});

test('unresolved proposals are excluded instead of counted as consistency passes', async t => {
  const { verifyProposal } = await import('../scripts/verify-debug-proposal.mjs');
  const f = await setup(t, '');
  const diagnosis = { candidates: [{ status: 'UNRESOLVED' }], proposal: { diff: '' } };
  await writeFile(path.join(f.run, 'evidence/diagnosis.json'), JSON.stringify(diagnosis));
  const score = JSON.parse(await readFile(f.score)); score.diagnosis_sha256 = digest(await readFile(path.join(f.run, 'evidence/diagnosis.json'))); await writeFile(f.score, JSON.stringify(score));
  const result = await verifyProposal(f.run, f.score, { dataset: 'training', bugPatch: 'must-not-read', output: path.join(f.run, 'proposal.json') });
  assert.equal(result.status, 'UNRESOLVED');
});

test('proposal verification requires a matching preserved score before reading a baseline', async t => {
  const { verifyProposal } = await import('../scripts/verify-debug-proposal.mjs');
  const f = await setup(t);
  await assert.rejects(verifyProposal(f.run, path.join(f.dir, 'absent.json'), { dataset: 'held-out', reference: 'never-read', privateRoot: f.dir, output: path.join(f.run, 'proposal.json') }), /채점/);
  await writeFile(path.join(f.run, 'report.md'), 'changed after scoring');
  await assert.rejects(verifyProposal(f.run, f.score, { dataset: 'training', bugPatch: f.bugPatch, output: path.join(f.run, 'proposal.json') }), /채점/);
});

test('held-out proposal comparison stays private, checks all files, rejects escaping patches', async t => {
  const { verifyProposal } = await import('../scripts/verify-debug-proposal.mjs');
  const f = await setup(t);
  const score = JSON.parse(await readFile(f.score)); score.dataset = 'held-out';
  await writeFile(f.score, JSON.stringify(score));
  const result = await verifyProposal(f.run, f.score, { dataset: 'held-out', reference: f.reference, privateRoot: f.dir, output: path.join(f.run, 'proposal.json') });
  assert.equal(result.status, 'PASS');
  await assert.rejects(verifyProposal(f.run, f.score, { dataset: 'held-out', reference: f.reference, privateRoot: f.dir, output: path.join(os.tmpdir(), 'public.json') }), /범위/);
  const bad = await setup(t, change('class Wrong {}', 'class Right {}').replaceAll('C.java', '../escape'));
  await assert.rejects(verifyProposal(bad.run, bad.score, { dataset: 'training', bugPatch: bad.bugPatch, output: path.join(bad.run, 'proposal.json') }), /경로|범위/);
  const extra = await setup(t);
  await writeFile(path.join(extra.reference, 'Extra.java'), 'class Extra {}\n');
  const extraScore = JSON.parse(await readFile(extra.score)); extraScore.dataset = 'held-out'; await writeFile(extra.score, JSON.stringify(extraScore));
  const mismatch = await verifyProposal(extra.run, extra.score, { dataset: 'held-out', reference: extra.reference, privateRoot: extra.dir, output: path.join(extra.run, 'proposal.json') });
  assert.equal(mismatch.status, 'FAIL');
  assert.deepEqual(mismatch.different_files, ['Extra.java']);
});
