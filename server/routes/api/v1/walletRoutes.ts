import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../../../db/store';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { LedgerService } from '../../../services/ledgerService';
import { InventoryService } from '../../../services/inventoryService';
import { CryptoGateService } from '../../../services/cryptoGateService';
import { GatewayVerificationService } from '../../../services/gatewayVerificationService';

export const walletRouter = Router();

// GET /api/v1/wallet/ledger - Double-entry Ledger history
walletRouter.get('/ledger', requireAuth, (req: AuthenticatedRequest, res) => {
  const transactions = LedgerService.getUserTransactions(req.user!.id);
  res.json({
    success: true,
    walletBalance: req.user!.walletBalance,
    escrowLocked: req.user!.escrowLocked,
    transactions
  });
});

// POST /api/v1/wallet/deposit - Create Deposit Intent (Chờ đối soát từ cổng thanh toán / ngân hàng)
walletRouter.post('/deposit', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { amount, methodTitle, idempotencyKey } = req.body;
  const depositAmount = Number(amount);

  if (isNaN(depositAmount) || depositAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Số tiền nạp không hợp lệ' });
  }

  // F01: Chặn direct-credit từ request client. Request nạp chỉ tạo DepositIntent chờ thanh toán.
  // Số dư ví chỉ được cộng khi có đối soát / webhook xác thực từ ngân hàng hoặc cổng thanh toán.
  const intentId = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const depositIntent = {
      id: intentId,
      userId: req.user!.id,
      amount: depositAmount,
      methodTitle: methodTitle || 'Cổng Chuyển Khoản Tự Động',
      idempotencyKey: idempotencyKey || intentId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    // CYBERPOOL FIX: persist the deposit intent. Previously it was created and
    // returned but never stored, so the webhook side had no expected-amount
    // record to reconcile against and the intent disappeared on restart.
    try {
      db.depositIntents.set(intentId, depositIntent);
    } catch (err: any) {
      console.warn('[WALLET_DEPOSIT] Không lưu được deposit intent:', err?.message);
    }

  res.json({
    success: true,
    status: 'PENDING',
    depositIntent,
    message: 'Yêu cầu nạp tiền đã được ghi nhận. Vui lòng hoàn tất chuyển khoản chính xác nội dung để hệ thống tự động cộng tiền sau khi đối soát.'
  });
});

// POST /api/v1/wallet/binance-pay/create-order - Tạo lệnh Binance Pay (Mô hình A)
walletRouter.post('/binance-pay/create-order', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { amount, returnUrl, cancelUrl } = req.body;
    const result = await GatewayVerificationService.createBinancePayOrder({
      userId: req.user!.id,
      amountVnd: Number(amount),
      returnUrl,
      cancelUrl,
      ipAddress: req.ip
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Lỗi hệ thống tạo lệnh Binance Pay' });
  }
});

// POST /api/v1/wallet/momo/create-payment - Tạo lệnh thu tiền MoMo captureWallet
walletRouter.post('/momo/create-payment', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { amount, redirectUrl, orderInfo } = req.body;
    const result = await GatewayVerificationService.createMoMoPayment({
      userId: req.user!.id,
      amountVnd: Number(amount),
      redirectUrl,
      orderInfo,
      ipAddress: req.ip
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Lỗi hệ thống tạo lệnh MoMo' });
  }
});

// POST /api/v1/wallet/verify-binance - Verify Binance Pay Transaction via Official OpenAPI
walletRouter.post('/verify-binance', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId, amount, memo } = req.body;
    const result = await GatewayVerificationService.verifyBinancePay({
      userId: req.user!.id,
      orderId,
      declaredAmount: amount,
      memo,
      ipAddress: req.ip
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Lỗi hệ thống xác minh Binance' });
  }
});

// CYBERPOOL CRYPTOGATE: hai route cũ /verify-crypto-usdt và /verify-ltc đã GỠ.
// Chúng gọi GatewayVerificationService.verifyCryptoUsdt/verifyCryptoLtc dùng các
// explorer API đã CHẾT (apilist.tronscanapi.com 404, api.bscscan.com V1 deprecated
// → NOTOK) và đọc systemConfig.cryptoUsdtAddress giờ để trống (fail-closed) → không
// bao giờ xác minh được giao dịch thật. Cổng nạp crypto nay đi qua CryptoGate
// (/wallet/crypto-gate/*) verify on-chain thật (TronGrid/publicnode/BlockCypher).

// POST /api/v1/wallet/verify-momo - Verify MoMo E-Wallet Transaction
walletRouter.post('/verify-momo', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { transId, amount, memo } = req.body;
    const result = await GatewayVerificationService.verifyMoMo({
      userId: req.user!.id,
      transId,
      declaredAmount: amount,
      memo,
      ipAddress: req.ip
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Lỗi hệ thống xác minh MoMo' });
  }
});

// POST /api/v1/wallet/verify-vietqr - Verify VietQR Napas 24/7 Transfer
walletRouter.post('/verify-vietqr', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { transferCode, amount } = req.body;
    const result = await GatewayVerificationService.verifyVietQr({
      userId: req.user!.id,
      transferCode,
      amount,
      ipAddress: req.ip
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Lỗi xác minh VietQR' });
  }
});

// GET /api/v1/wallet/telco-cards - Get user's submitted scratch cards history
walletRouter.get('/telco-cards', requireAuth, (req: AuthenticatedRequest, res) => {
  const userCards: any[] = [];
  for (const card of db.telcoCards.values()) {
    if (card.userId === req.user!.id) {
      userCards.push(card);
    }
  }
  userCards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, cards: userCards });
});

// POST /api/v1/wallet/telco-card - Instant Telco Scratch Card (Thẻ Cào) via Card24h API
walletRouter.post('/telco-card', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { telco, declaredAmount, pin, serial } = req.body;
  const numAmount = Number(declaredAmount);

  if (!telco || !pin || !serial || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Thông tin thẻ không hợp lệ (vui lòng nhập đủ loại thẻ, mệnh giá, mã pin và số seri)' });
  }

  // Card24h API credentials (F11: Gỡ bỏ credentials fallback cố định)
  const partnerId = db.systemConfig?.telcoPartnerId || process.env.CARD24H_PARTNER_ID;
  const partnerKey = db.systemConfig?.telcoPartnerKey || process.env.CARD24H_PARTNER_KEY;
  const provider = db.systemConfig?.telcoProvider || 'card24h';

  if (!partnerId || !partnerKey) {
    return res.status(503).json({
      success: false,
      error: 'Cổng đổi thẻ cào Card24h chưa được cấu hình credentials (CARD24H_PARTNER_ID, CARD24H_PARTNER_KEY). Vui lòng cấu hình trên hệ thống quản trị.'
    });
  }

  // Normalize telco for Card24h
  let normalizedTelco = String(telco).toUpperCase().trim();
  if (normalizedTelco === 'VIETNAMOBILE') normalizedTelco = 'VNMOBI';

  const cleanPin = String(pin).trim();
  const cleanSerial = String(serial).trim();
  const requestId = `CP_${req.user!.id.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
  const sign = crypto.createHash('md5').update(`${partnerKey}${cleanPin}${cleanSerial}`).digest('hex');

  // CYBERPOOL FIX (#5): chặn submit lại thẻ đã được credit trước đó (một thẻ
  // cào chỉ có giá trị MỘT lần) — kể cả khi user khác thử lại cùng mã/seri.
  const cardIdentityKey = `CARD24H_${cleanPin}_${cleanSerial}`;
  if (db.processedWebhooks.has(cardIdentityKey)) {
    return res.status(409).json({
      success: false,
      error: 'Thẻ cào này đã được hệ thống ghi nhận và cộng tiền trước đó (mỗi thẻ chỉ dùng được một lần).'
    });
  }

  // If using Card24h gateway
  if (provider === 'card24h' && partnerId && partnerKey) {
    try {
      const card24hUrl = `https://card24h.com/chargingws/v2?sign=${sign}&telco=${normalizedTelco}&code=${encodeURIComponent(cleanPin)}&serial=${encodeURIComponent(cleanSerial)}&amount=${numAmount}&request_id=${requestId}&partner_id=${partnerId}&command=charging`;
      
      console.log(`[CARD24H_SUBMIT] User ${req.user!.id} submitting card: ${normalizedTelco} ${numAmount} - RequestId: ${requestId}`);
      
      const card24hRes = await fetch(card24hUrl);
      const data: any = await card24hRes.json();

      console.log(`[CARD24H_RESPONSE]`, data);

      // Card24h status:
      // 99: Đã gửi thẻ lên hệ thống thành công (chờ gạch thẻ và gọi callback)
      // 1: Thẻ hợp lệ đã duyệt thành công
      // 2: Thẻ sai mệnh giá
      // 3: Thẻ lỗi (sai mã nạp, sai seri, thẻ đã sử dụng)
      if (data.status === 99 || data.status === 1) {
        const receivedAmount = data.amount ? Number(data.amount) : Math.round(numAmount * 0.82);

        db.telcoCards.set(requestId, {
          id: requestId,
          requestId,
          userId: req.user!.id,
          telco: normalizedTelco,
          pin: cleanPin,
          serial: cleanSerial,
          declaredAmount: numAmount,
          receivedAmount,
          status: data.status === 1 ? 'SUCCESS' : 'PENDING',
          card24hTransId: data.trans_id,
          message: data.message || (data.status === 99 ? 'Thẻ đang chờ gạch tự động' : 'Thẻ hợp lệ'),
          createdAt: new Date().toISOString()
        });

        if (data.status === 1) {
          const result = await LedgerService.executeTransaction({
            userId: req.user!.id,
            type: 'DEPOSIT',
            amount: receivedAmount,
            description: `Gạch thẻ cào ${normalizedTelco} ${numAmount.toLocaleString()}đ qua Card24h (Thực nhận +${receivedAmount.toLocaleString()}đ)`,
            referenceId: requestId,
            ipAddress: req.ip
          });

          // CYBERPOOL FIX (#5 — double-credit by design): sync path credit ngay
          // nhưng trước đây KHÔNG commit idempotency → callback async của Card24h
          // cho cùng thẻ sẽ credit lần 2. Đánh dấu danh tính thẻ + trans_id +
          // requestId bằng đúng key mà handleCard24hCallback kiểm tra.
          const cardIdentityKey = `CARD24H_${cleanPin}_${cleanSerial}`;
          db.processedWebhooks.set(cardIdentityKey, {
            amount: receivedAmount,
            userId: req.user!.id,
            status: 'COMPLETED',
            processedAt: new Date().toISOString(),
            provider: 'CARD24H',
            memo: `Sync charge ${cleanPin}/${cleanSerial}`
          });
          if (data.trans_id) {
            db.processedWebhooks.set(`CARD24H_TRANS_${String(data.trans_id)}`, {
              amount: receivedAmount,
              userId: req.user!.id,
              status: 'COMPLETED',
              processedAt: new Date().toISOString(),
              provider: 'CARD24H',
              memo: `Sync charge trans_id ${data.trans_id}`
            });
          }
          db.processedWebhooks.set(requestId, {
            amount: receivedAmount,
            userId: req.user!.id,
            status: 'COMPLETED',
            processedAt: new Date().toISOString(),
            provider: 'CARD24H',
            memo: 'Sync charge request_id'
          });

          return res.json({
            success: true,
            status: 'SUCCESS',
            message: 'Thẻ cào hợp lệ! Đã cộng tiền vào ví thành công.',
            receivedAmount,
            newBalance: req.user!.walletBalance,
            transaction: result.transaction
          });
        }

        return res.json({
          success: true,
          status: 'PENDING',
          message: 'Đã gửi thẻ lên hệ thống Card24h thành công! Thẻ đang được gạch tự động (10-30s), tiền sẽ tự cộng vào ví của bạn.',
          requestId,
          receivedAmount,
          newBalance: req.user!.walletBalance
        });
      } else {
        // Card24h returned error status (e.g. status === 3)
        let friendlyError = data.message || 'Thẻ cào không hợp lệ hoặc đã qua sử dụng';
        if (data.message === 'charging.invalid_card_code') {
          friendlyError = 'Mã nạp (PIN) hoặc số seri thẻ không đúng. Vui lòng kiểm tra lại.';
        } else if (data.message === 'charging.card_used') {
          friendlyError = 'Thẻ cào này đã được sử dụng trước đó.';
        }

        return res.status(400).json({
          success: false,
          error: friendlyError,
          rawMessage: data.message,
          card24hStatus: data.status
        });
      }
    } catch (apiErr: any) {
      console.error('[CARD24H_FETCH_ERROR]', apiErr);
      return res.status(502).json({
        success: false,
        error: `Không thể kết nối đến máy chủ Card24h: ${apiErr.message || 'Lỗi mạng'}`
      });
    }
  }

  // Chặn hoàn toàn fallback cộng tiền ảo khi không qua cổng gạch thẻ hợp lệ
  return res.status(400).json({
    success: false,
    error: 'Nhà cung cấp gạch thẻ cào không hợp lệ hoặc chưa được hỗ trợ. Vui lòng thử lại sau.'
  });
});

// POST /api/v1/wallet/withdraw - Request CTV/Affiliate Withdrawal
walletRouter.post('/withdraw', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { amount, bankName, accountNumber, accountName, paymentMethod = 'bank', withdrawalType = 'wallet_balance' } = req.body;
  const numAmount = Number(amount);

  if (isNaN(numAmount) || numAmount < 50000) {
    return res.status(400).json({ success: false, error: 'Hạn mức rút tối thiểu là 50.000đ' });
  }

  if (!bankName || !accountNumber || !accountName) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin tài khoản thụ hưởng (bankName/accountNumber/accountName)' });
  }

  if (req.user!.walletBalance < numAmount) {
    return res.status(400).json({ success: false, error: 'Số dư không đủ để rút' });
  }

  const result = await LedgerService.executeTransaction({
    userId: req.user!.id,
    type: 'WITHDRAWAL',
    amount: -numAmount,
    description: `Yêu cầu rút tiền về ${bankName} [${accountNumber} - ${accountName}]`,
    ipAddress: req.ip
  });

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error || 'Không thể tạo yêu cầu rút tiền' });
  }

  // CYBERPOOL FIX: lưu withdrawal request trên server — trước đây tiền bị trừ
  // ngay nhưng không có record nào để admin duyệt/từ chối → reject không hoàn tiền.
  const withdrawal = {
    id: `WD-${Date.now().toString(36).toUpperCase()}`,
    userId: req.user!.id,
    ctvId: req.user!.id,
    ctvName: req.user!.name || req.user!.email,
    amount: numAmount,
    bankName,
    accountNumber,
    accountName,
    paymentMethod,
    withdrawalType,
    status: 'pending',
    ledgerTransactionId: result.transaction?.id || '',
    createdAt: new Date().toISOString(),
    processedAt: null as string | null,
    processedBy: null as string | null,
    note: ''
  };
  db.withdrawals.unshift(withdrawal);

  res.json({
    success: true,
    message: 'Yêu cầu rút tiền đã được ghi nhận và đang chờ duyệt giải ngân',
    transaction: result.transaction,
    withdrawal
  });
});

// GET /api/v1/wallet/withdrawals - lịch sử rút tiền của chính user
walletRouter.get('/withdrawals', requireAuth, (req: AuthenticatedRequest, res) => {
  const mine = db.withdrawals.filter(w => w.userId === req.user!.id);
  res.json({ success: true, withdrawals: mine });
});

// POST /api/v1/wallet/admin/adjust - SuperAdmin Balance Adjustment
walletRouter.post('/admin/adjust', requireAuth, requireRole('SUPER_ADMIN'), async (req: AuthenticatedRequest, res) => {
  const { targetUserId, amount, reason } = req.body;

  // CYBERPOOL SECURITY FIX (#13): trước đây amount không được validate —
  // Number(undefined)=NaN → SYSTEM_ADJUSTMENT set balance thành NaN (guard
  // NaN<0 không fire), làm hỏng ví user; targetUserId cũng không check tồn tại.
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount === 0) {
    return res.status(400).json({ success: false, error: 'amount phải là số hợp lệ khác 0' });
  }
  if (!targetUserId || !db.users.has(String(targetUserId))) {
    return res.status(404).json({ success: false, error: 'targetUserId không tồn tại trong hệ thống' });
  }

  const result = await LedgerService.executeTransaction({
    userId: targetUserId,
    type: 'SYSTEM_ADJUSTMENT',
    amount: numAmount,
    description: `Admin điều chỉnh số dư: ${reason || 'Nâng cấp tài khoản'}`,
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    ipAddress: req.ip
  });

  res.json(result);
});

// ============================================================================
// CYBERPOOL FIX (#5 frontend audit): LUCKY WHEEL server-authoritative.
// Trước đây toàn bộ vòng quay chạy client-side: prize chọn bằng Math.random,
// SPIN_COST không bao giờ bị trừ, deliveredCode hardcode giả trong bundle,
// "recent winners" bịa, banner "100% WIN". Giờ server: trừ phí qua ledger,
// quay bằng crypto RNG với bảng giải thưởng cấu hình server, chỉ trả code
// thật khi có inventory (không bịa), lưu lịch sử spin.
// ============================================================================

const WHEEL_SPIN_COST = 20000;

// Bảng giải thưởng server-side (không chứa code giả — code chỉ đến từ inventory).
interface ServerWheelPrize {
  id: string;
  name: string;
  type: 'key' | 'wallet_cash' | 'voucher' | 'game_diamonds' | 'giftup_card' | 'bad_luck';
  value: number;
  probability: number; // 0..1, tổng phải = 1
  productId?: string; // cho giải thưởng cần inventory thật (key/diamonds/giftup)
}

function getWheelPrizes(): ServerWheelPrize[] {
  const configured = (db.systemConfig as any)?.wheelPrizes;
  if (Array.isArray(configured) && configured.length > 0) {
    return configured;
  }
  // Mặc định: KHÔNG có giải key/diamonds/giftup với code bịa. Chỉ wallet_cash
  // (cộng ví thật qua ledger) + voucher (ghi vào db.vouchers) + bad_luck.
  return [
    { id: 'p-cash-50', name: '+50,000 Wallet Cash', type: 'wallet_cash', value: 50000, probability: 0.08 },
    { id: 'p-cash-20', name: '+20,000 Wallet Cash', type: 'wallet_cash', value: 20000, probability: 0.17 },
    { id: 'p-cash-10', name: '+10,000 Wallet Cash', type: 'wallet_cash', value: 10000, probability: 0.25 },
    { id: 'p-voucher', name: 'Voucher CYBERWHEEL 10%', type: 'voucher', value: 10, probability: 0.10 },
    { id: 'p-badluck', name: 'Chúc bạn may mắn lần sau', type: 'bad_luck', value: 0, probability: 0.40 }
  ];
}

// GET /api/v1/wallet/wheel/config - bảng giải thưởng + chi phí (public cho UI)
walletRouter.get('/wheel/config', (req, res) => {
  res.json({
    success: true,
    spinCost: WHEEL_SPIN_COST,
    prizes: getWheelPrizes().map(({ id, name, type, value, probability }) => ({ id, name, type, value, probability }))
  });
});

// GET /api/v1/wallet/wheel/recent - lịch sử người trúng THẬT (không bịa)
walletRouter.get('/wheel/recent', (req, res) => {
  const recent = db.wheelSpins
    .filter(s => s.value > 0)
    .slice(0, 6)
    .map(s => ({
      id: s.id,
      user: s.userName,
      prizeName: s.prizeName,
      prizeType: s.prizeType,
      value: s.value,
      timestamp: s.createdAt,
      txId: s.ledgerTxId || s.id
    }));
  res.json({ success: true, winners: recent });
});

// POST /api/v1/wallet/wheel/spin - quay thật: trừ phí, RNG server, trả thưởng thật
walletRouter.post('/wheel/spin', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  // 1. Trừ phí quay qua ledger THẬT (trước đây không trừ đồng nào)
  const charge = await LedgerService.executeTransaction({
    userId,
    type: 'WHEEL_SPIN',
    amount: -WHEEL_SPIN_COST,
    description: `Phí quay Vòng Quay May Mắn (-${WHEEL_SPIN_COST.toLocaleString('vi-VN')}đ)`,
    ipAddress: req.ip
  });
  if (!charge.success) {
    return res.status(400).json({
      success: false,
      error: charge.error || `Số dư không đủ để quay (cần ${WHEEL_SPIN_COST.toLocaleString('vi-VN')}đ).`
    });
  }

  // 2. Chọn giải bằng crypto RNG (không phải Math.random client)
  const prizes = getWheelPrizes();
  const totalProb = prizes.reduce((s, p) => s + p.probability, 0);
  const roll = (crypto.randomInt(0, 1_000_000) / 1_000_000) * totalProb;
  let cumulative = 0;
  let selected = prizes[prizes.length - 1];
  for (const p of prizes) {
    cumulative += p.probability;
    if (roll <= cumulative) { selected = p; break; }
  }

  // 3. Trả thưởng THẬT theo loại (không bịa code)
  let deliveredCode: string | undefined;
  let awardedValue = selected.value;
  let creditTxId = charge.transaction?.id;

  if (selected.type === 'wallet_cash' && selected.value > 0) {
    const credit = await LedgerService.executeTransaction({
      userId,
      type: 'SYSTEM_ADJUSTMENT',
      amount: selected.value,
      description: `Trúng thưởng Vòng Quay: ${selected.name}`,
      actorId: 'LUCKY_WHEEL',
      actorName: 'Lucky Wheel Engine',
      ipAddress: req.ip
    });
    creditTxId = credit.transaction?.id || creditTxId;
  } else if (selected.type === 'voucher') {
    // Phát voucher 1 lần dùng cho chính user
    const code = `WHEEL-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    db.vouchers = db.vouchers || [];
    db.vouchers.push({
      id: `vouch-wheel-${Date.now()}`,
      code,
      discountType: 'percent',
      discountValue: Math.min(100, Math.max(0, selected.value)),
      minOrderValue: 100000,
      usageLimit: 1,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'active',
      singleUserId: userId
    });
    deliveredCode = code;
  } else if ((selected.type === 'key' || selected.type === 'game_diamonds' || selected.type === 'giftup_card') && selected.productId) {
    // Chỉ trả code khi inventory có key THẬT — không bịa 'CYBER-PUNK-8899'
    const item = await InventoryService.reserveItem(selected.productId, userId, `wheel-${Date.now()}`);
    if (item) {
      InventoryService.markDelivered(item.id);
      deliveredCode = item.keyCode;
    } else {
      // Không có key thật -> giáng xuống hoàn phí, không bịa giải thưởng
      awardedValue = WHEEL_SPIN_COST;
      const refund = await LedgerService.executeTransaction({
        userId,
        type: 'SYSTEM_ADJUSTMENT',
        amount: WHEEL_SPIN_COST,
        description: 'Hoàn phí quay: kho phần thưởng tạm hết hàng',
        actorId: 'LUCKY_WHEEL',
        actorName: 'Lucky Wheel Engine',
        ipAddress: req.ip
      });
      creditTxId = refund.transaction?.id || creditTxId;
      selected = { id: 'p-refund', name: 'Hoàn phí quay (kho tạm hết phần thưởng)', type: 'wallet_cash', value: 0, probability: 0 };
    }
  }

  const spinRecord = {
    id: `spin-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    userId,
    userName: req.user!.name || 'Thành viên',
    prizeId: selected.id,
    prizeName: selected.name,
    prizeType: selected.type,
    value: awardedValue,
    deliveredCode,
    ledgerTxId: creditTxId,
    createdAt: new Date().toISOString()
  };
  db.wheelSpins.unshift(spinRecord);
  if (db.wheelSpins.length > 200) db.wheelSpins.length = 200;

  const freshUser = db.users.get(userId);
  res.json({
    success: true,
    spinCost: WHEEL_SPIN_COST,
    prize: {
      id: selected.id,
      name: selected.name,
      type: selected.type,
      value: awardedValue,
      deliveredCode
    },
    ledgerTxId: creditTxId,
    newBalance: freshUser?.walletBalance
  });
});

// ==============================================================================
// CYBERPOOL CRYPTOGATE — cổng nạp crypto multi-network direct-to-wallet
// (TRON / BSC / POLYGON / SOLANA / LTC + Binance ID display)
// ==============================================================================

// GET /api/v1/wallet/crypto-gate/networks — trạng thái các mạng khả dụng
walletRouter.get('/crypto-gate/networks', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    enabled: Boolean(db.systemConfig?.cryptoGateEnabled),
    usdToVndRate: Number(db.systemConfig?.usdToVndRate) || 25400,
    ltcRate: Number(db.systemConfig?.cryptoLtcRate) || 2150000,
    binanceId: String(db.systemConfig?.cryptoGateBinanceId || ''),
    orderTtlMinutes: Number(db.systemConfig?.cryptoGateOrderTtlMinutes) || 30,
    networks: CryptoGateService.getNetworkStatus()
  });
});

// POST /api/v1/wallet/crypto-gate/create-intent — tạo lệnh nạp với số coin duy nhất
walletRouter.post('/crypto-gate/create-intent', requireAuth, (req: AuthenticatedRequest, res) => {
  const { network, amount } = req.body || {};
  const validNetworks = ['TRON', 'BSC', 'POLYGON', 'SOLANA', 'LTC'];
  if (!network || !validNetworks.includes(String(network).toUpperCase())) {
    return res.status(400).json({ success: false, error: `Mạng không hợp lệ. Chọn: ${validNetworks.join(', ')}` });
  }
  const result = CryptoGateService.createDepositIntent({
    userId: req.user!.id,
    network: String(network).toUpperCase() as any,
    amountVnd: Number(amount)
  });
  if (!result.success || !result.intent) {
    return res.status(400).json({ success: false, error: result.error || 'Không tạo được lệnh nạp.' });
  }
  res.json({ success: true, intent: result.intent });
});

// POST /api/v1/wallet/crypto-gate/verify-tx — user dán TxID để verify ngay
walletRouter.post('/crypto-gate/verify-tx', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { txHash, network } = req.body || {};
  const validNetworks = ['TRON', 'BSC', 'POLYGON', 'SOLANA', 'LTC'];
  if (!txHash || !network || !validNetworks.includes(String(network).toUpperCase())) {
    return res.status(400).json({ success: false, error: 'Thiếu txHash hoặc network không hợp lệ.' });
  }
  try {
    const result = await CryptoGateService.verifyTxByHash({
      txHash: String(txHash),
      network: String(network).toUpperCase() as any,
      userId: req.user!.id,
      ipAddress: req.ip
    });
    return res.status(result.success ? 200 : 400).json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Lỗi xác minh giao dịch.' });
  }
});

// GET /api/v1/wallet/crypto-gate/my-intents — lệnh nạp crypto của user
walletRouter.get('/crypto-gate/my-intents', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ success: true, intents: CryptoGateService.listIntents(req.user!.id) });
});
