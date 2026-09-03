import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import { InventoryService } from '../../server/services/inventoryService';

describe('Concurrency & Race-Condition Defense Suite', () => {
  const limitedProductSku = 'prod_limited_sku';

  before(async () => {
    // Add exactly 1 stock item to inventory vault
    InventoryService.bulkAddKeys(limitedProductSku, ['RARE-PROMO-KEY-ONLY-ONE']);
  });

  test('Should strictly prevent overselling when 5 concurrent requests try to claim 1 key', async () => {
    const concurrentBuyers = ['buyer-1', 'buyer-2', 'buyer-3', 'buyer-4', 'buyer-5'];

    // Run 5 simultaneous reservation calls
    const results = await Promise.allSettled(
      concurrentBuyers.map((buyer, idx) => 
        InventoryService.reserveItem(limitedProductSku, buyer, `ord-test-${idx}`)
      )
    );

    const successfulClaims = results.filter(
      r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value !== null
    );

    // Exactly ONE claim must succeed, others return null
    assert.equal(successfulClaims.length, 1);
  });
});
