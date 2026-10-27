import path from 'node:path';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { root } from './common.mjs';

// 호출자는 prepareCase가 만든 임시 복사본만 전달한다. 요청/응답 동작은 변경하지 않는다.
export async function installCapture(project) {
  const marker = JSON.parse(await readFile(path.join(project, '.sistack/case.json'), 'utf8'));
  if (!marker.id || !path.basename(project).startsWith('sistack-debug-')) throw new Error('재현 임시 복사본만 로깅 설정 가능');
  const target = path.join(project, 'src/test/java/kr/sistack/capture/CaptureFilter.java');
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(root, 'evals/debug/repro/CaptureFilter.java'), target);
  const webFile = path.join(project, 'src/main/webapp/WEB-INF/web.xml');
  const web = await readFile(webFile, 'utf8');
  const filter = '    <filter><filter-name>capture</filter-name><filter-class>kr.sistack.capture.CaptureFilter</filter-class></filter>\n'
    + '    <filter-mapping><filter-name>capture</filter-name><url-pattern>/*</url-pattern></filter-mapping>\n';
  if (!web.includes('    <filter>')) throw new Error('필터 삽입 위치 없음');
  await writeFile(webFile, web.replace('    <filter>', filter + '    <filter>'));
  const handlerFile = path.join(project, 'src/main/java/kr/sistack/board/web/CommonExceptionHandler.java');
  const handler = await readFile(handlerFile, 'utf8');
  if (!handler.includes('public String failure() {')) throw new Error('예외 로깅 삽입 위치 없음');
  await writeFile(handlerFile, handler.replace('public String failure() {', 'public String failure(RuntimeException exception) {\n        exception.printStackTrace(System.err);'));
  return ['src/test/java/kr/sistack/capture/CaptureFilter.java', 'src/main/webapp/WEB-INF/web.xml', 'src/main/java/kr/sistack/board/web/CommonExceptionHandler.java'];
}
