import fs from 'fs';
import path from 'path';
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

const existingKeys = new Set(getFlattenedKeyPaths(vi));

// Scan all TSX and TS files for t('key') or t("key")
const tKeyRegex = /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;

const foundKeys: { key: string; file: string; line: number }[] = [];

function scanDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git' && f !== 'locales') {
        scanDir(full);
      }
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        let match;
        while ((match = tKeyRegex.exec(line)) !== null) {
          foundKeys.push({ key: match[1], file: full, line: idx + 1 });
        }
      });
    }
  }
}

scanDir('./src');

console.log(`Found ${foundKeys.length} total t(...) invocations in src.`);

const missingKeys = foundKeys.filter(k => !existingKeys.has(k.key));
console.log(`Missing keys in locales (${missingKeys.length}):`);
const uniqueMissing = new Map<string, { file: string; line: number }>();
for (const m of missingKeys) {
  if (!uniqueMissing.has(m.key)) {
    uniqueMissing.set(m.key, { file: m.file, line: m.line });
  }
}

for (const [k, loc] of uniqueMissing.entries()) {
  console.log(`- "${k}" (used in ${loc.file}:${loc.line})`);
}
