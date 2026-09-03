import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { EscrowService } from '../../server/services/escrowService';
import { db } from '../../server/db/store';

describe('Escrow Oracle & Group Buying Smart Flow', () => {
  const buyerId = 'usr-buyer-01';

  test('Should list available active products and pools', () => {
    const products = db.products;
    assert.ok(products.length > 0);
    const poolProduct = products.find(p => p.activePools && p.activePools.length > 0);
    assert.ok(poolProduct !== undefined);
  });

  test('Should atomically join pool and lock escrow amount', async () => {
    const user = db.users.get(buyerId)!;
    user.walletBalance = 1000000; // ensure funds

    const product = db.products.find(p => p.activePools && p.activePools.length > 0)!;
    const pool = product.activePools![0];

    const result = await EscrowService.joinPool({
      poolId: pool.id,
      productId: product.id,
      user
    });

    assert.equal(result.success, true);
    assert.ok(result.contract !== undefined);
  });
});
