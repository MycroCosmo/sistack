import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { root, cli, isMain } from './common.mjs';
import { digest } from '../lib/trace/io.mjs';
import { mask } from '../lib/mask/index.mjs';

export const privacyFixture = '[SYNTHETIC MASK FIXTURE] phone=010-0000-0000 email=synthetic@example.invalid account=123456789012 JSESSIONID=abcdef12345678901234567890abcdef12 transactionId=12345678-1234-1234-1234-123456789012 classHash=abcdef12345678901234567890abcdef12';
export const descriptions = {
  '01-binding': '로그인하면 오류 화면이 나와요. 게시판 목록이 안 보여요.',
  '02-js-url': '게시판에 처음 들어가면 목록은 보여요. 검색어를 넣고 검색 버튼을 누르면 404 오류가 떠요.',
  '03-request-encoding': '글 쓸 때는 제목이 한글로 잘 보여요. 저장하고 다시 열어 보면 제목 글자가 깨져 있어요.',
  '04-session-bypass': '로그아웃한 뒤 즐겨찾기에 저장한 게시판 주소로 들어갔어요. 로그인 화면이 나올 줄 알았는데 오류 화면이 떠요.',
  '05-paging': '게시글이 11건이라고 나오는데 목록에는 10개만 보여요. 다음 페이지로 가는 버튼이 없어서 나머지 글을 못 보겠어요.',
  '06-sort-sql': '제목순으로 보면 잘 나와요. 등록일순으로 바꾸면 오류 화면이 떠요.',
  '07-oracle-log-only': '회사에서 게시판을 조회하면 오류가 나요. 날짜를 넣고 검색했어요. 제 PC에서는 같은 화면이 열려요.',
  '08-thymeleaf-utilities': '로그인은 되는데 게시판 목록에 들어가면 오류 화면이 떠요.',
  '09-view-resolver': '로그인하고 게시판 목록을 열면 404 오류가 떠요. 새로고침해도 똑같아요.',
  '10-fragment-encoding': '게시글 제목은 한글로 잘 보여요. 그런데 목록 아래쪽 페이지 안내 글자만 깨져 보여요.'
};

export function mixPrivacyFixture(text) {
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  if (lines.length < 2 || text.includes('[SYNTHETIC MASK FIXTURE]')) throw new Error('원본 캡처 로그가 필요합니다');
  const index = Math.max(1, Math.floor(lines.length / 2));
  lines.splice(index, 0, privacyFixture);
  return { text: lines.join('\n') + '\n', fixture_line: index + 1 };
}

export async function refreshInputs(captureDir) {
  const summary = [];
  for (const [id, description] of Object.entries(descriptions)) {
    const caseDir = path.join(root, 'evals/debug/cases', id);
    const oracle = id === '07-oracle-log-only';
    const source = oracle ? path.join(root, 'evals/debug/repro/oracle-format.log') : path.join(captureDir, `${id}.json.server.txt`);
    const captured = (await readFile(source, 'utf8')).replaceAll('\r\n', '\n');
    if (mask(captured) !== captured) throw new Error(`${id}: 새 규칙으로 마스킹한 캡처가 필요합니다`);
    const accessOnly = ['05-paging', '10-fragment-encoding'].includes(id);
    const selected = accessOnly ? captured.split(/\r?\n/).filter(l => /^\S+ ACCESS (GET|POST) \S+ \d{3}$/.test(l)).join('\n') + '\n' : captured;
    const mixed = mixPrivacyFixture(selected);
    await writeFile(path.join(caseDir, 'symptom.log'), mixed.text);
    await writeFile(path.join(caseDir, 'symptom.md'), description + '\n');
    const maskedFile = path.join(captureDir, `${id}.masked.txt`);
    const provenance = { kind: oracle ? 'synthetic-oracle-format' : 'captured-runtime', source: path.relative(root, source).replaceAll('\\', '/'),
      masked_output: path.relative(root, maskedFile).replaceAll('\\', '/'),
      source_sha256: digest(captured), source_newlines: 'LF', selection: accessOnly ? 'access-only' : 'complete', fixture_line: mixed.fixture_line,
      selected_sha256: digest(selected.replaceAll('\r\n', '\n')), symptom_sha256: digest(mixed.text),
      note: oracle ? 'Oracle DB 실행 없이 MyBatis 형식을 재구성한 로그. 실제 캡처라고 주장하지 않음.' : '임시 복사본의 로깅 계측만 추가. 예외/SQL/프레임/접근 결과를 수작업으로 작성하지 않음.' };
    await writeFile(path.join(caseDir, 'input-provenance.json'), JSON.stringify(provenance, null, 2) + '\n');
    await writeFile(maskedFile, mask(mixed.text));
    summary.push({ id, kind: provenance.kind, lines: mixed.text.trimEnd().split('\n').length });
  }
  return summary;
}
if (isMain(import.meta.url)) await cli(async () => {
  if (process.argv.length !== 3) throw new Error('사용법: refresh-debug-inputs.mjs <새 캡처 디렉터리>');
  console.log(JSON.stringify(await refreshInputs(path.resolve(process.argv[2])), null, 2));
});
