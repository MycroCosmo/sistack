// shortcut: 기존 텍스트 파일 수정만 지원한다. 생성·삭제 제안은 별도 계약이 필요하다.
export function proposalPaths(diff) {
  if (/^(?:new file|deleted file|old mode|new mode|rename |copy |GIT binary)/m.test(diff)) throw new Error('diff는 기존 텍스트 파일 수정만 지원합니다');
  const headers = [...diff.matchAll(/^(---|\+\+\+) ([ab])\/(.+)$/gm)];
  if (!headers.length || headers.length % 2 || !/^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/m.test(diff) || !/^(?!---)-/m.test(diff) && !/^(?!\+\+\+)\+/m.test(diff)) throw new Error('구체적인 unified diff가 필요합니다');
  const files = [];
  for (let i = 0; i < headers.length; i += 2) {
    const [before, after] = [headers[i], headers[i + 1]], file = before[3];
    if (before[1] !== '---' || before[2] !== 'a' || after[1] !== '+++' || after[2] !== 'b' || file !== after[3] || /[\\:\t\r\n]/.test(file) || file.startsWith('/') || file.split('/').some(p => !p || p === '..' || p === '.git' || p === '.sistack')) throw new Error('diff 경로 범위 오류');
    files.push(file);
  }
  return [...new Set(files)];
}
