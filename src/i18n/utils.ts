import { InterpolationParams, SupportedLocale, I18nCheckResult, TranslationDictionary, FlatTranslationDictionary } from './types';
import { FALLBACK_LOCALE } from './config';

/**
 * Flattens a nested object structure into dot-notated keys.
 * Example: { auth: { login: "Đăng nhập" } } -> { "auth.login": "Đăng nhập" }
 */
export function flattenDictionary(
  obj: Record<string, any>,
  prefix = ''
): FlatTranslationDictionary {
  const result: FlatTranslationDictionary = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        Object.assign(result, flattenDictionary(val, newKey));
      } else if (typeof val === 'string' || typeof val === 'number') {
        result[newKey] = String(val);
      }
    }
  }

  return result;
}

/**
 * Interpolates variables into a translation template string.
 * Example: interpolate("Xin chào, {{name}}!", { name: "Alex" }) -> "Xin chào, Alex!"
 */
export function interpolate(template: string, params?: InterpolationParams): string {
  if (!template) return '';
  if (!params) {
    // If no params are passed, safely strip any stray {{placeholder}} tags
    return template.replace(/\s*\{\{\s*([a-zA-Z0-9_]+)\s*\}\}\s*/g, ' ').trim();
  }

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    if (params[key] !== undefined && params[key] !== null) {
      return String(params[key]);
    }
    return '';
  });
}

/**
 * Formats numbers according to active locale.
 */
export function formatLocaleNumber(
  value: number,
  locale: SupportedLocale,
  options?: Intl.NumberFormatOptions
): string {
  try {
    const localeTag = getIntlLocaleTag(locale);
    return new Intl.NumberFormat(localeTag, options).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Formats dates according to active locale.
 */
export function formatLocaleDate(
  date: Date | string | number,
  locale: SupportedLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const dateObj = typeof date === 'object' ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return String(date);
    
    const localeTag = getIntlLocaleTag(locale);
    const defaultOptions: Intl.DateTimeFormatOptions = options || {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Intl.DateTimeFormat(localeTag, defaultOptions).format(dateObj);
  } catch {
    return String(date);
  }
}

/**
 * Maps our SupportedLocale codes to standard BCP 47 language tags for Intl APIs.
 */
export function getIntlLocaleTag(locale: SupportedLocale): string {
  const map: Record<string, string> = {
    'vi': 'vi-VN',
    'en-US': 'en-US',
    'zh-CN': 'zh-CN',
    'ja-JP': 'ja-JP',
    'ko-KR': 'ko-KR',
    'ru-RU': 'ru-RU',
    'fr-FR': 'fr-FR',
    'de-DE': 'de-DE',
    'es-ES': 'es-ES',
    'en': 'en-US',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'ru': 'ru-RU',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'es': 'es-ES'
  };
  return map[locale] || 'en-US';
}

/**
 * Extracts variable names from template strings: "{{name}} and {{count}}" -> ["name", "count"]
 */
export function extractInterpolationVars(str: string): string[] {
  const matches = str.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || [];
  return matches.map(m => m.replace(/[\{\}\s]/g, '')).sort();
}

/**
 * Validates translations between Vietnamese (source) and English / other languages.
 */
export function checkI18nConsistency(
  viDict: FlatTranslationDictionary,
  enDict: FlatTranslationDictionary
): I18nCheckResult {
  const viKeys = Object.keys(viDict);
  const enKeys = Object.keys(enDict);

  const missingInEn = viKeys.filter(k => !(k in enDict));
  const missingInVi = enKeys.filter(k => !(k in viDict));

  const interpolationsMismatch: { key: string; viVars: string[]; enVars: string[] }[] = [];

  for (const key of viKeys) {
    if (key in enDict) {
      const viVars = extractInterpolationVars(viDict[key]);
      const enVars = extractInterpolationVars(enDict[key]);
      if (JSON.stringify(viVars) !== JSON.stringify(enVars)) {
        interpolationsMismatch.push({ key, viVars, enVars });
      }
    }
  }

  return {
    isValid: missingInEn.length === 0 && missingInVi.length === 0 && interpolationsMismatch.length === 0,
    totalKeysVi: viKeys.length,
    totalKeysEn: enKeys.length,
    missingInEn,
    missingInVi,
    interpolationsMismatch
  };
}
