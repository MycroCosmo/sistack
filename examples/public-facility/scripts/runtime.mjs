import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawn, spawnSync} from 'node:child_process';

export const project = fileURLToPath(new URL('../', import.meta.url));
function findFiles(root, name, depth=5) {
  if (depth < 0 || !fs.existsSync(root)) return [];
  const result=[];
  for(const entry of fs.readdirSync(root,{withFileTypes:true})) {
    const file=path.join(root,entry.name);
    if(entry.isFile() && entry.name===name) result.push(file);
    else if(entry.isDirectory()) result.push(...findFiles(file,name,depth-1));
  }
  return result;
}
export function runtime() {
  const isWindows=process.platform==='win32';
  const javaName=isWindows?'java.exe':'java';
  const candidates=findFiles(path.join(os.homedir(),'.jdks'),javaName,2);
  const java=process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME,'bin',javaName)
    : candidates.find(p=>/17[.\-]/.test(p)) || candidates[0] || javaName;
  const maven=process.env.SISTACK_MAVEN || findFiles(path.join(os.homedir(),'.m2','wrapper','dists'),isWindows?'mvn.cmd':'mvn',5)[0];
  const mavenHome=process.env.MAVEN_HOME || (maven ? path.resolve(maven,'../..') : null);
  if(!mavenHome || !fs.existsSync(path.join(mavenHome,'bin','m2.conf'))) {
    throw new Error('설치된 Maven이 필요합니다. MAVEN_HOME 또는 SISTACK_MAVEN(mvn 실행 파일 경로)을 설정하세요.');
  }
  return {java,args:['-Dmaven.home='+mavenHome,'-Dmaven.multiModuleProjectDirectory='+project,
    '-Dclassworlds.conf='+path.join(mavenHome,'bin','m2.conf'),'-cp',path.join(mavenHome,'boot','*'),
    'org.codehaus.plexus.classworlds.launcher.Launcher']};
}
export function runMaven(goals, options={}) {
  const {java,args}=runtime();
  return spawnSync(java,[...args,...goals],{cwd:project,windowsHide:true,encoding:'utf8',...options});
}
export function serve() {
  const {java,args}=runtime();
  return spawn(java,[...args,'-o','jetty:run'],{cwd:project,windowsHide:true,stdio:'inherit'});
}
