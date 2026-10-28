import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root, files } from './common.mjs';

const tests = (await files(path.join(root, 'test'))).filter(p => p.endsWith('.test.mjs')).map(p => path.join(root, 'test', p));
if (!tests.length) throw new Error('실행할 테스트가 없습니다');
const result = spawnSync(process.execPath, ['--test', ...tests], { cwd: root, stdio: 'inherit', windowsHide: true });
process.exitCode = result.status ?? 1;
