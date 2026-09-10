import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, 
  Landmark, 
  Smartphone, 
  Coins, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  Key, 
  Sliders, 
  Save, 
  ShieldCheck, 
  ExternalLink,
  DollarSign,
  AlertTriangle,
  Zap,
  Check,
  Upload,
  QrCode,
  Image as ImageIcon,
  Trash2,
  Eye,
  Copy,
  Power,
  ToggleLeft,
  ToggleRight,
  Ban,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { TopupInvoice, SystemConfig, Currency, DepositModuleId, DepositModulesConfig } from '../../types';
import { INITIAL_INVOICES } from '../../data/systemAdminData';
import { formatCurrency } from '../../utils/formatters';
import { adminApi } from '../../api/admin';

export const VIETNAMESE_BANKS = [
  { code: 'MB', bin: '970422', name: 'MBBank - Ngân Hàng Quân Đội' },
  { code: 'VCB', bin: '970436', name: 'Vietcombank - Ngân Hàng Ngoại Thương' },
  { code: 'TCB', bin: '970407', name: 'Techcombank - Ngân Hàng Kỹ Thương' },
  { code: 'ACB', bin: '970416', name: 'ACB - Ngân Hàng Á Châu' },
  { code: 'VPB', bin: '970432', name: 'VPBank - Ngân Hàng Việt Nam Thịnh Vượng' },
  { code: 'TPB', bin: '970458', name: 'TPBank - Ngân Hàng Tiên Phong' },
  { code: 'BIDV', bin: '970418', name: 'BIDV - Ngân Hàng Đầu Tư & Phát Triển' },
  { code: 'CTG', bin: '970415', name: 'VietinBank - Ngân Hàng Công Thương' },
  { code: 'VBA', bin: '970405', name: 'Agribank - Ngân Hàng Nông Nghiệp & PTNT' },
  { code: 'STB', bin: '970403', name: 'Sacombank - Ngân Hàng Sài Gòn Thương Tín' },
  { code: 'HDB', bin: '970437', name: 'HDBank - Ngân Hàng Phát Triển TP.HCM' },
  { code: 'OCB', bin: '970448', name: 'OCB - Ngân Hàng Phương Đông' },
  { code: 'VIB', bin: '970441', name: 'VIB - Ngân Hàng Quốc Tế' },
  { code: 'SHB', bin: '970443', name: 'SHB - Ngân Hàng Sài Gòn Hà Nội' },
  { code: 'MSB', bin: '970426', name: 'MSB - Ngân Hàng Hàng Hải' },
  { code: 'SEAB', bin: '970440', name: 'SeABank - Ngân Hàng Đông Nam Á' },
  { code: 'CAKE', bin: '546034', name: 'CAKE by VPBank - Ngân Hàng Số' },
  { code: 'TIMO', bin: '963388', name: 'Timo by BVBank - Ngân Hàng Số' }
];

interface AdminBankingTopupsTabProps {
  systemConfig?: SystemConfig;
  onUpdateSystemConfig?: (newConfig: Partial<SystemConfig>) => void;
  currency?: Currency;
  invoices?: TopupInvoice[];
  onApproveInvoice?: (invoiceId: string) => void;
  onRejectInvoice?: (invoiceId: string, reason?: string) => void;
}

export const AdminBankingTopupsTab: React.FC<AdminBankingTopupsTabProps> = ({
  systemConfig = {} as SystemConfig,
  onUpdateSystemConfig = (_cfg?: Partial<SystemConfig>) => {},
  currency = 'VND',
  invoices: propInvoices,
  onApproveInvoice,
  onRejectInvoice
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'gateways' | 'telco_fees'>('invoices');
  const [invoices, setInvoices] = useState<TopupInvoice[]>(propInvoices && propInvoices.length > 0 ? propInvoices : INITIAL_INVOICES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<TopupInvoice | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [errorMessageNotice, setErrorMessageNotice] = useState<string | null>(null);
  const [isDraggingQr, setIsDraggingQr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gateway Config Local State
  const [gatewayForm, setGatewayForm] = useState({
    bankName: systemConfig?.bankName || 'MBBank - Ngân Hàng Quân Đội',
    bankAccountNo: systemConfig?.bankAccountNo || '0988889999',
    bankAccountName: systemConfig?.bankAccountName || 'CYBERPOOL ESCROW GATEWAY',
    bankBin: systemConfig?.bankBin || '970422',
    bankQrCustomImage: systemConfig?.bankQrCustomImage || '',
    qrDisplayMode: systemConfig?.qrDisplayMode || 'vietqr_auto',
    vietQrApiToken: systemConfig?.vietQrApiToken || 'VQR_SEC_9988442211',
    bankCronInterval: systemConfig?.bankCronInterval || 5,
    mbbankApiPassword: systemConfig?.mbbankApiPassword || '••••••••',
    
    telcoProvider: systemConfig?.telcoProvider || 'card24h',
    telcoPartnerId: systemConfig?.telcoPartnerId || '16654919157',
    telcoPartnerKey: systemConfig?.telcoPartnerKey || 'bc3299820230bb1ed2b2b729cac744e3',
    telcoWalletId: systemConfig?.telcoWalletId || '0059134947',
    telcoCallbackUrl: systemConfig?.telcoCallbackUrl || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1/webhooks/card24h` : '/api/v1/webhooks/card24h'),
    
    telcoFeeViettel: systemConfig?.telcoFeeViettel || 16,
    telcoFeeVinaphone: systemConfig?.telcoFeeVinaphone || 17,
    telcoFeeMobifone: systemConfig?.telcoFeeMobifone || 19,
    telcoFeeZing: systemConfig?.telcoFeeZing || 15,
    telcoFeeGarena: systemConfig?.telcoFeeGarena || 14,
    
    cryptoUsdtAddress: systemConfig?.cryptoUsdtAddress || 'TWYvQ5X4h3uC48K8kS1mN7kY6Q3kH2g9aB',
    cryptoNetwork: systemConfig?.cryptoNetwork || 'TRC20',
    cryptoLtcAddress: systemConfig?.cryptoLtcAddress || 'LZeE2hL9qHSmV7gJ2wH7QG9Z2C81uYyX3w',
    cryptoLtcRate: systemConfig?.cryptoLtcRate || 2150000,
    cryptoLtcConfirmations: systemConfig?.cryptoLtcConfirmations || 2,
    
    binancePayId: systemConfig?.binancePayId || '582910384',
    binanceUid: systemConfig?.binanceUid || '293847291',
    binanceNickname: systemConfig?.binanceNickname || 'CYBERPOOL_PAY',
    binanceApiKey: systemConfig?.binanceApiKey || 'bpay_live_891823901823',
    binanceSecretKey: systemConfig?.binanceSecretKey || '••••••••••••••••',
    usdToVndRate: systemConfig?.usdToVndRate || 25400,
    
    momoPhone: systemConfig?.momoPhone || '0988889999',
    momoName: systemConfig?.momoName || 'NGUYEN HOANG LONG',
    momoApiToken: systemConfig?.momoApiToken || 'MOMO_SEC_889922'
  });

  // Individual Deposit API Modules Control State
  const [depositModules, setDepositModules] = useState<DepositModulesConfig>(() => ({
    vietqr: { enabled: true, maintenanceMessage: 'Cổng chuyển khoản / VietQR Napas 24/7 đang tạm bảo trì hệ thống.' },
    telco: { enabled: true, maintenanceMessage: 'Cổng đổi thẻ cào điện thoại Card24h đang tạm dừng để bảo trì API đối tác.' },
    momo: { enabled: true, maintenanceMessage: 'Cổng ví điện tử MoMo & ZaloPay đang tạm nâng cấp hạ tầng.' },
    crypto: { enabled: true, maintenanceMessage: 'Cổng nạp Crypto USDT (TRC20 / BEP20) đang bảo trì node blockchain.' },
    ltc: { enabled: true, maintenanceMessage: 'Cổng nạp Litecoin (LTC Core) đang đồng bộ khối blockchain.' },
    binance: { enabled: true, maintenanceMessage: 'Cổng Binance Pay tạm dừng kết nối API.' },
    ...(systemConfig?.depositModulesConfig || {})
  }));

  const depositModulesConfigStr = JSON.stringify(systemConfig?.depositModulesConfig);
  useEffect(() => {
    if (systemConfig?.depositModulesConfig) {
      setDepositModules(prev => ({
        ...prev,
        ...systemConfig.depositModulesConfig
      }));
    }
  }, [depositModulesConfigStr]);

  // Handler to toggle an individual deposit module
  const handleToggleModule = (moduleId: DepositModuleId) => {
    const current = depositModules[moduleId] || { enabled: true, maintenanceMessage: '' };
    const nextEnabled = !current.enabled;
    const updatedStatus = {
      ...current,
      enabled: nextEnabled,
      updatedAt: new Date().toISOString()
    };
    const updatedModules: DepositModulesConfig = {
      ...depositModules,
      [moduleId]: updatedStatus
    };
    setDepositModules(updatedModules);
    onUpdateSystemConfig({ depositModulesConfig: updatedModules });

    const moduleNameMap: Record<DepositModuleId, string> = {
      vietqr: 'VietQR Ngân Hàng Napas 24/7',
      telco: 'Đổi Thẻ Cào Telco Card24h',
      momo: 'Ví Điện Tử MoMo / ZaloPay',
      crypto: 'Crypto USDT (TRC20 / BEP20)',
      ltc: 'Litecoin (LTC Core Node)',
      binance: 'Binance Pay (0% Fee)'
    };

    if (nextEnabled) {
      setSaveSuccessNotice(`Đã BẬT hoạt động cổng nạp: ${moduleNameMap[moduleId]}! Khách hàng có thể nạp tiền bình thường.`);
    } else {
      setSaveSuccessNotice(`Đã TẮT cổng nạp: ${moduleNameMap[moduleId]}! Khách hàng sẽ thấy cảnh báo bảo trì và không thể nạp.`);
    }
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  // Handler to update maintenance notice for an individual module
  const handleUpdateMaintenanceMessage = (moduleId: DepositModuleId, message: string) => {
    const updatedModules: DepositModulesConfig = {
      ...depositModules,
      [moduleId]: {
        ...(depositModules[moduleId] || { enabled: true }),
        maintenanceMessage: message,
        updatedAt: new Date().toISOString()
      }
    };
    setDepositModules(updatedModules);
    onUpdateSystemConfig({ depositModulesConfig: updatedModules });
  };

  // Handler to toggle all modules at once
  const handleToggleAllModules = (enabled: boolean) => {
    const updatedModules: DepositModulesConfig = {
      vietqr: { ...(depositModules.vietqr || {}), enabled },
      telco: { ...(depositModules.telco || {}), enabled },
      momo: { ...(depositModules.momo || {}), enabled },
      crypto: { ...(depositModules.crypto || {}), enabled },
      ltc: { ...(depositModules.ltc || {}), enabled },
      binance: { ...(depositModules.binance || {}), enabled },
    };
    setDepositModules(updatedModules);
    onUpdateSystemConfig({ depositModulesConfig: updatedModules });
    if (enabled) {
      setSaveSuccessNotice('Đã BẬT TẤT CẢ 6 cổng API nạp tiền trên toàn hệ thống!');
    } else {
      setSaveSuccessNotice('ĐÃ TẮT TOÀN BỘ cổng API nạp tiền (Bảo trì khẩn cấp)! Khách hàng không thể nạp qua bất kỳ cổng nào.');
    }
    setTimeout(() => setSaveSuccessNotice(null), 4500);
  };

  const systemConfigBankingKey = systemConfig
    ? `${systemConfig.bankName}_${systemConfig.bankAccountNo}_${systemConfig.bankBin}_${systemConfig.qrDisplayMode}_${systemConfig.telcoPartnerId}`
    : '';

  useEffect(() => {
    if (systemConfig) {
      setGatewayForm(prev => ({
        ...prev,
        bankName: systemConfig.bankName || prev.bankName,
        bankAccountNo: systemConfig.bankAccountNo || prev.bankAccountNo,
        bankAccountName: systemConfig.bankAccountName || prev.bankAccountName,
        bankBin: systemConfig.bankBin || prev.bankBin,
        bankQrCustomImage: systemConfig.bankQrCustomImage !== undefined ? systemConfig.bankQrCustomImage : prev.bankQrCustomImage,
        qrDisplayMode: systemConfig.qrDisplayMode || prev.qrDisplayMode,
        vietQrApiToken: systemConfig.vietQrApiToken || prev.vietQrApiToken,
        telcoProvider: systemConfig.telcoProvider || prev.telcoProvider,
        telcoPartnerId: systemConfig.telcoPartnerId || prev.telcoPartnerId,
        telcoPartnerKey: systemConfig.telcoPartnerKey || prev.telcoPartnerKey,
        telcoWalletId: systemConfig.telcoWalletId || prev.telcoWalletId,
        telcoCallbackUrl: systemConfig.telcoCallbackUrl || prev.telcoCallbackUrl,
      }));
    }
  }, [systemConfigBankingKey]);

  const [card24hTesting, setCard24hTesting] = useState(false);
  const [card24hTestResult, setCard24hTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    raw?: any;
  } | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);

  const handleTestCard24hConnection = async () => {
    setCard24hTesting(true);
    setCard24hTestResult(null);
    try {
      const res = await adminApi.testCard24h({
        partnerId: gatewayForm.telcoPartnerId,
        partnerKey: gatewayForm.telcoPartnerKey
      });
      if (res.success && res.data) {
        setCard24hTestResult({
          success: true,
          message: res.data.note || 'Kết nối Card24h API thành công! Hệ thống sẵn sàng gạch thẻ cào 24/7.',
          latencyMs: res.data.latencyMs,
          raw: res.data.raw
        });
      } else {
        setCard24hTestResult({
          success: false,
          message: res.error || 'Không thể kết nối đến máy chủ Card24h. Vui lòng kiểm tra lại Partner ID/Key.'
        });
      }
    } catch (err: any) {
      setCard24hTestResult({
        success: false,
        message: err?.message || 'Lỗi kiểm tra kết nối API'
      });
    } finally {
      setCard24hTesting(false);
    }
  };

  const handleCopyCallbackUrl = () => {
    const url = gatewayForm.telcoCallbackUrl || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1/webhooks/card24h` : '/api/v1/webhooks/card24h');
    navigator.clipboard.writeText(url);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  const handleProcessQrFile = (file: File) => {
    setErrorMessageNotice(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessageNotice('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP, GIF)');
      setTimeout(() => setErrorMessageNotice(null), 4000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessageNotice('Dung lượng ảnh vượt quá giới hạn cho phép (Tối đa 5MB)');
      setTimeout(() => setErrorMessageNotice(null), 4000);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setGatewayForm(prev => ({
          ...prev,
          bankQrCustomImage: reader.result as string,
          qrDisplayMode: 'custom_image'
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBankSelectChange = (selectedBin: string) => {
    const found = VIETNAMESE_BANKS.find(b => b.bin === selectedBin);
    if (found) {
      setGatewayForm(prev => ({
        ...prev,
        bankBin: found.bin,
        bankName: found.name
      }));
    }
  };

  const handleSaveGateways = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystemConfig({
      ...gatewayForm,
      depositModulesConfig: depositModules
    });
    setSaveSuccessNotice('Đã lưu cấu hình cổng nạp, trạng thái các module và chiết khấu thành công!');
    setTimeout(() => setSaveSuccessNotice(null), 3000);
  };

  const handleApproveInvoice = (invoiceId: string) => {
    setInvoices(invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'completed',
          receivedAmount: inv.amount - inv.fee,
          note: 'Admin duyệt cộng tiền thủ công thành công'
        };
      }
      return inv;
    }));
  };

  const handleCancelInvoice = (invoiceId: string) => {
    setInvoices(invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'cancelled',
          note: 'Admin hủy hóa đơn'
        };
      }
      return inv;
    }));
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = (inv.txCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchMethod = methodFilter === 'all' || inv.method === methodFilter;
    return matchSearch && matchStatus && matchMethod;
  });

  const totalDepositedSuccessful = invoices
    .filter(i => i.status === 'completed')
    .reduce((sum, i) => sum + i.receivedAmount, 0);

  return (
    <div className="space-y-4 font-sans text-sm">
      {/* Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2 tracking-wide">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>CỔNG NẠP TIỀN TỰ ĐỘNG & QUẢN LÝ HÓA ĐƠN ({invoices.length} GIAO DỊCH)</span>
            <span className="px-2 py-0.5 rounded text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-medium">
              Payment Gateways
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý API VietQR MBBank, TheSieuRe gạch thẻ cào, MoMo IPN, Crypto USDT và phê duyệt giao dịch.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 self-start">
          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer font-semibold text-xs ${
              activeSubTab === 'invoices'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hóa Đơn Nạp Tiền
          </button>
          <button
            onClick={() => setActiveSubTab('gateways')}
            className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer font-semibold text-xs ${
              activeSubTab === 'gateways'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cấu Hình API Cổng Nạp
          </button>
          <button
            onClick={() => setActiveSubTab('telco_fees')}
            className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer font-semibold text-xs ${
              activeSubTab === 'telco_fees'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chiết Khấu Thẻ Cào
          </button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 text-xs">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {errorMessageNotice && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 flex items-center gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessageNotice}</span>
        </div>
      )}

      {/* SUB-TAB 1: HÓA ĐƠN NẠP TIỀN */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Tổng Tiền Nạp Đã Duyệt</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {formatCurrency(totalDepositedSuccessful, currency)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                <Landmark className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Giao Dịch VietQR Auto</div>
                <div className="text-base font-bold text-cyan-300 mt-0.5">
                  {invoices.filter(i => i.method === 'bank_vietqr').length} Lượt Nạp
                </div>
              </div>
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Giao Dịch Thẻ Cào (TheSieuRe)</div>
                <div className="text-base font-bold text-amber-300 mt-0.5">
                  {invoices.filter(i => i.method === 'telco_card').length} Thẻ Gạch
                </div>
              </div>
              <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã GD, tên tài khoản hoặc mã hóa đơn..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs"
              >
                <option value="all">Tất cả cổng nạp</option>
                <option value="bank_vietqr">VietQR MBBank Auto</option>
                <option value="telco_card">Thẻ cào TheSieuRe</option>
                <option value="momo">Ví MoMo</option>
                <option value="crypto_usdt">Crypto USDT</option>
                <option value="crypto_ltc">Crypto Litecoin (LTC)</option>
                <option value="binance_pay">Binance Pay / UID</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="completed">Thành công</option>
                <option value="pending">Đang chờ duyệt</option>
                <option value="failed">Thất bại / Sai mã</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[11px] font-semibold tracking-wider">
                  <th className="py-3 px-4 whitespace-nowrap w-44">Mã GD / Hóa Đơn</th>
                  <th className="py-3 px-4 whitespace-nowrap w-40">Thành Viên</th>
                  <th className="py-3 px-4 whitespace-nowrap w-36">Cổng Nạp</th>
                  <th className="py-3 px-4 whitespace-nowrap w-32">Số Tiền Nạp</th>
                  <th className="py-3 px-4 whitespace-nowrap w-32">Thực Nhận</th>
                  <th className="py-3 px-4 whitespace-nowrap w-44">Thời Gian</th>
                  <th className="py-3 px-4 whitespace-nowrap w-36">Trạng Thái</th>
                  <th className="py-3 px-4 whitespace-nowrap w-44 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-cyan-300 font-mono">
                      <div>{inv.txCode}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{inv.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">@{inv.userName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{inv.userId}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {inv.method === 'bank_vietqr' && (
                        <span className="px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-xs font-semibold whitespace-nowrap">
                          VietQR Auto
                        </span>
                      )}
                      {inv.method === 'telco_card' && (
                        <span className="px-2.5 py-1 rounded-md bg-amber-950 text-amber-300 border border-amber-500/30 text-xs font-semibold whitespace-nowrap">
                          Thẻ {inv.cardInfo?.telco || 'Cào'}
                        </span>
                      )}
                      {inv.method === 'momo' && (
                        <span className="px-2.5 py-1 rounded-md bg-pink-950 text-pink-300 border border-pink-500/30 text-xs font-semibold whitespace-nowrap">
                          MoMo IPN
                        </span>
                      )}
                      {inv.method === 'crypto_usdt' && (
                        <span className="px-2.5 py-1 rounded-md bg-purple-950 text-purple-300 border border-purple-500/30 text-xs font-semibold whitespace-nowrap">
                          USDT TRC20
                        </span>
                      )}
                      {inv.method === 'crypto_ltc' && (
                        <span className="px-2.5 py-1 rounded-md bg-blue-950 text-blue-300 border border-blue-500/30 text-xs font-semibold whitespace-nowrap flex items-center gap-1">
                          <Zap className="w-3 h-3 text-blue-400" />
                          <span>LTC Mainnet</span>
                        </span>
                      )}
                      {inv.method === 'binance_pay' && (
                        <span className="px-2.5 py-1 rounded-md bg-amber-950 text-amber-300 border border-amber-500/30 text-xs font-semibold whitespace-nowrap flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 text-black font-black text-[7px] flex items-center justify-center">B</div>
                          <span>Binance Pay</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-white font-bold font-mono">
                      {formatCurrency(inv.amount, currency)}
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-bold font-mono">
                      {formatCurrency(inv.receivedAmount, currency)}
                      {inv.fee > 0 && (
                        <span className="text-[10px] text-rose-400 block font-normal">(-{formatCurrency(inv.fee, currency)})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-xs whitespace-nowrap">
                      {inv.createdAt}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {inv.status === 'completed' && (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Thành Công</span>
                        </span>
                      )}
                      {inv.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-md bg-amber-950 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Chờ Duyệt</span>
                        </span>
                      )}
                      {inv.status === 'cancelled' && (
                        <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-700 inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Đã Hủy</span>
                        </span>
                      )}
                      {inv.status === 'failed' && (
                        <span className="px-2.5 py-1 rounded-md bg-rose-950 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Thất Bại</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      {inv.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveInvoice(inv.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer transition-colors"
                            title="Duyệt cộng tiền ngay"
                          >
                            Duyệt Tiền
                          </button>
                          <button
                            onClick={() => handleCancelInvoice(inv.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 font-semibold text-xs cursor-pointer transition-colors"
                            title="Hủy hóa đơn"
                          >
                            Hủy
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Chi Tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Invoice Detail Modal */}
          {selectedInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-xl bg-slate-900 border border-cyan-500/40 p-5 space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    <span>CHI TIẾT HÓA ĐƠN NẠP TIỀN: {selectedInvoice.txCode}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Khách Hàng:</span>
                    <span className="text-white font-bold">{selectedInvoice.userName} ({selectedInvoice.userId})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cổng Thanh Toán:</span>
                    <span className="text-cyan-300 font-bold uppercase">{selectedInvoice.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số Tiền Khai Báo:</span>
                    <span className="text-white font-bold">{formatCurrency(selectedInvoice.amount, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phí Giao Dịch:</span>
                    <span className="text-red-400 font-bold">{formatCurrency(selectedInvoice.fee, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thực Nhận Vào Ví:</span>
                    <span className="text-emerald-400 font-bold text-sm">{formatCurrency(selectedInvoice.receivedAmount, currency)}</span>
                  </div>
                  {selectedInvoice.cardInfo && (
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <div className="text-[10px] text-amber-400 font-bold">THÔNG TIN THẺ CÀO GẠCH:</div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Nhà mạng:</span>
                        <span className="text-white font-bold">{selectedInvoice.cardInfo.telco}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Mã Serial:</span>
                        <span className="text-slate-300 font-mono">{selectedInvoice.cardInfo.serial}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Mã Thẻ (PIN):</span>
                        <span className="text-cyan-300 font-mono font-bold">{selectedInvoice.cardInfo.pin}</span>
                      </div>
                    </div>
                  )}
                  {selectedInvoice.bankInfo && (
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <div className="text-[10px] text-cyan-400 font-bold">THÔNG TIN CHUYỂN KHOẢN NGÂN HÀNG:</div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Ngân hàng:</span>
                        <span className="text-white">{selectedInvoice.bankInfo.bankName}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Nội dung CK:</span>
                        <span className="text-amber-300 font-mono font-bold">{selectedInvoice.bankInfo.content}</span>
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                    <strong>Ghi chú hệ thống:</strong> {selectedInvoice.note || 'Không có'}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {selectedInvoice.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleApproveInvoice(selectedInvoice.id);
                        setSelectedInvoice(null);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                    >
                      Duyệt & Cộng Tiền Ngay
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: CẤU HÌNH API CỔNG NẠP */}
      {activeSubTab === 'gateways' && (
        <form onSubmit={handleSaveGateways} className="space-y-5">
          {/* MASTER SWITCHBOARD: TẮT / BẬT CỔNG API NẠP TIỀN CHO TỪNG MODULE */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-cyan-500/40 shadow-xl shadow-cyan-950/20 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/40 text-cyan-400 shrink-0">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      BẬT / TẮT CỔNG API NẠP TIỀN CHO TỪNG MODULE
                    </h4>
                    {(() => {
                      const enabledCount = [
                        depositModules.vietqr?.enabled,
                        depositModules.telco?.enabled,
                        depositModules.momo?.enabled,
                        depositModules.crypto?.enabled,
                        depositModules.ltc?.enabled,
                        depositModules.binance?.enabled
                      ].filter(Boolean).length;
                      return (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          enabledCount === 6
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : enabledCount === 0
                            ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                            : 'bg-amber-950 text-amber-300 border-amber-500/40'
                        }`}>
                          {enabledCount} / 6 Cổng Đang Hoạt Động
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    Kiểm soát bật hoặc tạm tắt từng kênh nạp tiền (VietQR, Thẻ Cào, MoMo/ZaloPay, Crypto USDT, LTC, Binance Pay). 
                    Khi tắt một cổng, thành viên trên toàn hệ thống sẽ thấy thông báo bảo trì cụ thể và không thể gửi lệnh nạp qua cổng đó.
                  </p>
                </div>
              </div>

              {/* Master Bulk Actions */}
              <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleAllModules(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Bật Tất Cả Cổng</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllModules(false)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Tắt Toàn Bộ (Bảo Trì)</span>
                </button>
              </div>
            </div>

            {/* Grid of 6 Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* MODULE 1: VietQR & Ngân Hàng Napas */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                depositModules.vietqr?.enabled
                  ? 'bg-slate-950/80 border-cyan-500/30 shadow-sm'
                  : 'bg-rose-950/20 border-rose-500/40 opacity-95'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>VietQR & Napas 24/7</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Ngân hàng MBBank, VCB...</span>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleModule('vietqr')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      depositModules.vietqr?.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    title={depositModules.vietqr?.enabled ? 'Bấm để tắt cổng này' : 'Bấm để bật cổng này'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        depositModules.vietqr?.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">Trạng thái:</span>
                  <span className={`font-bold text-[11px] px-2 py-0.5 rounded ${
                    depositModules.vietqr?.enabled
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                  }`}>
                    {depositModules.vietqr?.enabled ? '🟢 ĐANG HOẠT ĐỘNG' : '🔴 ĐÃ TẮT BẢO TRÌ'}
                  </span>
                </div>

                {/* Maintenance Message (editable) */}
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Thông báo bảo trì hiển thị cho khách:
                  </label>
                  <input
                    type="text"
                    value={depositModules.vietqr?.maintenanceMessage || ''}
                    onChange={(e) => handleUpdateMaintenanceMessage('vietqr', e.target.value)}
                    placeholder="VD: Cổng VietQR đang tạm bảo trì hệ thống 15 phút..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* MODULE 2: Gạch Thẻ Cào Telco */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                depositModules.telco?.enabled
                  ? 'bg-slate-950/80 border-amber-500/30 shadow-sm'
                  : 'bg-rose-950/20 border-rose-500/40 opacity-95'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Đổi Thẻ Cào Telco</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Card24h, TheSieuRe, Doithe1s</span>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleModule('telco')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      depositModules.telco?.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    title={depositModules.telco?.enabled ? 'Bấm để tắt cổng này' : 'Bấm để bật cổng này'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        depositModules.telco?.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">Trạng thái:</span>
                  <span className={`font-bold text-[11px] px-2 py-0.5 rounded ${
                    depositModules.telco?.enabled
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                  }`}>
                    {depositModules.telco?.enabled ? '🟢 ĐANG HOẠT ĐỘNG' : '🔴 ĐÃ TẮT BẢO TRÌ'}
                  </span>
                </div>

                {/* Maintenance Message */}
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Thông báo bảo trì hiển thị cho khách:
                  </label>
                  <input
                    type="text"
                    value={depositModules.telco?.maintenanceMessage || ''}
                    onChange={(e) => handleUpdateMaintenanceMessage('telco', e.target.value)}
                    placeholder="VD: Cổng đổi thẻ cào đang tạm nâng cấp đối tác..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* MODULE 3: Ví MoMo & ZaloPay */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                depositModules.momo?.enabled
                  ? 'bg-slate-950/80 border-pink-500/30 shadow-sm'
                  : 'bg-rose-950/20 border-rose-500/40 opacity-95'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Ví MoMo / ZaloPay</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Ví điện tử số điện thoại</span>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleModule('momo')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      depositModules.momo?.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    title={depositModules.momo?.enabled ? 'Bấm để tắt cổng này' : 'Bấm để bật cổng này'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        depositModules.momo?.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">Trạng thái:</span>
                  <span className={`font-bold text-[11px] px-2 py-0.5 rounded ${
                    depositModules.momo?.enabled
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                  }`}>
                    {depositModules.momo?.enabled ? '🟢 ĐANG HOẠT ĐỘNG' : '🔴 ĐÃ TẮT BẢO TRÌ'}
                  </span>
                </div>

                {/* Maintenance Message */}
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Thông báo bảo trì hiển thị cho khách:
                  </label>
                  <input
                    type="text"
                    value={depositModules.momo?.maintenanceMessage || ''}
                    onChange={(e) => handleUpdateMaintenanceMessage('momo', e.target.value)}
                    placeholder="VD: Cổng ví MoMo đang tạm nâng cấp hạn mức..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:border-pink-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* MODULE 4: Crypto USDT */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                depositModules.crypto?.enabled
                  ? 'bg-slate-950/80 border-emerald-500/30 shadow-sm'
                  : 'bg-rose-950/20 border-rose-500/40 opacity-95'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Crypto USDT</span>
                      </div>
                      <span className="text-[10px] text-slate-400">TRC20, BEP20, ERC20</span>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleModule('crypto')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      depositModules.crypto?.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    title={depositModules.crypto?.enabled ? 'Bấm để tắt cổng này' : 'Bấm để bật cổng này'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        depositModules.crypto?.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">Trạng thái:</span>
                  <span className={`font-bold text-[11px] px-2 py-0.5 rounded ${
                    depositModules.crypto?.enabled
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                  }`}>
                    {depositModules.crypto?.enabled ? '🟢 ĐANG HOẠT ĐỘNG' : '🔴 ĐÃ TẮT BẢO TRÌ'}
                  </span>
                </div>

                {/* Maintenance Message */}
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Thông báo bảo trì hiển thị cho khách:
                  </label>
                  <input
                    type="text"
                    value={depositModules.crypto?.maintenanceMessage || ''}
                    onChange={(e) => handleUpdateMaintenanceMessage('crypto', e.target.value)}
                    placeholder="VD: Cổng USDT đang đồng bộ node blockchain..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* MODULE 5: Litecoin LTC */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                depositModules.ltc?.enabled
                  ? 'bg-slate-950/80 border-blue-500/30 shadow-sm'
                  : 'bg-rose-950/20 border-rose-500/40 opacity-95'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Litecoin (LTC)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">LTC Core Blockchain Node</span>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleModule('ltc')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      depositModules.ltc?.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    title={depositModules.ltc?.enabled ? 'Bấm để tắt cổng này' : 'Bấm để bật cổng này'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        depositModules.ltc?.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">Trạng thái:</span>
                  <span className={`font-bold text-[11px] px-2 py-0.5 rounded ${
                    depositModules.ltc?.enabled
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                  }`}>
                    {depositModules.ltc?.enabled ? '🟢 ĐANG HOẠT ĐỘNG' : '🔴 ĐÃ TẮT BẢO TRÌ'}
                  </span>
                </div>

                {/* Maintenance Message */}
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Thông báo bảo trì hiển thị cho khách:
                  </label>
                  <input
                    type="text"
                    value={depositModules.ltc?.maintenanceMessage || ''}
                    onChange={(e) => handleUpdateMaintenanceMessage('ltc', e.target.value)}
                    placeholder="VD: Cổng LTC đang đồng bộ block mạng chính..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* MODULE 6: Binance Pay */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                depositModules.binance?.enabled
                  ? 'bg-slate-950/80 border-amber-500/30 shadow-sm'
                  : 'bg-rose-950/20 border-rose-500/40 opacity-95'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-400 font-black text-xs flex items-center justify-center">
                      B
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Binance Pay & UID</span>
                      </div>
                      <span className="text-[10px] text-slate-400">0% Phí qua PayID</span>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleModule('binance')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      depositModules.binance?.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    title={depositModules.binance?.enabled ? 'Bấm để tắt cổng này' : 'Bấm để bật cổng này'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        depositModules.binance?.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">Trạng thái:</span>
                  <span className={`font-bold text-[11px] px-2 py-0.5 rounded ${
                    depositModules.binance?.enabled
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                  }`}>
                    {depositModules.binance?.enabled ? '🟢 ĐANG HOẠT ĐỘNG' : '🔴 ĐÃ TẮT BẢO TRÌ'}
                  </span>
                </div>

                {/* Maintenance Message */}
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Thông báo bảo trì hiển thị cho khách:
                  </label>
                  <input
                    type="text"
                    value={depositModules.binance?.maintenanceMessage || ''}
                    onChange={(e) => handleUpdateMaintenanceMessage('binance', e.target.value)}
                    placeholder="VD: Cổng Binance Pay đang tạm bảo trì API..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* VietQR Bank Gateway & QR Code Configuration */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">CỔNG THANH TOÁN & MÃ QR NGÂN HÀNG (VIETQR / CUSTOM QR)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                      Auto Gateway
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Cấu hình tài khoản nhận tiền nạp tự động, chọn ngân hàng hoặc tải ảnh mã QR cá nhân của bạn lên
                  </p>
                </div>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setGatewayForm(prev => ({ ...prev, qrDisplayMode: 'vietqr_auto' }))}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    gatewayForm.qrDisplayMode === 'vietqr_auto'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>VietQR Tự Động</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGatewayForm(prev => ({ ...prev, qrDisplayMode: 'custom_image' }))}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    gatewayForm.qrDisplayMode === 'custom_image'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Ảnh QR Tải Lên</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Form Inputs (Col 7) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Bank Select & Account Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
                      <Landmark className="w-3.5 h-3.5" />
                      <span>Chọn Ngân Hàng Nhận Tiền (VietQR Napas 24/7):</span>
                    </label>
                    <select
                      value={gatewayForm.bankBin}
                      onChange={(e) => handleBankSelectChange(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-500/40 focus:border-cyan-400 rounded-lg p-2.5 text-white text-xs font-semibold cursor-pointer"
                    >
                      {VIETNAMESE_BANKS.map((b) => (
                        <option key={b.bin} value={b.bin}>
                          {b.name} (Mã BIN: {b.bin})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                      Số Tài Khoản Nhận:
                    </label>
                    <input
                      type="text"
                      value={gatewayForm.bankAccountNo}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, bankAccountNo: e.target.value.trim() })}
                      placeholder="VD: 0388999999"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg p-2 text-cyan-300 font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                      Tên Chủ Tài Khoản (In hoa không dấu):
                    </label>
                    <input
                      type="text"
                      value={gatewayForm.bankAccountName}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, bankAccountName: e.target.value.toUpperCase() })}
                      placeholder="VD: NGUYEN VAN A"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg p-2 text-white font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">
                      Webhook / VietQR Token:
                    </label>
                    <input
                      type="text"
                      value={gatewayForm.vietQrApiToken}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, vietQrApiToken: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">
                      Chu Kỳ Quét Biến Động (Giây):
                    </label>
                    <input
                      type="number"
                      value={gatewayForm.bankCronInterval}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, bankCronInterval: parseInt(e.target.value) || 5 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-400 font-bold text-xs"
                    />
                  </div>
                </div>

                {/* Custom QR Image Upload Box */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      <span>Tải Lên Mã QR Cá Nhân Của Bạn (Upload ảnh QR từ máy):</span>
                    </label>
                    {gatewayForm.bankQrCustomImage && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                        Đã tải lên 1 ảnh
                      </span>
                    )}
                  </div>

                  {/* Drag and Drop Box */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessQrFile(file);
                    }}
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingQr(true);
                    }}
                    onDragLeave={() => setIsDraggingQr(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingQr(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleProcessQrFile(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      isDraggingQr
                        ? 'border-purple-400 bg-purple-950/30'
                        : 'border-slate-700 hover:border-purple-400/70 bg-slate-900/40 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        Kéo thả file ảnh mã QR vào đây, hoặc <span className="text-purple-400 underline">bấm để chọn file</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Hỗ trợ PNG, JPG, JPEG, WEBP (Khuyên dùng ảnh QR tải từ App Ngân Hàng, MoMo, ZaloPay)
                      </p>
                    </div>
                  </div>

                  {/* Or Direct Image URL Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">
                      Hoặc dán trực tiếp đường link ảnh QR (URL):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={gatewayForm.bankQrCustomImage}
                        onChange={(e) => setGatewayForm({
                          ...gatewayForm,
                          bankQrCustomImage: e.target.value,
                          qrDisplayMode: e.target.value ? 'custom_image' : gatewayForm.qrDisplayMode
                        })}
                        placeholder="https://example.com/my-qr-code.png"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs font-mono"
                      />
                      {gatewayForm.bankQrCustomImage && (
                        <button
                          type="button"
                          onClick={() => setGatewayForm({
                            ...gatewayForm,
                            bankQrCustomImage: '',
                            qrDisplayMode: 'vietqr_auto'
                          })}
                          className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                          title="Xóa ảnh QR tùy chỉnh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Live QR Preview (Col 5) */}
              <div className="lg:col-span-5 flex flex-col items-center bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-3">
                <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                    <Eye className="w-4 h-4" />
                    <span>XEM TRƯỚC MÃ QR KHÁCH THẤY</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    gatewayForm.qrDisplayMode === 'custom_image' && gatewayForm.bankQrCustomImage
                      ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {gatewayForm.qrDisplayMode === 'custom_image' && gatewayForm.bankQrCustomImage
                      ? 'Ảnh Tải Lên'
                      : 'VietQR Auto'}
                  </span>
                </div>

                {/* Visual QR Image Container */}
                <div className="p-3 bg-white rounded-xl shadow-xl relative inline-block">
                  {gatewayForm.qrDisplayMode === 'custom_image' && gatewayForm.bankQrCustomImage ? (
                    <img
                      src={gatewayForm.bankQrCustomImage}
                      alt="Custom QR Preview"
                      className="w-48 h-48 object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.vietqr.io/image/${gatewayForm.bankBin}-${gatewayForm.bankAccountNo}-compact2.jpg?amount=100000&addInfo=CYBER%20PREVIEW&accountName=${encodeURIComponent(gatewayForm.bankAccountName)}`;
                      }}
                    />
                  ) : (
                    <img
                      src={`https://api.vietqr.io/image/${gatewayForm.bankBin}-${gatewayForm.bankAccountNo}-compact2.jpg?amount=100000&addInfo=CYBER%20PREVIEW&accountName=${encodeURIComponent(gatewayForm.bankAccountName)}`}
                      alt="VietQR Preview"
                      className="w-48 h-48 object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=STK:${gatewayForm.bankAccountNo}|NH:${gatewayForm.bankBin}`;
                      }}
                    />
                  )}
                </div>

                {/* Account details summary */}
                <div className="w-full text-left space-y-1 text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ngân hàng:</span>
                    <span className="text-white font-bold">{gatewayForm.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số tài khoản:</span>
                    <span className="text-cyan-300 font-mono font-bold">{gatewayForm.bankAccountNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chủ tài khoản:</span>
                    <span className="text-amber-300 font-bold">{gatewayForm.bankAccountName}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                    <span className="text-slate-400">Cú pháp nạp:</span>
                    <span className="text-emerald-400 font-mono font-bold">CYBER &lt;USER_ID&gt;</span>
                  </div>
                </div>

                <div className="w-full flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Cấu Hình QR Ngay</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card24h / TheSieuRe Card Charging API */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs uppercase tracking-wide">CỔNG GẠCH THẺ CÀO AUTO (CARD24H.COM API V2)</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                      Đang Hoạt Động
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Tự động gạch thẻ Viettel, Vina, Mobi, Vietnamobile, Zing, Garena 24/7 và callback cộng tiền vào ví
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={gatewayForm.telcoProvider || 'card24h'}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, telcoProvider: e.target.value as any })}
                  className="bg-slate-950 border border-amber-500/30 text-amber-300 font-bold rounded-lg px-2.5 py-1 text-xs cursor-pointer"
                >
                  <option value="card24h">Cổng Card24h.com (Khuyên dùng)</option>
                  <option value="thesieure">Cổng TheSieuRe.com</option>
                  <option value="doithe1s">Cổng Doithe1s.vn</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-300 font-semibold flex items-center justify-between">
                  <span>Partner ID (Mã Đối Tác):</span>
                  <span className="text-[10px] text-amber-400 font-mono">card24h: 16654919157</span>
                </label>
                <input
                  type="text"
                  value={gatewayForm.telcoPartnerId}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, telcoPartnerId: e.target.value })}
                  placeholder="16654919157"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono mt-1 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-semibold flex items-center justify-between">
                  <span>Partner Secret Key:</span>
                  <span className="text-[10px] text-emerald-400 font-mono">MD5 Sign</span>
                </label>
                <input
                  type="text"
                  value={gatewayForm.telcoPartnerKey}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, telcoPartnerKey: e.target.value })}
                  placeholder="bc3299820230bb1ed2b2b729cac744e3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono mt-1 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-semibold flex items-center justify-between">
                  <span>Mã Ví Điện Tử (Card24h):</span>
                  <span className="text-[10px] text-slate-400 font-mono">Wallet ID</span>
                </label>
                <input
                  type="text"
                  value={gatewayForm.telcoWalletId || '0059134947'}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, telcoWalletId: e.target.value })}
                  placeholder="0059134947"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono mt-1 text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
                    <span>Đường Dẫn Nhận Dữ Liệu Callback URL (Dán vào mục Kết Nối API trên Card24h.com):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Kiểu: <b>GET</b> | Loại API: <b>Charging</b></span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    readOnly
                    value={gatewayForm.telcoCallbackUrl || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1/webhooks/card24h` : '/api/v1/webhooks/card24h')}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-400 font-mono text-xs select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCallbackUrl}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border border-slate-700"
                  >
                    {copiedCallback ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Đã Chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sao Chép URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Test Result Alert Banner */}
            {card24hTestResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                  card24hTestResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                {card24hTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">{card24hTestResult.message}</div>
                  {card24hTestResult.latencyMs !== undefined && (
                    <div className="text-[11px] opacity-80 mt-0.5 font-mono">
                      Thời gian phản hồi máy chủ Card24h: {card24hTestResult.latencyMs}ms
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Test & Instructions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Endpoint Card24h: <code className="text-amber-300 font-mono">https://card24h.com/chargingws/v2</code></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestCard24hConnection}
                  disabled={card24hTesting}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${card24hTesting ? 'animate-spin' : ''}`} />
                  <span>{card24hTesting ? 'Đang Kiểm Tra...' : 'Kiểm Tra Kết Nối Card24h'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* MoMo & Crypto USDT */}
          {/* Row: MoMo & Crypto USDT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-pink-500/30 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Smartphone className="w-4 h-4 text-pink-400" />
                <span className="font-bold text-white text-xs">VÍ ĐIỆN TỬ MOMO BUSINESS AUTO</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-400">Số Điện Thoại MoMo:</label>
                  <input
                    type="text"
                    value={gatewayForm.momoPhone}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, momoPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Tên Tài Khoản MoMo:</label>
                  <input
                    type="text"
                    value={gatewayForm.momoName}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, momoName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white mt-1 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/30 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Coins className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white text-xs">CỔNG CRYPTO USDT (BLOCKCHAIN)</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-slate-400">Địa Chỉ Ví Nhận USDT:</label>
                  <input
                    type="text"
                    value={gatewayForm.cryptoUsdtAddress}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, cryptoUsdtAddress: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-purple-300 font-mono mt-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Mạng Lưới (Network):</label>
                  <select
                    value={gatewayForm.cryptoNetwork}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, cryptoNetwork: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white mt-1 text-xs"
                  >
                    <option value="TRC20">TRON (TRC20) - Phí thấp, xác nhận 1-2 phút</option>
                    <option value="BEP20">BNB Smart Chain (BEP20)</option>
                    <option value="ERC20">Ethereum (ERC20)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Row: Litecoin LTC & Binance Pay Gateways */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LTC Gateway */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-xs">CỔNG NẠP LITECOIN (LTC NODE MAINNET)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                  LTC Core
                </span>
              </div>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] text-slate-400">Địa Chỉ Ví Nhận Litecoin (LTC Core):</label>
                  <input
                    type="text"
                    value={gatewayForm.cryptoLtcAddress}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, cryptoLtcAddress: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-blue-300 font-mono mt-1 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400">Tỷ Giá Quy Đổi (1 LTC = ₫):</label>
                    <input
                      type="number"
                      value={gatewayForm.cryptoLtcRate}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, cryptoLtcRate: parseFloat(e.target.value) || 2150000 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-400 font-bold mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Số Blocks Xác Nhận:</label>
                    <input
                      type="number"
                      value={gatewayForm.cryptoLtcConfirmations}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, cryptoLtcConfirmations: parseInt(e.target.value) || 2 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold mt-1 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Binance Pay Gateway */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-400 text-black font-black text-[9px] flex items-center justify-center">B</div>
                  <span className="font-bold text-white text-xs">CỔNG BINANCE PAY & ID BINANCE (UID)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  0% Fee
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400">Binance Pay ID:</label>
                    <input
                      type="text"
                      value={gatewayForm.binancePayId}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, binancePayId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono font-bold mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Binance UID (User ID):</label>
                    <input
                      type="text"
                      value={gatewayForm.binanceUid}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, binanceUid: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono font-bold mt-1 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400">Biệt Danh (Nickname):</label>
                    <input
                      type="text"
                      value={gatewayForm.binanceNickname}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, binanceNickname: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Tỷ Giá Binance (1 USDT = ₫):</label>
                    <input
                      type="number"
                      value={gatewayForm.usdToVndRate}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, usdToVndRate: parseFloat(e.target.value) || 25400 })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-emerald-400 font-bold mt-1 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Toàn Bộ Cấu Hình Cổng Nạp</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 3: CHIẾT KHẤU THẺ CÀO */}
      {activeSubTab === 'telco_fees' && (
        <form onSubmit={handleSaveGateways} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white uppercase">CẤU HÌNH PHẦN TRĂM (%) CHIẾT KHẤU GẠCH THẺ THE SIEU RE</div>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Thành viên nạp thẻ mệnh giá 100.000đ với chiết khấu 16% sẽ nhận được 84.000đ vào ví.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px]">
              Tỷ lệ cập nhật theo thời gian thực
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <label className="text-[11px] text-slate-300 font-bold block mb-1">VIETTEL (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={gatewayForm.telcoFeeViettel}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, telcoFeeViettel: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold text-sm pr-7"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1">Khách nhận: {100 - gatewayForm.telcoFeeViettel}%</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <label className="text-[11px] text-slate-300 font-bold block mb-1">VINAPHONE (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={gatewayForm.telcoFeeVinaphone}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, telcoFeeVinaphone: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold text-sm pr-7"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1">Khách nhận: {100 - gatewayForm.telcoFeeVinaphone}%</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <label className="text-[11px] text-slate-300 font-bold block mb-1">MOBIFONE (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={gatewayForm.telcoFeeMobifone}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, telcoFeeMobifone: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold text-sm pr-7"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1">Khách nhận: {100 - gatewayForm.telcoFeeMobifone}%</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <label className="text-[11px] text-slate-300 font-bold block mb-1">THẺ ZING (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={gatewayForm.telcoFeeZing}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, telcoFeeZing: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-300 font-bold text-sm pr-7"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1">Khách nhận: {100 - gatewayForm.telcoFeeZing}%</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <label className="text-[11px] text-slate-300 font-bold block mb-1">THẺ GARENA (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={gatewayForm.telcoFeeGarena}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, telcoFeeGarena: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-red-300 font-bold text-sm pr-7"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">%</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1">Khách nhận: {100 - gatewayForm.telcoFeeGarena}%</div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>Cập Nhật Bảng Chiết Khấu Thẻ Cào</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
