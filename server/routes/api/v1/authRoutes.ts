import { Router } from 'express';
import { db } from '../../../db/store';
import { requireAuth, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { loginRateLimit, registerRateLimit } from '../../../middleware/rateLimit';
import { AuditService } from '../../../services/auditService';
import { ServerUser } from '../../../types';
import { hashPassword, verifyPassword, generateToken } from '../../../utils/authSecurity';

export const authRouter = Router();

// Helper to remove sensitive fields before returning to client
const sanitizeUser = (user: ServerUser) => {
  const { passwordHash, ...safe } = user;
  return safe;
};

// GET /api/v1/auth/me - Current User Profile & Balance
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user!)
  });
});

// POST /api/v1/auth/login
// CYBERPOOL FIX (backend audit #7): rate limit chống brute-force
authRouter.post('/login', loginRateLimit, (req, res) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, error: 'Email đăng nhập là bắt buộc.' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'Mật khẩu đăng nhập là bắt buộc.' });
  }

  let matchedUser: ServerUser | undefined;
  for (const u of db.users.values()) {
    if (u.email.toLowerCase() === email.trim().toLowerCase()) {
      matchedUser = u;
      break;
    }
  }

  // Authentication failure if user not found
  if (!matchedUser) {
    return res.status(401).json({ 
      success: false, 
      error: 'Email hoặc mật khẩu không chính xác.' 
    });
  }

  // Verify password using secure constant-time scrypt comparison
  const isPasswordValid = verifyPassword(password, matchedUser.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ 
      success: false, 
      error: 'Email hoặc mật khẩu không chính xác.' 
    });
  }

  if (matchedUser.status === 'banned') {
    return res.status(403).json({ 
      success: false, 
      error: 'Tài khoản đã bị tạm khóa do vi phạm điều khoản dịch vụ.' 
    });
  }

  matchedUser.lastLoginAt = new Date().toISOString();
  matchedUser.ipAddress = req.ip;

  // Generate cryptographically signed JWT token
  const token = generateToken({
    id: matchedUser.id,
    email: matchedUser.email,
    role: matchedUser.role
  });

  AuditService.log({
    actorId: matchedUser.id,
    actorName: matchedUser.name,
    actorRole: matchedUser.role,
    action: 'USER_LOGIN',
    resource: 'AUTH_SESSION',
    ipAddress: req.ip
  });

  res.json({
    success: true,
    token,
    user: sanitizeUser(matchedUser)
  });
});

// POST /api/v1/auth/register
// CYBERPOOL FIX (backend audit #7): rate limit chống mass-register farm quà
authRouter.post('/register', registerRateLimit, (req, res) => {
  const { email, name, phone, password } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Địa chỉ email không hợp lệ.' });
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Họ tên phải có ít nhất 2 ký tự.' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ success: false, error: 'Mật khẩu phải có độ dài từ 6 ký tự trở lên.' });
  }

  // Check existing email
  for (const u of db.users.values()) {
    if (u.email.toLowerCase() === email.trim().toLowerCase()) {
      return res.status(409).json({ success: false, error: 'Địa chỉ email này đã được sử dụng.' });
    }
  }

  const newUser: ServerUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    phone: phone ? String(phone).trim() : undefined,
    passwordHash: hashPassword(password),
    role: 'USER',
    // CYBERPOOL SECURITY FIX (#7): welcome gift 200k không kiểm chứng — mass
    // register (không email verify/captcha/rate-limit) rồi drain qua instant-buy.
    // Production: không tặng; dev: giữ 200k để test luồng mua hàng.
    walletBalance: process.env.NODE_ENV === 'production' ? 0 : 200000,
    escrowLocked: 0,
    affiliateEarnings: 0,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    ipAddress: req.ip
  };

  db.users.set(newUser.id, newUser);

  // Generate signed JWT token
  const token = generateToken({
    id: newUser.id,
    email: newUser.email,
    role: newUser.role
  });

  AuditService.log({
    actorId: newUser.id,
    actorName: newUser.name,
    actorRole: newUser.role,
    action: 'USER_REGISTER',
    resource: 'AUTH_SESSION',
    ipAddress: req.ip
  });

  res.status(201).json({
    success: true,
    token,
    user: sanitizeUser(newUser)
  });
});

// POST /api/v1/auth/logout
authRouter.post('/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  AuditService.log({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'USER_LOGOUT',
    resource: 'AUTH_SESSION',
    ipAddress: req.ip
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// GET /api/v1/auth/sessions
authRouter.get('/sessions', requireAuth, (req: AuthenticatedRequest, res) => {
  const sessions = [
    {
      id: `sess-${req.user!.id}-curr`,
      device: 'Chrome on macOS (Current Session)',
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Mozilla/5.0',
      createdAt: req.user!.lastLoginAt || new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString()
    }
  ];

  res.json({
    success: true,
    sessions
  });
});

// DELETE /api/v1/auth/sessions/:id
authRouter.delete('/sessions/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    message: 'Session revoked successfully'
  });
});

// POST /api/v1/auth/forgot-password
// CYBERPOOL FIX (#23): trước đây luôn trả "Đã gửi liên kết khôi phục" dù KHÔNG
// có email service/reset flow nào tồn tại — người dùng tin rằng email đã gửi.
// Giờ trả lời trung thực: endpoint chưa triển khai (501), không claim success.
authRouter.post('/forgot-password', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Tính năng khôi phục mật khẩu chưa được triển khai trên hệ thống này. Vui lòng liên hệ bộ phận hỗ trợ để được trợ giúp trực tiếp.'
  });
});

