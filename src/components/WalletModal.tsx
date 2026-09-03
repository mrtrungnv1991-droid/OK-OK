import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  QrCode, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles,
  Lock,
  Landmark,
  CreditCard,
  Clock,
  Coins,
  Smartphone,
  Zap
} from 'lucide-react';
import { UserProfile, CTVWithdrawal } from '../types';
import { formatCurrency, generateTxHash } from '../utils/formatters';
import { useTranslation } from '../i18n';
import { useUI } from '../contexts/UIContext';

interface WalletModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => void;
  onRequestWithdrawal?: (req: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    method: 'bank' | 'momo' | 'usdt';
    type: 'wallet_balance';
  }) => void;
  withdrawals?: CTVWithdrawal[];
}

export const WalletModal: React.FC<WalletModalProps> = ({
  user,
  isOpen,
  onClose,
  onDeposit,
  onRequestWithdrawal,
  withdrawals = []
}) => {
  const { t } = useTranslation();
  const { showToast } = useUI();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [selectedMethod, setSelectedMethod] = useState<'vietqr' | 'momo' | 'usdt' | 'ltc' | 'binance'>('vietqr');
  const [depositAmount, setDepositAmount] = useState<number>(200000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(Math.min(user.walletBalance, 100000) || 50000);
  const [withdrawBank, setWithdrawBank] = useState('MB Bank');
  const [withdrawAccountNo, setWithdrawAccountNo] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState(user.name.toUpperCase());
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'momo' | 'usdt' | 'crypto_ltc' | 'binance_pay'>('bank');

  if (!isOpen) return null;

  const quickAmounts = [100000, 200000, 500000, 1000000, 2000000];

  const handleConfirmDeposit = () => {
    setIsProcessing(true);
    setSuccessMsg('');
    setTimeout(() => {
      onDeposit(depositAmount);
      setIsProcessing(false);
      showToast(`Đã nạp thành công +${formatCurrency(depositAmount, user.currency)} vào ví Escrow!`, 'success', {
        title: '⚡ NẠP TIỀN THÀNH CÔNG'
      });
      setSuccessMsg(`✓ Successfully deposited +${formatCurrency(depositAmount, user.currency)} into Escrow Wallet!`);
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    }, 800);
  };

  const handleConfirmWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0 || withdrawAmount > user.walletBalance) {
      showToast('Số tiền rút không hợp lệ hoặc vượt quá số dư khả dụng!', 'error', {
        title: 'LỖI RÚT TIỀN'
      });
      return;
    }
    if (!withdrawAccountNo.trim()) {
      showToast('Vui lòng nhập số tài khoản / địa chỉ ví nhận tiền!', 'warning', {
        title: 'THIẾU THÔNG TIN'
      });
      return;
    }

    if (onRequestWithdrawal) {
      onRequestWithdrawal({
        amount: withdrawAmount,
        bankName: withdrawBank,
        accountNumber: withdrawAccountNo,
        accountName: withdrawAccountName,
        method: withdrawMethod as any,
        type: 'wallet_balance'
      });
    }

    showToast(`Đã gửi yêu cầu rút ${formatCurrency(withdrawAmount, user.currency)} về ${withdrawBank}! Đang chờ duyệt.`, 'success', {
      title: '✓ GỬI YÊU CẦU THÀNH CÔNG'
    });
    setSuccessMsg(`✓ Withdrawal request for ${formatCurrency(withdrawAmount, user.currency)} to ${withdrawBank} submitted for admin review!`);
    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  // Filter user's withdrawals
  const userWithdrawals = withdrawals.filter(w => w.ctvId === user.id || w.ctvName.includes(user.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0b0e17] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#0d1322] to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2">
                <span>ESCROW WALLET & FUNDS</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 uppercase">
                  100% SECURE
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Instant deposit & withdrawal 24/7, guaranteed escrow protection
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5 font-mono text-xs">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'deposit'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-300" />
            <span>DEPOSIT FUNDS</span>
          </button>

          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'withdraw'
                ? 'bg-cyan-600 text-black shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-cyan-300" />
            <span>WITHDRAW FUNDS</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-4 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-800 text-cyan-300 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Withdrawals ({userWithdrawals.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 font-mono text-xs">
          {/* Balance Pod */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-[#111624] border border-slate-800">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Available Balance:</span>
                <span className="text-[10px] text-emerald-400">Ready to spend</span>
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {formatCurrency(user.walletBalance, user.currency)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Ready for slot locking & instant buy
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-[#111624] border border-slate-800">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Locked in Pool Escrow:</span>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400 mt-1">
                {formatCurrency(user.escrowLocked, user.currency)}
              </div>
              <div className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Auto-refund if pool fails or expires
              </div>
            </div>
          </div>

          {/* TAB 1: NẠP TIỀN */}
          {activeTab === 'deposit' && (
            <div className="space-y-4">
              {/* Deposit Methods */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Deposit Gateway:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('vietqr')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedMethod === 'vietqr'
                        ? 'bg-cyan-950 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-cyan-300 flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5" />
                      <span>VietQR</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">24/7 Auto</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('momo')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedMethod === 'momo'
                        ? 'bg-pink-950 border-pink-400 text-white shadow-[0_0_12px_rgba(244,114,182,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-pink-400 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>MoMo Wallet</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Auto 2s</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('usdt')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedMethod === 'usdt'
                        ? 'bg-emerald-950 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-emerald-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      <span>USDT</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">TRC20</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('ltc')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedMethod === 'ltc'
                        ? 'bg-blue-950 border-blue-400 text-white shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-blue-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Litecoin</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">LTC Node</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('binance')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedMethod === 'binance'
                        ? 'bg-amber-950 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-amber-400 flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-amber-400 text-black font-black text-[8px] flex items-center justify-center">B</div>
                      <span>Binance</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">0% Fee</div>
                  </button>
                </div>
              </div>

              {/* Quick Amount Selector */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Deposit Amount:
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`px-3 py-2 rounded-lg text-xs border transition-all cursor-pointer ${
                        depositAmount === amt
                          ? 'bg-cyan-500 text-black border-cyan-400 font-black'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {formatCurrency(amt, user.currency)}
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Code & Simulation Box */}
              <div className="p-4 rounded-xl bg-black/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 bg-white p-2 rounded-lg shrink-0 flex items-center justify-center">
                  <QrCode className="w-20 h-20 text-black" />
                </div>

                <div className="space-y-1 text-xs text-slate-300">
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Instant Deposit Simulation Gateway</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Click <strong>Confirm Deposit</strong> below to deposit funds into your Escrow wallet.
                  </p>
                  <div className="text-[10px] text-emerald-400">
                    Tx ID: {generateTxHash()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RÚT TIỀN VỀ NGÂN HÀNG */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleConfirmWithdraw} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-[11px] text-cyan-300 font-sans space-y-1">
                <div className="font-bold flex items-center gap-1.5 font-mono text-cyan-200">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>WITHDRAWAL POLICY & ESCROW</span>
                </div>
                <p>
                  • Minimum withdrawal: <strong>50,000 ₫</strong>. 0% processing fee.
                </p>
                <p>
                  • Payout requests are routed to the <strong>Root Admin Panel</strong> for fast disbursement within 5 - 15 minutes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">Withdraw Amount (*):</label>
                  <input
                    type="number"
                    required
                    min={50000}
                    max={user.walletBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-emerald-400 font-bold text-xs focus:border-cyan-500"
                  />
                  <div className="text-[10px] text-slate-500">
                    Max Available: {formatCurrency(user.walletBalance, user.currency)}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">Payout Method:</label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => {
                      const m = e.target.value as any;
                      setWithdrawMethod(m);
                      if (m === 'crypto_ltc') {
                        setWithdrawBank('Litecoin (LTC Mainnet)');
                      } else if (m === 'binance_pay') {
                        setWithdrawBank('Binance Pay / UID');
                      } else if (m === 'usdt') {
                        setWithdrawBank('USDT (TRC20 / BEP20)');
                      } else if (m === 'momo') {
                        setWithdrawBank('MoMo Wallet');
                      } else {
                        setWithdrawBank('MB Bank');
                      }
                    }}
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-white text-xs cursor-pointer"
                  >
                    <option value="bank">Bank Transfer (VietQR 24/7)</option>
                    <option value="momo">MoMo E-Wallet</option>
                    <option value="usdt">Crypto USDT (TRC20 / BEP20)</option>
                    <option value="crypto_ltc">Crypto Litecoin (LTC Core)</option>
                    <option value="binance_pay">Binance Pay / Binance UID</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">
                    {withdrawMethod === 'crypto_ltc' || withdrawMethod === 'binance_pay' || withdrawMethod === 'usdt'
                      ? 'Network / Destination (*):'
                      : 'Receiving Bank (*):'}
                  </label>
                  {withdrawMethod === 'bank' ? (
                    <select
                      value={withdrawBank}
                      onChange={(e) => setWithdrawBank(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-cyan-300 text-xs cursor-pointer"
                    >
                      <option value="MB Bank">MB Bank</option>
                      <option value="Vietcombank">Vietcombank</option>
                      <option value="Techcombank">Techcombank</option>
                      <option value="ACB">ACB</option>
                      <option value="VPBank">VPBank</option>
                      <option value="TPBank">TPBank</option>
                      <option value="BIDV">BIDV</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value={withdrawBank}
                      className="w-full px-3 py-2 bg-black/70 border border-slate-800 rounded-lg text-cyan-300 font-bold text-xs"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">
                    {withdrawMethod === 'crypto_ltc'
                      ? 'Litecoin LTC Address (*):'
                      : withdrawMethod === 'binance_pay'
                      ? 'Binance Pay ID / UID (*):'
                      : withdrawMethod === 'usdt'
                      ? 'USDT Wallet Address (*):'
                      : 'Account / Phone Number (*):'}
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawAccountNo}
                    onChange={(e) => setWithdrawAccountNo(e.target.value)}
                    placeholder={
                      withdrawMethod === 'crypto_ltc'
                        ? 'e.g. LZeE2hL9qHSmV7gJ2wH7QG9Z2C81uYyX3w...'
                        : withdrawMethod === 'binance_pay'
                        ? 'e.g. 582910384 (Pay ID)...'
                        : withdrawMethod === 'usdt'
                        ? 'e.g. TWYvQ5X4h3uC48K8kS1mN7kY6Q3kH2g9aB...'
                        : 'e.g. 0912345678...'
                    }
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-amber-300 font-bold text-xs focus:border-cyan-500"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">Beneficiary Name (*):</label>
                  <input
                    type="text"
                    required
                    value={withdrawAccountName}
                    onChange={(e) => setWithdrawAccountName(e.target.value.toUpperCase())}
                    placeholder="JOHN DOE..."
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-white font-bold text-xs uppercase focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-98 transition-all"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Submit Withdrawal Request</span>
              </button>
            </form>
          )}

          {/* TAB 3: LỊCH SỬ RÚT TIỀN */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-white uppercase flex items-center justify-between">
                <span>WITHDRAWAL REQUEST HISTORY</span>
                <span className="text-[10px] text-cyan-400">Directly synchronized with Admin Panel</span>
              </div>

              {userWithdrawals.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-black/40 rounded-xl border border-slate-800">
                  No withdrawal requests found.
                </div>
              ) : (
                <div className="space-y-2">
                  {userWithdrawals.map(w => (
                    <div key={w.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">#{w.id}</span>
                          <span className="text-[10px] text-slate-400">{w.createdAt}</span>
                        </div>
                        <div className="text-xs font-bold text-emerald-400 mt-1">
                          {formatCurrency(w.amount, user.currency)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {w.bankName} - Account: <span className="text-amber-300">{w.accountNumber}</span> ({w.accountName})
                        </div>
                        {w.note && <div className="text-[10px] text-slate-500 italic mt-0.5">"{w.note}"</div>}
                      </div>

                      <div className="text-right">
                        {w.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse">
                            Pending Review
                          </span>
                        )}
                        {w.status === 'approved' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            Paid / Approved
                          </span>
                        )}
                        {w.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                            Rejected / Refunded
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer for Deposit Tab */}
        {activeTab === 'deposit' && (
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#0a0d14] flex items-center justify-between font-mono">
            <div className="text-xs text-slate-400">
              Deposit Amount: <span className="text-cyan-400 font-bold">{formatCurrency(depositAmount, user.currency)}</span>
            </div>

            <button
              type="button"
              onClick={handleConfirmDeposit}
              disabled={isProcessing}
              className="flex items-center gap-2 py-2 px-5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'Processing...' : 'Confirm Deposit'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
