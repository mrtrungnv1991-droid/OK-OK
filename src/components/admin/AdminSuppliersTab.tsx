import React from 'react';
import { Server, Plus, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { SupplierApiConfig, CurrencyCode } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AdminSuppliersTabProps {
  suppliers: SupplierApiConfig[];
  currency: CurrencyCode;
  onUpdateSupplierBalance: (supplierId: string, deltaBalance: number) => void;
}

export const AdminSuppliersTab: React.FC<AdminSuppliersTabProps> = ({
  suppliers,
  currency,
  onUpdateSupplierBalance
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>KẾT NỐI API SUPPLIERS & ĐỐI SOÁT ({suppliers.length} NHÀ CUNG CẤP)</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Quản lý số dư kết nối API, webhook nạp thẻ, cổng topup game và tự động hóa đồng bộ
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {suppliers.map(sup => (
          <div key={sup.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-white">{sup.providerName}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                  sup.status === 'connected'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                }`}>
                  {sup.status === 'connected' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                  )}
                  <span>{sup.status.toUpperCase()}</span>
                </span>
              </div>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                Số Dư: {formatCurrency(sup.balance, currency)}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono bg-black/40 p-2.5 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-slate-500">Endpoint:</span> <code className="text-cyan-300">{sup.apiUrl}</code>
              </div>
              <div>
                <span className="text-slate-500">Sync:</span> <span className="text-slate-300">{sup.lastSync}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <div className="text-[11px] text-slate-400">
                Auto Health Check: <span className="text-emerald-400 font-bold">BẬT (Every 60s)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateSupplierBalance(sup.id, 5000000)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ 5,000,000đ Số Dư</span>
                </button>
                <button
                  onClick={() => onUpdateSupplierBalance(sup.id, 20000000)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ 20,000,000đ</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
