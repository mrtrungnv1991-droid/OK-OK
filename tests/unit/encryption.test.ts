import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { encryptCredential, decryptCredential } from '../../server/services/paymentSystem/security';
import { encryptSecret, decryptSecret } from '../../server/services/sourceConnector/encryptionUtils';

describe('AES-256-GCM Vault & Integrity Security Tests', () => {
  const sampleSecret = 'api-secret-key-google-workspace-sk-99881122';

  test('Should encrypt plaintext into AES-256-GCM format with authentication tag', () => {
    const encrypted = encryptCredential(sampleSecret);
    assert.ok(encrypted.startsWith('gcm:'), 'Ciphertext must use authenticated gcm: prefix');
    const parts = encrypted.split(':');
    assert.equal(parts.length, 4, 'Format must be gcm:iv:authTag:ciphertext');
  });

  test('Should decrypt AES-256-GCM ciphertext back to exact original plaintext', () => {
    const encrypted = encryptCredential(sampleSecret);
    const decrypted = decryptCredential(encrypted);
    assert.equal(decrypted, sampleSecret);
  });

  test('Should strictly detect tampering with ciphertext or auth tag (MAC integrity check)', () => {
    const encrypted = encryptCredential(sampleSecret);
    const parts = encrypted.split(':');

    // Tamper with the last byte of the ciphertext
    const tamperedData = parts[3].slice(0, -2) + (parts[3].endsWith('00') ? 'ff' : '00');
    const tamperedCiphertext = `${parts[0]}:${parts[1]}:${parts[2]}:${tamperedData}`;

    const decrypted = decryptCredential(tamperedCiphertext);
    assert.equal(decrypted, '[DECRYPTION_INTEGRITY_FAILED]', 'Tampered ciphertext must fail authentication tag check');
  });

  test('Should encrypt and decrypt in sourceConnector encryptionUtils with GCM', () => {
    const encrypted = encryptSecret('partner-proxy-password-xyz');
    assert.ok(encrypted.startsWith('gcm:'));
    const decrypted = decryptSecret(encrypted);
    assert.equal(decrypted, 'partner-proxy-password-xyz');
  });
});
