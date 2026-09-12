// ==============================================================================
// CYBERPOOL: ENCRYPTED KEY VAULT (AES-256 & INTEGRITY HASH)
// ==============================================================================

import crypto from 'crypto';
import { KeyVaultRecord } from './types';

export class KeyVaultService {
  private static instance: KeyVaultService;
  private vaultStorage: Map<string, KeyVaultRecord> = new Map(); // In production, persisted to Cloud DB
  private accessLogs: Array<{ key_id: string; order_id: string; accessed_by: string; timestamp: string }> = [];

  // 256-bit encryption key (In production: loaded via Cloud KMS or Secret Manager)
  private readonly MASTER_KEY: Buffer;
  private readonly HMAC_SECRET: string;

  private constructor() {
    // CYBERPOOL SECURITY FIX (#11 — fail-closed): trước đây keyVault dùng key
    // master hardcode trong repo công khai khi thiếu env, KHÔNG có prod check —
    // key bản quyền đã mã hóa giải mã được bởi bất kỳ ai đọc repo.
    // Production: bắt buộc env; dev: random per-boot.
    const rawSecret = process.env.KEY_VAULT_SECRET
      || (process.env.NODE_ENV === 'production'
        ? (() => {
            console.error('[SECURITY FATAL] KEY_VAULT_SECRET là BẮT BUỘC ở production. Từ chối khởi động.');
            process.exit(1);
          })()
        : (() => {
            const dev = crypto.randomBytes(32).toString('hex');
            console.warn('[SECURITY ADVISORY] KEY_VAULT_SECRET chưa đặt — dùng key RANDOM mỗi lần boot (chỉ dev). Key vault đã mã hóa sẽ không giải mã được sau restart.');
            return dev;
          })());
    this.MASTER_KEY = crypto.createHash('sha256').update(rawSecret).digest();
    this.HMAC_SECRET = process.env.KEY_VAULT_HMAC
      || (process.env.NODE_ENV === 'production'
        ? (() => {
            console.error('[SECURITY FATAL] KEY_VAULT_HMAC là BẮT BUỘC ở production. Từ chối khởi động.');
            process.exit(1);
          })()
        : rawSecret + '-hmac-dev');
  }

  public static getInstance(): KeyVaultService {
    if (!KeyVaultService.instance) {
      KeyVaultService.instance = new KeyVaultService();
    }
    return KeyVaultService.instance;
  }

  /**
   * Encrypts plaintext key using AES-256-CBC with a randomized IV
   */
  public encryptKey(plaintext: string): { ciphertext: string; keyHash: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.MASTER_KEY, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Format: iv:encrypted_hex
    const ciphertext = `${iv.toString('hex')}:${encrypted}`;

    // SHA-256 HMAC for tamper-proof integrity verification
    const keyHash = crypto.createHmac('sha256', this.HMAC_SECRET).update(plaintext).digest('hex');

    return { ciphertext, keyHash };
  }

  /**
   * Decrypts ciphertext back to plaintext
   */
  public decryptKey(ciphertext: string, actorId: string, orderId: string, keyId: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 2) {
      throw new Error('Định dạng khóa mã hóa không hợp lệ');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];

    const decipher = crypto.createDecipheriv('aes-256-cbc', this.MASTER_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Audit trail for any access to unencrypted key
    this.accessLogs.unshift({
      key_id: keyId,
      order_id: orderId,
      accessed_by: actorId,
      timestamp: new Date().toISOString()
    });

    return decrypted;
  }

  /**
   * Securely saves an acquired key to the Key Vault BEFORE marking order completed or delivering
   */
  public saveKeyToVault(params: {
    order_id: string;
    customer_id: string;
    provider: string;
    source_transaction_id: string;
    product_id: string;
    raw_key_payload: string;
  }): KeyVaultRecord {
    const { ciphertext, keyHash } = this.encryptKey(params.raw_key_payload);

    const record: KeyVaultRecord = {
      id: `KV-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      order_id: params.order_id,
      customer_id: params.customer_id,
      provider: params.provider,
      source_transaction_id: params.source_transaction_id,
      product_id: params.product_id,
      encrypted_key: ciphertext,
      key_hash: keyHash,
      status: 'SECURED',
      delivery_attempts: 0,
      created_at: new Date().toISOString()
    };

    this.vaultStorage.set(params.order_id, record);
    return record;
  }

  /**
   * Retrieve vault record by order ID
   */
  public getVaultRecord(orderId: string): KeyVaultRecord | undefined {
    return this.vaultStorage.get(orderId);
  }

  /**
   * Verify integrity of key
   */
  public verifyIntegrity(orderId: string, decryptedPlaintext: string): boolean {
    const record = this.vaultStorage.get(orderId);
    if (!record) return false;

    const computed = crypto.createHmac('sha256', this.HMAC_SECRET).update(decryptedPlaintext).digest('hex');
    return computed === record.key_hash;
  }

  /**
   * Mark as delivered
   */
  public markDelivered(orderId: string): KeyVaultRecord | null {
    const rec = this.vaultStorage.get(orderId);
    if (!rec) return null;

    rec.status = 'DELIVERED';
    rec.delivered_at = new Date().toISOString();
    rec.delivery_attempts += 1;
    return rec;
  }

  /**
   * Get all vault records for admin monitoring
   */
  public getAllRecords(): KeyVaultRecord[] {
    return Array.from(this.vaultStorage.values());
  }

  /**
   * Get access logs
   */
  public getAccessLogs() {
    return this.accessLogs.slice(0, 50);
  }
}

export const keyVault = KeyVaultService.getInstance();
