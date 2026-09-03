export type CanonicalLocale = 'vi' | 'en-US' | 'zh-CN' | 'ja-JP' | 'ko-KR' | 'ru-RU' | 'fr-FR' | 'de-DE' | 'es-ES';
export type LegacyLocale = 'en' | 'zh' | 'ja' | 'ko' | 'ru' | 'fr' | 'de' | 'es';
export type SupportedLocale = CanonicalLocale | LegacyLocale;

export interface LocaleInfo {
  code: CanonicalLocale;
  displayCode: 'VI' | 'US' | 'CN' | 'JP' | 'KR' | 'RU' | 'FR' | 'DE' | 'ES';
  name: string;
  nativeName: string;
  flag: string;
  defaultCurrency: string;
  direction?: 'ltr' | 'rtl';
}

export type InterpolationParams = Record<string, string | number | boolean | null | undefined>;

export type TranslationDictionary = {
  [namespace: string]: {
    [key: string]: string;
  } | string;
};

export type FlatTranslationDictionary = Record<string, string>;

export interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: InterpolationParams, defaultFallback?: string) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (amountVnd: number, currencyCode?: string) => string;
  supportedLocales: LocaleInfo[];
  currentLocaleInfo: LocaleInfo;
  dir: 'ltr' | 'rtl';
}

export interface I18nCheckResult {
  isValid: boolean;
  totalKeysVi: number;
  totalKeysEn: number;
  missingInEn: string[];
  missingInVi: string[];
  interpolationsMismatch: { key: string; viVars: string[]; enVars: string[] }[];
}
