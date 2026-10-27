import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { toolFingerprint } from '../../../lib/trace/index.mjs';
import { evalIndex } from '../../../lib/indexer/eval.mjs';
import { validateManifest } from '../../../lib/manifest/index.mjs';

const root=new URL('../../../',import.meta.url),read=relative=>readFile(new URL(relative,root));
const json=async relative=>JSON.parse(await read(relative));
const sha=b=>createHash('sha256').update(b).digest('hex');
const dir='docs/evidence/m2.5-v2/',baseline=await json(dir+'baseline.json');
for(const [file,hash]of Object.entries(baseline.files))assert.equal(sha(await read(file)),hash,file);
assert.equal(await toolFingerprint(),baseline.tool_fingerprint);
const protectedDiff=execFileSync('git',['diff','--name-only','7c4da1a','--','docs/evidence/m2.5-heldout-first','docs/evidence/m2.5-training',':(glob)evals/trace/**/expected*','examples/legacy-board-thymeleaf'],{cwd:fileURLToPath(root),encoding:'utf8',windowsHide:true});
assert.equal(protectedDiff.trim(),'','first records/expected/testbed changed');
async function archive(meta){
  const bytes=await read(meta.path);assert.equal(sha(bytes),meta.sha256);
  const payload=gunzipSync(bytes);assert.equal(sha(payload),meta.payload_sha256);
  const {files}=JSON.parse(payload);assert.equal(Object.keys(files).length,meta.files);
  for(const [file,item]of Object.entries(files))assert.equal(sha(Buffer.from(item.utf8)),item.sha256,file);
  return files;
}
const firstMeta=await json('docs/evidence/m2.5-heldout-first/archive.json');
assert.equal(firstMeta.sha256,baseline.first_archive_sha256);
const first=await archive(firstMeta),meta=await json(dir+'archive.json'),files=await archive(meta);
const archived=f=>JSON.parse(files[f].utf8);
const prepares=await json(dir+'prepares.json');let evals=0;
for(const run of prepares){
  const base=`${run.source_root}/.sistack/runs/${run.run_id}/`;
  const expected=archived(run.expected_file),index=archived(base+'evidence/full-index.json'),trace=archived(base+'evidence/trace.json');
  if(run.case_id==='thymeleaf-board-delete-ajax'){
    const nodes=new Map(trace.nodes.map(n=>[n.id,n]));
    const posts=trace.edges.filter(e=>e.kind==='requests'&&nodes.get(e.to).name==='POST /board/delete.do');
    assert.equal(posts.length,1,'default form/AJAX duplicate');
    for(const line of [12,39])assert.ok(posts[0].evidence.some(p=>p.file.endsWith('/board/detail.html')&&p.line===line),'form/AJAX proof '+line);
  }
  assert.equal(sha(await read(run.expected_file)),run.expected_sha256);
  assert.deepEqual(validateManifest(archived(base+'manifest.json')),[]);
  assert.equal(archived(base+'evidence/stage.json').tool_fingerprint,baseline.tool_fingerprint);
  if(expected.report_groups){
    for(const group of expected.report_groups){
      const projected=archived(base+`evidence/expected-${group}.json`),record=archived(base+`v2-${group}-eval.json`);
      assert.deepEqual(projected.edges,expected.edges.filter(e=>e.report_group===group));
      assert.deepEqual(projected.scope,expected.scope.filter(s=>s.report_group===group));
      assert.equal(projected.approval_parent_sha256,run.expected_sha256);
      assert.deepEqual(evalIndex(index,projected),record.score);assert.deepEqual(evalIndex(trace,projected),record.score);
      assert.equal(record.score.status,'PASS');evals++;
    }
  }else{
    const record=archived(base+'v2-eval.json');assert.deepEqual(evalIndex(index,expected),record.score);
    assert.deepEqual(evalIndex(trace,expected),record.score);assert.equal(record.score.status,'PASS');evals++;
  }
}
const regression=await json(dir+'legacy-regression.json');assert.equal(regression.results.length,8);
for(const r of regression.results){const expected=await json(`evals/trace/${r.case_id}/expected.json`);
  assert.deepEqual(evalIndex(archived(r.raw_scope),expected),r.score);assert.equal(r.status,'PASS');}
const runtime=await json(dir+'runtime.json');for(const [file,hash]of Object.entries(runtime.browser.screenshots))assert.equal(sha(await read(dir+file)),hash);
const results=await json(dir+'results.json');assert.equal(results.generalization_performance,false);assert.equal(results.aggregate_score_generated,false);
assert.deepEqual(results,archived(dir+'results.json'));
assert.equal(evals,7);assert.equal(Object.keys(first).length,49);
console.log(`PASS: v2 archive ${meta.files} files, native eval ${evals}, JSP regression 8; first 49 files and approved answers unchanged; no collector rerun`);
