import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  ArrowRight,
  Info,
  DollarSign
} from 'lucide-react';
import { TelcoCardSubmission, UserProfile } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTranslation } from '../i18n';

interface TelcoCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onCardSubmit: (submission: TelcoCardSubmission) => void;
  cardHistory: TelcoCardSubmission[];
}

const TELCO_LIST = [
  { id: 'VIETTEL', name: 'Viettel', fee: 16, logo: '🔴' },
  { id: 'VINAPHONE', name: 'Vinaphone', fee: 15, logo: '🔵' },
  { id: 'MOBIFONE', name: 'Mobifone', fee: 17, logo: '🟡' },
  { id: 'GARENA', name: 'Garena', fee: 15, logo: '🔴' },
  { id: 'ZING', name: 'Zing / VNG', fee: 18, logo: '🟢' },
  { id: 'GATE', name: 'FPT Gate', fee: 20, logo: '🟠' },
] as const;

const AMOUNTS = [
  10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000, 1000000
];

export const TelcoCardModal: React.FC<TelcoCardModalProps> = ({
  isOpen,
  onClose,
  user,
  onCardSubmit,
  cardHistory
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const [selectedTelco, setSelectedTelco] = useState<typeof TELCO_LIST[number]['id']>('VIETTEL');
  const [selectedAmount, setSelectedAmount] = useState<number>(100000);
  const [serial, setSerial] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  const currentTelcoInfo = TELCO_LIST.find(t => t.id === selectedTelco) || TELCO_LIST[0];
  const feePercent = currentTelcoInfo.fee;
  const receivedAmount = selectedAmount * (1 - feePercent / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial.trim() || !pin.trim()) {
      return;
    }

    setIsSubmitting(true);

    const submission: TelcoCardSubmission = {
      id: `CARD-${Date.now()}`,
      telco: selectedTelco,
      declaredAmount: selectedAmount,
      actualAmount: selectedAmount,
      receivedAmount: receivedAmount,
      feePercent: feePercent,
      pin: pin.trim(),
      serial: serial.trim(),
      status: 'processing',
      createdAt: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      txId: `TX-CARD-${Math.floor(100000 + Math.random() * 900000)}`
    };

    setTimeout(() => {
      onCardSubmit({ ...submission, status: 'success' });
      setIsSubmitting(false);
      setSerial('');
      setPin('');
      setActiveTab('history');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#090c15] border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#0d1222] to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono font-bold flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                  {t('wallet.telco_card_title')}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  AUTO 3S
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {t('nav.telco_exchange')}
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

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('nav.deposit')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{t('wallet.transaction_history')}</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
              {cardHistory.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Select Telco */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                  <span>1. {t('common.action')}</span>
                  <span className="text-[11px] text-cyan-400">{t('common.discount')}: {feePercent}%</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {TELCO_LIST.map((telco) => (
                    <button
                      key={telco.id}
                      type="button"
                      onClick={() => setSelectedTelco(telco.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        selectedTelco === telco.id
                          ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base">{telco.logo}</span>
                      <span className="text-xs font-mono font-bold">{telco.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400">-{telco.fee}%</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Amount */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300">
                  2. {t('common.amount')}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                  {AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSelectedAmount(amt)}
                      className={`p-2 rounded-lg border font-mono text-xs text-center transition-all cursor-pointer ${
                        selectedAmount === amt
                          ? 'bg-cyan-500 text-black font-bold border-cyan-400 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {formatCurrency(amt, user.currency)}
                    </button>
                  ))}
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-[11px] font-mono text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{t('errors.telco_invalid_card')}</span>
                </div>
              </div>

              {/* Pin & Serial Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">3. SERIAL</label>
                  <input
                    type="text"
                    value={serial}
                    onChange={(e) => setSerial(e.target.value)}
                    placeholder="Serial..."
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300">4. PIN / CODE</label>
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="PIN..."
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Summary Calculation Box */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>{t('common.amount')}:</span>
                  <span className="text-white font-bold">{formatCurrency(selectedAmount, user.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t('common.discount')}:</span>
                  <span className="text-red-400 font-bold">-{feePercent}%</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-slate-200 font-bold">{t('common.total')}:</span>
                  <span className="text-lg text-emerald-400 font-black">
                    {formatCurrency(receivedAmount, user.currency)}
                  </span>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
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
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {cardHistory.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-900/30 border border-dashed border-slate-800 text-xs font-mono text-slate-500">
                  {t('errors.not_found')}
                </div>
              ) : (
                cardHistory.map((card) => (
                  <div key={card.id} className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">
                          {card.telco}
                        </span>
                        <span className="text-white font-bold">{formatCurrency(card.declaredAmount, user.currency)}</span>
                        <span className="text-slate-500 text-[10px]">• {card.createdAt}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Seri: <code>{card.serial}</code> | PIN: <code>{card.pin.slice(0, 4)}****</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-emerald-400 font-bold">+{formatCurrency(card.receivedAmount, user.currency)}</div>
                        <div className="text-[10px] text-slate-500">{t('common.discount')} {card.feePercent}%</div>
                      </div>

                      <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${
                        card.status === 'success' 
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                          : card.status === 'processing'
                          ? 'bg-amber-950 text-amber-400 border-amber-500/40 animate-pulse'
                          : 'bg-red-950 text-red-400 border-red-500/40'
                      }`}>
                        {card.status === 'success' ? t('common.completed') : card.status === 'processing' ? t('common.processing') : t('common.failed')}
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
