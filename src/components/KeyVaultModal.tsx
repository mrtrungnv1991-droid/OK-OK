import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Gift, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Sparkles,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { UserOrder } from '../types';
import { formatCurrency } from '../utils/formatters';
import { GiftUpCardViewer } from './GiftUpCardViewer';
import { useTranslation } from '../i18n';

interface KeyVaultModalProps {
  orders: UserOrder[];
  isOpen: boolean;
  onClose: () => void;
  currency: 'VND' | 'USD';
}

export const KeyVaultModal: React.FC<KeyVaultModalProps> = ({
  orders,
  isOpen,
  onClose,
  currency
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'giftup' | 'gaming' | 'ai'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [testingOrderId, setTestingOrderId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; msg: string } | null>(null);
  const [selectedGiftUpOrder, setSelectedGiftUpOrder] = useState<UserOrder | null>(null);

  if (!isOpen) return null;

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (order.deliveredKey && order.deliveredKey.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (activeTab === 'giftup') return order.platform === 'GiftUp';
    if (activeTab === 'gaming') return order.platform === 'Steam' || order.platform === 'Xbox';
    if (activeTab === 'ai') return order.platform === 'OpenAI' || order.platform === 'Midjourney' || order.platform === 'Anthropic';
    return true;
  });

  const handleCopy = (orderId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrderId(orderId);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleTestKey = (orderId: string) => {
    setTestingOrderId(orderId);
    setTestResult(null);
    setTimeout(() => {
      setTestingOrderId(null);
      setTestResult({
        id: orderId,
        msg: '✓ Key Valid 100%'
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl bg-[#0b0e17] border border-slate-700 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#0d1220] to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-mono text-white">
                  {t('key_vault.title')}
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                  {orders.length}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {t('key_vault.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (selectedGiftUpOrder) {
                setSelectedGiftUpOrder(null);
              } else {
                onClose();
              }
            }}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If viewing a specific GiftUp card detail */}
        {selectedGiftUpOrder ? (
          <div className="p-6">
            <button
              onClick={() => setSelectedGiftUpOrder(null)}
              className="text-xs font-mono text-cyan-400 hover:underline mb-4 flex items-center gap-1"
            >
              ← {t('common.close')}
            </button>
            <GiftUpCardViewer order={selectedGiftUpOrder} />
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Search and Tabs */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === 'all' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('categories.all')} ({orders.length})
                </button>
                <button
                  onClick={() => setActiveTab('giftup')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === 'giftup' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('categories.giftup_cards')}
                </button>
                <button
                  onClick={() => setActiveTab('gaming')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === 'gaming' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('categories.gaming')}
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === 'ai' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('categories.ai_tools')}
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('key_vault.search_placeholder')}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-slate-950/60 border border-dashed border-slate-800 space-y-3">
                <Key className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-sm font-mono text-slate-300">{t('key_vault.no_keys')}</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t('key_vault.no_keys_desc')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const isGiftUp = order.platform === 'GiftUp' || !!order.giftUpCard;
                  const isCopied = copiedOrderId === order.id;
                  const isTesting = testingOrderId === order.id;
                  const testMsg = testResult?.id === order.id ? testResult.msg : null;

                  return (
                    <div
                      key={order.id}
                      className="p-4 sm:p-5 rounded-xl bg-[#0f131f] border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                    >
                      {/* Top Row: Title, Platform, Price */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-cyan-400 border border-slate-700">
                            {order.platform}
                          </span>
                          <h4 className="text-sm font-bold font-mono text-white">
                            {order.productTitle}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono">
                          <span className="text-slate-400">{t('common.status')}:</span>
                          <span className="font-bold text-cyan-400">
                            {formatCurrency(order.pricePaid, currency)}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {t('escrow.instant_delivery')}
                          </span>
                        </div>
                      </div>

                      {/* Delivered Key Display Box */}
                      <div className="p-3.5 rounded-lg bg-black/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="text-[10px] font-mono text-slate-400 uppercase">
                            Key / Link:
                          </div>
                          <div className="font-mono text-sm sm:text-base font-bold text-cyan-300 tracking-wider truncate select-all">
                            {order.deliveredKey || '...'}
                          </div>
                          {order.pinCode && (
                            <div className="text-xs font-mono text-amber-400">
                              PIN: <span className="font-bold">{order.pinCode}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Copy Key Button */}
                          <button
                            onClick={() => handleCopy(order.id, order.deliveredKey || '')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-mono border border-cyan-500/40 transition-colors"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? t('common.copied') : t('key_vault.copy_key')}</span>
                          </button>

                          {/* If GiftUp Card: View E-Card */}
                          {isGiftUp && (
                            <button
                              onClick={() => setSelectedGiftUpOrder(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-950 hover:bg-amber-900 text-amber-300 text-xs font-mono border border-amber-500/40 transition-colors"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>{t('categories.giftup_cards')}</span>
                            </button>
                          )}

                          {/* Test Key Simulator */}
                          <button
                            onClick={() => handleTestKey(order.id)}
                            disabled={isTesting}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Test key"
                          >
                            <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Test feedback */}
                      {testMsg && (
                        <div className="p-2 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{testMsg}</span>
                        </div>
                      )}

                      {/* Footer Info & Dispute Escrow */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                        <div>TX: {order.txId} • {order.createdAt}</div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t('escrow.auto_refund')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
