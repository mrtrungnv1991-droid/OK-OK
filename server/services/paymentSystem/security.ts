// ==============================================================================
// INDEPENDENT PAYMENT / TOP-UP SYSTEM - SECURITY & REDACTION
// Conforms strictly to Sections 27, 28, 49 of Payment Specification
// ==============================================================================

import crypto from 'crypto';

// Encryption key MUST come from the environment in production.
// Fail-closed: if missing in production, refuse to boot instead of using a
// hardcoded fallback key (anyone reading the repo could decrypt vault data).
// In dev/test, generate a random per-boot key so no real key lives in source.
const ENCRYPTION_SECRET = process.env.ENCRYPTION_KEY
  || (process.env.NODE_ENV === 'production'
    ? (() => {
        console.error('[SECURITY FATAL] ENCRYPTION_KEY environment variable is REQUIRED in production. Refusing to start.');
        process.exit(1);
      })()
    : (() => {
        const dev = crypto.randomBytes(32).toString('hex');
        console.warn('[SECURITY ADVISORY] ENCRYPTION_KEY not set — using a RANDOM per-boot key (dev only). Existing encrypted credentials will not decrypt after restart.');
        return dev;
      })());

// Ensure exactly 32 bytes for aes-256-gcm
const KEY_BUFFER = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

/**
 * Encrypt sensitive credentials using AES-256-GCM (Authenticated Encryption).
 * Returns: gcm:ivHex:authTagHex:encryptedHex
 */
export function encryptCredential(plaintext: string): string {
  if (!plaintext) return '';
  try {
    const iv = crypto.randomBytes(12); // Standard 12-byte IV for AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `gcm:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('[Security] Encryption error:', error);
    throw new Error('Failed to securely encrypt credential');
  }
}

/**
 * Decrypt sensitive credentials and strictly verify authentication tag integrity.
 */
export function decryptCredential(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    if (encryptedText.startsWith('gcm:')) {
      const parts = encryptedText.split(':');
      if (parts.length !== 4) return '[ENCRYPTED_OPAQUE]';
      const iv = Buffer.from(parts[1], 'hex');
      const authTag = Buffer.from(parts[2], 'hex');
      const dataHex = parts[3];

      const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUFFER, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(dataHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    // Legacy fallback for previous AES-256-CBC payloads during migration
    if (encryptedText.includes(':')) {
      const [ivHex, dataHex] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', KEY_BUFFER, iv);
      let decrypted = decipher.update(dataHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    return '[ENCRYPTED_OPAQUE]';
  } catch {
    return '[DECRYPTION_INTEGRITY_FAILED]';
  }
}

/**
 * Redact sensitive fields from any string, payload or log object.
 * Rule 28: password=[REDACTED], token=[REDACTED], cookie=[REDACTED]
 */
export function redactSensitive(data: any): any {
  if (!data) return data;

  if (typeof data === 'string') {
    return data
      .replace(/(password|passwd|pass)=([^\s&]+)/gi, '$1=[REDACTED]')
      .replace(/(token|access_token|refresh_token)=([^\s&]+)/gi, '$1=[REDACTED]')
      .replace(/(cookie|session|secret|api_key|authorization)=([^\s&]+)/gi, '$1=[REDACTED]')
      .replace(/("password"\s*:\s*")([^"]+)(")/gi, '$1[REDACTED]$3')
      .replace(/("token"\s*:\s*")([^"]+)(")/gi, '$1[REDACTED]$3')
      .replace(/("secret"\s*:\s*")([^"]+)(")/gi, '$1[REDACTED]$3')
      .replace(/("cookie"\s*:\s*")([^"]+)(")/gi, '$1[REDACTED]$3');
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitive(item));
  }

  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    const sensitiveKeys = [
      'password',
      'passwd',
      'secret',
      'token',
      'accessToken',
      'refreshToken',
      'cookie',
      'sessionToken',
      'apiKey',
      'api_key',
      'encrypted_credential',
      '2fa_secret'
    ];

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        clean[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        clean[key] = redactSensitive(value);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  return data;
}

/**
 * Generate unique distributed Trace ID for tracking requests across API, Queue, Worker, Provider.
 */
export function generateTraceId(): string {
  return `trace_${crypto.randomBytes(12).toString('hex')}`;
}

/**
 * Calculate SHA-256 hash of payload for idempotency verification & webhook replay protection.
 */
export function hashPayload(payload: any): string {
  const normalized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
