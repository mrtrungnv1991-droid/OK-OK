import React, { useState, useEffect } from 'react';
import { Sparkles, Users, Key, Zap } from 'lucide-react';
import { useTranslation } from '../i18n';

interface ToastItem {
  id: string;
  user: string;
  action: string;
  product: string;
  slots: string;
  time: string;
}

export const LiveTelemetryStream: React.FC = () => {
  const { t } = useTranslation();
  const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);

  const sampleEvents = [
    { user: 'Elon_Fan_99', action: 'joined pool', product: 'ChatGPT Plus Team Seat', slots: '4/5 Slots' },
    { user: 'CyberGamer_SG', action: 'unlocked', product: 'Steam Key: Black Myth Wukong', slots: '4/4 Slots' },
    { user: 'Linh_Designer', action: 'joined pool', product: 'Adobe Creative Cloud 1Y', slots: '5/6 Slots' },
    { user: 'QuocBao_Vn', action: 'claimed gift card', product: 'GiftUp $50 Multi-Store Card', slots: 'Fulfilled' },
    { user: 'HoangLong_4K', action: 'joined pool', product: 'Netflix Premium 4K UHD Profile', slots: '3/5 Slots' }
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      const event = sampleEvents[index % sampleEvents.length];
      setCurrentToast({
        id: `t-${Date.now()}`,
        user: event.user,
        action: event.action,
        product: event.product,
        slots: event.slots,
        time: 'Just now'
      });
      index++;

      setTimeout(() => {
        setCurrentToast(null);
      }, 4500);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  if (!currentToast) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-3 max-w-[calc(100vw-110px)] sm:max-w-sm z-30 pointer-events-none p-2.5 sm:p-3 rounded-xl bg-[#0e1320]/95 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="flex-1 min-w-0 text-xs font-mono">
          <div className="text-white truncate text-[11px] sm:text-xs">
            <span className="font-bold text-cyan-300">{currentToast.user}</span>{' '}
            <span className="text-slate-300">{currentToast.action}</span>
          </div>
          <div className="text-slate-400 truncate text-[10px] sm:text-[11px] mt-0.5">
            {currentToast.product} • <span className="text-emerald-400 font-bold">{currentToast.slots}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
