import { stripComments, hideStrings, closing, location, literal, strings } from './source.mjs';
import { loc } from './graph.mjs';
import { connectRequest } from './spring.mjs';

function expression(text, start) {
  const plain = hideStrings(text); let depth = 0, end = start;
  for (; end < plain.length; end++) {
    const ch = plain[end];
    if ('([{'.includes(ch)) depth++;
    if (')]}'.includes(ch)) { if (!depth) break; depth--; }
    if (!depth && ',;\n'.includes(ch)) break;
  }
  return text.slice(start, end).trim();
}

export function collectJs(file, source, graph, { baseOffset = 0, fullSource = source, page = null } = {}) {
  // Preserve line offsets when expanding a literal c:url inside an inline JS string.
  const expanded = source.replace(/<c:url\s+value=("[^"]*"|'[^']*')\s*\/>/g, (all, quoted) => literal(quoted) + ' '.repeat(Math.max(0, all.length - literal(quoted).length)));
  const text = stripComments(expanded);
  const shape = hideStrings(text);
  const at = i => location(file, fullSource, baseOffset + i);
  const node = graph.add('js', page ? `${file}#inline:${at(0).line}` : file, at(0));
  if (page) graph.edge(page, node, 'includes', [loc(page), loc(node)]);
  const blocks = [];
  for (const m of text.matchAll(/\bfunction\s+(\w+)\s*\([^)]*\)\s*\{|\$\(\s*(['"])(#[\w-]+)\2\s*\)\.on\(\s*['"]\w+['"]\s*,\s*function\s*\([^)]*\)\s*\{/g)) {
    if (!shape[m.index]?.trim()) continue;
    const start = m.index + m[0].lastIndexOf('{'), end = closing(text, start, '{', '}');
    if (end < 0) { graph.skip(at(start), 'js-braces', 'JS 함수 중괄호를 해석하지 못함'); continue; }
    const child = graph.add('js', `${file}#${m[1] || 'handler:' + at(m.index).line}`, at(m.index), { selector: m[3] || null });
    graph.edge(node, child, 'includes', [loc(node), loc(child)]);
    blocks.push({ start, end, node: child, name: m[1], selector: m[3] || null,
      event: /\.on\(\s*['"](\w+)['"]/.exec(m[0])?.[1],
      eventParameter: /function\s*\(\s*(\w+)\s*\)/.exec(m[0])?.[1] });
  }
  const requests = [];
  const owner = index => blocks.filter(b => b.start <= index && b.end >= index).at(-1);
  const add = (index, raw, verb, formReceiver = null, ajax = false) => {
    const block = owner(index);
    requests.push({ from: block?.node || node, selector: block?.selector, functionName: block?.name, formReceiver, raw, verb, at: at(index), offset: index, page, ajax });
  };
  for (const m of text.matchAll(/\burl\s*:\s*/g)) {
    if (!shape[m.index]?.trim()) continue;
    const prefix = text.slice(Math.max(0, m.index - 100), m.index);
    if (!/\$\.ajax\s*\(/.test(prefix)) continue;
    const tail = text.slice(m.index, m.index + 600);
    const verb = /\b(?:type|method)\s*:\s*['"](GET|POST|PUT|DELETE|PATCH)['"]/i.exec(tail)?.[1]?.toUpperCase() || 'GET';
    add(m.index, expression(text, m.index + m[0].length), verb, null, true);
  }
  for (const m of text.matchAll(/\$\.(get|post)\s*\(\s*|\bfetch\s*\(\s*|\b(?:window\.)?location\.href\s*=\s*/g)) {
    if (!shape[m.index]?.trim()) continue;
    let verb = m[1] === 'post' ? 'POST' : 'GET';
    if (m[0].startsWith('fetch')) verb = /\bmethod\s*:\s*['"](\w+)['"]/.exec(text.slice(m.index, m.index + 400))?.[1] || verb;
    add(m.index, expression(text, m.index + m[0].length), verb.toUpperCase(), null, !m[0].includes('location.href'));
  }
  for (const m of text.matchAll(/\b(?:\w+(?:\[0\])?\.)+submit\s*\(/g)) {
    if (!shape[m.index]?.trim()) continue;
    const block = owner(m.index), start = block ? block.start + 1 : 0;
    const receiver = m[0].slice(0, m[0].lastIndexOf('submit')).replace(/\.$/, '');
    const before = text.slice(start, m.index);
    const assignments = [...before.matchAll(/\b((?:\w+(?:\[0\])?\.)+)action\s*=\s*([^;\n]+)/g)]
      .filter(a => a[1].replace(/\.$/, '') === receiver && owner(start + a.index) === block);
    add(m.index, assignments.at(-1)?.[2] || '', 'ANY', receiver);
  }
  return { file, node, text, requests, page, blocks };
}

export function linkJs(scripts, pages, graph) {
  for (const script of scripts) for (const req of script.requests) {
    if (req.handled) continue;
    if (req.formReceiver) {
      const pagesWithForm = pages.filter(p => req.page ? p.node.id === req.page.id : p.scripts.some(s => s.node.id === script.node.id));
      const forms = pagesWithForm.flatMap(p => (p.forms || []).filter(f =>
        req.formReceiver === `document.forms[${f.index}]` || req.formReceiver === `document.${f.name || f.id}` || req.functionName && req.functionName === f.handler));
      if (!req.raw && forms.length === 1 && forms[0].routes.length === 1) {
        connectRequest(graph, req.from, forms[0].routes[0].route, forms[0].verb, req.at, [forms[0].at, ...forms[0].routes[0].evidence]); continue;
      }
      if (forms.length === 1) req.verb = forms[0].verb;
    }
    const value = literal(req.raw);
    if (value !== null) { connectRequest(graph, req.from, value.trim(), req.verb, req.at, req.cancelProof || []); continue; }
    const context = /^([\w$]+)\s*\+\s*(['"])(\/[^'"]*)\2$/.exec(req.raw);
    if (context) {
      const relevant = pages.filter(p => (!req.page || req.page.id === p.node.id) && (req.page || p.scripts.some(s => s.node.id === script.node.id)) && (!req.selector || p.ids.has(req.selector.slice(1))));
      const bound = relevant.filter(p => p.contexts.has(context[1]));
      const writes = [...script.text.matchAll(new RegExp(`\\b${context[1]}\\s*=(?!=)`, 'g'))];
      if (bound.length && bound.length === relevant.length && writes.length === 0) {
        connectRequest(graph, req.from, context[3], req.verb, req.at, bound.map(p => p.contexts.get(context[1]))); continue;
      }
    }
    graph.unknown(req.from, 'requests', req.at, 'string-url', 'URL 문자열 조합/변수/폼 action은 확정하지 않음; contextPath 선언과 단일 리터럴 조합만 예외', strings(req.raw).filter(s => !s.includes('${')).map(s => s.trim()));
  }
}
