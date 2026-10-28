import { main } from './lib/docs/cli.mjs';
try { console.log(await main()); }
catch { console.error('BLOCKED: 문서 생성 중단. 입력 JSON/매핑·원본 해시·빈 영역·설치 의존성을 확인하세요. 기존 파일은 보존합니다.'); process.exitCode = 1; }
