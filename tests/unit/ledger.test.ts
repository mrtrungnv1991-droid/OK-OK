import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { LedgerService } from '../../server/services/ledgerService';
import { db } from '../../server/db/store';

describe('Ledger & Double-Entry Accounting Service', () => {
  const testUserId = 'usr-buyer-01';

  test('Should accurately credit balance and record credit transaction', async () => {
    const user = db.users.get(testUserId)!;
    const initialBalance = user.walletBalance;
    const amount = 500000;

    const res = await LedgerService.executeTransaction({
      userId: testUserId,
      type: 'DEPOSIT',
      amount,
      description: 'Test Deposit Credit'
    });

    assert.equal(res.success, true);
    assert.equal(res.transaction?.amount, amount);
    assert.equal(res.transaction?.balanceAfter, initialBalance + amount);

    const updatedUser = db.users.get(testUserId)!;
    assert.equal(updatedUser.walletBalance, initialBalance + amount);
  });

  test('Should prevent debiting more than available balance (Insufficient Funds)', async () => {
    const user = db.users.get(testUserId)!;
    const excessiveAmount = user.walletBalance + 100000000;

    const res = await LedgerService.executeTransaction({
      userId: testUserId,
      type: 'PURCHASE_INSTANT',
      amount: -excessiveAmount,
      description: 'Test Excessive Debit'
    });

    assert.equal(res.success, false);
    assert.match(res.error || '', /insufficient|không đủ/i);
  });

  test('Should maintain idempotency when provided same idempotencyKey', async () => {
    const key = `idemp-${Date.now()}`;
    const res1 = await LedgerService.executeTransaction({
      userId: testUserId,
      type: 'DEPOSIT',
      amount: 100000,
      description: 'Idempotency Test',
      idempotencyKey: key
    });

    const res2 = await LedgerService.executeTransaction({
      userId: testUserId,
      type: 'DEPOSIT',
      amount: 100000,
      description: 'Idempotency Test',
      idempotencyKey: key
    });

    assert.equal(res1.success, true);
    assert.equal(res2.success, true);
    assert.equal(res1.transaction?.id, res2.transaction?.id);
  });
});
