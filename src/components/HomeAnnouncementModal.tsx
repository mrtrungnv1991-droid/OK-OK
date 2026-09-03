import React from 'react';
import { X, Bell, ShieldCheck, Zap, Sparkles, MessageCircle, AlertCircle } from 'lucide-react';
import { SystemConfig } from '../types';
import { useTranslation } from '../i18n';

interface HomeAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemConfig;
  onOpenChat: () => void;
}

export const HomeAnnouncementModal: React.FC<HomeAnnouncementModalProps> = ({
  isOpen,
  onClose,
  config,
  onOpenChat
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#090c15] border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-950 via-[#0e1628] to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {t('announcement.title')}
              </h3>
              <p className="text-[10px] text-cyan-400">CyberPool Exchange × Game4Win Platform</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto bg-[#06080e]/90 text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>{config.slogan || t('hero.title')}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              {t('announcement.welcome_desc')}
            </p>
          </div>

          <div className="space-y-2.5 text-[11px] text-slate-300">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">{t('escrow.title')}:</strong> {t('escrow.subtitle')}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">{t('deposit.title')}:</strong> {t('deposit.subtitle')}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">{t('affiliate.title')}:</strong> {t('affiliate.subtitle')}
              </span>
            </div>
          </div>

          {/* Hotline & Telegram Box */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
            <div>
              <span className="text-slate-400">Hotline / Zalo: </span>
              <strong className="text-white">{config.hotline || '0988.888.999'}</strong>
            </div>
            <a
              href={config.telegramSupport || 'https://t.me/cyberpool_support'}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
            >
              Telegram CSKH ↗
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenChat();
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
