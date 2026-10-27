import { xmlElements, stripComments, location, literal } from './source.mjs';

export function profileSelection(xmlFiles, files) {
  const locations = new Set(), declarations = [];
  for (const { text } of xmlFiles) {
    let elements; try { elements = xmlElements(text); } catch { continue; }
    for (const e of elements) {
      if (e.tag.endsWith(':property-placeholder') && e.attrs.location) for (const value of e.attrs.location.split(/[,;\s]+/)) locations.add(value);
      if (e.tag === 'property' && ['location', 'locations'].includes(e.attrs.name) && /Property(?:Sources)?PlaceholderConfigurer$/.test(e.parent?.attrs.class || '')) {
        if (e.attrs.value) locations.add(e.attrs.value);
        for (const v of elements.filter(v => v.tag === 'value' && v.start > e.start && v.end < e.end)) locations.add(text.slice(v.bodyStart, v.bodyEnd).trim());
      }
    }
  }
  let missing = false;
  for (const entry of locations) {
    const resource = /^classpath\*?:\/?(.+)$/.exec(entry)?.[1];
    const sources = resource ? files.filter(f => f.file.replace(/^(?:.*\/)?src\/main\/resources\//, '') === resource) : [];
    if (sources.length !== 1) missing = true;
    for (const f of sources) for (const [i, line] of f.text.split(/\r?\n/).entries()) {
      const match = /^\s*spring\.profiles\.(active|default)\s*[=:]\s*([^#!]*?)\s*$/.exec(line);
      if (match) declarations.push({ key: match[1], value: match[2], at: { file: f.file, line: i + 1 } });
    }
  }
  for (const { file, text: source } of files.filter(f => f.file.endsWith('.java'))) {
    const text = stripComments(source);
    for (const m of text.matchAll(/\bSystem\.setProperty\(\s*["']spring\.profiles\.(active|default)["']\s*,\s*([^;\n]+?)\)\s*;/g)) {
      declarations.push({ key: m[1], value: literal(m[2]), at: location(file, text, m.index) });
    }
  }
  const chosen = declarations.some(x => x.key === 'active') ? declarations.filter(x => x.key === 'active') : declarations;
  const values = [...new Set(chosen.map(x => x.value))];
  const known = !missing && values.length === 1 && values[0] !== null && !/[${}\\]/.test(values[0]);
  return { active: known ? values[0].split(/[,;\s]+/).filter(Boolean) : null, evidence: chosen.map(x => x.at) };
}

export function elementProfile(element, selection, file, text) {
  const conditions = [], evidence = [...selection.evidence];
  for (let e = element; e; e = e.parent) if (e.tag.split(':').at(-1) === 'beans' && e.attrs.profile) {
    conditions.push(e.attrs.profile); evidence.push(location(file, text, e.start));
  }
  let state = 'active';
  for (const condition of conditions) {
    const names = condition.split(/[,;\s]+/).filter(Boolean);
    if (!selection.active || !names.every(n => /^!?[\w.-]+$/.test(n))) { if (state !== 'inactive') state = 'unknown'; continue; }
    if (!names.some(n => n.startsWith('!') ? !selection.active.includes(n.slice(1)) : selection.active.includes(n))) state = 'inactive';
  }
  return { state, evidence, reason: conditions.length ? `profile=${conditions.join(' AND ')}; active=${selection.active?.join(',') ?? '미확정'}` : '' };
}

export function profileFor(cls, name) {
  const definitions = name ? cls.beanDefinitions?.filter(d => d.name === name) : cls.beanDefinitions;
  if (!definitions?.length) return { state: 'active', evidence: [], reason: '' };
  return { state: definitions.some(d => d.state === 'active') ? 'active' : definitions.some(d => d.state === 'unknown') ? 'unknown' : 'inactive', evidence: definitions.flatMap(d => d.evidence), reason: definitions.map(d => d.reason).filter(Boolean).join('; ') };
}
