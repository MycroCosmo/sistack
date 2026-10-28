# 기능 실행의 로그인 설정

실행 대상의 sistack-docs.json에 auth를 둔다. 정상 테스트베드의 승인된 원본 해시는 유지하기 위해 예제는 examples/configs/*-docs.json을 제공하고 실행 설정 auth_settings_file로 실행 사본의 sistack-docs.json에만 복사할 수 있다.

```json
{
  "auth": {
    "login_url": "/signin",
    "fields": {"account": "username", "password": "password", "csrf": "csrf"},
    "accounts": {
      "viewer": {"id": "reader", "password_env": "SISTACK_LOGIN_PASSWORD"},
      "admin": {"id": "manager", "password_env": "SISTACK_ADMIN_PASSWORD"}
    },
    "success": {"url": "/home", "status": 200, "element": {"kind": "id", "value": "welcome"}}
  }
}
```

계정 ID는 실제 테스터 ID다. admin/viewer는 TC 권한 역할이며 id는 사용자 값으로 바꾼다. 암호 문자열을 JSON에 넣지 않는다. password_env는 프로세스 환경 변수 이름이고 실제 값은 메모리에서만 읽는다. 입력 시 셸 이력/로그에 평문을 남기지 않는 안전한 세션 입력 방식을 사용한다.

기존 legacy-board의 역할 선택 로그인은 fields.csrf, accounts의 values.role=ADMIN/READER로 재현하며 암호 필드는 없다. 임의 역할 하드코딩이 아니라 제공 설정값이다. 계정 필드·암호·CSRF가 없는 방식은 해당 fields 항목을 생략한다.

GET 로그인 폼 → POST → 동일 출처의 302/303 → 성공 URL/요소를 확인한다. 잘못된 로그인 폼의 200 응답을 성공으로 세지 않는다. 성공 요소는 사용자가 확인한 id/name만 지정한다. SSO/OAuth·MFA·CAPTCHA·외부 도메인 인증은 이 실행 어댑터의 범위 밖이다.

환경 변수 비밀값은 예외/요청 기록과 서버 로그에서 제거하고 화면 증거 전 DOM 텍스트/속성/입력값에서도 제거한다. 쿠키·폼 본문·헤더는 증거에 저장하지 않는다. 설정 파일에는 참조 이름만 남는다.
