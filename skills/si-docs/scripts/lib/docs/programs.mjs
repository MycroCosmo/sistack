import { readFile } from 'node:fs/promises';
import { buildIndex } from '../indexer/index.mjs';
import { stripComments, lineAt } from '../indexer/source.mjs';
import { inside, digest } from '../trace/io.mjs';
import { document, row, validateDocument } from './contract.mjs';
import { loadSettings } from './mapping.mjs';
import { selectClasses } from './program-selection.mjs';

function decode(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (all, key) => {
    if (key[0] !== '#') return named[key.toLowerCase()] ?? all;
    const code = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : +key.slice(1);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : all;
  });
}
function proposeName(text, file) {
  const clean = stripComments(text, 'markup');
  for (const tag of ['title', 'h1']) {
    const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}\\s*>`, 'i').exec(clean);
    if (!match || /(?:th:(?:u?text)|[$#*@]\{|<%|\[\[|<script\b|<style\b)/i.test(match[0])) continue;
    const value = decode(match[1].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (value) return { value, field: 'program_name', status: 'LIKELY', file, line: lineAt(text, match.index), reason: `${tag} 텍스트에서 제안. 업무명/동적 렌더링은 미확인` };
  }
  return null;
}

export async function separatedPrograms(root,{settingsFile='sistack-docs.json'}={}) {
  const index = await buildIndex(root), rows = [], excluded = [], seen = new Set();
  const config=await loadSettings(root,settingsFile),selection=await selectClasses(root,index,config.settings.program_kinds);
  const byId = new Map(index.nodes.map(n => [n.id, n]));
  const screenFiles = new Map(index.nodes.filter(n => ['jsp', 'template'].includes(n.kind) && !n.details.selector).map(n => [n.file, n]));
  for (const node of [...screenFiles.values(), ...index.nodes.filter(n => ['class', 'sql'].includes(n.kind))]) {
    if (seen.has(node.id)) continue; seen.add(node.id);
    const screen = ['jsp', 'template'].includes(node.kind), cls = node.kind === 'class';
    if(cls&&selection.suppressed.has(node.name))continue;
    let text = '', proposal = null;
    const evidence = [{ file: node.file, line: node.line }], fieldEvidence = [];
    if (screen) {
      const bytes = await readFile(await inside(root, node.file));
      if (digest(bytes) !== index.meta.source_files[node.file]) throw new Error('분석 중 소스가 변경됐습니다');
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      const markup = stripComments(text, 'markup');
      const direct = index.edges.some(e => e.to === node.id && e.kind === 'renders' && e.status === 'CONFIRMED');
      if (/\.jspf$/i.test(node.file) || (!direct && /\b(?:th:fragment|layout:fragment)\s*=/.test(markup) && !/\blayout:decorate\s*=/.test(markup))) {
        excluded.push(`${node.file}: 공통 조각/레이아웃 선언, 독립 화면 목록에서 제외`); continue;
      }
      proposal = proposeName(text, node.file);
      if (proposal) { const { value, ...point } = proposal; fieldEvidence.push(point); evidence.push({ file: point.file, line: point.line }); }
    }
    const interfaces=cls?selection.merged.get(node.name)??[]:[];
    const interfaceSources=interfaces.map(c=>({identity:c.node.id,name:c.name,file:c.file,line:c.node.line}));
    const methods = cls ? index.nodes.filter(n => n.kind === 'method' && n.file === node.file && n.details.owner === node.name) : [];
    const urls = [], http = [];
    if (screen) {
      const parents = index.edges.filter(e => e.to === node.id && e.kind === 'renders' && e.status === 'CONFIRMED');
      for (const render of parents) for (const link of index.edges.filter(e => e.to === render.from && e.kind === 'maps_to' && e.status === 'CONFIRMED')) {
        const endpoint = byId.get(link.from);
        if (endpoint?.kind === 'endpoint') { urls.push(endpoint.details.path); http.push(endpoint.details.http_method); evidence.push(...render.evidence, ...link.evidence); }
      }
    }
    const names = methods.map(n => n.name).sort().join('\n') || null;
    const values = {
      program_id: null, program_name: proposal?.value ?? null,
      url: urls.length ? [...new Set(urls)].sort().join('\n') : null,
      http_method: http.length ? [...new Set(http)].sort().join('\n') : null,
      screen: screen ? node.file : null,
      controller: cls && /Controller$/.test(node.name) ? names : null,
      service: cls && /Service(?:Impl)?$/.test(node.name) ? names : null,
      mapper: !screen && !cls ? node.name : null,
      program_type: screen ? '화면' : cls ? selection.classified.get(node.name)?.kind==='common'?'공통':'클래스' : 'SQL',
      related_sources: [`${node.file}:${node.line}`, ...(cls ? methods.map(n => n.name) : [node.name]),...interfaces.flatMap(c=>[`${c.file}:${c.node.line}`,c.name,...c.methods.map(m=>m.node.name)])].join('\n')
    };
    evidence.push(...methods.map(n => ({ file: n.file, line: n.line })));
    evidence.push(...interfaceSources.map(s=>({file:s.file,line:s.line})));
    const notApplicable = ['screen', 'controller', 'service', 'mapper'].filter(k => values[k] === null);
    if (!screen) notApplicable.push('url', 'http_method');
    const result = row(values, [...new Map(evidence.map(e => [`${e.file}:${e.line}`, e])).values()], Object.keys(values).filter(k => values[k] === null && !notApplicable.includes(k)), proposal ? 'LIKELY' : 'CONFIRMED', proposal ? proposal.reason : '파일/클래스/SQL 선언을 수집. 업무명과 실행 도달 여부는 미확인');
    rows.push({ ...result, identity: node.id, not_applicable: notApplicable, field_evidence: fieldEvidence,interface_sources:interfaceSources });
  }
  const doc = document('program-list', index.meta.source_revision, index.meta.source_files, rows, [
    '화면 파일/클래스(인터페이스 포함)/SQL 선언별 한 행. 공통 조각/레이아웃은 독립 화면에서 제외',
    '인덱서 지원 범위의 소스 선언 기준. 미지원 기술/동적 실행은 미확인',
    ...excluded, ...(index.meta.source_dirty ? ['분석 대상 작업 트리 변경 상태; 파일 해시 기준'] : [])
  ]);
  doc.schema_version = '1.2.0';doc.excluded=selection.excluded;doc.selection_settings_sha256=config.sha256;
  return validateDocument(doc);
}
