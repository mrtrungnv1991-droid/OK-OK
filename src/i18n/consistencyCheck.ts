import { vi, en, zh, ja, ko, ru, fr, de, es } from './locales';
import { SupportedLocale } from './types';

/**
 * Recursively extracts all dot-notated key paths from a nested dictionary object.
 */
export function getFlattenedKeyPaths(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getFlattenedKeyPaths(obj[key], fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

export interface I18nParityReport {
  isFullySynced: boolean;
  totalViKeys: number;
  localeKeyCounts: Record<string, number>;
  missingKeysByLocale: Record<string, string[]>;
}

/**
 * Validates complete parity between base Vietnamese dictionary and all supported languages.
 */
export function checkLocaleParity(): I18nParityReport {
  const viKeys = new Set(getFlattenedKeyPaths(vi));

  const allLocales: Record<string, Record<string, any>> = {
    'vi': vi,
    'en-US': en,
    'zh-CN': zh,
    'ja-JP': ja,
    'ko-KR': ko,
    'ru-RU': ru,
    'fr-FR': fr,
    'de-DE': de,
    'es-ES': es
  };

  const localeKeyCounts: Record<string, number> = {};
  const missingKeysByLocale: Record<string, string[]> = {};
  let isFullySynced = true;

  for (const [loc, dict] of Object.entries(allLocales)) {
    const locKeys = new Set(getFlattenedKeyPaths(dict));
    localeKeyCounts[loc] = locKeys.size;
    const missing: string[] = [];

    for (const k of viKeys) {
      if (!locKeys.has(k)) {
        missing.push(k);
      }
    }

    missingKeysByLocale[loc] = missing;
    if (missing.length > 0) {
      isFullySynced = false;
    }
  }

  return {
    isFullySynced,
    totalViKeys: viKeys.size,
    localeKeyCounts,
    missingKeysByLocale
  };
}

