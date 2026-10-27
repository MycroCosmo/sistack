import { mask } from '../mask/index.mjs';

// 파싱 결과는 후보 위치다. 로그의 프레임이 근본 원인이라는 뜻은 아니다.
export function parseTrace(input, { packagePrefix = '' } = {}) {
  if (typeof packagePrefix !== 'string' || (packagePrefix && !/^[\w$]+(?:\.[\w$]+)*\.?$/.test(packagePrefix))) throw new Error('프로젝트 패키지 접두사 오류');
  const text = mask(input), exceptions = [], frames = [];
  let current = null, pending = null;
  const stack = [];
  for (const [i, line] of text.split(/\r?\n/).entries()) {
    // MyBatis의 ### 블록은 현재 예외의 메시지이며 새 스택 헤더가 아니다.
    if (/^\s*###(?:\s|$)/.test(line)) continue;
    const marker = /^(\s*)(Caused by:|Suppressed:)\s*$/.exec(line);
    if (marker) {
      pending = { label: marker[2], indent: marker[1].replaceAll('\t', '    ').length };
      continue;
    }
    const ex = /^\s*(?:Exception in thread "[^"]+"\s+)?(?:(Caused by:|Suppressed:)\s+)?((?:[\w$]+\.)*(?:[\w$]*(?:Exception|Error)|Throwable))(?::\s*(.*))?$/.exec(line);
    if (ex) {
      const indent = pending?.indent ?? line.match(/^\s*/)[0].replaceAll('\t', '    ').length;
      const label = ex[1] ?? pending?.label;
      const relation = label === 'Caused by:' ? 'cause' : label === 'Suppressed:' ? 'suppressed' : 'root';
      pending = null;
      while (stack.length && (stack.at(-1).indent > indent || (relation === 'suppressed' && stack.at(-1).indent >= indent))) stack.pop();
      const parent = relation === 'root' ? null : stack.at(-1)?.id ?? null;
      if (relation === 'root') stack.length = 0;
      current = exceptions.length;
      exceptions.push({ id: current, parent, relation, type: ex[2], message: ex[3] ?? '', log_line: i + 1 });
      stack.push({ id: current, indent });
      continue;
    }
    if (line.trim()) pending = null;
    const frame = /^\s*at\s+(?:[\w.@-]+\/){0,2}([\w.$]+)\.([^\s.(]+)\(([^()]*)\)\s*$/.exec(line);
    if (frame) {
      const source = /^([^:]+\.java):(\d+)$/.exec(frame[3]);
      frames.push({ exception: current, class: frame[1], method: frame[2], file: source?.[1] ?? null,
        line: source ? Number(source[2]) : null, origin: frame[3], log_line: i + 1,
        project: Boolean(packagePrefix && (frame[1] === packagePrefix.replace(/\.$/, '') || frame[1].startsWith(packagePrefix.replace(/\.$/, '') + '.'))) });
      continue;
    }
    const elided = /^\s*\.\.\. (\d+) (?:more|common frames omitted)/.exec(line);
    if (elided && current !== null) exceptions[current].elided_frames = Number(elided[1]);
  }
  return { text, exceptions, frames, project_frames: frames.filter(f => f.project),
    database_codes: [...new Set(text.match(/\bORA-\d{5}\b|\bSQLSTATE\s*[:=]?\s*[A-Z0-9]{5}\b/g) ?? [])],
    unverified: ['예외 체인은 로그 구조이며 원인 확정이 아니다', ...(exceptions.length ? [] : ['예외가 없는 증상 또는 지원하지 않는 로그 형식'])] };
}
