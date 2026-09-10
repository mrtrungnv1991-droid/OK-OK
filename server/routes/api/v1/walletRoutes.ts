import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../../../db/store';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { LedgerService } from '../../../services/ledgerService';
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

// POST /api/v1/wallet/deposit - Create Deposit (VietQR, MoMo, Crypto)
walletRouter.post('/deposit', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { amount, methodTitle, idempotencyKey } = req.body;
  const depositAmount = Number(amount);

  if (isNaN(depositAmount) || depositAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid deposit amount' });
  }

  const result = await LedgerService.executeTransaction({
    userId: req.user!.id,
    type: 'DEPOSIT',
    amount: depositAmount,
    description: `Nạp tiền qua ${methodTitle || 'Cổng Thanh Toán Tự Động'}`,
    idempotencyKey,
    ipAddress: req.ip
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({
    success: true,
    newBalance: req.user!.walletBalance,
    transaction: result.transaction
  });
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

// POST /api/v1/wallet/verify-crypto-usdt - Verify USDT TRC20 / BEP20 On-Chain Blockchain API
walletRouter.post('/verify-crypto-usdt', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { txHash, network = 'TRC20', expectedUsdt, memo } = req.body;
    const result = await GatewayVerificationService.verifyCryptoUsdt({
      userId: req.user!.id,
      txHash,
      network,
      expectedUsdt,
      memo,
      ipAddress: req.ip
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Lỗi hệ thống xác minh USDT' });
  }
});

// POST /api/v1/wallet/verify-ltc - Verify Litecoin (LTC Mainnet Core) Blockchain API
walletRouter.post('/verify-ltc', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { txHash, expectedLtc, memo } = req.body;
    const result = await GatewayVerificationService.verifyCryptoLtc({
      userId: req.user!.id,
      txHash,
      expectedLtc,
      memo,
      ipAddress: req.ip
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Lỗi hệ thống xác minh Litecoin' });
  }
});

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

  // Card24h API credentials
  const partnerId = db.systemConfig?.telcoPartnerId || process.env.CARD24H_PARTNER_ID || '16654919157';
  const partnerKey = db.systemConfig?.telcoPartnerKey || process.env.CARD24H_PARTNER_KEY || 'bc3299820230bb1ed2b2b729cac744e3';
  const provider = db.systemConfig?.telcoProvider || 'card24h';

  // Normalize telco for Card24h
  let normalizedTelco = String(telco).toUpperCase().trim();
  if (normalizedTelco === 'VIETNAMOBILE') normalizedTelco = 'VNMOBI';

  const cleanPin = String(pin).trim();
  const cleanSerial = String(serial).trim();
  const requestId = `CP_${req.user!.id.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
  const sign = crypto.createHash('md5').update(`${partnerKey}${cleanPin}${cleanSerial}`).digest('hex');

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

  // Fallback / mock mode if not configured
  const receivedAmount = Math.round(numAmount * 0.82);
  const result = await LedgerService.executeTransaction({
    userId: req.user!.id,
    type: 'DEPOSIT',
    amount: receivedAmount,
    description: `Đổi thẻ cào ${telco} ${numAmount.toLocaleString()}đ (Thực nhận +${receivedAmount.toLocaleString()}đ)`,
    referenceId: `TELCO-${serial}`,
    ipAddress: req.ip
  });

  res.json({
    success: true,
    receivedAmount,
    newBalance: req.user!.walletBalance,
    transaction: result.transaction
  });
});

// POST /api/v1/wallet/withdraw - Request CTV/Affiliate Withdrawal
walletRouter.post('/withdraw', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { amount, bankName, accountNumber, accountName } = req.body;
  const numAmount = Number(amount);

  if (isNaN(numAmount) || numAmount < 50000) {
    return res.status(400).json({ success: false, error: 'Hạn mức rút tối thiểu là 50.000đ' });
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

  res.json({
    success: true,
    message: 'Yêu cầu rút tiền đã được ghi nhận và đang chờ duyệt giải ngân',
    transaction: result.transaction
  });
});

// POST /api/v1/wallet/admin/adjust - SuperAdmin Balance Adjustment
walletRouter.post('/admin/adjust', requireAuth, requireRole('SUPER_ADMIN'), async (req: AuthenticatedRequest, res) => {
  const { targetUserId, amount, reason } = req.body;

  const result = await LedgerService.executeTransaction({
    userId: targetUserId,
    type: 'SYSTEM_ADJUSTMENT',
    amount: Number(amount),
    description: `Admin điều chỉnh số dư: ${reason || 'Nâng cấp tài khoản'}`,
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    ipAddress: req.ip
  });

  res.json(result);
});
