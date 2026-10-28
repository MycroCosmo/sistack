import path from 'node:path';
import {mkdir,readdir,readFile,writeFile,copyFile,stat} from 'node:fs/promises';
import {spawn,spawnSync} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import {inside,digest,save} from '../trace/io.mjs';
import {mask} from '../mask/index.mjs';

export async function copyProject(source,destination) {
  await mkdir(destination);const hashes={};
  async function walk(relative='') {
    for(const e of await readdir(path.join(source,relative),{withFileTypes:true})) {
      if(['.git','.sistack','target','node_modules','.agents','.claude'].includes(e.name))continue;
      const rel=relative?`${relative}/${e.name}`:e.name;
      if(e.isSymbolicLink())throw Error('실행 사본의 링크 금지');
      if(e.isDirectory())await walk(rel);
      else {const file=await inside(source,rel),target=await inside(destination,rel),bytes=await readFile(file);hashes[rel]=digest(bytes);await mkdir(path.dirname(target),{recursive:true});await copyFile(file,target);}
    }
  }
  await walk();return hashes;
}
export async function startServer(source,run,{java_home,maven},applyPatch=null) {
  await mkdir(path.join(run,'evidence'),{recursive:true});
  const project=path.join(run,'evidence/project'),sourceHashes=await copyProject(source,project);
  if(applyPatch)await applyPatch(project);
  const data=path.join(project,'src/test/resources/spring/local-datasource.xml'),original=await readFile(data,'utf8');
  const db=path.join(run,'evidence/db/application').replaceAll('\\','/');await mkdir(path.dirname(db),{recursive:true});
  if(!/jdbc:h2:mem:[^"<]+/.test(original))throw Error('명시한 로컬 H2 설정만 변경할 수 있습니다');
  await writeFile(data,original.replace(/jdbc:h2:mem:[^"<]+/,`jdbc:h2:file:${db};MODE=Oracle`));
  await save(path.join(run,'evidence/datasource-change.json'),{file:'src/test/resources/spring/local-datasource.xml',before_sha256:digest(original),after_sha256:digest(await readFile(data)),database:'로컬 파일 H2',source_hashes:sourceHashes});
  const pom=await readFile(path.join(project,'pom.xml'),'utf8'),context=/<contextPath>([^<]+)<\/contextPath>/.exec(pom)?.[1];
  const port=+(/<port>(\d+)<\/port>/.exec(pom)?.[1]??8080),base=`http://127.0.0.1:${port}${context}`;
  if(!context||!/^\/[\w-]+$/.test(context))throw Error('로컬 contextPath 확인 필요');
  try{await fetch(`http://127.0.0.1:${port}`,{signal:AbortSignal.timeout(800)});throw Error('사용 중인 포트');}catch(e){if(e.message==='사용 중인 포트')throw e;}
  let log='',closed=false;
  const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',"& $env:SISTACK_MAVEN -o -q '-Dfile.encoding=UTF-8' jetty:run"],{cwd:project,env:{...process.env,JAVA_HOME:java_home,SISTACK_MAVEN:maven},windowsHide:true,stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',b=>{log+=b.toString('utf8');});child.stderr.on('data',b=>{log+=b.toString('utf8');});child.once('close',()=>{closed=true;});
  async function stop() {
    if(!closed)spawnSync('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});
    for(let n=0;n<30&&!closed;n++)await pause(100);
    await save(path.join(run,'evidence/server.log'),mask(log).replaceAll('\r\n','\n'));
    // 실행 계정의 기존 Maven 저장소를 사용하며 새 의존성을 설치하지 않는다.
    const version=/<groupId>com.h2database<\/groupId>\s*<artifactId>h2<\/artifactId>\s*<version>([\d.]+)<\/version>/.exec(pom)?.[1];
    if(!version)throw Error('H2 버전 확인 필요');
    const actualJar=path.join(process.env.USERPROFILE,'.m2/repository/com/h2database/h2',version,`h2-${version}.jar`);
    const dump=path.join(run,'evidence/db/snapshot.sql').replaceAll('\\','/');
    const result=spawnSync(path.join(java_home,'bin/java.exe'),['-cp',actualJar,'org.h2.tools.Shell','-url',`jdbc:h2:file:${db};MODE=Oracle`,'-user','sa','-sql',`SCRIPT NOPASSWORDS TO '${dump.replaceAll("'","''")}';`],{encoding:'utf8',windowsHide:true,timeout:30000});
    const preserved=await stat(`${db}.mv.db`).then(s=>s.size>0).catch(()=>false),dumped=await stat(dump).then(s=>s.size>0).catch(()=>false);
    await save(path.join(run,'evidence/db-preservation.json'),{file_database:preserved,script_dump:dumped,command:'SCRIPT NOPASSWORDS TO <evidence SQL>',exit_code:result.status,source_unchanged:await unchanged(source,sourceHashes)});
    if(result.status!==0||!preserved||!dumped)throw Error('파일 DB 또는 SQL 덤프 보존 실패');
    return {preserved,dumped};
  }
  try {
    for(let n=0;n<180&&!closed;n++) {
      try{const r=await fetch(base+'/auth/login.do',{signal:AbortSignal.timeout(1200)});await r.arrayBuffer();if(r.status===200)return {base,project,stop,sourceHashes,db};}catch{}
      await pause(1000);
    }
    throw Error('서버 시작 실패/시간 초과');
  }catch(e){await stop().catch(()=>{});throw e;}
}
async function unchanged(source,hashes) {for(const [f,h]of Object.entries(hashes))if(digest(await readFile(await inside(source,f)))!==h)return false;return true;}
