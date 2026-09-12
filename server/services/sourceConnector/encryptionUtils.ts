// ==============================================================================
// CYBERPOOL: ENCRYPTION AT REST & SECRET MASKING UTILITIES
// Authenticated Encryption with AES-256-GCM & Integrity Verification
// ==============================================================================
import crypto from 'crypto';

// CYBERPOOL SECURITY FIX: fail-closed giống paymentSystem/security.ts —
// trước đây production chỉ console.warn rồi vẫn dùng key hardcode trong repo
// (ai đọc repo giải mã được toàn bộ credential nhà cung cấp).
// Production: bắt buộc có env, thiếu là từ chối boot. Dev: key random mỗi lần boot.
const MASTER_SECRET = process.env.SOURCE_CONNECTOR_SECRET_KEY
  || process.env.ENCRYPTION_KEY
  || (process.env.NODE_ENV === 'production'
    ? (() => {
        console.error('[SECURITY FATAL] SOURCE_CONNECTOR_SECRET_KEY (hoặc ENCRYPTION_KEY) là BẮT BUỘC ở production. Từ chối khởi động.');
        process.exit(1);
      })()
    : (() => {
        const dev = crypto.randomBytes(32).toString('hex');
        console.warn('[SECURITY ADVISORY] SOURCE_CONNECTOR_SECRET_KEY/ENCRYPTION_KEY chưa đặt — dùng key RANDOM mỗi lần boot (chỉ dev). Credential đã mã hóa sẽ không giải mã được sau khi restart.');
        return dev;
      })());

// Derive a 32-byte key from master secret
const DERIVED_KEY = crypto.createHash('sha256').update(MASTER_SECRET).digest();

/**
 * Encrypts sensitive string (password, session cookie, auth token) using AES-256-GCM
 * Output format: gcm:iv:authTag:ciphertext
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(12); // Standard 12-byte IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', DERIVED_KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `gcm:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts sensitive string and checks authentication tag integrity
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  try {
    if (encryptedPayload.startsWith('gcm:')) {
      const parts = encryptedPayload.split(':');
      if (parts.length !== 4) return '';
      const iv = Buffer.from(parts[1], 'hex');
      const authTag = Buffer.from(parts[2], 'hex');
      const cipherText = parts[3];

      const decipher = crypto.createDecipheriv('aes-256-gcm', DERIVED_KEY, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(cipherText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    // Fallback for legacy CBC payloads
    const parts = encryptedPayload.split(':');
    if (parts.length === 2) {
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      const decipher = crypto.createDecipheriv('aes-256-cbc', DERIVED_KEY, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    return '';
  } catch (err) {
    console.error('[Security] Failed to decrypt credential:', (err as Error).message);
    return '';
  }
}

/**
 * Masks a secret so it can never be exposed in logs or frontend (e.g. "••••••••" or "ab***cd")
 */
export function maskSecret(secret?: string): string {
  if (!secret) return '••••••••';
  if (secret.length <= 4) return '••••••••';
  return `${secret.substring(0, 2)}••••••••${secret.substring(secret.length - 2)}`;
}

/**
 * Strips/redacts sensitive keys from any arbitrary object before logging or returning over API
 */
export function sanitizeLogData<T extends Record<string, any>>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  const sensitiveKeys = ['password', 'encrypted_password', 'session', 'encrypted_session', 'cookie', 'token', 'secret'];
  
  const cleaned: Record<string, any> = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      cleaned[key] = '••••[REDACTED_BY_SECURITY_LAYER]••••';
    } else if (value && typeof value === 'object') {
      cleaned[key] = sanitizeLogData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}
