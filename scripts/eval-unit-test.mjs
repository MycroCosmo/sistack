import path from 'node:path';
import { readFile, mkdir, copyFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { root, isMain, cli, files } from './common.mjs';
import { save, json, digest, inside, checkSources } from '../lib/trace/io.mjs';
import { proposalPaths } from '../lib/debug/proposal.mjs';
import { sourceHashes, runTests } from '../lib/unit/run.mjs';

export async function copyUnitProject(source, destination) {
  const hashes = await sourceHashes(source);
  await mkdir(destination); // 기존 프로젝트/실행 디렉터리를 덮어쓰지 않는다.
  for (const name of Object.keys(hashes)) {
    const target = await inside(destination, name); await mkdir(path.dirname(target), { recursive: true });
    await copyFile(await inside(source, name), target);
  }
  await checkSources(source, hashes);
  return hashes;
}

export async function installUnitTests(project, generated = path.join(root, 'evals/unit/generated')) {
  for (const file of await files(generated)) {
    if (!file.endsWith('.java')) continue;
    const dest = await inside(project, `src/test/java/kr/sistack/board/${file.replaceAll('\\', '/')}`);
    await mkdir(path.dirname(dest), { recursive: true });
    await save(dest, await readFile(path.join(generated, file), 'utf8'));
  }
}

export async function applyUnitPatch(project, patchFile) {
  const diff = await readFile(patchFile, 'utf8'), targets = proposalPaths(diff);
  const before = {};
  for (const file of targets) {
    if (!file.startsWith('src/main/')) throw new Error('평가 패치는 src/main의 기존 파일만 수정할 수 있습니다');
    await inside(project, file);
    before[file] = digest(await readFile(path.join(project, file)));
  }
  const scratch = await mkdtemp(path.join(os.tmpdir(), 'sistack-unit-patch-'));
  try {
    for (const file of targets) {
      const dest = await inside(scratch, file); await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(path.join(project, file), dest);
    }
    for (const check of [true, false]) {
      const p = spawnSync('git', ['-c', 'core.autocrlf=false', 'apply', ...(check ? ['--check'] : []), '--ignore-space-change', path.resolve(patchFile)], {
        cwd: scratch, windowsHide: true, encoding: 'utf8', timeout: 15000 });
      if (p.status !== 0) throw new Error('패치 적용 실패. 탐지 점수로 세지 않습니다');
    }
    for (const file of targets) {
      if (digest(await readFile(path.join(scratch, file))) === before[file]) throw new Error('패치 성공 코드가 나왔지만 대상 파일이 변경되지 않았습니다');
    }
    for (const file of targets) await copyFile(path.join(scratch, file), path.join(project, file));
  } finally {
    if (path.dirname(scratch) !== path.resolve(os.tmpdir()) || !path.basename(scratch).startsWith('sistack-unit-patch-')) throw new Error('임시 경로 범위 오류');
    await rm(scratch, { recursive: true, force: true });
  }
  return digest(diff);
}

export function detection(baseline, buggy) {
  if (baseline.status !== 'PASS' || buggy.execution_status !== 'TEST_FAILURE') return buggy.status === 'PASS' && baseline.status === 'PASS' ? 'MISSED' : 'BLOCKED';
  const expected = new Set(baseline.tests.map(t => `${t.class_name}#${t.method_name}`));
  if (buggy.tests.length !== expected.size || buggy.tests.some(t => !expected.has(`${t.class_name}#${t.method_name}`))) return 'BLOCKED';
  return buggy.tests.some(t => t.status === 'FAIL' || t.status === 'ERROR') ? 'DETECTED' : 'BLOCKED';
}

export async function evaluateUnitCase(spec, config) {
  if (!spec.source || !spec.output || !spec.id || !spec.baseline_results) throw new Error('평가 source/output/id/baseline 필요');
  await mkdir(spec.output); // 새 결과만 허용
  const project = path.join(spec.output, 'project');
  const original = await copyUnitProject(spec.source, project);
  await installUnitTests(project, spec.generated);
  const baseline = await json(spec.baseline_results);
  const patchHash = spec.patch ? await applyUnitPatch(project, spec.patch) : null;
  const prefix = spec.run_prefix ?? spec.id;
  const buggy = await runTests(project, { ...config, run_id: `${prefix}-buggy` });
  const detected = detection(baseline, buggy.result);
  let repaired = null;
  if (detected === 'DETECTED' && spec.proposal) {
    const diagnosis = await json(spec.proposal);
    const repairPatch = path.join(spec.output, 'proposal.patch'); await save(repairPatch, diagnosis.proposal.diff);
    await applyUnitPatch(project, repairPatch);
    repaired = await runTests(project, { ...config, run_id: `${prefix}-repaired`, parent_run_ids: spec.parent_run_ids ?? [] });
  }
  await checkSources(spec.source, original);
  const result = { case_id: spec.id, eligible: spec.eligible, detection: detected, patch_sha256: patchHash,
    buggy_status: buggy.result.status, buggy_summary: buggy.result.summary,
    repair_status: repaired?.result.status ?? 'NOT_RUN', repair_summary: repaired?.result.summary ?? null,
    source_unchanged: true, buggy_results: path.relative(spec.output, path.join(buggy.run, 'test-results.json')).replaceAll('\\', '/'),
    repaired_results: repaired ? path.relative(spec.output, path.join(repaired.run, 'test-results.json')).replaceAll('\\', '/') : null };
  await save(path.join(spec.output, 'evaluation.json'), result);
  return result;
}

export async function freezeUnit(output, { protocol } = {}) {
  const names = ['package.json', 'prompts/M4.md', ...await files(path.join(root, 'lib')).then(a => a.map(p => `lib/${p}`)),
    ...await files(path.join(root, 'skills/si-unit-test')).then(a => a.map(p => `skills/si-unit-test/${p}`)),
    ...await files(path.join(root, 'scripts')).then(a => a.map(p => `scripts/${p}`)),
    ...await files(path.join(root, 'schemas')).then(a => a.map(p => `schemas/${p}`)),
    ...await files(path.join(root, 'test')).then(a => a.map(p => `test/${p}`)),
    ...await files(path.join(root, 'evals/unit')).then(a => a.map(p => `evals/unit/${p}`))];
  for (const project of ['legacy-board', 'legacy-board-thymeleaf']) names.push(...Object.keys(await sourceHashes(path.join(root, 'examples', project))).map(p => `examples/${project}/${p}`));
  const hashes = {};
  for (const name of names.map(p => p.replaceAll('\\', '/')).sort()) hashes[name] = digest(await readFile(await inside(root, name)));
  const rev = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (rev.status !== 0) throw new Error('동결 revision 없음');
  if (protocol) {
    for (const testbed of ['legacy-board', 'legacy-board-thymeleaf']) {
      const dir = protocol.generations[testbed]; await inside(root, dir);
      for (const name of ['coverage-plan.json', 'test-plan.json']) if (!Object.hasOwn(hashes, `${dir}/${name}`)) throw new Error('동결 목록에 생성 계획이 없습니다');
    }
    await inside(path.join(root, 'evals/private'), protocol.first_output.replace(/^evals\/private\//, ''));
  }
  const record = { created_at: new Date().toISOString(), revision: rev.stdout.trim(), files: hashes, ...(protocol ? { protocol } : {}),
    policy: '신규 패치 3건의 원문을 열람하지 않고 동결 테스트만 실행. 첫 결과 보존. 학습과 합산 금지' };
  await save(output, record); return { revision: record.revision, files: names.length };
}

export async function runBlindUnit(spec, config) {
  const privateRoot = path.join(root, 'evals/private');
  const privatePath = file => inside(privateRoot, path.relative(privateRoot, path.resolve(file)).replaceAll('\\', '/'));
  await privatePath(spec.output);
  const frozen = await json(spec.freeze);
  const canonical = frozen.protocol?.first_output ?? 'evals/private/m4-heldout-first';
  if (path.resolve(spec.output) !== path.join(root, canonical)) throw new Error('첫 held-out 출력은 해당 동결의 지정 경로로 고정합니다');
  if (config.test_pattern !== 'M4*Test' || !frozen.protocol && path.resolve(config.plan_file) !== path.join(root, 'evals/unit/test-plan.json')) throw new Error('동결 테스트 전체와 동결된 계획만 실행합니다');
  await checkSources(root, frozen.files);
  if (spec.phase !== 'first' || !Array.isArray(spec.cases) || spec.cases.length !== 3 || new Set(spec.cases.map(c => c.id)).size !== 3) throw new Error('신규 held-out 첫 평가 3건만 허용');
  for (const c of spec.cases) {
    if (!/^[a-z0-9-]+$/.test(c.id) || !['legacy-board', 'legacy-board-thymeleaf'].includes(c.testbed)) throw new Error('held-out 메타데이터 오류');
    await privatePath(c.patch);
  }
  // 패치 내용은 도구 내부에서만 읽으며 콘솔에는 탐지 여부만 반환한다.
  await mkdir(spec.output);
  await save(path.join(spec.output, 'started.json'), { frozen_revision: frozen.revision, created_at: new Date().toISOString() });
  const baselines = {};
  const configs = {}, generations = {};
  for (const testbed of new Set(spec.cases.map(c => c.testbed))) {
    const project = path.join(spec.output, `baseline-${testbed}`);
    const generation = frozen.protocol?.generations[testbed];
    generations[testbed] = generation ? path.join(root, generation, 'generated') : undefined;
    configs[testbed] = generation ? { ...config, plan_file: path.join(root, generation, 'test-plan.json'), coverage_plan: path.join(root, generation, 'coverage-plan.json') } : config;
    await copyUnitProject(path.join(root, 'examples', testbed), project); await installUnitTests(project, generations[testbed]);
    const b = await runTests(project, { ...configs[testbed], run_id: 'blind-baseline' });
    if (b.result.status !== 'PASS') throw new Error('held-out 정상 기준선 BLOCKED');
    baselines[testbed] = path.join(b.run, 'test-results.json');
  }
  const results = [];
  for (const c of spec.cases) {
    try {
      const r = await evaluateUnitCase({ id: c.id, source: path.join(root, 'examples', c.testbed), patch: c.patch,
        output: path.join(spec.output, c.id), eligible: null, generated: generations[c.testbed], baseline_results: baselines[c.testbed] }, configs[c.testbed]);
      results.push({ case_id: c.id, detection: r.detection });
    } catch {
      results.push({ case_id: c.id, detection: 'BLOCKED' });
    }
    await save(path.join(spec.output, `${c.id}-first-outcome.json`), results.at(-1));
  }
  await checkSources(root, frozen.files);
  await save(path.join(spec.output, 'first-score.json'), { dataset: 'held-out', phase: 'first', frozen_revision: frozen.revision,
    frozen_sha256: digest(await readFile(spec.freeze)), created_at: new Date().toISOString(), results });
  return results;
}

if (isMain(import.meta.url)) await cli(async () => {
  const [mode, specFile, configFile] = process.argv.slice(2);
  if (mode === 'freeze') console.log(JSON.stringify(await freezeUnit(specFile, configFile ? await json(configFile) : {})));
  else if (mode === 'training') {
    const result = await evaluateUnitCase(await json(specFile), await json(configFile));
    console.log(JSON.stringify({ case_id: result.case_id, detection: result.detection, repair_status: result.repair_status }));
  } else if (mode === 'held-out') console.log(JSON.stringify(await runBlindUnit(await json(specFile), await json(configFile))));
  else throw new Error('사용법: eval-unit-test.mjs training|held-out <spec> <config> | freeze <output>');
});
