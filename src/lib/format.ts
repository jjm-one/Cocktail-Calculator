import type { Lang } from './types';

export function localeFor(language: Lang): string {
  return language === 'en' ? 'en-US' : 'de-DE';
}

export function money(v: number, language: Lang, currency: string): string {
  return new Intl.NumberFormat(localeFor(language), { style: 'currency', currency: currency || 'EUR' }).format(
    Number(v) || 0,
  );
}

export function num(v: number, language: Lang, d = 2): string {
  return new Intl.NumberFormat(localeFor(language), { maximumFractionDigits: d, minimumFractionDigits: d }).format(
    Number(v) || 0,
  );
}

export function formatScaledAmount(ml: number, language: Lang): string {
  if (ml >= 1000) return `${num(ml / 1000, language, 3)} l`;
  if (ml >= 100) return `${num(ml / 10, language, 2)} cl`;
  return `${num(ml, language, 1)} ml`;
}

const DIACRITICS_RE = /[̀-ͯ]/g;

export function safeFileName(value: string): string {
  return (
    String(value || 'rezept')
      .toLowerCase()
      .normalize('NFD')
      .replace(DIACRITICS_RE, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'rezept'
  );
}

export function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}
