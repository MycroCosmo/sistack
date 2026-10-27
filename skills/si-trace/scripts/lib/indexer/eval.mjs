import { validateIndex } from './graph.mjs';
import { validateExpected, matches, edgeKey, SCORE_GROUPS } from './expected.mjs';

export function evalIndex(index, expected, { draft = false } = {}) {
  validateIndex(index);
  const grouped = validateExpected(expected);
  if (!draft && expected.review_status !== 'approved') throw new Error('승인되지 않은 정답입니다. 초안은 --draft로만 미리보기 가능');
  if (!['draft', 'approved'].includes(expected.review_status)) throw new Error('잘못된 정답 상태');
  const revisionChanged = expected.source_revision !== index.meta.source_revision;
  const sourceMatch = expected.source_files && Object.keys(expected.source_files).length > 0 && Object.entries(expected.source_files).every(([file, hash]) => index.meta.source_files?.[file] === hash);
  if ((revisionChanged || index.meta.source_dirty) && !sourceMatch) throw new Error('정답과 인덱스의 source_revision 또는 근거 파일이 다릅니다');
  if (expected.source_files && !sourceMatch) throw new Error('정답 근거 파일의 내용이 달라졌습니다');
  const ids = new Map(index.nodes.map(n => [n.id, n]));
  const compare = (edges, scope) => compareEdges(index.edges.filter(edge => scope.some(s => matches(ids.get(edge.from), s.from)
    && (!s.kinds || s.kinds.includes(edge.kind)) && (!s.line || edge.evidence.some(e => e.file === s.file && e.line === s.line)))), edges, ids);
  const metadata = { case_id: expected.case_id, scoring: !draft, source_dirty: index.meta.source_dirty,
    revision_changed_sources_match: Boolean(revisionChanged && sourceMatch),
    caveat: '선언한 source/kind/위치 범위의 연결 비교. requests 도착 endpoint는 HTTP 메서드와 쿼리 제외 경로로 비교. 전체 프로젝트 정확도가 아님.' };
  if (!grouped) {
    const score = compare(expected.edges, expected.scope);
    return { ...metadata, ...score, status: draft ? 'DRAFT_PREVIEW' : score.status, scope: expected.scope };
  }
  const groups = Object.fromEntries(SCORE_GROUPS.map(group => {
    const scope = expected.scope.filter(s => s.group === group), edges = expected.edges.filter(e => e.group === group);
    const score = compare(edges, scope);
    return [group, { ...score, status: draft ? 'DRAFT_PREVIEW' : score.status, applicable: Boolean(scope.length || edges.length), scope }];
  }));
  return { ...metadata, status: draft ? 'DRAFT_PREVIEW' : Object.values(groups).some(g => g.status === 'FAIL') ? 'FAIL' : 'PASS', groups };
}

function compareEdges(actual, edges, ids) {
  const missing = [], mismatch = []; let matched = 0;
  for (const e of edges) {
    const found = actual.filter(a => a.kind === e.kind && matches(ids.get(a.from), e.from) && matches(ids.get(a.to), e.to, e.kind === 'requests'));
    if (!found.length) missing.push(e);
    else if (found.some(a => a.status !== e.status)) mismatch.push({ expected: e, actual_statuses: [...new Set(found.map(a => a.status))] });
    else matched++;
  }
  const extras = new Map();
  for (const a of actual) {
    if (edges.some(e => a.kind === e.kind && matches(ids.get(a.from), e.from) && matches(ids.get(a.to), e.to, e.kind === 'requests'))) continue;
    const descriptor = { from: { name: ids.get(a.from).name }, to: { name: ids.get(a.to).name }, kind: a.kind, status: a.status, evidence: a.evidence };
    extras.set(edgeKey(descriptor), descriptor);
  }
  return { status: missing.length || extras.size || mismatch.length ? 'FAIL' : 'PASS', expected_edges: edges.length, matched,
    false_negatives: missing, false_positives: [...extras.values()], status_mismatches: mismatch };
}
