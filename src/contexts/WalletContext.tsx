import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  TransactionRecord, 
  TelcoCardSubmission, 
  TopupInvoice, 
  CTVWithdrawal 
} from '../types';
import { INITIAL_CTV_WITHDRAWALS } from '../data/systemExtendedData';
import { useAuth } from './AuthContext';
import { walletApi } from '../api/wallet';

interface WalletContextType {
  transactions: TransactionRecord[];
  telcoCards: TelcoCardSubmission[];
  topupInvoices: TopupInvoice[];
  withdrawals: CTVWithdrawal[];
  isLoading: boolean;
  fetchWalletData: () => Promise<void>;
  addTransaction: (tx: Omit<TransactionRecord, 'id' | 'createdAt'>) => TransactionRecord;
  depositMoney: (amount: number, methodTitle: string) => Promise<{ success: boolean; error?: string }>;
  submitTelcoCard: (submission: { telco: TelcoCardSubmission['telco']; declaredAmount: number; pin: string; serial: string }) => Promise<{ success: boolean; error?: string; receivedAmount?: number }>;
  createTopupInvoice: (invoice: Omit<TopupInvoice, 'id' | 'createdAt' | 'txCode' | 'status'>) => TopupInvoice;
  approveInvoice: (invoiceId: string) => void;
  rejectInvoice: (invoiceId: string, reason?: string) => void;
  requestWithdrawal: (amount: number, bankName: string, accountNo: string, accountName: string) => Promise<{ success: boolean; error?: string }>;
}

const INITIAL_TRANSACTIONS_FALLBACK: TransactionRecord[] = [
  {
    id: 'tx-001',
    type: 'deposit_qr',
    description: 'Nạp tiền tự động qua VietQR (MB Bank)',
    amount: 1000000,
    balanceAfter: 2450000,
    status: 'completed',
    createdAt: 'Hôm nay 15:20',
    txCode: 'VQR882190'
  },
  {
    id: 'tx-002',
    type: 'buy_pool',
    description: 'Gom đơn ChatGPT Plus 1 Tháng (#PL-01)',
    amount: -65000,
    balanceAfter: 1450000,
    status: 'completed',
    createdAt: 'Hôm nay 14:10',
    txCode: 'POOL-9921'
  }
];

const INITIAL_INVOICES_FALLBACK: TopupInvoice[] = [
  {
    id: 'INV-1001',
    txCode: 'VQR-MB-99210',
    userId: 'MB-001',
    userName: 'CyberBuyer_Vn',
    method: 'bank_vietqr',
    amount: 500000,
    receivedAmount: 500000,
    fee: 0,
    status: 'completed',
    createdAt: '2026-08-27 15:10',
    bankInfo: {
      bankName: 'MBBank (Quân Đội)',
      accountNo: '0388999999',
      content: 'NAP CYBER MB001'
    }
  }
];

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { refreshUserProfile } = useAuth();

  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('cyberpool_wallet_txs');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return INITIAL_TRANSACTIONS_FALLBACK;
  });
  const [telcoCards, setTelcoCards] = useState<TelcoCardSubmission[]>([]);
  const [topupInvoices, setTopupInvoices] = useState<TopupInvoice[]>(INITIAL_INVOICES_FALLBACK);
  const [withdrawals, setWithdrawals] = useState<CTVWithdrawal[]>(INITIAL_CTV_WITHDRAWALS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cyberpool_wallet_txs', JSON.stringify(transactions));
    } catch {}
  }, [transactions]);

  const fetchWalletData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await walletApi.getLedger();
      if (res.success && res.data) {
        if (res.data.transactions && res.data.transactions.length > 0) {
          setTransactions(prev => {
            const combined = [...res.data!.transactions];
            // Merge local transactions that aren't on server yet
            prev.forEach(localTx => {
              if (!combined.some(c => c.id === localTx.id || (c.txCode && c.txCode === localTx.txCode))) {
                combined.unshift(localTx);
              }
            });
            return combined;
          });
        }
      }
    } catch {
      // server sync fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const addTransaction = (tx: Omit<TransactionRecord, 'id' | 'createdAt'>): TransactionRecord => {
    const newTx: TransactionRecord = {
      ...tx,
      id: `tx-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: 'Vừa xong'
    };
    setTransactions(prev => {
      const updated = [newTx, ...prev];
      try {
        localStorage.setItem('cyberpool_wallet_txs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    return newTx;
  };

  const depositMoney = async (amount: number, methodTitle: string) => {
    try {
      const res = await walletApi.deposit(amount, methodTitle);
      if (res.success && res.data) {
        if (res.data.transaction) {
          setTransactions(prev => [res.data!.transaction, ...prev]);
        }
        await refreshUserProfile();
        return { success: true };
      }
      return { success: false, error: res.error || 'Nạp tiền thất bại' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Lỗi mạng' };
    }
  };

  const submitTelcoCard = async (submission: { 
    telco: TelcoCardSubmission['telco']; 
    declaredAmount: number; 
    pin: string; 
    serial: string 
  }) => {
    try {
      const res = await walletApi.submitTelcoCard(submission);
      if (res.success && res.data) {
        const received = res.data.receivedAmount || Math.round(submission.declaredAmount * 0.82);
        
        const cardRecord: TelcoCardSubmission = {
          id: `card-${Date.now()}`,
          telco: submission.telco,
          serial: submission.serial,
          pin: submission.pin,
          declaredAmount: submission.declaredAmount,
          receivedAmount: received,
          feePercent: 18,
          status: 'success',
          createdAt: 'Vừa xong',
          txId: `TX-TELCO-${Date.now()}`
        };
        setTelcoCards(prev => [cardRecord, ...prev]);

        if (res.data.transaction) {
          setTransactions(prev => [res.data!.transaction, ...prev]);
        }
        await refreshUserProfile();
        return { success: true, receivedAmount: received };
      }
      return { success: false, error: res.error || 'Thẻ không hợp lệ' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Lỗi mạng' };
    }
  };

  const createTopupInvoice = (invoice: Omit<TopupInvoice, 'id' | 'createdAt' | 'txCode' | 'status'>): TopupInvoice => {
    const newInv: TopupInvoice = {
      ...invoice,
      id: `INV-${Date.now().toString().slice(-4)}`,
      txCode: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'pending',
      createdAt: new Date().toLocaleString('vi-VN')
    };
    setTopupInvoices(prev => [newInv, ...prev]);
    return newInv;
  };

  const approveInvoice = (invoiceId: string) => {
    setTopupInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        depositMoney(inv.receivedAmount, `Duyệt hoá đơn ${inv.txCode}`);
        return { ...inv, status: 'completed' };
      }
      return inv;
    }));
  };

  const rejectInvoice = (invoiceId: string, reason?: string) => {
    setTopupInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, status: 'failed', rejectReason: reason || 'Từ chối bởi Quản trị viên' };
      }
      return inv;
    }));
  };

  const requestWithdrawal = async (amount: number, bankName: string, accountNo: string, accountName: string) => {
    try {
      const res = await walletApi.requestWithdrawal({
        amount,
        bankName,
        accountNumber: accountNo,
        accountName
      });

      if (res.success && res.data) {
        const newW: CTVWithdrawal = {
          id: `wd-${Date.now()}`,
          ctvId: 'usr-buyer-01',
          ctvName: accountName,
          amount,
          bankName,
          accountNumber: accountNo,
          accountName,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        setWithdrawals(prev => [newW, ...prev]);

        if (res.data.transaction) {
          setTransactions(prev => [res.data!.transaction, ...prev]);
        }
        await refreshUserProfile();
        return { success: true };
      }
      return { success: false, error: res.error || 'Rút tiền thất bại' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Lỗi mạng' };
    }
  };

  return (
    <WalletContext.Provider
      value={{
        transactions,
        telcoCards,
        topupInvoices,
        withdrawals,
        isLoading,
        fetchWalletData,
        addTransaction,
        depositMoney,
        submitTelcoCard,
        createTopupInvoice,
        approveInvoice,
        rejectInvoice,
        requestWithdrawal
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
