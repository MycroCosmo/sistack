import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {extractPrograms} from '../lib/docs/extract.mjs';

async function project(t) {
  const root=await mkdtemp(path.join(os.tmpdir(),'sistack-selection-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const dir=path.join(root,'src/main/java/demo');await mkdir(dir,{recursive:true});
  const files={
    Payload:`package demo;\npublic class Payload {\n private int value;\n public Payload(int value) { this.value=value; }\n public int getValue() { return value; }\n public void setValue(int value) { this.value=value; }\n}`,
    Fault:`package demo;\npublic class Fault extends RuntimeException { }`,
    Arithmetic:`package demo;\npublic final class Arithmetic {\n private Arithmetic() { }\n public static int doubleValue(int value) { return value*2; }\n}`,
    WorkService:`package demo;\npublic interface WorkService {\n int execute();\n}`,
    Worker:`package demo;\n@Service\npublic class Worker implements WorkService {\n public int execute() { return 1; }\n}`,
    Advice:`package demo;\n@ControllerAdvice\npublic class Advice {\n public String error() { return "error"; }\n}`,
    Access:`package demo;\nimport org.springframework.web.servlet.HandlerInterceptor;\npublic class Access implements HandlerInterceptor {\n public boolean preHandle() { return true; }\n}`,
    Mapper:`package demo;\n@Mapper\npublic interface Mapper {\n int select();\n}`
  };
  for(const[name,source]of Object.entries(files))await writeFile(path.join(dir,`${name}.java`),source);
  return root;
}

test('자료 전달·예외·순수 계산 도구는 기본 제외하고 이유를 JSON에 남긴다',async t=>{
  const root=await project(t),doc=await extractPrograms(root);
  for(const [name,kind]of [['Payload','dto'],['Fault','exception'],['Arithmetic','utility']]) {
    assert.ok(!doc.rows.some(r=>r.evidence[0].file.endsWith(`/${name}.java`)),`${name}은 기본 프로그램 목록에서 제외돼야 한다`);
    assert.ok(doc.excluded.some(e=>e.name===`demo.${name}`&&e.kind===kind&&e.reason&&e.file&&e.line>0),`${name}의 제외 근거를 기록해야 한다`);
  }
});

test('program_kinds 설정으로 기본 제외 종류를 다시 포함할 수 있다',async t=>{
  const root=await project(t);
  await writeFile(path.join(root,'sistack-docs.json'),JSON.stringify({program_kinds:{dto:true,exception:true,utility:true}}));
  const doc=await extractPrograms(root);
  for(const name of ['Payload','Fault','Arithmetic'])assert.ok(doc.rows.some(r=>r.evidence[0].file.endsWith(`/${name}.java`)),`${name} 포함 설정을 적용해야 한다`);
  assert.equal(doc.excluded.filter(e=>e.action==='exclude').length,0,'포함한 종류를 제외 목록에 남기지 않아야 한다');
});

test('Service는 실제 상속 관계로 구현체 행에 병합하고 Mapper와 공통 진입점은 유지한다',async t=>{
  const doc=await extractPrograms(await project(t));
  const service=doc.rows.find(r=>r.evidence[0].file.endsWith('/Worker.java'));
  assert.ok(service,'구현체 프로그램 행이 있어야 한다');
  assert.equal(doc.rows.filter(r=>r.evidence[0].file.endsWith('/WorkService.java')).length,0,'Service 인터페이스 단독 행은 없어야 한다');
  assert.ok(service.interface_sources.some(s=>s.name==='demo.WorkService'),'병합 행에 인터페이스 소스가 있어야 한다');
  assert.ok(service.values.related_sources.includes('WorkService'),'관련 소스에 인터페이스를 포함해야 한다');
  assert.ok(doc.excluded.some(e=>e.action==='merge'&&e.name==='demo.WorkService'&&e.into.includes(service.identity)),'병합 위치와 사유를 남겨야 한다');
  for(const name of ['Advice','Access'])assert.equal(doc.rows.find(r=>r.evidence[0].file.endsWith(`/${name}.java`)).values.program_type,'공통',`${name}은 공통 프로그램이어야 한다`);
  assert.ok(doc.rows.some(r=>r.evidence[0].file.endsWith('/Mapper.java')),'Mapper 인터페이스는 별도 행으로 유지해야 한다');
});
