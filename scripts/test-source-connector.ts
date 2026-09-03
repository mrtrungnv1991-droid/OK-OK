// ==============================================================================
// CYBERPOOL: SOURCE CONNECTOR & WEBSITE PRODUCT SCAN ENGINE TEST SUITE
// ==============================================================================
import { encryptSecret, decryptSecret, maskSecret, sanitizeLogData } from '../server/services/sourceConnector/encryptionUtils';
import { ProductNormalizer } from '../server/services/sourceConnector/productNormalizer';
import { pricingEngine } from '../server/services/sourceConnector/pricingEngine';
import { distributedLock } from '../server/services/sourceConnector/distributedLock';
import { sourceOfferService } from '../server/services/sourceConnector/sourceOfferService';
import { ConnectorFactory } from '../server/services/sourceConnector/connectors/ConnectorFactory';
import { SourceAccount, SourceProduct } from '../server/services/sourceConnector/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING SOURCE ACCOUNT CONNECTOR & SCAN ENGINE TESTS');
  console.log('======================================================\n');

  // TEST 1: Encryption at Rest & Secret Masking
  console.log('--- 1. Security & Encryption at Rest ---');
  const plainSecret = 'MySuperSecretSessionCookie_988273';
  const encrypted = encryptSecret(plainSecret);
  assert(encrypted !== plainSecret && encrypted.includes(':'), 'Encrypts secret with IV');
  const decrypted = decryptSecret(encrypted);
  assert(decrypted === plainSecret, 'Decrypts secret back to exact original value');
  const masked = maskSecret('reseller_admin@gmail.com');
  assert(masked.includes('••••••••') && !masked.includes('admin'), 'Masks credentials without plaintext leak');
  const sanitized = sanitizeLogData({ password: 'pass', token: 'tok', normalData: 'ok' });
  assert(sanitized.password.includes('REDACTED') && sanitized.normalData === 'ok', 'Sanitizes audit log payload');

  // TEST 2: Product Normalizer & Data Validation
  console.log('\n--- 2. Product Normalizer & Validation ---');
  const invalidProduct = ProductNormalizer.validate({
    source_product_id: '',
    source_url: 'https://source.com/p/1',
    title: '',
    original_price: -500,
    original_currency: 'VND',
    stock: -1,
    source_status: 'IN_STOCK'
  });
  assert(!invalidProduct.isValid && invalidProduct.errors.length >= 3, 'Rejects empty title, empty product_id, and negative price');

  const validProduct = ProductNormalizer.validate({
    source_product_id: 'rbx-1000',
    source_url: 'https://source.com/p/1',
    title: '1,000 Robux Clean',
    original_price: 120000,
    original_currency: 'VND',
    stock: 50,
    source_status: 'IN_STOCK'
  });
  assert(validProduct.isValid, 'Accepts valid scanned product payload');

  // TEST 3: Zero-Price Overwrite Protection
  console.log('\n--- 3. Trusted Price Overwrite Protection ---');
  const existingProduct: SourceProduct = {
    id: 'sp_01',
    source_account_id: 'acc_01',
    source_product_id: 'rbx-1000',
    source_url: 'https://muakey.com/1',
    title: '1,000 Robux Clean',
    original_price: 120000,
    original_currency: 'VND',
    stock: 50,
    source_status: 'IN_STOCK',
    is_sync_ignored: false,
    missing_scan_count: 0,
    auto_sync_price: true,
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const suspiciousZeroScan = {
    source_product_id: 'rbx-1000',
    source_url: 'https://muakey.com/1',
    title: '1,000 Robux Clean',
    original_price: 0, // Scanner bug or temporary glitch returning 0
    original_currency: 'VND',
    stock: 50,
    source_status: 'IN_STOCK' as const
  };

  const merged = ProductNormalizer.mergeSnapshot(existingProduct, suspiciousZeroScan, 'acc_01');
  assert(merged.original_price === 120000, 'Protects existing price from being overwritten by 0 on scanner glitch');

  // TEST 4: Missing Product Protection
  console.log('\n--- 4. Missing Product Protection ---');
  const missing1 = ProductNormalizer.handleMissingProduct(existingProduct, 3);
  assert(missing1.missing_scan_count === 1 && missing1.source_status !== 'SOURCE_REMOVED', 'Scan #1 missing increments count without soft delete');
  const missing2 = ProductNormalizer.handleMissingProduct(missing1, 3);
  assert(missing2.missing_scan_count === 2 && missing2.source_status !== 'SOURCE_REMOVED', 'Scan #2 missing increments count without soft delete');
  const missing3 = ProductNormalizer.handleMissingProduct(missing2, 3);
  assert(missing3.missing_scan_count === 3 && missing3.source_status === 'SOURCE_REMOVED', 'Scan #3 missing marks SOURCE_REMOVED after reaching threshold');

  // TEST 5: Pricing Engine & Rounding
  console.log('\n--- 5. Pricing Engine & Priority Hierarchy ---');
  // Formula: (base_price_vnd * (1 + markup_percent / 100)) + fixed_markup
  // USD FX calculation: $10 * 26,000 = 260,000 VND
  // Markup: 5% = 13,000. Fixed = 10,000. Sum = 283,000.
  const priceResult = pricingEngine.calculateFinalPrice({
    originalPrice: 10,
    originalCurrency: 'USD',
    productMarkupPercent: 5,
    productFixedMarkup: 10000,
    roundingRule: 1000,
    roundingMode: 'ROUND'
  });
  assert(priceResult.basePriceVnd === 260000, 'Calculates USD to VND FX rate correctly (260,000 VND)');
  assert(priceResult.finalPrice === 283000, `Calculates final markup accurately (Expected 283,000, got ${priceResult.finalPrice})`);

  // Product Override takes highest priority
  const overrideResult = pricingEngine.calculateFinalPrice({
    originalPrice: 10,
    originalCurrency: 'USD',
    priceOverride: 299000,
    productMarkupPercent: 10
  });
  assert(overrideResult.finalPrice === 299000 && overrideResult.appliedRule === 'PRODUCT_OVERRIDE', 'Product Override takes absolute priority');

  // Price Rounding
  const rounded1 = pricingEngine.roundPrice(262500, 1000, 'ROUND');
  assert(rounded1 === 263000, `Rounds 262,500 to nearest 1,000 = 263,000 (Got ${rounded1})`);

  // TEST 6: Distributed Lock & Idempotency
  console.log('\n--- 6. Distributed Lock & Worker Idempotency ---');
  const lockKey = 'test_acc_99';
  const workerA = 'worker_a';
  const workerB = 'worker_b';
  const lock1 = distributedLock.acquireLock(lockKey, workerA, 5000);
  assert(lock1 === true, 'Worker A acquires scan lock successfully');
  const lock2 = distributedLock.acquireLock(lockKey, workerB, 5000);
  assert(lock2 === false, 'Worker B is rejected while Worker A holds scan lock');
  distributedLock.releaseLock(lockKey, workerA);
  const lock3 = distributedLock.acquireLock(lockKey, workerB, 5000);
  assert(lock3 === true, 'Worker B acquires lock after Worker A releases it');
  distributedLock.releaseLock(lockKey, workerB);

  // TEST 7: Multi-Source Routing Engine
  console.log('\n--- 7. Multi-Source Routing Engine ---');
  const accountsMap = new Map<string, SourceAccount>();
  accountsMap.set('acc_muakey', {
    id: 'acc_muakey',
    name: 'Muakey Account A',
    domain: 'muakey.com',
    username: 'mky@gmail.com',
    browser_profile_id: 'prof_mky',
    connector_type: 'HYBRID',
    scanner_profile: 'MUAKey_STANDARD',
    status: 'ONLINE',
    balance: 50000, // Insufficient balance! (needs 100,000)
    currency: 'VND',
    low_balance_threshold: 10000,
    is_active: true,
    concurrency_limit: 1,
    request_delay_ms: 800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  accountsMap.set('acc_divine', {
    id: 'acc_divine',
    name: 'DivineShop Account B',
    domain: 'divineshop.vn',
    username: 'divine@gmail.com',
    browser_profile_id: 'prof_divine',
    connector_type: 'BROWSER',
    scanner_profile: 'SITE_B_DYNAMIC_LOAD_MORE',
    status: 'ONLINE',
    balance: 500000, // Sufficient balance
    currency: 'VND',
    low_balance_threshold: 10000,
    is_active: true,
    concurrency_limit: 1,
    request_delay_ms: 800,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  sourceOfferService.upsertOffer({
    id: 'off_mky_01',
    internal_product_id: 'ROBUX_1000',
    source_account_id: 'acc_muakey',
    source_product_id: 'mky_rbx',
    source_name: 'Muakey',
    source_price: 90000, // Lower price but insufficient balance
    currency: 'VND',
    calculated_final_price: 110000,
    stock: 50,
    priority: 10,
    status: 'ACTIVE',
    last_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  sourceOfferService.upsertOffer({
    id: 'off_div_01',
    internal_product_id: 'ROBUX_1000',
    source_account_id: 'acc_divine',
    source_product_id: 'div_rbx',
    source_name: 'DivineShop',
    source_price: 95000, // Slightly higher but account has 500,000 VND balance
    currency: 'VND',
    calculated_final_price: 115000,
    stock: 20,
    priority: 10,
    status: 'ACTIVE',
    last_verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const routingResult = sourceOfferService.routeBestSource('ROBUX_1000', 1, accountsMap);
  assert(routingResult.selectedOffer?.source_account_id === 'acc_divine', 'Router selects DivineShop because Muakey balance is insufficient');

  // TEST 8: Connector Factory
  console.log('\n--- 8. Connector Factory & Extensibility ---');
  const muakeyConn = ConnectorFactory.createConnector(accountsMap.get('acc_muakey')!);
  assert(muakeyConn.constructor.name === 'MuakeyConnector', 'Instantiates MuakeyConnector for muakey.com domain');
  const genericConn = ConnectorFactory.createConnector(accountsMap.get('acc_divine')!);
  assert(genericConn.constructor.name === 'GenericBrowserConnector', 'Instantiates GenericBrowserConnector for other domains');

  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
