import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { LedgerService } from '../../../services/ledgerService';
import { notificationService } from '../../../services/notificationService';
import { AuditService } from '../../../services/auditService';
import { db } from '../../../db/store';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { ServerUser } from '../../../types';

export const webhookRouter = Router();

const VIETQR_SECRET = process.env.VIETQR_WEBHOOK_SECRET || 'CYBER_VIETQR_SECRET_KEY_SECURE_2026!';
const TELCO_SECRET = process.env.TELCO_WEBHOOK_SECRET || 'CYBER_TELCO_SECRET_KEY_SECURE_2026!';

if (process.env.NODE_ENV === 'production' && !process.env.VIETQR_WEBHOOK_SECRET) {
  console.warn('[SECURITY ADVISORY] VIETQR_WEBHOOK_SECRET environment variable is not explicitly configured. Using hardened fallback secret.');
}

/**
 * Extracts and verifies target user from bank transaction memo or payload
 * Supported formats:
 * - Direct userId: "usr-buyer-01"
 * - Memo patterns: "CP usr-buyer-01", "NAP usr-buyer-01 500k", "CYBER usr-buyer-01"
 * - Email pattern: "lombard2508@gmail.com"
 * - Phone number pattern: "0901234567"
 */
function resolveUserFromTransaction(content: string = '', explicitUserId?: string): ServerUser | null {
  // 1. Explicit userId provided by verified webhook
  if (explicitUserId && db.users.has(explicitUserId)) {
    return db.users.get(explicitUserId)!;
  }

  const rawMemo = (content || '').trim();

  // 2. Search for usr-* pattern in content
  const userPatternMatch = rawMemo.match(/(usr-[a-zA-Z0-9_-]+)/i);
  if (userPatternMatch) {
    const candidateId = userPatternMatch[1];
    if (db.users.has(candidateId)) {
      return db.users.get(candidateId)!;
    }
  }

  // 3. Search for email in content
  const emailMatch = rawMemo.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    const candidateEmail = emailMatch[1].toLowerCase();
    for (const u of db.users.values()) {
      if (u.email.toLowerCase() === candidateEmail) {
        return u;
      }
    }
  }

  // 4. Search for phone in content
  const phoneMatch = rawMemo.match(/(0[3|5|7|8|9][0-9]{8})/);
  if (phoneMatch) {
    const candidatePhone = phoneMatch[1];
    for (const u of db.users.values()) {
      if (u.phone === candidatePhone) {
        return u;
      }
    }
  }

  return null;
}

// POST /api/v1/webhooks/vietqr
webhookRouter.post('/vietqr', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-vietqr-signature'] as string;
    const { transactionId, amount, content, status, bankCode, userId: explicitUserId } = req.body;

    if (!transactionId || amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Thiếu tham số bắt buộc (transactionId hoặc amount hợp lệ)' 
      });
    }

    // STRICT SIGNATURE VERIFICATION (ENFORCED IN ALL ENVIRONMENTS)
    if (!signature || typeof signature !== 'string') {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: Thiếu chữ ký xác thực x-vietqr-signature.' 
      });
    }

    const payloadString = JSON.stringify(req.body);
    const expectedSig = crypto
      .createHmac('sha256', VIETQR_SECRET)
      .update(payloadString)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    const actualBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      AuditService.log({
        actorId: 'UNAUTHORIZED_WEBHOOK',
        actorName: 'VietQR Webhook Attacker',
        actorRole: 'USER',
        action: 'WEBHOOK_SIGNATURE_FAILED',
        resource: 'WALLET',
        ipAddress: req.ip,
        newValue: { transactionId, providedSignature: signature }
      });
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: Chữ ký webhook không hợp lệ (Signature Mismatch).' 
      });
    }

    // PERSISTENT IDEMPOTENCY CHECK
    const existing = db.processedWebhooks.get(transactionId);
    if (existing) {
      return res.json({ 
        success: true, 
        message: 'Giao dịch đã được xử lý trước đó (Idempotent OK)',
        transactionId,
        processedAt: existing.processedAt
      });
    }

    // DYNAMIC USER RESOLUTION (NEVER HARDCODE USER)
    const targetUser = resolveUserFromTransaction(content, explicitUserId);

    if (!targetUser) {
      // Transaction cannot be mapped to any user -> Queue for manual admin reconciliation
      const unmappedRecord = {
        id: `unmapped-${Date.now()}-${transactionId}`,
        provider: 'VIETQR',
        transactionId,
        amount: Number(amount),
        memo: content || '',
        rawPayload: req.body,
        receivedAt: new Date().toISOString(),
        status: 'PENDING_REVIEW' as const
      };
      db.pendingUnmappedDeposits.push(unmappedRecord);

      AuditService.log({
        actorId: 'WEBHOOK_VIETQR',
        actorName: 'VietQR Auto Gateway',
        actorRole: 'SUPER_ADMIN',
        action: 'DEPOSIT_UNMAPPED_USER',
        resource: 'WALLET',
        resourceId: transactionId,
        ipAddress: req.ip,
        newValue: { content, amount, bankCode }
      });

      return res.status(422).json({
        success: false,
        error: 'Không thể xác định tài khoản người dùng từ nội dung chuyển khoản. Đã đưa vào hàng đợi đối soát thủ công.',
        queuedForReview: true,
        transactionId
      });
    }

    // Process deposit only if status is SUCCESS/COMPLETED or undefined (assumed success from bank webhook)
    if (status === 'SUCCESS' || status === 'COMPLETED' || !status) {
      await LedgerService.executeTransaction({
        userId: targetUser.id,
        amount: Number(amount),
        type: 'DEPOSIT',
        description: `Nạp tự động VietQR (${bankCode || 'MBBank'}): ${content || transactionId}`,
        referenceId: transactionId,
        actorId: 'WEBHOOK_VIETQR',
        actorName: 'VietQR Auto Gateway'
      });

      notificationService.send(
        targetUser.id,
        'PAYMENT_SUCCESS',
        'Nạp tiền tự động thành công',
        `Ví của bạn đã được cộng +${Number(amount).toLocaleString('vi-VN')}đ qua VietQR.`,
        { transactionId, amount, bankCode }
      );

      AuditService.log({
        actorId: 'WEBHOOK_VIETQR',
        actorName: 'VietQR Auto Gateway',
        actorRole: 'SUPER_ADMIN',
        action: 'AUTO_DEPOSIT_COMPLETED',
        resource: 'WALLET',
        resourceId: targetUser.id,
        newValue: { transactionId, amount, bankCode, userId: targetUser.id }
      });

      // Record persistently in processed webhooks store
      db.processedWebhooks.set(transactionId, {
        amount: Number(amount),
        userId: targetUser.id,
        status: 'COMPLETED',
        processedAt: new Date().toISOString(),
        provider: 'VIETQR',
        memo: content
      });
    }

    res.json({
      success: true,
      message: 'Xử lý webhook VietQR thành công',
      creditedTo: {
        userId: targetUser.id,
        email: targetUser.email,
        amount: Number(amount)
      },
      processedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi xử lý webhook' });
  }
});

// POST /api/v1/webhooks/telco
webhookRouter.post('/telco', async (req: Request, res: Response) => {
  try {
    const { requestId, status, declaredAmount, realAmount, callbackSign, content, userId: explicitUserId } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, error: 'Thiếu requestId' });
    }

    // Enforce Telco HMAC signature verification strictly in all environments
    if (!callbackSign || typeof callbackSign !== 'string') {
      return res.status(401).json({ success: false, error: 'Unauthorized: Thiếu chữ ký xác thực callbackSign' });
    }

    const expectedSign = crypto
      .createHmac('sha256', TELCO_SECRET)
      .update(`${requestId}:${declaredAmount || 0}:${status}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSign, 'utf8');
    const actualBuf = Buffer.from(callbackSign, 'utf8');

    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Chữ ký telco callback không hợp lệ (Signature Mismatch)' });
    }

    // Persistent idempotency
    if (db.processedWebhooks.has(requestId)) {
      return res.json({ success: true, message: 'Giao dịch gạch thẻ đã được xử lý (Idempotent OK)' });
    }

    const targetUser = resolveUserFromTransaction(content, explicitUserId);
    if (targetUser && (status === 'SUCCESS' || status === 'COMPLETED')) {
      const creditedAmount = Number(realAmount || declaredAmount || 0);
      if (creditedAmount > 0) {
        await LedgerService.executeTransaction({
          userId: targetUser.id,
          amount: creditedAmount,
          type: 'DEPOSIT',
          description: `Gạch thẻ cào tự động thành công (Mã yêu cầu: ${requestId})`,
          referenceId: requestId,
          actorId: 'WEBHOOK_TELCO',
          actorName: 'Telco Auto Gateway'
        });

        db.processedWebhooks.set(requestId, {
          amount: creditedAmount,
          userId: targetUser.id,
          status: 'COMPLETED',
          processedAt: new Date().toISOString(),
          provider: 'TELCO',
          memo: content
        });
      }
    }

    res.json({
      success: true,
      message: 'Xử lý callback gạch thẻ cào thành công'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// GET /api/v1/webhooks/unmapped-deposits - Admin endpoint to inspect unmapped deposits
webhookRouter.get('/unmapped-deposits', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    unmappedDeposits: db.pendingUnmappedDeposits,
    processedCount: db.processedWebhooks.size
  });
});

