import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
export const root=fileURLToPath(new URL('../',import.meta.url));
function find(root,name,depth) {
  if(depth<0||!fs.existsSync(root))return [];
  return fs.readdirSync(root,{withFileTypes:true}).flatMap(entry=>{
    const p=path.join(root,entry.name);
    return entry.isDirectory()?find(p,name,depth-1):entry.name===name?[p]:[];
  });
}
export function environment() {
  const win=process.platform==='win32', javaName=win?'java.exe':'java';
  const javas=find(path.join(os.homedir(),'.jdks'),javaName,2);
  const java=process.env.JAVA_HOME?path.join(process.env.JAVA_HOME,'bin',javaName):javas.find(p=>/17[.\-]/.test(p))||javas[0];
  const maven=process.env.SISTACK_MAVEN||(process.env.MAVEN_HOME?path.join(process.env.MAVEN_HOME,'bin',win?'mvn.cmd':'mvn'):find(path.join(os.homedir(),'.m2/wrapper/dists'),win?'mvn.cmd':'mvn',5)[0]);
  if(!java||!maven)throw Error('JAVA_HOME과 MAVEN_HOME 또는 SISTACK_MAVEN을 설치 경로로 설정하세요.');
  return {java,javaHome:path.resolve(java,'../..'),maven,mavenHome:path.resolve(maven,'../..')};
}
export function mavenLaunch(goals) {
  const e=environment();return {command:e.java,args:['-Dmaven.home='+e.mavenHome,'-Dmaven.multiModuleProjectDirectory='+root,
    '-Dclassworlds.conf='+path.join(e.mavenHome,'bin/m2.conf'),'-cp',path.join(e.mavenHome,'boot/*'),
    'org.codehaus.plexus.classworlds.launcher.Launcher',...goals]};
}
export function unitSkill() {
  if(process.env.SISTACK_SKILLS)return path.join(process.env.SISTACK_SKILLS,'si-unit-test/scripts/run-tests.mjs');
  let directory=root;
  while(true) {
    const skill=path.join(directory,'.agents/skills/si-unit-test/scripts/run-tests.mjs');
    if(fs.existsSync(skill))return skill;
    const parent=path.dirname(directory);if(parent===directory)break;directory=parent;
  }
  const userSkill=path.join(os.homedir(),'.agents/skills/si-unit-test/scripts/run-tests.mjs');
  if(fs.existsSync(userSkill))return userSkill;
  throw Error('si-unit-test 설치 경로를 SISTACK_SKILLS로 지정하세요. 일반 테스트는 mvn -o test로 실행할 수 있습니다.');
}
