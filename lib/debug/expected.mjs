import { readFile } from 'node:fs/promises';
import { inside, checkSources } from '../trace/io.mjs';
import { Graph } from '../indexer/graph.mjs';
import { collectJava } from '../indexer/java.mjs';
import { stripComments, hideStrings, closing, lineAt, attrs, xmlElements } from '../indexer/source.mjs';

export function coordinates(p) {
  return p.line === undefined ? { file: p.file, start: p.start, end: p.end } : { file: p.file, line: p.line };
}

export function matchesLocation(expected, actual) {
  return expected.file === actual.file && Number.isInteger(actual.line)
    && (expected.line === undefined ? actual.line >= expected.start && actual.line <= expected.end : actual.line === expected.line);
}

function bounds(point, count) {
  const start = point.line ?? point.start, end = point.line ?? point.end;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || start > end || end > count
      || (point.line !== undefined && (point.start !== undefined || point.end !== undefined))) throw new Error('정답 위치의 라인/범위 계약 오류');
  return { start, end };
}

const attributesMatch = (actual, expected = {}) => Object.entries(expected).every(([k, v]) => actual[k] === v);

export function validateEnclosing(file, source, point) {
  const lines = source.split(/\r\n|\n|\r/);
  if (lines.at(-1) === '') lines.pop();
  const wanted = bounds(point, lines.length), enclosing = point.enclosing;
  if (!enclosing?.kind || !enclosing.name?.trim()) throw new Error('정답 enclosing 메서드/요소 이름 필요');
  const span = (start, end) => ({ start: lineAt(source, start), end: lineAt(source, end) });
  let spans = [];
  if (['java-method', 'java-type'].includes(enclosing.kind)) {
    if (!file.endsWith('.java')) throw new Error('Java enclosing 파일 종류 불일치');
    const cls = collectJava(file, source, new Graph());
    if (cls && enclosing.kind === 'java-method') spans = cls.methods.filter(m => `${cls.simple}#${m.name}` === enclosing.name).map(m => span(m.start, m.end));
    if (cls && enclosing.kind === 'java-type' && cls.simple === enclosing.name) {
      const open = cls.shape.indexOf('{'), end = closing(cls.shape, open, '{', '}');
      if (end >= 0) spans = [{ start: cls.node.line, end: lineAt(source, end) }];
    }
  } else if (enclosing.kind === 'javascript-function') {
    if (!file.endsWith('.js')) throw new Error('JS enclosing 파일 종류 불일치');
    const clean = stripComments(source);
    for (const m of hideStrings(clean).matchAll(/\bfunction\s+([\w$]+)\s*\(/g)) {
      if (m[1] !== enclosing.name) continue;
      const paramsEnd = closing(clean, m.index + m[0].lastIndexOf('('));
      const suffix = /^\s*\{/.exec(clean.slice(paramsEnd + 1));
      if (!suffix) continue;
      const open = paramsEnd + suffix[0].length, end = closing(clean, open, '{', '}');
      if (end >= 0) spans.push(span(m.index, end));
    }
  } else if (enclosing.kind === 'xml-element') {
    const elements = xmlElements(source);
    spans = elements.filter(e => e.tag === enclosing.name && attributesMatch(e.attrs, enclosing.attributes)
      && (!enclosing.child || elements.some(child => child.parent === e && child.tag === enclosing.child.name
        && source.slice(child.bodyStart, child.bodyEnd).trim() === enclosing.child.text)))
      .map(e => span(e.start, e.end - 1));
  } else if (enclosing.kind === 'markup-tag') {
    const clean = stripComments(source, 'markup');
    for (const m of clean.matchAll(/<([\w:-]+)\b(?:"[^"]*"|'[^']*'|[^'">])*>/g)) {
      if (m[1] === enclosing.name && attributesMatch(attrs(m[0]), enclosing.attributes)) spans.push(span(m.index, m.index + m[0].length - 1));
    }
  } else if (enclosing.kind === 'jsp-preamble' && enclosing.name === 'directives') {
    if (!/\.jspf?$/.test(file)) throw new Error('JSP enclosing 파일 종류 불일치');
    const clean = stripComments(source, 'markup').replace(/<%@[\s\S]*?%>/g, text => text.replace(/[^\r\n]/g, ' '));
    const firstContent = clean.search(/\S/);
    spans = [{ start: 1, end: firstContent < 0 ? lines.length : lineAt(source, firstContent) }];
  } else throw new Error('지원하지 않는 enclosing 종류');
  // 이름이 같은 overload/요소는 추정하지 않는다. 승인자가 더 구체적인 식별자를 제공해야 한다.
  if (spans.length !== 1 || wanted.start < spans[0].start || wanted.end > spans[0].end) throw new Error('정답 enclosing 문맥과 라인/범위 불일치 또는 모호함');
  return wanted;
}

export async function validateDebugExpected(expected, project, { allowDraft = false } = {}) {
  if (!(expected.review_status === 'approved' && expected.approved_by?.trim() || allowDraft && expected.review_status === 'draft')
      || !['training', 'held-out'].includes(expected.dataset) || !/^[a-z0-9-]+$/.test(expected.case_id)
      || !['CONFIRMED', 'LIKELY', 'UNRESOLVED'].includes(expected.status)
      || !Array.isArray(expected.locations) || !expected.locations.length
      || !expected.source_files || !Object.keys(expected.source_files).length) throw new Error('사용자 승인 정답/위치 계약 오류');
  for (const hash of Object.values(expected.source_files)) if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('정답 소스 SHA-256 형식 오류');
  await checkSources(project, expected.source_files);
  const sources = new Map();
  for (const p of expected.locations) {
    if (!expected.source_files[p.file]) throw new Error('정답 위치 파일이 source_files에 없음');
    if (!sources.has(p.file)) sources.set(p.file, await readFile(await inside(project, p.file), 'utf8'));
    validateEnclosing(p.file, sources.get(p.file), p);
  }
  return { case_id: expected.case_id, status: expected.review_status === 'draft' ? 'DRAFT_SOURCES_VALID' : 'PASS',
    source_files: Object.keys(expected.source_files).length, evidence_locations: expected.locations.length };
}
