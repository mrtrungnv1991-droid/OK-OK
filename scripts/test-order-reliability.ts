// ==============================================================================
// CYBERPOOL: AUTOMATED RELIABILITY & ORDER PROCESSING TEST SUITE
// ==============================================================================

import { orderProcessingService } from '../server/services/orderProcessing/orderProcessingService';
import { orderLock } from '../server/services/orderProcessing/distributedLock';
import { sourceCircuitBreaker } from '../server/services/orderProcessing/circuitBreaker';
import { keyVault } from '../server/services/orderProcessing/keyVaultService';
import { OrderStateMachine } from '../server/services/orderProcessing/stateMachine';
import { SensitiveDataFilter } from '../server/services/orderProcessing/sensitiveDataFilter';
import { notificationQueue } from '../server/services/orderProcessing/notificationQueueService';
import { reconciliationWorker } from '../server/services/orderProcessing/reconciliationWorker';

async function runAllTests() {
  console.log('🧪 ================================================================');
  console.log('🧪 CYBERPOOL: RUNNING COMPREHENSIVE ORDER RELIABILITY TEST SUITE');
  console.log('🧪 ================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, extra?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extra || ''}`);
      failed++;
    }
  }

  // 1. STATE MACHINE TESTS
  console.log('--- PHẦN 1: STATE MACHINE RULES & CONSTRAINTS ---');
  assert(
    OrderStateMachine.canTransition('PENDING_PAYMENT', 'PAYMENT_CONFIRMED'),
    'State Machine: Cho phép PENDING_PAYMENT -> PAYMENT_CONFIRMED'
  );
  assert(
    OrderStateMachine.canTransition('PURCHASE_PENDING', 'PURCHASE_UNKNOWN'),
    'State Machine: Cho phép PURCHASE_PENDING -> PURCHASE_UNKNOWN (Timeout/Network drop)'
  );
  assert(
    !OrderStateMachine.canTransition('PENDING_PAYMENT', 'COMPLETED'),
    'State Machine: Chặn nhảy cóc PENDING_PAYMENT -> COMPLETED'
  );

  // Test Rule 1: CANNOT set COMPLETED without KEY_SECURED
  const mockOrder: any = {
    id: 'CP-TEST-01',
    status: 'PURCHASE_PENDING'
  };
  const rule1Check = OrderStateMachine.validateTransition(mockOrder, 'COMPLETED', { hasSecuredKey: false });
  assert(!rule1Check.valid, 'Rule 1: Chặn đánh dấu COMPLETED khi chưa có KEY_SECURED');

  // Test Rule 2: CANNOT retry BUY from PURCHASE_UNKNOWN without reconciliation
  mockOrder.status = 'PURCHASE_UNKNOWN';
  const rule2Check = OrderStateMachine.validateTransition(mockOrder, 'PURCHASE_PENDING', { hasReconciled: false });
  assert(!rule2Check.valid, 'Rule 2: Chặn mua lại ngay từ PURCHASE_UNKNOWN khi chưa đối soát');

  // 2. DISTRIBUTED LOCK TESTS
  console.log('\n--- PHẦN 2: DISTRIBUTED LOCK (RACE CONDITION PREVENTION) ---');
  const lockA = orderLock.acquireLock('CP-TEST-LOCK', 'worker-A', 10);
  assert(lockA.acquired, 'Worker A: Chiếm lock độc quyền thành công');

  const lockB = orderLock.acquireLock('CP-TEST-LOCK', 'worker-B', 10);
  assert(!lockB.acquired, 'Worker B: Bị từ chối khi Worker A đang giữ lock (Anti-duplicate buy)');

  // Re-entrant extension by same worker
  const lockAExtend = orderLock.acquireLock('CP-TEST-LOCK', 'worker-A', 20);
  assert(lockAExtend.acquired, 'Worker A: Cho phép gia hạn lock (Re-entrant)');

  // Release
  const releaseA = orderLock.releaseLock('CP-TEST-LOCK', 'worker-A');
  assert(releaseA, 'Worker A: Giải phóng lock thành công');

  const lockBAfter = orderLock.acquireLock('CP-TEST-LOCK', 'worker-B', 10);
  assert(lockBAfter.acquired, 'Worker B: Chiếm lock thành công sau khi Worker A nhả');
  orderLock.releaseLock('CP-TEST-LOCK', 'worker-B');

  // 3. CIRCUIT BREAKER TESTS
  console.log('\n--- PHẦN 3: SOURCE CIRCUIT BREAKER ---');
  sourceCircuitBreaker.initProvider('TestProvider.com', 3, 2000);
  assert(sourceCircuitBreaker.canExecute('TestProvider.com').allowed, 'Circuit Breaker ban đầu là CLOSED (Bình thường)');

  sourceCircuitBreaker.recordFailure('TestProvider.com');
  sourceCircuitBreaker.recordFailure('TestProvider.com');
  const fail3 = sourceCircuitBreaker.recordFailure('TestProvider.com');
  assert(fail3.tripped && fail3.newState === 'OPEN', 'Circuit Breaker ngắt mạch (OPEN) sau 3 lỗi liên tiếp');

  assert(!sourceCircuitBreaker.canExecute('TestProvider.com').allowed, 'Chặn các request tiếp theo khi mạch đang OPEN');

  sourceCircuitBreaker.reset('TestProvider.com');
  assert(sourceCircuitBreaker.canExecute('TestProvider.com').allowed, 'Reset mạch về CLOSED thành công');

  // 4. KEY VAULT ENCRYPTION & INTEGRITY TESTS
  console.log('\n--- PHẦN 4: KEY VAULT (AES-256 & HMAC INTEGRITY) ---');
  const rawLicenseKey = 'WINDOWS-PRO-KEY-9999-ABCD-1234';
  const savedVault = keyVault.saveKeyToVault({
    order_id: 'CP-VAULT-TEST',
    customer_id: 'cust-101',
    provider: 'DivineShop.vn',
    source_transaction_id: 'DVN-TX-1001',
    product_id: 'prod-win-pro',
    raw_key_payload: rawLicenseKey
  });

  assert(savedVault.encrypted_key.includes(':'), 'Khóa được mã hóa AES-256 với IV tách biệt');
  assert(savedVault.encrypted_key !== rawLicenseKey, 'Không lưu plaintext key');
  assert(savedVault.status === 'SECURED', 'Trạng thái ban đầu là SECURED');

  const decryptedKey = keyVault.decryptKey(savedVault.encrypted_key, 'admin-tester', 'CP-VAULT-TEST', savedVault.id);
  assert(decryptedKey === rawLicenseKey, 'Giải mã chuẩn xác nội dung khóa gốc');

  const isTamperProof = keyVault.verifyIntegrity('CP-VAULT-TEST', decryptedKey);
  assert(isTamperProof, 'Xác thực tính toàn vẹn HMAC SHA-256 thành công');

  // 5. SENSITIVE DATA DETECTION & REDACTION TESTS
  console.log('\n--- PHẦN 5: SENSITIVE DATA FILTER (FORWARD 1-CLICK) ---');
  const sampleMsg = 'Tài khoản: test@cyberpool.vn pass: SecretP@ss2026! mã OTP: 981242 2fa: 8812-9901';
  const scanResult = SensitiveDataFilter.scanAndRedact(sampleMsg);
  assert(scanResult.containsSensitive, 'Phát hiện dữ liệu nhạy cảm trong tin nhắn');
  assert(scanResult.types.includes('PASSWORD'), 'Phát hiện loại PASSWORD');
  assert(scanResult.types.includes('OTP'), 'Phát hiện loại OTP');
  assert(scanResult.types.includes('2FA_BACKUP_CODE'), 'Phát hiện loại 2FA');
  assert(!scanResult.redactedText.includes('SecretP@ss2026!'), 'Đã che giấu mật khẩu an toàn');
  assert(!scanResult.redactedText.includes('981242'), 'Đã che giấu mã OTP an toàn');

  // 6. NOTIFICATION QUEUE TESTS
  console.log('\n--- PHẦN 6: NOTIFICATION QUEUE (OUTBOX, JITTER, DLQ) ---');
  const notif = notificationQueue.enqueue(
    'CP-TEST-NOTIF',
    'WEB_ADMIN',
    { text: 'Thông báo kiểm tra hàng đợi outbox' },
    3
  );
  assert(notif.status === 'ACKNOWLEDGED', 'Notification Queue gửi & acknowledge thành công');

  // 7. FAILURE SCENARIOS (A, B, C, D, E, F)
  console.log('\n--- PHẦN 7: FAILURE SCENARIOS SIMULATION ---');
  const simA = await orderProcessingService.runFailureScenario('SCENARIO_A');
  assert(simA.success, 'Scenario A: Source timeout nhưng đã mua thành công -> Reconcile khôi phục');

  const simB = await orderProcessingService.runFailureScenario('SCENARIO_B');
  assert(simB.success, 'Scenario B: Source timeout & chưa mua -> Reconcile NOT FOUND -> Retry safe');

  const simC = await orderProcessingService.runFailureScenario('SCENARIO_C');
  assert(simC.success, 'Scenario C: CyberPool crash sau khi lấy key -> Phục hồi từ source history');

  const simD = await orderProcessingService.runFailureScenario('SCENARIO_D');
  assert(simD.success, 'Scenario D: Telegram lỗi -> Retry backoff -> DLQ -> Fallback alert');

  const simE = await orderProcessingService.runFailureScenario('SCENARIO_E');
  assert(simE.success, 'Scenario E: Khách đóng trình duyệt -> Key an toàn trong Key Vault');

  const simF = await orderProcessingService.runFailureScenario('SCENARIO_F');
  assert(simF.success, 'Scenario F: 3 worker cùng xử lý -> Distributed Lock chỉ cho 1 winner');

  // 8. RELIABILITY KPIS
  console.log('\n--- PHẦN 8: RELIABILITY KPIS & ZERO-TOLERANCE ---');
  const metrics = orderProcessingService.getReliabilityMetrics();
  assert(metrics.duplicate_purchase_rate === '0.00%', 'KPI: Duplicate purchase rate đạt tuyệt đối 0.00%');
  assert(metrics.total_orders > 0, 'KPI: Có đơn hàng đang được giám sát');

  console.log(`\n================================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log(`================================================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
