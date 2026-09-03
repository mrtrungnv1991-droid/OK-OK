import React, { useState } from 'react';
import { 
  X, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Clock, 
  Download, 
  Filter,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { TransactionRecord, UserProfile, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';

interface TransactionLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionRecord[];
  user: UserProfile;
  currency?: CurrencyCode | string;
}

export const TransactionLedgerModal: React.FC<TransactionLedgerModalProps> = ({
  isOpen,
  onClose,
  transactions,
  user,
  currency = user.currency
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const [filterType, setFilterType] = useState<string>('all');

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'all') return true;
    if (filterType === 'deposit') return tx.type.startsWith('deposit');
    if (filterType === 'purchase') return tx.type.startsWith('buy') || tx.type === 'topup_game';
    if (filterType === 'refund') return tx.type === 'escrow_refund';
    if (filterType === 'reward') return tx.type === 'wheel_reward' || tx.type === 'affiliate_commission';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#090c15] border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#0d1222] to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono font-bold flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                TRANSACTION HISTORY & LEDGER
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Complete audit trail of deposits, group purchases, escrow releases, and rewards
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('deposit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filterType === 'deposit'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Deposits
            </button>
            <button
              onClick={() => setFilterType('purchase')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filterType === 'purchase'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Purchases & Top-ups
            </button>
            <button
              onClick={() => setFilterType('reward')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                filterType === 'reward'
                  ? 'bg-cyan-500 text-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Commissions & Rewards
            </button>
          </div>

          <div className="text-xs font-mono text-slate-300">
            Wallet Balance: <strong className="text-cyan-400">{formatCurrency(user.walletBalance, currency)}</strong>
          </div>
        </div>

        {/* Transactions List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-2.5">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-900/30 border border-dashed border-slate-800 text-xs font-mono text-slate-500">
              No transactions matching the selected filter.
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between text-xs font-mono hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPositive
                          ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-800 border border-slate-700 text-slate-300'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="text-white font-bold">{tx.description}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{tx.createdAt}</span>
                        <span>•</span>
                        <span className="text-slate-400">Ref: {tx.txCode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-bold text-sm ${
                        isPositive ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {formatCurrency(tx.amount, currency)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Balance: {formatCurrency(tx.balanceAfter, currency)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
