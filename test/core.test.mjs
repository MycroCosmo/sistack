import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, cp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { mask } from '../lib/mask/index.mjs';
import { validateManifest } from '../scripts/validate-manifest.mjs';
import { validateSkill, frontmatter } from '../scripts/validate-skills.mjs';
import { syncShared } from '../scripts/sync-shared.mjs';
import { install, destination } from '../scripts/install.mjs';
import { root, exists } from '../scripts/common.mjs';

async function temporary(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'sistack-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('합성 개인정보·비밀값을 제거하고 마스킹은 재실행해도 같다', () => {
  // 전부 테스트 전용 합성 값이다. 실제 사용자 데이터는 테스트에 넣지 않는다.
  const values = ['900101-1234567', '010-0000-0000', '02 000 0000', '+82-10-0000-0000',
    'nobody@example.invalid', '1111 2222 3333 4444', '111-222-333333', '123456789012'];
  for (const value of values) assert.equal(mask(value), '[REDACTED]');
  for (const value of ['password=fixture', 'secret: "fixture with spaces"', '"access_token":"fixture"',
    'jdbc:postgresql://localhost/test?password=fixture&user=local', 'jdbc:oracle:thin:local/fixture@localhost:1521/test',
    'Authorization: Bearer fixture', '계좌번호: 12345678', '카드번호=1111-2222-3333-4444']) {
    const result = mask(value);
    assert.ok(result.includes('[REDACTED]'));
    assert.ok(!result.includes('fixture'));
    assert.equal(mask(result), result);
  }
});

test('오탐 경계: 날짜·행번호·SQL과 일반 메시지를 보존', () => {
  const text = '2026-10-27 BoardService.java:42 SELECT board_id FROM board WHERE id=123 LIMIT 20';
  assert.equal(mask(text), text);
  assert.equal(mask('count=123456789'), 'count=123456789');
  assert.throws(() => mask({ password: 'fixture' }), TypeError);
});

const manifest = () => ({ schema_version: '1.0.0', run_id: 'test-001', skill: 'si-example',
  created_at: '2026-10-27T12:00:00+09:00', source_revision: null, status: 'PARTIAL', inputs: {},
  evidence: [{ path: 'evidence/check.txt', level: 4, description: '합성 설치 검증' }],
  unverified: ['실제 앱 미검증'], next_actions: ['검토'] });

test('manifest 필수 필드·상태·증거·날짜·연계 필드를 검증', () => {
  assert.deepEqual(validateManifest({ ...manifest(), parent_run_ids: ['parent-001'] }), []);
  for (const field of Object.keys(manifest())) {
    const value = manifest(); delete value[field]; assert.ok(validateManifest(value).length);
  }
  for (const change of [{ status: 'OK' }, { created_at: '2026-02-30T12:00:00Z' }, { created_at: 'yesterday' },
    { evidence: [{ path: '', level: 6, description: '' }] }, { inputs: [] }, { extra: 'field' },
    { parent_run_ids: ['duplicate', 'duplicate'] }, { source_revision: '' }, { unverified: [42] }]) {
    assert.ok(validateManifest({ ...manifest(), ...change }).length);
  }
  assert.throws(() => validateManifest({}, { unsupported: true }));
});

test('manifest CLI는 성공·실패 종료 코드를 반환하고 잘못된 JSON 내용을 출력하지 않는다', async (t) => {
  const dir = await temporary(t), file = path.join(dir, 'manifest.json');
  await writeFile(file, JSON.stringify(manifest()));
  let result = spawnSync(process.execPath, [path.join(root, 'scripts/validate-manifest.mjs'), file], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  await writeFile(file, '{"token":"fixture"');
  result = spawnSync(process.execPath, [path.join(root, 'scripts/validate-manifest.mjs'), file], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.ok(!result.stderr.includes('fixture'));
});

test('스킬 이름·설명·본문·참조의 잘못된 입력을 거부', async (t) => {
  const dir = path.join(await temporary(t), 'si-example');
  await mkdir(dir);
  const file = path.join(dir, 'SKILL.md');
  const valid = '---\nname: si-example\ndescription: "설치 확인"\n---\n# 안내';
  await writeFile(file, valid); assert.deepEqual(await validateSkill(dir), []);
  for (const text of [valid.replace('name: si-example', 'name: si--example'), valid.replace('"설치 확인"', '""'),
    valid.replace('"설치 확인"', '"' + '가'.repeat(1025) + '"'), valid + '\nline'.repeat(301),
    valid + '\n[sample](references/missing.md)', valid + '\n`references/../../escape.md`']) {
    await writeFile(file, text); assert.ok((await validateSkill(dir)).length);
  }
  assert.equal(frontmatter('---\nname: si-example\ndescription: >\n  설치\n  확인\nmetadata:\n  version: "1"\n---\n본문').data.description, '설치 확인');
  assert.throws(() => frontmatter('---\nname: one\nname: two\n---\n'));
  assert.throws(() => frontmatter('---\nname: [one]\n---\n'));
});

test('네 기본 설치 경로와 명시 dest를 결정', () => {
  for (const target of ['codex', 'claude']) for (const scope of ['repo', 'user']) {
    const expected = path.resolve(scope === 'repo' ? 'project' : 'user', target === 'codex' ? '.agents' : '.claude', 'skills');
    assert.equal(destination({ target, scope, cwd: 'project', home: 'user' }), expected);
  }
  assert.equal(destination({ target: 'codex', scope: 'repo', dest: 'override' }), path.resolve('override'));
  assert.throws(() => destination({ target: 'other', scope: 'repo' }));
});

test('공통 모듈 차이를 탐지하고 단독 설치·충돌 보존·명시적 덮어쓰기를 실제 확인', async (t) => {
  const base = await temporary(t);
  await cp(path.join(root, 'skills'), path.join(base, 'skills'), { recursive: true });
  await cp(path.join(root, 'lib'), path.join(base, 'lib'), { recursive: true });
  await syncShared({ base, check: true });
  const copied = path.join(base, 'skills/si-example/scripts/lib/mask/index.mjs');
  await writeFile(copied, 'stale');
  await assert.rejects(syncShared({ base, check: true }));
  await syncShared({ base });
  await syncShared({ base, check: true });
  const dest = path.join(base, 'installed');
  const options = { target: 'codex', scope: 'repo', dest };
  assert.equal(await install(options, base), 1);
  const module = await import(pathToFileURL(path.join(dest, 'si-example/scripts/lib/mask/index.mjs')).href);
  assert.equal(module.mask('secret=fixture'), 'secret=[REDACTED]');
  const result = spawnSync(process.execPath, [path.join(dest, 'si-example/scripts/check.mjs')], { cwd: dest, encoding: 'utf8' });
  assert.equal(result.status, 0);
  const installed = path.join(dest, 'si-example/SKILL.md');
  await writeFile(installed, 'local customization');
  await assert.rejects(install(options, base));
  assert.equal(await readFile(installed, 'utf8'), 'local customization');
  await install({ ...options, force: true }, base);
  assert.equal(await readFile(installed, 'utf8'), await readFile(path.join(base, 'skills/si-example/SKILL.md'), 'utf8'));
  await assert.rejects(install({ ...options, dest: path.join(base, 'skills') }, base));
  await writeFile(path.join(base, 'skills/si-example/scripts/lib/mask/stale.mjs'), 'stale');
  await assert.rejects(syncShared({ base }));
  assert.ok(await exists(path.join(base, 'skills/si-example/scripts/lib/mask/stale.mjs')));
});
