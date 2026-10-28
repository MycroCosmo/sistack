#!/usr/bin/env node
import {runCLI} from '../lib/cli.mjs';
import {sanitize} from '../lib/indexer/graph.mjs';
import {mask} from '../lib/mask/index.mjs';
try{console.log(JSON.stringify(sanitize(await runCLI(process.argv.slice(2))),null,2));}catch(e){console.error(mask(e.code?`실패: ${e.code}`:e.message));process.exitCode=1;}
