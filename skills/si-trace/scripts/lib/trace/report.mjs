export const disclaimer = '> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.';
const safe = s => String(s).replaceAll('|', '\\|').replaceAll('\n', ' ');
const mermaid = s => String(s).replace(/["<>`\r\n]/g, ' ').replaceAll('&', '&amp;').replaceAll('[', '&#91;').replaceAll(']', '&#93;');
const points = evidence => evidence.map(p => `\`${p.file}:${p.line}\``).join(', ');

export function renderReport(trace, review, status) {
  const nodes = new Map(trace.nodes.map(n => [n.id, n]));
  const lines = [disclaimer, '', '# si-trace 실행 결과', '', `상태: ${status}. 연결은 정적 소스 근거(증거 2단계)이며 실제 앱/DB 실행을 뜻하지 않는다.`, '', '## 개요', '', ...review.overview, '', '## 동작 흐름', '', ...review.flow, '', '```text'];
  const adjacency = new Map();
  for (const e of trace.edges) { const list = adjacency.get(e.from) || []; list.push(e); adjacency.set(e.from, list); }
  const expanded = new Set();
  function tree(id, indent = '') {
    if (expanded.has(id)) return; expanded.add(id);
    for (const e of adjacency.get(id) || []) {
      lines.push(`${indent}└─ ${e.kind} [${e.status}] → ${nodes.get(e.to).name}`);
      tree(e.to, indent + '   ');
    }
  }
  const roots = trace.roots?.length ? trace.roots : trace.nodes.filter(n => !trace.edges.some(e => e.to === n.id)).map(n => n.id);
  for (const id of roots) { if (nodes.has(id)) { lines.push(nodes.get(id).name); tree(id); } }
  for (const n of trace.nodes) if (!expanded.has(n.id) && adjacency.has(n.id)) { lines.push(n.name); tree(n.id); }
  lines.push('```', '', '```mermaid', 'flowchart TD');
  const labels = new Map(trace.nodes.map((n, i) => [n.id, `n${i}`]));
  for (const n of trace.nodes) lines.push(`  ${labels.get(n.id)}["${mermaid(n.name)}"]`);
  for (const e of trace.edges) lines.push(`  ${labels.get(e.from)} -->|"${e.kind} ${e.status}"| ${labels.get(e.to)}`);
  lines.push('```', '', '## 파일 위치', '', '| 계층 | 위치 | 이름 |', '|---|---|---|');
  for (const n of trace.nodes) lines.push(`| ${n.kind} | ${points([n])} | ${safe(n.name)} |`);
  lines.push('', '## 연결 근거', '', '| 출발 → 도착 | 관계·상태 | 소스 근거 |', '|---|---|---|');
  for (const e of trace.edges) lines.push(`| ${safe(nodes.get(e.from).name)} → ${safe(nodes.get(e.to).name)} | ${e.kind} / ${e.status} | ${points(e.evidence)} |`);
  lines.push('', '## 관련 테이블', '');
  const sql = trace.edges.filter(e => ['reads', 'writes'].includes(e.kind));
  if (!sql.length) lines.push('확인된 읽기/쓰기 대상 0건. 동적 대상은 확정 못 한 경로를 확인한다.');
  for (const e of sql) lines.push(`- ${e.kind === 'reads' ? '읽기' : '쓰기'}: ${nodes.get(e.to).name} — ${e.status}, ${points(e.evidence)}`);
  lines.push('', '## 함정', '');
  for (const t of review.traps) lines.push(`- ${t.text} (${points(t.evidence)})`);
  if (!review.traps.length) lines.push('이번 범위에서 추가로 확인한 함정 0건.');
  lines.push('', '## 숨은 경로 확인', '');
  for (const h of review.hidden_paths) lines.push(`- ${h.category}: ${h.status} — ${h.note}${h.evidence.length ? ` (${points(h.evidence)})` : ''}`);
  lines.push('', '## 확정 못 한 경로', '');
  for (const e of trace.edges.filter(e => e.status !== 'CONFIRMED')) lines.push(`- ${nodes.get(e.from).name} → ${nodes.get(e.to).name}: ${e.status} — ${e.reason}`);
  for (const item of review.unverified) lines.push(`- ${item}`);
  if (trace.frontier?.length) lines.push(`- 질의 깊이 밖에 연결이 남은 노드 ${trace.frontier.length}개. 범위를 늘린 추가 확인이 필요하다.`);
  lines.push('', '## 실행 방식', '', `${review.execution.mode} / ${review.execution.strategy}. ${review.execution.note}`, '', '## 다음 확인', '', ...review.next_actions.map(x => `- ${x}`), '');
  return lines.join('\n');
}
