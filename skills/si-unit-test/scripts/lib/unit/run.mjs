import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { readdir, readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { StringDecoder } from 'node:string_decoder';
import { detectEnvironment } from './env.mjs';
import { parseSurefire, summarize, validateTestResults } from './results.mjs';
import { save, json, digest, inside, noLinks } from '../trace/io.mjs';
import { mask } from '../mask/index.mjs';
import { validateManifest } from '../manifest/index.mjs';
import { coverageSummary } from './coverage.mjs';

export async function sourceHashes(project, prefix = '') {
  await noLinks(path.join(project, prefix));
  const hashes = {};
  for (const e of await readdir(path.join(project, prefix), { withFileTypes: true })) {
    if (e.isSymbolicLink()) throw new Error('소스 링크 금지');
    const p = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory() && !['.git', '.sistack', 'target', 'node_modules', '.agents', '.claude'].includes(e.name)) Object.assign(hashes, await sourceHashes(project, p));
    else if (e.isFile()) hashes[p] = digest(await readFile(path.join(project, p)));
  }
  return Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b, 'en')));
}

async function executeMaven(project, config) {
  const args = ['-o', '-B', '-q', '-Dfile.encoding=UTF-8', '-DargLine=-Dfile.encoding=UTF-8', `-Dtest=${config.test_pattern}`, '-DfailIfNoTests=true', 'test'];
  const windows = process.platform === 'win32';
  const child = spawn(windows ? 'powershell.exe' : config.maven, windows ? ['-NoProfile', '-NonInteractive', '-Command',
    '[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); & $env:SISTACK_MAVEN -o -B -q "-Dfile.encoding=UTF-8" "-DargLine=-Dfile.encoding=UTF-8" "-Dtest=$env:SISTACK_TEST_PATTERN" "-DfailIfNoTests=true" test; exit $LASTEXITCODE'] : args,
  { cwd: project, windowsHide: true, env: { ...process.env, JAVA_HOME: config.java_home, SISTACK_MAVEN: config.maven,
    SISTACK_TEST_PATTERN: config.test_pattern }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '', timedOut = false;
  const decoders = [new StringDecoder('utf8'), new StringDecoder('utf8')];
  for (const [i, stream] of [child.stdout, child.stderr].entries()) stream.on('data', bytes => { log = (log + decoders[i].write(bytes)).slice(-2000000); });
  const timer = setTimeout(() => {
    timedOut = true;
    if (windows) spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else child.kill('SIGTERM');
  }, 180000);
  const code = await new Promise(resolve => { child.once('error', () => resolve(null)); child.once('close', resolve); });
  clearTimeout(timer);
  return { code, timedOut, log: mask(log + decoders.map(d => d.end()).join('')) };
}

export async function runTests(project, config) {
  project = path.resolve(project);
  if (config.allow_test_execution !== true) throw new Error('테스트 실행에 대한 사용자 승인 필요');
  if (!/^[\w-]{1,128}$/.test(config.run_id ?? '') || !/^[\w*?,.$]+$/.test(config.test_pattern ?? '')) throw new Error('run-id/test pattern 오류');
  const run = await inside(project, `.sistack/runs/${config.run_id}`);
  await mkdir(run, { recursive: true });
  await save(path.join(run, 'started.json'), { created_at: new Date().toISOString() });
  const detected = await detectEnvironment(project), plan = await json(config.plan_file);
  const before = await sourceHashes(project), reports = path.join(run, 'evidence/surefire');
  const coveragePlan = config.coverage_plan ? await json(config.coverage_plan) : null;
  if (coveragePlan) for (const [file, hash] of Object.entries(coveragePlan.generated_files ?? {})) {
    if (before[file] !== hash) throw new Error('coverage-plan과 실제 생성 테스트가 다릅니다');
  }
  await mkdir(reports, { recursive: true });
  const environment = { java_runtime: 'UNKNOWN', java_target: detected.java_target ?? 'UNKNOWN', build_tool: 'Maven',
    junit: 'UNKNOWN', mockito: 'UNKNOWN', spring_test: 'UNKNOWN', h2: 'UNKNOWN', ...detected.libraries };
  let unverified = [...detected.unverified], tests = [], execution_status = 'BLOCKED';
  let exitCode = null;
  if (detected.status === 'PASS') {
    const java = spawnSync(path.join(config.java_home ?? '', 'bin', process.platform === 'win32' ? 'java.exe' : 'java'), ['-version'], { encoding: 'utf8', windowsHide: true, timeout: 10000 });
    if (java.status !== 0 || !path.isAbsolute(config.maven ?? '')) unverified.push('JDK/Maven 경로 확인 필요');
    else {
      environment.java_runtime = mask((java.stderr || java.stdout).split(/\r?\n/)[0]);
      const workspace = path.join(run, 'evidence/workspace'); await mkdir(workspace);
      for (const file of Object.keys(before)) {
        const dest = await inside(workspace, file); await mkdir(path.dirname(dest), { recursive: true });
        await copyFile(await inside(project, file), dest);
      }
      const executed = await executeMaven(workspace, config); exitCode = executed.code;
      await save(path.join(run, 'evidence/maven.txt'), executed.log);
      const freshReports = path.join(workspace, 'target/surefire-reports');
      const reportNames = await readdir(freshReports).catch(e => { if (e.code === 'ENOENT') return []; throw e; });
      for (const file of reportNames.filter(n => /\.(?:txt|dump|dumpstream)$/.test(n))) {
        const filename = path.join(freshReports, file); await noLinks(filename);
        await writeFile(filename, mask(await readFile(filename, 'utf8')));
      }
      for (const file of reportNames.filter(n => /^TEST-.*\.xml$/.test(n)).sort()) {
        const filename = path.join(freshReports, file), xml = await readFile(filename, 'utf8');
        // 마스킹된 XML만 보존하며 system-out/properties도 원문으로 남기지 않는다.
        await writeFile(filename, mask(xml));
        await save(path.join(reports, file), mask(xml));
        try { tests.push(...parseSurefire(xml, plan, `evidence/surefire/${file}`)); }
        catch { unverified.push('Surefire XML/한국어 테스트 계획 계약 오류'); }
      }
      const complete = tests.length > 0 && Object.keys(plan).length === tests.length &&
        new Set(tests.map(t => `${t.class_name}#${t.method_name}`)).size === tests.length &&
        tests.every(t => Object.hasOwn(plan, `${t.class_name}#${t.method_name}`));
      if (executed.timedOut || executed.code === null) unverified.push('Maven 실행 실패 또는 시간 초과');
      if (!complete) unverified.push('예정 테스트가 모두 실행되지 않음. 빌드/실행 오류이며 버그 탐지로 세지 않음');
      execution_status = unverified.length ? 'BUILD_FAILURE' : executed.code === 0 ? 'SUCCESS' : tests.some(t => ['FAIL', 'ERROR'].includes(t.status)) ? 'TEST_FAILURE' : 'BUILD_FAILURE';
    }
  }
  if (JSON.stringify(before) !== JSON.stringify(await sourceHashes(project))) throw new Error('테스트 실행 중 소스/pom 변경');
  const summary = summarize(tests);
  const status = ['BLOCKED', 'BUILD_FAILURE'].includes(execution_status) ? 'BLOCKED' : summary.failed || summary.errors ? 'FAIL' : summary.skipped ? 'PARTIAL' : 'PASS';
  const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: project, encoding: 'utf8', windowsHide: true });
  const result = { schema_version: '1.0.0', run_id: config.run_id, created_at: new Date().toISOString(),
    source_revision: config.source_revision ?? (revision.status === 0 ? revision.stdout.trim() : null), status, execution_status,
    environment, summary, tests, unverified: [...new Set(unverified)] };
  const errors = validateTestResults(result); if (errors.length) throw new Error(`결과 스키마 오류 ${errors.join(', ')}`);
  await save(path.join(run, 'test-results.json'), result);
  const coverage = coveragePlan ? coverageSummary(coveragePlan, tests) : null;
  if (coverage) {
    await save(path.join(run, 'coverage-plan.json'), coveragePlan);
    await save(path.join(run, 'coverage-results.json'), coverage);
  }
  await save(path.join(run, 'evidence/execution.json'), { exit_code: exitCode, source_files: before, pom_unchanged: true, test_pattern: config.test_pattern, plan });
  const manifest = { schema_version: '1.0.0', run_id: config.run_id, skill: 'si-unit-test', created_at: result.created_at,
    source_revision: result.source_revision, status, inputs: { target: config.test_pattern },
    evidence: [{ path: 'test-results.json', level: tests.length ? 4 : 2, description: '생성 테스트 실행 결과. 앱/운영 환경 검증 아님' },
      ...(coverage ? [{ path: 'coverage-results.json', level: tests.length ? 4 : 2, description: '정상 소스에서 도출한 계획 대비 실제 테스트 실행·통과 충족률' }] : [])],
    unverified: result.unverified, next_actions: status === 'PASS' ? [] : ['실패·미실행 사유 검토'],
    ...(config.parent_run_ids ? { parent_run_ids: config.parent_run_ids } : {}) };
  if (validateManifest(manifest).length) throw new Error('manifest 계약 오류');
  await save(path.join(run, 'manifest.json'), manifest);
  await save(path.join(run, 'report.md'), `> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.\n\n# 단위 테스트 실행\n\n상태: ${status}\n\n실행 ${summary.total}건, 통과 ${summary.passed}, 실패 ${summary.failed}, 오류 ${summary.errors}, 건너뜀 ${summary.skipped}.\n\nM5 입력: [test-results.json](test-results.json)\n\n${coverage ? `계획 ${coverage.planned}개 대비 생성 ${coverage.generated}, 실행 ${coverage.executed} (${coverage.planned ? (coverage.executed * 100 / coverage.planned).toFixed(1) : '0.0'}%), 통과 ${coverage.passed}, 미해결 ${coverage.unresolved}. 이는 계획 테스트 충족률이며 JVM 계측 코드 커버리지가 아닙니다.\n\n` : ''}${result.unverified.join('\n')}\n`);
  return { run, result };
}
