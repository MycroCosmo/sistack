import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { cli, isMain, root, skillDirs, noLinks } from './common.mjs';

function scalar(raw) {
  const value = raw.trim();
  if (value.startsWith('"')) {
    try { const parsed = JSON.parse(value); if (typeof parsed === 'string') return parsed; } catch { /* 아래에서 거부 */ }
    throw new Error('큰따옴표 문자열은 JSON 문자열 문법을 사용하세요');
  }
  if (value.startsWith("'")) {
    if (!/^'(?:[^']|'')*'$/.test(value)) throw new Error('잘못된 작은따옴표 문자열');
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (!value || /^[\[\]{}&*!|>@`%]/.test(value) || /:\s|\s#/.test(value) || /^(?:true|false|null|~|[-+]?\d+(?:\.\d+)?)$/i.test(value)) throw new Error('지원하지 않는 YAML 값: 문자열에 따옴표를 사용하세요');
  return value;
}

export function frontmatter(text) {
  const lines = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
  if (lines[0] !== '---') throw new Error('frontmatter 시작 구분자 누락');
  const end = lines.indexOf('---', 1);
  if (end < 0) throw new Error('frontmatter 종료 구분자 누락');
  const data = Object.create(null);
  for (let i = 1; i < end; i++) {
    if (!lines[i].trim() || lines[i].trim().startsWith('#')) continue;
    const match = /^([a-z][a-z-]*):(?:\s+(.*))?$/.exec(lines[i]);
    if (!match || Object.hasOwn(data, match[1])) throw new Error('잘못되거나 중복된 frontmatter 필드');
    const [, key, raw = ''] = match;
    if (key === 'metadata' && !raw) {
      const metadata = Object.create(null);
      while (i + 1 < end && /^  \S/.test(lines[i + 1])) {
        const pair = /^  ([\w.-]+):\s+(.+)$/.exec(lines[++i]);
        if (!pair || Object.hasOwn(metadata, pair[1])) throw new Error('잘못된 metadata');
        metadata[pair[1]] = scalar(pair[2]);
      }
      data[key] = metadata;
    } else if (/^[>|]-?$/.test(raw)) {
      const block = [];
      while (i + 1 < end && (/^  /.test(lines[i + 1]) || !lines[i + 1].trim())) block.push(lines[++i].slice(2));
      data[key] = block.join(raw[0] === '>' ? ' ' : '\n').trim();
    } else data[key] = scalar(raw);
  }
  return { data, body: lines.slice(end + 1).join('\n').trim() };
}

export async function validateSkill(dir) {
  await noLinks(dir);
  const { data, body } = frontmatter(await readFile(path.join(dir, 'SKILL.md'), 'utf8'));
  const errors = [];
  const allowed = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']);
  for (const key of Object.keys(data)) if (!allowed.has(key)) errors.push('비표준 frontmatter 필드');
  if (typeof data.name !== 'string' || data.name.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.name)) errors.push('name 규칙 위반');
  if (data.name !== path.basename(dir)) errors.push('name과 폴더명 불일치');
  if (typeof data.description !== 'string' || !data.description.trim() || [...data.description].length > 1024) errors.push('description 길이 위반');
  if (data.compatibility !== undefined && (!data.compatibility.trim() || [...data.compatibility].length > 500)) errors.push('compatibility 길이 위반');
  if (body.split('\n').length > 300) errors.push('본문 300줄 초과');
  const refs = new Set([...body.matchAll(/(?:references|scripts)\/[A-Za-z0-9_./-]+/g)].map((m) => m[0]));
  for (const ref of refs) {
    const target = path.resolve(dir, ref);
    if (!target.startsWith(path.resolve(dir) + path.sep)) { errors.push('참조 경로 이탈'); continue; }
    try { await noLinks(target); if (!(await stat(target)).isFile()) errors.push('참조는 파일이어야 합니다'); }
    catch { errors.push('참조 파일 누락 또는 지원하지 않는 경로'); }
  }
  return errors;
}

export async function validateSkills(base = path.join(root, 'skills')) {
  const dirs = await skillDirs(base);
  if (!dirs.length) throw new Error('검증할 스킬이 없습니다');
  for (const dir of dirs) {
    const errors = await validateSkill(dir);
    if (errors.length) throw new Error(`${path.basename(dir)}: ${errors.join(', ')}`);
  }
  return dirs;
}

if (isMain(import.meta.url)) await cli(async () => {
  if (process.argv.length > 3) throw new Error('사용법: node scripts/validate-skills.mjs [skills-dir]');
  const dirs = await validateSkills(process.argv[2]);
  console.log(`PASS: 스킬 ${dirs.length}개`);
});
