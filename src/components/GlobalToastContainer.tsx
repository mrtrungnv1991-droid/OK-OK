import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Sparkles, 
  X, 
  ExternalLink 
} from 'lucide-react';
import { useUI, ToastInfo } from '../contexts/UIContext';

export const GlobalToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useUI();

  if (!toasts || toasts.length === 0) return null;

  return (
    <aside 
      aria-label="Thông báo hệ thống"
      aria-live="polite"
      className="fixed top-3 left-3 right-3 sm:left-auto sm:right-5 sm:top-5 z-[9999] flex flex-col gap-2 max-w-none sm:max-w-md w-auto sm:w-full pointer-events-none font-sans"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </aside>
  );
};

interface ToastItemProps {
  toast: ToastInfo;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const type = toast.type || 'info';

  const typeConfig = {
    success: {
      bg: 'bg-[#091512]/95 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.3)]',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      accentText: 'text-emerald-400',
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
      progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      defaultTitle: 'THÀNH CÔNG'
    },
    error: {
      bg: 'bg-[#180b0f]/95 border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.3)]',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      accentText: 'text-rose-400',
      badgeBg: 'bg-rose-950 text-rose-300 border-rose-500/40',
      progressBar: 'bg-gradient-to-r from-rose-500 to-red-400',
      defaultTitle: 'LỖI / THẤT BẠI'
    },
    warning: {
      bg: 'bg-[#181308]/95 border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.3)]',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      accentText: 'text-amber-400',
      badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/40',
      progressBar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      defaultTitle: 'CẢNH BÁO'
    },
    info: {
      bg: 'bg-[#090f1d]/95 border-cyan-500/60 shadow-[0_0_25px_rgba(6,182,212,0.3)]',
      icon: <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />,
      accentText: 'text-cyan-400',
      badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-500/40',
      progressBar: 'bg-gradient-to-r from-cyan-500 to-blue-400',
      defaultTitle: 'THÔNG BÁO'
    }
  }[type];

  const title = toast.title || typeConfig.defaultTitle;

  return (
    <div 
      className={`pointer-events-auto relative overflow-hidden rounded-xl border backdrop-blur-xl p-3 sm:p-3.5 transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${typeConfig.bg}`}
      role="alert"
    >
      {/* Top Header & Content */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{typeConfig.icon}</div>
        
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-mono font-black uppercase px-1.5 py-0.2 rounded border ${typeConfig.badgeBg}`}>
              {title}
            </span>
            {toast.createdAt && (
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(toast.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm font-medium text-slate-100 mt-1 leading-relaxed break-words whitespace-pre-wrap">
            {toast.message}
          </p>

          {/* Optional Action Button */}
          {toast.action && (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss();
                }}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-bold border border-white/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>{toast.action.label}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Subtle Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/40 overflow-hidden">
          <div 
            className={`h-full ${typeConfig.progressBar}`}
            style={{
              animation: `toast-progress ${toast.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};
