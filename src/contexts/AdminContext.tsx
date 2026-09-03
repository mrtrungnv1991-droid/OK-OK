import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  MemberUser, 
  SupplierApiConfig, 
  SystemConfiguration, 
  VoucherCoupon 
} from '../types';
import { INITIAL_SUPPLIERS } from '../data/mockTopupGames';
import { INITIAL_VOUCHERS } from '../data/systemExtendedData';
import { adminApi, AdminStats, AdminAuditLog } from '../api/admin';

interface AdminContextType {
  members: MemberUser[];
  suppliers: SupplierApiConfig[];
  systemConfig: SystemConfiguration;
  vouchers: VoucherCoupon[];
  stats: AdminStats | null;
  auditLogs: AdminAuditLog[];
  isLoading: boolean;
  fetchAdminData: () => Promise<void>;
  updateMemberRole: (memberId: string, newRole: MemberUser['role']) => Promise<void>;
  toggleMemberStatus: (memberId: string) => void;
  adjustMemberBalance: (memberId: string, amount: number, reason: string) => void;
  updateSupplierBalance: (supplierId: string, deltaBalance: number) => void;
  updateSystemConfig: (newConfig: Partial<SystemConfiguration>) => Promise<void>;
  addVoucher: (voucher: Partial<VoucherCoupon>) => void;
  toggleVoucherStatus: (voucherId: string) => void;
  deleteVoucher: (voucherId: string) => void;
}

const INITIAL_MEMBERS: MemberUser[] = [
  {
    id: 'usr-admin-01',
    username: 'CyberPool SuperAdmin',
    email: 'admin@cyberpool.vn',
    role: 'admin',
    walletBalance: 50000000,
    totalDeposited: 125000000,
    totalOrders: 156,
    status: 'active',
    createdAt: '2026-01-01',
    lastLogin: 'Hôm nay 15:40'
  },
  {
    id: 'usr-buyer-01',
    username: 'CyberTrader_Vip',
    email: 'lombard2508@gmail.com',
    role: 'member',
    walletBalance: 2450000,
    totalDeposited: 12500000,
    totalOrders: 28,
    status: 'active',
    createdAt: '2026-02-15',
    lastLogin: 'Hôm nay 14:15'
  }
];

const DEFAULT_SYSTEM_CONFIG: SystemConfiguration = {
  siteName: 'CYBERPOOL // Sàn Gom Đơn Mua Chung & Nạp Game Số 1 VN',
  siteTitle: 'CYBERPOOL - Marketplace & Digital Assets Escrow',
  slogan: 'Sàn Gom Đơn Mua Chung Bản Quyền & Nạp Game Trực Tuyến Hàng Đầu VN',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  hotline: '1900.888.999',
  telegramSupport: 'https://t.me/cyberpool_cskh',
  zaloSupport: 'https://zalo.me/cyberpool_support',
  facebookFanpage: 'https://facebook.com/cyberpool.official',
  homeAnnouncement: '🔥 KHUYẾN MÃI NẠP TIỀN: Tặng ngay +10% giá trị nạp VietQR tự động nhân dịp ra mắt bản nâng cấp Marketplace v8.0!',
  showAnnouncementPopup: true,
  usdToVndRate: 25450,
  platformFeePercent: 2,
  maintenanceMode: false,
  autoEscrowRelease: true,
  cronCheckLiveActive: true,
  bankName: 'MBBank',
  bankAccountNo: '0388999999',
  bankAccountName: 'CYBERPOOL CORP',
  vietQrApiToken: 'CYBER_API_TOKEN',
  telcoPartnerId: 'CYBER_PARTNER',
  telcoPartnerKey: 'CYBER_KEY',
  cryptoUsdtAddress: 'TXu9...cyber88',
  momoPhone: '0388999999',
  momoName: 'CYBERPOOL'
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<MemberUser[]>(INITIAL_MEMBERS);
  const [suppliers, setSuppliers] = useState<SupplierApiConfig[]>(INITIAL_SUPPLIERS);
  const [systemConfig, setSystemConfig] = useState<SystemConfiguration>(DEFAULT_SYSTEM_CONFIG);
  const [vouchers, setVouchers] = useState<VoucherCoupon[]>(INITIAL_VOUCHERS);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dashRes, logsRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getAuditLogs(50)
      ]);

      if (dashRes.success && dashRes.data?.stats) {
        setStats(dashRes.data.stats);
      }

      if (logsRes.success && logsRes.data?.logs) {
        setAuditLogs(logsRes.data.logs);
      }
    } catch {
      // server sync fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const updateMemberRole = async (memberId: string, newRole: MemberUser['role']) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    try {
      const serverRole = newRole === 'admin' ? 'SUPER_ADMIN' : newRole.startsWith('ctv') ? 'SELLER' : 'USER';
      await adminApi.updateUserRole(memberId, serverRole);
      await fetchAdminData();
    } catch {}
  };

  const toggleMemberStatus = (memberId: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return { ...m, status: m.status === 'active' ? 'banned' : 'active' };
      }
      return m;
    }));
  };

  const adjustMemberBalance = (memberId: string, amount: number, reason: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return { ...m, walletBalance: Math.max(0, m.walletBalance + amount) };
      }
      return m;
    }));
  };

  const updateSupplierBalance = (supplierId: string, deltaBalance: number) => {
    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierId) {
        return { ...s, currentBalance: s.currentBalance + deltaBalance };
      }
      return s;
    }));
  };

  const updateSystemConfig = async (newConfig: Partial<SystemConfiguration>) => {
    setSystemConfig(prev => ({ ...prev, ...newConfig }));
    try {
      await adminApi.updateSystemConfig(newConfig);
    } catch {}
  };

  const addVoucher = (voucher: Partial<VoucherCoupon>) => {
    const newVoucher: VoucherCoupon = {
      id: `VOUCHER-${Date.now().toString().slice(-4)}`,
      code: voucher.code?.toUpperCase() || `SALE${Math.floor(10 + Math.random() * 90)}`,
      discountType: voucher.discountType || 'percent',
      discountValue: voucher.discountValue || 10,
      minOrderValue: voucher.minOrderValue || 0,
      maxDiscount: voucher.maxDiscount || 50000,
      usageLimit: voucher.usageLimit || 100,
      usedCount: 0,
      expiresAt: voucher.expiresAt || '2026-12-31',
      status: 'active'
    };
    setVouchers(prev => [newVoucher, ...prev]);
  };

  const toggleVoucherStatus = (voucherId: string) => {
    setVouchers(prev => prev.map(v => {
      if (v.id === voucherId) {
        return { ...v, status: v.status === 'active' ? 'expired' : 'active' };
      }
      return v;
    }));
  };

  const deleteVoucher = (voucherId: string) => {
    setVouchers(prev => prev.filter(v => v.id !== voucherId));
  };

  return (
    <AdminContext.Provider
      value={{
        members,
        suppliers,
        systemConfig,
        vouchers,
        stats,
        auditLogs,
        isLoading,
        fetchAdminData,
        updateMemberRole,
        toggleMemberStatus,
        adjustMemberBalance,
        updateSupplierBalance,
        updateSystemConfig,
        addVoucher,
        toggleVoucherStatus,
        deleteVoucher
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
