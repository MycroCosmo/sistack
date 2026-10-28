import { readFile } from 'node:fs/promises';
import { validateManifest } from '../manifest/index.mjs';
import { mask } from '../mask/index.mjs';

export const columns = {
  'program-list': { program_id: '프로그램 ID', program_name: '업무명', url: '요청 URL', http_method: 'HTTP 메서드', screen: '화면 파일', controller: 'Controller', service: 'Service', mapper: 'Mapper/SQL', evidence: '근거', status: '확인 상태', program_type: '프로그램 구분', related_sources: '관련 소스', remarks: '비고' },
  'table-spec': { table: '테이블명', table_name: '테이블 설명', column: '컬럼명', column_name: '컬럼 설명', data_type: '자료형', nullable: 'NULL 허용', primary_key: '기본키', foreign_key: '참조키', default_value: '기본값', evidence: '근거', status: '확인 상태' }
};
export const requiredColumns = { 'program-list': ['url', 'controller', 'evidence', 'status'], 'table-spec': ['table', 'column', 'data_type', 'nullable', 'evidence', 'status'] };
export const clean = value => typeof value === 'string' ? mask(value) : value;
export function row(values, evidence, unverified = [], status = 'CONFIRMED', reason = '선언 및 인덱스 연결 근거') {
  return { values: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, clean(v)])), evidence, unverified, status, reason };
}
export function document(kind, revision, sourceFiles, rows, unverified = []) {
  return { schema_version: '1.0.0', kind, source_revision: revision, source_files: sourceFiles, rows, unverified: [...new Set([...unverified, ...(revision ? [] : ['원본 Git 리비전 확인 불가'])])] };
}
export async function validateDocument(doc) {
  if (!Object.hasOwn(columns, doc?.kind)) throw new Error('지원하지 않는 문서 종류');
  const schema = JSON.parse(await readFile(new URL(`../../schemas/docs/${doc.kind}.schema.json`, import.meta.url), 'utf8'));
  if (validateManifest(doc, schema).length) throw new Error('표준 문서 JSON 스키마 위반');
  if (!doc.rows.length) throw new Error('추출 행이 없습니다');
  for (const r of doc.rows) {
    if (!r.evidence.length || r.evidence.some(e => !Object.hasOwn(doc.source_files, e.file))) throw new Error('행의 소스 근거가 없습니다');
    for (const field of Object.keys(columns[doc.kind]).filter(k => !['evidence', 'status'].includes(k))) {
      if (r.values[field] === null && !r.unverified.includes(field) && !r.not_applicable?.includes(field)) throw new Error('빈 칸의 미확인 표시 누락');
    }
    if (r.not_applicable?.some(k => r.values[k] !== null || r.unverified.includes(k))) throw new Error('해당 없음 분류 오류');
    if (r.field_evidence?.some(e => !r.evidence.some(p => p.file === e.file && p.line === e.line) || r.values[e.field] === null || r.status === 'CONFIRMED')) throw new Error('제안 필드 근거 오류');
  }
  if (['1.1.0','1.2.0'].includes(doc.schema_version) && (doc.rows.some(r => !r.identity || !['화면', '클래스', 'SQL','공통'].includes(r.values.program_type) || !r.values.related_sources) || new Set(doc.rows.map(r => r.identity)).size !== doc.rows.length)) throw new Error('분리 행 종류/식별자 오류');
  if(doc.excluded?.some(e=>!doc.source_files[e.file]||(e.action==='merge'&&e.into.some(id=>!doc.rows.some(r=>r.identity===id)))))throw new Error('제외/병합 근거 오류');
  return doc;
}
