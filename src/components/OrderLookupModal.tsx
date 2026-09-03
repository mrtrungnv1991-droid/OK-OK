import React, { useState } from 'react';
import { 
  X, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Key, 
  Copy, 
  ExternalLink,
  Gift,
  Zap,
  ArrowRight
} from 'lucide-react';
import { UserOrder } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';

interface OrderLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: UserOrder[];
  currency: 'VND' | 'USD';
}

export const OrderLookupModal: React.FC<OrderLookupModalProps> = ({
  isOpen,
  onClose,
  orders,
  currency
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [foundOrder, setFoundOrder] = useState<UserOrder | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setHasSearched(true);
    const cleanQuery = query.trim().toLowerCase();

    // Look in current orders or mock fallback for demonstration
    const match = orders.find(
      (o) =>
        o.id.toLowerCase() === cleanQuery ||
        o.txId.toLowerCase() === cleanQuery ||
        o.topupDetails?.uid.toLowerCase() === cleanQuery
    );

    if (match) {
      setFoundOrder(match);
    } else {
      // Mocked sample order if searching common term
      if (cleanQuery.includes('tx') || cleanQuery.includes('pool') || cleanQuery.length > 4) {
        setFoundOrder({
          id: `ord-guest-${Math.floor(1000 + Math.random() * 9000)}`,
          productId: 'prod-guest',
          productTitle: 'ChatGPT Plus (Group Pool)',
          platform: 'OpenAI',
          type: 'group_buy',
          pricePaid: 155000,
          status: 'fulfilled',
          createdAt: 'Today',
          deliveredKey: 'CYBER-GPT-PLUS-INVITE-2026',
          pinCode: '889922',
          txId: query.trim().toUpperCase()
        });
      } else {
        setFoundOrder(null);
      }
    }
  };

  const handleCopyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#090c15] border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#0d1222] to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono font-bold flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                ORDER LOOKUP & KEY STATUS
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Check order status, retrieve license keys, or top-up progress
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

        {/* Search Input Box */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="text-xs font-mono font-bold text-slate-300">
              TRANSACTION ID (TX-...), ORDER ID OR GAME UID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="TX-849204, ord-101..."
                required
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
              <span>Quick test:</span>
              <button
                type="button"
                onClick={() => setQuery('TX-849204')}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                TX-849204
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setQuery('TX-910284')}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                TX-910284
              </button>
            </div>
          </form>

          {/* Results Area */}
          {hasSearched && (
            <div className="space-y-4 pt-2">
              {foundOrder ? (
                <div className="p-4 rounded-xl bg-slate-900/70 border border-cyan-500/40 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                        {foundOrder.type}
                      </span>
                      <h3 className="text-sm font-bold font-mono text-white mt-1">
                        {foundOrder.productTitle}
                      </h3>
                    </div>

                    <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase border ${
                      foundOrder.status === 'fulfilled'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                        : foundOrder.status === 'escrow_locked'
                        ? 'bg-amber-950 text-amber-400 border-amber-500/40'
                        : 'bg-red-950 text-red-400 border-red-500/40'
                    }`}>
                      {foundOrder.status === 'fulfilled' ? t('key_vault.status_fulfilled') : t('key_vault.status_locked')}
                    </span>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">TxID</div>
                      <div className="text-slate-200 font-bold mt-0.5">{foundOrder.txId}</div>
                    </div>

                    <div className="p-2.5 rounded bg-black/40 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">{t('cart.total')}</div>
                      <div className="text-cyan-400 font-bold mt-0.5">{formatCurrency(foundOrder.pricePaid, currency)}</div>
                    </div>
                  </div>

                  {/* Key Code Delivery Section */}
                  {foundOrder.deliveredKey && (
                    <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-500/40 space-y-2">
                      <div className="text-xs font-mono text-cyan-300 font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Key className="w-4 h-4" />
                          <span>LICENSE KEY:</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">✓ Checklive: Valid 100%</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded bg-black/80 border border-slate-700">
                        <code className="text-cyan-300 font-mono font-bold text-sm tracking-wider">
                          {foundOrder.deliveredKey}
                        </code>
                        <button
                          onClick={() => handleCopyKey(foundOrder.deliveredKey!)}
                          className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedKey ? t('key_vault.copied') : t('key_vault.copy')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TopUp UID Details */}
                  {foundOrder.topupDetails && (
                    <div className="p-3 rounded-lg bg-black/50 border border-slate-800 text-xs font-mono space-y-1">
                      <div className="text-slate-400">UID: <strong className="text-white">{foundOrder.topupDetails.uid}</strong></div>
                      <div className="text-slate-400">Server/Zone: <strong className="text-white">{foundOrder.topupDetails.server || foundOrder.topupDetails.zoneId || 'Asia'}</strong></div>
                      <div className="text-emerald-400 font-bold">Status: Fulfilled</div>
                    </div>
                  )}

                  {/* Escrow Guarantee */}
                  <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2 text-xs font-mono text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t('escrow.subtitle')}</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-slate-900/30 border border-dashed border-slate-800 space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-xs font-mono text-slate-300">No order found with query "{query}"</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
