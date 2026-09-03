import { Router } from 'express';
import { sourceAutomationService } from '../../../services/sourceAutomationService';

export const sourceAutomationRouter = Router();

// GET all configurations and state
sourceAutomationRouter.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      accounts: sourceAutomationService.getSourceAccounts(),
      telegramConfig: sourceAutomationService.getTelegramConfig(),
      telegramQueue: sourceAutomationService.getTelegramQueue(),
      pendingOrders: sourceAutomationService.getPendingOrders()
    }
  });
});

// GET list of accounts
sourceAutomationRouter.get('/accounts', (req, res) => {
  res.json({
    success: true,
    data: sourceAutomationService.getSourceAccounts()
  });
});

// GET list of pending orders
sourceAutomationRouter.get('/orders', (req, res) => {
  res.json({
    success: true,
    data: sourceAutomationService.getPendingOrders()
  });
});

// Update source account (Muakey, etc.)
sourceAutomationRouter.put('/accounts/:id', (req, res) => {
  const updated = sourceAutomationService.updateSourceAccount(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Source account not found' });
  }
  res.json({ success: true, data: updated });
});

// Add new source account
sourceAutomationRouter.post('/accounts', (req, res) => {
  const newAccount = sourceAutomationService.addSourceAccount(req.body);
  res.json({ success: true, data: newAccount });
});

// Delete source account
sourceAutomationRouter.delete('/accounts/:id', (req, res) => {
  const deleted = sourceAutomationService.deleteSourceAccount(req.params.id);
  res.json({ success: deleted });
});

// Update Telegram config
sourceAutomationRouter.put('/telegram', (req, res) => {
  const updated = sourceAutomationService.updateTelegramConfig(req.body);
  res.json({ success: true, data: updated });
});

// Test send Telegram notification
sourceAutomationRouter.post('/test-telegram', async (req, res) => {
  const { message, orderId, chatId } = req.body;
  const testMsg = message || `🚨 [CẢNH BÁO NẠP TIỀN TEST - CYBERPOOL] 🚨\n🛒 Đơn hàng: #${orderId || 'TEST-9921'}\n👤 Khách: Test Customer\n📦 Sản phẩm: ChatGPT Plus 1 Tháng\n💵 Số dư Muakey: 45,000đ (Thiếu: 405,000đ)\n👉 Bấm nạp ngay: https://muakey.com/nap-tien\n✅ Bot hoạt động 100% Zero-Drop!`;
  
  const queueItem = await sourceAutomationService.sendTelegramAlert(testMsg, orderId, chatId);
  res.json({
    success: true,
    message: 'Lệnh gửi Telegram đã được xếp vào hàng đợi Zero-Drop Queue!',
    queueItem
  });
});

// Confirm funds & trigger auto purchase
sourceAutomationRouter.post('/orders/:id/confirm-purchase', (req, res) => {
  const result = sourceAutomationService.confirmFundsAndPurchase(req.params.id);
  res.json(result);
});

// Reconcile source history
sourceAutomationRouter.post('/reconcile', (req, res) => {
  const result = sourceAutomationService.reconcileSourceHistory();
  res.json({ success: true, ...result });
});

// Get dual-stream chat messages
sourceAutomationRouter.get('/dual-chat/:orderId', (req, res) => {
  const messages = sourceAutomationService.getDualChatMessages(req.params.orderId);
  res.json({ success: true, data: messages });
});

// Send or forward dual-stream chat message
sourceAutomationRouter.post('/dual-chat/:orderId', (req, res) => {
  const { stream, sender, senderName, text, isForwarded } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, error: 'Text is required' });
  }

  const msg = sourceAutomationService.sendDualChatMessage(
    req.params.orderId,
    stream || 'CUSTOMER',
    sender || 'ADMIN',
    senderName || 'Admin CyberPool',
    text,
    !!isForwarded
  );

  res.json({ success: true, data: msg });
});
