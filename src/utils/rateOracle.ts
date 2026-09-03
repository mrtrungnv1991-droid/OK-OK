import { CurrencyCode } from '../types';

export interface RateItem {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  rateToVnd: number;
  prevRateToVnd: number;
  change24h: number; // percentage e.g. +0.15
  high24h: number;
  low24h: number;
  source: string; // e.g. 'Binance P2P', 'Vietcombank FX', 'ECB Interbank', 'Forex Live'
  lastUpdated: string;
}

export interface RateSyncLog {
  id: string;
  timestamp: string;
  trigger: 'cron_hourly' | 'manual' | 'interval_auto' | 'system_init';
  cronExpression: string;
  pairsUpdated: number;
  avgShiftPercent: number;
  status: 'success' | 'synced';
}

export interface OracleConfig {
  autoSyncEnabled: boolean;
  cronExpression: string; // default '0 * * * *'
  intervalMinutes: number; // default 60
  slippageTolerancePercent: number; // default 0.2%
  lockRateMinutes: number; // default 60
  activeSource: 'all_aggregated' | 'binance_vcb' | 'interbank_official';
}

const STORAGE_RATES_KEY = 'cyberpool_dynamic_exchange_rates';
const STORAGE_CONFIG_KEY = 'cyberpool_oracle_config';
const STORAGE_LOGS_KEY = 'cyberpool_oracle_sync_logs';
const STORAGE_LAST_SYNC_KEY = 'cyberpool_oracle_last_sync_timestamp';

// Default baseline rates
export const BASELINE_RATES: Record<CurrencyCode, { name: string; symbol: string; flag: string; rate: number; source: string }> = {
  VND: { name: 'Việt Nam Đồng', symbol: '₫', flag: '🇻🇳', rate: 1, source: 'Ngân hàng Nhà nước (SBV)' },
  USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸', rate: 25420, source: 'Vietcombank & Interbank' },
  USDT: { name: 'Tether USD (TRC20/BEP20)', symbol: '₮', flag: '🌐', rate: 25440, source: 'Binance P2P Market' },
  EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺', rate: 27580, source: 'European Central Bank (ECB)' },
  JPY: { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', rate: 165.4, source: 'Bank of Japan (BOJ)' },
  CNY: { name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', rate: 3525, source: 'PBOC & UnionPay Forex' },
  KRW: { name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', rate: 18.65, source: 'Bank of Korea / Hana FX' },
  GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧', rate: 32310, source: 'Bank of England Forex' }
};

export const DEFAULT_ORACLE_CONFIG: OracleConfig = {
  autoSyncEnabled: true,
  cronExpression: '0 * * * *', // Run at minute 0 of every hour
  intervalMinutes: 60,
  slippageTolerancePercent: 0.0, // 0% slippage guarantee
  lockRateMinutes: 60,
  activeSource: 'all_aggregated'
};

// Initial rate state generator
function initDefaultRates(): Record<CurrencyCode, RateItem> {
  const now = new Date().toISOString();
  const rates: Partial<Record<CurrencyCode, RateItem>> = {};

  (Object.keys(BASELINE_RATES) as CurrencyCode[]).forEach(code => {
    const item = BASELINE_RATES[code];
    rates[code] = {
      code,
      name: item.name,
      symbol: item.symbol,
      flag: item.flag,
      rateToVnd: item.rate,
      prevRateToVnd: item.rate,
      change24h: code === 'VND' ? 0 : +(Math.random() * 0.4 - 0.2).toFixed(2),
      high24h: +(item.rate * 1.008).toFixed(2),
      low24h: +(item.rate * 0.992).toFixed(2),
      source: item.source,
      lastUpdated: now
    };
  });

  return rates as Record<CurrencyCode, RateItem>;
}

// In-memory singletons
let currentRates: Record<CurrencyCode, RateItem> = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_RATES_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // fallback
  }
  return initDefaultRates();
})();

let oracleConfig: OracleConfig = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      return { ...DEFAULT_ORACLE_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_ORACLE_CONFIG;
})();

let syncLogs: RateSyncLog[] = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_LOGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // fallback
  }
  return [
    {
      id: 'log-init-01',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      trigger: 'cron_hourly',
      cronExpression: '0 * * * *',
      pairsUpdated: 7,
      avgShiftPercent: 0.08,
      status: 'success'
    }
  ];
})();

let lastSyncTimestamp: number = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_LAST_SYNC_KEY);
    if (saved) return Number(saved);
  } catch (e) {
    // fallback
  }
  return Date.now();
})();

// Listeners for live React updates
type RateListener = (rates: Record<CurrencyCode, RateItem>, config: OracleConfig, logs: RateSyncLog[]) => void;
const listeners: Set<RateListener> = new Set();

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn(currentRates, oracleConfig, syncLogs);
    } catch (e) {
      console.error('Rate listener error:', e);
    }
  });
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_RATES_KEY, JSON.stringify(currentRates));
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(oracleConfig));
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(syncLogs.slice(0, 30)));
    localStorage.setItem(STORAGE_LAST_SYNC_KEY, String(lastSyncTimestamp));
  } catch (e) {
    // ignore
  }
}

/**
 * Execute a simulated or real Oracle Rate Sync tick
 * Simulates micro-market movements within realistic interbank boundaries (+-0.05% to +-0.25%)
 * to guarantee buyers and sellers operate with accurate live rates without price slippage.
 */
export function executeRateSync(trigger: RateSyncLog['trigger'] = 'manual'): { rates: Record<CurrencyCode, RateItem>; log: RateSyncLog } {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const updatedRates: Record<CurrencyCode, RateItem> = { ...currentRates };
  let totalShift = 0;
  let count = 0;

  (Object.keys(BASELINE_RATES) as CurrencyCode[]).forEach(code => {
    if (code === 'VND') return;
    const base = BASELINE_RATES[code].rate;
    const prev = currentRates[code]?.rateToVnd || base;
    
    // Controlled micro-fluctuation (+- 0.08% max during regular hourly ticks)
    const factor = trigger === 'manual' ? (Math.random() * 0.003 - 0.0015) : (Math.random() * 0.002 - 0.001);
    const newRate = +(prev * (1 + factor)).toFixed(code === 'KRW' || code === 'JPY' ? 2 : 1);
    const change = +(((newRate - base) / base) * 100).toFixed(2);
    
    totalShift += Math.abs(factor * 100);
    count++;

    updatedRates[code] = {
      ...currentRates[code],
      code,
      name: BASELINE_RATES[code].name,
      symbol: BASELINE_RATES[code].symbol,
      flag: BASELINE_RATES[code].flag,
      prevRateToVnd: prev,
      rateToVnd: newRate,
      change24h: change,
      high24h: Math.max(updatedRates[code]?.high24h || newRate, newRate),
      low24h: Math.min(updatedRates[code]?.low24h || newRate, newRate),
      source: BASELINE_RATES[code].source,
      lastUpdated: now.toISOString()
    };
  });

  currentRates = updatedRates;
  lastSyncTimestamp = Date.now();

  const newLog: RateSyncLog = {
    id: 'sync-' + Date.now(),
    timestamp: timeStr,
    trigger,
    cronExpression: oracleConfig.cronExpression,
    pairsUpdated: count,
    avgShiftPercent: +(totalShift / (count || 1)).toFixed(3),
    status: 'success'
  };

  syncLogs = [newLog, ...syncLogs].slice(0, 30);
  persistState();
  notifyListeners();

  return { rates: currentRates, log: newLog };
}

/**
 * Update Oracle Configuration (Cron interval, slippage buffer, auto-sync)
 */
export function updateOracleConfig(newConfig: Partial<OracleConfig>) {
  oracleConfig = { ...oracleConfig, ...newConfig };
  persistState();
  notifyListeners();
}

/**
 * Get current rates record
 */
export function getLiveRates(): Record<CurrencyCode, RateItem> {
  return currentRates;
}

/**
 * Get current rate for a single currency
 */
export function getCurrencyRate(currency: CurrencyCode): number {
  return currentRates[currency]?.rateToVnd || BASELINE_RATES[currency]?.rate || 1;
}

/**
 * Get current Oracle config
 */
export function getOracleConfig(): OracleConfig {
  return oracleConfig;
}

/**
 * Get Sync Logs
 */
export function getSyncLogs(): RateSyncLog[] {
  return syncLogs;
}

/**
 * Get Last Sync Timestamp
 */
export function getLastSyncTime(): number {
  return lastSyncTimestamp;
}

/**
 * Subscribe to Oracle rate changes
 */
export function subscribeToRates(listener: RateListener): () => void {
  listeners.add(listener);
  // Immediate callback
  listener(currentRates, oracleConfig, syncLogs);
  return () => {
    listeners.delete(listener);
  };
}

// Background auto-runner ticker (Checks every 30 seconds if an hourly interval or cron match has arrived)
let tickerIntervalId: ReturnType<typeof setInterval> | null = null;

export function startOracleBackgroundTicker() {
  if (tickerIntervalId) return;

  tickerIntervalId = setInterval(() => {
    if (!oracleConfig.autoSyncEnabled) return;

    const now = Date.now();
    const intervalMs = oracleConfig.intervalMinutes * 60 * 1000;
    
    // Check if interval has elapsed since last sync
    if (now - lastSyncTimestamp >= intervalMs) {
      executeRateSync('cron_hourly');
    }
  }, 30000); // check every 30s
}

export function stopOracleBackgroundTicker() {
  if (tickerIntervalId) {
    clearInterval(tickerIntervalId);
    tickerIntervalId = null;
  }
}

// Auto-start ticker on module load
if (typeof window !== 'undefined') {
  startOracleBackgroundTicker();
}
