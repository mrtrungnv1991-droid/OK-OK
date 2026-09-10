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
  Sparkles,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { UserProfile, TransactionRecord, TelcoCardSubmission, SystemConfig, CurrencyCode } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';
import { walletApi } from '../api/wallet';

interface DepositHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  currency?: CurrencyCode;
  initialAmount?: number;
  initialMethod?: any;
  onDepositSuccess: (amount: number, method: string, txCode?: string) => void;
  onOpenCardModal?: () => void;
  transactions?: TransactionRecord[];
  systemConfig?: SystemConfig;
}

const DEPOSIT_PRESETS = [50000, 100000, 200000, 500000, 1000000, 2000000, 5000000];

export const DepositHubModal: React.FC<DepositHubModalProps> = ({
  isOpen,
  onClose,
  user,
  currency = 'VND',
  onDepositSuccess,
  onOpenCardModal,
  transactions = [],
  systemConfig
}) => {
  const { t } = useTranslation();

  const [activeChannel, setActiveChannel] = useState<'vietqr' | 'momo' | 'crypto' | 'ltc' | 'binance' | 'card' | 'history'>('vietqr');
  const [depositAmount, setDepositAmount] = useState<number>(200000);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(900); // 15 mins
  const [binanceTxInput, setBinanceTxInput] = useState('');
  const [ltcCustomInput, setLtcCustomInput] = useState<string>('');
  const [momoTransIdInput, setMomoTransIdInput] = useState('');
  const [cryptoTxHashInput, setCryptoTxHashInput] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [ltcTxHashInput, setLtcTxHashInput] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);
  const [verifiedExplorerUrl, setVerifiedExplorerUrl] = useState<string | null>(null);

  const bankBin = systemConfig?.bankBin || '970422';
  const customQrImage = systemConfig?.bankQrCustomImage || '';
  const initialQrMode = systemConfig?.qrDisplayMode || (customQrImage ? 'custom_image' : 'vietqr_auto');
  const [activeQrView, setActiveQrView] = useState<'vietqr_auto' | 'custom_image'>(initialQrMode);

  useEffect(() => {
    if (systemConfig?.qrDisplayMode) {
      setActiveQrView(systemConfig.qrDisplayMode);
    } else if (systemConfig?.bankQrCustomImage) {
      setActiveQrView('custom_image');
    }
  }, [systemConfig?.qrDisplayMode, systemConfig?.bankQrCustomImage]);

  const transferCode = `CYBER ${user.id.replace('user-', '').toUpperCase()}`;
  const bankAccount = {
    bankName: systemConfig?.bankName || 'MBBank - Ngân Hàng Quân Đội',
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

  // VietQR Dynamic URL (QuickLink compatible with custom Bank BIN)
  const dynamicVietQrUrl = `https://api.vietqr.io/image/${bankBin}-${bankAccount.accountNumber}-compact2.jpg?amount=${depositAmount}&addInfo=${encodeURIComponent(transferCode)}&accountName=${encodeURIComponent(bankAccount.accountHolder)}`;
  const displayQrUrl = activeQrView === 'custom_image' && customQrImage ? customQrImage : dynamicVietQrUrl;

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

  // Clear feedback messages when switching tabs
  useEffect(() => {
    setVerificationError(null);
    setVerificationSuccess(null);
    setVerifiedExplorerUrl(null);
  }, [activeChannel]);

  // Real VietQR Auto Banking API Verification
  const handleVerifyBanking = async () => {
    setIsVerifying(true);
    setVerificationError(null);
    setVerificationSuccess(null);
    try {
      const res = await walletApi.verifyVietQr({
        transferCode,
        amount: depositAmount
      });
      if (res.success && res.data?.verified) {
        setVerificationSuccess(res.data.message || 'Xác minh giao dịch VietQR Napas 24/7 thành công!');
        setTimeout(() => {
          onDepositSuccess(res.data!.amount, 'VietQR Napas 24/7 Auto', res.data!.referenceId);
          onClose();
        }, 1500);
      } else {
        setVerificationError(res.error || res.data?.message || 'Không thể xác minh giao dịch ngân hàng. Vui lòng kiểm tra lại nội dung chuyển khoản.');
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Lỗi mạng hoặc kết nối máy chủ');
    } finally {
      setIsVerifying(false);
    }
  };

  // Real MoMo E-Wallet API Verification
  const handleVerifyMoMo = async () => {
    const cleanTransId = momoTransIdInput.trim();
    if (!cleanTransId) {
      setVerificationError('Vui lòng nhập Mã giao dịch MoMo (Trans ID) từ ứng dụng MoMo của bạn.');
      return;
    }
    setIsVerifying(true);
    setVerificationError(null);
    setVerificationSuccess(null);
    try {
      const res = await walletApi.verifyMoMo({
        transId: cleanTransId,
        amount: depositAmount,
        memo: transferCode
      });
      if (res.success && res.data?.verified) {
        setVerificationSuccess(res.data.message);
        setTimeout(() => {
          onDepositSuccess(res.data!.amount, 'Ví MoMo Auto Gateway', res.data!.referenceId);
          onClose();
        }, 1500);
      } else {
        setVerificationError(res.error || res.data?.message || 'Không thể xác minh giao dịch MoMo. Vui lòng kiểm tra lại Trans ID.');
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Lỗi kết nối máy chủ MoMo');
    } finally {
      setIsVerifying(false);
    }
  };

  // Real Crypto USDT On-Chain Blockchain API Verification
  const handleVerifyCryptoUsdt = async () => {
    const cleanHash = cryptoTxHashInput.trim();
    if (!cleanHash) {
      setVerificationError('Vui lòng dán mã băm giao dịch (TxID / Transaction Hash) từ ví của bạn.');
      return;
    }
    setIsVerifying(true);
    setVerificationError(null);
    setVerificationSuccess(null);
    setVerifiedExplorerUrl(null);
    try {
      const expectedUsdt = Number((depositAmount / usdtAccount.rate).toFixed(2));
      const res = await walletApi.verifyCryptoUsdt({
        txHash: cleanHash,
        network: cryptoNetwork,
        expectedUsdt,
        memo: transferCode
      });
      if (res.success && res.data?.verified) {
        setVerificationSuccess(res.data.message);
        if (res.data.explorerUrl) {
          setVerifiedExplorerUrl(res.data.explorerUrl);
        }
        setTimeout(() => {
          onDepositSuccess(res.data!.amount, `Crypto USDT (${cryptoNetwork})`, res.data!.referenceId);
          onClose();
        }, 1800);
      } else {
        setVerificationError(res.error || res.data?.message || 'Không tìm thấy TxID trên blockchain hoặc chưa đủ block xác nhận.');
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Lỗi kết nối node TronScan / BSC');
    } finally {
      setIsVerifying(false);
    }
  };

  // Real Litecoin LTC Core Mainnet Blockchain Verification
  const handleVerifyLTC = async () => {
    const cleanHash = (ltcTxHashInput || ltcCustomInput).trim();
    if (!cleanHash) {
      setVerificationError('Vui lòng dán mã băm giao dịch Litecoin (LTC TxID) từ ví của bạn.');
      return;
    }
    setIsVerifying(true);
    setVerificationError(null);
    setVerificationSuccess(null);
    setVerifiedExplorerUrl(null);
    try {
      const res = await walletApi.verifyCryptoLtc({
        txHash: cleanHash,
        expectedLtc: Number(calculatedLtcAmount),
        memo: transferCode
      });
      if (res.success && res.data?.verified) {
        setVerificationSuccess(res.data.message);
        if (res.data.explorerUrl) {
          setVerifiedExplorerUrl(res.data.explorerUrl);
        }
        setTimeout(() => {
          onDepositSuccess(res.data!.amount, 'Litecoin (LTC Mainnet Core)', res.data!.referenceId);
          onClose();
        }, 1800);
      } else {
        setVerificationError(res.error || res.data?.message || 'Không tìm thấy giao dịch LTC trên Blockchain hoặc chưa có confirmations.');
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Lỗi kết nối mạng lưới Litecoin');
    } finally {
      setIsVerifying(false);
    }
  };

  // Real Binance Pay OpenAPI Verification
  const handleVerifyBinancePay = async () => {
    const cleanOrderId = binanceTxInput.trim();
    if (!cleanOrderId) {
      setVerificationError('Vui lòng nhập Mã giao dịch Binance Pay (Order ID / Prepay ID).');
      return;
    }
    setIsVerifying(true);
    setVerificationError(null);
    setVerificationSuccess(null);
    try {
      const res = await walletApi.verifyBinancePay({
        orderId: cleanOrderId,
        amount: depositAmount,
        memo: transferCode
      });
      if (res.success && res.data?.verified) {
        setVerificationSuccess(res.data.message);
        setTimeout(() => {
          onDepositSuccess(res.data!.amount, 'Binance Pay Official API', res.data!.referenceId);
          onClose();
        }, 1500);
      } else {
        setVerificationError(res.error || res.data?.message || 'Binance Pay OpenAPI không tìm thấy hoặc chưa thanh toán đơn hàng này.');
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Lỗi kết nối máy chủ Binance Pay');
    } finally {
      setIsVerifying(false);
    }
  };

  const renderVerificationFeedback = () => {
    if (!verificationError && !verificationSuccess) return null;
    return (
      <div className="space-y-2 my-2.5">
        {verificationError && (
          <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn shadow-lg shadow-red-950/20">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{verificationError}</div>
          </div>
        )}
        {verificationSuccess && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 text-xs space-y-2 animate-fadeIn shadow-lg shadow-emerald-950/20">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-bold leading-relaxed">{verificationSuccess}</div>
            </div>
            {verifiedExplorerUrl && (
              <div className="pt-1 border-t border-emerald-500/20">
                <a
                  href={verifiedExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-cyan-300 hover:text-cyan-200 underline font-mono"
                >
                  <span>Xem giao dịch trên Blockchain Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const depositTransactions = transactions.filter(t => t.type.startsWith('deposit'));

  const modulesConfig = systemConfig?.depositModulesConfig;

  const isModuleEnabled = (modId: 'vietqr' | 'momo' | 'crypto' | 'ltc' | 'binance' | 'telco'): boolean => {
    if (!modulesConfig) return true;
    return modulesConfig[modId]?.enabled ?? true;
  };

  const getMaintenanceMsg = (modId: 'vietqr' | 'momo' | 'crypto' | 'ltc' | 'binance' | 'telco'): string => {
    const defaultMessages: Record<string, string> = {
      vietqr: 'Cổng chuyển khoản / VietQR Napas 24/7 đang tạm bảo trì hệ thống.',
      telco: 'Cổng đổi thẻ cào điện thoại Card24h đang tạm dừng để bảo trì API đối tác.',
      momo: 'Cổng ví điện tử MoMo & ZaloPay đang tạm nâng cấp hạ tầng.',
      crypto: 'Cổng nạp Crypto USDT (TRC20 / BEP20) đang bảo trì node blockchain.',
      ltc: 'Cổng nạp Litecoin (LTC Core) đang đồng bộ khối blockchain.',
      binance: 'Cổng Binance Pay tạm dừng kết nối API.'
    };
    return modulesConfig?.[modId]?.maintenanceMessage || defaultMessages[modId] || 'Cổng nạp này đang tạm bảo trì hệ thống. Quý khách vui lòng chọn cổng nạp khác.';
  };

  const renderChannelMaintenance = (channelKey: 'vietqr' | 'momo' | 'crypto' | 'ltc' | 'binance', channelTitle: string) => {
    const msg = getMaintenanceMsg(channelKey);
    const activeAlternates = (['vietqr', 'momo', 'crypto', 'ltc', 'binance'] as const).filter(
      ch => ch !== channelKey && isModuleEnabled(ch)
    );

    return (
      <div className="py-12 px-4 flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-4 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
          <AlertTriangle className="w-8 h-8 animate-bounce" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Cổng Nạp Tạm Dừng / Bảo Trì</span>
          </div>
          <h3 className="text-base font-bold text-white">
            {channelTitle} Đang Tạm Khóa
          </h3>
          <p className="text-xs text-slate-300 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-left leading-relaxed">
            {msg}
          </p>
        </div>

        {activeAlternates.length > 0 && (
          <div className="w-full pt-4 border-t border-slate-800/80 space-y-2.5">
            <p className="text-xs text-slate-400">
              Quý khách vui lòng chuyển sang cổng nạp thay thế đang hoạt động bình thường:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {activeAlternates.map(alt => {
                const names: Record<string, string> = {
                  vietqr: 'VietQR Ngân Hàng',
                  momo: 'Ví MoMo / ZaloPay',
                  crypto: 'Crypto USDT',
                  ltc: 'Litecoin (LTC)',
                  binance: 'Binance Pay'
                };
                return (
                  <button
                    key={alt}
                    type="button"
                    onClick={() => setActiveChannel(alt)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{names[alt]}</span>
                  </button>
                );
              })}
              {onOpenCardModal && isModuleEnabled('telco') && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCardModal();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  <span>Đổi Thẻ Cào Telco ↗</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

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
            {!isModuleEnabled('vietqr') && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-sans font-bold">
                Bảo trì
              </span>
            )}
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
            {!isModuleEnabled('momo') && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-sans font-bold">
                Bảo trì
              </span>
            )}
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
            {!isModuleEnabled('crypto') && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-sans font-bold">
                Bảo trì
              </span>
            )}
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
            {!isModuleEnabled('ltc') && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-sans font-bold">
                Bảo trì
              </span>
            )}
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
            {!isModuleEnabled('binance') && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-sans font-bold">
                Bảo trì
              </span>
            )}
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
              {!isModuleEnabled('telco') && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-sans font-bold">
                  Bảo trì
                </span>
              )}
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
            !isModuleEnabled('vietqr') ? (
              renderChannelMaintenance('vietqr', 'Cổng VietQR Ngân Hàng Napas 24/7')
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: QR Code Visual */}
              <div className="lg:col-span-5 flex flex-col items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3 text-center">
                {/* Switcher if shop uploaded custom QR */}
                {customQrImage && (
                  <div className="w-full flex items-center justify-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveQrView('vietqr_auto')}
                      className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        activeQrView === 'vietqr_auto'
                          ? 'bg-cyan-500 text-black shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>VietQR Tự Động</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveQrView('custom_image')}
                      className={`flex-1 py-1 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        activeQrView === 'custom_image'
                          ? 'bg-purple-500 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>QR Gốc Của Shop</span>
                    </button>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-white shadow-xl relative group">
                  <img
                    src={displayQrUrl}
                    alt={activeQrView === 'custom_image' ? 'Shop Custom QR' : `VietQR ${bankAccount.bankName}`}
                    className="w-56 h-56 object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                        `STK:${bankAccount.accountNumber}|NH:${bankBin}|TIEN:${depositAmount}|ND:${transferCode}`
                      )}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg text-white font-bold text-xs">
                    Quét Bằng App Ngân Hàng / Ví Điện Tử
                  </div>
                </div>

                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-500/30">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>{t('common.status')}: {formatCountdown(countdownSeconds)}</span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 w-full text-left">
                  {activeQrView === 'custom_image' ? (
                    <span>
                      ⚠️ <strong>Lưu ý:</strong> Đang dùng mã QR cá nhân của Shop. Sau khi quét, vui lòng nhập chính xác số tiền <strong className="text-cyan-400">{formatCurrency(depositAmount, user.currency)}</strong> và nội dung <strong className="text-amber-300">{transferCode}</strong> để được cộng tiền tự động.
                    </span>
                  ) : (
                    <span>
                      ✨ <strong>VietQR 24/7:</strong> Quét bằng bất kỳ ứng dụng ngân hàng nào (MB, VCB, Techcombank, Momo...), hệ thống tự động điền sẵn số tiền và mã giao dịch.
                    </span>
                  )}
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

                {renderVerificationFeedback()}

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
                      <span>Đang kiểm tra giao dịch Napas 24/7...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Xác Nhận & Kiểm Tra Giao Dịch Napas (API)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            )
          )}

          {activeChannel === 'momo' && (
            !isModuleEnabled('momo') ? (
              renderChannelMaintenance('momo', 'Ví MoMo / ZaloPay')
            ) : (
            <div className="space-y-4">
              {/* MoMo Amount Selector */}
              <div className="p-4 rounded-xl bg-pink-950/30 border border-pink-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-300 uppercase">1. Chọn số tiền nạp MoMo:</span>
                  <span className="text-sm font-black text-white">{formatCurrency(depositAmount, user.currency)}</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {DEPOSIT_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`p-1.5 rounded-lg border text-center text-xs transition-all cursor-pointer ${
                        depositAmount === amt
                          ? 'bg-pink-600 text-white font-bold border-pink-400 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {formatCurrency(amt, user.currency)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="flex flex-col items-center bg-slate-900/60 p-6 rounded-2xl border border-pink-500/20 space-y-3 text-center">
                  <div className="p-3.5 bg-pink-950/60 rounded-2xl border border-pink-500/40 text-pink-400 shadow-lg shadow-pink-500/10">
                    <Smartphone className="w-12 h-12" />
                  </div>
                  <div className="text-sm font-bold text-white uppercase tracking-wide">Mã Chuyển Tiền MoMo</div>
                  <div className="text-xs text-slate-400">Quét hoặc chuyển qua SĐT MoMo bên cạnh</div>
                </div>

                <div className="space-y-3 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center p-2 rounded bg-black/40">
                    <span className="text-slate-400 text-xs">Số điện thoại:</span>
                    <div className="flex items-center gap-2">
                      <strong className="text-pink-300 font-mono font-bold text-sm">{momoAccount.phone}</strong>
                      <button
                        onClick={() => handleCopy(momoAccount.phone, 'momo_phone')}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                      >
                        {copiedField === 'momo_phone' ? t('common.copied') : t('common.copy')}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2 rounded bg-black/40">
                    <span className="text-slate-400 text-xs">Chủ tài khoản:</span>
                    <strong className="text-white text-xs">{momoAccount.holder}</strong>
                  </div>

                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-red-300 uppercase font-bold">Nội dung chuyển:</div>
                      <div className="text-xs text-yellow-300 font-black tracking-wider mt-0.5">{transferCode}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(transferCode, 'momo_memo')}
                      className="px-2.5 py-1 rounded bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[11px] cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedField === 'momo_memo' ? t('common.copied') : t('common.copy')}</span>
                    </button>
                  </div>

                  {/* MoMo Trans ID Input */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] text-slate-300 font-bold flex items-center justify-between">
                      <span>MÃ GIAO DỊCH MOMO (TRANS ID):</span>
                      <span className="text-[10px] text-pink-400 font-normal">Xem trong Lịch sử MoMo</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 43891028391 hoặc 4481920192"
                      value={momoTransIdInput}
                      onChange={(e) => setMomoTransIdInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-pink-300 font-mono text-xs focus:border-pink-500 outline-none"
                    />
                  </div>

                  {renderVerificationFeedback()}

                  <button
                    type="button"
                    onClick={handleVerifyMoMo}
                    disabled={isVerifying}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.3)] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang truy vấn MoMo OpenAPI...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Xác Minh Giao Dịch MoMo (API Check)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            )
          )}

          {activeChannel === 'crypto' && (
            !isModuleEnabled('crypto') ? (
              renderChannelMaintenance('crypto', 'Cổng Nạp Crypto USDT (TRC20 / BEP20)')
            ) : (
            <div className="space-y-4">
              {/* Crypto Network & Rate Banner */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-emerald-300">TỶ GIÁ QUY ĐỔI USDT:</div>
                  <div className="text-lg font-black text-white mt-0.5">
                    1 USDT = {formatCurrency(usdtAccount.rate, user.currency)}
                  </div>
                  <div className="text-xs text-emerald-400 font-bold mt-1">
                    Số tiền nạp: {formatCurrency(depositAmount, user.currency)} ≈ {(depositAmount / usdtAccount.rate).toFixed(2)} USDT
                  </div>
                </div>

                {/* Network Switcher */}
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-emerald-500/30">
                  <button
                    type="button"
                    onClick={() => setCryptoNetwork('TRC20')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      cryptoNetwork === 'TRC20'
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    TRC20 (Tron)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCryptoNetwork('BEP20')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      cryptoNetwork === 'BEP20'
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    BEP20 (BSC)
                  </button>
                </div>
              </div>

              {/* Amount presets picker */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="text-xs text-slate-300 font-bold">1. Chọn mức nạp VND:</div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {DEPOSIT_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`p-1.5 rounded-lg border text-center text-xs transition-all cursor-pointer ${
                        depositAmount === amt
                          ? 'bg-emerald-500 text-black font-bold border-emerald-400 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {formatCurrency(amt, user.currency)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: USDT QR Code */}
                <div className="lg:col-span-5 flex flex-col items-center bg-slate-900/60 p-4 rounded-2xl border border-emerald-500/20 space-y-3 text-center">
                  <div className="p-2.5 rounded-xl bg-white shadow-xl relative group">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(usdtAccount.address)}`}
                      alt="USDT QR Code"
                      className="w-48 h-48 object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity rounded-lg text-white font-bold text-xs p-2">
                      <span>Mạng {cryptoNetwork}</span>
                    </div>
                  </div>
                  <div className="text-xs text-emerald-400 font-bold bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-500/30">
                    Mạng: {cryptoNetwork} • Xác thực tự động On-Chain
                  </div>
                </div>

                {/* Right: Address and TxID verification */}
                <div className="lg:col-span-7 space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">2. ĐỊA CHỈ VÍ USDT ({cryptoNetwork}):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={usdtAccount.address}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-cyan-300 font-mono font-bold text-xs"
                      />
                      <button
                        onClick={() => handleCopy(usdtAccount.address, 'usdt_addr')}
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedField === 'usdt_addr' ? t('common.copied') : t('common.copy')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-red-300 uppercase font-bold">Nội dung chuyển / Memo:</div>
                      <div className="text-xs text-yellow-300 font-black tracking-wider mt-0.5">{transferCode}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(transferCode, 'usdt_memo')}
                      className="px-2.5 py-1 rounded bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[11px] cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedField === 'usdt_memo' ? t('common.copied') : t('common.copy')}</span>
                    </button>
                  </div>

                  {/* TxID Input Field */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] text-slate-300 font-bold flex items-center justify-between">
                      <span>3. MÃ BĂM GIAO DỊCH (TXID / HASH):</span>
                      <span className="text-[10px] text-emerald-400 font-normal">Từ ví Trust/Binance/OKX</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Dán mã băm TxID (Ví dụ: b3f2a18c09... 64 ký tự)"
                      value={cryptoTxHashInput}
                      onChange={(e) => setCryptoTxHashInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {renderVerificationFeedback()}

                  <button
                    type="button"
                    onClick={handleVerifyCryptoUsdt}
                    disabled={isVerifying}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang quét khối TronScan / BSC...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Xác Minh On-Chain ({cryptoNetwork} API)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            )
          )}

          {/* CHANNEL: LITECOIN (LTC) */}
          {activeChannel === 'ltc' && (
            !isModuleEnabled('ltc') ? (
              renderChannelMaintenance('ltc', 'Cổng Nạp Litecoin (LTC Core)')
            ) : (
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

                  {/* LTC TxID Hash Input */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] text-slate-300 font-bold flex items-center justify-between">
                      <span>3. MÃ BĂM GIAO DỊCH (LTC TXID):</span>
                      <span className="text-[10px] text-blue-400 font-normal">Blockchair / BlockCypher Node</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Dán mã băm LTC TxID (Ví dụ: 8a4c1f9d2...)"
                      value={ltcTxHashInput}
                      onChange={(e) => setLtcTxHashInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-blue-300 font-mono text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {renderVerificationFeedback()}

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
                      <span>Đang truy vấn Blockchair & Cypher API...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Xác Minh Khối Litecoin (Core API)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            )
          )}

          {/* CHANNEL: BINANCE PAY / ID BINANCE (UID) */}
          {activeChannel === 'binance' && (
            !isModuleEnabled('binance') ? (
              renderChannelMaintenance('binance', 'Cổng Binance Pay & UID')
            ) : (
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
                  <label className="text-[11px] text-slate-300 font-bold flex items-center justify-between">
                    <span>MÃ ĐƠN HÀNG / ORDER ID BINANCE PAY:</span>
                    <span className="text-[10px] text-amber-400 font-normal">Xem trong Lịch sử Binance Pay</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 293848192039 hoặc Prepay ID..."
                    value={binanceTxInput}
                    onChange={(e) => setBinanceTxInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono text-xs focus:border-amber-400 outline-none"
                  />
                </div>

                {renderVerificationFeedback()}

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
                      <span>Đang truy vấn Binance Pay OpenAPI...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Xác Minh Binance Pay (OpenAPI v2)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            )
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
