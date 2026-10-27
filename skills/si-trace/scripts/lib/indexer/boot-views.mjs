import { stripComments, location, literal } from './source.mjs';

function settings(file, text, yaml) {
  const documents = [{ values: {}, evidence: [], uncertain: false }], stack = [];
  for (const [i, line] of text.split(/\r?\n/).entries()) {
    if (/^\s*(?:#|$)/.test(line)) continue;
    if (/^---\s*(?:#.*)?$/.test(line)) { documents.forEach(doc => doc.uncertain = true); documents.push({ values: {}, evidence: [], uncertain: true }); stack.length = 0; continue; }
    const doc = documents.at(-1), at = { file, line: i + 1 };
    let key, value;
    if (yaml) {
      const m = /^(\s*)([\w.-]+)\s*:\s*(.*?)\s*$/.exec(line);
      if (!m) { if (/thymeleaf|prefix|suffix|[&*!]/.test(line)) doc.uncertain = true; continue; }
      while (stack.length && stack.at(-1).indent >= m[1].length) stack.pop();
      key = [...stack.map(s => s.key), m[2]].join('.'); value = m[3].replace(/\s+#.*$/, '');
      if (!value) { stack.push({ key: m[2], indent: m[1].length }); continue; }
      if ((key === 'spring' || key.startsWith('spring.thymeleaf')) && (/[\t]/.test(m[1]) || /^[{[|>&*!]/.test(value))) doc.uncertain = true;
    } else {
      const m = /^\s*(spring\.thymeleaf\.(?:prefix|suffix))\s*[=:]\s*(.*?)\s*$/.exec(line);
      if (!m) continue;
      [,key,value] = m;
    }
    const property = /^spring\.thymeleaf\.(prefix|suffix)$/.exec(key)?.[1];
    if (!property) continue;
    doc.values[property] = literal(value) ?? value;
    doc.evidence.push(at);
    if (/[${}\\]|^[|>&*!]/.test(doc.values[property])) doc.uncertain = true;
  }
  return documents;
}

export function bootViewConfiguration(files, graph) {
  const declarations = [];
  for (const f of files) {
    if (/(?:^|\/)pom\.xml$/.test(f.file)) {
      const text = stripComments(f.text, 'markup');
      for (const m of text.matchAll(/<dependency\b[^>]*>([\s\S]*?)<\/dependency>/g)) {
        if (/<artifactId>\s*spring-boot-starter-thymeleaf\s*<\/artifactId>/.test(m[1]) && /<groupId>\s*org\.springframework\.boot\s*<\/groupId>/.test(m[1])) declarations.push(location(f.file,text,m.index));
      }
    } else if (/(?:^|\/)build\.gradle(?:\.kts)?$/.test(f.file)) {
      const text = stripComments(f.text);
      for (const m of text.matchAll(/\b(?:implementation|api|compile|runtimeOnly)\s*\(?\s*['"]org\.springframework\.boot:spring-boot-starter-thymeleaf(?::[^'"]+)?['"]/g)) declarations.push(location(f.file,text,m.index));
    }
  }
  if (!declarations.length) return [];
  const sources = files.filter(f => /(?:^|\/)application(?:-[\w.-]+)?\.(?:properties|ya?ml)$/.test(f.file))
    .map(f => ({ ...f, base: /(?:^|\/)application\./.test(f.file), docs: settings(f.file,f.text,/\.ya?ml$/.test(f.file)) }));
  const buildRoots = new Set(declarations.map(at => at.file.replace(/(?:^|\/)[^/]+$/, '')));
  const defaults = { prefix:'classpath:/templates/', suffix:'.html', evidence:[...declarations], uncertain:buildRoots.size !== 1 || sources.filter(s=>s.base).length > 1 };
  const bases = sources.filter(s=>s.base);
  let variants = [defaults];
  for (const source of bases) variants = variants.flatMap(base=>source.docs.map(doc=>({ ...base, ...doc.values,
    evidence:[...base.evidence,...doc.evidence], uncertain:base.uncertain||doc.uncertain })));
  const baseVariants = [...variants];
  for (const source of sources.filter(s=>!s.base)) for (const base of baseVariants) for (const doc of source.docs) variants.push({ ...base,...doc.values,
    evidence:[...base.evidence,...doc.evidence], uncertain:base.uncertain||doc.uncertain });
  const distinct = new Map();
  for (const variant of variants) {
    const key=JSON.stringify([variant.prefix,variant.suffix]);
    if (distinct.has(key)) { const previous=distinct.get(key); previous.evidence.push(...variant.evidence); previous.uncertain ||= variant.uncertain; }
    else distinct.set(key,variant);
  }
  const uncertain = distinct.size !== 1 || [...distinct.values()].some(v=>v.uncertain);
  if (uncertain) graph.skip(declarations[0], 'boot-view-config', '프로필별 뷰 설정이 갈리거나 최소 설정 파서로 해석할 수 없는 구문');
  return [...distinct.values()].map((v,i)=>{
    const evidence=[...new Map(v.evidence.map(p=>[p.file+':'+p.line,p])).values()];
    const template={ id:`boot-template-${i}`,at:declarations[0],prefix:v.prefix,suffix:v.suffix,check:true,
      condition:{state:uncertain?'unknown':'active'},props:new Map(evidence.map((at,j)=>['evidence-'+j,{at}])) };
    return { template, resolver:{at:declarations[0],props:template.props,condition:template.condition,order:1,
      thymeleaf:true,jsp:false,templates:[template],uncertainEngine:uncertain,layout:false} };
  });
}
