import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {buildIndex} from '../indexer/index.mjs';
import {attrs,stripComments,lineAt,closing,literal} from '../indexer/source.mjs';
import {digest,inside} from '../trace/io.mjs';
import {sanitize} from '../indexer/graph.mjs';
import {sourceSelections} from './selectors.mjs';

const tagPattern=/<\/?([\w:-]+)\b(?:"[^"]*"|'[^']*'|[^'">])*>/g;
const routePattern=/(?:\/[\w.-]+)+\.do\b/g;
export async function functionalInventory(project) {
  const index=await buildIndex(project),items=[],pages=[],scripts=[],declarations=[],texts=new Map(),byId=new Map(index.nodes.map(n=>[n.id,n]));
  const endpoints=index.nodes.filter(n=>n.kind==='endpoint');
  const sourceFiles=Object.keys(index.meta.source_files).filter(f=>/\.(?:jsp|jspf|html|htm|js)$/.test(f));
  for(const file of sourceFiles)texts.set(file,stripComments(await readFile(await inside(project,file),'utf8'),/\.js$/.test(file)?'code':'markup'));
  const roots=new Set();
  for(const [file,text]of texts)if(!/\.js$/.test(file)&&!/\.jspf$/.test(file)&&(!/\b(?:th:fragment|layout:fragment)\s*=/.test(text)||/\blayout:decorate\s*=/.test(text)))roots.add(file);
  const deps=new Map([...texts.keys()].map(f=>[f,new Set()]));
  for(const e of index.edges.filter(e=>['includes','decorates'].includes(e.kind))){const a=byId.get(e.from),b=byId.get(e.to);if(a&&b&&a.file!==b.file)deps.get(a.file)?.add(b.file);}
  for(const [file,text]of texts)if(!/\.js$/.test(file)) {
    for(const m of text.matchAll(/<script\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)) {
      const a=attrs(m[0]),src=a.src??a['th:src']??'';
      for(const candidate of texts.keys())if(/\.js$/.test(candidate)&&src.includes(path.posix.basename(candidate)))deps.get(file).add(candidate);
    }
  }
  const closure=file=>{const seen=new Set([file]),q=[file];while(q.length)for(const f of deps.get(q.shift())??[])if(!seen.has(f)){seen.add(f);q.push(f);}return seen;};
  const descendants=new Map([...roots].map(f=>[f,closure(f)]));
  const owners=file=>[...descendants].filter(([,files])=>files.has(file)).map(([f])=>f);
  const requestEdges=(file,start,end)=>index.edges.filter(e=>e.kind==='requests'&&e.evidence.some(p=>p.file===file&&p.line>=start&&p.line<=end)).flatMap(e=>{const n=byId.get(e.to);return n?.kind==='endpoint'?[{url:n.details.path,method:n.details.http_method,status:e.status}]:[];});
  function requests(raw,method,file,line,end=line) {
    const routes=[...String(raw??'').matchAll(routePattern)].map(m=>m[0]);
    const result=routes.flatMap(url=>endpoints.filter(e=>e.details.path===url&&(!method||e.details.http_method===method)).map(e=>({url,method:e.details.http_method,status:'CONFIRMED'})));
    result.push(...requestEdges(file,line,end));
    return [...new Map(result.map(r=>[`${r.method} ${r.url}`,r])).values()];
  }
  function add(kind,file,offset,details={}) {
    const line=lineAt(texts.get(file),offset),item={inventory_item_id:digest(`${kind}:${file}:${offset}`),kind,file,line,end_line:line,screens:owners(file),selector:null,requests:[],status:'UNRESOLVED',reason:'독립 요청 또는 연결 미확정',...details};
    if(item.requests.length){item.status=item.requests.every(r=>r.status==='CONFIRMED')?'CONFIRMED':'LIKELY';item.reason='선언과 인덱스의 요청 연결';}
    items.push(item);return item;
  }
  for(const [file,text]of texts) {
    if(/\.js$/.test(file)){scripts.push({file,text});continue;}
    const forms=[],stack=[];
    for(const m of text.matchAll(tagPattern)) {
      const tag=m[1].toLowerCase(),a=attrs(m[0]),line=lineAt(text,m.index);
      if(m[0].startsWith('</')){if(tag==='form')stack.pop();continue;}
      const selector=a.id?{kind:'id',value:a.id}:a.name?{kind:'name',value:a.name}:null;
      if(a.id)declarations.push({kind:'id',value:a.id,file,line});if(a.name)declarations.push({kind:'name',value:a.name,file,line});
      const form=stack.at(-1),raw=a['th:action']??a.action??a['th:href']??a.href??a['th:data-url']??a['data-url']??a['th:attr']??'';
      const req=requests(raw,tag==='form'?(a.method??'GET').toUpperCase():tag==='a'?'GET':null,file,line);
      const end=text.indexOf(`</${tag}`,m.index+m[0].length),label=end>=0?text.slice(m.index+m[0].length,end):a.value??'';
      const common={tag,selector,selection_candidates:sourceSelections({attributes:a,tag,text:label,form,file,line}).map(s=>({...s,screens:owners(file)})),form_id:form?.inventory_item_id??null,requests:req.length?req:form?.requests??[],name:a.name??null,data_page:a['th:data-page']??a['data-page']??null};
      if(tag==='form'){const item=add('form',file,m.index,{...common,requests:req,fields:[],data_base:a['data-base']??null,method:(a.method??'GET').toUpperCase()});forms.push(item);stack.push(item);}
      if(form&&['input','select','textarea'].includes(tag)&&a.name)form.fields.push({name:a.name,type:a.type??tag,selector});
      if(tag==='button'||(tag==='input'&&['button','submit','reset'].includes((a.type??'').toLowerCase())))add('button',file,m.index,common);
      if(tag==='input'&&a.type?.toLowerCase()==='hidden')add('hidden',file,m.index,common);
      if(tag==='a'&&(a.href||a['th:href']))add('link',file,m.index,{...common,download:Object.hasOwn(a,'download')||/\/download\.do/.test(raw)});
      if(a['data-url']||a['th:data-url']||a['th:attr']?.includes('data-url'))add('data-url',file,m.index,common);
      for(const key of ['th:fragment','layout:fragment','th:replace','th:insert','th:include','layout:decorate'])if(a[key])add('fragment',file,m.index,{tag,fragment_role:key,selector,requests:[],status:'CONFIRMED',reason:'구조 선언/포함 항목. 독립 요청 없음'});
      if(a.onclick||a.onsubmit||a.onchange)add('handler',file,m.index,common);
      if(a.target&&a.target!=='_self')add('popup',file,m.index,common);
    }
    for(const m of text.matchAll(/<%@\s*include\b[\s\S]*?%>|<jsp:include\b(?:"[^"]*"|'[^']*'|[^'">])*>/g))add('fragment',file,m.index,{fragment_role:'include',status:'CONFIRMED',reason:'정적 포함 지점. 독립 요청 없음'});
    for(const m of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi))if(m[1].trim())scripts.push({file,text:m[1],offset:m.index+m[0].indexOf(m[1])});
    const pageNodes=index.nodes.filter(n=>n.file===file&&['jsp','template'].includes(n.kind));
    const routes=index.edges.filter(e=>e.kind==='renders'&&e.status==='CONFIRMED'&&pageNodes.some(n=>n.id===e.to)).flatMap(e=>index.edges.filter(x=>x.kind==='maps_to'&&x.to===e.from&&x.status==='CONFIRMED').map(x=>byId.get(x.from))).filter(n=>n?.kind==='endpoint').map(n=>({url:n.details.path,method:n.details.http_method}));
    const markers=[...text.matchAll(/<(?:title|h1)\b[^>]*>([^<>]+)<\/(?:title|h1)>/gi)].map(m=>m[1].trim()).filter(s=>s&&!/[$#]\{|<%/.test(s));
    pages.push({file,root:roots.has(file),forms:forms.map(f=>f.inventory_item_id),routes,markers});
  }
  for(const {file,text,offset=0}of scripts) {
    const selectors=new Map([...text.matchAll(/\b(?:var|let|const)\s+(\w+)\s*=\s*\$\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m=>[m[1],m[2]]));
    const handlers=[];
    for(const m of text.matchAll(/(?:\$\(\s*(['"])([^'"]+)\1\s*\)|(\w+))\.on\(\s*['"](\w+)['"]/g)) {
      const open=text.indexOf('{',m.index),end=open>=0?closing(text,open,'{','}'):m.index+m[0].length;
      const target=m[2]??selectors.get(m[3])??'',ids=[...target.matchAll(/#([\w-]+)|\[name=['"]?([\w-]+)/g)].map(x=>({kind:x[1]?'id':'name',value:x[1]??x[2]}));
      const candidates=items.filter(i=>i.screens.some(s=>owners(file).includes(s))&&(ids.some(s=>i.selector?.kind===s.kind&&i.selector.value===s.value)||(target==='[data-page]'&&i.kind==='button'&&i.data_page)));
      const startLine=lineAt(texts.get(file),offset+m.index),endLine=lineAt(texts.get(file),offset+(end<0?text.length:end));
      const req=[...new Map([...requests(text.slice(m.index,end),null,file,startLine,endLine),...candidates.flatMap(c=>c.requests)].map(r=>[`${r.method} ${r.url}`,r])).values()];
      const body=text.slice(m.index,end),urlExpr=/\burl\s*:\s*([^,\n]+)/.exec(body)?.[1];
      for(const submit of body.matchAll(/\b(\w+)(?:\[0\])?\.submit\s*\(/g))for(const form of items.filter(i=>i.kind==='form'&&i.selector&&selectors.get(submit[1])===`#${i.selector.value}`&&i.screens.some(s=>owners(file).includes(s))))req.push(...form.requests);
      if(urlExpr) {
        const base=/^(\w+)\.attr\(['"]data-base['"]\)\s*\+\s*(.*)$/.exec(urlExpr.trim());
        if(base) {
          const sourceSelector=selectors.get(base[1]),tail=base[2].split('+').map(s=>literal(s.trim()));
          const contexts=new Set(candidates.flatMap(c=>c.screens));
          for(const form of items.filter(i=>i.kind==='form'&&i.selector&&sourceSelector===`#${i.selector.value}`&&i.screens.some(s=>contexts.has(s)))) {
            const prefix=!/[${}]/.test(form.data_base??'')?form.data_base?.match(/\/[\w/-]+/)?.[0]:null;
            if(prefix&&tail.every(v=>v!==null))req.push(...requests(prefix+tail.join(''),'GET',file,startLine,endLine));
          }
        }
      }
      for(const candidate of candidates)if(candidate.requests.length===0&&req.length){candidate.requests=[...new Map(req.map(r=>[`${r.method} ${r.url}`,r])).values()];candidate.status='CONFIRMED';candidate.reason='실제 선택자·data-base·정적 AJAX URL 조합';}
      const item=add('handler',file,offset+m.index,{event:m[4],selector:ids.length===1?ids[0]:null,selector_candidates:ids,selection_candidates:candidates.flatMap(c=>c.selection_candidates??[]),data_page:candidates.find(c=>c.data_page)?.data_page??null,requests:req,end_line:endLine,screens:[...new Set(candidates.flatMap(c=>c.screens))]});
      handlers.push({item,start:m.index,end:end<0?text.length:end,candidates});
    }
    for(const m of text.matchAll(/\$\.(?:ajax|getJSON|get|post)\s*\(/g)) {
      const handler=handlers.find(h=>m.index>=h.start&&m.index<=h.end);
      add('ajax',file,offset+m.index,{selector:handler?.item.selector??null,selector_candidates:handler?.item.selector_candidates??[],selection_candidates:handler?.item.selection_candidates??[],requests:handler?.item.requests??[],screens:handler?.item.screens??owners(file),handler_id:handler?.item.inventory_item_id??null});
    }
    for(const m of text.matchAll(/\bwindow\.open\s*\(/g))add('popup',file,offset+m.index,{requests:requests(text.slice(m.index,m.index+300),null,file,lineAt(texts.get(file),offset+m.index))});
  }
  for(const item of items)if(!item.screens.length&&!roots.has(item.file)){item.reason+='; 독립 화면 소속 미확정';}
  return sanitize({schema_version:'1.0.0',source_revision:index.meta.source_revision,source_files:index.meta.source_files,endpoints:endpoints.map(e=>({...e.details,file:e.file,line:e.line})),items,pages,selectors:declarations,unverified:index.unresolved.map(e=>({file:e.file,line:e.line,reason:e.reason})),counts:items.reduce((a,i)=>(a[i.kind]=(a[i.kind]??0)+1,a),{})});
}

export function generateCases(inventory) {
  const cases=inventory.items.flatMap((item,i)=>{
    if(['hidden','fragment'].includes(item.kind))return [];
    const deletion=item.download||item.requests.some(r=>/\/(?:delete|remove|download)\.do$/.test(r.url));
    const mode=deletion?'SKIP':['button','handler','ajax','data-url','hidden','link','popup'].includes(item.kind)?'AUTO-UI':'AUTO-API';
    const entries=inventory.pages.filter(p=>item.screens.includes(p.file)).flatMap(p=>p.routes.filter(r=>r.method==='GET').map(r=>({...r,file:p.file,markers:p.markers})));
    const restricted=url=>/^\/code\//.test(url)||url==='/board/form.do';
    const admin=item.requests.some(r=>r.method!=='GET'||restricted(r.url))||['ajax','data-url'].includes(item.kind)||(entries.length>0&&entries.every(e=>restricted(e.url)));
    return [{case_id:`TC-${String(i+1).padStart(3,'0')}`,inventory_item_id:item.inventory_item_id,kind:item.kind,file:item.file,line:item.line,screen_files:item.screens,entries,selector:item.selector,selector_candidates:item.selector_candidates??[],selection_candidates:item.selection_candidates??[],requests:item.requests,mode,account_id:admin?'admin':'viewer',title:`${{form:'입력 처리',button:'버튼 동작',handler:'이벤트 처리',ajax:'비동기 조회','data-url':'요청 주소 연결',link:'화면 이동',popup:'팝업 호출'}[item.kind]} 확인`,expected_requests:item.requests.map(r=>`${r.method} ${r.url}`),unverified:!item.requests.length?['요청 연결 미확정']:[],inventory:item,covered_inventory_item_ids:[]}];
  });
  for(const item of inventory.items.filter(i=>['hidden','fragment'].includes(i.kind))){
    const owner=cases.find(c=>c.inventory_item_id===item.form_id)??cases.find(c=>c.file===item.file&&c.kind==='form')??cases.find(c=>c.file===item.file)??cases.find(c=>c.screen_files?.some(f=>item.screens.includes(f)));
    item.covered_by=owner?.case_id??null;if(owner)owner.covered_inventory_item_ids.push(item.inventory_item_id);
  }
  return cases;
}
export function supplementalCases(inventory) {
  const available=new Set([...inventory.items.flatMap(i=>i.requests.map(r=>r.url)),...(inventory.endpoints??[]).map(e=>e.path)]);
  const definitions=[['CREATE','등록 내용과 한글 저장 확인','admin','AUTO-API','/board/create.do','POST'],['UPDATE','수정 내용 재조회 확인','admin','AUTO-API','/board/update.do','POST'],['SORT','정렬 조건별 목록 조회','viewer','AUTO-API','/board/list.do','GET'],['PAGING','두 번째 페이지와 이동 기능 확인','viewer','AUTO-API','/board/list.do','GET'],['BOUNDARY','검색어 허용 경계와 거부 경계 확인','viewer','AUTO-API','/board/list.do','GET'],['ANONYMOUS','미로그인 조회의 로그인 이동 확인','viewer','AUTO-API','/board/list.do','GET'],['SEARCH','검색 제출의 요청과 화면 확인','viewer','AUTO-UI','/board/list.do','GET'],['CODES','분류 조회의 요청과 화면 확인','admin','AUTO-UI','/code/listJson.do','GET'],['ERROR','없는 게시글 오류 화면 확인','viewer','AUTO-API','/board/detail.do','GET']];
  return definitions.filter(([, , , ,url])=>available.has(url)||inventory.pages.some(p=>p.routes.some(r=>r.url===url))).map(([operation,title,account_id,mode,url,method])=>({case_id:`SUP-${operation}`,supplemental:true,operation,title,account_id,mode,requests:[{url,method,status:'CONFIRMED'}],expected_requests:[`${method} ${url}`],inventory_item_id:null,file:inventory.pages.find(p=>p.root)?.file??'',line:1}));
}
export function compareCases(inventory,cases) {
  const ids=cases.filter(c=>!c.supplemental).map(c=>c.inventory_item_id),known=new Set(inventory.items.map(i=>i.inventory_item_id));
  return {missing:inventory.items.filter(i=>['hidden','fragment'].includes(i.kind)?!cases.some(c=>c.case_id===i.covered_by&&c.covered_inventory_item_ids?.includes(i.inventory_item_id)&&(c.file===i.file||c.screen_files?.some(f=>i.screens.includes(f)))):!ids.includes(i.inventory_item_id)).map(i=>i.inventory_item_id),duplicate:ids.filter((id,i)=>ids.indexOf(id)!==i),orphan:ids.filter(id=>!known.has(id)),expected_request_omissions:cases.filter(c=>c.requests.some(r=>!c.expected_requests.includes(`${r.method} ${r.url}`))).map(c=>c.case_id)};
}
