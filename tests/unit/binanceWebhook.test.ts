import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { db } from '../../server/db/store';
import { GatewayVerificationService } from '../../server/services/gatewayVerificationService';

// ============================================================================
// Binance Pay Webhook test suite
// - RSA signature verify: sinh keypair locally, stub fetchBinancePayCert để
//   test offline (không gọi Binance thật). Payload ký đúng spec:
//   timestamp + "\n" + nonce + "\n" + body + "\n", SHA256withRSA, base64.
// - handleBinancePayOrderNotification: credit/idempotency/unknown-order/
//   amount-mismatch/PAY_CLOSED.
// ============================================================================

describe('Binance Pay Webhook Signature + Auto-Credit Test Suite', () => {
  let pubPem: string;
  const TEST_USER_ID = 'usr-buyer-01';

  before(() => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    pubPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    (global as any).__TEST_BINANCE_PRIV = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  });

  function signPayload(timestamp: string, nonce: string, body: string): string {
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${timestamp}\n${nonce}\n${body}\n`, 'utf8');
    return signer.sign((global as any).__TEST_BINANCE_PRIV, 'base64');
  }

  function stubCert() {
    // Stub cert fetch: trả public key local cho mọi serial (offline test)
    (GatewayVerificationService as any).fetchBinancePayCert = async (_sn: string) => ({ success: true, certPublic: pubPem });
  }

  test('valid RSA signature -> valid=true', async () => {
    stubCert();
    const body = JSON.stringify({ bizType: 'PAYMENT', bizStatus: 'PAY_SUCCESS', bizIdStr: '123', data: '{}' });
    const ts = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const res = await GatewayVerificationService.verifyBinancePayWebhookSignature({
      rawBody: body, timestamp: ts, nonce, signature: signPayload(ts, nonce, body), certificateSn: 'TEST_SN'
    });
    assert.equal(res.valid, true, `expected valid, got: ${res.reason}`);
  });

  test('tampered body -> valid=false', async () => {
    stubCert();
    const body = JSON.stringify({ bizStatus: 'PAY_SUCCESS', bizIdStr: '123' });
    const ts = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const sig = signPayload(ts, nonce, body);
    const tampered = JSON.stringify({ bizStatus: 'PAY_SUCCESS', bizIdStr: '999' });
    const res = await GatewayVerificationService.verifyBinancePayWebhookSignature({
      rawBody: tampered, timestamp: ts, nonce, signature: sig, certificateSn: 'TEST_SN'
    });
    assert.equal(res.valid, false, 'tampered body must fail signature check');
  });

  test('stale timestamp (>5min) -> valid=false (replay guard)', async () => {
    stubCert();
    const body = JSON.stringify({ bizStatus: 'PAY_SUCCESS' });
    const ts = (Date.now() - 6 * 60 * 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const res = await GatewayVerificationService.verifyBinancePayWebhookSignature({
      rawBody: body, timestamp: ts, nonce, signature: signPayload(ts, nonce, body), certificateSn: 'TEST_SN'
    });
    assert.equal(res.valid, false, 'stale timestamp must be rejected');
  });

  test('missing headers -> valid=false (fail-closed)', async () => {
    stubCert();
    const res = await GatewayVerificationService.verifyBinancePayWebhookSignature({
      rawBody: '{"a":1}', timestamp: undefined, nonce: 'x', signature: 'y', certificateSn: 'z'
    });
    assert.equal(res.valid, false);
  });

  test('PAY_SUCCESS + known intent -> credit ví đúng số tiền', async () => {
    const user = db.users.get(TEST_USER_ID)!;
    const before = user.walletBalance;
    const merchantTradeNo = `CYBRTEST${Date.now()}`;
    const prepayId = `prepay-${Date.now()}`;
    db.depositIntents.set(prepayId, {
      id: prepayId, userId: TEST_USER_ID, amountVnd: 254000, amountUsdt: 10,
      merchantTradeNo, gateway: 'BINANCE_PAY', status: 'PENDING',
      createdAt: new Date().toISOString(), expireTime: 0
    } as any);

    const payload = {
      bizType: 'PAYMENT', bizStatus: 'PAY_SUCCESS', bizIdStr: prepayId, bizId: Number(prepayId.slice(-9)) || 0,
      data: JSON.stringify({ merchantTradeNo, totalFee: '10.00000000', currency: 'USDT', transactTime: Date.now() })
    };
    const res = await GatewayVerificationService.handleBinancePayOrderNotification({ payload, ipAddress: '127.0.0.1' });
    assert.equal(res.processed, true, `expected processed, msg: ${res.message}`);
    const rate = db.systemConfig?.usdToVndRate || 25400;
    assert.equal(res.credited, Math.round(10 * rate));
    const after = db.users.get(TEST_USER_ID)!.walletBalance;
    assert.equal(after, before + Math.round(10 * rate), 'balance must increase exactly by credited amount');
  });

  test('replay cùng webhook -> idempotent, KHÔNG credit lần 2', async () => {
    // dùng lại intent + payload của test trước qua merchantTradeNo đã redeem
    const redeemedKeys = Array.from(db.processedWebhooks.keys());
    assert.ok(redeemedKeys.length > 0, 'phải có key đã redeem từ test trước');
    const before = db.users.get(TEST_USER_ID)!.walletBalance;

    // tìm intent vừa PAID để dựng lại payload replay
    let paidIntent: any = null;
    for (const d of db.depositIntents.values()) {
      if ((d as any).merchantTradeNo?.startsWith('CYBRTEST') && (d as any).userId === TEST_USER_ID) { paidIntent = d; }
    }
    assert.ok(paidIntent, 'intent CYBRTEST phải tồn tại');
    const payload = {
      bizType: 'PAYMENT', bizStatus: 'PAY_SUCCESS', bizIdStr: paidIntent.id,
      data: JSON.stringify({ merchantTradeNo: paidIntent.merchantTradeNo, totalFee: '10.00000000', currency: 'USDT' })
    };
    const res = await GatewayVerificationService.handleBinancePayOrderNotification({ payload });
    assert.equal(res.processed, false, 'replay must not process again');
    assert.match(res.message, /đã được cộng tiền|idempotent/i);
    const after = db.users.get(TEST_USER_ID)!.walletBalance;
    assert.equal(after, before, 'replay must not change balance');
  });

  test('unknown merchantTradeNo (đơn không do hệ thống tạo) -> KHÔNG credit', async () => {
    const before = db.users.get(TEST_USER_ID)!.walletBalance;
    const payload = {
      bizType: 'PAYMENT', bizStatus: 'PAY_SUCCESS', bizIdStr: '999999999999',
      data: JSON.stringify({ merchantTradeNo: 'HACKER_ORDER_1', totalFee: '50.00000000', currency: 'USDT' })
    };
    const res = await GatewayVerificationService.handleBinancePayOrderNotification({ payload });
    assert.equal(res.processed, false);
    assert.equal(res.credited, 0);
    assert.match(res.message, /không do hệ thống tạo|Không tìm thấy/i);
    assert.equal(db.users.get(TEST_USER_ID)!.walletBalance, before, 'unknown order must not credit anyone');
  });

  test('amount mismatch (webhook 99 USDT vs intent 10 USDT) -> KHÔNG credit', async () => {
    const merchantTradeNo = `CYBRMIS${Date.now()}`;
    const prepayId = `prepay-mis-${Date.now()}`;
    db.depositIntents.set(prepayId, {
      id: prepayId, userId: TEST_USER_ID, amountVnd: 254000, amountUsdt: 10,
      merchantTradeNo, gateway: 'BINANCE_PAY', status: 'PENDING',
      createdAt: new Date().toISOString(), expireTime: 0
    } as any);
    const before = db.users.get(TEST_USER_ID)!.walletBalance;
    const payload = {
      bizType: 'PAYMENT', bizStatus: 'PAY_SUCCESS', bizIdStr: prepayId,
      data: JSON.stringify({ merchantTradeNo, totalFee: '99.00000000', currency: 'USDT' })
    };
    const res = await GatewayVerificationService.handleBinancePayOrderNotification({ payload });
    assert.equal(res.processed, false);
    assert.match(res.message, /lệch/i);
    assert.equal(db.users.get(TEST_USER_ID)!.walletBalance, before, 'mismatched amount must not credit');
  });

  test('PAY_CLOSED -> KHÔNG credit', async () => {
    const payload = {
      bizType: 'PAYMENT', bizStatus: 'PAY_CLOSED', bizIdStr: 'whatever',
      data: JSON.stringify({ merchantTradeNo: 'CYBRCLOSED1', totalFee: '10', currency: 'USDT' })
    };
    const res = await GatewayVerificationService.handleBinancePayOrderNotification({ payload });
    assert.equal(res.processed, false);
    assert.equal(res.credited, 0);
    assert.match(res.message, /PAY_CLOSED|không credit/i);
  });

  test('data field là JSON string hỏng -> không crash, không credit', async () => {
    const payload = { bizType: 'PAYMENT', bizStatus: 'PAY_SUCCESS', bizIdStr: 'bad-data-1', data: '{not valid json' };
    const res = await GatewayVerificationService.handleBinancePayOrderNotification({ payload });
    assert.equal(res.processed, false);
    assert.equal(res.credited, 0);
  });
});
