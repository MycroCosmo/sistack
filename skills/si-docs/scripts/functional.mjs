if(Number(process.versions.node.split('.')[0])<20)throw new Error('M5b는 Node.js 20 이상이 필요합니다');
try {const {main}=await import('./lib/functional/cli.mjs');console.log(JSON.stringify(await main(process.argv.slice(2))));}
catch {console.error('BLOCKED: 기능 테스트 계획의 입력/출력과 설치 환경을 확인하세요');process.exitCode=1;}
