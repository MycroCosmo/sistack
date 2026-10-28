import path from 'node:path';
import {readdir,readFile} from 'node:fs/promises';
import {digest,save} from '../lib/trace/io.mjs';
// 인덱서/인벤토리를 호출하지 않는 별도 소스 선언 census. 초안 기준으로만 사용한다.
export async function sourceCensus(root) {
  const points=[],source_files={};
  async function walk(rel='') {
    for(const e of await readdir(path.join(root,rel),{withFileTypes:true})) {
      if(['.git','.sistack','target','node_modules','vendor'].includes(e.name))continue;
      const file=rel?`${rel}/${e.name}`:e.name;
      if(e.isDirectory()){if(file==='src/test')continue;await walk(file);continue;}
      if(!/\.(?:jsp|jspf|html|htm|js)$/.test(file)||/\.min\.js$/.test(file))continue;
      const bytes=await readFile(path.join(root,file));source_files[file]=digest(bytes);
      const text=bytes.toString('utf8').replace(/<!--[\s\S]*?-->|<%--[\s\S]*?--%>/g,m=>m.replace(/[^\n\r]/g,' '));
      const point=(kind,at)=>points.push({file,line:text.slice(0,at).split('\n').length,kind});
      if(!file.endsWith('.js')) {
        // 문자 단위 인용 상태로 opening tag 경계를 찾는다.
        for(let at=0;at<text.length;at++)if(text[at]==='<'&&/[A-Za-z]/.test(text[at+1]??'')) {
          let end=at+1,quote=null;
          while(end<text.length){const c=text[end];if(quote){if(c===quote)quote=null;}else if(c==='"'||c==="'")quote=c;else if(c==='>')break;end++;}
          const tag=text.slice(at,end+1),name=/^<([\w:]+)/.exec(tag)?.[1]?.toLowerCase();
          if(name==='form')point('form',at);
          if(name==='button'||name==='input'&&/\btype\s*=\s*['"](?:button|submit|reset)['"]/i.test(tag))point('button',at);
          if(name==='input'&&/\btype\s*=\s*['"]hidden['"]/i.test(tag))point('hidden',at);
          if(name==='a'&&/\b(?:th:)?href\s*=/.test(tag))point('link',at);
          if(/\b(?:th:)?data-url\s*=/.test(tag)||/\bth:attr\s*=.*data-url/.test(tag))point('data-url',at);
          for(const key of ['th:fragment','layout:fragment','th:replace','th:insert','th:include','layout:decorate'])if(tag.includes(key+'='))point('fragment',at);
          if(name==='jsp:include')point('fragment',at);
          if(/\bon(?:click|submit|change)\s*=/.test(tag))point('handler',at);
          if(/\btarget\s*=\s*['"](?!_self)/.test(tag))point('popup',at);
          at=end;
        }
        for(const m of text.matchAll(/<%@\s*include\b/g))point('fragment',m.index);
      }
      const script=file.endsWith('.js')?text:[...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>({text:m[1],offset:m.index+m[0].indexOf(m[1])}));
      const parts=typeof script==='string'?[{text:script,offset:0}]:script;
      for(const part of parts) {
        const executable=part.text.replace(/^[ \t]*\/\/[^\n]*|\/\*[\s\S]*?\*\//gm,m=>m.replace(/[^\n\r]/g,' '));
        for(const [kind,regex]of [['handler',/\.on\(\s*['"]\w+['"]/g],['ajax',/\$\.(?:ajax|getJSON|get|post)\s*\(/g],['popup',/\bwindow\.open\s*\(/g]])for(const m of executable.matchAll(regex))point(kind,part.offset+m.index);
      }
    }
  }
  await walk();return {review_status:'draft',approved_by:null,source_files,points};
}
export function compareCensus(census,inventory) {
 const bag=items=>items.reduce((a,p)=>{const k=`${p.file}:${p.line}:${p.kind}`;a[k]=(a[k]??0)+1;return a;},{}),expected=bag(census.points),actual=bag(inventory.items);
 return {review_status:census.review_status,missing:Object.entries(expected).filter(([k,n])=>(actual[k]??0)<n).map(([key,n])=>({key,count:n-(actual[key]??0)})),extra:Object.entries(actual).filter(([k,n])=>(expected[k]??0)<n).map(([key,n])=>({key,count:n-(expected[key]??0)}))};
}
