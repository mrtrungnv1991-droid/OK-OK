import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { 
  CanonicalLocale,
  SupportedLocale, 
  LocaleInfo, 
  InterpolationParams, 
  I18nContextType 
} from './types';
import { 
  DEFAULT_LOCALE, 
  LOCALE_STORAGE_KEY, 
  SUPPORTED_LOCALES, 
  getInitialLocale,
  normalizeLocale
} from './config';
import { 
  LOCALE_DICTIONARIES 
} from './locales';
import { 
  interpolate, 
  formatLocaleNumber, 
  formatLocaleDate 
} from './utils';
import { formatCurrency as appFormatCurrency } from '../utils/formatters';
import { CurrencyCode } from '../types';

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<CanonicalLocale>(() => getInitialLocale());

  const setLocale = useCallback((newLocaleInput: SupportedLocale) => {
    const normalized = normalizeLocale(newLocaleInput);
    
    setLocaleState(normalized);
    
    // 1. Sync to localStorage
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
      
      // Also update user profile storage if exists
      const savedUser = localStorage.getItem('cyberpool_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.language = normalized;
        const locInfo = SUPPORTED_LOCALES.find(l => l.code === normalized);
        if (locInfo && locInfo.defaultCurrency) {
          parsed.currency = locInfo.defaultCurrency;
        }
        localStorage.setItem('cyberpool_current_user', JSON.stringify(parsed));
      }
    } catch {
      // ignore storage errors
    }

    // 2. Sync to HTML element
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = normalized;
      const localeInfo = SUPPORTED_LOCALES.find(l => l.code === normalized);
      document.documentElement.dir = localeInfo?.direction || 'ltr';
    }
  }, []);

  // Update HTML attributes on initial mount and change
  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = locale;
      const localeInfo = SUPPORTED_LOCALES.find(l => l.code === locale);
      document.documentElement.dir = localeInfo?.direction || 'ltr';
    }
  }, [locale]);

  // Main translation function
  // STRICT RULE: No Vietnamese fallback in non-Vietnamese locales
  const t = useCallback(
    (key: string, params?: InterpolationParams, defaultFallback?: string): string => {
      if (!key) return '';

      const currentDict = LOCALE_DICTIONARIES[locale] || LOCALE_DICTIONARIES['en-US'];

      let template = currentDict[key];
      
      // Non-VI locales fall back to en-US only (never Vietnamese)
      if ((template === undefined || template === null) && locale !== 'vi') {
        template = LOCALE_DICTIONARIES['en-US']?.[key];
      }
      
      if (template === undefined || template === null) {
        template = defaultFallback !== undefined ? defaultFallback : key;
      }

      return interpolate(template, params);
    },
    [locale]
  );

  // Number Formatter
  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      return formatLocaleNumber(value, locale, options);
    },
    [locale]
  );

  // Date Formatter
  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      return formatLocaleDate(date, locale, options);
    },
    [locale]
  );

  const currentLocaleInfo = useMemo(() => {
    return SUPPORTED_LOCALES.find(l => l.code === locale) || SUPPORTED_LOCALES[0];
  }, [locale]);

  // Currency Formatter
  const formatCurrency = useCallback(
    (amountVnd: number, currencyCode?: string): string => {
      const code = (currencyCode || currentLocaleInfo.defaultCurrency || 'VND') as CurrencyCode;
      return appFormatCurrency(amountVnd, code);
    },
    [currentLocaleInfo]
  );

  const value: I18nContextType = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      formatNumber,
      formatDate,
      formatCurrency,
      supportedLocales: SUPPORTED_LOCALES,
      currentLocaleInfo,
      dir: currentLocaleInfo.direction || 'ltr'
    }),
    [locale, setLocale, t, formatNumber, formatDate, formatCurrency, currentLocaleInfo]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

// Direct export for non-React contexts or utility functions
export function translate(
  key: string,
  localeInput: SupportedLocale = DEFAULT_LOCALE,
  params?: InterpolationParams,
  defaultFallback?: string
): string {
  const normalized = normalizeLocale(localeInput);
  const currentDict = LOCALE_DICTIONARIES[normalized] || LOCALE_DICTIONARIES['en-US'];

  let template = currentDict[key];
  if ((template === undefined || template === null) && normalized !== 'vi') {
    template = LOCALE_DICTIONARIES['en-US']?.[key];
  }
  if (template === undefined || template === null) {
    template = defaultFallback !== undefined ? defaultFallback : key;
  }

  return interpolate(template, params);
}
