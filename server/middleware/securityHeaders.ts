// ==============================================================================
// CYBERPOOL FIX (backend audit #7 systemic note): server.ts trước đây KHÔNG có
// bất kỳ hardening header nào (no helmet, no CORS policy, no body-size guard
// riêng). Không thêm dependency mới — middleware inline đủ dùng cho SPA+API:
//   - Security headers (X-Content-Type-Options, X-Frame-Options,
//     Referrer-Policy, X-XSS-Protection, HSTS khi production)
//   - CORS policy: chỉ chấp nhận origin trong whitelist (CORS_ORIGINS env,
//     phân cách dấu phẩy) hoặc same-origin; dev cho phép localhost bất kỳ port.
//     Webhook endpoints được mount TRƯỚC middleware CORS nên không bị ảnh hưởng
//     (provider gọi không có Origin header — xem server.ts).
// ==============================================================================
import { Request, Response, NextFunction } from 'express';

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0'); // theo khuyến nghị hiện đại (tránh side-channel của legacy auditor)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

const DEV_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function corsPolicy(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  if (!origin) {
    // Same-origin / server-to-server (curl, webhooks, health checks) — cho qua.
    return next();
  }

  const whitelist = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const isDev = process.env.NODE_ENV !== 'production';
  const allowed =
    whitelist.includes(origin) ||
    (isDev && DEV_ORIGIN_RE.test(origin));

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Webhook-Signature');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  // Không allowed → không set header CORS; trình duyệt tự chặn response.
  // API vẫn trả lời (không 403) để same-origin/SSR không vỡ.

  if (req.method === 'OPTIONS') {
    return res.sendStatus(allowed ? 204 : 403);
  }
  next();
}
