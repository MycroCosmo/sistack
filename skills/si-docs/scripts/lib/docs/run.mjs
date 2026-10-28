import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { checkSources, inside, save } from '../trace/io.mjs';
import { validateManifest } from '../manifest/index.mjs';
import { sanitize } from '../indexer/graph.mjs';
import { validateDocument } from './contract.mjs';
import { fillTemplate } from './workbook.mjs';
import { loadSettings } from './mapping.mjs';

export async function fillRun(project, doc, mapping, runId, { settingsFile = 'sistack-docs.json' } = {}) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(runId)) throw new Error('run-id 형식 오류');
  await validateDocument(doc);
  await checkSources(project, doc.source_files, doc.rows.flatMap(r => r.evidence));
  const config = await loadSettings(project, settingsFile);
  if(doc.schema_version==='1.2.0'&&doc.selection_settings_sha256!==config.sha256)throw new Error('추출 후 문서 설정 변경: 다시 추출하세요');
  const run = await inside(project, `.sistack/runs/${runId}`);
  await mkdir(path.dirname(run), { recursive: true }); await mkdir(run);
  const result = await fillTemplate(doc, mapping, path.join(run, `${doc.kind}.xlsx`), config.settings);
  if (config.sha256 !== (await loadSettings(project, settingsFile)).sha256) throw new Error('실행 중 문서 설정 변경');
  await save(path.join(run, 'evidence/data.json'), sanitize(doc));
  await save(path.join(run, 'evidence/verification.json'), result);
  // 사용자 양식의 절대 경로/고정값은 공개 보고에 인용하지 않는다.
  await save(path.join(run, 'evidence/mapping.json'), sanitize({ ...mapping, template: '<사용자 원본 양식>', fixed: Object.fromEntries(Object.keys(mapping.fixed ?? {}).map(k => [k, '<사용자 제공 값>'])), id_rule: mapping.id_rule ? '<사용자 제공 규칙>' : null }));
  const unverified = [...new Set(sanitize([...doc.unverified, ...result.warnings, ...(result.missing.length ? [`미확인 빈 칸 ${result.missing.length}개 (verification.json 참조)`] : [])]))];
  const manifest = { schema_version: '1.0.0', run_id: runId, skill: 'si-docs', created_at: new Date().toISOString(), source_revision: doc.source_revision, status: result.status, inputs: { document_kind: doc.kind, template_sha256: result.original_sha256, settings_sha256: config.sha256 ?? 'ABSENT' }, evidence: [{ path: 'evidence/data.json', level: 2, description: '소스 파일/라인과 표준 JSON' }, { path: 'evidence/verification.json', level: 4, description: 'xlsx 저장·재읽기 값/양식/원본 해시 검사' }], unverified, next_actions: ['프로그램 ID·업무명·사용자 양식과 미확인 값을 사람이 검토'] };
  if (validateManifest(manifest).length) throw new Error('manifest 스키마 위반');
  await save(path.join(run, 'manifest.json'), manifest);
  await save(path.join(run, 'report.md'), `> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.\n\n# ${doc.kind}\n\n상태: ${result.status}. ${result.rows}행, 매핑 ${result.mapped_columns}열. 미확인 빈 칸 ${result.missing.length}개.\n증거 단계: 소스 위치 2 / xlsx 저장·재읽기 4.\n원본 해시 동일: ${result.original_unchanged}, 양식 보존: ${result.preserved}, 입력 값 재확인: ${result.values_verified}.\n\n## 경고\n${result.warnings.map(s => `- ${s}`).join('\n') || '- 감지된 보존 범위 밖 요소 없음 (전체 OOXML 보장을 뜻하지 않음)'}\n\n## 미확인\n${unverified.map(s => `- ${s}`).join('\n')}\n\n## limitations\n${result.limitations.map(s => `- ${s}`).join('\n')}\n\n셀별 빈 칸과 LIKELY 제안은 노란색과 evidence/verification.json의 missing/suggested에 구별 기록. source_revision 및 파일 해시는 data.json 참조. 사용자 원본 양식의 식별자·내용은 이 보고서에 인용하지 않음.\n`);
  return { run, ...result };
}
