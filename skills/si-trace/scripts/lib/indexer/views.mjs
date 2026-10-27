import path from 'node:path';
import { xmlElements, location, literal, hideStrings } from './source.mjs';
import { loc } from './graph.mjs';
import { pathPattern } from './config.mjs';
import { elementProfile } from './profiles.mjs';

export function viewConfiguration(xml, files, graph) {
  const beans = [];
  for (const { file, text } of xml) {
    let elements; try { elements = xmlElements(text); } catch { continue; }
    for (const bean of elements.filter(e => e.tag.split(':').at(-1) === 'bean')) {
      const properties = elements.filter(e => e.parent === bean && e.tag === 'property');
      const props = new Map(properties.map(p => [p.attrs.name, { ref: p.attrs.ref,
        values: p.attrs.value !== undefined ? [p.attrs.value] : elements.filter(e => e.start > p.start && e.end < p.end && e.tag === 'value').map(e => text.slice(e.bodyStart, e.bodyEnd).trim()),
        at: location(file, text, p.start) }]));
      const condition = elementProfile(bean, graph.profiles, file, text);
      if (condition.state === 'inactive') continue;
      beans.push({ id: bean.attrs.id || bean.attrs.name, type: bean.attrs.class || '', props, condition, at: location(file, text, bean.start),
        layout: elements.some(e => e.start > bean.start && e.end < bean.end && /\.LayoutDialect$/.test(e.attrs.class || '')) });
    }
  }
  const refs = (bean, name) => beans.filter(b => b.id && b.id === bean.props.get(name)?.ref);
  const value = (bean, name, fallback) => bean.props.get(name)?.values[0] ?? fallback;
  const templates = beans.filter(b => /TemplateResolver$/.test(b.type)).map(b => ({ ...b, prefix: value(b, 'prefix', ''), suffix: value(b, 'suffix', ''), check: value(b, 'checkExistence', 'false') === 'true' }));
  const resolvers = beans.filter(b => /ViewResolver$/.test(b.type)).map(b => {
    const engines = refs(b, 'templateEngine'), selected = engines.flatMap(e => refs(e, 'templateResolver')).map(x => templates.find(t => t === x || t.id === x.id)).filter(Boolean);
    const rawOrder = value(b, 'order', '2147483647');
    return { ...b, order: /^-?\d+$/.test(rawOrder) ? Number(rawOrder) : null,
      names: b.props.get('viewNames')?.values.flatMap(v => v.split(/[,;\s]+/).filter(Boolean)),
      thymeleaf: /ThymeleafViewResolver$/.test(b.type), jsp: /InternalResourceViewResolver$/.test(b.type), templates: selected,
      uncertainEngine: engines.length !== 1 || engines.some(e => e.condition.state !== 'active'),
      prefix: value(b, 'prefix', ''), suffix: value(b, 'suffix', ''), layout: engines.some(e => e.layout) };
  }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const resource = (prefix, name, suffix) => {
    if (/[${}]/.test(prefix + suffix) || name.includes('..')) return { files: [], complete: false };
    const ref = prefix + name.replace(/^\//, '') + (suffix && !name.endsWith(suffix) ? suffix : '');
    const tail = ref.startsWith('classpath:') ? 'src/main/resources/' + ref.replace(/^classpath:\/?/, '') : ref.startsWith('/') ? 'src/main/webapp' + ref : ref;
    const normalized = path.posix.normalize(tail);
    const found = files.filter(f => f.file === normalized || f.file.endsWith('/' + normalized));
    const skipped = graph.skipped.some(s => s.file === normalized || s.file.endsWith('/' + normalized));
    return { files: found, complete: !skipped && found.length <= 1 };
  };
  const template = name => {
    const active = templates.filter(t => t.condition.state !== 'inactive');
    const matches = active.flatMap(t => resource(t.prefix, name, t.suffix).files.map(f => ({ file: f, config: t })));
    const unique = [...new Map(matches.map(m => [m.file.file, m])).values()];
    return { matches: unique, complete: active.length === 1 && active[0].condition.state === 'active' && unique.length === 1 };
  };
  return { resolvers, templates, resource, template, layout: resolvers.some(r => r.thymeleaf && r.layout) };
}

export function linkViews(classes, config, graph) {
  if (!config.resolvers.some(r => r.thymeleaf)) return;
  for (const cls of classes.filter(c => c.annotations.some(a => a.name === 'Controller') && !c.annotations.some(a => a.name === 'ResponseBody'))) {
    for (const method of cls.methods) {
      if (!/(?:^|\.)String$/.test(method.node.details.return_type) || method.annotations.some(a => a.name === 'ResponseBody')) continue;
      const shape = hideStrings(method.body);
      for (const m of shape.matchAll(/\breturn\b([^;]*);/g)) {
        const expression = method.body.slice(m.index + 6, m.index + m[0].length - 1).trim(), view = literal(expression);
        const at = location(cls.file, cls.text, method.bodyStart + m.index);
        if (expression === 'null') continue;
        if (view === null) { graph.unknown(method.node, 'renders', at, 'dynamic-view', 'Controller 반환 뷰가 리터럴 아님'); continue; }
        if (/^(?:redirect|forward):/.test(view)) continue;
        let uncertain = false, linked = false;
        for (const resolver of config.resolvers) {
          const dynamicNames = resolver.names?.some(n => /[${}]/.test(n));
          if (resolver.names && !dynamicNames && !resolver.names.some(n => pathPattern(n).test(view))) continue;
          if (!resolver.jsp && !resolver.thymeleaf) { uncertain = true; continue; }
          const configurations = resolver.jsp ? [resolver] : resolver.templates;
          const evidence = [at, resolver.at, ...[...resolver.props.values()].map(p => p.at), ...configurations.flatMap(t => [t.at, ...[...t.props.values()].map(p => p.at)])];
          const results = configurations.map(t => ({ config: t, ...config.resource(t.prefix, view, t.suffix) }));
          if (resolver.condition.state !== 'active' || configurations.some(t => t.condition.state !== 'active') || resolver.thymeleaf && resolver.uncertainEngine) uncertain = true;
          if (resolver.thymeleaf && configurations.length && configurations.every(t => t.check) && results.every(r => r.complete && !r.files.length)) continue;
          const matches = results.flatMap(r => r.files);
          const tie = config.resolvers.filter(r => r.order === resolver.order && (!r.names || r.names.some(n => pathPattern(n).test(view)))).length > 1;
          const confirmed = !uncertain && !dynamicNames && !tie && resolver.order !== null && resolver.condition.state === 'active'
            && configurations.length === 1 && configurations[0].condition.state === 'active' && results[0].complete && matches.length === 1;
          for (const file of matches) {
            const to = graph.find(file.file).find(n => ['jsp', 'template'].includes(n.kind));
            if (!to) continue;
            graph.edge(method.node, to, 'renders', [...evidence, loc(to)], confirmed ? 'CONFIRMED' : 'LIKELY', confirmed ? undefined : '리졸버 순서·조건·파일 존재/설정을 유일하게 판정하지 못함');
            linked = true;
          }
          if (confirmed) break;
          uncertain = true;
        }
        if (!linked) graph.unknown(method.node, 'renders', at, 'view-resolution', '적용 가능한 뷰 리졸버/템플릿을 확인하지 못함');
      }
    }
  }
}
