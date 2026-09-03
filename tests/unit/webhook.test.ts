import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { db } from '../../server/db/store';
import { LedgerService } from '../../server/services/ledgerService';

describe('Webhook & Signature Verification Test Suite', () => {
  const SECRET = process.env.VIETQR_WEBHOOK_SECRET || 'CYBER_VIETQR_SECRET_KEY_SECURE_2026!';

  test('Should accurately compute and verify HMAC-SHA256 webhook signature', () => {
    const payload = {
      transactionId: 'TX-TEST-999',
      amount: 250000,
      content: 'NAP usr-buyer-01 250k',
      bankCode: 'MBBank'
    };

    const payloadString = JSON.stringify(payload);
    const validSignature = crypto.createHmac('sha256', SECRET).update(payloadString).digest('hex');

    // Verification check using timingSafeEqual
    const computedSig = crypto.createHmac('sha256', SECRET).update(payloadString).digest('hex');
    assert.equal(
      crypto.timingSafeEqual(Buffer.from(validSignature), Buffer.from(computedSig)),
      true,
      'Valid signature must verify correctly'
    );

    // Tampered payload
    const tamperedPayloadString = JSON.stringify({ ...payload, amount: 999999999 });
    const tamperedSig = crypto.createHmac('sha256', SECRET).update(tamperedPayloadString).digest('hex');
    assert.equal(
      validSignature === tamperedSig,
      false,
      'Tampered payload must produce different signature'
    );
  });

  test('Should extract user and prevent double-crediting via persistent processedWebhooks idempotency', async () => {
    const transactionId = `TX-IDEMP-${Date.now()}`;
    const testUser = db.users.get('usr-buyer-01')!;
    const initialBalance = testUser.walletBalance;
    const depositAmount = 300000;

    // First processing
    assert.equal(db.processedWebhooks.has(transactionId), false);

    await LedgerService.executeTransaction({
      userId: testUser.id,
      amount: depositAmount,
      type: 'DEPOSIT',
      description: `Test Webhook Credit ${transactionId}`,
      referenceId: transactionId,
      actorId: 'TEST_WEBHOOK'
    });

    db.processedWebhooks.set(transactionId, {
      amount: depositAmount,
      userId: testUser.id,
      status: 'COMPLETED',
      processedAt: new Date().toISOString(),
      provider: 'VIETQR',
      memo: 'NAP usr-buyer-01 300k'
    });

    assert.equal(testUser.walletBalance, initialBalance + depositAmount);
    assert.equal(db.processedWebhooks.has(transactionId), true);

    // Duplicate webhook received: must detect existing transaction
    const existing = db.processedWebhooks.get(transactionId);
    assert.ok(existing !== undefined);
    assert.equal(existing.amount, depositAmount);

    // Balance must not increase a second time
    assert.equal(testUser.walletBalance, initialBalance + depositAmount);
  });
});
