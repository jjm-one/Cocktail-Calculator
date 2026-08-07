import { describe, expect, it } from 'vitest';
import { csvEscape, parseCsv } from './csv';

describe('parseCsv', () => {
  it('parses semicolon-delimited rows', () => {
    const rows = parseCsv('ingredient;price\nVodka;10\nGin;12');
    expect(rows).toEqual([
      { ingredient: 'Vodka', price: '10' },
      { ingredient: 'Gin', price: '12' },
    ]);
  });

  it('parses comma-delimited rows', () => {
    const rows = parseCsv('ingredient,price\nVodka,10');
    expect(rows).toEqual([{ ingredient: 'Vodka', price: '10' }]);
  });

  it('honours quoted fields containing the delimiter', () => {
    const rows = parseCsv('ingredient;note\n"Weißer Rum";"6x1,0 l; case"');
    expect(rows).toEqual([{ ingredient: 'Weißer Rum', note: '6x1,0 l; case' }]);
  });

  it('unescapes doubled quotes inside quoted fields', () => {
    const rows = parseCsv('ingredient;note\nGin;"say ""hi"""');
    expect(rows[0].note).toBe('say "hi"');
  });

  it('strips a leading byte-order mark', () => {
    const rows = parseCsv('﻿ingredient;price\nVodka;10');
    expect(rows[0].ingredient).toBe('Vodka');
  });

  it('lower-cases and trims header names', () => {
    const rows = parseCsv(' Ingredient ; Price \nVodka;10');
    expect(rows[0]).toEqual({ ingredient: 'Vodka', price: '10' });
  });

  it('returns an empty array for an empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });
});

describe('csvEscape', () => {
  it('leaves plain values untouched', () => {
    expect(csvEscape('Vodka')).toBe('Vodka');
    expect(csvEscape(10)).toBe('10');
  });

  it('quotes and escapes values containing the delimiter, quotes or newlines', () => {
    expect(csvEscape('a;b')).toBe('"a;b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
  });

  it('renders null/undefined as an empty string', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });
});
