import {readFile} from 'node:fs/promises';
import {collectJava} from '../indexer/java.mjs';
import {Graph} from '../indexer/graph.mjs';
import {hideStrings} from '../indexer/source.mjs';
import {inside,digest} from '../trace/io.mjs';

const beanAnnotations=new Set(['Service','Repository','Component','Controller','RestController','Mapper','Configuration']);
const isService=c=>c.annotations.some(a=>a.name==='Service');
const isMapper=c=>c.annotations.some(a=>a.name==='Mapper')||/Mapper$/.test(c.simple);
export async function selectClasses(root,index,kinds) {
  const classes=new Map(),excluded=[],merged=new Map(),suppressed=new Set(),classified=new Map();
  for(const node of index.nodes.filter(n=>n.kind==='class')) {
    const bytes=await readFile(await inside(root,node.file));
    if(digest(bytes)!==index.meta.source_files[node.file])throw Error('분석 중 소스 변경');
    const parsed=collectJava(node.file,new TextDecoder('utf-8',{fatal:true}).decode(bytes),new Graph());
    if(parsed)classes.set(node.name,parsed);
  }
  const ancestors=(cls,seen=new Set())=>{
    if(seen.has(cls.name))return [];seen.add(cls.name);
    return cls.parents.flatMap(p=>[p,...(classes.has(p)?ancestors(classes.get(p),seen):[])]);
  };
  for(const c of classes.values()) {
    const parents=ancestors(c),annotations=c.annotations.map(a=>a.name);
    const methods=c.methods.filter(m=>!(m.name===c.simple&&/(?:^|\.)(?:public|protected|private)$/.test(m.node.details.return_type)));
    let kind='class',reason='일반 클래스 선언',status='CONFIRMED';
    if(annotations.some(a=>['ControllerAdvice','RestControllerAdvice'].includes(a))||parents.some(p=>/(?:^|\.)(?:HandlerInterceptor|HandlerInterceptorAdapter|WebRequestInterceptor)$/.test(p))) {
      kind='common';reason='예외 처리 Advice 어노테이션 또는 인터셉터 상속/구현';
    } else if(parents.some(p=>/(?:^|\.)(?:Throwable|Exception|RuntimeException|Error)$/.test(p))) {
      kind='exception';reason='예외 기반 타입의 상속 관계';
    } else if(!annotations.some(a=>beanAnnotations.has(a))&&c.kind!=='interface') {
      const accessors=methods.filter(m=>(/^(?:get|is)[A-Z]/.test(m.name)&&m.node.details.parameters.length===0)||(/^set[A-Z]/.test(m.name)&&m.node.details.parameters.length===1));
      const dependencies=c.fields.some(f=>/(?:Service|Mapper|Dao|DAO|Repository|SqlSession|DataSource|Template|Connection)$/.test(f.type));
      if(!dependencies&&(c.kind==='record'||(c.fields.length>0&&(methods.length===0||accessors.length/methods.length>=0.8||annotations.some(a=>['Data','Value','Getter'].includes(a)))))) {
        kind='dto';reason=`자료 필드와 getter/setter 중심(${accessors.length}/${methods.length}); 생성자를 제외한 데이터 전달/보조 타입으로 분류`;status='LIKELY';
      } else {
        const constants=c.fields.every(f=>{const line=c.plain.split('\n')[f.at.line-1]??'';return /\bstatic\b/.test(line)&&/\bfinal\b/.test(line);});
        const stateless=methods.length>0&&methods.every(m=>m.node.details.static&&!/(?:^|\.)void$/.test(m.node.details.return_type));
        const safe=methods.every(m=>{
          const body=hideStrings(m.body);
          return !/\bnew\b|\+\+|--|\[[^\]]+\]\s*=|\.\w+\s*=(?!=)/.test(body)&&[...body.matchAll(/\b(\w+)\.\w+\s*\(/g)].every(x=>['Math','StrictMath','Objects'].includes(x[1]));
        });
        if(constants&&stateless&&safe){kind='utility';reason='상태 필드/의존성 없이 정적 계산 메서드 중심; 순수 유틸 후보';status='LIKELY';}
      }
    }
    classified.set(c.name,{kind,reason,status});
    if(['dto','exception','utility'].includes(kind)&&!kinds[kind]) {
      suppressed.add(c.name);excluded.push({identity:c.node.id,name:c.name,file:c.file,line:c.node.line,kind,action:'exclude',reason,status,into:[]});
    }
  }
  for(const c of classes.values()) {
    if(c.kind==='interface'||suppressed.has(c.name))continue;
    const interfaces=ancestors(c).map(p=>classes.get(p)).filter(p=>p?.kind==='interface'&&!isMapper(p)&&(isService(c)||/Service$/.test(p.simple)));
    for(const contract of interfaces) {
      if(!merged.has(c.name))merged.set(c.name,[]);
      if(!merged.get(c.name).some(i=>i.name===contract.name))merged.get(c.name).push(contract);
      suppressed.add(contract.name);
      let record=excluded.find(e=>e.action==='merge'&&e.name===contract.name);
      if(!record){record={identity:contract.node.id,name:contract.name,file:contract.file,line:contract.node.line,kind:'service_interface',action:'merge',reason:'Service 구현체의 실제 상속/implements 관계로 구현체 행에 병합',status:'CONFIRMED',into:[]};excluded.push(record);}
      if(!record.into.includes(c.node.id))record.into.push(c.node.id);
    }
  }
  return {classes,classified,excluded,suppressed,merged};
}
