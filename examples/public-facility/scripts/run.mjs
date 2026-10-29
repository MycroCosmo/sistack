import {serve,runMaven} from './runtime.mjs';
const command=process.argv[2] ?? 'serve';
if(command==='serve') {
  const child=serve();
  for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>child.kill(signal));
  child.on('error',error=>{console.error(error.message);process.exitCode=1;});
  child.on('exit',code=>{process.exitCode=code ?? 1;});
} else if(command==='test') {
  const result=runMaven(['-o','-q','test'],{stdio:'inherit'});
  if(result.error) console.error(result.error.message);
  process.exitCode=result.status ?? 1;
} else throw new Error('사용법: node scripts/run.mjs serve|test');
