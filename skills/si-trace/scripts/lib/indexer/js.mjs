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
    blocks.push({ start, end, node: child, selector: m[3] || null });
  }
  const requests = [];
  const add = (index, raw, verb) => {
    const block = blocks.filter(b => b.start <= index && b.end >= index).at(-1);
    requests.push({ from: block?.node || node, selector: block?.selector, raw, verb, at: at(index), page });
  };
  for (const m of text.matchAll(/\burl\s*:\s*/g)) {
    if (!shape[m.index]?.trim()) continue;
    const prefix = text.slice(Math.max(0, m.index - 100), m.index);
    if (!/\$\.ajax\s*\(/.test(prefix)) continue;
    const tail = text.slice(m.index, m.index + 600);
    const verb = /\b(?:type|method)\s*:\s*['"](GET|POST|PUT|DELETE|PATCH)['"]/i.exec(tail)?.[1]?.toUpperCase() || 'GET';
    add(m.index, expression(text, m.index + m[0].length), verb);
  }
  for (const m of text.matchAll(/\$\.(get|post)\s*\(\s*|\bfetch\s*\(\s*|\b(?:window\.)?location\.href\s*=\s*/g)) {
    if (!shape[m.index]?.trim()) continue;
    let verb = m[1] === 'post' ? 'POST' : 'GET';
    if (m[0].startsWith('fetch')) verb = /\bmethod\s*:\s*['"](\w+)['"]/.exec(text.slice(m.index, m.index + 400))?.[1] || verb;
    add(m.index, expression(text, m.index + m[0].length), verb.toUpperCase());
  }
  for (const m of text.matchAll(/\b(?:\w+(?:\[0\])?\.)+submit\s*\(/g)) {
    if (!shape[m.index]?.trim()) continue;
    const before = text.slice(Math.max(0, m.index - 1200), m.index);
    const assignments = [...before.matchAll(/\.action\s*=\s*([^;\n]+)/g)];
    add(m.index, assignments.at(-1)?.[1] || '', 'ANY');
  }
  return { file, node, text, requests, page };
}

export function linkJs(scripts, pages, graph) {
  for (const script of scripts) for (const req of script.requests) {
    const value = literal(req.raw);
    if (value !== null) { connectRequest(graph, req.from, value.trim(), req.verb, req.at); continue; }
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
