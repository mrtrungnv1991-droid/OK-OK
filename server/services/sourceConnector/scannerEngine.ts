// ==============================================================================
// CYBERPOOL: SCANNER ENGINE (FULL & INCREMENTAL SCAN ORCHESTRATOR)
// ==============================================================================
import { 
  SourceAccount, 
  SourceScanJob, 
  SourceProduct, 
  RawScannedProduct, 
  ScanJobType 
} from './types';
import { distributedLock } from './distributedLock';
import { ConnectorFactory } from './connectors/ConnectorFactory';
import { ProductNormalizer } from './productNormalizer';
import { categoryMapper } from './categoryMapper';
import { pricingEngine } from './pricingEngine';
import { sourceOfferService } from './sourceOfferService';

export class ScannerEngine {
  /**
   * Run Scan Job (Full or Incremental)
   */
  public async executeScan(
    account: SourceAccount,
    scanType: ScanJobType,
    job: SourceScanJob,
    existingProducts: Map<string, SourceProduct>,
    blockedProductIds: Set<string>,
    onProgress: (updatedJob: SourceScanJob) => void,
    onProductUpserted: (product: SourceProduct) => void,
    onAuditLog: (action: string, details: Record<string, any>) => void
  ): Promise<SourceScanJob> {
    const workerId = `worker_${Date.now()}`;
    
    // 1. Acquire Distributed Lock
    const lockAcquired = distributedLock.acquireLock(account.id, workerId, 300000);
    if (!lockAcquired) {
      job.status = 'FAILED';
      job.error_message = `Account ${account.name} is currently locked by another scanning worker.`;
      job.finished_at = new Date().toISOString();
      onProgress(job);
      return job;
    }

    try {
      job.status = 'RUNNING';
      job.started_at = new Date().toISOString();
      job.current_step = 'Initializing connector & validating login session';
      job.progress = 5;
      onProgress(job);

      onAuditLog('SCAN_STARTED', {
        jobId: job.id,
        accountId: account.id,
        scanType,
        domain: account.domain
      });

      // 2. Instantiate Connector
      const connector = ConnectorFactory.createConnector(account);

      // 3. Authenticate / Validate Session
      const loginResult = await connector.login();
      if (!loginResult.success) {
        throw new Error(loginResult.error?.message || 'Login verification failed');
      }

      if (loginResult.data?.balance !== undefined) {
        account.balance = loginResult.data.balance;
      }

      job.current_step = 'Discovering categories';
      job.progress = 15;
      onProgress(job);

      // 4. Discover Categories
      const categoriesResult = await connector.get_categories();
      if (!categoriesResult.success || !categoriesResult.data) {
        throw new Error(categoriesResult.error?.message || 'Failed to retrieve categories');
      }

      const categories = categoriesResult.data;
      job.total_categories = categories.length;
      job.processed_categories = 0;
      onProgress(job);

      const seenSourceProductIds = new Set<string>();

      // 5. Scan each category
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        job.current_step = `Scanning category: ${cat.name}`;
        job.progress = 15 + Math.floor((i / categories.length) * 70);
        onProgress(job);

        const scanResult = await connector.scan_products(cat);
        if (!scanResult.success || !scanResult.data) {
          job.failed_count++;
          continue;
        }

        const scannedBatch = scanResult.data;
        job.total_products += scannedBatch.length;

        for (const rawProduct of scannedBatch) {
          seenSourceProductIds.add(rawProduct.source_product_id);

          // A. Blocklist Check
          if (blockedProductIds.has(rawProduct.source_product_id)) {
            job.skipped_count++;
            continue;
          }

          // B. Normalization & Validation
          const validation = ProductNormalizer.validate(rawProduct);
          if (!validation.isValid) {
            job.failed_count++;
            console.warn(`[ScannerEngine] Validation failed for ${rawProduct.source_product_id}:`, validation.errors);
            continue;
          }

          // C. Existing Snapshot Merge
          const existingKey = `${account.id}:${rawProduct.source_product_id}`;
          const existing = existingProducts.get(existingKey);

          // If product is ignored from sync, preserve existing and skip
          if (existing?.is_sync_ignored) {
            job.skipped_count++;
            continue;
          }

          const isNew = !existing;
          const mergedProduct = ProductNormalizer.mergeSnapshot(existing, rawProduct, account.id);

          // D. Category Mapping
          const catResolution = categoryMapper.resolveCategory(
            rawProduct.category_raw || cat.id,
            cat.name
          );
          if (catResolution.isIgnored) {
            job.skipped_count++;
            continue;
          }

          // E. Pricing Engine
          const pricingResult = pricingEngine.calculateFinalPrice({
            originalPrice: mergedProduct.original_price,
            originalCurrency: mergedProduct.original_currency,
            priceOverride: existing?.price_override,
            productMarkupPercent: existing?.markup_percent,
            productFixedMarkup: existing?.fixed_markup
          });

          // Update internal mapping & offers
          const internalProductId = `INT-${mergedProduct.source_product_id.toUpperCase()}`;
          sourceOfferService.upsertOffer({
            id: `offer_${account.id}_${mergedProduct.source_product_id}`,
            internal_product_id: internalProductId,
            source_account_id: account.id,
            source_product_id: mergedProduct.source_product_id,
            source_name: account.name,
            source_price: mergedProduct.original_price,
            currency: mergedProduct.original_currency,
            calculated_final_price: pricingResult.finalPrice,
            stock: mergedProduct.stock,
            priority: 10,
            status: mergedProduct.stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
            last_verified_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          // Save product
          existingProducts.set(existingKey, mergedProduct);
          onProductUpserted(mergedProduct);

          if (isNew) {
            job.created_count++;
          } else {
            job.updated_count++;
          }
          job.processed_products++;
        }

        job.processed_categories++;
        onProgress(job);
      }

      // 6. Missing Product Protection (Only applicable during FULL scan)
      if (scanType === 'FULL') {
        job.current_step = 'Evaluating missing product protection rules';
        for (const [key, prod] of existingProducts.entries()) {
          if (prod.source_account_id === account.id && !seenSourceProductIds.has(prod.source_product_id)) {
            const protectedProd = ProductNormalizer.handleMissingProduct(prod, 3);
            existingProducts.set(key, protectedProd);
            onProductUpserted(protectedProd);
          }
        }
      }

      // 7. Complete Job
      job.status = 'SUCCESS';
      job.progress = 100;
      job.current_step = 'Scan completed successfully';
      job.finished_at = new Date().toISOString();
      account.last_scan_at = new Date().toISOString();
      account.last_successful_scan_at = new Date().toISOString();

      onAuditLog('SCAN_COMPLETED', {
        jobId: job.id,
        accountId: account.id,
        created: job.created_count,
        updated: job.updated_count,
        skipped: job.skipped_count,
        failed: job.failed_count
      });

      onProgress(job);
      return job;
    } catch (err) {
      job.status = 'FAILED';
      job.error_message = (err as Error).message || 'Unknown scanner error occurred';
      job.finished_at = new Date().toISOString();
      job.current_step = 'Failed';

      onAuditLog('SCAN_FAILED', {
        jobId: job.id,
        accountId: account.id,
        error: job.error_message
      });

      onProgress(job);
      return job;
    } finally {
      // 8. Always release distributed lock
      distributedLock.releaseLock(account.id, workerId);
    }
  }
}

export const scannerEngine = new ScannerEngine();
