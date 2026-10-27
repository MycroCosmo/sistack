import path from 'node:path';
import { attrs, stripComments, location, closing, literal, hideStrings } from './source.mjs';
import { loc } from './graph.mjs';
import { collectJs } from './js.mjs';
import { thymeleafUrls, connectThymeleafRequest, inlineJavascript } from './thymeleaf-url.mjs';

export function collectThymeleaf(file, source, graph) {
  const text = stripComments(source, 'markup'), at = i => location(file, text, i);
  const node = graph.add('template', file, at(0));
  const page = { file, text, node, requests: [], refs: [], scriptRefs: [], scripts: [], inline: [], forms: [], elements: [], layoutFragments: [], ids: new Set(), contexts: new Map() };
  const fragments = [];
  for (const m of text.matchAll(/<([\w:-]+)\b(?:"[^"]*"|'[^']*'|[^'">])*>/g)) {
    const a = Object.fromEntries(Object.entries(attrs(m[0])).map(([k, v]) => [k.toLowerCase(), v]));
    const tag = m[1].toLowerCase(), point = at(m.index), element = { tag, attrs: a, at: point, data: new Map() };
    page.elements.push(element);
    if (a.id) page.ids.add(a.id);
    if (a['layout:fragment']) {
      const name = /^([\w-]+)$/.exec(a['layout:fragment'])?.[1];
      if (name) page.layoutFragments.push(graph.add('fragment', file + '#' + name, point, { role: 'layout-fragment' }));
    }
    if (a['th:fragment']) {
      const name = /^([\w-]+)(?:\s*\(|$)/.exec(a['th:fragment'])?.[1];
      if (name) {
        const fragment = graph.add('fragment', file + '#' + name, point);
        const tags = new RegExp(`<\\/?${tag}\\b(?:"[^"]*"|'[^']*'|[^'">])*>`, 'gi');
        tags.lastIndex = m.index + m[0].length;
        let depth = 1, end = text.length;
        for (let next; (next = tags.exec(text));) {
          depth += next[0].startsWith('</') ? -1 : next[0].endsWith('/>') ? 0 : 1;
          if (!depth) { end = next.index; break; }
        }
        fragments.push({ node: fragment, start: m.index, end });
      }
    }
    for (const attribute of ['th:replace', 'th:insert', 'th:include', 'layout:decorate']) {
      if (a[attribute]) page.refs.push({ value: a[attribute], kind: attribute === 'layout:decorate' ? 'decorates' : 'includes', at: point, offset: m.index });
    }
    for (const [key, value] of Object.entries(a)) if (key.startsWith('th:data-')) element.data.set(key.slice(3), value);
    if (a['th:attr']) for (const match of a['th:attr'].matchAll(/\b(data-[\w-]+)\s*=\s*/g)) {
      const value = a['th:attr'].slice(match.index + match[0].length), start = value.indexOf('@{');
      const end = start >= 0 ? closing(value, start + 1, '{', '}') : -1;
      element.data.set(match[1], end >= 0 ? value.slice(start, end + 1) : value.split(',')[0]);
    }
    if (tag === 'form') {
      const value = a['th:action'] || a.action;
      if (value) {
        const routes = thymeleafUrls(value).filter(r => r.route).map(r => ({ ...r, evidence: [point] }));
        page.forms.push({ id: a.id, name: a.name, index: page.forms.length, verb: (a.method || 'GET').toUpperCase(), at: point, routes });
      }
    }
    for (const attribute of ['action', 'href', 'src']) {
      const value = a['th:' + attribute] || a[attribute];
      if (!value || /^(?:#|javascript:|https?:|\/\/|mailto:|data:)/i.test(value)) continue;
      if (tag === 'script' && attribute === 'src') {
        for (const url of thymeleafUrls(value)) if (url.route) page.scriptRefs.push({ ref: url.route, at: point });
        continue;
      }
      if ((tag === 'form' && attribute === 'action') || (tag === 'a' && attribute === 'href') || (['img', 'iframe', 'source'].includes(tag) && attribute === 'src')) {
        page.requests.push({ value, verb: tag === 'form' ? (a.method || 'GET').toUpperCase() : 'GET', at: point, offset: m.index });
      }
    }
  }
  for (const item of [...page.requests, ...page.refs]) item.from = fragments.filter(f => f.start <= item.offset && item.offset < f.end).sort((a, b) => b.start - a.start)[0]?.node || node;
  for (const m of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (!m[2].trim()) continue;
    const body = attrs(m[1])['th:inline'] === 'javascript' ? inlineJavascript(m[2]) : m[2];
    const script = collectJs(file, body, graph, { baseOffset: m.index + m[0].indexOf('>') + 1, fullSource: text, page: node });
    for (const req of script.requests) {
      if (/^\w+$/.test(req.raw)) {
        const declarations = [...script.text.matchAll(new RegExp(`\\b(?:var|let|const)\\s+${req.raw}\\s*=\\s*([^;\\n]+)`, 'g'))];
        if (declarations.length === 1 && literal(declarations[0][1]) !== null && [...script.text.matchAll(new RegExp(`\\b${req.raw}\\s*=(?!=)`, 'g'))].length === 1) req.raw = declarations[0][1];
      }
      if (literal(req.raw) !== null) {
        req.thymeleafValue = literal(req.raw);
        req.handled = true;
      }
    }
    page.inline.push(script);
  }
  return page;
}

function fragmentReference(value) {
  const raw = value.trim().replace(/^~\{([\s\S]*)\}$/, '$1').trim();
  const [file, selector] = raw.split(/\s*::\s*/);
  if (/[$*#]\{|\?|\+/.test(file)) return null;
  const fragment = selector ? /^([\w-]+)(?:\s*\(|$)/.exec(selector)?.[1] : null;
  if (selector && !fragment) return null;
  return { file: file.trim(), fragment };
}

export function linkThymeleaf(pages, scripts, config, graph) {
  const children = new Map();
  for (const page of pages) {
    const nested = [];
    for (const ref of page.refs) {
      const parsed = fragmentReference(ref.value);
      if (!parsed) { graph.unknown(ref.from, ref.kind, ref.at, 'dynamic-fragment', '프래그먼트/레이아웃 이름이 동적이거나 선택자 미지원'); continue; }
      const result = !parsed.file || parsed.file === 'this' ? { matches: [{ file: page, config: null }], complete: true }
        : config.template(parsed.file);
      const candidates = [];
      for (const match of result.matches) {
        const target = pages.find(p => p.file === match.file.file);
        if (!target) continue;
        nested.push({ page: target });
        if (ref.kind === 'decorates') {
          page.node.details.layout_bindings ||= [];
          for (const fragment of page.layoutFragments) {
            const matching = target.layoutFragments.find(f => f.name.split('#').at(-1) === fragment.name.split('#').at(-1));
            if (matching) page.node.details.layout_bindings.push({ from: fragment.name, to: matching.name, evidence: [loc(fragment), loc(matching)] });
          }
        }
        const nodes = parsed.fragment ? graph.find(target.file + '#' + parsed.fragment, ['fragment']) : [target.node];
        candidates.push(...nodes);
      }
      if (!candidates.length) { graph.unknown(ref.from, ref.kind, ref.at, 'missing-fragment', '프래그먼트/템플릿 선언을 찾지 못함'); continue; }
      const confirmed = result.complete && candidates.length === 1 && (ref.kind !== 'decorates' || config.layout);
      for (const target of candidates) graph.edge(ref.from, target, ref.kind, [ref.at, loc(target), ...(ref.kind === 'decorates' ? (page.node.details.layout_bindings || []).flatMap(b => b.evidence) : [])], confirmed ? 'CONFIRMED' : 'LIKELY', confirmed ? undefined : '템플릿 리졸버/fragment 후보 또는 LayoutDialect 등록 미확정');
    }
    children.set(page.file, nested);
    for (const request of page.requests) connectThymeleafRequest(graph, request.from, request.value, request.verb, request.at);
    for (const script of page.inline) for (const req of script.requests) if (req.thymeleafValue !== undefined) connectThymeleafRequest(graph, req.from, req.thymeleafValue, req.verb, req.at);
  }
  const templateIds = new Set(graph.nodes.filter(n => ['template', 'fragment'].includes(n.kind)).map(n => n.id));
  const adjacency = new Map();
  for (const edge of graph.edges.filter(e => ['includes', 'decorates'].includes(e.kind) && templateIds.has(e.from) && templateIds.has(e.to))) {
    const list = adjacency.get(edge.from) || []; list.push(edge); adjacency.set(edge.from, list);
  }
  const complete = new Set(), active = new Set();
  const detectCycles = id => {
    if (complete.has(id)) return;
    active.add(id);
    for (const edge of adjacency.get(id) || []) {
      if (active.has(edge.to)) { edge.status = 'LIKELY'; edge.reason = '템플릿 include/decorate 순환 참조'; }
      else detectCycles(edge.to);
    }
    active.delete(id); complete.add(id);
  };
  for (const id of templateIds) detectCycles(id);
  for (const page of pages) {
    const visited = new Set();
    const visit = current => {
      if (visited.has(current.file)) return; visited.add(current.file);
      for (const ref of current.scriptRefs) {
        const webRoot = current.file.includes('/webapp/') ? current.file.split('/webapp/')[0] + '/webapp' : '';
        const name = ref.ref.startsWith('/') ? webRoot + ref.ref : path.posix.join(path.posix.dirname(current.file), ref.ref);
        const targets = scripts.filter(s => s.file === name);
        for (const target of targets) {
          graph.edge(current.node, target.node, 'includes', [ref.at, loc(target.node)]);
          if (!page.scripts.includes(target)) page.scripts.push(target);
        }
        if (!targets.length) graph.skip(ref.at, 'external-script', '외부/벤더/미수집 JS는 실행하거나 다운로드하지 않음');
      }
      for (const child of children.get(current.file) || []) visit(child.page);
    };
    visit(page);
  }
  linkDataUrls(pages, graph);
}

function linkDataUrls(pages, graph) {
  const usedScripts = new Set(pages.flatMap(p => [...p.scripts, ...p.inline]));
  for (const script of usedScripts) {
    const handlers = [];
    for (const m of script.text.matchAll(/\$\(\s*(['"])(#[\w-]+(?:\s*,\s*#[\w-]+)*)\1\s*\)\.on\(\s*['"]\w+['"]\s*,\s*function\s*\([^)]*\)\s*\{/g)) {
      if (!hideStrings(script.text)[m.index]?.trim()) continue;
      const start = m.index + m[0].lastIndexOf('{'), end = closing(script.text, start, '{', '}');
      if (end >= 0) handlers.push({ start, end, ids: m[2].split(/\s*,\s*/).map(s => s.slice(1)), at: { file: script.file, line: script.node.line + script.text.slice(0, m.index).split('\n').length - 1 } });
    }
    for (const req of script.requests) {
      const handler = handlers.find(h => h.start <= req.offset && req.offset <= h.end);
      if (!handler) continue;
      const prefix = script.text.slice(handler.start + 1, req.offset);
      let raw = req.raw;
      if (/^\w+$/.test(raw)) {
        const declarations = [...prefix.matchAll(new RegExp(`\\b(?:var|let|const)\\s+${raw}\\s*=\\s*([^;\\n]+)`, 'g'))];
        if (declarations.length === 1 && [...prefix.matchAll(new RegExp(`\\b${raw}\\s*=(?!=)`, 'g'))].length === 1) raw = declarations[0][1].trim();
      }
      const accessor = /^(\$\(\s*this\s*\)|\w+)\.(data|attr)\(\s*(['"])([\w-]+)\3\s*\)$/.exec(raw);
      const dataset = /^this\.dataset\.([\w]+)$/.exec(raw);
      if (!accessor && !dataset) continue;
      const receiver = accessor?.[1], key = dataset ? 'data-' + dataset[1].replace(/[A-Z]/g, c => '-' + c.toLowerCase()) : accessor[2] === 'data' ? 'data-' + accessor[4] : accessor[4];
      if (receiver && !receiver.startsWith('$')) {
        const declaration = new RegExp(`\\b(?:var|let|const)\\s+${receiver}\\s*=\\s*\\$\\(\\s*this\\s*\\)`);
        if (!declaration.test(prefix) || [...prefix.matchAll(new RegExp(`\\b${receiver}\\s*=(?!=)`, 'g'))].length !== 1) continue;
      }
      const applicable = pages.filter(p => p.scripts.includes(script) || p.inline.includes(script));
      for (const page of applicable) for (const id of handler.ids) {
        const elements = page.elements.filter(e => e.attrs.id === id && e.data.has(key));
        for (const element of elements) {
          const from = graph.add('template', page.file + '#' + id, element.at, { selector: '#' + id });
          const writes = new RegExp(`\\.(?:data|attr)\\(\\s*['"]${key.replace(/^data-/, '(?:data-)?')}['"]\\s*,|\\.dataset\\.${key.slice(5)}\\s*=`);
          if (elements.length !== 1 || writes.test(prefix)) graph.unknown(from, 'requests', element.at, 'data-url-binding', '요소 ID 중복 또는 data URL의 JS 재할당');
          else connectThymeleafRequest(graph, from, element.data.get(key), req.verb, element.at, [handler.at, req.at]);
        }
      }
      req.handled = true;
    }
  }
}
