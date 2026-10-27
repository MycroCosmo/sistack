import { prepareTrace, finishTrace } from './lib/trace/index.mjs';
import { mask } from './lib/mask/index.mjs';

try {
  const [command, target, ...args] = process.argv.slice(2);
  if (!target || !['prepare', 'finish'].includes(command)) throw new Error('사용법: trace.mjs prepare <project> --from <시작점> [--scope single|menu] [--run-id id] 또는 finish <project> <run-id>');
  let result;
  if (command === 'finish') {
    if (args.length !== 1) throw new Error('finish에는 run-id 하나가 필요합니다');
    result = await finishTrace(target, args[0]);
  } else {
    const options = { from: [], to: [] };
    while (args.length) {
      const key = args.shift(), value = args.shift();
      if (!value || !['--from', '--to', '--scope', '--depth', '--run-id'].includes(key)) throw new Error('prepare 옵션 오류');
      if (['--from', '--to'].includes(key)) options[key.slice(2)].push(value);
      else options[key === '--run-id' ? 'runId' : key.slice(2)] = key === '--depth' ? Number(value) : value;
    }
    result = await prepareTrace(target, options);
  }
  console.log(mask(JSON.stringify(result, null, 2)));
} catch (error) {
  console.error(mask(error.code ? `실패: ${error.code}` : error.message)); process.exitCode = 1;
}
