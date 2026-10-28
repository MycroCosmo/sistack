import {attrs} from '../indexer/source.mjs';
import {readFile} from 'node:fs/promises';
import {inside} from '../trace/io.mjs';
export function validateAuth(auth){
 if(!auth||typeof auth!=='object'||Object.keys(auth).some(k=>!['login_url','fields','accounts','success'].includes(k))||!/^\/(?!\/)[\w/.-]+$/.test(auth.login_url??''))throw Error('auth 로그인 설정 오류');
 const fields=auth.fields??{};if(Object.entries(fields).some(([k,v])=>!['account','password','csrf'].includes(k)||typeof v!=='string'||!/^[-\w:]+$/.test(v)))throw Error('auth 필드 설정 오류');
 if(!auth.accounts||!Object.keys(auth.accounts).length)throw Error('auth 계정 설정 필요');
 for(const a of Object.values(auth.accounts)){if(!a||Object.keys(a).some(k=>!['id','values','password_env'].includes(k))||typeof a.id!=='string'||!a.id.trim()||Object.entries(a.values??{}).some(([k,v])=>typeof v!=='string'||k===fields.password||/password|passwd|secret/i.test(k))||(a.password_env&&!/^[A-Z_][A-Z0-9_]*$/.test(a.password_env))||(fields.password&&!a.password_env))throw Error('비밀번호는 환경 변수 참조만 허용합니다');}
 const s=auth.success;if(!s||Object.keys(s).some(k=>!['url','status','element'].includes(k))||(!s.url&&!s.element)||(s.url&&!/^\/(?!\/)[\w/.-]+$/.test(s.url))||(s.element&&(!['id','name'].includes(s.element.kind)||typeof s.element.value!=='string')))throw Error('auth 성공 판정 설정 오류');return auth;
}
export async function loadAuth(project){const settings=JSON.parse(await readFile(await inside(project,'sistack-docs.json'),'utf8'));return validateAuth(settings.auth);}
export function authAccount(auth,id){const account=auth.accounts[id]??Object.values(auth.accounts).find(a=>a.id===id);if(!account)throw Error('설정에 승인 계정 ID가 없습니다');return account;}
export function authValues(auth,id,env=process.env){const a=authAccount(auth,id),values={...a.values};if(auth.fields?.account)values[auth.fields.account]=a.id;if(auth.fields?.password){const value=env[a.password_env];if(!value)throw Error('로그인 비밀번호 환경 변수가 없습니다');values[auth.fields.password]=value;}return values;}
export function redactAuth(value,auth,env=process.env){const secrets=Object.values(auth.accounts).map(a=>env[a.password_env]).filter(Boolean);if(typeof value==='string')return secrets.reduce((s,p)=>s.split(p).join('[REDACTED]'),value);if(Array.isArray(value))return value.map(v=>redactAuth(v,auth,env));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,redactAuth(v,auth,env)]));return value;}
export async function protectAuthImage(page,auth,env=process.env){const secrets=Object.values(auth.accounts).map(a=>env[a.password_env]).filter(Boolean);if(!secrets.length)return;await page.evaluate(secrets=>{const walker=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode())for(const s of secrets)n.textContent=n.textContent.split(s).join('[REDACTED]');for(const e of document.querySelectorAll('*')){for(const a of [...e.attributes])for(const s of secrets)if(a.value.includes(s))e.setAttribute(a.name,a.value.split(s).join('[REDACTED]'));if('value'in e)for(const s of secrets)if(String(e.value).includes(s))e.value='';}},secrets);}
export async function authenticate(context,base,auth,id,env=process.env){
 validateAuth(auth);const values=authValues(auth,id,env),url=base+auth.login_url;
 try{const first=await context.request.get(url,{maxRedirects:0});if(first.status()!==200)throw Error();
  if(auth.fields?.csrf){const text=await first.text(),token=[...text.matchAll(/<input\b[^>]*>/gi)].map(m=>attrs(m[0])).find(a=>a.name===auth.fields.csrf)?.value;if(!token)throw Error();values[auth.fields.csrf]=token;}
  let response=await context.request.post(url,{form:values,maxRedirects:0}),final=response.url();
  for(let n=0;[302,303].includes(response.status())&&n<5;n++){const dest=new URL(response.headers().location,final);if(dest.origin!==new URL(base).origin||!dest.pathname.startsWith(new URL(base).pathname+'/'))throw Error();final=dest.href;response=await context.request.get(final,{maxRedirects:0});}
  if(response.status()!==(auth.success.status??200)||(auth.success.url&&new URL(final).pathname!==new URL(base+auth.success.url).pathname))throw Error();
  if(auth.success.element){const p=await context.newPage();try{await p.goto(final,{waitUntil:'networkidle'});const s=auth.success.element;if(await p.locator(`[${s.kind}="${s.value.replaceAll('"','\\"')}"]`).count()!==1)throw Error();}finally{await p.close();}}
 }catch{throw Error('로그인 실패: 설정한 성공 URL/요소 또는 응답을 확인하세요');}
}
