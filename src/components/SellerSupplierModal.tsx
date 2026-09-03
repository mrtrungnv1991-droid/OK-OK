import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Cpu, 
  Key, 
  Database, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Sliders, 
  Zap,
  TrendingUp,
  Server,
  DollarSign
} from 'lucide-react';
import { SupplierApiConfig, UserProfile } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';
import { useUI } from '../contexts/UIContext';

interface SellerSupplierModalProps {
  suppliers: SupplierApiConfig[];
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSyncProvider: (providerId: string) => void;
}

export const SellerSupplierModal: React.FC<SellerSupplierModalProps> = ({
  suppliers,
  isOpen,
  onClose,
  user,
  onSyncProvider
}) => {
  const { t } = useTranslation();
  const { showToast } = useUI();
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'suppliers' | 'batch_keys' | 'payouts'>('suppliers');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [rawKeys, setRawKeys] = useState('');
  const [validationResult, setValidationResult] = useState<{ total: number; valid: number; duplicates: number } | null>(null);

  const handleTriggerSync = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      onSyncProvider(id);
      setSyncingId(null);
      showToast('Đồng bộ dữ liệu nhà cung cấp thành công!', 'success', {
        title: '⚡ ĐỒNG BỘ THÀNH CÔNG'
      });
    }, 1200);
  };

  const handleValidateBatch = () => {
    const lines = rawKeys.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const unique = new Set(lines);
    setValidationResult({
      total: lines.length,
      valid: unique.size,
      duplicates: lines.length - unique.size
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl bg-[#0a0d16] border border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.2)] overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2">
                <span>WHOLESALE SELLER & SUPPLIER API (ADCP OS)</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/30 uppercase">
                  Multi-Vendor Architecture
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Automated inventory sync, supplier API integrations & checklive crons
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`py-3 px-4 font-mono text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'suppliers'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>SUPPLIER APIS ({suppliers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('batch_keys')}
            className={`py-3 px-4 font-mono text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'batch_keys'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>BATCH KEY VALIDATION</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`py-3 px-4 font-mono text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'payouts'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>REVENUE & PAYOUTS</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400">Total Supplier Balance:</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                    {formatCurrency(153000000, user.currency)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400">Checklive Interval:</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    Every 60s (Active)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs font-mono text-slate-400">API Success Rate:</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    99.85% SLA
                  </div>
                </div>
              </div>

              {/* Suppliers List */}
              <div className="space-y-3">
                {suppliers.map(sup => (
                  <div
                    key={sup.id}
                    className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs">
                          API
                        </div>
                        <div>
                          <div className="text-sm font-bold font-mono text-white">
                            {sup.providerName}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            Endpoint: <code className="text-cyan-300">{sup.apiUrl}</code>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Connected</span>
                        </span>

                        <button
                          onClick={() => handleTriggerSync(sup.id)}
                          disabled={syncingId === sup.id}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingId === sup.id ? 'animate-spin text-cyan-300' : ''}`} />
                          <span>{syncingId === sup.id ? 'Syncing...' : 'Sync Now'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-300">
                      <div>
                        <span className="text-slate-500">Available Balance:</span>{' '}
                        <strong className="text-emerald-400">{formatCurrency(sup.balance, user.currency)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Last Sync:</span>{' '}
                        <span>{sup.lastSync}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-slate-500">Supported:</span>{' '}
                        <span>{sup.supportedGames.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'batch_keys' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-slate-200">
                    PASTE BATCH KEY LIST (1 KEY PER LINE)
                  </label>
                  <span className="text-xs text-slate-400 font-mono">Auto duplicate check & format</span>
                </div>

                <textarea
                  rows={6}
                  value={rawKeys}
                  onChange={(e) => setRawKeys(e.target.value)}
                  placeholder="ST-WUK-8812-441A-QXP9&#10;ST-WUK-3120-994F-ZLM2&#10;ST-WUK-7718-201K-BVT6&#10;..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                />

                <div className="flex items-center justify-between">
                  <button
                    onClick={handleValidateBatch}
                    disabled={!rawKeys.trim()}
                    className="py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase cursor-pointer"
                  >
                    Validate Batch
                  </button>

                  {validationResult && (
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-slate-300">Total: <strong>{validationResult.total}</strong></span>
                      <span className="text-emerald-400">Valid: <strong>{validationResult.valid}</strong></span>
                      <span className="text-amber-400">Duplicates: <strong>{validationResult.duplicates}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payouts' && (
            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-slate-400">Escrow Released Revenue:</div>
                  <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
                    {formatCurrency(38400000, user.currency)}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Exchange Fee: 2.5% • Bank transfer within 15 mins
                  </div>
                </div>

                <button
                  onClick={() => showToast('Yêu cầu rút doanh thu đã được gửi tới Ban Tài chính!', 'success', { title: '✓ YÊU CẦU RÚT TIỀN' })}
                  className="py-3 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Request Payout Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-[#070a12] flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Supplier Sync Service Online</span>
          </div>

          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold cursor-pointer"
          >
            {t('modal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
