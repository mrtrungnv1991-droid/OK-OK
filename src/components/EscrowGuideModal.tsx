import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  Key, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Gift 
} from 'lucide-react';
import { useTranslation } from '../i18n';

interface EscrowGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EscrowGuideModal: React.FC<EscrowGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl bg-[#0b0e17] border border-slate-700 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#0d1220] to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-mono text-white">
                {t('escrow.title')}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {t('escrow.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Step-by-step pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <h4 className="text-sm font-bold font-mono text-white">1. {t('escrow.step1_title')}</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {t('escrow.step1_desc')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-500/40 text-amber-400 flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <h4 className="text-sm font-bold font-mono text-white">2. {t('escrow.step2_title')}</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {t('escrow.step2_desc')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <h4 className="text-sm font-bold font-mono text-white">3. {t('escrow.step3_title')}</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {t('escrow.step3_desc')}
              </p>
            </div>
          </div>

          {/* Guarantees Box */}
          <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 space-y-3">
            <div className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-1.5 uppercase">
              <Zap className="w-4 h-4" />
              <span>{t('escrow.guarantee_title')}</span>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>{t('escrow.auto_refund')}:</strong> {t('escrow.auto_refund_desc')}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>{t('escrow.instant_delivery')}:</strong> {t('escrow.instant_delivery_desc')}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>{t('escrow.warranty')}:</strong> {t('escrow.warranty_desc')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-[#0a0d14] flex items-center justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
