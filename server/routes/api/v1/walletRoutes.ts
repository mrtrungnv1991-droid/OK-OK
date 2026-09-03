import { Router } from 'express';
import { db } from '../../../db/store';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { LedgerService } from '../../../services/ledgerService';

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

// POST /api/v1/wallet/telco-card - Instant Telco Scratch Card (Thẻ Cào)
walletRouter.post('/telco-card', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { telco, declaredAmount, pin, serial } = req.body;
  const numAmount = Number(declaredAmount);

  if (!telco || !pin || !serial || isNaN(numAmount)) {
    return res.status(400).json({ success: false, error: 'Thông tin thẻ không hợp lệ' });
  }

  // Calculate received amount after telco discount fee (~15-20%)
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
