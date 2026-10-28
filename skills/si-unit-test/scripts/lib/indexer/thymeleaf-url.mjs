import { closing, literal } from './source.mjs';
import { loc } from './graph.mjs';

// Read expressions without executing Spring EL/OGNL, including legacy web utility objects.
export function thymeleafUrls(value) {
  const urls = [];
  for (let i = 0; i < value.length; i++) {
    if (!value.startsWith('@{', i)) continue;
    const end = closing(value, i + 1, '{', '}');
    if (end < 0) return [{ route: null, reason: '닫히지 않은 Thymeleaf URL 식' }];
    let expression = value.slice(i + 2, end).trim(), cut = expression.length;
    let depth = 0, quote = null;
    for (let j = 0; j < expression.length; j++) {
      const ch = expression[j];
      if (quote) { if (ch === quote && expression[j - 1] !== '\\') quote = null; continue; }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '(' && depth === 0) { cut = j; break; }
    }
    let route = expression.slice(0, cut).trim();
    if (route.startsWith('${') && route.endsWith('}')) route = literal(route.slice(2, -1)) ?? route;
    const context = /^(?:\$\{#request\.(?:contextPath|getContextPath\(\))\}\s*\+\s*(['"])(\/[^'"]*)\1|\$\{#request\.(?:contextPath|getContextPath\(\))\s*\+\s*(['"])(\/[^'"]*)\3\})$/.exec(route);
    if (context) route = context[2] || context[4];
    if (!route.startsWith('/') || route.startsWith('//') || /[$*#]\{|\+|\$\{|#(?:session|request)\b/.test(route)) urls.push({ route: null, reason: 'URL 베이스가 동적이거나 외부/상대 경로임' });
    else urls.push({ route: route.split(/[?#]/)[0] });
    i = end;
  }
  if (!urls.length) {
    const route = literal(value) ?? value;
    urls.push({ route: /^\/(?!\/)/.test(route) && !/[${}]/.test(route) ? route.split(/[?#]/)[0] : null, reason: '정적 루트 경로 또는 @{...}로 확정하지 못함' });
  }
  // A conditional containing an unknown branch cannot be proved by the literal branch alone.
  const outside = value.replace(/@\{[\s\S]*\}/g, '').trim();
  if (outside.includes('?') && !/:\s*$/.test(outside) && urls.length < 2) urls.push({ route: null, reason: '동적 URL 조건 분기가 남아 있음' });
  return urls;
}

export function connectThymeleafRequest(graph, from, value, verb, at, extra = [], options = {}) {
  for (const url of thymeleafUrls(value)) {
    if (!url.route) { graph.unknown(from, 'requests', at, 'thymeleaf-url', url.reason); continue; }
    const route = url.route;
    if (/\.(?:css|js|png|jpe?g|gif|svg|ico|woff2?)(?:$|[?#])/i.test(route)) continue;
    const normalized = path => path.replace(/\{[^}]+\}/g, '{}');
    const endpoints = graph.nodes.filter(n => n.kind === 'endpoint' && (verb === 'ANY' || n.details.http_method === 'ANY' || n.details.http_method === verb));
    const exact = endpoints.filter(n => n.details.path === route);
    const candidates = exact.length ? exact : endpoints.filter(n => {
      if (route.includes('{')) return normalized(n.details.path) === normalized(route);
      const pattern = n.details.path.split(/(\{[^}]+\})/).map(s => s.startsWith('{') ? '[^/]+' : s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');
      return n.details.path.includes('{') && new RegExp('^' + pattern + '$').test(route);
    });
    if (options.status && candidates.length) for (const candidate of candidates) graph.edge(from, candidate, 'requests', [at, loc(candidate), ...extra], options.status, options.reason);
    else graph.link(from, candidates, 'requests', at, 'URL 패턴/메서드 매핑 후보가 여러 개임', extra);
  }
}

export function inlineJavascript(source) {
  return source.replace(/\/\*\[\[([\s\S]*?)\]\]\*\/\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|null|false|true)?/g, (whole, expression) => {
    const urls = thymeleafUrls(expression), route = urls.length === 1 && urls[0].route;
    const replacement = route ? JSON.stringify(route) : 'TH_DYN';
    // Preserve line count for source evidence; offsets within a line are not exported.
    return replacement + ' '.repeat(Math.max(0, whole.replace(/\n/g, '').length - replacement.length)) + '\n'.repeat((whole.match(/\n/g) || []).length);
  });
}
