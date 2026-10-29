import {spawn} from 'node:child_process';
import {root,mavenLaunch} from './runtime.mjs';
const launch=mavenLaunch(['-o','jetty:run']);
const processHandle=spawn(launch.command,launch.args,{cwd:root,stdio:'inherit',windowsHide:true});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>processHandle.kill(signal));
processHandle.on('error',error=>{console.error(error.message);process.exitCode=1;});
processHandle.on('exit',code=>{process.exitCode=code??1;});
