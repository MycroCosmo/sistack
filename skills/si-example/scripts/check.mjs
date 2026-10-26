import { mask } from './lib/mask/index.mjs';

if (mask('token=fixture') !== 'token=[REDACTED]') throw new Error('공통 모듈 확인 실패');
console.log('PASS: SIStack 예제와 공통 모듈 설치 확인');
