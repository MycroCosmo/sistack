import path from 'node:path';
import { stripComments, attrs, location, literal } from './source.mjs';
import { loc } from './graph.mjs';
import { collectJs } from './js.mjs';
import { connectRequest } from './spring.mjs';

export function collectJsp(file, source, graph) {
  const text = stripComments(source, 'markup');
  const node = graph.add('jsp', file, { file, line: 1 });
  const page = { file, text, node, scripts: [], scriptRefs: [], includes: [], requests: [], contexts: new Map(), ids: new Set(), inline: [] };
  const at = i => location(file, text, i);
  for (const m of text.matchAll(/\b(?:var|let|const)\s+(\w+)\s*=\s*(['"])\$\{pageContext\.request\.contextPath\}\2\s*;/g)) {
    if ([...text.matchAll(new RegExp(`\\b${m[1]}\\s*=(?!=)`, 'g'))].length === 1) page.contexts.set(m[1], at(m.index));
  }
  for (const m of text.matchAll(/\bid\s*=\s*['"]([\w-]+)['"]/g)) page.ids.add(m[1]);
  for (const m of text.matchAll(/<%@\s*include\s+file=("[^"]*"|'[^']*')[\s\S]*?%>|<jsp:include\b[^>]*>/g)) {
    const ref = m[1] ? literal(m[1]) : attrs(m[0]).page;
    if (ref) page.includes.push({ ref, at: at(m.index) });
  }
  const urls = new Map();
  node.details.url_declarations = [];
  for (const m of text.matchAll(/<c:url\b[^>]*>/g)) {
    const a = attrs(m[0]);
    if (a.value && a.var) urls.set(a.var, a.value);
    if (a.value) node.details.url_declarations.push({ value: a.value, ...at(m.index) });
  }
  const expand = value => {
    if (!value) return null;
    const tag = /<c:url\b[^>]*>/.exec(value);
    if (tag) return attrs(tag[0]).value;
    const variable = /^\$\{(\w+)\}$/.exec(value);
    if (variable) return urls.get(variable[1]) || value;
    return value.replace(/^\$\{pageContext\.request\.contextPath\}/, '');
  };
  // c:url can nest quotes inside an HTML attribute, so collect it before scanning attributes.
  const normalized = text.replace(/<c:url\b[^>]*\/>/g, tag => { const value = attrs(tag).value || ''; return value + ' '.repeat(Math.max(0, tag.length - value.length)); });
  for (const m of normalized.matchAll(/<(form|a|script)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)) {
    const a = attrs(m[0]);
    if (m[1].toLowerCase() === 'script') { if (a.src) page.scriptRefs.push({ ref: expand(a.src.trim()), at: at(m.index) }); }
    else if (a.action || a.href) page.requests.push({ route: expand((a.action || a.href).trim()), verb: m[1].toLowerCase() === 'form' ? (a.method || 'GET').toUpperCase() : 'GET', at: at(m.index), source: m[1] });
  }
  for (const m of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    if (!m[1].trim()) continue;
    page.inline.push(collectJs(file, m[1], graph, { baseOffset: m.index + m[0].indexOf('>') + 1, fullSource: text, page: node }));
  }
  if (/<%[^@=-]/.test(text)) graph.skip({ file, line: 1 }, 'jsp-scriptlet', 'JSP scriptlet Java 데이터 흐름 미지원');
  return page;
}

export function linkJsp(pages, scripts, graph) {
  const webPath = (file, ref) => ref.startsWith('/') ? (file.includes('/webapp/') ? file.split('/webapp/')[0] + '/webapp' + ref : ref.slice(1)) : path.posix.normalize(path.posix.join(path.posix.dirname(file), ref));
  for (const page of pages) {
    for (const include of page.includes) {
      const targets = pages.filter(p => p.file === webPath(page.file, include.ref));
      graph.link(page.node, targets.map(p => p.node), 'includes', include.at);
    }
    const visited = new Set();
    function collect(p) {
      if (visited.has(p.file)) return; visited.add(p.file);
      for (const ref of p.scriptRefs) {
        const candidates = scripts.filter(s => s.file === webPath(p.file, ref.ref));
        for (const script of candidates) { page.scripts.push(script); graph.edge(page.node, script.node, 'includes', [ref.at, loc(script.node)]); }
        if (!candidates.length) graph.skip(ref.at, 'external-script', '외부/벤더/미수집 JS는 실행하거나 다운로드하지 않음');
      }
      for (const include of p.includes) { const child = pages.find(other => other.file === webPath(p.file, include.ref)); if (child) collect(child); }
    }
    collect(page);
    for (const req of page.requests) {
      if (!req.route || /\.(?:css|js|png|jpg|gif|ico)(?:[?#]|$)/i.test(req.route)) continue;
      connectRequest(graph, page.node, req.route, req.verb, req.at);
    }
  }
}
