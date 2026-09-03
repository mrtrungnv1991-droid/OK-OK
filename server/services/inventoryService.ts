import { db } from '../db/store';
import { ServerInventoryItem } from '../types';

export class InventoryService {
  /**
   * Reserves an available digital item atomically using mutex locking to prevent race conditions/overselling.
   */
  public static async reserveItem(productId: string, buyerId: string, orderId: string): Promise<ServerInventoryItem | null> {
    await db.acquireInventoryLock(productId);

    try {
      // Find an AVAILABLE item for this product
      const availableItems: ServerInventoryItem[] = [];
      for (const item of db.inventory.values()) {
        if (item.productId === productId && item.state === 'AVAILABLE') {
          availableItems.push(item);
        }
      }

      if (availableItems.length === 0) {
        return null;
      }

      // Reserve the first item
      const chosenItem = availableItems[0];
      chosenItem.state = 'RESERVED';
      chosenItem.buyerId = buyerId;
      chosenItem.orderId = orderId;
      chosenItem.reservedUntil = Date.now() + 15 * 60 * 1000; // 15 mins lock
      chosenItem.updatedAt = new Date().toISOString();

      db.inventory.set(chosenItem.id, chosenItem);

      // Decrement product in-stock count
      const product = db.products.find(p => p.id === productId);
      if (product && product.stockAvailable > 0) {
        product.stockAvailable -= 1;
      }

      return chosenItem;
    } finally {
      db.releaseInventoryLock(productId);
    }
  }

  /**
   * Finalizes delivery of reserved item to SOLD & DELIVERED
   */
  public static markDelivered(itemId: string): ServerInventoryItem | null {
    const item = db.inventory.get(itemId);
    if (!item) return null;

    item.state = 'DELIVERED';
    item.updatedAt = new Date().toISOString();
    db.inventory.set(itemId, item);
    return item;
  }

  /**
   * Returns reserved item back to AVAILABLE if order fails or is cancelled
   */
  public static releaseReservation(itemId: string) {
    const item = db.inventory.get(itemId);
    if (!item) return;

    if (item.state === 'RESERVED') {
      item.state = 'AVAILABLE';
      item.orderId = undefined;
      item.buyerId = undefined;
      item.reservedUntil = undefined;
      item.updatedAt = new Date().toISOString();
      db.inventory.set(itemId, item);

      const product = db.products.find(p => p.id === item.productId);
      if (product) {
        product.stockAvailable += 1;
      }
    }
  }

  /**
   * Bulk adds digital keys to vault
   */
  public static bulkAddKeys(productId: string, keys: string[], costPrice = 0): number {
    let addedCount = 0;
    keys.forEach(keyStr => {
      const trimmed = keyStr.trim();
      if (!trimmed) return;

      const itemId = `inv-${productId}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newItem: ServerInventoryItem = {
        id: itemId,
        productId,
        keyCode: trimmed,
        state: 'AVAILABLE',
        costPrice,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.inventory.set(itemId, newItem);
      addedCount++;
    });

    const product = db.products.find(p => p.id === productId);
    if (product) {
      product.stockAvailable = (product.stockAvailable || 0) + addedCount;
    }

    return addedCount;
  }
}
