import path from 'node:path';
import { readdir, readFile, lstat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { Graph, sanitize, validateIndex } from './graph.mjs';
import { collectJava, linkJava } from './java.mjs';
import { collectMybatis, linkMappers } from './mybatis.mjs';
import { collectIbatis } from './ibatis.mjs';
import { collectSql } from './sql.mjs';
import { collectSpring } from './spring.mjs';
import { collectJs, linkJs } from './js.mjs';
import { collectJsp, linkJsp } from './jsp.mjs';
import { mapperSelection } from './config.mjs';
import { profileSelection } from './profiles.mjs';

const ignored = new Set(['.git', '.sistack', '.testbeds', 'node_modules', 'target', 'build', 'dist', '.idea', '.agents', '.claude', '.codex']);
const extensions = new Set(['.java', '.jsp', '.jspf', '.js', '.xml', '.sql', '.properties']);

export async function buildIndex(target, { progress = () => {} } = {}) {
  const started = performance.now(), root = path.resolve(target), graph = new Graph();
  if (!(await lstat(root)).isDirectory() || (await lstat(root)).isSymbolicLink()) throw new Error('대상은 심볼릭 링크가 아닌 디렉터리여야 합니다');
  const files = [];
  async function walk(dir, prefix = '') {
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const at = { file: relative, line: 1 };
      if (entry.isSymbolicLink()) { graph.skip(at, 'symlink', '링크를 따라가지 않음'); continue; }
      if (entry.isDirectory()) {
        if (ignored.has(entry.name) || relative === 'evals/private' || /(?:^|\/)src\/test$/.test(relative)) { graph.skip(at, 'excluded-directory', '생성물·비공개 사례·테스트·도구 폴더는 인덱싱 제외'); continue; }
        await walk(path.join(dir, entry.name), relative);
      } else if (entry.isFile()) {
        if (!extensions.has(path.extname(entry.name).toLowerCase())) { graph.skip(at, 'unsupported-extension', '지원 수집기 없음'); continue; }
        if (/\.min\.js$|(?:^|\/)vendor\//.test(relative)) { graph.skip(at, 'vendor-js', '벤더/minified JS는 분석 제외'); continue; }
        if ((await lstat(path.join(dir, entry.name))).size > 2 * 1024 * 1024) { graph.skip(at, 'file-size', '2 MiB 초과 파일은 메모리 제한으로 제외'); continue; }
        try {
          progress({ phase: 'read', file: relative });
          const bytes = await readFile(path.join(dir, entry.name));
          const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
          files.push({ file: relative, text, hash: createHash('sha256').update(bytes).digest('hex') });
        } catch { graph.skip(at, 'file-read-encoding', '파일 읽기 실패 또는 UTF-8 아님'); }
      }
    }
  }
  await walk(root);
  progress({ phase: 'collected-files', count: files.length });
  const classes = [], records = [], scripts = [], pages = [], xml = [];
  let processed = 0;
  for (const { file, text } of files) {
    progress({ phase: 'parse', file });
    const ext = path.extname(file).toLowerCase();
    try {
      if (ext === '.java') { const cls = collectJava(file, text, graph); if (cls) classes.push(cls); }
      else if (ext === '.xml') { records.push(...collectMybatis(file, text, graph), ...collectIbatis(file, text, graph)); xml.push({ file, text }); }
      else if (ext === '.sql') collectSql(file, text, graph);
      else if (ext === '.js') scripts.push(collectJs(file, text, graph));
      else if (ext === '.jsp' || ext === '.jspf') { const page = collectJsp(file, text, graph); pages.push(page); scripts.push(...page.inline); }
      processed++;
    } catch { graph.skip({ file, line: 1 }, 'parse-failure', `${ext} 구조 파싱 실패; 나머지 파일 계속 처리`); }
  }
  progress({ phase: 'link-spring' });
  graph.profiles = profileSelection(xml, files);
  collectSpring(classes, xml, graph);
  graph.mapperSelection = mapperSelection(xml, files, graph);
  progress({ phase: 'link-mappers' });
  linkMappers(records, classes, graph);
  progress({ phase: 'link-java' });
  linkJava(classes, graph);
  progress({ phase: 'link-jsp' });
  linkJsp(pages, scripts, graph);
  progress({ phase: 'link-js' });
  linkJs(scripts, pages, graph);
  progress({ phase: 'serialize' });
  const git = args => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true, timeout: 15000 });
  const revision = git(['rev-parse', 'HEAD']);
  const status = revision.status === 0 ? git(['status', '--porcelain', '--', '.']) : null;
  const index = sanitize({
    meta: { target: root.replaceAll('\\', '/'), source_revision: revision.status === 0 ? revision.stdout.trim() : null, source_dirty: status?.status === 0 ? Boolean(status.stdout.trim()) : null, created_at: new Date().toISOString(), indexer_version: '0.1.0', processed_files: processed, duration_ms: Math.round(performance.now() - started), source_files: Object.fromEntries(files.map(f => [f.file, f.hash])) },
    nodes: graph.nodes, edges: graph.edges, unresolved: graph.unresolved, skipped: graph.skipped
  });
  return validateIndex(index);
}

export function summarize(index) {
  const counts = key => index.edges.filter(e => e.status === key).length;
  const skipped = new Map();
  for (const item of index.skipped) skipped.set(item.pattern, (skipped.get(item.pattern) || 0) + 1);
  const { source_files, ...meta } = index.meta;
  return { ...meta, nodes: index.nodes.length, edges: index.edges.length, status: Object.fromEntries(['CONFIRMED', 'LIKELY', 'UNRESOLVED'].map(s => [s, counts(s)])), unresolved: index.unresolved.length, skipped: index.skipped.length, skipped_patterns: Object.fromEntries([...skipped].sort((a, b) => b[1] - a[1])) };
}
