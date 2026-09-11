import fs from 'fs';
import path from 'path';

export interface IdempotencyRecord {
  key: string;
  provider: string;
  referenceId: string;
  memo?: string;
  amount: number;
  userId: string;
  status: 'CREDITED' | 'FAILED' | 'PROCESSING';
  processedAt: string;
  metadata?: Record<string, any>;
}

const STORAGE_DIR = path.join(process.cwd(), 'server', 'data');
const STORAGE_FILE = path.join(STORAGE_DIR, 'idempotency_records.json');

export class IdempotencyService {
  private static records: Map<string, IdempotencyRecord> = new Map();
  private static activeLocks: Set<string> = new Set();
  private static isInitialized = false;

  public static initialize(): void {
    if (this.isInitialized) return;
    this.ensureDir();
    this.loadFromDisk();
    this.isInitialized = true;
  }

  private static ensureDir(): void {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  private static loadFromDisk(): void {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.key) {
              this.records.set(item.key.toUpperCase(), item);
            }
          }
          console.log(`[IdempotencyService] Loaded ${this.records.size} persistent idempotency records from disk.`);
        }
      }
    } catch (err) {
      console.warn('[IdempotencyService] Error loading idempotency records from disk:', err);
    }
  }

  private static persistToDisk(): void {
    try {
      this.ensureDir();
      const recordsArray = Array.from(this.records.values());
      const tempPath = `${STORAGE_FILE}.tmp_${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(recordsArray, null, 2), 'utf-8');
      fs.renameSync(tempPath, STORAGE_FILE);
    } catch (err) {
      console.error('[IdempotencyService] Error persisting idempotency records:', err);
    }
  }

  /**
   * Checks if an identifier (transaction ID, memo, transfer code) has already been processed/credited
   */
  public static isProcessed(key: string): boolean {
    this.initialize();
    const cleanKey = (key || '').trim().toUpperCase();
    const existing = this.records.get(cleanKey);
    return Boolean(existing && existing.status === 'CREDITED');
  }

  public static getRecord(key: string): IdempotencyRecord | undefined {
    this.initialize();
    const cleanKey = (key || '').trim().toUpperCase();
    return this.records.get(cleanKey);
  }

  /**
   * Atomically acquires a lock on a key to prevent concurrent double processing
   */
  public static async acquireLock(key: string, maxWaitMs = 3000): Promise<boolean> {
    this.initialize();
    const cleanKey = (key || '').trim().toUpperCase();
    const startTime = Date.now();

    while (this.activeLocks.has(cleanKey)) {
      if (Date.now() - startTime > maxWaitMs) {
        return false; // Lock timeout
      }
      await new Promise(r => setTimeout(r, 50));
    }

    this.activeLocks.add(cleanKey);
    return true;
  }

  public static releaseLock(key: string): void {
    const cleanKey = (key || '').trim().toUpperCase();
    this.activeLocks.delete(cleanKey);
  }

  /**
   * Commits a successful idempotency record across multiple aliases (e.g. transactionId AND memo)
   * so checking either alias will return true!
   */
  public static commit(params: {
    primaryKey: string;
    aliasKeys?: string[];
    provider: string;
    referenceId: string;
    memo?: string;
    amount: number;
    userId: string;
    metadata?: Record<string, any>;
  }): IdempotencyRecord {
    this.initialize();
    const now = new Date().toISOString();
    const record: IdempotencyRecord = {
      key: params.primaryKey.trim().toUpperCase(),
      provider: params.provider,
      referenceId: params.referenceId,
      memo: params.memo,
      amount: params.amount,
      userId: params.userId,
      status: 'CREDITED',
      processedAt: now,
      metadata: params.metadata
    };

    // Store under primary key
    this.records.set(record.key, record);

    // Also index under any alias keys (e.g. memo or transfer code)
    if (params.aliasKeys && Array.isArray(params.aliasKeys)) {
      for (const alias of params.aliasKeys) {
        if (alias) {
          const cleanAlias = alias.trim().toUpperCase();
          this.records.set(cleanAlias, {
            ...record,
            key: cleanAlias
          });
        }
      }
    }

    this.persistToDisk();
    return record;
  }
}

// Auto-initialize on module import
IdempotencyService.initialize();
