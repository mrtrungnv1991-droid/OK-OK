import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Sparkles, 
  Check, 
  X, 
  ArrowRightLeft, 
  RefreshCw, 
  Bot, 
  Coins,
  Clock,
  ShieldCheck,
  Zap,
  TrendingUp,
  TrendingDown,
  Database,
  Sliders,
  History,
  CheckCircle2
} from 'lucide-react';
import { LanguageCode, CurrencyCode } from '../types';
import { 
  SUPPORTED_LANGUAGES, 
  SUPPORTED_CURRENCIES, 
  getTranslation,
  convertAmountFromVnd,
  formatWithCurrency
} from '../utils/i18n';
import {
  getLiveRates,
  getOracleConfig,
  getSyncLogs,
  getLastSyncTime,
  executeRateSync,
  updateOracleConfig,
  subscribeToRates,
  RateItem,
  OracleConfig,
  RateSyncLog
} from '../utils/rateOracle';
import { useTranslation } from '../i18n';

interface AiLanguageCurrencyModalProps {

  isOpen: boolean;
  onClose: () => void;
  currentLanguage: LanguageCode;
  currentCurrency: CurrencyCode;
  onApply: (lang: LanguageCode, curr: CurrencyCode) => void;
  walletBalanceVnd: number;
}

export const AiLanguageCurrencyModal: React.FC<AiLanguageCurrencyModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  currentCurrency,
  onApply,
  walletBalanceVnd
}) => {
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(currentLanguage);
  const [selectedCurr, setSelectedCurr] = useState<CurrencyCode>(currentCurrency);
  const [activeTab, setActiveTab] = useState<'language' | 'currency' | 'oracle' | 'calculator'>('language');
  const [autoPairCurrency, setAutoPairCurrency] = useState<boolean>(true);
  const [calcAmount, setCalcAmount] = useState<number>(500000); // 500k VND default
  const [calcBaseCurr, setCalcBaseCurr] = useState<CurrencyCode>('VND');
  const [isTranslatingAnim, setIsTranslatingAnim] = useState<boolean>(false);

  // Live Oracle State
  const [rates, setRates] = useState<Record<CurrencyCode, RateItem>>(getLiveRates());
  const [oracleConfig, setOracleConfigState] = useState<OracleConfig>(getOracleConfig());
  const [syncLogs, setSyncLogs] = useState<RateSyncLog[]>(getSyncLogs());
  const [lastSyncTime, setLastSyncTime] = useState<number>(getLastSyncTime());
  const [countdownStr, setCountdownStr] = useState<string>('00:59:59');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Subscribe to Oracle updates
  useEffect(() => {
    const unsub = subscribeToRates((newRates, newConfig, newLogs) => {
      setRates({ ...newRates });
      setOracleConfigState({ ...newConfig });
      setSyncLogs([...newLogs]);
      setLastSyncTime(getLastSyncTime());
    });
    return () => unsub();
  }, []);

  // Countdown timer for next hourly cron cycle
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const intervalMs = oracleConfig.intervalMinutes * 60 * 1000;
      const elapsed = now - lastSyncTime;
      const remainingMs = Math.max(0, intervalMs - (elapsed % intervalMs));
      
      const totalSec = Math.floor(remainingMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      
      setCountdownStr(
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, oracleConfig.intervalMinutes, lastSyncTime]);

  if (!isOpen) return null;

  const t = (key: string) => getTranslation(key, selectedLang);

  const handleSelectLanguage = (langCode: LanguageCode) => {
    setSelectedLang(langCode);
    setIsTranslatingAnim(true);
    setTimeout(() => setIsTranslatingAnim(false), 200);

    if (autoPairCurrency) {
      const matched = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
      if (matched) {
        setSelectedCurr(matched.defaultCurrency);
      }
    }
  };

  const handleSelectPreset = (lang: LanguageCode, curr: CurrencyCode) => {
    setSelectedLang(lang);
    setSelectedCurr(curr);
    setIsTranslatingAnim(true);
    setTimeout(() => setIsTranslatingAnim(false), 200);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const { log } = executeRateSync('manual');
      setIsSyncing(false);
      setSyncFeedback(`Đã đồng bộ ${log.pairsUpdated} cặp tỷ giá thành công!`);
      setTimeout(() => setSyncFeedback(null), 3500);
    }, 600);
  };

  const { setLocale } = useTranslation();

  const handleApply = () => {
    setLocale(selectedLang as any);
    onApply(selectedLang, selectedCurr);
    onClose();
  };


  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];
  const activeCurrObj = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurr) || SUPPORTED_CURRENCIES[0];

  // Calculator helper
  const baseRate = rates[calcBaseCurr]?.rateToVnd || 1;
  const baseVndAmount = calcBaseCurr === 'VND' ? calcAmount : calcAmount * baseRate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-[#090d16] border border-cyan-500/50 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#0d1627] to-slate-900 border-b border-cyan-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Globe className="w-5 h-5 text-black font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-mono text-white tracking-wide">
                  {t('modal_title')}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                  <Sparkles className="w-2.5 h-2.5" /> AI LOCALIZATION & ORACLE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {t('modal_subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Ribbon */}
        <div className="bg-black/60 px-4 py-2.5 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase shrink-0 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-cyan-400" /> {t('tab_presets')}:
          </span>
          <button
            onClick={() => handleSelectPreset('vi', 'VND')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedLang === 'vi' && selectedCurr === 'VND'
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            🇻🇳 VN (₫ VND)
          </button>
          <button
            onClick={() => handleSelectPreset('en', 'USD')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedLang === 'en' && selectedCurr === 'USD'
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            🇺🇸 US ($ USD)
          </button>
          <button
            onClick={() => handleSelectPreset('zh', 'CNY')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedLang === 'zh' && selectedCurr === 'CNY'
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            🇨🇳 CN (¥ CNY)
          </button>
          <button
            onClick={() => handleSelectPreset('ja', 'JPY')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedLang === 'ja' && selectedCurr === 'JPY'
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            🇯🇵 JP (¥ JPY)
          </button>
          <button
            onClick={() => handleSelectPreset('ko', 'KRW')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedLang === 'ko' && selectedCurr === 'KRW'
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            🇰🇷 KR (₩ KRW)
          </button>
          <button
            onClick={() => handleSelectPreset('fr', 'EUR')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedLang === 'fr' && selectedCurr === 'EUR'
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            🇫🇷 FR (€ EUR)
          </button>
          <button
            onClick={() => handleSelectPreset('de', 'EUR')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedLang === 'de' && selectedCurr === 'EUR'
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            🇩🇪 DE (€ EUR)
          </button>
          <button
            onClick={() => handleSelectPreset('ru', 'USDT')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedLang === 'ru' && selectedCurr === 'USDT'
                ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            🌐 USDT
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('language')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'language'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('tab_language')} ({activeLangObj.flag})</span>
          </button>
          <button
            onClick={() => setActiveTab('currency')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'currency'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{t('tab_currency')} ({activeCurrObj.symbol})</span>
          </button>
          <button
            onClick={() => setActiveTab('oracle')}
            className={`flex-1 min-w-[160px] py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'oracle'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-900/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{t('tab_oracle')}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Quy Đổi FX</span>
          </button>
        </div>

        {/* Main Body */}
        <div className={`p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 transition-opacity duration-200 ${isTranslatingAnim ? 'opacity-50' : 'opacity-100'}`}>
          
          {/* TAB 1: LANGUAGE SELECTION */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  {t('select_language_title')}
                </h4>
                <label className="flex items-center gap-2 text-xs font-mono text-cyan-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoPairCurrency}
                    onChange={(e) => setAutoPairCurrency(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900 cursor-pointer"
                  />
                  <span>{t('ai_auto_pair_label')}</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = selectedLang === lang.code || (selectedLang === 'en-US' && lang.code === 'en') || (selectedLang === 'zh-CN' && lang.code === 'zh') || (selectedLang === 'ja-JP' && lang.code === 'ja') || (selectedLang === 'ko-KR' && lang.code === 'ko') || (selectedLang === 'ru-RU' && lang.code === 'ru') || (selectedLang === 'fr-FR' && lang.code === 'fr') || (selectedLang === 'de-DE' && lang.code === 'de') || (selectedLang === 'es-ES' && lang.code === 'es');
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-950/90 via-[#0c182b] to-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{lang.flag}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                              {lang.displayCode}
                            </span>
                            <span className="text-sm font-bold font-mono text-white truncate">
                              {lang.nativeName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 truncate">
                              ({lang.name})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-1">
                            <span className="text-cyan-400">{t('currency_title')}: {lang.defaultCurrency}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-cyan-500 text-black flex items-center justify-center shrink-0 font-bold shadow-md">
                          <Check className="w-4 h-4 font-bold stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border border-slate-700 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Neural AI Translation Status Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/50 via-slate-900/80 to-blue-950/50 border border-cyan-500/30 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs font-mono space-y-1">
                  <div className="text-cyan-300 font-bold">
                    {t('ai_status_badge')}
                  </div>
                  <div className="text-slate-400 text-[11px] leading-relaxed">
                    Hệ thống tự động biên dịch toàn bộ kho hàng, 121 game, hợp đồng Escrow và trạng thái đơn hàng theo ngôn ngữ chuẩn xác nhất.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CURRENCY SELECTION */}
          {activeTab === 'currency' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  {t('select_currency_title')}
                </h4>
                <button
                  onClick={() => setActiveTab('oracle')}
                  className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '8s' }} />
                  Tỷ giá Live Feed (Cron 1h) ↗
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUPPORTED_CURRENCIES.map((curr) => {
                  const isSelected = selectedCurr === curr.code;
                  const sampleVal = 250000; // 250k VND
                  const liveRate = rates[curr.code]?.rateToVnd || curr.rateToVnd;
                  const change24h = rates[curr.code]?.change24h || 0;

                  return (
                    <button
                      key={curr.code}
                      onClick={() => setSelectedCurr(curr.code)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-950/90 via-[#0c1f1c] to-slate-900 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-black/60 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                          <span className="text-base font-black font-mono text-emerald-400">
                            {curr.symbol}
                          </span>
                          <span className="text-[8px] font-mono text-slate-400">
                            {curr.code}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold font-mono text-white truncate">
                              {curr.name}
                            </span>
                            {curr.code !== 'VND' && (
                              <span className={`text-[10px] font-mono font-bold ${change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {change24h >= 0 ? `+${change24h}%` : `${change24h}%`}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-emerald-400 font-bold mt-0.5">
                            Mẫu 250k ₫ = {curr.format(sampleVal)}
                          </div>
                          <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                            1 {curr.code} ≈ {new Intl.NumberFormat('vi-VN').format(liveRate)} ₫
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0 shadow-sm">
                          <Check className="w-4 h-4 font-bold" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-700 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Wallet Balance Preview in selected currency */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 font-mono text-xs">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">
                    Số Dư Ví Người Dùng Đang Có:
                  </div>
                  <div className="text-xs text-slate-300">
                    Gốc: <span className="font-bold text-white">{new Intl.NumberFormat('vi-VN').format(walletBalanceVnd)} ₫</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-cyan-400 uppercase font-bold">
                    Quy đổi sang {selectedCurr}:
                  </div>
                  <div className="text-base font-black text-emerald-400">
                    {formatWithCurrency(walletBalanceVnd, selectedCurr)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOURLY RATE CRON & ORACLE FEED (NEW FEATURE) */}
          {activeTab === 'oracle' && (
            <div className="space-y-4">
              {/* Top Hero Status Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-[#071722] to-slate-950 border border-emerald-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-950/90 border border-emerald-500/50 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '30s' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-emerald-300 tracking-wide">
                          {t('oracle_cron_status')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-black flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {t('oracle_next_sync')}: <span className="font-bold font-mono text-amber-400">{countdownStr}</span> (Mỗi {oracleConfig.intervalMinutes} phút)
                      </div>
                    </div>
                  </div>

                  {/* Manual Sync Trigger Button */}
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Đang Lấy Tỷ Giá...' : t('oracle_manual_sync')}</span>
                  </button>
                </div>

                {syncFeedback && (
                  <div className="p-2 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>{syncFeedback}</span>
                  </div>
                )}
              </div>

              {/* Zero-Slippage Guarantee Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 border border-cyan-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs font-mono space-y-1">
                  <div className="text-cyan-300 font-bold flex items-center gap-2">
                    <span>{t('oracle_slippage_protection')}</span>
                    <span className="px-1.5 py-0.2 text-[9px] bg-cyan-900/80 text-cyan-300 rounded border border-cyan-500/40">
                      Chống Lệch Giá 100%
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    {t('oracle_slippage_desc')}
                  </div>
                </div>
              </div>

              {/* Live Oracle Exchange Rates Matrix */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span className="font-bold flex items-center gap-1 text-slate-200 uppercase">
                    <Database className="w-3.5 h-3.5 text-cyan-400" /> Bảng Tỷ Giá Trực Tuyến (8 Tiền Tệ)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Cron: <code className="text-amber-400 bg-slate-900 px-1 rounded">{oracleConfig.cronExpression}</code>
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] text-slate-400">
                        <th className="py-2.5 px-3">Cặp Tiền Tệ</th>
                        <th className="py-2.5 px-3">Tỷ Giá Quy Đổi (₫)</th>
                        <th className="py-2.5 px-3">Biến Động 24h</th>
                        <th className="py-2.5 px-3 hidden sm:table-cell">Nguồn Feed Oracle</th>
                        <th className="py-2.5 px-3 text-right">Biên Độ (Low-High)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(Object.keys(rates) as CurrencyCode[]).map((code) => {
                        const r = rates[code];
                        if (!r) return null;
                        const isBase = code === 'VND';
                        return (
                          <tr key={code} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                              <span>{r.flag}</span>
                              <span className="text-cyan-300">{r.code}/VND</span>
                              <span className="text-[10px] text-slate-400 font-normal">({r.symbol})</span>
                            </td>
                            <td className="py-2.5 px-3 font-bold font-mono">
                              {isBase ? (
                                <span className="text-slate-400">1.00 (Chuẩn)</span>
                              ) : (
                                <span className="text-emerald-400">
                                  {new Intl.NumberFormat('vi-VN').format(r.rateToVnd)} ₫
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {isBase ? (
                                <span className="text-slate-500">0.00%</span>
                              ) : (
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  r.change24h >= 0 
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' 
                                    : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                                }`}>
                                  {r.change24h >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                  {r.change24h >= 0 ? `+${r.change24h}%` : `${r.change24h}%`}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-400 hidden sm:table-cell">
                              {r.source}
                            </td>
                            <td className="py-2.5 px-3 text-right text-[10px] text-slate-400 font-mono">
                              {isBase ? 'Cố định' : `${r.low24h.toLocaleString()} - ${r.high24h.toLocaleString()}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cron Settings & Interval Adjuster */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Tùy Chỉnh Chu Kỳ Cron Oracle
                  </span>
                  <span className="text-[10px] text-cyan-400">
                    Trạng thái: Tự động chạy nền
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => updateOracleConfig({ intervalMinutes: 15, cronExpression: '*/15 * * * *' })}
                    className={`p-2 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
                      oracleConfig.intervalMinutes === 15
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-400 font-bold'
                        : 'bg-black/50 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white">Mỗi 15 Phút</div>
                    <div className="text-[10px] text-slate-400">High-Frequency FX</div>
                  </button>

                  <button
                    onClick={() => updateOracleConfig({ intervalMinutes: 60, cronExpression: '0 * * * *' })}
                    className={`p-2 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
                      oracleConfig.intervalMinutes === 60
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-400 font-bold'
                        : 'bg-black/50 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white">Mỗi 1 Giờ (Mặc Định)</div>
                    <div className="text-[10px] text-emerald-400">0 * * * * (Khuyến Nghị)</div>
                  </button>

                  <button
                    onClick={() => updateOracleConfig({ intervalMinutes: 1440, cronExpression: '0 0 * * *' })}
                    className={`p-2 rounded-lg border text-left text-xs font-mono transition-all cursor-pointer ${
                      oracleConfig.intervalMinutes === 1440
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-400 font-bold'
                        : 'bg-black/50 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-white">Mỗi 24 Giờ</div>
                    <div className="text-[10px] text-slate-400">Daily End-of-Day</div>
                  </button>
                </div>
              </div>

              {/* Audit Sync Logs */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-cyan-400" /> {t('oracle_history_logs')}
                  </span>
                  <span className="text-[10px] text-slate-500">Lưu 30 lượt gần nhất</span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="p-2 rounded bg-black/60 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${log.trigger === 'cron_hourly' ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                        <span className="text-white font-bold">{log.timestamp}</span>
                        <span className="text-slate-400 text-[10px]">
                          [{log.trigger === 'cron_hourly' ? 'CRON 0 * * * *' : 'MANUAL SYNC'}]
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-[10px]">{log.pairsUpdated} cặp</span>
                        <span className="text-emerald-400 text-[10px] font-bold">Shift ±{log.avgShiftPercent}%</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[9px] border border-emerald-500/30">
                          SUCCESS
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE FX CALCULATOR */}
          {activeTab === 'calculator' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                {t('exchange_calc_title')}
              </h4>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="text-xs font-mono text-slate-400">
                  Nhập số tiền cần tính toán:
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value)))}
                    className="flex-1 px-3 py-2.5 bg-black border border-slate-700 focus:border-cyan-500 rounded-lg text-sm text-white font-mono"
                    placeholder="Nhập số tiền..."
                  />
                  <select
                    value={calcBaseCurr}
                    onChange={(e) => setCalcBaseCurr(e.target.value as CurrencyCode)}
                    className="px-3 py-2.5 bg-black border border-slate-700 focus:border-cyan-500 rounded-lg text-xs font-mono text-cyan-400 font-bold cursor-pointer"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conversion Result Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                {SUPPORTED_CURRENCIES.map(c => {
                  const valInCurr = convertAmountFromVnd(baseVndAmount, c.code);
                  return (
                    <div key={c.code} className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>{c.flag} {c.code}</span>
                        <span className="text-cyan-400">{c.symbol}</span>
                      </div>
                      <div className="text-sm font-black text-white mt-1 truncate">
                        {c.format(baseVndAmount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Summary Notice */}
          <div className="text-[11px] font-mono text-slate-400 text-center">
            {t('ai_translated_live')}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setSelectedLang('vi');
              setSelectedCurr('VND');
            }}
            className="px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            {t('reset_btn')}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t('modal.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-lg text-xs font-mono font-bold text-black bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer"
            >
              {t('apply_btn')} ({activeLangObj.flag} + {activeCurrObj.code})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
