import { xmlElements, stripComments, location } from './source.mjs';
import { loc } from './graph.mjs';

export function pathPattern(pattern) {
  let regex = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '*' && pattern[i + 1] === '*') {
      i++;
      if (pattern[i + 1] === '/') { i++; regex += '(?:.*/)?'; }
      else regex += '.*';
    } else if (ch === '*') regex += '[^/]*';
    else if (ch === '?') regex += '[^/]';
    else regex += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${regex}$`);
}

const resourcePath = file => file.replace(/^(?:.*\/)?src\/main\/resources\//, '');
const classpath = value => /^classpath\*?:\/?/.test(value) ? value.replace(/^classpath\*?:\/?/, '') : null;

export function mapperSelection(xmlFiles, files, graph) {
  const factories = [], propertyLocations = [];
  for (const { file, text: source } of xmlFiles) {
    const text = stripComments(source, 'markup');
    let elements;
    try { elements = xmlElements(text); } catch { continue; }
    const inside = parent => elements.filter(e => e.start > parent.start && e.end < parent.end);
    const values = property => property.attrs.value ? [{ value: property.attrs.value, at: location(file, text, property.start) }]
      : inside(property).filter(e => e.tag === 'value').map(e => ({ value: text.slice(e.bodyStart, e.bodyEnd).trim(), at: location(file, text, e.start) }));
    for (const bean of elements.filter(e => e.tag === 'bean')) {
      if (bean.attrs.class?.endsWith('SqlSessionFactoryBean')) {
        factories.push(inside(bean).filter(e => e.tag === 'property' && e.attrs.name === 'mapperLocations').flatMap(values));
      }
      if (/(?:PropertyPlaceholderConfigurer|PropertySourcesPlaceholderConfigurer)$/.test(bean.attrs.class || '')) {
        propertyLocations.push(...inside(bean).filter(e => e.tag === 'property' && ['location', 'locations'].includes(e.attrs.name)).flatMap(values));
      }
    }
    for (const e of elements.filter(e => e.tag.endsWith(':property-placeholder'))) {
      for (const value of (e.attrs.location || '').split(/[,;\s]+/).filter(Boolean)) propertyLocations.push({ value, at: location(file, text, e.start) });
    }
  }
  if (!factories.length) return null;
  let complete = factories.length === 1 && factories[0].length > 0;
  const evidence = [], patterns = [];
  const resolve = (value, seen = new Set()) => value.replace(/\$\{([^}:]+)(?::([^}]*))?\}/g, (whole, key, fallback) => {
    if (seen.has(key) || !propertyLocations.length) { complete = false; return whole; }
    const found = []; let missingLocation = false;
    for (const entry of propertyLocations) {
      const relative = classpath(entry.value);
      const sources = relative === null ? [] : files.filter(f => resourcePath(f.file) === relative);
      if (sources.length !== 1) missingLocation = true;
      for (const source of sources) {
        for (const [i, line] of source.text.split(/\r?\n/).entries()) {
          const match = /^\s*([^#!\s:=]+)\s*[=:]\s*(.*?)\s*$/.exec(line);
          if (match?.[1] === key) found.push({ value: match[2], evidence: [entry.at, { file: source.file, line: i + 1 }] });
        }
      }
    }
    if (missingLocation || found.length > 1 || (!found.length && fallback === undefined)) { complete = false; return whole; }
    if (found[0]) evidence.push(...found[0].evidence);
    const result = found[0]?.value ?? fallback;
    if (/\\/.test(result)) { complete = false; return whole; }
    return resolve(result, new Set([...seen, key]));
  });
  for (const entry of factories.flat()) {
    evidence.push(entry.at);
    const resolved = resolve(entry.value), relative = classpath(resolved);
    if (relative === null || resolved.includes('${')) complete = false;
    else patterns.push(pathPattern(relative));
  }
  const selected = new Set(files.filter(f => patterns.some(p => p.test(resourcePath(f.file)))).map(f => f.file));
  if (!complete) graph.skip(evidence[0] || { file: xmlFiles[0].file, line: 1 }, 'mapper-selection', '활성 factory/프로퍼티/리소스 경로를 하나로 해석하지 못함; SQL 후보는 LIKELY');
  return { complete, selected, evidence };
}

export function linkSql(graph, from, candidates, at) {
  const selection = graph.mapperSelection;
  if (!selection || candidates.some(n => n.details.dialect !== 'mybatis')) return graph.link(from, candidates, 'executes', at, '동일 sqlId의 활성 매핑 미확정');
  const active = selection.complete ? candidates.filter(n => selection.selected.has(n.file)) : candidates;
  if (!active.length) return graph.unknown(from, 'executes', at, 'mapper-not-selected', 'mapperLocations에 해당 sqlId 선언이 없음');
  const confirmed = selection.complete && active.length === 1;
  for (const to of active) graph.edge(from, to, 'executes', [at, loc(to), ...selection.evidence], confirmed ? 'CONFIRMED' : 'LIKELY',
    confirmed ? undefined : '활성 factory/프로퍼티 또는 동일 sqlId 매핑이 미확정', candidates.filter(n => n.id !== to.id));
}
