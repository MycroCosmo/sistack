import path from 'node:path';
import { readFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { buildIndex } from '../indexer/index.mjs';
import { sanitize } from '../indexer/graph.mjs';
import { deriveCoverage } from './coverage.mjs';
import { save, json, inside, checkSources, digest } from '../trace/io.mjs';

const needle = '분기표본';
const quote = text => JSON.stringify(String(text));
const javaValue = value => value === null ? 'null' : typeof value === 'number' ? `Long.valueOf(${value}L)` : typeof value === 'object' && value.timestamp ? `java.sql.Timestamp.valueOf(${quote(value.timestamp)})` : quote(value);
const javaMap = obj => `values(new String[]{${Object.keys(obj).map(quote).join(',')}}, new Object[]{${Object.values(obj).map(javaValue).join(',')}})`;
const unparen = s => s.trim().replace(/^\((.*)\)$/s, '$1').trim();

export function evaluateCondition(expression, input) {
  return expression.split(/\s+or\s+|\|\|/).some(group => group.split(/\s+and\s+|&&/).every(raw => {
    const m = /^(\w+)\s*(==|!=|>=|<=|>|<)\s*(null|''|'[^']*'|"[^"]*"|-?\d+)$/.exec(unparen(raw));
    if (!m) throw new Error('OGNL 조건식 자동 해석 범위 밖');
    const value = m[3] === 'null' ? null : /^-?\d+$/.test(m[3]) ? Number(m[3]) : m[3].slice(1, -1);
    const actual = input[m[1]] ?? null;
    return { '==': () => actual === value, '!=': () => actual !== value, '>': () => actual > value,
      '>=': () => actual >= value, '<': () => actual < value, '<=': () => actual <= value }[m[2]]();
  }));
}

function getters(plan, type) {
  const cls = plan.classes.find(c => c.name === type);
  if (!cls) throw new Error('입력 타입의 소스 getter 미확정');
  const result = {};
  for (const method of cls.methods.filter(m => /^get[A-Z]/.test(m.name))) {
    const name = method.name[3].toLowerCase() + method.name.slice(4);
    const fields = cls.fields.filter(f => new RegExp(`\\b${f.name}\\b`).test(method.body));
    if (fields.length === 1) result[name] = { backing: fields[0].name, type: fields[0].type,
      nullable_date: /\.isEmpty\(\)\s*\?\s*null/.test(method.body), shift_days: Number(/plusDays\((\d+)\)/.exec(method.body)?.[1] ?? 0) };
  }
  return result;
}
function propertyValues(bean, getters) {
  const values = { ...bean };
  for (const [name, g] of Object.entries(getters)) {
    let value = bean[g.backing];
    if (g.nullable_date) value = !value ? null : new Date(Date.parse(value) + g.shift_days * 86400000).toISOString().slice(0, 10);
    values[name] = value;
  }
  return values;
}
export function branchWitness(item, plan, fixtures) {
  const base = fixtures.beans[item.input_type];
  if (!base) throw new Error('입력 bean의 정상 fixture 필요');
  const bindings = getters(plan, item.input_type), candidates = {};
  for (const condition of item.conditions) for (const m of condition.expression.matchAll(/(\w+)\s*(?:==|!=|>=|<=|>|<)\s*(null|''|'[^']*'|"[^"]*"|-?\d+)/g)) {
    const g = bindings[m[1]];
    if (!g) throw new Error('조건식 property의 setter 매핑 미확정');
    const literal = m[2] === 'null' ? null : /^-?\d+$/.test(m[2]) ? Number(m[2]) : m[2].slice(1, -1);
    candidates[g.backing] = [...new Set([base[g.backing], ...(g.nullable_date ? ['', '2026-01-02'] : [literal, typeof literal === 'number' ? literal + 1 : needle, '', null])])];
  }
  const entries = Object.entries(candidates);
  let attempts = 0;
  function search(at, bean) {
    if (++attempts > 4096) throw new Error('조건 조합 탐색 한도 초과');
    if (at === entries.length) return item.conditions.every(c => evaluateCondition(c.expression, propertyValues(bean, bindings)) === c.truth) ? bean : null;
    const [property, values] = entries[at];
    for (const value of values) { const found = search(at + 1, { ...bean, [property]: value }); if (found) return found; }
    return null;
  }
  const bean = search(0, { ...base });
  if (!bean) throw new Error('분기 조건을 만족하는 fixture 도출 실패');
  return { bean, parameters: propertyValues(bean, bindings) };
}

function rowFixtures(statement, table) {
  const textColumns = [...new Set(statement.predicates.filter(p => p.operator === 'LIKE').map(p => p.column))];
  const dateColumns = [...new Set(statement.predicates.filter(p => p.role !== 'pagination' && ['>', '>=', '<', '<='].includes(p.operator)).map(p => p.column))];
  const rows = [];
  for (const [i, column] of textColumns.entries()) for (let n = 0; n <= i; n++) rows.push({ ...table.values, [column]: needle });
  for (const day of ['2026-01-01', '2026-01-02', '2026-01-03']) {
    rows.push({ ...table.values, ...Object.fromEntries(textColumns.map(c => [c, needle])), ...Object.fromEntries(dateColumns.map(c => [c, { timestamp: `${day} 12:00:00` }])) });
  }
  return rows.map((row, i) => ({ ...row, [table.key_column]: 101 + i }));
}
function expectedIds(statement, rows, parameters, key) {
  return rows.filter(row => statement.predicates.every(p => {
    if (p.role === 'pagination') return true;
    if (!p.conditions.every(c => evaluateCondition(c.expression, parameters) === c.truth)) return true;
    let left = row[p.column], right = parameters[p.property];
    if (left && typeof left === 'object' && left.timestamp) { left = Date.parse(left.timestamp.replace(' ', 'T') + 'Z'); right = Date.parse(right); }
    if (left === undefined || right === undefined) throw new Error('SQL 독립 기대값 fixture 미확정');
    return { LIKE: () => String(left).includes(String(right)), '=': () => left === right, '>=': () => left >= right,
      '<=': () => left <= right, '>': () => left > right, '<': () => left < right }[p.operator]();
  })).map(r => r[key]).sort((a, b) => a - b);
}

export async function generateCoverage(project, output, { fixtureFile, templateDirectory, baseTests } = {}) {
  const index = await buildIndex(project), sources = {};
  for (const file of Object.keys(index.meta.source_files)) sources[file] = await readFile(await inside(project, file), 'utf8');
  await checkSources(project, index.meta.source_files);
  const plan = deriveCoverage(index, sources), fixtures = await json(fixtureFile);
  await mkdir(output); const generated = path.join(output, 'generated'); await mkdir(generated);
  const tests = {}, methods = [];
  if (baseTests) {
    for (const file of (await readdir(baseTests.directory)).filter(f => f.endsWith('.java'))) await copyFile(path.join(baseTests.directory, file), path.join(generated, file));
    Object.assign(tests, await json(baseTests.plan));
  }
  const className = 'kr.sistack.board.M4CoverageTest';
  function emit(item, suffix, code, label) {
    const method = `계획_${item.id}_${suffix}`;
    const key = `${className}#${method}`;
    item.tests.push(key);
    tests[key] = { display_name: label, target_class: item.owner, target_method: item.method, coverage_ids: [item.id] };
    methods.push(`    @org.junit.Test public void ${method}() throws Exception {\n        ${code}\n    }`);
  }
  for (const item of plan.items) {
    if (item.unresolved) continue;
    try {
      if (item.kind === 'service-boundary') {
        const fixture = fixtures.beans[item.input_type];
        if (!fixture) throw new Error('Service 정상 입력 fixture 필요');
        if (item.measure === 'length' && (item.pair.allowed < 0 || item.pair.rejected < 0 || item.pair.allowed > 100000)) throw new Error('문자열 길이 경계 자동 생성 범위 밖');
        const fields = plan.classes.find(c => c.name === item.owner)?.fields ?? [];
        const args = `new String[]{${fields.map(f => quote(f.name)).join(',')}}, new String[]{${fields.map(f => quote(f.type)).join(',')}}`;
        for (const kind of ['allowed', 'rejected']) {
          const value = item.measure === 'length' ? '가'.repeat(item.pair[kind]) : item.pair[kind];
          emit(item, kind === 'allowed' ? '허용경계' : '거부경계', `serviceBoundary(${quote(item.owner)}, ${quote(item.method)}, ${quote(item.input_type)}, ${javaMap({ ...fixture, [item.property]: value })}, ${args}, ${kind === 'rejected'});`, `${item.method} ${item.property} ${kind === 'allowed' ? '허용' : '거부'} 경계 ${item.pair[kind]}`);
        }
      } else if (item.kind === 'sql-branch') {
        const statement = plan.statements.find(s => s.statement === item.statement), table = fixtures.tables[statement?.table];
        if (!table || statement.tag !== 'select') throw new Error('분기 실행용 단일 SELECT 테이블 fixture 필요');
        const witness = branchWitness(item, plan, fixtures), rows = rowFixtures(statement, table);
        const ids = expectedIds(statement, rows, witness.parameters, table.key_column);
        if (!ids.length && item.outcome !== false) throw new Error('분기를 구분하는 양성 결과 fixture 필요');
        emit(item, '분기결과', `branch(${quote(item.owner)}, ${quote(item.method)}, ${quote(item.input_type)}, ${javaMap(witness.bean)}, ${quote(statement.table)}, ${quote(table.key_column)}, ${quote(table.key_property)}, new java.util.Map[]{${rows.map(javaMap).join(',')}}, new long[]{${ids.map(v => `${v}L`).join(',')}});`, `${item.method} ${item.branch_tag} ${item.outcome ? '진입' : '비진입'} 분기 결과`);
        item.witness = witness.bean;
      } else if (['update-column', 'insert-column'].includes(item.kind)) {
        const table = fixtures.tables[item.table], bean = fixtures.beans[item.input_type];
        if (!table || !bean || !Object.hasOwn(table.changes, item.column) && item.kind === 'update-column') throw new Error('저장 컬럼의 정상/변경 fixture 필요');
        const columns = plan.items.filter(i => i.statement === item.statement && i.kind === item.kind);
        const values = { ...bean };
        for (const col of columns) if (Object.hasOwn(table.changes, col.column)) values[col.property] = table.changes[col.column];
        if (item.kind === 'update-column') values[item.key_property] = table.values[table.key_column];
        emit(item, '재조회', `writeColumn(${quote(item.owner)}, ${quote(item.method)}, ${quote(item.input_type)}, ${javaMap(values)}, ${quote(item.table)}, ${quote(table.key_column)}, ${quote(table.key_property)}, ${javaMap(table.values)}, ${quote(item.column)}, ${quote(item.property)}, ${item.kind === 'insert-column'});`, `${item.method} ${item.column} 저장 후 재조회`);
      }
    } catch (error) { item.unresolved = error.message; }
  }
  const mapperClasses = [...new Set(index.nodes.filter(n => n.kind === 'sql' && /^mybatis/.test(n.details?.dialect)).map(n => ownerOfNode(n)).filter(n => n.includes('.')))];
  const source = `package kr.sistack.board;\npublic class M4CoverageTest extends M4CoverageSupport {\n    protected String[] mapperTypes() { return new String[]{${mapperClasses.map(quote).join(',')}}; }\n${methods.join('\n\n')}\n}\n`;
  await save(path.join(generated, 'M4CoverageTest.java'), source);
  await copyFile(path.join(templateDirectory, 'M4CoverageSupport.java'), path.join(generated, 'M4CoverageSupport.java'));
  const { classes, ...stored } = plan;
  const generatedFiles = {};
  for (const file of (await readdir(generated)).filter(n => n.endsWith('.java'))) generatedFiles[`src/test/java/kr/sistack/board/${file}`] = digest(await readFile(path.join(generated, file)));
  await save(path.join(output, 'coverage-plan.json'), sanitize({ ...stored, generator_version: '2.0.0', generated_files: generatedFiles, fixture_source: path.basename(fixtureFile) }));
  await save(path.join(output, 'test-plan.json'), sanitize(tests));
  await save(path.join(output, 'index.json'), index);
  return { plan: stored, tests, generated };
}
const ownerOfNode = n => n.details.namespace || n.name.slice(0, n.name.lastIndexOf('.'));
