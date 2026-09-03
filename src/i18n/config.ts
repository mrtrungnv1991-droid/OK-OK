import { CanonicalLocale, SupportedLocale, LocaleInfo } from './types';

export const DEFAULT_LOCALE: CanonicalLocale = 'en-US';
export const FALLBACK_LOCALE: CanonicalLocale = 'en-US';
export const LOCALE_STORAGE_KEY = 'cyberpool_locale';

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  {
    code: 'vi',
    displayCode: 'VI',
    name: 'Tiếng Việt',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    defaultCurrency: 'VND',
    direction: 'ltr'
  },
  {
    code: 'en-US',
    displayCode: 'US',
    name: 'English (US)',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    defaultCurrency: 'USD',
    direction: 'ltr'
  },
  {
    code: 'zh-CN',
    displayCode: 'CN',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    defaultCurrency: 'CNY',
    direction: 'ltr'
  },
  {
    code: 'ja-JP',
    displayCode: 'JP',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    defaultCurrency: 'JPY',
    direction: 'ltr'
  },
  {
    code: 'ko-KR',
    displayCode: 'KR',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    defaultCurrency: 'KRW',
    direction: 'ltr'
  },
  {
    code: 'ru-RU',
    displayCode: 'RU',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    defaultCurrency: 'USDT',
    direction: 'ltr'
  },
  {
    code: 'fr-FR',
    displayCode: 'FR',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    defaultCurrency: 'EUR',
    direction: 'ltr'
  },
  {
    code: 'de-DE',
    displayCode: 'DE',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    defaultCurrency: 'EUR',
    direction: 'ltr'
  },
  {
    code: 'es-ES',
    displayCode: 'ES',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    defaultCurrency: 'USD',
    direction: 'ltr'
  }
];

export function normalizeLocale(localeStr: string | null | undefined): CanonicalLocale {
  if (!localeStr) return DEFAULT_LOCALE;
  const clean = localeStr.trim();
  
  // Exact match with canonical codes
  const exact = SUPPORTED_LOCALES.find(l => l.code.toLowerCase() === clean.toLowerCase());
  if (exact) return exact.code;

  // Short codes / prefixes mapping
  const lower = clean.toLowerCase();
  if (lower.startsWith('vi')) return 'vi';
  if (lower.startsWith('en')) return 'en-US';
  if (lower.startsWith('zh')) return 'zh-CN';
  if (lower.startsWith('ja')) return 'ja-JP';
  if (lower.startsWith('ko')) return 'ko-KR';
  if (lower.startsWith('ru')) return 'ru-RU';
  if (lower.startsWith('fr')) return 'fr-FR';
  if (lower.startsWith('de')) return 'de-DE';
  if (lower.startsWith('es')) return 'es-ES';

  return DEFAULT_LOCALE;
}

export function getInitialLocale(): CanonicalLocale {
  // 1. Try URL search parameter `?lang=en` or `?locale=en-US`
  if (typeof window !== 'undefined' && window.location) {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang') || params.get('locale');
      if (urlLang) {
        return normalizeLocale(urlLang);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  // 2. Try localStorage preference
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (savedLocale) {
        return normalizeLocale(savedLocale);
      }
      
      // Also check user profile object in storage
      const savedUser = localStorage.getItem('cyberpool_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.language) {
          return normalizeLocale(parsed.language);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  // 3. Try browser navigator.language
  if (typeof navigator !== 'undefined' && navigator.language) {
    return normalizeLocale(navigator.language);
  }

  // 4. Default fallback
  return DEFAULT_LOCALE;
}
