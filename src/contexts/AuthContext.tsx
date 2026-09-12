import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { UserProfile, CurrencyCode, LanguageCode } from '../types';
import { authApi, AuthUser } from '../api/auth';
import { api } from '../api/client';

interface AuthContextType {
  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBooting: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; name: string; phone?: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateUserRole: (role: UserProfile['role']) => Promise<void>;
  updateUserBalance: (delta: number) => void;
  updateEscrowLocked: (delta: number) => void;
  updateLanguage: (lang: LanguageCode) => void;
  updateCurrency: (curr: CurrencyCode) => void;
}

// CYBERPOOL FIX: boot user là GUEST trung tính — trước đây là SuperAdmin với
// walletBalance 50.000.000 + isAuthenticated=true mặc định, UI hiển thị số dư
// bịa cho MỌI visitor trước khi /auth/me kịp chạy.
const GUEST_USER: UserProfile = {
  id: 'guest',
  name: 'Khách',
  email: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
  walletBalance: 0,
  escrowLocked: 0,
  currency: 'VND',
  language: 'vi',
  reputationScore: 0,
  role: 'buyer',
  affiliateCode: '',
  affiliateEarnings: 0,
  totalSpun: 0
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('cyberpool_current_user');
      if (saved && api.getToken()) {
        // Chỉ tin profile đã lưu khi còn token — tránh hiện user cũ sau logout
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return GUEST_USER;
  });
  // CYBERPOOL FIX: xác thực dựa trên token thật đang lưu, không hardcode true
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(api.getToken()));
  // Splash gate: chưa biết kết quả /auth/me lần đầu thì chưa kết luận gì
  const [isBooting, setIsBooting] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to localStorage whenever currentUser changes
  useEffect(() => {
    try {
      localStorage.setItem('cyberpool_current_user', JSON.stringify(currentUser));
    } catch {
      // ignore storage errors
    }
  }, [currentUser]);

  // Sync server profile to client state
  const mapServerUserToProfile = (serverUser: AuthUser): UserProfile => {
    let clientRole: UserProfile['role'] = 'buyer';
    if (serverUser.role === 'SUPER_ADMIN' || serverUser.role === 'ADMIN') {
      clientRole = 'admin';
    } else if (serverUser.role === 'SELLER') {
      clientRole = 'seller_ctv';
    }

    return {
      id: serverUser.id,
      name: serverUser.name,
      email: serverUser.email,
      avatar: serverUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      walletBalance: serverUser.walletBalance ?? currentUser.walletBalance ?? 0,
      escrowLocked: serverUser.escrowLocked ?? currentUser.escrowLocked ?? 0,
      currency: currentUser.currency || 'VND',
      language: currentUser.language || 'vi',
      reputationScore: 99.8,
      role: clientRole,
      affiliateCode: `AFF-${serverUser.id.slice(-6).toUpperCase()}`,
      affiliateEarnings: serverUser.affiliateEarnings ?? 0,
      totalSpun: 10
    };
  };

  const refreshUserProfile = useCallback(async () => {
    try {
      let res = await authApi.getMe();
      // CYBERPOOL SECURITY FIX (CRITICAL): trước đây khi /auth/me fail, code tự
      // đăng nhập bằng cặp credential ADMIN hardcode trong bundle công khai —
      // MỌI visitor thành SuperAdmin ở production. Giờ auto-login demo chỉ chạy
      // ở DEV (import.meta.env.DEV = false trong build production).
      if (!res.success && import.meta.env.DEV) {
        const loginRes = await authApi.login('admin@cyberpool.vn', 'Admin@CyberPool2026!');
        if (loginRes.success && loginRes.data) {
          api.setToken(loginRes.data.token);
          res = await authApi.getMe();
        }
      }
      if (res.success && res.data?.user) {
        setCurrentUser(prev => {
          const mapped = mapServerUserToProfile(res.data.user);
          // Số dư lấy từ SERVER — chỉ giữ giá trị client khi server không trả về
          return {
            ...mapped,
            walletBalance: mapped.walletBalance ?? prev.walletBalance,
            escrowLocked: mapped.escrowLocked ?? prev.escrowLocked,
            currency: prev.currency,
            language: prev.language
          };
        });
        setIsAuthenticated(true);
      } else if (!res.success && api.getToken()) {
        // CYBERPOOL FIX: token hết hạn/bị từ chối → xóa token + về guest,
        // KHÔNG giữ profile cũ (trước đây chỉ set false khi không có token,
        // token chết vẫn giữ state "đã đăng nhập").
        api.setToken(null);
        try { localStorage.removeItem('cyberpool_current_user'); } catch {}
        setCurrentUser(GUEST_USER);
        setIsAuthenticated(false);
      } else if (!api.getToken()) {
        setCurrentUser(GUEST_USER);
        setIsAuthenticated(false);
      }
    } catch {
      // server sync fallback
    } finally {
      setIsBooting(false);
    }
  }, []);

  useEffect(() => {
    refreshUserProfile();
  }, [refreshUserProfile]);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.data) {
        api.setToken(res.data.token);
        const mapped = mapServerUserToProfile(res.data.user);
        setCurrentUser(mapped);
        try {
          localStorage.setItem('cyberpool_current_user', JSON.stringify(mapped));
        } catch {}
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: res.error || 'Đăng nhập thất bại' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Lỗi mạng' };
    }
  };

  const register = async (data: { email: string; name: string; phone?: string; password?: string }) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      if (res.success && res.data) {
        api.setToken(res.data.token);
        const mapped = mapServerUserToProfile(res.data.user);
        setCurrentUser(mapped);
        try {
          localStorage.setItem('cyberpool_current_user', JSON.stringify(mapped));
        } catch {}
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: res.error || 'Đăng ký thất bại' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Lỗi mạng' };
    }
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    api.setToken(null);
    try { localStorage.removeItem('cyberpool_current_user'); } catch {}
    setCurrentUser(GUEST_USER);
    setIsAuthenticated(false);
  };

  const updateUserRole = async (role: UserProfile['role']) => {
    setCurrentUser(prev => {
      const updated = { ...prev, role };
      try {
        localStorage.setItem('cyberpool_current_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const updateUserBalance = (delta: number) => {
    setCurrentUser(prev => {
      const newBal = Math.max(0, (prev.walletBalance || 0) + delta);
      const updated = {
        ...prev,
        walletBalance: newBal
      };
      try {
        localStorage.setItem('cyberpool_current_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const updateEscrowLocked = (delta: number) => {
    setCurrentUser(prev => {
      const newEscrow = Math.max(0, (prev.escrowLocked || 0) + delta);
      const updated = {
        ...prev,
        escrowLocked: newEscrow
      };
      try {
        localStorage.setItem('cyberpool_current_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const updateLanguage = (language: LanguageCode) => {
    setCurrentUser(prev => {
      const updated = { ...prev, language };
      try {
        localStorage.setItem('cyberpool_current_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const updateCurrency = (currency: CurrencyCode) => {
    setCurrentUser(prev => {
      const updated = { ...prev, currency };
      try {
        localStorage.setItem('cyberpool_current_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const contextValue = useMemo(() => ({
    currentUser,
    setCurrentUser,
    isAuthenticated,
    isLoading,
    isBooting,
    login,
    register,
    logout,
    refreshUserProfile,
    updateUserRole,
    updateUserBalance,
    updateEscrowLocked,
    updateLanguage,
    updateCurrency
  }), [
    currentUser,
    isAuthenticated,
    isLoading,
    isBooting,
    login,
    register,
    logout,
    refreshUserProfile,
    updateUserRole,
    updateUserBalance,
    updateEscrowLocked,
    updateLanguage,
    updateCurrency
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
