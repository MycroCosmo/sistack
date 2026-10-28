const clean = value => value.replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(\d+);/g,(s,n)=>n?String.fromCodePoint(+n):({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '}[s])).replace(/\s+/g,' ').trim();
export function staticHref(raw='') {
  const jsp=/^<c:url\s+value=['"]([^'"]+)['"]\s*\/>$/.exec(raw);
  let value=jsp?.[1]??raw;
  const th=/^@\{([^{}]+)\}$/.exec(value);
  if(th){const args=/^([^()]+)\((.*)\)$/.exec(th[1]);if(args){const params=[];for(const part of args[2].split(',')){const m=/^\s*([\w-]+)\s*=\s*(['"]?)([\w.-]+)\2\s*$/.exec(part);if(!m)return null;params.push(`${encodeURIComponent(m[1])}=${encodeURIComponent(m[3])}`);}value=args[1]+'?'+params.join('&');}else value=th[1];}
  return /^\/(?!\/)[^\s${}<>]*$/.test(value)?clean(value):null;
}
export function sourceSelections({attributes:a,tag,text='',form=null,file,line}) {
  const out=[],add=(kind,value,extra={})=>out.push({kind,value,file,line,tag,...extra});
  if(a.id)add('id',a.id);if(a.name)add('name',a.name);
  const href=tag==='a'?staticHref(a['th:href']??a.href):null;if(href)add('href',href);
  const label=clean(text.replace(/<[^>]*>/g,''));
  if(['a','button'].includes(tag)&&label&&!/[$#]\{|<%|@\{/.test(label)&&!a['th:text']){
    add('text',label);
    const scope=form?.selection_candidates?.find(s=>['id','name'].includes(s.kind));
    if(scope&&tag==='button')add('form-text',label,{scope});
  }
  return out;
}
const escape = value => value.replaceAll('\\','\\\\').replaceAll('"','\\"');
export function sourceLocator(page,selection,base) {
  if(['id','name'].includes(selection.kind))return page.locator(`[${selection.kind}="${escape(selection.value)}"]`);
  if(selection.kind==='href')return page.locator(`a[href="${escape(new URL(base+selection.value).pathname+new URL(base+selection.value).search)}"]`);
  if(selection.kind==='text')return page.locator(selection.tag).filter({hasText:new RegExp(`^\\s*${selection.value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+')}\\s*$`)});
  if(selection.kind==='form-text')return sourceLocator(page,selection.scope,base).locator(selection.tag).filter({hasText:new RegExp(`^\\s*${selection.value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+')}\\s*$`)});
  throw Error('지원하지 않는 소스 선택자');
}
export async function chooseSourceSelection(page,candidates,base) {
  const attempts=[];
  const priority=['id','name','href','text','form-text'];
  for(const selection of [...candidates].sort((a,b)=>priority.indexOf(a.kind)-priority.indexOf(b.kind))){if(selection.kind==='form-text'&&await sourceLocator(page,selection.scope,base).count()!==1){attempts.push({...selection,count:null,reason:'폼 범위가 유일하지 않음'});continue;}const target=sourceLocator(page,selection,base),count=await target.count();attempts.push({...selection,count});if(count===1)return {target,selection:{...selection,count},attempts};}
  return {target:null,selection:null,attempts};
}
