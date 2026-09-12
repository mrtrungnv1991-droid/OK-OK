import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { LedgerService } from '../../../services/ledgerService';
import { notificationService } from '../../../services/notificationService';
import { AuditService } from '../../../services/auditService';
import { db } from '../../../db/store';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { ServerUser } from '../../../types';
import { IdempotencyService } from '../../../services/idempotencyService';

export const webhookRouter = Router();

// Secure runtime fallback in dev/test only - NEVER use hardcoded static committed credentials in production
const devFallbackSecret = crypto.randomBytes(32).toString('hex');
export const getVietQrSecret = (): string => {
  if (process.env.VIETQR_WEBHOOK_SECRET) return process.env.VIETQR_WEBHOOK_SECRET;
  if (process.env.NODE_ENV === 'test') return 'TEST_VIETQR_KEY_SECRET_32B_MIN_VAL';
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: VIETQR_WEBHOOK_SECRET is not configured in production environment.');
  }
  return devFallbackSecret;
};

export const getTelcoSecret = (): string => {
  if (process.env.TELCO_WEBHOOK_SECRET) return process.env.TELCO_WEBHOOK_SECRET;
  if (process.env.NODE_ENV === 'test') return 'TEST_TELCO_KEY_SECRET_32B_MIN_VAL';
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: TELCO_WEBHOOK_SECRET is not configured in production environment.');
  }
  return devFallbackSecret;
};

/**
 * Extracts and verifies target user exclusively from bank transaction memo/description
 * Supported formats:
 * - Memo patterns: "CP usr-buyer-01", "NAP usr-buyer-01 500k", "CYBER usr-buyer-01"
 * - Direct user identifier: "usr-buyer-01"
 * - Email pattern: "user@example.com"
 * - Phone number pattern: "0901234567"
 * 
 * NOTE: Disallows direct body injection of userId to prevent spoofing attack vectors.
 */
function resolveUserFromTransaction(content: string = ''): ServerUser | null {
  const rawMemo = (content || '').trim();
  if (!rawMemo) return null;

  // 1. Search for usr-* pattern in content (case-insensitive on BOTH sides:
    // banks often normalize memo to uppercase, and our keys are lowercase)
    const userPatternMatch = rawMemo.match(/(usr-[a-zA-Z0-9_-]+)/i);
    if (userPatternMatch) {
      const candidateId = userPatternMatch[1].toLowerCase();
      if (db.users.has(candidateId)) {
        return db.users.get(candidateId)!;
      }
    }

  // 2. Search for email in content
  const emailMatch = rawMemo.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    const candidateEmail = emailMatch[1].toLowerCase();
    for (const u of db.users.values()) {
      if (u.email.toLowerCase() === candidateEmail) {
        return u;
      }
    }
  }

  // 3. Search for phone in content
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
    const { transactionId, amount, content, status, bankCode } = req.body;

    if (!transactionId || amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Thiếu tham số bắt buộc (transactionId hoặc amount hợp lệ)' 
      });
    }

    // STRICT STATUS CHECK: Must explicitly be SUCCESS, COMPLETED, or PAID. Never accept undefined or pending.
    const normalizedStatus = String(status || '').trim().toUpperCase();
    if (normalizedStatus !== 'SUCCESS' && normalizedStatus !== 'COMPLETED' && normalizedStatus !== 'PAID') {
      return res.status(400).json({
        success: false,
        error: `Trạng thái giao dịch không hợp lệ (${status || 'UNDEFINED'}). Chỉ xử lý khi status là SUCCESS hoặc COMPLETED.`
      });
    }

    // STRICT SIGNATURE VERIFICATION (ENFORCED IN ALL ENVIRONMENTS)
    if (!signature || typeof signature !== 'string') {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: Thiếu chữ ký xác thực x-vietqr-signature.' 
      });
    }

    let secretKey = '';
    try {
      secretKey = getVietQrSecret();
    } catch (err: any) {
      console.error('[VIETQR_CONFIG_ERROR]', err?.message);
      return res.status(503).json({
        success: false,
        error: 'Cổng webhook VietQR chưa được cấu hình biến môi trường an toàn trên máy chủ.'
      });
    }

    const payloadString = JSON.stringify(req.body);
    const expectedSig = crypto
      .createHmac('sha256', secretKey)
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
    if (IdempotencyService.isProcessed(transactionId) || (content && IdempotencyService.isProcessed(content))) {
      return res.json({ 
        success: true, 
        message: 'Giao dịch đã được xử lý trước đó (Idempotent OK)',
        transactionId
      });
    }

    // Acquire atomic lock on transaction ID to prevent concurrent duplicate execution
    const lockAcquired = await IdempotencyService.acquireLock(transactionId);
    if (!lockAcquired) {
      return res.status(429).json({
        success: false,
        error: 'Giao dịch đang được xử lý đồng thời bởi một tiến trình khác.'
      });
    }

    try {
      if (IdempotencyService.isProcessed(transactionId)) {
        return res.json({
          success: true,
          message: 'Giao dịch đã được xử lý trước đó (Idempotent OK)',
          transactionId
        });
      }

      // DYNAMIC USER RESOLUTION (EXCLUSIVELY FROM VERIFIED MEMO CONTENT)
      const targetUser = resolveUserFromTransaction(content);

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

      // Commit persistent idempotency
      IdempotencyService.commit({
        primaryKey: transactionId,
        aliasKeys: content ? [content] : [],
        provider: 'VIETQR',
        referenceId: transactionId,
        memo: content,
        amount: Number(amount),
        userId: targetUser.id
      });

      db.processedWebhooks.set(transactionId, {
        amount: Number(amount),
        userId: targetUser.id,
        status: 'COMPLETED',
        processedAt: new Date().toISOString(),
        provider: 'VIETQR',
        memo: content
      });

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
    } finally {
      IdempotencyService.releaseLock(transactionId);
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi xử lý webhook' });
  }
});

// POST /api/v1/webhooks/telco
webhookRouter.post('/telco', async (req: Request, res: Response) => {
  try {
    const { requestId, status, declaredAmount, realAmount, callbackSign, content } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, error: 'Thiếu requestId' });
    }

    const normalizedStatus = String(status || '').trim().toUpperCase();
    if (normalizedStatus !== 'SUCCESS' && normalizedStatus !== 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Chỉ chấp nhận status là SUCCESS hoặc COMPLETED' });
    }

    // Enforce Telco HMAC signature verification strictly in all environments
    if (!callbackSign || typeof callbackSign !== 'string') {
      return res.status(401).json({ success: false, error: 'Unauthorized: Thiếu chữ ký xác thực callbackSign' });
    }

    let secretKey = '';
    try {
      secretKey = getTelcoSecret();
    } catch (err: any) {
      return res.status(503).json({ success: false, error: 'Cổng gạch thẻ chưa cấu hình bí mật webhook trong môi trường.' });
    }

    const expectedSign = crypto
      .createHmac('sha256', secretKey)
      .update(`${requestId}:${declaredAmount || 0}:${status}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSign, 'utf8');
    const actualBuf = Buffer.from(callbackSign, 'utf8');

    if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Chữ ký telco callback không hợp lệ (Signature Mismatch)' });
    }

    // Persistent idempotency
    if (IdempotencyService.isProcessed(requestId)) {
      return res.json({ success: true, message: 'Giao dịch gạch thẻ đã được xử lý (Idempotent OK)' });
    }

    const lockAcquired = await IdempotencyService.acquireLock(requestId);
    if (!lockAcquired) {
      return res.status(429).json({ success: false, error: 'Giao dịch đang được xử lý.' });
    }

    try {
      if (IdempotencyService.isProcessed(requestId)) {
        return res.json({ success: true, message: 'Giao dịch gạch thẻ đã được xử lý (Idempotent OK)' });
      }

      const targetUser = resolveUserFromTransaction(content);
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

          IdempotencyService.commit({
            primaryKey: requestId,
            provider: 'TELCO',
            referenceId: requestId,
            memo: content,
            amount: creditedAmount,
            userId: targetUser.id
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
    } finally {
      IdempotencyService.releaseLock(requestId);
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// ==============================================================================
// CARD24H.COM AUTO-CHARGING WEBHOOK CALLBACK
// GET /api/v1/webhooks/card24h & POST /api/v1/webhooks/card24h
// Parameters from Card24h:
// request_id, status, message, declared_value, value, amount, code, serial, telco, trans_id, callback_sign
// Sign check: callback_sign == md5(partner_key + code + serial)
// ==============================================================================
export async function handleCard24hCallback(req: Request, res: Response) {
  try {
    const params = { ...req.query, ...req.body };
    const {
      status,
      message,
      request_id,
      declared_value,
      value,
      amount,
      code,
      serial,
      telco,
      trans_id,
      callback_sign
    } = params;

    console.log('[CARD24H_WEBHOOK_RECEIVED]', {
      request_id,
      status,
      amount,
      declared_value,
      telco,
      trans_id
    });

    if (!request_id || !callback_sign) {
      return res.status(400).send('missing_parameters');
    }

    const partnerKey = db.systemConfig?.telcoPartnerKey || process.env.CARD24H_PARTNER_KEY;
    if (!partnerKey) {
      console.error('[CARD24H_CONFIG_ERROR] Missing CARD24H_PARTNER_KEY');
      return res.status(503).send('partner_key_not_configured');
    }

    const cleanCode = String(code || '');
    const cleanSerial = String(serial || '');
    const expectedSign = crypto.createHash('md5').update(`${partnerKey}${cleanCode}${cleanSerial}`).digest('hex');

    if (String(callback_sign).toLowerCase() !== expectedSign.toLowerCase()) {
      console.warn('[CARD24H_CALLBACK_SIGN_MISMATCH]', {
        expected: expectedSign,
        actual: callback_sign
      });
      return res.status(401).send('callback_sign_error');
    }

    const strRequestId = String(request_id);

    // Persistent Idempotency check
    if (IdempotencyService.isProcessed(strRequestId) || db.processedWebhooks.has(strRequestId)) {
      return res.send('Thẻ hợp lệ');
    }

    // Resolve user
    const cardSubmission = db.telcoCards.get(strRequestId);
    let targetUserId = cardSubmission?.userId;

    if (!targetUserId) {
      const match = strRequestId.match(/^CP_([a-zA-Z0-9_-]+)_\d+$/);
      if (match && db.users.has(match[1])) {
        targetUserId = match[1];
      }
    }

    const statusCode = Number(status);
    const creditedAmount = Number(amount || 0);

    if (statusCode === 1) {
      // 1. Thẻ hợp lệ
      if (targetUserId && creditedAmount > 0) {
        await LedgerService.executeTransaction({
          userId: targetUserId,
          amount: creditedAmount,
          type: 'DEPOSIT',
          description: `Gạch thẻ ${telco || 'Card24h'} thành công (Mã: ${strRequestId} - Thực nhận +${creditedAmount.toLocaleString()}đ)`,
          referenceId: strRequestId,
          actorId: 'CARD24H_WEBHOOK',
          actorName: 'Card24h.com Auto Charging'
        });

        notificationService.send(
          targetUserId,
          'TOPUP_COMPLETED',
          '⚡ Gạch thẻ cào thành công!',
          `Thẻ ${telco} mệnh giá ${(Number(declared_value) || 0).toLocaleString()}đ đã duyệt thành công. Bạn nhận được +${creditedAmount.toLocaleString()}đ vào ví!`,
          { requestId: strRequestId, transId: trans_id, amount: creditedAmount }
        );
      }

      if (cardSubmission) {
        cardSubmission.status = 'SUCCESS';
        cardSubmission.receivedAmount = creditedAmount;
        cardSubmission.card24hTransId = trans_id;
        cardSubmission.message = 'Thẻ hợp lệ - Đã cộng tiền vào ví';
      }

      db.processedWebhooks.set(strRequestId, {
        amount: creditedAmount,
        userId: targetUserId || 'unknown',
        status: 'COMPLETED',
        processedAt: new Date().toISOString(),
        provider: 'CARD24H',
        memo: `Mã nạp: ${cleanCode}, Seri: ${cleanSerial}, TransId: ${trans_id}`
      });

      return res.send('Thẻ hợp lệ');
    } else if (statusCode === 2) {
      // 2. Thẻ sai mệnh giá
      if (targetUserId && creditedAmount > 0) {
        await LedgerService.executeTransaction({
          userId: targetUserId,
          amount: creditedAmount,
          type: 'DEPOSIT',
          description: `Gạch thẻ ${telco} sai mệnh giá qua Card24h (Mệnh giá thực: ${(Number(value) || 0).toLocaleString()}đ - Thực nhận +${creditedAmount.toLocaleString()}đ)`,
          referenceId: strRequestId,
          actorId: 'CARD24H_WEBHOOK',
          actorName: 'Card24h.com Auto Charging'
        });

        notificationService.send(
          targetUserId,
          'SYSTEM_ANNOUNCEMENT',
          '⚠️ Thẻ cào sai mệnh giá',
          `Thẻ ${telco} khai báo ${(Number(declared_value) || 0).toLocaleString()}đ nhưng mệnh giá thực là ${(Number(value) || 0).toLocaleString()}đ. Số tiền thực nhận: +${creditedAmount.toLocaleString()}đ`,
          { requestId: strRequestId, transId: trans_id }
        );
      }

      if (cardSubmission) {
        cardSubmission.status = 'WRONG_AMOUNT';
        cardSubmission.receivedAmount = creditedAmount;
        cardSubmission.message = `Thẻ sai mệnh giá (Thực: ${value}đ)`;
      }

      return res.send('Thẻ sai mệnh giá');
    } else {
      // 3. Thẻ lỗi
      if (cardSubmission) {
        cardSubmission.status = 'FAILED';
        cardSubmission.message = String(message || 'Thẻ lỗi / Không hợp lệ');
      }

      if (targetUserId) {
        notificationService.send(
          targetUserId,
          'SECURITY_ALERT',
          '❌ Gạch thẻ cào thất bại',
          `Thẻ ${telco} (Seri: ${cleanSerial}) không hợp lệ: ${message || 'Thẻ đã sử dụng hoặc mã nạp sai'}`,
          { requestId: strRequestId }
        );
      }

      return res.send('Thẻ lỗi');
    }
  } catch (err: any) {
    console.error('[CARD24H_CALLBACK_ERROR]', err);
    res.status(500).send(`error: ${err?.message}`);
  }
}

webhookRouter.get('/card24h', handleCard24hCallback);
webhookRouter.post('/card24h', handleCard24hCallback);

// GET /api/v1/webhooks/unmapped-deposits - Admin endpoint to inspect unmapped deposits
webhookRouter.get('/unmapped-deposits', requireAuth, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    unmappedDeposits: db.pendingUnmappedDeposits,
    processedCount: db.processedWebhooks.size
  });
});

// POST /api/v1/webhooks/unmapped-deposits/:id/resolve - Admin manually maps an
// unmapped deposit to a user and credits the wallet (with idempotency guard).
// CYBERPOOL FIX: previously there was NO way to process pendingUnmappedDeposits —
// real deposits that could not be matched to a user were stuck forever.
webhookRouter.post('/unmapped-deposits/:id/resolve', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  const recordIdx = db.pendingUnmappedDeposits.findIndex(r => r.id === req.params.id);
  if (recordIdx === -1) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy giao dịch chưa đối soát với id này.' });
  }

  const record = db.pendingUnmappedDeposits[recordIdx];
  if (record.status !== 'PENDING_REVIEW') {
    return res.status(400).json({ success: false, error: 'Giao dịch này đã được xử lý trước đó (RESOLVED/REJECTED).' });
  }

  const { userId, action } = req.body || {};
  if (action === 'REJECT') {
    record.status = 'REJECTED';
    db.pendingUnmappedDeposits[recordIdx] = record;
    return res.json({ success: true, message: 'Đã từ chối giao dịch chưa đối soát.', record });
  }

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, error: 'Thiếu userId để đối soát thủ công.' });
  }
  const targetUser = db.users.get(userId);
  if (!targetUser) {
    return res.status(400).json({ success: false, error: `Người dùng ${userId} không tồn tại.` });
  }

  // Idempotency guard: never credit the same bank transaction twice.
  if (IdempotencyService.isProcessed(record.transactionId)) {
    record.status = 'RESOLVED';
    db.pendingUnmappedDeposits[recordIdx] = record;
    return res.json({ success: false, error: 'Giao dịch này đã được cộng tiền trước đó.', idempotent: true });
  }

  const lockAcquired = await IdempotencyService.acquireLock(record.transactionId);
  if (!lockAcquired) {
    return res.status(429).json({ success: false, error: 'Giao dịch đang được xử lý đồng thời.' });
  }

  try {
    await LedgerService.executeTransaction({
      userId: targetUser.id,
      amount: Number(record.amount),
      type: 'DEPOSIT',
      description: `Đối soát thủ công admin: ${record.memo || record.transactionId}`,
      referenceId: record.transactionId,
      actorId: req.user?.id || 'ADMIN',
      actorName: req.user?.name || 'Admin Support'
    });

    record.status = 'RESOLVED';
    db.pendingUnmappedDeposits[recordIdx] = record;
    db.processedWebhooks.set(record.transactionId, {
      amount: Number(record.amount),
      userId: targetUser.id,
      status: 'COMPLETED',
      processedAt: new Date().toISOString(),
      provider: record.provider
    });

    IdempotencyService.commit({
      primaryKey: record.transactionId,
      provider: record.provider || 'MANUAL',
      referenceId: record.transactionId,
      memo: record.memo,
      amount: Number(record.amount),
      userId: targetUser.id
    });

    return res.json({
      success: true,
      message: `Đã cộng ${Number(record.amount).toLocaleString('vi-VN')}đ vào ví ${targetUser.name} (${targetUser.id}).`,
      record
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: `Lỗi khi cộng tiền: ${err?.message}` });
  }
});

