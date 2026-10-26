---
name: si-example
description: "SIStack 설치 확인용 예제입니다. 'SIStack 설치 확인해 줘' 또는 '예제 스킬 확인' 요청에 사용합니다. 코드 분석 기능은 제공하지 않습니다."
license: MIT
compatibility: "Node.js 18 이상"
---

# SIStack 설치 확인

읽기 전용으로 동작한다. 프로젝트 코드·설정·DB를 변경하지 않는다.

1. 이 스킬 폴더에서 `node scripts/check.mjs`를 실행한다.
2. 출력된 설치 상태를 전달한다. 이 상태는 PL/PM 승인이나 고객 검수 완료를 뜻하지 않는다.
3. 상세 설명은 [예제 안내](references/usage.md)를 읽는다.

M0 설치 검증 예제이므로 업무 분석 결과나 `.sistack/` 실행 산출물을 생성하지 않는다.
