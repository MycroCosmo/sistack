import { strings, literal, xmlElements, location } from './source.mjs';
import { loc } from './graph.mjs';

function mapping(annotation) {
  const value = /(?:value|path)\s*=\s*(\{[^}]*\}|"[^"]*")/.exec(annotation.args)?.[1];
  const paths = value ? strings(value) : /^\s*(?:"|\{)/.test(annotation.args) ? strings(annotation.args.split(/,\s*\w+\s*=/)[0]) : [''];
  const method = annotation.name.replace('Mapping', '').toUpperCase();
  const verbs = method === 'REQUEST' ? [...annotation.args.matchAll(/RequestMethod\.(\w+)/g)].map(m => m[1]) : [method];
  return { paths: paths.length ? paths : [''], verbs: verbs.length ? verbs : ['ANY'] };
}

export function collectSpring(classes, xmlFiles, graph) {
  for (const cls of classes) {
    if (!cls.annotations.some(a => ['Controller', 'RestController'].includes(a.name))) continue;
    const baseAnnotation = cls.annotations.find(a => a.name === 'RequestMapping');
    const base = baseAnnotation ? mapping(baseAnnotation) : { paths: [''], verbs: ['ANY'] };
    for (const method of cls.methods) for (const a of method.annotations.filter(a => /^(?:Request|Get|Post|Put|Delete|Patch)Mapping$/.test(a.name))) {
      const own = mapping(a);
      for (const prefix of base.paths) for (const suffix of own.paths) for (const verb of own.verbs[0] === 'ANY' ? base.verbs : own.verbs) {
        const route = ('/' + prefix + '/' + suffix).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
        if (route.includes('${')) { graph.unknown(method.node, 'maps_to', location(cls.file, cls.text, a.start), 'dynamic-mapping', '매핑 경로가 환경 설정 치환임'); continue; }
        const endpoint = graph.add('endpoint', `${verb} ${route}`, location(cls.file, cls.text, a.start), { path: route, http_method: verb });
        graph.edge(endpoint, method.node, 'maps_to', [loc(endpoint), loc(method.node), loc(cls.node)]);
      }
      if (/\b(?:params|headers|consumes|produces)\s*=/.test(a.args)) graph.skip(location(cls.file, cls.text, a.start), 'mapping-conditions', 'HTTP method/path 외 params·headers·미디어 타입 조건은 경로 선택에 미반영');
    }
  }
  for (const { file, text } of xmlFiles) {
    let elements;
    try { elements = xmlElements(text); } catch { continue; }
    const beans = elements.filter(e => /(?:^|:)bean$/.test(e.tag));
    const resolveBean = value => {
      const bean = beans.find(e => e.attrs.id === value || e.attrs.name === value);
      return bean ? classes.filter(c => c.name === bean.attrs.class) : [];
    };
    for (const bean of beans) {
      const cls = classes.find(c => c.name === bean.attrs.class);
      if (cls && (bean.attrs.id || bean.attrs.name)) cls.node.details.bean ||= bean.attrs.id || bean.attrs.name;
      if (bean.attrs.class?.endsWith('SimpleUrlHandlerMapping')) {
        for (const p of elements.filter(e => e.start > bean.start && e.end < bean.end && ['prop', 'entry'].includes(e.tag))) {
          const route = p.attrs.key;
          if (!route?.startsWith('/')) continue;
          const target = p.attrs['value-ref'] || text.slice(p.bodyStart, p.bodyEnd).trim();
          const endpoint = graph.add('endpoint', `ANY ${route}`, location(file, text, p.start), { path: route, http_method: 'ANY' });
          const candidates = resolveBean(target).flatMap(c => c.methods.filter(m => ['handleRequest', 'handleRequestInternal'].includes(m.name)).map(m => m.node));
          graph.link(endpoint, candidates, 'maps_to', loc(endpoint));
        }
      }
      if (bean.attrs.name?.startsWith('/')) {
        const endpoint = graph.add('endpoint', `ANY ${bean.attrs.name}`, location(file, text, bean.start), { path: bean.attrs.name, http_method: 'ANY' });
        graph.link(endpoint, classes.filter(c => c.name === bean.attrs.class).flatMap(c => c.methods.filter(m => ['handleRequest', 'handleRequestInternal'].includes(m.name)).map(m => m.node)), 'maps_to', loc(endpoint));
      }
    }
    for (const interceptor of elements.filter(e => /(?:^|:)interceptor$/.test(e.tag))) {
      const children = elements.filter(e => e.start > interceptor.start && e.end < interceptor.end);
      const paths = children.filter(e => /(?:^|:)mapping$/.test(e.tag) && !e.tag.endsWith('exclude-mapping')).map(e => e.attrs.path);
      const excludes = children.filter(e => e.tag.endsWith('exclude-mapping')).map(e => e.attrs.path);
      const config = graph.add('config', `interceptor:${file}:${interceptor.start}`, location(file, text, interceptor.start), { paths, excludes });
      const candidates = children.flatMap(e => e.tag.endsWith('ref') ? resolveBean(e.attrs.bean) : e.attrs.class ? classes.filter(c => c.name === e.attrs.class) : []);
      graph.link(config, candidates.flatMap(c => c.methods.filter(m => m.name === 'preHandle').map(m => m.node)), 'calls', loc(config));
      graph.skip(loc(config), 'interceptor-runtime-order', '경로 설정과 preHandle만 수집; 런타임 제외 경로·세션 값·실행 순서의 endpoint별 데이터 흐름은 수동 확인');
    }
  }
}

export function connectRequest(graph, from, route, verb, at, extra = []) {
  const path = route.trim().split(/[?#]/)[0];
  if (!path.startsWith('/') || path.includes('${') || path.includes('<')) return graph.unknown(from, 'requests', at, 'dynamic-url', '상대/동적/외부 URL은 배포 기준 경로 확정 불가');
  const candidates = graph.nodes.filter(n => n.kind === 'endpoint' && n.details.path === path && (verb === 'ANY' || n.details.http_method === 'ANY' || n.details.http_method === verb));
  graph.link(from, candidates, 'requests', at, '동일 경로의 매핑 후보 또는 HTTP method가 여러 개임', extra);
}
