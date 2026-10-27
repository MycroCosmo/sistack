import test from 'node:test';
import assert from 'node:assert/strict';
import { mask } from '../lib/mask/index.mjs';

test('stacktrace: generated class hashes and transaction IDs survive next to personal data', () => {
  const hash = 'abcdef12345678901234567890abcdef12';
  const frame = `at app.Service$$EnhancerBySpringCGLIB$$${hash}.save(Service.java:42)`;
  const tx = '12345678-1234-1234-1234-123456789012';
  const result = mask(`${frame}\ntransactionId=${tx} phone=010-0000-0000 email=synthetic@example.invalid`);
  assert.ok(result.includes(frame));
  assert.ok(result.includes(`transactionId=${tx}`));
  assert.ok(!result.includes('010-0000-0000'));
  assert.ok(!result.includes('synthetic@example.invalid'));
  assert.equal(mask(result), result);
});

test('stacktrace: session credentials override the hash/UUID preservation rule', () => {
  for (const label of ['JSESSIONID', 'sessionId', 'session_id', 'session-id']) {
    for (const value of ['abcdef12345678901234567890abcdef12', '12345678-1234-1234-1234-123456789012', 'opaque.test-node']) {
      assert.equal(mask(`${label}=${value}; transactionId=abc123`), `${label}=[REDACTED]; transactionId=abc123`);
    }
  }
  assert.equal(mask('Cookie: JSESSIONID=opaque; phone=010-0000-0000'), 'Cookie: JSESSIONID=[REDACTED]; phone=[REDACTED]');
});

test('stacktrace: personal data in diagnostic identifier fields is still masked', () => {
  assert.equal(mask('transactionId=010-0000-0000 account=12345678901234567890123456789012'), 'transactionId=[REDACTED] account=[REDACTED]');
  assert.equal(mask('password=abcdef12345678901234567890abcdef12'), 'password=[REDACTED]');
});

test('thread correlation names survive numeric masking across supported WAS formats', () => {
  const names = [
    'qtp1234567890-12345678901',
    'http-nio-8080-exec-12345678901',
    'http-nio2-8080-exec-12345678901',
    'ajp-nio-8009-exec-12345678901',
    'ajp-bio-8009-exec-12345678901',
    'ajp-apr-8009-exec-12345678901',
    'http1-w12345678901 [container1-12345678901]',
    'default-wq-12345678901',
    'JEUS-Worker-12345678901',
    "[ACTIVE] ExecuteThread: '12345678901' for queue: 'weblogic.kernel.Default (self-tuning)'"
  ];
  for (const name of names) {
    const log = `[${name}] begin\n[${name}] end`;
    assert.equal(mask(log), log, name);
  }
});

test('thread exemptions preserve correlation without leaking neighboring personal data or credentials', () => {
  const result = mask('qtp1234567890-50 phone=010-0000-0000 account=123456789012 JSESSIONID=qtp1234567890-50 password=http-nio-8080-exec-12345678901');
  assert.equal(result, 'qtp1234567890-50 phone=[REDACTED] account=[REDACTED] JSESSIONID=[REDACTED] password=[REDACTED]');
  assert.equal(mask('number=12345678901 pseudoqtp1234567890-50'), 'number=[REDACTED] pseudoqtp[REDACTED]-50');
});

test('home prefixes are generalized for Windows, Linux and macOS without losing the file suffix', () => {
  const paths = [
    ['C:/Users/Synthetic User/repo/Mapper.xml:34', '~/repo/Mapper.xml:34'],
    ['C:\\Users\\Synthetic User\\repo\\Mapper.xml:34', '~/repo\\Mapper.xml:34'],
    ['D:/Users/가상사용자/logs/server.log', '~/logs/server.log'],
    ['/home/synthetic-user/app/server.log', '~/app/server.log'],
    ['/Users/synthetic-user/app/server.log', '~/app/server.log'],
    ['jar:file:///C:/Users/synthetic-user/.m2/a.jar!/A.class', 'jar:file:///~/.m2/a.jar!/A.class'],
    ['file:///home/synthetic-user/app/view.html', 'file://~/app/view.html']
  ];
  for (const [input, expected] of paths) {
    assert.equal(mask(input), expected);
    assert.equal(mask(mask(input)), expected);
  }
  assert.equal(mask('/opt/app/Mapper.xml C:/Apps/view.jsp ~/repo/a.java'), '/opt/app/Mapper.xml C:/Apps/view.jsp ~/repo/a.java');
});

test('home generalization and thread preservation compose with secrets and stack frames', () => {
  const log = 'qtp1234567890-50 C:/Users/Synthetic/log.txt password=hidden\n\tat app.Service.save(Service.java:42)';
  assert.equal(mask(log), 'qtp1234567890-50 ~/log.txt password=[REDACTED]\n\tat app.Service.save(Service.java:42)');
});
