import { describe, expect, it } from 'vitest';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  buildDefaultState,
  normalizeState,
  parseBackupFile,
  parseRecipesFile,
  RECIPES_FORMAT,
} from './state';
import type { Purchase, Recipe } from './types';

const defaults: { recipes: Recipe[]; purchases: Purchase[] } = {
  recipes: [
    {
      id: 'default-r1',
      name: 'Default Cocktail',
      description: '',
      preparation: '',
      salePrice: 8,
      ingredients: [{ id: 'default-i1', ingredient: 'Vodka', ml: 50 }],
    },
  ],
  purchases: [
    {
      id: 'default-p1',
      ingredient: 'Vodka',
      product: 'Default Vodka',
      packageMl: 1000,
      price: 10,
      taxRate: 19,
      priceBasis: 'net',
      commission: false,
      unitsPerCase: 1,
      active: true,
      stockUnits: 0,
      source: '',
    },
  ],
};

describe('buildDefaultState', () => {
  it('clones the provided defaults with empty plans', () => {
    const state = buildDefaultState(defaults);
    expect(state.recipes).toEqual(defaults.recipes);
    expect(state.purchases).toEqual(defaults.purchases);
    expect(state.plans).toEqual({});
    // must be a deep clone, not the same reference
    state.recipes[0].name = 'Mutated';
    expect(defaults.recipes[0].name).toBe('Default Cocktail');
  });
});

describe('normalizeState', () => {
  it('falls back to defaults for undefined input', () => {
    const state = normalizeState(undefined, defaults);
    expect(state.recipes).toEqual(defaults.recipes);
    expect(state.purchases).toEqual(defaults.purchases);
    expect(state.settings.defaultServingMl).toBe(170);
  });

  it('drops purchases missing an ingredient or product', () => {
    const state = normalizeState(
      { purchases: [{ ingredient: 'Gin', product: '' }, { ingredient: '', product: 'Something' }, { ingredient: 'Rum', product: 'Bacardi' }] },
      defaults,
    );
    expect(state.purchases).toHaveLength(1);
    expect(state.purchases[0].ingredient).toBe('Rum');
  });

  it('defaults stockUnits to 0 when absent and preserves it when present', () => {
    const state = normalizeState(
      { purchases: [{ ingredient: 'Gin', product: 'Bombay' }, { ingredient: 'Rum', product: 'Bacardi', stockUnits: 3 }] },
      defaults,
    );
    expect(state.purchases.find((p) => p.ingredient === 'Gin')?.stockUnits).toBe(0);
    expect(state.purchases.find((p) => p.ingredient === 'Rum')?.stockUnits).toBe(3);
  });

  it('defaults alcoholFree to false when absent and preserves it when present', () => {
    const state = normalizeState(
      {
        recipes: [
          { name: 'Regular', ingredients: [{ ingredient: 'Gin', ml: 50 }] },
          { name: 'Virgin', ingredients: [{ ingredient: 'Gin', ml: 50 }], alcoholFree: true },
        ],
      },
      defaults,
    );
    expect(state.recipes.find((r) => r.name === 'Regular')?.alcoholFree).toBe(false);
    expect(state.recipes.find((r) => r.name === 'Virgin')?.alcoholFree).toBe(true);
  });

  it('drops recipes without a name and ingredients without a positive quantity', () => {
    const state = normalizeState(
      {
        recipes: [
          { name: '', ingredients: [{ ingredient: 'Gin', ml: 50 }] },
          { name: 'Valid', ingredients: [{ ingredient: 'Gin', ml: 50 }, { ingredient: 'Empty', ml: 0 }, { ingredient: '', ml: 20 }] },
        ],
      },
      defaults,
    );
    expect(state.recipes).toHaveLength(1);
    expect(state.recipes[0].name).toBe('Valid');
    expect(state.recipes[0].ingredients).toHaveLength(1);
  });

  it('does not crash on malformed nested shapes', () => {
    expect(() =>
      normalizeState({ purchases: 'not-an-array', recipes: [{ name: 'X', ingredients: 'not-an-array' }] }, defaults),
    ).not.toThrow();
  });
});

describe('parseBackupFile', () => {
  it('rejects non-object input', () => {
    const result = parseBackupFile('nonsense', defaults, 'en');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('accepts a well-formed backup payload', () => {
    const raw = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      state: { settings: {}, purchases: defaults.purchases, recipes: defaults.recipes, plans: {} },
    };
    const result = parseBackupFile(raw, defaults, 'en');
    expect(result.ok).toBe(true);
    expect(result.data?.purchases).toHaveLength(1);
    expect(result.warnings).toEqual([]);
  });

  it('accepts a bare state object with a warning', () => {
    const raw = { settings: {}, purchases: defaults.purchases, recipes: defaults.recipes, plans: {} };
    const result = parseBackupFile(raw, defaults, 'en');
    expect(result.ok).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('warns when the backup was made with a newer format version', () => {
    const raw = {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION + 1,
      state: { purchases: defaults.purchases, recipes: defaults.recipes },
    };
    const result = parseBackupFile(raw, defaults, 'en');
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.toLowerCase().includes('newer'))).toBe(true);
  });

  it('warns when the imported state is entirely empty', () => {
    const raw = { format: BACKUP_FORMAT, version: BACKUP_VERSION, state: { purchases: [], recipes: [] } };
    const result = parseBackupFile(raw, defaults, 'en');
    expect(result.ok).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('parseRecipesFile', () => {
  it('accepts a bare array of recipes', () => {
    const result = parseRecipesFile([{ name: 'Mojito', ingredients: [{ ingredient: 'Rum', ml: 50 }] }], 'en');
    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('accepts a recipes-file payload', () => {
    const raw = { format: RECIPES_FORMAT, version: 1, recipes: [{ name: 'Mojito', ingredients: [{ ingredient: 'Rum', ml: 50 }] }] };
    const result = parseRecipesFile(raw, 'en');
    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('rejects a file without a recipes array', () => {
    const result = parseRecipesFile({ foo: 'bar' }, 'en');
    expect(result.ok).toBe(false);
  });

  it('skips invalid entries and reports how many were skipped', () => {
    const raw = [
      { name: 'Valid', ingredients: [{ ingredient: 'Rum', ml: 50 }] },
      { name: '', ingredients: [{ ingredient: 'Rum', ml: 50 }] },
    ];
    const result = parseRecipesFile(raw, 'en');
    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.warnings.some((w) => w.includes('1'))).toBe(true);
  });

  it('fails when every entry is invalid', () => {
    const result = parseRecipesFile([{ name: '' }], 'en');
    expect(result.ok).toBe(false);
  });
});
