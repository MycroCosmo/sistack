import { readFile } from 'node:fs/promises';
import { xmlElements } from '../indexer/source.mjs';
import { mask } from '../mask/index.mjs';
import { validateManifest } from '../manifest/index.mjs';

export const resultSchema = JSON.parse(await readFile(new URL('../../schemas/test-results.schema.json', import.meta.url), 'utf8'));
const decode = s => s.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, v) => v[0] === '#' ? String.fromCodePoint(v[1].toLowerCase() === 'x' ? parseInt(v.slice(2), 16) : Number(v.slice(1))) : ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[v] ?? m));
export function parseSurefire(xml, plan, reportFile) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('테스트 XML의 외부 엔티티/DTD는 지원하지 않습니다');
  const nodes = xmlElements(xml), suites = nodes.filter(n => n.tag === 'testsuite');
  if (!suites.length) throw new Error('testsuite 없음');
  const tests = [];
  for (const suite of suites) {
    const cases = nodes.filter(n => n.parent === suite && n.tag === 'testcase');
    if (!/^\d+$/.test(suite.attrs.tests ?? '') || cases.length !== Number(suite.attrs.tests)) throw new Error('테스트 XML 건수 불일치');
    const suiteTests = cases.map(c => {
      const className = decode(c.attrs.classname ?? ''), method = decode(c.attrs.name ?? '');
      const meta = plan[`${className}#${method}`];
      if (!meta || !/[가-힣]/.test(meta.display_name) || !meta.target_class || !meta.target_method) throw new Error('한국어 업무 이름·대상 메서드 계획 누락');
      const outcome = nodes.filter(n => n.parent === c && ['failure', 'error', 'skipped'].includes(n.tag));
      if (outcome.length > 1 || !/^(?:\d+)(?:\.\d+)?$/.test(c.attrs.time ?? '')) throw new Error('테스트 XML 결과/시간 오류');
      const o = outcome[0];
      return { class_name: className, method_name: method, display_name: meta.display_name,
        target_class: meta.target_class, target_method: meta.target_method,
        status: o ? { failure: 'FAIL', error: 'ERROR', skipped: 'SKIP' }[o.tag] : 'PASS',
        duration_ms: Math.round(Number(c.attrs.time) * 1000),
        failure_message: o ? mask(decode(o.attrs.message || xml.slice(o.bodyStart, o.bodyEnd).replace(/^<!\[CDATA\[|\]\]>$/g, '')).slice(0, 4000)) : '',
        report_file: reportFile };
    });
    for (const [attr, status] of [['failures', 'FAIL'], ['errors', 'ERROR'], ['skipped', 'SKIP']]) {
      if (Number(suite.attrs[attr] ?? 0) !== suiteTests.filter(t => t.status === status).length) throw new Error('테스트 XML 상태 합계 불일치');
    }
    tests.push(...suiteTests);
  }
  return tests;
}

export function summarize(tests) {
  return { total: tests.length, passed: tests.filter(t => t.status === 'PASS').length,
    failed: tests.filter(t => t.status === 'FAIL').length, errors: tests.filter(t => t.status === 'ERROR').length,
    skipped: tests.filter(t => t.status === 'SKIP').length };
}

export function validateTestResults(value) {
  const errors = validateManifest(value, resultSchema);
  if (errors.length) return errors;
  if (new Set(value.tests.map(t => `${t.class_name}#${t.method_name}`)).size !== value.tests.length) errors.push('중복 테스트');
  const counts = summarize(value.tests);
  if (Object.keys(counts).some(k => counts[k] !== value.summary[k])) errors.push('집계 불일치');
  const expected = ['BUILD_FAILURE', 'BLOCKED'].includes(value.execution_status) ? 'BLOCKED'
    : counts.failed || counts.errors ? 'FAIL' : counts.skipped ? 'PARTIAL' : counts.total ? 'PASS' : 'BLOCKED';
  if (expected !== value.status || value.execution_status === 'TEST_FAILURE' && !counts.failed && !counts.errors) errors.push('실행 상태 불일치');
  if (value.tests.some(t => mask(t.failure_message) !== t.failure_message)) errors.push('실패 메시지 마스킹 누락');
  if (value.status === 'PASS' && (!value.tests.length || value.execution_status !== 'SUCCESS' || value.summary.failed || value.summary.errors || value.summary.skipped)) errors.push('PASS 범위 불일치');
  return errors;
}
