import { formatWithCurrency } from './i18n';
import { CurrencyCode } from '../types';

export function formatCurrency(amount: number, currency: CurrencyCode | string = 'VND'): string {
  return formatWithCurrency(amount, currency);
}

export function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 8; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash + '...' + chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
}

export function generateRandomKey(platform: string): string {
  const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  if (platform === 'Steam') {
    return `ST-${rand()}-${rand()}-${rand()}`;
  }
  if (platform === 'GiftUp') {
    return `GU-50USD-${rand()}-${rand()}-${rand()}`;
  }
  return `KEY-${rand()}-${rand()}-${rand()}`;
}
