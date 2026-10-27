import path from 'node:path';
import os from 'node:os';
import { readFile, writeFile, readdir, mkdir, mkdtemp, copyFile, lstat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { root, isMain, cli } from './common.mjs';
import { json, save, digest, inside, noLinks, checkSources } from '../lib/trace/io.mjs';
import { debugFingerprint } from '../lib/debug/index.mjs';
import { mask } from '../lib/mask/index.mjs';
import { validateManifest } from '../lib/manifest/index.mjs';

const ignored = new Set(['.git', 'target', '.sistack', 'node_modules', '.agents', '.claude']);
async function inventory(base, prefix = '') {
  const result = [];
  for (const entry of (await readdir(path.join(base, prefix), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (entry.isSymbolicLink()) throw new Error('평가 소스의 링크는 지원하지 않습니다');
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory() && !ignored.has(entry.name)) result.push(...await inventory(base, relative));
    else if (entry.isFile()) result.push(relative);
  }
  return result;
}

export async function prepareCase(id, { repository = root } = {}) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error('case-id 오류');
  const caseDir = await inside(repository, `evals/debug/cases/${id}`), spec = await json(path.join(caseDir, 'case.json'));
  if (spec.id !== id || !['legacy-board', 'legacy-board-thymeleaf'].includes(spec.testbed) || !['patch', 'log-only'].includes(spec.mode)) throw new Error('테스트베드 계약 오류');
  const source = await inside(repository, `examples/${spec.testbed}`), names = await inventory(source);
  const hashes = Object.fromEntries(await Promise.all(names.map(async f => [f, digest(await readFile(await inside(source, f)))])));
  if (JSON.stringify(hashes) !== JSON.stringify(spec.source_files)) throw new Error('테스트베드 기준 소스 변경: 패치를 재검토하세요');
  const patchFile = path.join(caseDir, 'bug.patch'), patch = await readFile(patchFile, 'utf8');
  if (digest(patch) !== spec.patch_sha256) throw new Error('패치 해시 불일치');
  const headers = [...patch.matchAll(/^(---|\+\+\+) ([ab])\/(.+)$/gm)];
  if (spec.mode !== 'log-only' && (!headers.length || headers.length % 2)) throw new Error('수정 패치 형식 오류');
  if (/^(?:new file|deleted file|old mode|new mode|rename |copy |GIT binary)/m.test(patch)) throw new Error('기존 텍스트 파일 수정만 지원합니다');
  for (let i = 0; i < headers.length; i += 2) {
    if (headers[i][1] !== '---' || headers[i][2] !== 'a' || headers[i + 1][1] !== '+++' || headers[i + 1][2] !== 'b' || headers[i][3] !== headers[i + 1][3] || !names.includes(headers[i][3])) throw new Error('패치 대상 경로 오류');
    await inside(source, headers[i][3]);
  }
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'sistack-debug-'));
  for (const name of names) { const dest = await inside(temporary, name); await mkdir(path.dirname(dest), { recursive: true }); await copyFile(path.join(source, name), dest); }
  if (spec.mode !== 'log-only') {
    for (const args of [['apply', '--check', '--ignore-space-change', patchFile], ['apply', '--ignore-space-change', patchFile]]) {
      const p = spawnSync('git', ['-c', 'core.autocrlf=false', ...args], { cwd: temporary, encoding: 'utf8', windowsHide: true, timeout: 15000 });
      if (p.status !== 0) throw new Error('임시 복사본 패치 적용 실패');
    }
    for (const name of new Set(headers.map(h => h[3]))) {
      const file = await inside(temporary, name);
      await writeFile(file, (await readFile(file, 'utf8')).replaceAll('\r\n', '\n'));
    }
  } else if (patch.trim()) throw new Error('로그 전용 사례의 패치는 비어 있어야 합니다');
  await checkSources(source, hashes);
  await save(path.join(temporary, '.sistack/case.json'), { id, testbed: spec.testbed, source_files: hashes, patch_sha256: spec.patch_sha256, mode: spec.mode });
  return { id, project: temporary, testbed: spec.testbed, mode: spec.mode };
}

export async function freezeDebug(output, { repository = root } = {}) {
  const names = ['package.json', ...await inventory(path.join(repository, 'lib')).then(a => a.map(p => `lib/${p}`)),
    ...await inventory(path.join(repository, 'skills/si-debug')).then(a => a.map(p => `skills/si-debug/${p}`)),
    ...await inventory(path.join(repository, 'scripts')).then(a => a.map(p => `scripts/${p}`)),
    ...await inventory(path.join(repository, 'schemas')).then(a => a.map(p => `schemas/${p}`)),
    ...await inventory(path.join(repository, 'test')).then(a => a.map(p => `test/${p}`)),
    ...await inventory(path.join(repository, 'evals/debug')).then(a => a.filter(p => !p.endsWith('/expected.json')).map(p => `evals/debug/${p}`))];
  const files = Object.fromEntries(await Promise.all(names.sort().map(async f => [f, digest(await readFile(await inside(repository, f)))])));
  const rev = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8', windowsHide: true });
  if (rev.status !== 0) throw new Error('동결 revision 없음');
  const record = { created_at: new Date().toISOString(), revision: rev.stdout.trim(), tool_fingerprint: await debugFingerprint(), files };
  await save(output, record); return { revision: record.revision, files: names.length, output };
}

export async function scoreDebug(runDir, expectedFile, { dataset, output, freeze, repository = root, privateRoot = path.join(root, 'evals/private') } = {}) {
  if (!['training', 'held-out'].includes(dataset) || !output || !freeze) throw new Error('dataset/output/freeze 필요');
  const frozen = await json(freeze);
  await checkSources(repository, frozen.files);
  if (frozen.tool_fingerprint !== await debugFingerprint()) throw new Error('동결 도구 불일치');
  if (dataset === 'held-out') {
    // 비공개 원본·최초 결과는 private 경계 안에만 둔다. 콘솔에는 위치와 적중 여부만 반환한다.
    for (const file of [runDir, expectedFile, output]) {
      const relative = path.relative(path.resolve(privateRoot), path.resolve(file)).replaceAll('\\', '/');
      await inside(privateRoot, relative);
    }
  }
  const expected = await json(expectedFile);
  if (expected.review_status !== 'approved' || !expected.approved_by?.trim() || expected.dataset !== dataset || !/^[a-z0-9-]+$/.test(expected.case_id) || !Array.isArray(expected.locations) || !expected.locations.length) throw new Error('사용자 승인 정답만 채점합니다');
  if (!['CONFIRMED', 'LIKELY', 'UNRESOLVED'].includes(expected.status)) throw new Error('정답 상태 오류');
  const manifest = await json(path.join(runDir, 'manifest.json')), stage = await json(path.join(runDir, 'evidence/stage.json'));
  const diagnosis = await json(path.join(runDir, 'evidence/diagnosis.json')), report = await readFile(path.join(runDir, 'report.md'), 'utf8');
  if (manifest.skill !== 'si-debug' || validateManifest(manifest).length || stage.tool_fingerprint !== frozen.tool_fingerprint || !diagnosis.source_reviewed || !report.startsWith('> AI의 PASS는 PL/PM') || Date.parse(stage.created_at) < Date.parse(frozen.created_at)) throw new Error('동결 후 완료된 si-debug 실행이 필요합니다');
  if (!expected.source_files || !Object.keys(expected.source_files).length) throw new Error('정답 소스 해시 필요');
  const project = path.resolve(runDir, '../../..');
  await checkSources(project, stage.source_files);
  for (const [file, hash] of Object.entries(expected.source_files)) if (stage.source_files[file] !== hash) throw new Error('정답과 실행 소스 불일치');
  for (const p of expected.locations) if (!expected.source_files[p.file] || !Number.isInteger(p.line) || p.line < 1) throw new Error('정답 위치 계약 오류');
  await checkSources(project, expected.source_files, expected.locations);
  const locations = expected.locations.map(p => ({ file: p.file, line: p.line, hit: diagnosis.candidates.some(c => c.status === expected.status && c.locations.some(q => q.file === p.file && q.line === p.line)) }));
  const actual = diagnosis.candidates.flatMap(c => c.locations.map(p => ({ ...p, status: c.status })));
  const extras = actual.filter(p => !expected.locations.some(q => p.file === q.file && p.line === q.line && p.status === expected.status));
  const score = { locations, hit: locations.every(p => p.hit) && extras.length === 0, extra_locations: extras.map(({file, line}) => ({file, line})) };
  if (dataset === 'held-out') {
    const first = await inside(privateRoot, `${expected.case_id}/first-run.json`);
    await noLinks(first);
    try { await lstat(first); throw new Error('첫 실행이 이미 보존됐습니다. 후속 평가는 별도 승인 후 진행하세요'); } catch(e) { if (e.code !== 'ENOENT') throw e; }
    const snapshot = {};
    for (const file of await inventory(runDir)) snapshot[file] = mask(new TextDecoder('utf-8', { fatal: true }).decode(await readFile(await inside(runDir, file))));
    await save(first, { frozen, score, snapshot, expected_sha256: digest(await readFile(expectedFile)), recorded_at: new Date().toISOString() });
  }
  await save(output, { dataset, case_id: expected.case_id, score, frozen_revision: frozen.revision, tool_fingerprint: frozen.tool_fingerprint,
    run_id: manifest.run_id, expected_sha256: digest(await readFile(expectedFile)), report_sha256: digest(report),
    caveat: dataset === 'training' ? 'Codex 자기 작성 학습 세트. 일반화 성능이 아니다.' : '동결 구현 첫 실행. 실제 내용은 비공개 보존.' });
  return dataset === 'held-out' ? { locations: score.locations, hit: score.hit } : { dataset, case_id: expected.case_id, ...score };
}

if (isMain(import.meta.url)) await cli(async () => {
  const [command, ...args] = process.argv.slice(2);
  let result;
  if (command === 'prepare' && args.length === 1) result = await prepareCase(args[0]);
  else if (command === 'freeze' && args.length === 1) result = await freezeDebug(args[0]);
  else if (command === 'score' && args.length === 6) result = await scoreDebug(args[0], args[1], { dataset: args[2], output: args[3], freeze: args[4], privateRoot: args[5] });
  else throw new Error('사용법: eval-debug.mjs prepare <case-id> | freeze <새파일> | score <run-dir> <expected.json> <training|held-out> <새결과> <freeze.json> <private-root>');
  console.log(JSON.stringify(result, null, 2));
});
