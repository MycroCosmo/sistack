import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import { toolFingerprint } from '../../../lib/trace/index.mjs';
import { evalIndex } from '../../../lib/indexer/eval.mjs';
import { validateManifest } from '../../../lib/manifest/index.mjs';

// Verify preserved inputs/results only; never run the collector or overwrite a first result.
const root = new URL('../../../', import.meta.url);
const read = async relative => readFile(new URL(relative, root));
const json = async relative => JSON.parse(await read(relative));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const dir = 'docs/evidence/m2.5-heldout-first/';
const freeze = await json('docs/evidence/m2.5-heldout/baseline.json');
for (const [file, hash] of Object.entries(freeze.files)) assert.equal(sha(await read(file)), hash, file);
assert.equal(await toolFingerprint(), freeze.tool_fingerprint);
const archive = await json(dir + 'archive.json');
const bytes = await read(archive.path);
assert.equal(sha(bytes), archive.sha256);
const payload = gunzipSync(bytes);
assert.equal(sha(payload), archive.payload_sha256);
const { files } = JSON.parse(payload);
assert.equal(Object.keys(files).length, archive.files);
for (const [file, entry] of Object.entries(files)) {
  assert.equal(sha(Buffer.from(entry.utf8)), entry.sha256, file);
  assert.ok(!file.endsWith('.source-review-snippets.txt'), 'source bodies must stay outside the archive');
}
const archived = relative => JSON.parse(files[relative].utf8);
const results = await json(dir + 'results.json');
const prepares = await json(dir + 'prepares.json');
const approval = await json(dir + 'approval.json');
assert.deepEqual(results, archived(dir + 'results.json'));
assert.equal(results.aggregate_score_generated, false);
assert.equal(results.collector_changes, 0);
let records = 0;
for (const result of results.results) {
  const run = prepares.find(r => r.case_id === result.case_id);
  const expected = archived(run.expected_file);
  const approved = approval.approvals.find(a => a.case_id === result.case_id);
  assert.equal(sha(await read(approved.expected_json)), approved.expected_sha256);
  assert.equal(sha(await read(approved.expected_md)), approved.expected_md_sha256);
  const runDir = `${run.source_root}/.sistack/runs/${run.run_id}/`;
  const full = archived(runDir + 'evidence/full-index.json');
  const trace = archived(runDir + 'evidence/trace.json');
  const stage = archived(runDir + 'evidence/stage.json');
  assert.equal(stage.tool_fingerprint, freeze.tool_fingerprint);
  assert.equal(sha(Buffer.from(files[runDir + 'evidence/full-index.json'].utf8)), result.raw_index_sha256);
  assert.equal(sha(Buffer.from(files[runDir + 'evidence/index-query.json'].utf8)), result.raw_query_sha256);
  assert.deepEqual(validateManifest(archived(runDir + 'manifest.json')), []);
  assert.equal(result.manual_edges_added, 0);
  assert.equal(result.actual_edges_removed_within_scope, 0);
  let partition = 0;
  for (const group of expected.report_groups) {
    const projected = archived(runDir + `evidence/expected-${group}.json`);
    assert.deepEqual(projected.edges, expected.edges.filter(e => e.report_group === group));
    assert.deepEqual(projected.scope, expected.scope.filter(s => s.report_group === group));
    assert.equal(projected.approval_parent_sha256, approved.expected_sha256);
    partition += projected.edges.length;
    const recordFile = runDir + `first-${group}-eval.json`, record = archived(recordFile);
    assert.equal(files[recordFile].sha256, result.groups[group].eval_sha256);
    assert.equal(files[runDir + `evidence/expected-${group}.json`].sha256, result.groups[group].expected_projection_sha256);
    assert.equal(record.expected_sha256, result.groups[group].expected_projection_sha256);
    assert.equal(record.report_sha256, files[runDir + 'report.md'].sha256);
    assert.deepEqual(record.score, evalIndex(full, projected));
    assert.deepEqual(record.score, evalIndex(trace, projected));
    const s = result.groups[group];
    assert.deepEqual([s.status,s.matched,s.expected,s.false_negatives,s.false_positives,s.status_mismatches],
      [record.score.status,record.score.matched,record.score.expected_edges,record.score.false_negatives.length,
        record.score.false_positives.length,record.score.status_mismatches.length]);
    records++;
  }
  assert.equal(partition, expected.edges.length);
}
assert.equal(records, 4);
console.log(`PASS: frozen ${freeze.file_count} files, archive ${archive.files} files, ${records} native eval records; no collector rerun`);
