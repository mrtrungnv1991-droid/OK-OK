import { vi } from './vi';
import { en } from './en';
import { zh } from './zh';
import { ja } from './ja';
import { ko } from './ko';
import { ru } from './ru';
import { fr } from './fr';
import { de } from './de';
import { es } from './es';
import { flattenDictionary } from '../utils';
import { SupportedLocale, FlatTranslationDictionary } from '../types';

// Flatten dictionaries for high performance O(1) key lookup
const flatVi = flattenDictionary(vi);
const flatEn = flattenDictionary(en);
const flatZh = flattenDictionary(zh);
const flatJa = flattenDictionary(ja);
const flatKo = flattenDictionary(ko);
const flatRu = flattenDictionary(ru);
const flatFr = flattenDictionary(fr);
const flatDe = flattenDictionary(de);
const flatEs = flattenDictionary(es);

export const LOCALE_DICTIONARIES: Record<string, FlatTranslationDictionary> = {
  // Canonical keys
  'vi': flatVi,
  'en-US': flatEn,
  'zh-CN': flatZh,
  'ja-JP': flatJa,
  'ko-KR': flatKo,
  'ru-RU': flatRu,
  'fr-FR': flatFr,
  'de-DE': flatDe,
  'es-ES': flatEs,
  // Aliases for compatibility
  'en': flatEn,
  'zh': flatZh,
  'ja': flatJa,
  'ko': flatKo,
  'ru': flatRu,
  'fr': flatFr,
  'de': flatDe,
  'es': flatEs
};

export { vi, en, zh, ja, ko, ru, fr, de, es };

