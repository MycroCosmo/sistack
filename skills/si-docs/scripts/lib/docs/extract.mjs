import { readFile } from 'node:fs/promises';
import { buildIndex } from '../indexer/index.mjs';
import { stripComments, closing, lineAt, hideStrings } from '../indexer/source.mjs';
import { inside, digest } from '../trace/io.mjs';
import { document, row, validateDocument } from './contract.mjs';

export async function extractPrograms(root) {
  const index = await buildIndex(root), byId = new Map(index.nodes.map(n => [n.id, n]));
  const rows = index.nodes.filter(n => n.kind === 'endpoint').map(endpoint => {
    const found = new Set([endpoint.id]), queue = [endpoint.id], evidence = [{ file: endpoint.file, line: endpoint.line }], uncertain = [];
    while (queue.length) {
      const id = queue.shift();
      for (const e of index.edges.filter(e => e.from === id && ['maps_to', 'calls', 'executes', 'renders'].includes(e.kind))) {
        if (e.status !== 'CONFIRMED') { uncertain.push(`${e.kind}: ${e.reason ?? e.status}`); continue; }
        evidence.push(...e.evidence);
        if (!found.has(e.to)) { found.add(e.to); queue.push(e.to); }
      }
    }
    const nodes = [...found].map(id => byId.get(id)).filter(Boolean);
    const names = f => nodes.filter(f).map(n => n.name).sort().join('\n') || null;
    const values = {
      program_id: null, program_name: null, url: endpoint.details.path, http_method: endpoint.details.http_method,
      screen: nodes.filter(n => ['jsp', 'template'].includes(n.kind)).map(n => n.file).sort().join('\n') || null,
      controller: names(n => n.kind === 'method' && /Controller$/.test(n.details.owner)),
      service: names(n => n.kind === 'method' && /Service(?:Impl)?$/.test(n.details.owner)),
      mapper: names(n => n.kind === 'sql')
    };
    return row(values, [...new Map(evidence.map(e => [`${e.file}:${e.line}`, e])).values()], Object.keys(values).filter(k => values[k] == null), uncertain.length ? 'LIKELY' : 'CONFIRMED', uncertain.length ? uncertain.join('; ') : '요청 선언과 CONFIRMED 연결만 수집; 계층 표시는 클래스명 관례');
  });
  return validateDocument(document('program-list', index.meta.source_revision, index.meta.source_files, rows, ['범위: endpoint당 1행. 런타임 도달·프로그램 ID·업무명 미확인; Service 표시는 클래스명 관례', '인덱서가 해석하지 못한 동적 연결은 포함하지 않음', ...(index.meta.source_dirty ? ['분석 대상 작업 트리 변경 상태; source_files 해시를 기준으로 보관'] : [])]));
}

// 괄호·인용부 안의 쉼표를 분리하지 않는다. 위치를 유지해 컬럼별 라인을 남긴다.
function pieces(text, delimiter = ',') {
  const result = []; let start = 0, depth = 0, quote = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === quote) { if (text[i + 1] === quote) i++; else quote = null; } }
    else if (c === "'" || c === '"') quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === delimiter && depth === 0) { result.push({ text: text.slice(start, i), start }); start = i + 1; }
  }
  if (quote || depth) throw new Error('닫히지 않은 DDL 구문');
  result.push({ text: text.slice(start), start }); return result;
}
const ident = '[A-Za-z_][\\w$]*(?:\\.[A-Za-z_][\\w$]*)?';
export function parseDDL(source, file) {
  const text = stripComments(source, 'sql'), shape = hideStrings(text), rows = [], unverified = [];
  const comments = new Map([...text.matchAll(new RegExp(`COMMENT\\s+ON\\s+(TABLE|COLUMN)\\s+(${ident}(?:\\.[A-Za-z_][\\w$]*)?)\\s+IS\\s+'((?:''|[^'])*)'`, 'gi'))].map(m => [m[2].toUpperCase(), m[3].replaceAll("''", "'")]));
  const create = new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(${ident})\\s*\\(`, 'gi');
  for (let m; (m = create.exec(shape));) {
    const start = create.lastIndex - 1, end = closing(text, start);
    if (end < 0) throw new Error('닫히지 않은 CREATE TABLE');
    const table = m[1], chunks = pieces(text.slice(start + 1, end)), keys = new Set(), refs = new Map();
    for (const p of chunks) {
      const pk = /(?:CONSTRAINT\s+\w+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i.exec(p.text.trim());
      if (pk && /^(?:CONSTRAINT|PRIMARY)\b/i.test(p.text.trim())) pk[1].split(',').forEach(k => keys.add(k.trim().toUpperCase()));
      const fk = /FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+([\w.]+)\s*\(([^)]+)\)/i.exec(p.text);
      if (fk) fk[1].split(',').forEach((k, i) => refs.set(k.trim().toUpperCase(), `${fk[2]}(${fk[3].split(',')[i]?.trim() ?? '?'})`));
    }
    for (const p of chunks) {
      const value = p.text.trim();
      if (/^(?:CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK)\b/i.test(value)) { if (/CHECK\b/i.test(value)) unverified.push('CHECK 조건은 열 정의에 포함하지 않음'); continue; }
      const c = /^([A-Za-z_][\w$]*)\s+(.+)$/s.exec(value);
      if (!c) { unverified.push(`지원하지 않는 컬럼 선언: ${file}:${lineAt(text, start + 1 + p.start)}`); continue; }
      const type = /^(?:DOUBLE\s+PRECISION|CHARACTER\s+VARYING|[A-Za-z_][\w$]*)(?:\s*\([^)]*\))?(?:\s+(?:WITH|WITHOUT)\s+TIME\s+ZONE)?/i.exec(c[2]);
      const rest = c[2].slice(type?.[0].length ?? 0), restShape = hideStrings(rest), primary = keys.has(c[1].toUpperCase()) || /\bPRIMARY\s+KEY\b/i.test(restShape);
      const ref = /\bREFERENCES\s+([\w.]+)\s*\(([^)]+)\)/i.exec(restShape);
      const defStart = /\bDEFAULT\b/i.exec(restShape);
      const defTail = defStart ? rest.slice(defStart.index + defStart[0].length) : '';
      const boundary = /\s+(?:NOT\s+NULL|NULL|PRIMARY|REFERENCES|CONSTRAINT|CHECK|UNIQUE)\b/i.exec(hideStrings(defTail));
      const defaultValue = defStart ? defTail.slice(0, boundary?.index ?? defTail.length).trim() : '';
      if (/\bGENERATED|\bCHECK\b|\bCOLLATE\b/i.test(restShape)) unverified.push('생성식/CHECK/COLLATE 의미는 미확인');
      const values = { table, table_name: comments.get(table.toUpperCase()) ?? null, column: c[1], column_name: comments.get(`${table}.${c[1]}`.toUpperCase()) ?? null, data_type: type?.[0].trim() ?? null, nullable: primary || /\bNOT\s+NULL\b/i.test(restShape) ? 'N' : 'Y', primary_key: primary ? 'Y' : 'N', foreign_key: ref ? `${ref[1]}(${ref[2]})` : refs.get(c[1].toUpperCase()) ?? '', default_value: defaultValue };
      rows.push(row(values, [{ file, line: lineAt(text, start + 1 + p.start + p.text.search(/\S/)) }], Object.keys(values).filter(k => values[k] === null)));
    }
    create.lastIndex = end + 1;
  }
  if (/\bALTER\s+TABLE\b|CREATE\s+TABLE\s+[^;]*\bAS\s+SELECT\b/i.test(shape) || /CREATE\s+TABLE\s+"/i.test(text)) unverified.push('ALTER/CTAS/인용 식별자 등 지원 범위 밖 DDL 발견: 최종 스키마 보장 불가');
  return { rows, unverified };
}

export function parseCSV(text, file) {
  const records = []; let fields = [], field = '', quoted = false, line = 1, startLine = 1;
  for (let i = 0; i <= text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; } else if (c === undefined) throw new Error('닫히지 않은 CSV'); else { field += c; if (c === '\n') line++; } }
    else if (c === '"' && !field) quoted = true;
    else if (c === ',') { fields.push(field); field = ''; }
    else if (c === '\n' || c === undefined) { fields.push(field.replace(/\r$/, '')); if (fields.some(Boolean)) records.push({ fields, line: startLine }); fields = []; field = ''; line++; startLine = line; }
    else field += c;
  }
  const header = records.shift()?.fields.map(f => f.replace(/^\uFEFF/, ''));
  const required = ['table', 'column', 'data_type', 'nullable'];
  if (!header || new Set(header).size !== header.length || required.some(k => !header.includes(k))) throw new Error('CSV 필수 헤더 누락/중복');
  const fieldsUsed = ['table', 'table_name', 'column', 'column_name', 'data_type', 'nullable', 'primary_key', 'foreign_key', 'default_value'];
  if (header.some(k => !fieldsUsed.includes(k))) throw new Error('CSV 미지원 헤더');
  return records.map(r => {
    if (r.fields.length !== header.length) throw new Error('CSV 열 수 불일치');
    const input = Object.fromEntries(header.map((k, i) => [k, r.fields[i]]));
    if (required.some(k => !input[k]) || !['Y', 'N'].includes(input.nullable) || (input.primary_key && !['Y', 'N'].includes(input.primary_key))) throw new Error('CSV 필수 값 오류');
    const values = Object.fromEntries(fieldsUsed.map(k => [k, input[k] ?? null]));
    return row(values, [{ file, line: r.line }], fieldsUsed.filter(k => values[k] === null), 'CONFIRMED', '사용자 제공 메타데이터; DB 실존/최신성은 미확인');
  });
}

export async function extractTables(root, files, revision = null) {
  if (!Array.isArray(files) || !files.length || new Set(files).size !== files.length) throw new Error('중복 없는 DDL/CSV 파일 목록 필요');
  const rows = [], hashes = {}, unverified = ['저장소 DDL/제공 CSV만 분석; 실제 DB·ALTER 이력·운영 스키마 미확인'];
  for (const file of files) {
    const bytes = await readFile(await inside(root, file)); hashes[file] = digest(bytes);
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (/\.csv$/i.test(file)) rows.push(...parseCSV(text, file));
    else if (/\.sql$/i.test(file)) { const result = parseDDL(text, file); rows.push(...result.rows); unverified.push(...result.unverified); }
    else throw new Error('DDL(sql)/CSV만 지원');
  }
  const identities = rows.map(r => `${r.values.table.toUpperCase()}.${r.values.column.toUpperCase()}`);
  if (new Set(identities).size !== identities.length) throw new Error('중복 테이블/컬럼: DB별 DDL을 따로 지정하세요');
  return validateDocument(document('table-spec', revision, hashes, rows, unverified));
}
