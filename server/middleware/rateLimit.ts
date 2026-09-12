// ==============================================================================
// CYBERPOOL FIX (backend audit #7): rate limiter in-process cho các endpoint
// nhạy cảm (login/register/webhook). Trước đây KHÔNG có bất kỳ giới hạn nào —
// attacker có thể brute-force mật khẩu hoặc mass-register để farm quà 200k.
// Không dùng express-rate-limit (tránh dep mới); sliding-window đơn giản,
// đủ cho 1 instance. Nếu scale nhiều instance → chuyển sang Redis.
// ==============================================================================
import { Request, Response, NextFunction } from 'express';

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// Dọn bucket cũ mỗi 5 phút để không rò rỉ bộ nhớ
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [key, b] of buckets.entries()) {
    if (b.timestamps.length === 0 || b.timestamps[b.timestamps.length - 1] < cutoff) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export interface RateLimitOptions {
  windowMs: number;   // kích thước cửa sổ
  max: number;        // số request tối đa trong cửa sổ
  keyPrefix: string;  // prefix cho bucket key
  message?: string;
}

export function rateLimit(opts: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${opts.keyPrefix}:${ip}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { timestamps: [] };
      buckets.set(key, bucket);
    }

    // Xóa timestamp ngoài cửa sổ
    bucket.timestamps = bucket.timestamps.filter(t => now - t < opts.windowMs);

    if (bucket.timestamps.length >= opts.max) {
      const retryAfter = Math.ceil((opts.windowMs - (now - bucket.timestamps[0])) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        error: opts.message || `Quá nhiều yêu cầu. Thử lại sau ${retryAfter}s.`
      });
    }

    bucket.timestamps.push(now);
    next();
  };
}

// Presets cho các endpoint auth nhạy cảm
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'rl:login',
  message: 'Quá nhiều lần đăng nhập thất bại. Thử lại sau 15 phút.'
});

export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyPrefix: 'rl:register',
  message: 'Thiết bị/IP này đã đăng ký quá nhiều tài khoản trong giờ qua.'
});

export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyPrefix: 'rl:webhook',
  message: 'Webhook rate limit exceeded.'
});
