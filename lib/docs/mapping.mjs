import {validateAuth} from '../functional/auth.mjs';
import { readFile } from 'node:fs/promises';
import { inside, digest } from '../trace/io.mjs';
import { columns, requiredColumns, clean } from './contract.mjs';

export const metaFields = ['business_name', 'system_name', 'document_number', 'version', 'author', 'created_date'];
export function validateSettings(settings = {}) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings) || Object.keys(settings).some(k => !['meta', 'id_rule', 'program_kinds', 'auth'].includes(k))) throw new Error('문서 설정 파일 형식 오류');
  const meta = settings.meta ?? {}, rule = settings.id_rule ?? null;
  if (!meta || typeof meta !== 'object' || Array.isArray(meta) || Object.entries(meta).some(([k,v]) => !metaFields.includes(k) || (v !== null && typeof v !== 'string'))) throw new Error('meta 설정 오류');
  if (rule && (typeof rule !== 'object' || Array.isArray(rule) || Object.keys(rule).some(k => !['prefix','start','width'].includes(k)) || typeof rule.prefix !== 'string' || !Number.isSafeInteger(rule.start) || rule.start < 0 || !Number.isInteger(rule.width) || rule.width < 1 || rule.width > 12)) throw new Error('ID 설정 오류');
  const kinds=settings.program_kinds??{};
  if(!kinds||typeof kinds!=='object'||Array.isArray(kinds)||Object.entries(kinds).some(([k,v])=>!['dto','exception','utility'].includes(k)||typeof v!=='boolean'))throw new Error('program_kinds 설정 오류');
  if(settings.auth)validateAuth(settings.auth);
  return { ...(settings.auth?{auth:settings.auth}:{}),meta: Object.fromEntries(Object.entries(meta).map(([k,v])=>[k,clean(v)])), id_rule: rule,program_kinds:{dto:false,exception:false,utility:false,...kinds} };
}
export async function loadSettings(project, relative = 'sistack-docs.json') {
  const file = await inside(project, relative);
  let bytes;
  try { bytes = await readFile(file); } catch(e) { if(e.code === 'ENOENT' && relative === 'sistack-docs.json') return {settings:validateSettings(),sha256:null}; throw e; }
  return { settings: validateSettings(JSON.parse(bytes.toString('utf8'))), sha256:digest(bytes) };
}

const isMeta = key => key.startsWith('meta.') && metaFields.includes(key.slice(5));
const allowed = (kind,key) => Object.hasOwn(columns[kind],key) || (kind==='program-list' && (isMeta(key) || key==='row_number' || /^unknown\.[a-z][a-z_]{0,63}$/.test(key)));
const columnNumber = c => [...c].reduce((n,ch)=>n*26+ch.charCodeAt(0)-64,0);
export function checkMapping(doc,mapping) {
  if(mapping.confirmed!==true)throw new Error('양식 매핑 확인 필요');
  if(Object.keys(mapping).some(k=>!['template','sheet','header_row','start_row','end_row','columns','cells','id_rule','fixed','confirmed'].includes(k)))throw new Error('미지원 매핑 항목');
  if(mapping.id_rule)throw new Error('ID 규칙은 사용자 설정 파일에서만 받습니다');
  if(mapping.fixed && (typeof mapping.fixed!=='object'||Array.isArray(mapping.fixed)||Object.keys(mapping.fixed).length))throw new Error('fixed 대신 사용자 설정 파일을 사용하세요');
  const {header_row:header,start_row:start,end_row:end}=mapping;
  if(![header,start,end].every(Number.isInteger)||header<1||start<=header||end<start||end>1048576||start+doc.rows.length-1>end)throw new Error('양식 입력 행 범위 오류/부족');
  const entries=Object.entries(mapping.columns??{}), cells=Object.entries(mapping.cells??{});
  const required=doc.kind==='program-list'&&['1.1.0','1.2.0'].includes(doc.schema_version)?['program_id','program_name','program_type','url','related_sources','remarks']:requiredColumns[doc.kind];
  if(!entries.length||required.some(k=>!mapping.columns[k]))throw new Error('필수 열 매핑 누락');
  const cols=entries.map(([,c])=>c);
  if(new Set(cols).size!==cols.length||entries.some(([k,c])=>!allowed(doc.kind,k)||typeof c!=='string'||!/^[A-Z]{1,3}$/.test(c)||columnNumber(c)>16384))throw new Error('열 매핑 오류/중복');
  const targets=cells.map(([,address])=>address);
  if(new Set(targets).size!==targets.length||cells.some(([k,address])=>doc.kind!=='program-list'||!isMeta(k)||typeof address!=='string'||!/^([A-Z]{1,3})([1-9]\d*)$/.test(address)||columnNumber(address.match(/^[A-Z]+/)[0])>16384||+address.match(/\d+$/)[0]>=header))throw new Error('상단 셀 매핑 오류/중복');
  return {entries,cells};
}

function methodName(name) {
  const [owner,method]=name.split('#');
  return method?`${owner.split('.').at(-1)}.${method}`:name.split('.').slice(-2).join('.');
}
function display(field,value) {
  if(typeof value!=='string')return value;
  if(['controller','service','mapper'].includes(field))return value.split('\n').map(methodName).join('\n');
  if(field==='related_sources') {
    const [point,...rest]=value.split('\n'), refs=rest.filter(line=>!line.includes('/')).map(methodName);
    return [point.slice(point.lastIndexOf('/')+1),...refs.slice(0,2),refs.length>2?`외 ${refs.length-2}개 (전체: evidence/data.json)`:null].filter(Boolean).join(' | ');
  }
  return value;
}
export function plannedWrites(doc,mapping,settings,labels={}) {
  const {entries,cells}=checkMapping(doc,mapping), writes=[];
  for(const [field,address]of cells)writes.push({address,field,value:settings.meta[field.slice(5)]??null,unknown:settings.meta[field.slice(5)]==null,top:true});
  for(const [i,source]of doc.rows.entries()) {
    const evidence=source.evidence.slice(0,2).map(e=>`${e.file}:${e.line}`);
    if(source.evidence.length>2)evidence.push(`외 ${source.evidence.length-2}건: evidence/data.json`);
    const values={...source.values,evidence:evidence.join('\n'),status:source.status,row_number:i+1};
    if(settings.id_rule) {
      const n=settings.id_rule.start+i;
      if(!Number.isSafeInteger(n))throw new Error('프로그램 ID 수 범위 초과');
      values.program_id=settings.id_rule.prefix+String(n).padStart(settings.id_rule.width,'0');
    }
    const unknown=entries.filter(([k])=>k!=='remarks'&&(k.startsWith('unknown.')||(isMeta(k)?settings.meta[k.slice(5)]==null:values[k]==null&&!source.not_applicable?.includes(k)))).map(([k])=>k);
    const proposals=source.field_evidence??[];
    values.remarks=[`확인 상태: ${source.status}`,source.reason,...proposals.map(e=>`${labels[e.field]??e.field} LIKELY: ${e.file}:${e.line}`),unknown.length?`미확인: ${unknown.map(k=>labels[k]??k).join(', ')}`:null,source.not_applicable?.includes('url')?'URL 해당 없음':null,`근거: ${source.evidence[0].file}:${source.evidence[0].line}`].filter(Boolean).join('\n');
    for(const [field,column]of entries) {
      const value=isMeta(field)?settings.meta[field.slice(5)]??null:field.startsWith('unknown.')?null:display(field,values[field]??null);
      const combined=field==='related_sources'&&source.interface_sources?.length?`${value} | 인터페이스: ${source.interface_sources.map(s=>s.name.split('.').at(-1)).join(', ')}`:value;
      writes.push({address:`${column}${mapping.start_row+i}`,row:mapping.start_row+i,field,value:combined,unknown:unknown.includes(field),proposal:proposals.find(e=>e.field===field)??null,top:false});
    }
  }
  return writes;
}
