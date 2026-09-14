import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import { EscrowService } from '../../server/services/escrowService';
import { OrderService } from '../../server/services/orderService';
import { db } from '../../server/db/store';
import { InventoryService } from '../../server/services/inventoryService';
import { GatewayVerificationService } from '../../server/services/gatewayVerificationService';

// ============================================================================
// Regression tests — review P1 findings:
//   #2  pool/productId mismatch: product lấy từ contract (không tin client),
//       chặn cặp poolId/productId lệch TRƯỚC khi khóa tiền.
//   #7  pool đủ slot nhưng thiếu key → contract AWAITING_STOCK (không COMPLETED),
//       forceRefundPool hoàn ĐÚNG số slot còn khóa (slot đã giao không refund lại).
//   #6  mua nội bộ chỉ trừ stock 1 lần (reserveItem) — không trừ thêm lần 2.
// ============================================================================

const BUYER = 'usr-buyer-01';

function makeProduct(id: string, price: number, suffix = '') {
  const p: any = {
    id, title: `RETEST ${id}`, retailPrice: price, price,
    stockAvailable: 5, status: 'ACTIVE', isAvailable: true,
    deliveryType: 'manual_key', gameId: 'game-test',
    activePools: [] as any[]
  };
  db.products.push(p);
  return p;
}

function makePool(productId: string, slots: number, pricePerSlot: number) {
  const id = `pool-re-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const contract: any = {
    id, poolId: id, productId, targetSlots: slots, filledSlots: 0,
    pricePerSlot, totalLockedAmount: 0, status: 'FILLING',
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    participants: [], createdAt: new Date().toISOString()
  };
  db.escrowContracts.set(id, contract);
  const prod = db.products.find(p => p.id === productId)!;
  prod.activePools!.push({ id, filledSlots: 0, status: 'filling', pricePerSlot, participants: [], targetSlots: slots });
  return { id, contract };
}

function topUp(userId: string, amount: number) {
  const u = db.users.get(userId)!;
  u.walletBalance = amount;
  u.escrowLocked = 0;
}

// --- TEST #2: pool/product mismatch ---
describe('P1 #2 — Escrow pool/product mismatch', () => {
  const cheap = makeProduct('retest-cheap', 1000);
  const expensive = makeProduct('retest-expensive', 500000);
  let pool: any;

  before(() => {
    pool = makePool(cheap.id, 2, 1000);
    topUp(BUYER, 900000);
  });

  test('chống: gửi productId ĐẮT vào pool RẺ → từ chối trước khi khóa tiền', async () => {
    const balBefore = db.users.get(BUYER)!.walletBalance;
    const res = await EscrowService.joinPool({
      poolId: pool.id, productId: expensive.id,
      user: db.users.get(BUYER)!
    });
    assert.equal(res.success, false, 'cặp poolId/productId lệch phải bị từ chối');
    assert.match(res.error || '', /không khớp|không tồn tại|không còn tồn tại/i);
    assert.equal(db.users.get(BUYER)!.walletBalance, balBefore, 'không được trừ tiền khi bị từ chối');
    assert.equal(db.users.get(BUYER)!.escrowLocked, 0, 'không được khóa escrow');
    const c = db.escrowContracts.get(pool.id)!;
    assert.equal(c.filledSlots, 0, 'pool không được thêm thành viên');
  });

  test('đúng productId → join thành công', async () => {
    const res = await EscrowService.joinPool({
      poolId: pool.id, productId: cheap.id,
      user: db.users.get(BUYER)!
    });
    assert.equal(res.success, true, `join đúng productId phải thành công: ${JSON.stringify(res.error || '')}`);
  });
});

// --- TEST #7: pool đủ slot thiếu key → AWAITING_STOCK + refund đúng slot ---
describe('P1 #7 — Escrow pool thiếu key', () => {
  test('đủ slot nhưng kho thiếu key → contract AWAITING_STOCK, tiền slot thiếu vẫn khóa', async () => {
    const userId = 'usr-buyer-01';
    const buyer2Id = 'usr-buyer-01'; // dùng lại cùng user với đủ balance
    topUp(userId, 900000);

    const prod = makeProduct('retest-pool2', 100000);
    // Chỉ tạo 1 item tồn kho trong khi pool cần 2 slot → slot 2 thiếu key
    db.inventory.set('inv-re-pool2-1', {
      id: 'inv-re-pool2-1', productId: prod.id, keyCode: 'REAL-KEY-POOL2', state: 'AVAILABLE',
      updatedAt: new Date().toISOString()
    } as any);

    const pool = makePool(prod.id, 2, 100000);
    const balBefore = db.users.get(userId)!.walletBalance;

    const r1 = await EscrowService.joinPool({ poolId: pool.id, productId: prod.id, user: db.users.get(userId)! });
    assert.equal(r1.success, true, `slot 1 join OK: ${JSON.stringify(r1.error || '')}`);

    setImmediate(() => {});
    const r2 = await EscrowService.joinPool({ poolId: pool.id, productId: prod.id, user: db.users.get(userId)! });
    assert.equal(r2.success, true, `slot 2 join OK: ${JSON.stringify(r2.error || '')}`);

    const contract = db.escrowContracts.get(pool.id)!;
    assert.equal(contract.status, 'AWAITING_STOCK', 'pool đủ slot mà thiếu key phải AWAITING_STOCK, không COMPLETED');

    // slot 1 có key → order COMPLETED; slot 2 thiếu → PENDING_STOCK + escrowLocked còn giữ
    const order2 = db.orders.get(`ord-escrow-${pool.id}-2`);
    assert.equal(order2?.status, 'PENDING_STOCK', 'slot 2 phải PENDING_STOCK');
    assert.ok(db.users.get(userId)!.escrowLocked >= 100000, 'slot 2 tiền phải còn bị khóa escrow');

    // force refund: chỉ hoàn slot chưa giao (PENDING_STOCK), KHÔNG hoàn slot đã COMPLETED
    const escBefore = db.users.get(userId)!.escrowLocked;
    const ok = await EscrowService.forceRefundPool(pool.id, 'admin', 'Admin');
    assert.equal(ok, true, 'AWAITING_STOCK pool phải refund được (trước đây trả false)');
    assert.equal(db.users.get(userId)!.escrowLocked, Math.max(0, escBefore - 100000), 'chỉ giải phóng đúng 1 slot còn khóa');
    assert.equal(db.orders.get(`ord-escrow-${pool.id}-2`)?.status, 'CANCELLED', 'order PENDING_STOCK phải bị đóng sau refund');
  });
});

// --- TEST #6: instant buy stock chỉ trừ 1 lần ---
describe('P1 #6 — stock double-deduct', () => {
  test('mua 1 key: stockAvailable giảm đúng 1 (không trừ 2), key còn lại vẫn AVAILABLE', async () => {
    const userId = 'usr-buyer-01';
    const user = db.users.get(userId)!;
    topUp(userId, 900000);

    const prod = makeProduct('retest-stockdetect', 50000);
    // kho có 2 key
    db.inventory.set('inv-re-sd-1', { id: 'inv-re-sd-1', productId: prod.id, keyCode: 'SD-KEY-1', state: 'AVAILABLE', updatedAt: new Date().toISOString() } as any);
    db.inventory.set('inv-re-sd-2', { id: 'inv-re-sd-2', productId: prod.id, keyCode: 'SD-KEY-2', state: 'AVAILABLE', updatedAt: new Date().toISOString() } as any);
    prod.stockAvailable = 2;
    const realAvail = () => Array.from(db.inventory.values()).filter(i => i.productId === prod.id && i.state === 'AVAILABLE').length;

    const r = await OrderService.createInstantPurchase({
      buyer: user, productId: prod.id, quantity: 1,
      paymentMethod: 'wallet', idempotencyKey: `retest-sd-${Date.now()}`
    } as any);
    assert.equal(r.success, true, `mua 1 key OK: ${JSON.stringify(r.error || '')}`);

    // stockAvailable phải = 1 (giảm đúng 1), KHÔNG phải 0
    assert.equal(prod.stockAvailable, 1, `stockAvailable phải = 1, được: ${prod.stockAvailable}`);
    assert.equal(realAvail(), 1, 'còn đúng 1 key AVAILABLE');

    // mua tiếp key thứ 2 vẫn mua được (lỗi cũ: stockAvailable=0 bị chặn hết hàng dù còn key thật)
    const r2 = await OrderService.createInstantPurchase({
      buyer: user, productId: prod.id, quantity: 1,
      paymentMethod: 'wallet', idempotencyKey: `retest-sd-${Date.now()}-2`
    } as any);
    assert.equal(r2.success, true, `mua key thứ 2 phải thành công (vẫn còn key thật): ${JSON.stringify(r2.error || '')}`);
    assert.equal(prod.stockAvailable, 0, 'sau 2 lần mua, stockAvailable = 0');
    assert.equal(realAvail(), 0, 'hết key AVAILABLE');
  });
});

// --- TEST #1: concurrent double-credit (webhook Binance retry song song) ---
describe('P1 #1 — double-credit concurrent (gateway lock)', () => {
  test('2 webhook PAY_SUCCESS cùng đơn gọi đồng thời → chỉ credit ĐÚNG 1 lần', async () => {
    const userId = 'usr-buyer-01';
    topUp(userId, 900000);
    const before = db.users.get(userId)!.walletBalance;

    const prepayId = `prepay-dup-${Date.now()}`;
    const merchantTradeNo = `CYBRDUP${Date.now()}`;
    const usdt = 10;
    const vndPerIntent = Math.round(usdt * (db.systemConfig?.usdToVndRate || 25400));

    // seed intent giống hệt createBinancePayOrder tạo
    db.depositIntents.set(prepayId, {
      id: prepayId, userId, amountVnd: vndPerIntent, amountUsdt: usdt, merchantTradeNo,
      gateway: 'BINANCE_PAY', status: 'PENDING',
      createdAt: new Date().toISOString(), expireTime: 0
    } as any);

    const payload = {
      bizType: 'PAYMENT', bizStatus: 'PAY_SUCCESS', bizIdStr: prepayId,
      data: JSON.stringify({ merchantTradeNo, totalFee: String(usdt) + '.00000000', currency: 'USDT', transactTime: Date.now() })
    };

    // Gọi 2 webhook giống hệt nhau ĐỒNG THỜI (mô phỏng Binance retry song song)
    const [r1, r2] = await Promise.all([
      GatewayVerificationService.handleBinancePayOrderNotification({ payload, ipAddress: '1.1.1.1' }),
      GatewayVerificationService.handleBinancePayOrderNotification({ payload, ipAddress: '2.2.2.2' })
    ]);

    const after = db.users.get(userId)!.walletBalance;
    const creditedTotal = after - before;
    const processedCount = [r1, r2].filter(r => r.processed).length;

    // Quan trọng: phải ĐÚNG 1 lần processed (lock/re-check chặn lần 2)
    assert.equal(processedCount, 1, `chỉ 1 trong 2 webhook được processed, được: ${processedCount} (${r1.processed}/${r2.processed})`);
    assert.equal(creditedTotal, vndPerIntent, `tổng credit phải = 1 lần nạp (${vndPerIntent}), được: ${creditedTotal} — nếu lớn hơn là double-credit!`);
  });
});