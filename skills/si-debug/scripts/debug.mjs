import { readFile } from 'node:fs/promises';
import { prepareDebug, finishDebug } from './lib/debug/index.mjs';
import { mask } from './lib/mask/index.mjs';
try {
  const [command, target, ...args] = process.argv.slice(2);
  if (!target || !['prepare', 'finish'].includes(command)) throw new Error('사용법: debug.mjs prepare <project> --log <file> [--symptom text] [--package app] [--from URL|sqlId] [--run-id id] 또는 finish <project> <run-id>');
  let result;
  if (command === 'finish') {
    if (args.length !== 1) throw new Error('run-id 하나를 지정하세요');
    result = await finishDebug(target, args[0]);
  } else {
    const options = { starts: [] };
    while (args.length) {
      const key = args.shift(), value = args.shift();
      if (!value || !['--log', '--symptom', '--package', '--from', '--run-id'].includes(key)) throw new Error('prepare 옵션 오류');
      if (key === '--from') options.starts.push(value);
      else if (key === '--log') options.log = await readFile(value, 'utf8');
      else options[{ '--symptom': 'symptom', '--package': 'packagePrefix', '--run-id': 'runId' }[key]] = value;
    }
    result = await prepareDebug(target, options);
  }
  console.log(mask(JSON.stringify(result, null, 2)));
} catch (e) { console.error(mask(e.code ? `실패: ${e.code}` : e.message)); process.exitCode = 1; }
