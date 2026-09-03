// ==============================================================================
// CYBERPOOL: PRODUCT NORMALIZER & VALIDATION ENGINE
// ==============================================================================
import { RawScannedProduct, SourceProduct, SourceProductStatus } from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ProductNormalizer {
  /**
   * Validate raw scanned product data before upserting into DB
   */
  public static validate(raw: RawScannedProduct): ValidationResult {
    const errors: string[] = [];

    if (!raw.title || raw.title.trim().length === 0) {
      errors.push('Title cannot be empty');
    }

    if (!raw.source_product_id || raw.source_product_id.trim().length === 0) {
      errors.push('source_product_id cannot be empty');
    }

    if (raw.original_price === undefined || raw.original_price === null || isNaN(raw.original_price) || raw.original_price < 0) {
      errors.push(`Invalid price: ${raw.original_price}`);
    }

    if (raw.stock !== undefined && raw.stock !== null && (isNaN(raw.stock) || raw.stock < 0)) {
      errors.push(`Invalid stock value: ${raw.stock}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Merge newly scanned data with existing product snapshot safely.
   * CRITICAL RULE: Never overwrite trusted existing price with 0 if extraction failed or returns 0.
   */
  public static mergeSnapshot(
    existing: SourceProduct | undefined,
    scanned: RawScannedProduct,
    accountId: string
  ): SourceProduct {
    const now = new Date().toISOString();

    if (!existing) {
      // New product discovered
      return {
        id: `sp_${accountId}_${scanned.source_product_id}`,
        source_account_id: accountId,
        source_product_id: scanned.source_product_id,
        source_url: scanned.source_url,
        title: scanned.title.trim(),
        description: scanned.description || '',
        category_raw: scanned.category_raw || 'General',
        original_price: scanned.original_price,
        original_currency: scanned.original_currency || 'VND',
        stock: scanned.stock,
        source_status: scanned.source_status || 'IN_STOCK',
        raw_data: scanned.raw_metadata || {},
        is_sync_ignored: false,
        missing_scan_count: 0,
        auto_sync_price: true,
        first_seen_at: now,
        last_seen_at: now,
        last_synced_at: now,
        created_at: now,
        updated_at: now
      };
    }

    // Protection rule: Do NOT overwrite trusted positive price with 0
    let safePrice = scanned.original_price;
    if (safePrice <= 0 && existing.original_price > 0) {
      console.warn(`[ProductNormalizer] Retaining existing trusted price ${existing.original_price} instead of suspicious 0 for ${scanned.source_product_id}`);
      safePrice = existing.original_price;
    }

    // Protection rule: Do NOT overwrite with OUT_OF_STOCK if scanner returned an extraction error flag
    let safeStatus: SourceProductStatus = scanned.source_status;
    let safeStock = scanned.stock;
    if (scanned.source_status === 'UNKNOWN' && existing.source_status !== 'UNKNOWN') {
      safeStatus = existing.source_status;
      safeStock = existing.stock;
    }

    return {
      ...existing,
      source_url: scanned.source_url || existing.source_url,
      title: scanned.title.trim() || existing.title,
      description: scanned.description || existing.description,
      category_raw: scanned.category_raw || existing.category_raw,
      original_price: safePrice,
      original_currency: scanned.original_currency || existing.original_currency,
      stock: safeStock,
      source_status: safeStatus,
      raw_data: { ...(existing.raw_data || {}), ...(scanned.raw_metadata || {}) },
      missing_scan_count: 0, // Reset missing count since it was seen
      last_seen_at: now,
      last_synced_at: now,
      updated_at: now
    };
  }

  /**
   * Missing Product Protection: Increment missing count.
   * If threshold exceeded (default 3 consecutive scans), mark SOURCE_REMOVED.
   */
  public static handleMissingProduct(existing: SourceProduct, threshold: number = 3): SourceProduct {
    const updatedMissingCount = existing.missing_scan_count + 1;
    const isRemoved = updatedMissingCount >= threshold;

    return {
      ...existing,
      missing_scan_count: updatedMissingCount,
      source_status: isRemoved ? 'SOURCE_REMOVED' : existing.source_status,
      deleted_at: isRemoved ? new Date().toISOString() : existing.deleted_at,
      updated_at: new Date().toISOString()
    };
  }
}
