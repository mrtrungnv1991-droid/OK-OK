import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../../server/utils/authSecurity';

describe('Auth & Cryptographic Security Test Suite', () => {
  const plainPassword = 'SuperSecurePassword@2026';

  test('Should hash password with scrypt and verify correctly', () => {
    const hash = hashPassword(plainPassword);
    assert.ok(hash.startsWith('scrypt:'), 'Hash should follow scrypt:salt:hash format');

    const isValid = verifyPassword(plainPassword, hash);
    assert.equal(isValid, true, 'Valid password must verify to true');

    const isInvalid = verifyPassword('WrongPassword123', hash);
    assert.equal(isInvalid, false, 'Invalid password must verify to false');
  });

  test('Should generate and verify cryptographic HMAC-SHA256 JWT tokens', () => {
    const payload = {
      id: 'usr-buyer-01',
      email: 'buyer@cyberpool.vn',
      role: 'USER' as const
    };

    const token = generateToken(payload);
    assert.ok(token.includes('.'), 'JWT token must contain dots');

    const res = verifyToken(token);
    assert.equal(res.valid, true, 'Token verification must succeed');
    assert.equal(res.payload?.sub, 'usr-buyer-01');
    assert.equal(res.payload?.email, 'buyer@cyberpool.vn');
    assert.equal(res.payload?.role, 'USER');
  });

  test('Should strictly reject tampered JWT tokens or altered payload signatures', () => {
    const payload = {
      id: 'usr-buyer-01',
      email: 'buyer@cyberpool.vn',
      role: 'USER' as const
    };

    const token = generateToken(payload);
    const [header, body, sig] = token.split('.');

    // Tamper with payload to elevate privilege to SUPER_ADMIN
    const forgedBody = Buffer.from(
      JSON.stringify({ ...payload, role: 'SUPER_ADMIN' })
    ).toString('base64url');

    const tamperedToken = `${header}.${forgedBody}.${sig}`;
    const res = verifyToken(tamperedToken);

    assert.equal(res.valid, false, 'Tampered token signature verification must be marked invalid');
    assert.match(res.error || '', /không hợp lệ/);
  });

  test('Should reject invalid token formats and random strings', () => {
    const resEmpty = verifyToken('');
    assert.equal(resEmpty.valid, false);

    const resRaw = verifyToken('usr-admin-01');
    assert.equal(resRaw.valid, false);

    const resFake = verifyToken('invalid.jwt.token');
    assert.equal(resFake.valid, false);
  });
});
