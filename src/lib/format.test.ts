import { describe, expect, it } from 'vitest';
import { formatScaledAmount, money, num, safeFileName, uid } from './format';

describe('money', () => {
  it('formats German amounts with a comma decimal separator and EUR sign', () => {
    const out = money(1234.5, 'de', 'EUR');
    expect(out).toContain('1.234,50');
    expect(out).toContain('€');
  });

  it('formats English amounts with a dot decimal separator', () => {
    const out = money(1234.5, 'en', 'USD');
    expect(out).toContain('1,234.50');
    expect(out).toContain('$');
  });
});

describe('num', () => {
  it('respects the requested decimal precision per locale', () => {
    expect(num(1000.5, 'de', 2)).toBe('1.000,50');
    expect(num(1000.5, 'en', 2)).toBe('1,000.50');
    expect(num(3.14159, 'de', 0)).toBe('3');
  });
});

describe('formatScaledAmount', () => {
  it('picks ml below 100', () => {
    expect(formatScaledAmount(50, 'en')).toContain('ml');
  });

  it('picks cl between 100 and 1000', () => {
    expect(formatScaledAmount(500, 'en')).toContain('cl');
  });

  it('picks l at or above 1000', () => {
    expect(formatScaledAmount(1500, 'en')).toContain('l');
    expect(formatScaledAmount(1500, 'en')).not.toContain('ml');
  });
});

describe('safeFileName', () => {
  it('lower-cases, strips diacritics and punctuation, and hyphenates', () => {
    expect(safeFileName('Piña Colada!')).toBe('pina-colada');
  });

  it('falls back to a default name for empty input', () => {
    expect(safeFileName('')).toBe('rezept');
    expect(safeFileName('   ')).toBe('rezept');
  });
});

describe('uid', () => {
  it('generates unique, non-empty ids', () => {
    const a = uid();
    const b = uid();
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toBe(b);
  });
});
