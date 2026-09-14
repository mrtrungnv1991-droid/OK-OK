import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../server/db/store';
import { CryptoGateService } from '../../server/services/cryptoGateService';
import { LedgerService } from '../../server/services/ledgerService';
import { GatewayVerificationService } from '../../server/services/gatewayVerificationService';

// ============================================================================
// Regression: CRITICAL race credit — creditIntent đã từng chốt intent COMPLETED
// + redeem txHash fire-and-forget TRƯỚC khi Ledger ghi tiền. Nếu Ledger fail:
// tiền mất vĩnh viễn (intent COMPLETED + txHash đã burn). Fix: Ledger await
// THÀNH CÔNG trước → chỉ sau đó mới chốt intent + redeem. Test này verify:
//   1. Sau scanCycle() resolve → balance ĐÃ tăng (không phải đợi microtask)
//   2. Ledger fail → intent giữ PENDING, txHash CHƯA redeem (retry được)
//   3. verifyTxByHash thủ công cũng credit đồng bộ sau await
// ============================================================================

const USER = 'usr-buyer-01';
const LTC_ADDR = 'LWYGurq3FqYbP4BxL5f8CMgJf8stVuXDP7';
// txHash PHẢI ngẫu nhiên mỗi lần chạy — idempotency_records.json lưu đĩa giữa các
// lần test, nếu hash là hằng số thì lần chạy sau bị isAlreadyRedeemed chặn
function freshTx(tag: string) {
  return `AAAA_${Date.now()}_${Math.random().toString(36).slice(2, 10)}_${tag}`;
}

let originalScanLtc: any;
let originalExecute: any;

let amountCursor = 0;
function uniqueAmount() {
  // Mỗi test dùng amount riêng (đúng nguyên tắc amount-unique của cổng
  // — production không bao giờ có 2 intent PENDING cùng amount)
  amountCursor += 0.00001101;
  return 0.20136931 + amountCursor;
}

function seedIntent(placeholder: string, amountLtc: number) {
  const id = `it-cg-reg-${Date.now()}-${placeholder}`;
  const vnd = Math.round(amountLtc * 2150000);
  db.cryptoGateIntents.set(id, {
    id, userId: USER, network: 'LTC', address: LTC_ADDR,
    amountCrypto: amountLtc, amountVnd: vnd,
    coin: 'LTC', status: 'PENDING',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  } as any);
  return { id, vnd };
}

function fakeTransfer(txHash: string, amount: number, confirmations = 200) {
  return [{
    txHash, toAddress: LTC_ADDR, amount,
    confirmations, timestampMs: Date.now(), blockNumber: 3000000
  }];
}

before(() => {
  if (!db.systemConfig) (db as any).systemConfig = {};
  db.systemConfig.cryptoGateLtcAddress = LTC_ADDR;
  db.systemConfig.cryptoGateEnabled = true;
  // Stub scanner LTC để test không phụ thuộc network thật
  originalScanLtc = (CryptoGateService as any).scanLtc;
});

after(() => {
  (CryptoGateService as any).scanLtc = originalScanLtc;
  if (originalExecute) (LedgerService as any).executeTransaction = originalExecute;
});

test('FIXED: sau scanCycle resolve, balance đã tăng + intent COMPLETED + txHash redeem', async () => {
  const beforeBal = db.users.get(USER)!.walletBalance;
  const amt = uniqueAmount();
  const txHash = freshTx('OK');
  const { id: intentId, vnd } = seedIntent('ok', amt);
  (CryptoGateService as any).scanLtc = async () => fakeTransfer(txHash, amt);

  const res = await CryptoGateService.scanCycle();

  const afterBal = db.users.get(USER)!.walletBalance;
  const intent = db.cryptoGateIntents.get(intentId);
  assert.equal(res.credited, 1, 'scanCycle phải báo credited=1');
  // Mấu chốt của fix: tại lúc scanCycle() RESOLVE, tiền ĐÃ vào ví
  // (trước fix: fire-and-forget → balance chưa kịp cập nhật)
  assert.equal(afterBal, beforeBal + vnd, `balance phải +${vnd} ngay khi scanCycle resolve`);
  assert.equal(intent?.status, 'COMPLETED');
  assert.equal(GatewayVerificationService.isAlreadyRedeemed(txHash), true,
    'txHash phải được redeem (markRedeemed) sau khi credit thành công');
});

test('FIXED: Ledger fail → intent giữ PENDING + txHash CHƯA redeem (retry được, không mất tiền)', async () => {
  // Giả lập Ledger từ chối credit
  originalExecute = (LedgerService as any).executeTransaction;
  (LedgerService as any).executeTransaction = async () => ({ success: false, error: 'SIMULATED_LEDGER_FAIL' });

  const beforeBal = db.users.get(USER)!.walletBalance;
  const amt = uniqueAmount();
  const failingTx = freshTx('FAIL');
  const { id: intentId } = seedIntent('fail', amt);
  (CryptoGateService as any).scanLtc = async () => fakeTransfer(failingTx, amt);

  const res = await CryptoGateService.scanCycle();

  const afterBal = db.users.get(USER)!.walletBalance;
  const intent = db.cryptoGateIntents.get(intentId);
  assert.equal(res.credited, 0, 'Ledger fail → không tính credited');
  assert.equal(afterBal, beforeBal, 'balance KHÔNG đổi khi Ledger fail');
  // Mấu chốt: intent vẫn PENDING + txHash chưa redeem → scan sau (hoặc manual) retry được
  assert.equal(intent?.status, 'PENDING', 'intent phải giữ PENDING khi Ledger fail');
  assert.equal(GatewayVerificationService.isAlreadyRedeemed(failingTx), false,
    'txHash phải CHƯA redeem khi Ledger fail — nếu không thì tiền mất vĩnh viễn');

  // khôi phục ledger để không ảnh hưởng test khác
  (LedgerService as any).executeTransaction = originalExecute;
  originalExecute = undefined;
});

test('FIXED: verifyTxByHash trả về credit đồng bộ (không cần chờ)', async () => {
  const beforeBal = db.users.get(USER)!.walletBalance;
  const amt = uniqueAmount();
  const manualTx = freshTx('MANUAL');
  const { id: intentId, vnd } = seedIntent('manual', amt);
  (CryptoGateService as any).scanLtc = async () => fakeTransfer(manualTx, amt);
  // user tự verify với txHash thật
  const res = await CryptoGateService.verifyTxByHash({
    txHash: manualTx, network: 'LTC', userId: USER, ipAddress: '127.0.0.1'
  });
  const afterBal = db.users.get(USER)!.walletBalance;
  assert.equal(res.success, true, `verifyTxByHash phải thành công: ${res.message}`);
  assert.equal(afterBal, beforeBal + vnd, 'credit phải vào ví NGAY sau await verify');
  assert.equal(db.cryptoGateIntents.get(intentId)?.status, 'COMPLETED');
});