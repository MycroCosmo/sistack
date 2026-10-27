export const blank = text => text.replace(/[^\r\n]/g, ' ');
export const lineAt = (text, offset) => text.slice(0, offset).split('\n').length;
export const location = (file, text, offset = 0) => ({ file, line: lineAt(text, offset) });

// Offsets survive comment removal; quotes protect URL slashes and SQL literals.
export function stripComments(text, mode = 'code') {
  if (mode === 'markup') return text.replace(/<%--[\s\S]*?--%>|<!--[\s\S]*?-->/g, blank);
  let out = '', i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const start = i++, quote = ch;
      while (i < text.length) {
        if (text[i] === '\\') { i += 2; continue; }
        if (text[i++] === quote) {
          if (mode === 'sql' && text[i] === quote) { i++; continue; }
          break;
        }
      }
      out += text.slice(start, i);
    } else if (text.startsWith('/*', i)) {
      const end = text.indexOf('*/', i + 2);
      if (end < 0) throw new Error('unterminated-comment');
      out += blank(text.slice(i, end + 2)); i = end + 2;
    } else if (text.startsWith(mode === 'sql' ? '--' : '//', i)) {
      let end = text.indexOf('\n', i); if (end < 0) end = text.length;
      out += blank(text.slice(i, end)); i = end;
    } else { out += ch; i++; }
  }
  return out;
}

export function hideStrings(text) {
  return text.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, blank);
}

export function closing(text, start, open = '(', close = ')') {
  const clean = hideStrings(text);
  let depth = 0;
  for (let i = start; i < clean.length; i++) {
    if (clean[i] === open) depth++;
    if (clean[i] === close && --depth === 0) return i;
  }
  return -1;
}

export const strings = text => [...text.matchAll(/(["'])((?:\\.|(?!\1)[^\\])*)\1/g)].map(m => m[2]);
export function literal(text) {
  const match = /^\s*(["'])((?:\\.|(?!\1)[^\\])*)\1\s*$/.exec(text);
  return match ? match[2] : null;
}
export function attrs(text) {
  return Object.fromEntries([...text.matchAll(/([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)].map(m => [m[1], m[3] ?? m[4]]));
}

export function annotations(text) {
  const found = [];
  const pattern = /@([\w.]+)/g;
  const shape = hideStrings(text);
  for (let m; (m = pattern.exec(shape));) {
    let end = pattern.lastIndex;
    while (/\s/.test(text[end] || '') && end < text.length) end++;
    let args = '';
    if (text[end] === '(') {
      const last = closing(text, end);
      if (last < 0) throw new Error('unterminated-annotation');
      args = text.slice(end + 1, last); end = last + 1;
    }
    found.push({ name: m[1].split('.').at(-1), args, start: m.index, end });
    pattern.lastIndex = end;
  }
  return found;
}

export function xmlElements(text) {
  const cleaned = stripComments(text, 'markup');
  const elements = [], stack = [];
  const tag = /<!\[CDATA\[[\s\S]*?\]\]>|<\?[^?]*\?>|<!DOCTYPE[\s\S]*?>|<\/?([\w:.-]+)\b(?:"[^"]*"|'[^']*'|[^'">])*>/g;
  for (const m of cleaned.matchAll(tag)) {
    if (!m[1]) continue;
    if (m[0].startsWith('</')) {
      const element = stack.pop();
      if (!element || element.tag !== m[1]) throw new Error('malformed-xml');
      element.end = m.index + m[0].length; element.bodyEnd = m.index;
    } else {
      const element = { tag: m[1], attrs: attrs(m[0]), start: m.index, bodyStart: m.index + m[0].length, bodyEnd: m.index + m[0].length, end: m.index + m[0].length, parent: stack.at(-1) };
      elements.push(element);
      if (!m[0].endsWith('/>')) stack.push(element);
    }
  }
  if (stack.length) throw new Error('malformed-xml');
  return elements;
}
