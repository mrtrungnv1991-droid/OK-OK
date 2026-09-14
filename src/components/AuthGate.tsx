// ==============================================================================
// CYBERPOOL FIX: Cổng đăng nhập — trước đây app KHÔNG có UI đăng nhập nào
// (luôn "auto-login" bằng credential hardcode). Sau khi bỏ auto-login ở
// production (security fix), bắt buộc phải có màn hình login/register thật,
// nếu không khách không thể vào được hệ thống.
// ==============================================================================
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, LogIn, UserPlus, Eye, EyeOff, Loader2, Sparkles, X } from 'lucide-react';

export const AuthGate: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { login, register, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Vui lòng nhập email hoặc tên đăng nhập.');
      return;
    }
    // Đăng nhập cho phép username ngắn (vd mrtee) — chỉ register mới bắt email thật
    if (mode === 'register' && !email.includes('@')) {
      setError('Email không hợp lệ.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim() || name.trim().length < 2) {
        setError('Họ tên phải có ít nhất 2 ký tự.');
        return;
      }
      if (password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }
      const res = await register({ email: email.trim(), name: name.trim(), phone: phone.trim() || undefined, password });
      if (!res.success) {
        setError(res.error || 'Đăng ký thất bại.');
      } else {
        onClose?.();
      }
    } else {
      if (!password) {
        setError('Vui lòng nhập mật khẩu.');
        return;
      }
      const res = await login(email.trim(), password);
      if (!res.success) {
        setError(res.error || 'Đăng nhập thất bại.');
      } else {
        onClose?.();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => onClose?.()}>
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(6,182,212,0.12),transparent_60%)] pointer-events-none" />

      <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="bg-[#0b0f19]/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] p-6 sm:p-8 space-y-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-cyan-400" />
            </div>
            <h1 className="text-lg font-black font-mono text-white tracking-wide">
              CYBERPOOL <span className="text-cyan-400">// ACCESS</span>
            </h1>
            <p className="text-xs text-slate-400">
              {mode === 'login'
                ? 'Đăng nhập để truy cập ví, kho key và gom đơn mua chung.'
                : 'Tạo tài khoản miễn phí — bảo mật escrow, hoàn tiền 100% nếu thiếu người.'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                mode === 'login' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 border border-transparent hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> ĐĂNG NHẬP
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                mode === 'register' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'text-slate-400 border border-transparent hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> ĐĂNG KÝ
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1 font-mono uppercase">Họ và tên *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1 font-mono uppercase">Số điện thoại (không bắt buộc)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="09xxxxxxxx"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors"
                    autoComplete="tel"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 font-mono uppercase">Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ban@email.com"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 font-mono uppercase">Mật khẩu *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Tối thiểu 6 ký tự' : '••••••••'}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2.5 pr-10 text-sm text-white outline-none transition-colors"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
                ✗ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-60 text-black font-black font-mono text-sm tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {isLoading ? 'ĐANG XỬ LÝ...' : mode === 'login' ? 'ĐĂNG NHẬP VÀO HỆ THỐNG' : 'TẠO TÀI KHOẢN MỚI'}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-mono">
            <Sparkles className="w-3 h-3 text-cyan-600" />
            <span>ESCROW-PROTECTED • HOÀN TIỀN 100% • GIAO KEY TỰ ĐỘNG</span>
          </div>
        </div>
      </div>
    </div>
  );
};
