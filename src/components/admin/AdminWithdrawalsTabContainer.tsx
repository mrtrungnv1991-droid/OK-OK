// ==============================================================================
// CYBERPOOL FIX: Container nối AdminWithdrawalsTab (trước đây mồ côi — không
// được mount ở đâu, withdrawals chỉ là mock client-side) với withdrawal
// lifecycle API thật: GET /admin/withdrawals, POST approve/reject (reject
// hoàn tiền về ví user qua ledger).
// ==============================================================================
import React, { useState, useEffect, useCallback } from 'react';
import { AdminWithdrawalsTab } from './AdminWithdrawalsTab';
import { adminApi } from '../../api/admin';
import { CTVWithdrawal, Currency } from '../../types';

interface AdminWithdrawalsTabContainerProps {
  currency?: Currency;
}

export const AdminWithdrawalsTabContainer: React.FC<AdminWithdrawalsTabContainerProps> = ({
  currency = 'VND'
}) => {
  const [withdrawals, setWithdrawals] = useState<CTVWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getWithdrawals();
      if (res.data && Array.isArray(res.data.withdrawals)) {
        setWithdrawals(res.data.withdrawals);
      } else {
        setError(res.error || 'Không tải được danh sách rút tiền');
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi mạng khi tải danh sách rút tiền');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals();
    const t = setInterval(fetchWithdrawals, 30000); // auto-refresh 30s
    return () => clearInterval(t);
  }, [fetchWithdrawals]);

  const handleApprove = async (id: string, note?: string) => {
    // Optimistic
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'approved' } : w));
    try {
      await adminApi.approveWithdrawal(id, note);
      await fetchWithdrawals();
    } catch {
      await fetchWithdrawals(); // revert về server state
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'rejected' } : w));
    try {
      await adminApi.rejectWithdrawal(id, reason);
      await fetchWithdrawals();
    } catch {
      await fetchWithdrawals();
    }
  };

  if (loading && withdrawals.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Đang tải danh sách yêu cầu rút tiền từ server...
      </div>
    );
  }

  if (error && withdrawals.length === 0) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="text-rose-400 text-sm font-bold">⚠ {error}</div>
        <button
          onClick={fetchWithdrawals}
          className="px-4 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-bold cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <AdminWithdrawalsTab
      withdrawals={withdrawals}
      onApproveWithdrawal={handleApprove}
      onRejectWithdrawal={handleReject}
      currency={currency}
    />
  );
};
