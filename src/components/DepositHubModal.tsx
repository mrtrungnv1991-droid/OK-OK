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
import { CryptoGatePanel } from './CryptoGatePanel';

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

  const [activeChannel, setActiveChannel] = useState<'vietqr' | 'momo' | 'cryptogate' | 'crypto' | 'ltc' | 'binance' | 'card' | 'history'>('vietqr');
  const [depositAmount, setDepositAmount] = useState<number>(200000);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(900); // 15 mins
  const [binanceTxInput, setBinanceTxInput] = useState('');
  const [momoTransIdInput, setMomoTransIdInput] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
    const [verificationSuccess, setVerificationSuccess] = useState<string | null>(null);
    const [verifiedExplorerUrl, setVerifiedExplorerUrl] = useState<string | null>(null);
    // CYBERPOOL FIX: lệnh thu tiền thật từ Binance Pay / MoMo (checkout URL + QR)
    const [binanceCheckout, setBinanceCheckout] = useState<{ checkoutUrl?: string; qrContent?: string; prepayId?: string } | null>(null);
    const [momoPayment, setMoMoPayment] = useState<{ payUrl?: string; qrCodeUrl?: string; orderId?: string } | null>(null);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);

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

  // CYBERPOOL FIX: user ids are 'usr-<slug>'. The old `.replace('user-','')`
  // never matched (prefix is 'usr-') so the memo contained the raw id in
  // UPPERCASE ('CYBER USR-BUYER-01'), which the webhook lookup then failed to
  // match against the lowercase key — every real deposit fell into the
  // unmapped queue forever. Use the raw lowercase id and let the webhook
  // normalize case on its side.
  const transferCode = `CYBER ${user.id}`;
  const bankAccount = {
    bankName: systemConfig?.bankName || 'MBBank - Ngân Hàng Quân Đội',
    bankCode: 'MB',
    // CYBERPOOL FIX (#6 frontend audit): KHÔNG fallback số tài khoản giả —
    // user sẽ chuyển tiền thật vào số placeholder. Rỗng = chưa cấu hình,
    // UI hiển thị cảnh báo + chặn copy/QR.
    accountNumber: systemConfig?.bankAccountNo || '',
    accountHolder: systemConfig?.bankAccountName || 'CYBERPOOL ESCROW GATEWAY'
  };

  const momoAccount = {
    phone: systemConfig?.momoPhone || '',
    holder: systemConfig?.momoName || 'CYBERPOOL VIETNAM'
  };

  // CYBERPOOL CRYPTOGATE: usdtAccount/ltcAccount (kênh crypto/ltc cũ 1-ví) đã gỡ
  // — CryptoGatePanel lấy ví đa mạng từ GET /wallet/crypto-gate/networks.

  const binanceAccount = {
      // CYBERPOOL FIX: không hardcode Pay ID/UID giả làm default — cấu hình từ
      // systemConfig khi admin nhập thật; nút "Tạo Lệnh" (checkout thật) không
      // phụ thuộc các giá trị này nữa.
      payId: systemConfig?.binancePayId || '',
      uid: systemConfig?.binanceUid || '',
      nickname: systemConfig?.binanceNickname || '',
      rate: systemConfig?.usdToVndRate || 25400
    };

  // VietQR Dynamic URL (QuickLink compatible with custom Bank BIN)
  const dynamicVietQrUrl = `https://api.vietqr.io/image/${bankBin}-${bankAccount.accountNumber}-compact2.jpg?amount=${depositAmount}&addInfo=${encodeURIComponent(transferCode)}&accountName=${encodeURIComponent(bankAccount.accountHolder)}`;
  const displayQrUrl = activeQrView === 'custom_image' && customQrImage ? customQrImage : dynamicVietQrUrl;

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
  // CYBERPOOL FIX: tạo lệnh thu tiền thật từ MoMo captureWallet
  const handleCreateMoMoPayment = async () => {
    if (!depositAmount || depositAmount <= 0) {
      setVerificationError('Vui lòng nhập số tiền nạp hợp lệ.');
      return;
    }
    setIsCreatingOrder(true);
    setVerificationError(null);
    setVerificationSuccess(null);
    try {
      const res = await walletApi.createMoMoPayment({
        amount: depositAmount,
        redirectUrl: typeof window !== 'undefined' ? window.location.origin + '/wallet' : undefined
      });
      if (res.success && res.data && (res.data as any).payUrl) {
        setMoMoPayment({
          payUrl: (res.data as any).payUrl,
          qrCodeUrl: (res.data as any).qrCodeUrl,
          orderId: (res.data as any).orderId
        });
        setVerificationSuccess('Đã tạo lệnh thanh toán MoMo thành công! Mở payUrl hoặc quét QR trong app MoMo để trả tiền.');
      } else {
        setVerificationError((res.data as any)?.message || res.error || 'Không tạo được lệnh MoMo.');
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Lỗi kết nối máy chủ MoMo');
    } finally {
      setIsCreatingOrder(false);
    }
  };

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

  // CYBERPOOL CRYPTOGATE: hai handler verify thủ công cũ (handleVerifyCryptoUsdt
  // / handleVerifyLTC) đã bị GỠ cùng kênh 'crypto'/'ltc' cũ — chúng trỏ tới các
  // endpoint dùng TronScan/BscScan-V1 đã CHẾT (404/deprecated) và đọc
  // cryptoUsdtAddress giờ để trống (fail-closed). CryptoGatePanel thay thế hoàn
  // toàn bằng verify-tx on-chain thật (TronGrid/publicnode/BlockCypher).

  // CYBERPOOL FIX: tạo lệnh thu tiền thật từ Binance Pay (Mô hình A)
    const handleCreateBinanceOrder = async () => {
      if (!depositAmount || depositAmount <= 0) {
        setVerificationError('Vui lòng nhập số tiền nạp hợp lệ.');
        return;
      }
      setIsCreatingOrder(true);
      setVerificationError(null);
      setVerificationSuccess(null);
      try {
        const res = await walletApi.createBinancePayOrder({
          amount: depositAmount,
          returnUrl: typeof window !== 'undefined' ? window.location.origin + '/wallet' : undefined,
          cancelUrl: typeof window !== 'undefined' ? window.location.origin + '/wallet' : undefined
        });
        if (res.success && res.data && (res.data as any).checkoutUrl) {
          setBinanceCheckout({
            checkoutUrl: (res.data as any).checkoutUrl,
            qrContent: (res.data as any).qrContent,
            prepayId: (res.data as any).prepayId
          });
          setVerificationSuccess('Đã tạo lệnh thanh toán Binance Pay thành công! Mở ngân hàng Binance hoặc quét QR để trả tiền.');
        } else {
          setVerificationError((res.data as any)?.message || res.error || 'Không tạo được lệnh Binance Pay.');
        }
      } catch (err: any) {
        setVerificationError(err?.message || 'Lỗi kết nối máy chủ Binance Pay');
      } finally {
        setIsCreatingOrder(false);
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

      // CYBERPOOL FIX: fail-closed UI — cổng nạp CHƯA được cấu hình ví/credential thật
      // thì chặn toàn bộ (không cho user chuyển tiền vào địa chỉ placeholder).
      const renderChannelNotConfigured = (
        channelKey: 'vietqr' | 'momo' | 'crypto' | 'ltc' | 'binance',
        channelTitle: string,
        hint: string
      ) => {
        const activeAlternates = (['vietqr', 'momo', 'crypto', 'ltc', 'binance'] as const).filter(
          ch => ch !== channelKey && isModuleEnabled(ch)
        );

        return (
          <div className="py-12 px-4 flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-4 font-sans">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/40 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span>Cổng Chưa Sẵn Sàng</span>
              </div>
              <h3 className="text-base font-bold text-white">
                {channelTitle} Chưa Được Cấu Hình
              </h3>
              <p className="text-xs text-slate-300 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-left leading-relaxed">
                {hint}
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

          {/* CYBERPOOL CRYPTOGATE: thay 2 tab crypto/ltc cũ (1 ví USDT chung +
              LTC) bằng 1 tab hợp nhất multi-network direct-to-wallet */}
          <button
            onClick={() => setActiveChannel('cryptogate')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeChannel === 'cryptogate'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>Crypto (USDT/LTC 5 Mạng)</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-sans font-bold">
              AUTO
            </span>
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
            ) : !bankAccount.accountNumber ? (
              renderChannelNotConfigured(
                'vietqr',
                'Cổng VietQR Ngân Hàng Napas 24/7',
                'Shop chưa cấu hình số tài khoản ngân hàng nhận tiền (systemConfig.bankAccountNo). ' +
                'Quản trị vui lòng vào Admin Panel → Tài Chính → Nạp Tiền để nhập thông tin tài khoản thật ' +
                'trước khi mở cổng này. Hiện cổng tạm khóa để tránh khách chuyển tiền sai địa chỉ.'
              )
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
            ) : !momoAccount.phone ? (
              renderChannelNotConfigured(
                'momo',
                'Ví MoMo / ZaloPay',
                'Shop chưa cấu hình số điện thoại ví MoMo nhận tiền (systemConfig.momoPhone). ' +
                'Quản trị vui lòng vào Admin Panel → Tài Chính → Nạp Tiền → mục MoMo để nhập SĐT ví thật ' +
                'trước khi mở cổng này. Hiện cổng tạm khóa để tránh khách chuyển tiền sai ví.'
              )
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

                  {/* CYBERPOOL FIX: nút tạo lệnh thu tiền thật MoMo (thay vì chỉ chuyển khoản tay) */}
                                    {momoPayment?.payUrl && (
                                      <div className="space-y-2 pt-1">
                                        <div className="p-3 rounded-xl bg-pink-950/40 border border-pink-500/40 text-pink-200 text-[11px] leading-relaxed">
                                          <div className="font-bold mb-1">✅ LỆNH THANH TOÁN MOMO ĐÃ TẠO (#{momoPayment.orderId})</div>
                                          <div className="flex flex-col gap-2 mt-2">
                                            <a
                                              href={momoPayment.payUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-[11px] text-center"
                                            >
                                              <ExternalLink className="w-3 h-3 inline mr-1" />Mở trang thanh toán MoMo
                                            </a>
                                            {momoPayment.qrCodeUrl && (
                                              <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(momoPayment.qrCodeUrl)}`}
                                                alt="MoMo QR"
                                                className="mx-auto rounded-lg w-[180px] h-[180px] bg-white p-2"
                                              />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={handleCreateMoMoPayment}
                                      disabled={isCreatingOrder}
                                      className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:from-fuchsia-500 hover:to-pink-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,70,239,0.25)] disabled:opacity-50 transition-all cursor-pointer mb-2"
                                    >
                                      {isCreatingOrder ? (
                                        <>
                                          <RefreshCw className="w-4 h-4 animate-spin" />
                                          <span>Đang tạo lệnh MoMo...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Zap className="w-4 h-4" />
                                          <span>Tạo Lệnh Thanh Toán MoMo (QR/PayUrl)</span>
                                        </>
                                      )}
                                    </button>

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

          {/* CHANNEL: CYBERPOOL CRYPTOGATE — multi-network direct-to-wallet
              (TRON/BSC/POLYGON/SOLANA USDT + LTC). Thay thế 2 kênh cũ 'crypto'
              (1 ví USDT chung TRC20/BEP20, ví chưa cấu hình → fail-closed) và
              'ltc': giờ mỗi mạng có ví riêng do admin cấu hình, số coin duy
              nhất per-order, scanner on-chain tự động cộng ví. */}
          {activeChannel === 'cryptogate' && (
            <div className="p-4 sm:p-5">
              <CryptoGatePanel
                currency={user.currency}
                userBalance={user.walletBalance}
                onDepositSuccess={(amount, method, txCode) => {
                  if (onDepositSuccess) onDepositSuccess(amount, method, txCode);
                }}
                showToast={(msg, type) => {
                  if (type === 'success') {
                    setVerificationSuccess(msg);
                  } else {
                    setVerificationError(msg);
                  }
                }}
              />
            </div>
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

                {/* CYBERPOOL FIX: nút tạo lệnh thu tiền thật Binance Pay (Mô hình A) */}
                                  {binanceCheckout?.checkoutUrl && (
                                    <div className="space-y-2 pt-1">
                                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[11px] leading-relaxed">
                                        <div className="font-bold mb-1">✅ LỆNH BINANCE PAY ĐÃ TẠO (Prepay #{binanceCheckout.prepayId})</div>
                                        <div className="flex flex-col gap-2 mt-2">
                                          <a
                                            href={binanceCheckout.checkoutUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] text-center"
                                          >
                                            <ExternalLink className="w-3 h-3 inline mr-1" />Mở trang thanh toán Binance
                                          </a>
                                          {binanceCheckout.qrContent && (
                                            <img
                                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(binanceCheckout.qrContent)}`}
                                              alt="Binance Pay QR"
                                              className="mx-auto rounded-lg w-[180px] h-[180px] bg-white p-2"
                                            />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={handleCreateBinanceOrder}
                                    disabled={isCreatingOrder}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 transition-all cursor-pointer mb-2"
                                  >
                                    {isCreatingOrder ? (
                                      <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Đang tạo lệnh Binance Pay...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Zap className="w-4 h-4" />
                                        <span>Tạo Lệnh Thanh Toán Binance Pay (Checkout/QR)</span>
                                      </>
                                    )}
                                  </button>

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
