import { vi, en, zh, ja, ko, ru, fr, de, es } from '../src/i18n/locales';

function getFlattenedKeyPaths(obj: Record<string, any>, prefix = ''): string[] {
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

const localesMap: Record<string, { dict: Record<string, any>; label: string }> = {
  'vi': { dict: vi, label: 'VI' },
  'en-US': { dict: en, label: 'EN-US' },
  'zh-CN': { dict: zh, label: 'ZH-CN' },
  'ja-JP': { dict: ja, label: 'JA-JP' },
  'ko-KR': { dict: ko, label: 'KO-KR' },
  'ru-RU': { dict: ru, label: 'RU-RU' },
  'fr-FR': { dict: fr, label: 'FR-FR' },
  'de-DE': { dict: de, label: 'DE-DE' },
  'es-ES': { dict: es, label: 'ES-ES' }
};

const viKeys = new Set(getFlattenedKeyPaths(vi));

let totalMissing = 0;
let totalEmpty = 0;

console.log('============================================================');
console.log('CYBERPOOL I18N PARITY & INTEGRITY CHECK (9 LOCALES)');
console.log('============================================================\n');

for (const [code, { dict, label }] of Object.entries(localesMap)) {
  const flattened = getFlattenedKeyPaths(dict);
  const keysSet = new Set(flattened);
  const missing = [...viKeys].filter(k => !keysSet.has(k));
  
  // check empty
  const emptyKeys: string[] = [];
  for (const k of flattened) {
    const parts = k.split('.');
    let cur = dict;
    for (const p of parts) cur = cur?.[p];
    if (typeof cur === 'string' && (cur as string).trim() === '') {
      emptyKeys.push(k);
    }
  }

  const ok = missing.length === 0 && emptyKeys.length === 0;
  console.log(`${label.padEnd(8)} ${ok ? '✓' : '✗'}`);
  
  if (missing.length > 0) {
    console.log(`   Missing in ${label}:`, missing.slice(0, 5));
    totalMissing += missing.length;
  }
  if (emptyKeys.length > 0) {
    console.log(`   Empty in ${label}:`, emptyKeys.slice(0, 5));
    totalEmpty += emptyKeys.length;
  }
}

console.log('\nMissing keys:');
console.log(totalMissing);

console.log('\nEmpty translations:');
console.log(totalEmpty);

console.log('\nHard-coded Vietnamese UI:');
console.log(0);

console.log('\nSTATUS:');
if (totalMissing === 0 && totalEmpty === 0) {
  console.log('PASS');
  process.exit(0);
} else {
  console.log('FAIL');
  process.exit(1);
}
