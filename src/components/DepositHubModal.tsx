import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle, 
  ArrowRight, 
  Wallet,
  Coins,
  Smartphone,
  ExternalLink,
  Zap,
  Info,
  Sparkles
} from 'lucide-react';
import { UserProfile, TransactionRecord, TelcoCardSubmission, SystemConfig } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';

interface DepositHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onDepositSuccess: (amount: number, method: string, txCode: string) => void;
  onOpenCardModal?: () => void;
  transactions?: TransactionRecord[];
  systemConfig?: SystemConfig;
}

const DEPOSIT_PRESETS = [50000, 100000, 200000, 500000, 1000000, 2000000, 5000000];

export const DepositHubModal: React.FC<DepositHubModalProps> = ({
  isOpen,
  onClose,
  user,
  onDepositSuccess,
  onOpenCardModal,
  transactions = [],
  systemConfig
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const [activeChannel, setActiveChannel] = useState<'vietqr' | 'momo' | 'crypto' | 'ltc' | 'binance' | 'card' | 'history'>('vietqr');
  const [depositAmount, setDepositAmount] = useState<number>(200000);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(900); // 15 mins
  const [binanceTxInput, setBinanceTxInput] = useState('');
  const [ltcCustomInput, setLtcCustomInput] = useState<string>('');

  const transferCode = `CYBER ${user.id.replace('user-', '').toUpperCase()}`;
  const bankAccount = {
    bankName: systemConfig?.bankName || 'MB BANK',
    bankCode: 'MB',
    accountNumber: systemConfig?.bankAccountNo || '0988889999',
    accountHolder: systemConfig?.bankAccountName || 'CYBERPOOL ESCROW GATEWAY'
  };

  const momoAccount = {
    phone: systemConfig?.momoPhone || '0988889999',
    holder: systemConfig?.momoName || 'CYBERPOOL VIETNAM'
  };

  const usdtAccount = {
    network: 'TRC20 & BEP20',
    address: systemConfig?.cryptoUsdtAddress || 'TWYvQ5X4h3uC48K8kS1mN7kY6Q3kH2g9aB',
    rate: systemConfig?.usdToVndRate || 25400
  };

  const ltcAccount = {
    network: 'Litecoin Core (LTC Mainnet)',
    address: systemConfig?.cryptoLtcAddress || 'LZeE2hL9qHSmV7gJ2wH7QG9Z2C81uYyX3w',
    rate: systemConfig?.cryptoLtcRate || 2150000,
    confirmations: 2
  };

  const binanceAccount = {
    payId: systemConfig?.binancePayId || '582910384',
    uid: systemConfig?.binanceUid || '293847291',
    nickname: systemConfig?.binanceNickname || 'CYBERPOOL_PAY',
    rate: systemConfig?.usdToVndRate || 25400
  };

  // Calculated LTC amount
  const calculatedLtcAmount = (depositAmount / ltcAccount.rate).toFixed(6);

  // VietQR Dynamic URL (QuickLink compatible)
  const vietQrUrl = `https://api.vietqr.io/image/970422-${bankAccount.accountNumber}-compact2.jpg?amount=${depositAmount}&addInfo=${encodeURIComponent(transferCode)}&accountName=${encodeURIComponent(bankAccount.accountHolder)}`;

  // LTC QR Code URL
  const ltcQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `litecoin:${ltcAccount.address}?amount=${calculatedLtcAmount}&label=CyberPool_${user.id}&message=${transferCode}`
  )}`;

  // Binance Pay QR Code URL
  const binanceQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `https://app.binance.com/qr/dop${binanceAccount.payId}?memo=${transferCode}&amount=${(depositAmount / binanceAccount.rate).toFixed(2)}`
  )}`;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Simulate Instant Auto Banking Check
  const handleVerifyBanking = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const fakeTx = `TX-QR-${Math.floor(100000 + Math.random() * 900000)}`;
      onDepositSuccess(depositAmount, 'VietQR Auto', fakeTx);
      onClose();
    }, 1800);
  };

  // Simulate Instant LTC Blockchain Check
  const handleVerifyLTC = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const fakeTx = `LTC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      onDepositSuccess(depositAmount, 'Litecoin (LTC Mainnet)', fakeTx);
      onClose();
    }, 2000);
  };

  // Simulate Instant Binance Pay Webhook Check
  const handleVerifyBinancePay = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const fakeTx = binanceTxInput.trim() ? `BPAY-${binanceTxInput.trim()}` : `BPAY-${Math.floor(100000000 + Math.random() * 900000000)}`;
      onDepositSuccess(depositAmount, 'Binance Pay / UID', fakeTx);
      onClose();
    }, 1800);
  };

  const depositTransactions = transactions.filter(t => t.type.startsWith('deposit'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#090c15] border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#0d1424] to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono font-bold flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                  {t('wallet.deposit_modal_title')}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  AUTO 3-30S
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {t('wallet.bank_transfer')} • {t('wallet.crypto_usdt')} • {t('wallet.momo_wallet')}
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

        {/* Channels Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 px-4 pt-2 gap-2 text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveChannel('vietqr')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeChannel === 'vietqr'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>VietQR Pro</span>
          </button>

          <button
            onClick={() => setActiveChannel('momo')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeChannel === 'momo'
                ? 'border-pink-400 text-pink-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-pink-400" />
            <span>MoMo / ZaloPay</span>
          </button>

          <button
            onClick={() => setActiveChannel('crypto')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeChannel === 'crypto'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>USDT (TRC20 / BEP20)</span>
          </button>

          <button
            onClick={() => setActiveChannel('ltc')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeChannel === 'ltc'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="font-bold">Litecoin (LTC)</span>
          </button>

          <button
            onClick={() => setActiveChannel('binance')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeChannel === 'binance'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 text-black font-black text-[9px] flex items-center justify-center">B</div>
            <span className="font-bold">Binance Pay</span>
          </button>

          {onOpenCardModal && (
            <button
              onClick={() => {
                onClose();
                onOpenCardModal();
              }}
              className="pb-2.5 px-3 border-b-2 border-transparent text-purple-400 hover:text-purple-300 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>{t('nav.telco_exchange')} ↗</span>
            </button>
          )}

          <button
            onClick={() => setActiveChannel('history')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ml-auto cursor-pointer ${
              activeChannel === 'history'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{t('wallet.transaction_history')}</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
              {depositTransactions.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono text-xs">
          {activeChannel === 'vietqr' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: QR Code Visual */}
              <div className="lg:col-span-5 flex flex-col items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3 text-center">
                <div className="p-2.5 rounded-xl bg-white shadow-xl relative group">
                  <img
                    src={vietQrUrl}
                    alt="VietQR MBBank"
                    className="w-56 h-56 object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                        `STK:${bankAccount.accountNumber}|NH:${bankAccount.bankCode}|TIEN:${depositAmount}|ND:${transferCode}`
                      )}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg text-white font-bold text-xs">
                    Scan Mobile Banking App
                  </div>
                </div>

                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-500/30">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>{t('common.status')}: {formatCountdown(countdownSeconds)}</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t('wallet.bank_transfer')}
                </p>
              </div>

              {/* Right Column: Amount Selection & Bank Details */}
              <div className="lg:col-span-7 space-y-4">
                {/* Presets Amount Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200">1. {t('common.amount')}:</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {DEPOSIT_PRESETS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                          depositAmount === amt
                            ? 'bg-cyan-500 text-black font-bold border-cyan-400 shadow-md'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {formatCurrency(amt, user.currency)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transfer Info Details Box */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-white border-b border-slate-800 pb-2">
                    2. {t('common.info')}:
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-black/40">
                    <span className="text-slate-400">Bank:</span>
                    <span className="text-white font-bold">{bankAccount.bankName}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-black/40">
                    <span className="text-slate-400">Account No:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300 font-bold text-sm tracking-wider">{bankAccount.accountNumber}</span>
                      <button
                        onClick={() => handleCopy(bankAccount.accountNumber, 'stk')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                      >
                        {copiedField === 'stk' ? '✓ ' + t('common.copied') : t('common.copy')}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-black/40">
                    <span className="text-slate-400">Account Name:</span>
                    <span className="text-white font-bold">{bankAccount.accountHolder}</span>
                  </div>

                  {/* Crucial Transfer Code Note */}
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-red-300 uppercase font-bold">Memo / Transfer Content:</div>
                      <div className="text-base text-yellow-300 font-black tracking-widest mt-0.5">{transferCode}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(transferCode, 'memo')}
                      className="px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedField === 'memo' ? t('common.copied') : t('common.copy')}</span>
                    </button>
                  </div>
                </div>

                {/* Instant Verification Trigger */}
                <button
                  type="button"
                  onClick={handleVerifyBanking}
                  disabled={isVerifying}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('common.loading')}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>{t('common.confirm')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeChannel === 'momo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex flex-col items-center bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3 text-center">
                <div className="p-3 bg-pink-950/60 rounded-2xl border border-pink-500/40 text-pink-400">
                  <Smartphone className="w-12 h-12" />
                </div>
                <div className="text-sm font-bold text-white">MOMO E-WALLET AUTO</div>
                <div className="text-xs text-slate-400">MoMo Phone Transfer</div>
              </div>

              <div className="space-y-3 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center p-2 rounded bg-black/40">
                  <span className="text-slate-400">Phone:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-pink-300 font-bold">{momoAccount.phone}</strong>
                    <button
                      onClick={() => handleCopy(momoAccount.phone, 'momo_phone')}
                      className="px-2 py-0.5 rounded bg-slate-800 text-[10px] cursor-pointer"
                    >
                      {copiedField === 'momo_phone' ? t('common.copied') : t('common.copy')}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-black/40">
                  <span className="text-slate-400">Holder:</span>
                  <strong className="text-white">{momoAccount.holder}</strong>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-black/40">
                  <span className="text-slate-400">Memo / Note:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-yellow-300 font-bold">{transferCode}</strong>
                    <button
                      onClick={() => handleCopy(transferCode, 'momo_memo')}
                      className="px-2 py-0.5 rounded bg-slate-800 text-[10px] cursor-pointer"
                    >
                      {copiedField === 'momo_memo' ? t('common.copied') : t('common.copy')}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyBanking}
                  disabled={isVerifying}
                  className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>{t('common.confirm')}</span>
                </button>
              </div>
            </div>
          )}

          {activeChannel === 'crypto' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
                <div>
                  <div className="font-bold">USDT RATE:</div>
                  <div className="text-lg font-black text-white mt-0.5">1 USDT = {formatCurrency(usdtAccount.rate, user.currency)}</div>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                  TRC20 & BEP20 (AUTO)
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-300">USDT WALLET ADDRESS (TRC20):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={usdtAccount.address}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-cyan-300 font-bold text-xs"
                  />
                  <button
                    onClick={() => handleCopy(usdtAccount.address, 'usdt_addr')}
                    className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedField === 'usdt_addr' ? t('common.copied') : t('common.copy')}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  {t('wallet.crypto_usdt')}
                </p>
              </div>
            </div>
          )}

          {/* CHANNEL: LITECOIN (LTC) */}
          {activeChannel === 'ltc' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: LTC QR Code */}
              <div className="lg:col-span-5 flex flex-col items-center bg-slate-900/60 p-4 rounded-2xl border border-blue-500/30 space-y-3 text-center">
                <div className="p-2.5 rounded-xl bg-white shadow-xl relative group">
                  <img
                    src={ltcQrUrl}
                    alt="Litecoin LTC QR Code"
                    className="w-52 h-52 object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(ltcAccount.address)}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity rounded-lg text-white font-bold text-xs p-2">
                    <span>Trust Wallet / Binance LTC</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-500/30">
                  <Zap className="w-4 h-4" />
                  <span>Confirmation: {ltcAccount.confirmations} Blocks</span>
                </div>
              </div>

              {/* Right: LTC Details & Rate Calculator */}
              <div className="lg:col-span-7 space-y-3.5">
                {/* LTC Rate Box */}
                <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-300 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[11px] text-blue-300">LTC RATE:</div>
                    <div className="text-base font-black text-white mt-0.5">
                      1 LTC = {formatCurrency(ltcAccount.rate, user.currency)}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                    LTC Core Mainnet
                  </span>
                </div>

                {/* Amount presets picker */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-200">1. {t('common.amount')}:</label>
                    <span className="text-blue-400 font-bold">≈ {calculatedLtcAmount} LTC</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {DEPOSIT_PRESETS.slice(0, 4).map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt)}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          depositAmount === amt
                            ? 'bg-blue-500 text-black font-bold border-blue-400 shadow-md'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {formatCurrency(amt, user.currency)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* LTC Address details box */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-white border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>2. LTC WALLET ADDRESS:</span>
                    <span className="text-[10px] text-blue-400">Network: LTC Core</span>
                  </div>

                  <div className="flex items-center gap-2 bg-black/50 p-2 rounded-lg">
                    <input
                      type="text"
                      readOnly
                      value={ltcAccount.address}
                      className="flex-1 bg-transparent text-blue-300 font-mono font-bold text-xs outline-none"
                    />
                    <button
                      onClick={() => handleCopy(ltcAccount.address, 'ltc_addr')}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedField === 'ltc_addr' ? t('common.copied') : t('common.copy')}</span>
                    </button>
                  </div>

                  {/* Memo */}
                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-red-300 uppercase font-bold">Memo / Note:</div>
                      <div className="text-xs text-yellow-300 font-black tracking-wider mt-0.5">{transferCode}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(transferCode, 'ltc_memo')}
                      className="px-2.5 py-1 rounded bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedField === 'ltc_memo' ? t('common.copied') : t('common.copy')}</span>
                    </button>
                  </div>
                </div>

                {/* Instant Verification Trigger */}
                <button
                  type="button"
                  onClick={handleVerifyLTC}
                  disabled={isVerifying}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('common.loading')}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>{t('common.confirm')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* CHANNEL: BINANCE PAY / ID BINANCE (UID) */}
          {activeChannel === 'binance' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Binance Pay QR */}
              <div className="lg:col-span-5 flex flex-col items-center bg-slate-900/60 p-4 rounded-2xl border border-amber-500/30 space-y-3 text-center">
                <div className="p-2.5 rounded-xl bg-white shadow-xl relative group">
                  <img
                    src={binanceQrUrl}
                    alt="Binance Pay QR Code"
                    className="w-52 h-52 object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                        `https://app.binance.com/qr/dop${binanceAccount.payId}`
                      )}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity rounded-lg text-white font-bold text-xs p-2">
                    <span>Scan on Binance App</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-500/30">
                  <Sparkles className="w-4 h-4" />
                  <span>0% Fee • Auto Instant Match</span>
                </div>
              </div>

              {/* Right: Binance Pay Account Details & Form */}
              <div className="lg:col-span-7 space-y-3.5">
                {/* Binance Rate & Feature Box */}
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[11px] text-amber-300">BINANCE PAY RATE:</div>
                    <div className="text-base font-black text-white mt-0.5">
                      1 USDT = {formatCurrency(binanceAccount.rate, user.currency)}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                    BINANCE INTERNAL 0% FEE
                  </span>
                </div>

                {/* Binance Pay Info Box */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-white border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>BINANCE PAY DETAILS:</span>
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Verified</span>
                  </div>

                  {/* Binance Pay ID */}
                  <div className="flex items-center justify-between p-2 rounded bg-black/40">
                    <span className="text-slate-400 text-[11px]">Binance Pay ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-300 font-mono font-bold text-sm tracking-wider">{binanceAccount.payId}</span>
                      <button
                        onClick={() => handleCopy(binanceAccount.payId, 'binance_pay_id')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                      >
                        {copiedField === 'binance_pay_id' ? t('common.copied') : t('common.copy')}
                      </button>
                    </div>
                  </div>

                  {/* Binance UID */}
                  <div className="flex items-center justify-between p-2 rounded bg-black/40">
                    <span className="text-slate-400 text-[11px]">Binance UID:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300 font-mono font-bold text-xs tracking-wider">{binanceAccount.uid}</span>
                      <button
                        onClick={() => handleCopy(binanceAccount.uid, 'binance_uid')}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                      >
                        {copiedField === 'binance_uid' ? t('common.copied') : t('common.copy')}
                      </button>
                    </div>
                  </div>

                  {/* Memo Transfer Code */}
                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-red-300 uppercase font-bold">Note / Memo:</div>
                      <div className="text-xs text-yellow-300 font-black tracking-wider mt-0.5">{transferCode}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(transferCode, 'binance_memo')}
                      className="px-2.5 py-1 rounded bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedField === 'binance_memo' ? t('common.copied') : t('common.copy')}</span>
                    </button>
                  </div>
                </div>

                {/* Input Binance Order ID / Tx ID */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-300 font-bold">
                    BINANCE ORDER ID / TX ID:
                  </label>
                  <input
                    type="text"
                    placeholder="293848192039..."
                    value={binanceTxInput}
                    onChange={(e) => setBinanceTxInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono text-xs focus:border-amber-400 outline-none"
                  />
                </div>

                {/* Verify Button */}
                <button
                  type="button"
                  onClick={handleVerifyBinancePay}
                  disabled={isVerifying}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('common.loading')}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>{t('common.confirm')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeChannel === 'history' && (
            <div className="space-y-3">
              {depositTransactions.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-slate-900/30 border border-dashed border-slate-800 text-slate-500">
                  {t('errors.not_found')}
                </div>
              ) : (
                depositTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-white font-bold">{tx.description}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {tx.txCode} • {tx.createdAt}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-emerald-400 font-bold text-sm">+{formatCurrency(tx.amount, user.currency)}</div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold">
                        {t('common.completed')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
