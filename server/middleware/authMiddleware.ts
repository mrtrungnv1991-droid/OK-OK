import { Request, Response, NextFunction } from 'express';
import { db } from '../db/store';
import { ServerUser, UserRole } from '../types';
import { verifyToken } from '../utils/authSecurity';

export interface AuthenticatedRequest extends Request {
  user?: ServerUser;
}

// Role hierarchy levels for RBAC
const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 1,
  SELLER: 2,
  SUPPLIER: 2,
  SUPPORT: 3,
  MODERATOR: 4,
  FINANCE: 5,
  ADMIN: 6,
  SUPER_ADMIN: 7
};

/**
 * Strict authentication middleware.
 * - Extracts token ONLY from Authorization: Bearer <token>
 * - Never trusts client-controlled x-user-id header
 * - Never falls back to default user
 * - Validates cryptographic HMAC-SHA256 signature and expiration
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: Header Authorization (Bearer token) là bắt buộc.' 
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: Token xác thực rỗng.' 
    });
  }

  const verification = verifyToken(token);
  if (!verification.valid || !verification.payload) {
    return res.status(401).json({ 
      success: false, 
      error: `Unauthorized: ${verification.error || 'Token không hợp lệ hoặc đã hết hạn.'}` 
    });
  }

  const user = db.users.get(verification.payload.sub);
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized: Người dùng không tồn tại trong hệ thống.' 
    });
  }

  if (user.status === 'banned') {
    return res.status(403).json({ 
      success: false, 
      error: 'Forbidden: Tài khoản này đã bị khóa do vi phạm chính sách.' 
    });
  }

  req.user = user;
  next();
};

export const requireRole = (minimumRole: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        success: false, 
        error: `Forbidden: Requires role [${minimumRole}] or higher. Your role is [${req.user.role}]` 
      });
    }

    next();
  };
};
