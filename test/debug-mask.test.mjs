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
