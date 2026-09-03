import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderService } from '../../server/services/orderService';
import { InventoryService } from '../../server/services/inventoryService';
import { db } from '../../server/db/store';

describe('End-to-End Checkout & Auto Key Delivery Integration', () => {
  const buyerId = 'usr-buyer-01';

  test('Should complete atomic instant checkout, deduct balance, and deliver digital key', async () => {
    const user = db.users.get(buyerId)!;
    user.walletBalance = 5000000;

    const product = db.products[0];
    assert.ok(product !== undefined, 'At least one product must exist in store');

    InventoryService.bulkAddKeys(product.id, [
      'GPT-INTEG-KEY-001',
      'GPT-INTEG-KEY-002'
    ]);

    const balanceBefore = user.walletBalance;

    const result = await OrderService.createInstantPurchase({
      buyer: user,
      productId: product.id
    });

    assert.equal(result.success, true, `Checkout failed: ${result.error}`);
    assert.ok(result.order !== undefined);
    assert.ok(result.order?.deliveredData?.keys !== undefined);

    const balanceAfter = user.walletBalance;
    assert.equal(balanceAfter, balanceBefore - result.order!.pricePaid);
  });
});
