import crypto from 'crypto';
import { UserRole } from '../types';

// Enforce JWT secret in production, use secure fallback for local dev
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[FATAL SECURITY ERROR] JWT_SECRET environment variable MUST be set in production mode!');
  }
  return 'cyberpool-dev-jwt-super-secret-key-min-32chars-2026!';
})();

export interface JwtPayload {
  sub: string;       // User ID
  email: string;
  role: UserRole;
  iat: number;       // Issued at (seconds)
  exp: number;       // Expires at (seconds)
}

/**
 * Hash a plain text password using scrypt with a random 16-byte salt
 * Format: scrypt:<salt_hex>:<hash_hex>
 */
export function hashPassword(password: string): string {
  if (!password || password.length < 6) {
    throw new Error('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify a plain text password against stored hash using timing-safe comparison
 */
export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!password || !storedHash) return false;
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      return false;
    }
    const salt = parts[1];
    const originalHash = Buffer.from(parts[2], 'hex');
    const computedKey = crypto.scryptSync(password, salt, 64);

    if (computedKey.length !== originalHash.length) {
      return false;
    }
    return crypto.timingSafeEqual(computedKey, originalHash);
  } catch (err) {
    console.error('[AuthSecurity] Password verification error:', err);
    return false;
  }
}

/**
 * Generate HMAC-SHA256 signed JWT token
 * Valid for 7 days (604800 seconds)
 */
export function generateToken(user: { id: string; email: string; role: UserRole }, expiresInSeconds: number = 7 * 86400): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify HMAC-SHA256 signed JWT token and check expiration
 */
export function verifyToken(token: string): { valid: boolean; payload?: JwtPayload; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token không được để trống' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Định dạng JWT token không hợp lệ' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64url');

  const expectedBuf = Buffer.from(expectedSignature);
  const actualBuf = Buffer.from(signature);

  if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    return { valid: false, error: 'Chữ ký JWT token không hợp lệ' };
  }

  try {
    const payload: JwtPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token đã hết hạn' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Payload của token bị hỏng' };
  }
}
