# JUnit 4와 Mockito 4

기존 test scope 라이브러리만 사용한다. `@Before`에서 대상과 목을 생성하고 `ReflectionTestUtils.setField`로 기존 private 주입 필드를 설정한다. `@Test public void 게시글_등록시_저장된_번호를_돌려준다()`처럼 한국어 업무 이름을 쓴다.

`when`으로 주어진 상태를 준비하고 실제 대상 메서드를 호출한 뒤 반환값·저장된 내용·예외를 검증한다. 외부 쓰기가 목적이면 전달된 값도 검증한다. `verify(mapper).insert(any())`만으로 생성 번호·작성자·본문이 맞다고 주장하지 않는다. `assertThrows` 안에는 검증할 호출만 둔다. Mock 결과 자체를 assert하는 테스트는 만들지 않는다.
