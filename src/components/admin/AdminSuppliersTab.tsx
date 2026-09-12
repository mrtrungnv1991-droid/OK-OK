import React, { useState, useEffect } from 'react';
import { authFetch } from '../../api/authFetch';
import { 
  Server, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Globe, 
  Key, 
  UserCheck, 
  ExternalLink, 
  DollarSign, 
  Sliders, 
  Database,
  TrendingUp,
  Sparkles,
  ShoppingBag,
  AlertTriangle,
  FileText,
  Activity,
  ArrowRight,
  HardDrive,
  Info,
  User,
  Link as LinkIcon,
  Gift,
  Check,
  Trash2
} from 'lucide-react';
import { CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { WebDeliveryOutput } from '../WebDeliveryOutput';
import { AdminCronMonitor } from './AdminCronMonitor';

interface AdminSuppliersTabProps {
  suppliers?: any[];
  currency: CurrencyCode;
  onUpdateSupplierBalance?: (supplierId: string, deltaBalance: number) => void;
}

interface DiagnosticStep {
  step: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED' | 'RUNNING';
  message: string;
  durationMs?: number;
}

interface ConnectionDiagnostics {
  network: 'PASS' | 'FAIL';
  authentication: 'PASS' | 'FAIL' | 'SKIPPED';
  account: 'PASS' | 'FAIL' | 'SKIPPED';
  session: 'PASS' | 'FAIL' | 'SKIPPED';
  balance: 'PASS' | 'FAIL' | 'NOT_SUPPORTED';
  categories: 'PASS' | 'FAIL';
  products: 'PASS' | 'FAIL';
  overallStatus: string;
  reason?: string;
  checkedAt?: string;
  steps: DiagnosticStep[];
}

interface SupplierItem {
  id: string;
  name: string;
  websiteUrl: string;
  connectionType: 'ACCOUNT' | 'API' | 'CUSTOM';
  providerType: string;
  status: string;
  connectionStatus: 'CONNECTED' | 'DEGRADED' | 'AUTH_FAILED' | 'EXPIRED' | 'INVALID' | 'LOCKED' | 'ERROR' | 'ACTION_REQUIRED' | 'DISCONNECTED';
  balance: number;
  currency: string;
  capabilities: {
    balance: boolean;
    product_sync: boolean;
    category_sync: boolean;
    create_order: boolean;
    order_status: boolean;
    cancel_order: boolean;
  };
  priceConfig: {
    markupType: 'PERCENT' | 'FIXED';
    markupValue: number;
    autoUpdatePrice: boolean;
    manualPriceOverride: boolean;
    roundingUnit: number;
    roundingMode: 'OFF' | 'ROUND_NEAREST' | 'ROUND_UP' | 'ROUND_DOWN';
  };
  stats: {
    totalProducts: number;
    mappedProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
  };
  lastConnectedAt?: string;
  lastSyncAt?: string;
  lastBalanceCheckAt?: string;
  lastError?: string;
  actionRequiredMessage?: string;
  lastDiagnostics?: ConnectionDiagnostics;
}

interface ProductMapping {
  id: string;
  supplierId: string;
  supplierProductId: string;
  localProductId: string;
  supplierCategoryId?: string;
  supplierPrice: number;
  calculatedPrice: number;
  manualPrice?: number;
  manualPriceOverride: boolean;
  finalSellingPrice: number;
  status: 'ACTIVE' | 'DISABLED';
  deliveryBranch?: 'ACCOUNT' | 'KEY' | 'LINK' | 'GIFTCARD';
  outputFormat?: string;
  outputTemplate?: string;
  localTitle?: string;
  localCategory?: string;
  stockAvailable?: number;
  images?: string[];
  localPrice?: number;
  updatedAt?: string;
}

interface SupplierOrder {
  id: string;
  localOrderId: string;
  supplierId: string;
  supplierName: string;
  connectionType: 'ACCOUNT' | 'API' | 'CUSTOM';
  supplierProductId: string;
  supplierOrderReference: string;
  customerPrice: number;
  supplierCost: number;
  markupAmount: number;
  netProfit: number;
  status: string;
  deliveredData?: any;
  createdAt: string;
}

interface SyncJobResult {
  id: string;
  supplierId: string;
  mode: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  totalDiscovered: number;
  totalItemsScanned: number;
  totalItemsUpserted: number;
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
  totalFailed: number;
  progressPercent: number;
  categoriesScanned: number;
  totalCategories: number;
  scanDiagnostics?: Array<{ step: string; status: 'PASS' | 'FAIL' | 'SKIPPED'; message: string }>;
  error?: string;
}

export const AdminSuppliersTab: React.FC<AdminSuppliersTabProps> = ({
  currency
}) => {
  const [suppliersList, setSuppliersList] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'ACCOUNT' | 'API' | 'CUSTOM'>('ALL');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);
  const [isSyncProgressModalOpen, setIsSyncProgressModalOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductMapping | null>(null);

  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);
  const [supplierMappings, setSupplierMappings] = useState<ProductMapping[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [activeDiagnostics, setActiveDiagnostics] = useState<ConnectionDiagnostics | null>(null);
  const [activeSyncJob, setActiveSyncJob] = useState<SyncJobResult | null>(null);
  const [dbVerification, setDbVerification] = useState<any>(null);

  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    try {
      const res = await authFetch(`/api/v1/supplier-hub/suppliers/${supplierToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setSuppliersList(prev => prev.filter(s => s.id !== supplierToDelete.id));
        setActionNotice({
          type: 'success',
          text: `Đã xóa thành công đối tác "${supplierToDelete.name}" và toàn bộ mapping liên quan.`
        });
        setSupplierToDelete(null);
        await fetchDbVerification();
      } else {
        setActionNotice({ type: 'error', text: data.message || 'Xóa đối tác thất bại' });
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', text: `Lỗi khi xóa đối tác: ${err.message}` });
    } finally {
      setIsDeleting(false);
    }
  };

  // New Supplier Form State
  const [newType, setNewType] = useState<'ACCOUNT' | 'API' | 'CUSTOM'>('ACCOUNT');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiSecret, setNewApiSecret] = useState('');
  const [newMarkupType, setNewMarkupType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [newMarkupVal, setNewMarkupVal] = useState<number>(20);
  const [newRoundingUnit, setNewRoundingUnit] = useState<number>(1000);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch all suppliers from backend
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/v1/supplier-hub/suppliers');
      const data = await res.json();
      if (data.success) {
        setSuppliersList(data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Verify DB Persistence status
  const fetchDbVerification = async () => {
    try {
      const res = await authFetch('/api/v1/supplier-hub/diagnostics/database');
      const data = await res.json();
      if (data.success) {
        setDbVerification(data.data);
      }
    } catch (err) {
      console.error('Failed to verify database:', err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchDbVerification();
  }, []);

  // Filtered list
  const filteredSuppliers = suppliersList.filter(s => {
    if (filterType === 'ALL') return true;
    return s.connectionType === filterType;
  });

  // Calculate high-level KPIs
  const totalBalance = suppliersList.reduce((acc, s) => acc + s.balance, 0);
  const totalRevenue = suppliersList.reduce((acc, s) => acc + s.stats.totalRevenue, 0);
  const totalProfit = suppliersList.reduce((acc, s) => acc + s.stats.totalProfit, 0);
  const activeCount = suppliersList.filter(s => s.connectionStatus === 'CONNECTED').length;

  // Real Connection Test with Diagnostics
  const handleTestConnection = async (supplier: SupplierItem) => {
    setTestingId(supplier.id);
    setActionNotice(null);
    try {
      const res = await authFetch(`/api/v1/supplier-hub/suppliers/${supplier.id}/test-connection`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.diagnostics) {
        setActiveDiagnostics(data.diagnostics);
        setIsDiagnosticsModalOpen(true);
      }

      if (data.success) {
        setActionNotice({
          type: 'success',
          text: `[${supplier.name}] KẾT NỐI THÀNH CÔNG! Đã xác thực thực tế. Số dư khả dụng: ${data.balance?.toLocaleString('vi-VN')} đ`
        });
      } else {
        if (data.actionRequired) {
          setActionNotice({
            type: 'info',
            text: `[${supplier.name}] YÊU CẦU THAO TÁC: ${data.actionMessage || 'Vui lòng xác minh 2FA hoặc CAPTCHA trên tài khoản website nguồn'}`
          });
        } else {
          setActionNotice({
            type: 'error',
            text: `[${supplier.name}] Kết nối không thành công: ${data.message || 'Xem chẩn đoán chi tiết'}`
          });
        }
      }
      await fetchSuppliers();
      await fetchDbVerification();
    } catch (err: any) {
      setActionNotice({ type: 'error', text: `Lỗi gọi kiểm tra kết nối: ${err.message}` });
    } finally {
      setTestingId(null);
    }
  };

  // Open Diagnostics view directly
  const handleViewDiagnostics = (supplier: SupplierItem) => {
    if (supplier.lastDiagnostics) {
      setActiveDiagnostics(supplier.lastDiagnostics);
      setIsDiagnosticsModalOpen(true);
    } else {
      handleTestConnection(supplier);
    }
  };

  // Refresh Balance
  const handleRefreshBalance = async (supplierId: string) => {
    try {
      const res = await authFetch(`/api/v1/supplier-hub/suppliers/${supplierId}/refresh-balance`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice({
          type: 'success',
          text: `Cập nhật số dư thành công: ${data.balance?.toLocaleString('vi-VN')} đ`
        });
        await fetchSuppliers();
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', text: `Lỗi kiểm tra số dư: ${err.message}` });
    }
  };

  // Run Product Sync Job with Live Progress View
  const handleSyncProducts = async (supplier: SupplierItem) => {
    setSyncingId(supplier.id);
    setActionNotice(null);
    setSelectedSupplier(supplier);
    setIsSyncProgressModalOpen(true);
    setActiveSyncJob({
      id: `job_${Date.now()}`,
      supplierId: supplier.id,
      mode: 'FULL',
      status: 'RUNNING',
      totalDiscovered: 0,
      totalItemsScanned: 0,
      totalItemsUpserted: 0,
      totalCreated: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      totalFailed: 0,
      progressPercent: 25,
      categoriesScanned: 0,
      totalCategories: 0,
      scanDiagnostics: [
        { step: 'Khởi tạo Kết Nối', status: 'PASS', message: `Gửi yêu cầu tới ${supplier.websiteUrl}` }
      ]
    });

    try {
      const res = await authFetch(`/api/v1/supplier-hub/suppliers/${supplier.id}/sync-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'FULL' })
      });
      const data = await res.json();
      if (data.success && data.job) {
        setActiveSyncJob(data.job);
        setActionNotice({
          type: 'success',
          text: `Đồng bộ hoàn tất! Quét được: ${data.job.totalItemsScanned} sản phẩm, Đã đưa vào kho bán: ${data.job.totalItemsUpserted} sản phẩm.`
        });
      } else {
        setActiveSyncJob({
          id: `job_err`,
          supplierId: supplier.id,
          mode: 'FULL',
          status: 'FAILED',
          totalDiscovered: 0,
          totalItemsScanned: 0,
          totalItemsUpserted: 0,
          totalCreated: 0,
          totalUpdated: 0,
          totalSkipped: 0,
          totalFailed: 0,
          progressPercent: 100,
          categoriesScanned: 0,
          totalCategories: 0,
          error: data.message || data.job?.error || 'Lỗi quét sản phẩm từ nguồn'
        });
      }
      await fetchSuppliers();
      await fetchDbVerification();
    } catch (err: any) {
      setActionNotice({ type: 'error', text: `Lỗi đồng bộ: ${err.message}` });
    } finally {
      setSyncingId(null);
    }
  };

  // Open Mappings Modal
  const handleOpenMappings = async (supplier: SupplierItem) => {
    setSelectedSupplier(supplier);
    setIsMappingModalOpen(true);
    try {
      const res = await authFetch(`/api/v1/supplier-hub/suppliers/${supplier.id}/mappings`);
      const data = await res.json();
      if (data.success) {
        setSupplierMappings(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Orders Ledger
  const handleOpenOrders = async () => {
    setIsOrdersModalOpen(true);
    try {
      const res = await authFetch('/api/v1/supplier-hub/orders');
      const data = await res.json();
      if (data.success) {
        setSupplierOrders(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUrl) return;

    try {
      const payload: any = {
        name: newName,
        websiteUrl: newUrl,
        connectionType: newType,
        priceConfig: {
          markupType: newMarkupType,
          markupValue: Number(newMarkupVal) || 20,
          autoUpdatePrice: true,
          manualPriceOverride: false,
          roundingUnit: Number(newRoundingUnit) || 1000,
          roundingMode: 'ROUND_UP'
        }
      };

      if (newType === 'ACCOUNT') {
        payload.username = newUsername;
        payload.password = newPassword;
      } else if (newType === 'API') {
        payload.apiKey = newApiKey;
        payload.apiSecret = newApiSecret;
      }

      const res = await authFetch('/api/v1/supplier-hub/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setIsAddModalOpen(false);
        setNewName('');
        setNewUrl('');
        setNewUsername('');
        setNewPassword('');
        setNewApiKey('');
        setActionNotice({
          type: 'success',
          text: `Đã kết nối thành công nhà cung cấp [${newName}]. Vui lòng bấm Test Kết Nối để kiểm tra chẩn đoán.`
        });
        await fetchSuppliers();
        await fetchDbVerification();
      } else {
        setActionNotice({ type: 'error', text: data.message || 'Lỗi khi tạo nhà cung cấp' });
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message });
    }
  };

  // Update Mapping Manual Price Override
  const handleToggleManualOverride = async (mapping: ProductMapping, enableOverride: boolean, customPrice?: number) => {
    try {
      const price = customPrice !== undefined ? customPrice : (mapping.manualPrice || mapping.calculatedPrice);
      await authFetch(`/api/v1/supplier-hub/mappings/${mapping.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualPriceOverride: enableOverride,
          manualPrice: price
        })
      });

      // Update local state
      setSupplierMappings(prev => prev.map(m => m.id === mapping.id ? {
        ...m,
        manualPriceOverride: enableOverride,
        manualPrice: price,
        finalSellingPrice: enableOverride ? price : m.calculatedPrice
      } : m));

      if (selectedProductDetail?.id === mapping.id) {
        setSelectedProductDetail(prev => prev ? {
          ...prev,
          manualPriceOverride: enableOverride,
          manualPrice: price,
          finalSellingPrice: enableOverride ? price : prev.calculatedPrice
        } : null);
      }
      await fetchDbVerification();
    } catch (err) {
      console.error(err);
    }
  };

  // Branch filter state for mapping modal
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<'ALL' | 'ACCOUNT' | 'KEY' | 'LINK' | 'GIFTCARD'>('ALL');

  // Update Product Mapping Branch & Output Format
  const handleUpdateBranch = async (
    mapping: ProductMapping, 
    newBranch: 'ACCOUNT' | 'KEY' | 'LINK' | 'GIFTCARD', 
    newFormat?: string,
    newTemplate?: string
  ) => {
    try {
      let defaultFormat = newFormat;
      let defaultTemplate = newTemplate;
      if (!defaultFormat) {
        if (newBranch === 'ACCOUNT') {
          defaultFormat = 'USER_PASS_COOKIE';
          defaultTemplate = 'username|password|cookie';
        } else if (newBranch === 'KEY') {
          defaultFormat = 'LICENSE_KEY';
          defaultTemplate = 'XXXXX-XXXXX-XXXXX';
        } else if (newBranch === 'LINK') {
          defaultFormat = 'REDEEM_LINK';
          defaultTemplate = 'https://invite.link/...';
        } else {
          defaultFormat = 'CARD_PIN';
          defaultTemplate = 'Mã Thẻ | PIN';
        }
      }

      const res = await authFetch(`/api/v1/supplier-hub/mappings/${mapping.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryBranch: newBranch,
          outputFormat: defaultFormat,
          outputTemplate: defaultTemplate
        })
      });

      if (res.ok) {
        setSupplierMappings(prev => prev.map(m => m.id === mapping.id ? { 
          ...m, 
          deliveryBranch: newBranch, 
          outputFormat: defaultFormat,
          outputTemplate: defaultTemplate
        } : m));

        if (selectedProductDetail && selectedProductDetail.id === mapping.id) {
          setSelectedProductDetail(prev => prev ? {
            ...prev,
            deliveryBranch: newBranch,
            outputFormat: defaultFormat,
            outputTemplate: defaultTemplate
          } : null);
        }

        setActionNotice({
          type: 'success',
          text: `Đã chuyển phân nhánh thành [${newBranch}] cho "${mapping.localTitle || mapping.supplierProductId}"!`
        });
        setTimeout(() => setActionNotice(null), 3500);
      }
    } catch (err: any) {
      console.error('Failed to update branch:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Background Cron Daemon Realtime Monitor & Stock Sync Hub */}
      <AdminCronMonitor />

      {/* Top Banner / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nhà Cung Cấp Đã Đấu Nối</div>
            <div className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <span>{suppliersList.length}</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {activeCount} Đang Kết Nối
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Số Dư Nguồn Khả Dụng</div>
            <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
              {formatCurrency(totalBalance, currency)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Doanh Thu Từ Nguồn</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
              {formatCurrency(totalRevenue, currency)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lợi Nhuận Ròng (Profit)</div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-1">
              {formatCurrency(totalProfit, currency)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Database & Persistence Verification Card (Requirement #18) */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Độ Bền Vững Dữ Liệu (Persistent Database Engine)</span>
              <span className="px-2 py-0.2 bg-emerald-950 text-emerald-400 rounded-full font-mono text-[10px] border border-emerald-500/30">
                LƯU TRỮ VĨNH VIỄN
              </span>
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Đã ghi vào đĩa: <b className="text-cyan-300">{dbVerification?.totalProductMappingsInStore || 0}</b> mappings | <b className="text-emerald-300">{dbVerification?.totalSyncedProductsInLocalCatalog || 0}</b> sản phẩm nguồn trong catalog | Không mất dữ liệu khi restart
            </div>
          </div>
        </div>

        <button
          onClick={fetchDbVerification}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer border border-slate-700 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Xác Thực Lưu Trữ DB</span>
        </button>
      </div>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
          actionNotice.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : actionNotice.type === 'error'
            ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : actionNotice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            )}
            <span className="font-medium">{actionNotice.text}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Control Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold mr-1">Bộ lọc:</span>
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              filterType === 'ALL'
                ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Tất Cả ({suppliersList.length})
          </button>
          <button
            onClick={() => setFilterType('ACCOUNT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              filterType === 'ACCOUNT'
                ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Tài Khoản Web (First-Class)</span>
          </button>
          <button
            onClick={() => setFilterType('API')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              filterType === 'API'
                ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Key Gateway</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleOpenOrders}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sổ Đơn Nguồn & Đối Soát</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Nhà Cung Cấp Mới</span>
          </button>
        </div>
      </div>

      {/* Suppliers Cards Grid */}
      <div className="space-y-3.5">
        {filteredSuppliers.map((supplier) => {
          const isTesting = testingId === supplier.id;
          const isSyncing = syncingId === supplier.id;

          return (
            <div
              key={supplier.id}
              className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    supplier.connectionType === 'ACCOUNT'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : supplier.connectionType === 'API'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {supplier.connectionType === 'ACCOUNT' ? (
                      <UserCheck className="w-5 h-5" />
                    ) : supplier.connectionType === 'API' ? (
                      <Key className="w-5 h-5" />
                    ) : (
                      <Server className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white">{supplier.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 border ${
                        supplier.providerType === 'G2UP_CMSNT'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : supplier.connectionType === 'ACCOUNT'
                          ? 'bg-blue-950 text-blue-300 border-blue-500/30'
                          : supplier.connectionType === 'API'
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                          : 'bg-purple-950 text-purple-300 border-purple-500/30'
                      }`}>
                        {supplier.providerType === 'G2UP_CMSNT'
                          ? '⚡ REST API LIVE (G2UP / CMSNT)'
                          : supplier.connectionType === 'ACCOUNT'
                          ? '👤 ACCOUNT (DIRECT LIVE)'
                          : supplier.connectionType === 'API'
                          ? '🔑 API KEY GATEWAY'
                          : '⚙️ CUSTOM CONNECTOR'}
                      </span>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        supplier.connectionStatus === 'CONNECTED'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                          : supplier.connectionStatus === 'ACTION_REQUIRED'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30 animate-pulse'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                      }`}>
                        {supplier.connectionStatus === 'CONNECTED' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : supplier.connectionStatus === 'ACTION_REQUIRED' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        <span>{supplier.connectionStatus}</span>
                      </span>
                    </div>

                    <a 
                      href={supplier.websiteUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 mt-0.5 transition-colors"
                    >
                      <Globe className="w-3 h-3 text-slate-500" />
                      <span>{supplier.websiteUrl}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                {/* Balance & Status */}
                <div className="flex items-center gap-3 bg-black/40 px-3.5 py-2 rounded-xl border border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Số Dư Khả Dụng</div>
                    <div className="text-sm font-mono font-bold text-cyan-400">
                      {formatCurrency(supplier.balance, (supplier.currency as CurrencyCode) || currency || 'VND')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRefreshBalance(supplier.id)}
                    title="Cập nhật số dư"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Capabilities & Price Formula Strip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-400 font-semibold">Khả Năng:</span>
                  {supplier.capabilities.balance && (
                    <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">Đọc Số Dư</span>
                  )}
                  {supplier.capabilities.product_sync && (
                    <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">Đồng Bộ SP</span>
                  )}
                  {supplier.capabilities.create_order && (
                    <span className="px-1.5 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-500/20 rounded text-[10px] font-bold">
                      Mua Nối Tiếp Tự Động
                    </span>
                  )}
                  {supplier.capabilities.order_status && (
                    <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">Truy Vấn Đơn</span>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <div className="text-slate-400">
                    Công thức giá: <span className="text-cyan-300 font-bold font-mono">
                      {supplier.priceConfig.markupType === 'PERCENT' ? `+${supplier.priceConfig.markupValue}%` : `+${supplier.priceConfig.markupValue.toLocaleString()} đ`}
                    </span>
                    <span className="text-slate-500 text-[10px] ml-1">
                      (Làm tròn: {supplier.priceConfig.roundingUnit.toLocaleString()}đ)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Diagnostics Trigger */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Sản phẩm: <b className="text-white">{supplier.stats.totalProducts}</b> (Đã map: <b className="text-cyan-400">{supplier.stats.mappedProducts}</b>)</span>
                  <span>Đơn hoàn tất: <b className="text-emerald-400">{supplier.stats.totalOrders}</b></span>
                  <span>Lợi nhuận: <b className="text-amber-400">{formatCurrency(supplier.stats.totalProfit, currency)}</b></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewDiagnostics(supplier)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer border border-slate-700"
                    title="Xem chi tiết chẩn đoán kết nối & auth"
                  >
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Chẩn Đoán</span>
                  </button>

                  <button
                    onClick={() => handleTestConnection(supplier)}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all border border-slate-700"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Đang Test...' : 'Test Kết Nối Thật'}</span>
                  </button>

                  <button
                    onClick={() => handleSyncProducts(supplier)}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                  >
                    <Database className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Đang Đồng Bộ...' : 'Quét & Đồng Bộ SP'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenMappings(supplier)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Bảng Giá & Mapping</span>
                  </button>

                  <button
                    onClick={() => setSupplierToDelete(supplier)}
                    className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1 cursor-pointer border border-red-500/30 transition-all"
                    title="Xóa đối tác nhà cung cấp này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: ADD NEW SUPPLIER (Account / API / Custom) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyan-400" />
                  <span>Thêm Kết Nối Nguồn Mới</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hỗ trợ kết nối qua tài khoản web nguồn (không cần API Key) hoặc API Key Gateway
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {/* Connection Type Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Phương Thức Kết Nối (Connection Type)</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewType('ACCOUNT')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    newType === 'ACCOUNT'
                      ? 'bg-blue-950/60 border-blue-500 text-blue-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <UserCheck className="w-4 h-4" />
                    <span>Tài Khoản Web</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">First-class citizen, không cần API Key</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewType('API')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    newType === 'API'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Key className="w-4 h-4" />
                    <span>API Key</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">REST API / Open Key</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewType('CUSTOM')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    newType === 'CUSTOM'
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Server className="w-4 h-4" />
                    <span>Custom</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Scraper / Adapter riêng</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Tên Nhà Cung Cấp / Website</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Shop Robux Trực Tiếp, Kho Thẻ Sỉ 247..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Địa Chỉ Website Nguồn (URL)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://supplier.example"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Fields for Account Type */}
                {newType === 'ACCOUNT' && (
                  <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 space-y-3">
                    <div className="text-[11px] text-blue-300 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      <span>Thông tin tài khoản đăng nhập tại website nguồn (Mã hóa AES-256-GCM)</span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Tên Đăng Nhập / Email</label>
                      <input
                        type="text"
                        required
                        placeholder="my_account_username"
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Mật Khẩu Tài Khoản</label>
                      <div className="relative mt-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••••••"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 pr-10"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Fields for API Type */}
                {newType === 'API' && (
                  <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">API Key / Secret Token</label>
                      <input
                        type="password"
                        required
                        placeholder="sk_live_..."
                        value={newApiKey}
                        onChange={e => setNewApiKey(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {/* Price Rules */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-cyan-400">Công Thức Tăng Giá (Pricing Engine)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400">Loại Markup</label>
                      <select
                        value={newMarkupType}
                        onChange={e => setNewMarkupType(e.target.value as any)}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      >
                        <option value="PERCENT">Phần Trăm (%)</option>
                        <option value="FIXED">Số Tiền Cố Định (VND)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400">
                        {newMarkupType === 'PERCENT' ? 'Giá Trị (%)' : 'Giá Trị (VNĐ)'}
                      </label>
                      <input
                        type="number"
                        value={newMarkupVal}
                        onChange={e => setNewMarkupVal(Number(e.target.value))}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400">Đơn vị làm tròn (VND)</label>
                    <select
                      value={newRoundingUnit}
                      onChange={e => setNewRoundingUnit(Number(e.target.value))}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    >
                      <option value={0}>Không làm tròn</option>
                      <option value={100}>100 đ</option>
                      <option value={500}>500 đ</option>
                      <option value={1000}>1,000 đ</option>
                      <option value={5000}>5,000 đ</option>
                      <option value={10000}>10,000 đ</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold cursor-pointer transition-all"
                >
                  Lưu & Kết Nối Nguồn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONNECTION DIAGNOSTICS VIEW (Requirement #23) */}
      {isDiagnosticsModalOpen && activeDiagnostics && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 text-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <span>Bảng Chẩn Đoán Kết Nối Thực Tế (Diagnostics)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Kiểm tra chi tiết từng tầng: Network, Authentication, Account, Session, Balance, Categories & Products
                </p>
              </div>
              <button onClick={() => setIsDiagnosticsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {/* Diagnostics Matrix Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">Network Ping</div>
                <div className="mt-1 font-bold flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${activeDiagnostics.network === 'PASS' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  <span className={activeDiagnostics.network === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}>
                    {activeDiagnostics.network}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">Authentication</div>
                <div className="mt-1 font-bold flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${activeDiagnostics.authentication === 'PASS' ? 'bg-emerald-400' : activeDiagnostics.authentication === 'FAIL' ? 'bg-rose-500' : 'bg-slate-500'}`} />
                  <span className={activeDiagnostics.authentication === 'PASS' ? 'text-emerald-400' : activeDiagnostics.authentication === 'FAIL' ? 'text-rose-400' : 'text-slate-400'}>
                    {activeDiagnostics.authentication}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">Session Cookie</div>
                <div className="mt-1 font-bold flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${activeDiagnostics.session === 'PASS' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span className={activeDiagnostics.session === 'PASS' ? 'text-emerald-400' : 'text-slate-400'}>
                    {activeDiagnostics.session}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold">Ví Tài Khoản</div>
                <div className="mt-1 font-bold flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${activeDiagnostics.balance === 'PASS' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <span className={activeDiagnostics.balance === 'PASS' ? 'text-emerald-400' : 'text-slate-400'}>
                    {activeDiagnostics.balance}
                  </span>
                </div>
              </div>
            </div>

            {/* Steps Breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300">Nhật Ký Thực Thi Kiểm Tra (Step-by-step Logs):</div>
              <div className="max-h-56 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                {activeDiagnostics.steps?.map((st, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 pb-1.5 border-b border-slate-900 last:border-0">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      st.status === 'PASS' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                        : st.status === 'FAIL' 
                        ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {st.status}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-200">{st.step}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{st.message}</div>
                    </div>
                    {st.durationMs !== undefined && (
                      <span className="text-slate-500 text-[10px] shrink-0 font-sans">{st.durationMs}ms</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {activeDiagnostics.reason && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{activeDiagnostics.reason}</span>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsDiagnosticsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SYNC PROGRESS & SCAN DIAGNOSTICS VIEW */}
      {isSyncProgressModalOpen && activeSyncJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 text-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  <span>Tiến Trình Quét & Đồng Bộ Sản Phẩm Nguồn</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phân trang thực tế, chuẩn hóa dữ liệu và ghi vào database lưu trữ
                </p>
              </div>
              <button onClick={() => setIsSyncProgressModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">
                  {activeSyncJob.status === 'RUNNING' ? 'Đang thực thi quét catalog...' : activeSyncJob.status === 'SUCCESS' ? 'Đã hoàn tất đồng bộ!' : 'Quá trình thất bại'}
                </span>
                <span className="text-cyan-400 font-mono">{activeSyncJob.progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-300 ${activeSyncJob.status === 'FAILED' ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                  style={{ width: `${activeSyncJob.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Metrics Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">Danh Mục Quét</div>
                <div className="text-base font-bold text-white mt-0.5 font-mono">
                  {activeSyncJob.categoriesScanned} / {activeSyncJob.totalCategories || 1}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">Sản Phẩm Đã Quét</div>
                <div className="text-base font-bold text-cyan-400 mt-0.5 font-mono">
                  {activeSyncJob.totalItemsScanned}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">Sản Phẩm Mới Thêm</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5 font-mono">
                  +{activeSyncJob.totalCreated}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400">Cập Nhật Giá / Kho</div>
                <div className="text-base font-bold text-blue-400 mt-0.5 font-mono">
                  {activeSyncJob.totalUpdated}
                </div>
              </div>
            </div>

            {/* Scan Diagnostics Steps */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300">Nhật Ký Quét Chi Tiết:</div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                {activeSyncJob.scanDiagnostics?.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 pb-1 border-b border-slate-900 last:border-0">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${step.status === 'PASS' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                      {step.status}
                    </span>
                    <span className="font-semibold text-slate-200">{step.step}:</span>
                    <span className="text-slate-400 text-[11px] truncate">{step.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {activeSyncJob.error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{activeSyncJob.error}</span>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsSyncProgressModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW & EDIT PRODUCT MAPPINGS (Requirement #24) */}
      {isMappingModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  <span>Bảng Sản Phẩm & Giá Bán: {selectedSupplier.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click vào bất kỳ dòng nào để xem chi tiết mapping, so sánh giá vốn, và ghi đè giá bán thủ công (Manual Price Override)
                </p>
              </div>
              <button onClick={() => setIsMappingModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {supplierMappings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có sản phẩm nào được map. Vui lòng nhấn nút "Quét & Đồng Bộ SP" để hệ thống quét danh mục thực tế từ website nguồn.
              </div>
            ) : (() => {
              const branchCounts = {
                ALL: supplierMappings.length,
                ACCOUNT: supplierMappings.filter(m => (m.deliveryBranch || 'ACCOUNT') === 'ACCOUNT').length,
                KEY: supplierMappings.filter(m => m.deliveryBranch === 'KEY').length,
                LINK: supplierMappings.filter(m => m.deliveryBranch === 'LINK').length,
                GIFTCARD: supplierMappings.filter(m => m.deliveryBranch === 'GIFTCARD').length,
              };

              const displayedMappings = supplierMappings.filter(m => {
                if (selectedBranchFilter === 'ALL') return true;
                return (m.deliveryBranch || 'ACCOUNT') === selectedBranchFilter;
              });

              return (
                <div className="space-y-3">
                  {/* Branch Filter Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                      onClick={() => setSelectedBranchFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedBranchFilter === 'ALL'
                          ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>Tất cả</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono">{branchCounts.ALL}</span>
                    </button>

                    <button
                      onClick={() => setSelectedBranchFilter('ACCOUNT')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedBranchFilter === 'ACCOUNT'
                          ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>👤 Account</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono">{branchCounts.ACCOUNT}</span>
                    </button>

                    <button
                      onClick={() => setSelectedBranchFilter('KEY')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedBranchFilter === 'KEY'
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>🔑 Key</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono">{branchCounts.KEY}</span>
                    </button>

                    <button
                      onClick={() => setSelectedBranchFilter('LINK')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedBranchFilter === 'LINK'
                          ? 'bg-indigo-500 text-black shadow-md shadow-indigo-500/20'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>🔗 Link</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono">{branchCounts.LINK}</span>
                    </button>

                    <button
                      onClick={() => setSelectedBranchFilter('GIFTCARD')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedBranchFilter === 'GIFTCARD'
                          ? 'bg-rose-500 text-black shadow-md shadow-rose-500/20'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>🎁 Giftcard</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 font-mono">{branchCounts.GIFTCARD}</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-[52vh] scrollbar-thin">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40 sticky top-0 backdrop-blur-md z-10">
                          <th className="p-2.5">Sản Phẩm</th>
                          <th className="p-2.5">Mã Nguồn</th>
                          <th className="p-2.5">Phân Nhánh Web & Mẫu Output</th>
                          <th className="p-2.5">Giá Vốn</th>
                          <th className="p-2.5">Giá Sau Markup</th>
                          <th className="p-2.5">Ghi Đè Thủ Công?</th>
                          <th className="p-2.5">Giá Bán Niêm Yết</th>
                          <th className="p-2.5 text-right">Chi Tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {displayedMappings.map(mapping => {
                          const currentBranch = mapping.deliveryBranch || 'ACCOUNT';
                          return (
                            <tr 
                              key={mapping.id} 
                              onClick={() => setSelectedProductDetail(mapping)}
                              className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                            >
                              <td className="p-2.5">
                                <div className="flex items-center gap-2.5">
                                  {mapping.images && mapping.images[0] ? (
                                    <img 
                                      src={mapping.images[0]} 
                                      alt="" 
                                      referrerPolicy="no-referrer"
                                      className="w-8 h-8 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0" 
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                      <FileText className="w-4 h-4 text-slate-400" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-semibold text-white truncate max-w-[170px] flex items-center gap-1.5">
                                      <span>{mapping.localTitle || mapping.supplierProductId}</span>
                                      {(mapping.status as string === 'OUT_OF_STOCK' || (mapping.stockAvailable !== undefined && mapping.stockAvailable <= 0)) && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-950 border border-rose-500/70 text-rose-300 shrink-0">
                                          HẾT HÀNG
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                      <span>{mapping.localCategory || 'software'}</span>
                                      <span>•</span>
                                      <span className={(mapping.stockAvailable !== undefined && mapping.stockAvailable <= 0) ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                        Kho: {mapping.stockAvailable ?? 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-2.5 font-mono text-cyan-300">
                                {mapping.supplierProductId}
                              </td>
                              <td className="p-2.5" onClick={e => e.stopPropagation()}>
                                <div className="flex flex-col gap-1">
                                  <select
                                    value={currentBranch}
                                    onChange={e => handleUpdateBranch(mapping, e.target.value as any)}
                                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                                      currentBranch === 'ACCOUNT'
                                        ? 'bg-emerald-950 border-emerald-500/60 text-emerald-300'
                                        : currentBranch === 'KEY'
                                        ? 'bg-amber-950 border-amber-500/60 text-amber-300'
                                        : currentBranch === 'LINK'
                                        ? 'bg-indigo-950 border-indigo-500/60 text-indigo-300'
                                        : 'bg-rose-950 border-rose-500/60 text-rose-300'
                                    }`}
                                  >
                                    <option value="ACCOUNT" className="bg-slate-900 text-emerald-300">👤 Account (User:Pass:Cookie)</option>
                                    <option value="KEY" className="bg-slate-900 text-amber-300">🔑 Key (Mã bản quyền)</option>
                                    <option value="LINK" className="bg-slate-900 text-indigo-300">🔗 Link (Mời / Kích hoạt)</option>
                                    <option value="GIFTCARD" className="bg-slate-900 text-rose-300">🎁 Giftcard (Mã thẻ + PIN)</option>
                                  </select>
                                  <span className="text-[9px] text-slate-400 font-mono truncate max-w-[150px]">
                                    {mapping.outputFormat || (currentBranch === 'ACCOUNT' ? 'USER_PASS_COOKIE' : currentBranch === 'KEY' ? 'LICENSE_KEY' : currentBranch === 'LINK' ? 'REDEEM_LINK' : 'CARD_PIN')}
                                  </span>
                                </div>
                              </td>
                              <td className="p-2.5 font-mono text-slate-300">
                                {mapping.supplierPrice.toLocaleString()} đ
                              </td>
                              <td className="p-2.5 font-mono text-emerald-400">
                                {mapping.calculatedPrice.toLocaleString()} đ
                              </td>
                              <td className="p-2.5" onClick={e => e.stopPropagation()}>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={mapping.manualPriceOverride}
                                    onChange={e => handleToggleManualOverride(mapping, e.target.checked)}
                                    className="rounded text-cyan-500 focus:ring-0"
                                  />
                                  <span className={`text-[11px] font-semibold ${mapping.manualPriceOverride ? 'text-amber-400' : 'text-slate-500'}`}>
                                    {mapping.manualPriceOverride ? 'Bật' : 'Tự động'}
                                  </span>
                                </label>
                              </td>
                              <td className="p-2.5 font-mono font-bold text-white" onClick={e => e.stopPropagation()}>
                                {mapping.manualPriceOverride ? (
                                  <input
                                    type="number"
                                    defaultValue={mapping.manualPrice || mapping.calculatedPrice}
                                    onBlur={e => handleToggleManualOverride(mapping, true, Number(e.target.value))}
                                    className="w-24 px-2 py-1 bg-black border border-amber-500/50 text-amber-300 rounded text-xs font-bold"
                                  />
                                ) : (
                                  <span>{mapping.finalSellingPrice.toLocaleString()} đ</span>
                                )}
                              </td>
                              <td className="p-2.5 text-right">
                                <span className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold underline">
                                  Xem
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsMappingModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PRODUCT MAPPING INSPECTOR (Requirement #24) */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Chi Tiết Khớp Nối Sản Phẩm (Mapping Inspector)</span>
                </h3>
                <p className="text-[11px] text-slate-400">{selectedProductDetail.localTitle || selectedProductDetail.supplierProductId}</p>
              </div>
              <button onClick={() => setSelectedProductDetail(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Supplier Product ID</div>
                  <div className="font-mono text-cyan-300 font-bold mt-0.5">{selectedProductDetail.supplierProductId}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Local Product ID</div>
                  <div className="font-mono text-slate-200 mt-0.5">{selectedProductDetail.localProductId}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div>
                  <div className="text-[10px] text-slate-400">Giá Vốn Nguồn</div>
                  <div className="font-mono font-bold text-slate-200 mt-0.5">{selectedProductDetail.supplierPrice.toLocaleString()} đ</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Giá Tự Động (Markup)</div>
                  <div className="font-mono font-bold text-blue-400 mt-0.5">{selectedProductDetail.calculatedPrice.toLocaleString()} đ</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Giá Bán Niêm Yết</div>
                  <div className="font-mono font-bold text-emerald-400 mt-0.5">{selectedProductDetail.finalSellingPrice.toLocaleString()} đ</div>
                </div>
              </div>

              {/* Manual Override Control */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">Ghi Đè Giá Thủ Công (Manual Price Override)</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProductDetail.manualPriceOverride}
                      onChange={e => handleToggleManualOverride(selectedProductDetail, e.target.checked)}
                      className="rounded text-amber-500 focus:ring-0"
                    />
                    <span className="text-[11px] font-semibold text-white">
                      {selectedProductDetail.manualPriceOverride ? 'BẬT' : 'TẮT'}
                    </span>
                  </label>
                </div>
                {selectedProductDetail.manualPriceOverride && (
                  <div className="pt-2">
                    <label className="text-[11px] text-slate-400">Giá Bán Bắt Buộc (VND):</label>
                    <input
                      type="number"
                      defaultValue={selectedProductDetail.manualPrice || selectedProductDetail.calculatedPrice}
                      onBlur={e => handleToggleManualOverride(selectedProductDetail, true, Number(e.target.value))}
                      className="w-full mt-1 px-3 py-1.5 bg-black border border-amber-500/50 text-amber-300 rounded-lg font-mono font-bold text-sm"
                    />
                  </div>
                )}
              </div>
              {/* Branch & Web Delivery Output Configuration */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-xs">Cấu Hình Phân Nhánh Web & Mẫu Output Sổ Ra Cho Khách</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono font-semibold">
                    Đang chọn: {selectedProductDetail.deliveryBranch || 'ACCOUNT'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateBranch(selectedProductDetail, 'ACCOUNT')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      (selectedProductDetail.deliveryBranch || 'ACCOUNT') === 'ACCOUNT'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>👤 Account</span>
                    <span className="text-[9px] text-slate-400">User:Pass:Cookie</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateBranch(selectedProductDetail, 'KEY')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedProductDetail.deliveryBranch === 'KEY'
                        ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>🔑 Key</span>
                    <span className="text-[9px] text-slate-400">Mã kích hoạt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateBranch(selectedProductDetail, 'LINK')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedProductDetail.deliveryBranch === 'LINK'
                        ? 'bg-indigo-950 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4 text-indigo-400" />
                    <span>🔗 Link</span>
                    <span className="text-[9px] text-slate-400">Mời Family/Team</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateBranch(selectedProductDetail, 'GIFTCARD')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      selectedProductDetail.deliveryBranch === 'GIFTCARD'
                        ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Gift className="w-4 h-4 text-rose-400" />
                    <span>🎁 Giftcard</span>
                    <span className="text-[9px] text-slate-400">Mã thẻ & PIN</span>
                  </button>
                </div>

                {/* Live Web Output Simulator */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>Mô Phỏng Giao Diện Khách Hàng Nhận Được Trên Web:</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Trực Quan 100%</span>
                  </div>
                  <WebDeliveryOutput
                    branch={selectedProductDetail.deliveryBranch || 'ACCOUNT'}
                    rawKey={
                      (selectedProductDetail.deliveryBranch || 'ACCOUNT') === 'ACCOUNT'
                        ? 'cyber_user123:Pass#998241:sess_cookie_token_abc'
                        : selectedProductDetail.deliveryBranch === 'KEY'
                        ? 'STEAM-WIN-7842-9901-4412'
                        : selectedProductDetail.deliveryBranch === 'LINK'
                        ? 'https://canva.com/brand/join?token=INVITE-VIP-994'
                        : 'GC89234812 | PIN: 9812'
                    }
                    productTitle={selectedProductDetail.localTitle}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold cursor-pointer"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: SUPPLIER ORDERS LEDGER & RECONCILIATION */}
      {isOrdersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-cyan-400" />
                  <span>Sổ Đơn Nguồn & Đối Soát Tài Chính (Supplier Orders Ledger)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bản lưu tài chính tức thời: Giá bán cho khách, giá vốn nhà cung cấp, và lợi nhuận ròng thực tế
                </p>
              </div>
              <button onClick={() => setIsOrdersModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {supplierOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có đơn hàng nào được kích hoạt qua nguồn. Khi khách hàng mua sản phẩm nguồn trên website, hệ thống sẽ tự động gửi lệnh mua tới nhà cung cấp và ghi sổ tại đây.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[60vh] scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                      <th className="p-2.5">Mã Đơn Local</th>
                      <th className="p-2.5">Nhà Cung Cấp</th>
                      <th className="p-2.5">Mã Giao Dịch Nguồn</th>
                      <th className="p-2.5">Khách Trả</th>
                      <th className="p-2.5">Giá Vốn Nguồn</th>
                      <th className="p-2.5 text-emerald-400 font-bold">Lợi Nhuận Ròng</th>
                      <th className="p-2.5">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {supplierOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-mono text-cyan-300 font-semibold">{order.localOrderId}</td>
                        <td className="p-2.5">
                          <span className="font-semibold text-white">{order.supplierName}</span>
                          <div className="text-[10px] text-slate-400">{order.connectionType}</div>
                        </td>
                        <td className="p-2.5 font-mono text-slate-300">{order.supplierOrderReference}</td>
                        <td className="p-2.5 font-mono text-white font-bold">{order.customerPrice.toLocaleString()} đ</td>
                        <td className="p-2.5 font-mono text-slate-400">{order.supplierCost.toLocaleString()} đ</td>
                        <td className="p-2.5 font-mono text-emerald-400 font-bold">+{order.netProfit.toLocaleString()} đ</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsOrdersModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CONFIRM DELETE SUPPLIER */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác Nhận Xóa Đối Tác</h3>
                <p className="text-xs text-slate-400">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="text-slate-300">
                Bạn có chắc chắn muốn xóa đối tác: <strong className="text-white">{supplierToDelete.name}</strong>?
              </div>
              <div className="text-slate-400">
                Website: <span className="font-mono text-cyan-300">{supplierToDelete.websiteUrl}</span>
              </div>
              <div className="text-amber-400 bg-amber-950/40 border border-amber-500/30 p-2 rounded-lg text-[11px] leading-relaxed">
                ⚠️ Cảnh báo: Việc xóa đối tác sẽ đồng thời xóa bỏ toàn bộ thông tin tài khoản / API Key và các liên kết sản phẩm (product mapping) đã gán cho đối tác này.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/30 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Đang Xóa...' : 'Xác Nhận Xóa Vĩnh Viễn'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
