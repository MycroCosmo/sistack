import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { xmlElements } from '../indexer/source.mjs';
import { digest, noLinks } from '../trace/io.mjs';

export function inspectPom(text) {
  const nodes = xmlElements(text), body = n => text.slice(n.bodyStart, n.bodyEnd).trim();
  const child = (n, name) => nodes.find(e => e.parent === n && e.tag === name);
  const properties = Object.fromEntries(nodes.filter(n => n.parent?.tag === 'properties').map(n => [n.tag, body(n)]));
  const resolve = v => v.replace(/\$\{([^}]+)\}/g, (m, k) => properties[k] ?? m);
  const dependencies = nodes.filter(n => n.tag === 'dependency' && n.parent?.tag === 'dependencies' && n.parent.parent?.tag === 'project')
    .map(n => Object.fromEntries(['groupId', 'artifactId', 'version', 'scope'].map(k => [k, resolve(child(n, k) ? body(child(n, k)) : k === 'scope' ? 'compile' : '')])));
  const get = (group, artifact) => dependencies.find(d => d.groupId === group && d.artifactId === artifact);
  const libs = { junit: get('junit', 'junit'), mockito: get('org.mockito', 'mockito-core'), spring_test: get('org.springframework', 'spring-test'), h2: get('com.h2database', 'h2') };
  const compiler = nodes.find(n => n.tag === 'plugin' && child(n, 'artifactId') && body(child(n, 'artifactId')) === 'maven-compiler-plugin');
  const config = child(compiler, 'configuration');
  const target = ['release', 'source', 'target'].map(k => config && child(config, k)).find(Boolean);
  const javaTarget = resolve(target ? body(target) : properties['maven.compiler.release'] ?? properties['maven.compiler.source'] ?? 'UNKNOWN');
  const unverified = [];
  if (!['8', '1.8', '11', '17', '21'].includes(javaTarget)) unverified.push('Java target 미확정');
  for (const [key, dep] of Object.entries(libs)) if (!dep || dep.scope !== 'test' || !dep.version || dep.version.includes('${')) unverified.push(`${key} test 의존성/버전 미확정`);
  if (libs.junit && !libs.junit.version.startsWith('4.')) unverified.push('현재 실행기는 JUnit 4만 검증됨');
  if (libs.mockito && !libs.mockito.version.startsWith('4.')) unverified.push('현재 실행기는 Mockito 4만 검증됨');
  if (nodes.some(n => n.tag === 'parent' || n.tag === 'profiles' || n.tag === 'modules')) unverified.push('부모 POM/profile/multi-module은 effective 설정 수동 확인 필요');
  if (nodes.some(n => ['argLine', 'reportsDirectory', 'testSourceDirectory', 'directory'].includes(n.tag))) unverified.push('사용자 지정 JVM/빌드/보고서 경로는 실행 전 수동 확인 필요');
  return { status: unverified.length ? 'BLOCKED' : 'PASS', build_tool: 'Maven', java_target: javaTarget,
    libraries: Object.fromEntries(Object.entries(libs).map(([k, d]) => [k, d?.version || 'UNKNOWN'])), unverified };
}

export async function detectEnvironment(project) {
  const file = path.join(project, 'pom.xml'); await noLinks(file);
  try { const bytes = await readFile(file); return { ...inspectPom(bytes.toString('utf8')), pom_sha256: digest(bytes) }; }
  catch (error) { if (error.code !== 'ENOENT') throw error; return { status: 'BLOCKED', build_tool: 'UNKNOWN', unverified: ['단일 Maven POM 실행만 지원. Gradle/상속 설정은 수동 검증 필요'] }; }
}
