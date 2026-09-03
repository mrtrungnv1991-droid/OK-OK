import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Share2, 
  Percent, 
  Copy, 
  Code, 
  TrendingUp, 
  CheckCircle2, 
  Award, 
  DollarSign, 
  Key, 
  RefreshCw,
  Sliders,
  ExternalLink,
  CreditCard,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Check,
  ChevronRight,
  Building,
  Smartphone,
  Coins
} from 'lucide-react';
import { UserProfile, AffiliateTier, CTVWithdrawal } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';
import { useUI } from '../contexts/UIContext';

interface AffiliateResellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  currency: 'VND' | 'USD';
  onWithdrawCommission: (amount: number) => void;
  onRequestBankWithdrawal?: (req: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    method: 'bank' | 'momo' | 'usdt';
    type: 'affiliate_commission';
  }) => void;
  withdrawals?: CTVWithdrawal[];
}

const AFFILIATE_TIERS: AffiliateTier[] = [
  { level: 'Bronze', commissionRate: 0.02, minMonthlySales: 0, discountOnStore: 2 },
  { level: 'Silver', commissionRate: 0.035, minMonthlySales: 5000000, discountOnStore: 4 },
  { level: 'Gold', commissionRate: 0.05, minMonthlySales: 20000000, discountOnStore: 6 },
  { level: 'Diamond', commissionRate: 0.08, minMonthlySales: 50000000, discountOnStore: 10 },
];

export const AffiliateResellerModal: React.FC<AffiliateResellerModalProps> = ({
  isOpen,
  onClose,
  user,
  currency,
  onWithdrawCommission,
  onRequestBankWithdrawal,
  withdrawals = []
}) => {
  const { t } = useTranslation();
  const { showToast } = useUI();
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'withdraw_form' | 'withdraw_history' | 'api' | 'tiers'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('cp_live_sec_89f0291ba4c9201948ae88');
  const [webhookUrl, setWebhookUrl] = useState('https://myshop.com/api/cyberpool/webhook');

  // Bank Withdrawal Form State
  const currentCommission = user.affiliateEarnings || 425000;
  const [withdrawAmount, setWithdrawAmount] = useState<number>(currentCommission);
  const [bankName, setBankName] = useState('MB Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState(user.name.toUpperCase());
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'momo' | 'usdt'>('bank');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const refCode = user.affiliateCode || `CYBER-${user.id.slice(0, 4).toUpperCase()}`;
  const referralLink = `https://cyberpool.gg/ref/${refCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    showToast('Đã copy link giới thiệu vào clipboard!', 'info', { duration: 2500 });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedApiKey(true);
    showToast('Đã copy API Key bí mật!', 'info', { duration: 2500 });
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  const handleInstantWalletWithdraw = () => {
    if (currentCommission <= 0) {
      showToast('Không có hoa hồng khả dụng để rút!', 'warning');
      return;
    }
    onWithdrawCommission(currentCommission);
    showToast(`Đã chuyển +${formatCurrency(currentCommission, currency)} hoa hồng vào ví chính thành công!`, 'success', {
      title: '⚡ RÚT HOA HỒNG THÀNH CÔNG'
    });
    setToastNotice(`✓ ${t('common.success')}: +${formatCurrency(currentCommission, currency)}`);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const handleBankWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount < 50000 || withdrawAmount > currentCommission) {
      showToast('Số tiền rút tối thiểu là 50,000đ và không vượt quá số dư hoa hồng!', 'error');
      return;
    }
    if (!accountNumber.trim()) {
      showToast('Vui lòng nhập số tài khoản ngân hàng nhận tiền!', 'warning');
      return;
    }

    if (onRequestBankWithdrawal) {
      onRequestBankWithdrawal({
        amount: withdrawAmount,
        bankName,
        accountNumber,
        accountName,
        method: paymentMethod,
        type: 'affiliate_commission'
      });
    }

    showToast(`Đã gửi yêu cầu rút hoa hồng ${formatCurrency(withdrawAmount, currency)} về ${bankName}!`, 'success', {
      title: '✓ GỬI YÊU CẦU RÚT HOA HỒNG'
    });
    setActiveTab('withdraw_history');
    setToastNotice(`✓ ${t('common.success')}: ${formatCurrency(withdrawAmount, currency)} -> ${bankName}`);
    setTimeout(() => setToastNotice(null), 4000);
  };

  // Filter affiliate withdrawal records for this user
  const userWithdrawals = withdrawals.filter(
    w => w.ctvId === user.id || w.ctvName.includes(user.name) || w.withdrawalType === 'affiliate_commission'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#0a0d16] border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#0a1524] to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2">
                <span>{t('nav.affiliate')}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-500/30 uppercase">
                  ACTIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {t('affiliate.description')}
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

        {/* Action Notice */}
        {toastNotice && (
          <div className="p-3 bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{toastNotice}</span>
          </div>
        )}

        {/* Subtabs Header */}
        <div className="flex border-b border-slate-800 bg-slate-950/70 p-1.5 gap-1.5 font-mono text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-black shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t('affiliate.tab_overview')}</span>
          </button>

          <button
            onClick={() => setActiveTab('withdraw_form')}
            className={`py-2 px-3 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'withdraw_form'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-300" />
            <span>{t('affiliate.withdraw_btn')}</span>
          </button>

          <button
            onClick={() => setActiveTab('withdraw_history')}
            className={`py-2 px-3 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'withdraw_history'
                ? 'bg-slate-800 text-cyan-300 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{t('affiliate.tab_history')} ({userWithdrawals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`py-2 px-3 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'api'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>{t('affiliate.tab_api')}</span>
          </button>

          <button
            onClick={() => setActiveTab('tiers')}
            className={`py-2 px-3 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'tiers'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>{t('affiliate.tab_tiers')}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 font-mono text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial stats summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Commission Card with 2 Clear Withdrawal Actions */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-[#0e181d] border border-emerald-500/40 space-y-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{t('affiliate.commission_available')}:</span>
                    <span className="text-[10px] text-emerald-400 font-bold">{t('common.status')}</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400">
                    {formatCurrency(currentCommission, currency)}
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 pt-1">
                    <button
                      onClick={handleInstantWalletWithdraw}
                      className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md"
                    >
                      <span>⚡ {t('affiliate.withdraw_btn')} ({t('nav.wallet')})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('withdraw_form')}
                      className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all"
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>{t('affiliate.withdraw_btn')} (Bank / MoMo)</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] text-slate-400">{t('affiliate.invited_count')}:</div>
                  <div className="text-2xl font-black text-cyan-300">
                    48
                  </div>
                  <div className="text-[10px] text-slate-500">18 orders completed</div>
                  <div className="text-[10px] text-emerald-400 pt-1">Sales: 28,500,000 ₫</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] text-slate-400">{t('affiliate.current_tier')}:</div>
                  <div className="text-lg font-black text-amber-400 flex items-center gap-1">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Gold (5%)</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Wholesale discount 6%</div>
                  <div className="text-[10px] text-cyan-400 pt-1">Next: Diamond (8%)</div>
                </div>
              </div>

              {/* Referral Link Sharing Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-slate-900 to-[#0e1626] border border-cyan-500/30 space-y-3">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>{t('affiliate.referral_link')}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="flex-1 bg-black/80 border border-slate-700 rounded-lg p-2.5 text-xs text-cyan-300 font-bold"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? t('common.copied') : t('common.copy')}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  {t('affiliate.description')}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: FORM RÚT TIỀN VỀ NGÂN HÀNG */}
          {activeTab === 'withdraw_form' && (
            <form onSubmit={handleBankWithdrawSubmit} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">{t('affiliate.commission_available')}:</div>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">
                    {formatCurrency(currentCommission, currency)}
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400">
                  <div>Min: <span className="text-white font-bold">50.000 ₫</span></div>
                  <div className="text-emerald-400 font-bold">Fee: 0₫</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">{t('topup.amount')} (*):</label>
                  <input
                    type="number"
                    required
                    min={50000}
                    max={currentCommission}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-emerald-400 font-bold text-xs focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">{t('topup.choose_method')}:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-white text-xs"
                  >
                    <option value="bank">Bank (VietQR 24/7)</option>
                    <option value="momo">MoMo Wallet</option>
                    <option value="usdt">Crypto USDT (TRC20)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">Bank (*):</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-cyan-300 text-xs"
                  >
                    <option value="MB Bank">MB Bank</option>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="Techcombank">Techcombank</option>
                    <option value="ACB">ACB</option>
                    <option value="VPBank">VPBank</option>
                    <option value="TPBank">TPBank</option>
                    <option value="BIDV">BIDV</option>
                    <option value="VietinBank">VietinBank</option>
                    <option value="MoMo">MoMo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">Account / Wallet Number (*):</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="VD: 0912345678..."
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-amber-300 font-bold text-xs focus:border-cyan-500"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <label className="text-[11px] text-slate-400 font-bold">Account Holder Name (*):</label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                    placeholder="FULL NAME..."
                    className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-white font-bold text-xs uppercase focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-300 font-sans flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Admin auto-review & processing within 5-15 mins.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-98 transition-all"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{t('affiliate.withdraw_btn')}</span>
              </button>
            </form>
          )}

          {/* TAB 3: LỊCH SỬ RÚT HOA HỒNG */}
          {activeTab === 'withdraw_history' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-white uppercase flex items-center justify-between">
                <span>{t('affiliate.tab_history')}</span>
                <span className="text-[10px] text-emerald-400 font-bold">Live Sync</span>
              </div>

              {userWithdrawals.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-black/40 rounded-xl border border-slate-800 font-sans">
                  {t('wallet.no_transactions')}
                </div>
              ) : (
                <div className="space-y-2">
                  {userWithdrawals.map(w => (
                    <div key={w.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-cyan-300">#{w.id}</span>
                          <span className="text-[10px] text-slate-400">{w.createdAt}</span>
                        </div>
                        <div className="text-xs font-bold text-emerald-400 mt-1">
                          {formatCurrency(w.amount, currency)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {w.bankName} - <span className="text-amber-300">{w.accountNumber}</span> ({w.accountName})
                        </div>
                        {w.note && <div className="text-[10px] text-slate-500 italic mt-0.5">"{w.note}"</div>}
                      </div>

                      <div className="text-right">
                        {w.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse">
                            Pending
                          </span>
                        )}
                        {w.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            Approved
                          </span>
                        )}
                        {w.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: API RESELLER */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-cyan-400" />
                    <span>RESELLER SECRET API KEY</span>
                  </span>
                  <button
                    onClick={() => setApiKey(`cp_live_sec_${Math.random().toString(36).substring(2)}`)}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh Key</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={apiKey}
                    className="flex-1 bg-black/80 border border-slate-800 rounded-lg p-2.5 text-xs text-cyan-300"
                  />
                  <button
                    onClick={handleCopyKey}
                    className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedApiKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedApiKey ? t('common.copied') : t('common.copy')}</span>
                  </button>
                </div>
              </div>

              {/* Webhook Endpoint */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-bold">WEBHOOK CALLBACK URL</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* TAB 5: TIERS */}
          {activeTab === 'tiers' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-bold uppercase">
                {t('affiliate.tab_tiers')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AFFILIATE_TIERS.map((tier, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{tier.level}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 font-bold">
                        {(tier.commissionRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Min monthly sales: <strong className="text-cyan-300">{formatCurrency(tier.minMonthlySales, currency)}</strong>
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      Discount: {tier.discountOnStore}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between font-mono">
          <div className="text-xs text-slate-400">
            {t('affiliate.referral_code')}: <strong className="text-cyan-400">{refCode}</strong>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
