import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppStateProvider, useAppState } from './AppStateContext';
import { STORAGE_KEY } from '../lib/state';

const MANIFEST = ['mojito.json'];
const RECIPE_FIXTURE = {
  name: 'Mojito',
  description: 'Erfrischend',
  preparation: 'Muddeln, shaken, servieren.',
  salePrice: 8,
  ingredients: [
    { ingredient: 'Weißer Rum', ml: 50 },
    { ingredient: 'Limettensaft', ml: 25 },
  ],
};
const CSV_FIXTURE = [
  'ingredient;product;package_ml;price;tax_rate;price_basis;commission;units_per_case;active',
  'Weißer Rum;Bacardi 1,0 l;1000;15;19;net;false;1;true',
].join('\n');

function mockFetchOnce() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('manifest.json')) {
        return { ok: true, status: 200, json: async () => MANIFEST, text: async () => JSON.stringify(MANIFEST) };
      }
      if (url.endsWith('.json')) {
        return { ok: true, status: 200, json: async () => RECIPE_FIXTURE, text: async () => JSON.stringify(RECIPE_FIXTURE) };
      }
      if (url.endsWith('.csv')) {
        return { ok: true, status: 200, json: async () => ({}), text: async () => CSV_FIXTURE };
      }
      throw new Error(`Unexpected fetch in test: ${url}`);
    }),
  );
}

function wrapper({ children }: { children: ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}

async function renderReadyState() {
  const view = renderHook(() => useAppState(), { wrapper });
  await waitFor(() => expect(view.result.current).toBeTruthy());
  return view;
}

beforeEach(() => {
  localStorage.clear();
  mockFetchOnce();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AppStateProvider', () => {
  it('loads the default recipes and purchases fetched from public/', async () => {
    const { result } = await renderReadyState();
    expect(result.current.state.recipes).toHaveLength(1);
    expect(result.current.state.recipes[0].name).toBe('Mojito');
    expect(result.current.state.purchases).toHaveLength(1);
    expect(result.current.state.purchases[0].product).toBe('Bacardi 1,0 l');
  });

  it('restores a previously saved state from localStorage instead of the defaults', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: { recipePackVersion: 2 }, // avoid triggering the one-time classic-recipe migration
        purchases: [],
        recipes: [{ name: 'Custom Drink', ingredients: [{ ingredient: 'Gin', ml: 50 }] }],
        plans: {},
      }),
    );
    const { result } = await renderReadyState();
    expect(result.current.state.recipes.map((r) => r.name)).toEqual(['Custom Drink']);
  });

  it('upsertPurchase adds a new purchase and enforces one active product per ingredient', async () => {
    const { result } = await renderReadyState();
    const existing = result.current.state.purchases[0];

    act(() => {
      result.current.upsertPurchase({ ...existing, id: 'new-id', product: 'Havana Club', active: true });
    });

    const purchases = result.current.state.purchases;
    const original = purchases.find((p) => p.id === existing.id)!;
    const added = purchases.find((p) => p.id === 'new-id')!;
    expect(added.active).toBe(true);
    expect(original.active).toBe(false); // exclusivity: activating one deactivates the other for the same ingredient
  });

  it('setPurchaseActive enforces the same exclusivity when toggled from a table checkbox', async () => {
    const { result } = await renderReadyState();
    const existing = result.current.state.purchases[0];

    act(() => {
      result.current.upsertPurchase({ ...existing, id: 'second', product: 'Havana Club', active: false });
    });
    act(() => {
      result.current.setPurchaseActive('second', true);
    });

    const purchases = result.current.state.purchases;
    expect(purchases.find((p) => p.id === 'second')!.active).toBe(true);
    expect(purchases.find((p) => p.id === existing.id)!.active).toBe(false);
  });

  it('deletePurchase removes the item', async () => {
    const { result } = await renderReadyState();
    const id = result.current.state.purchases[0].id;

    act(() => {
      result.current.deletePurchase(id);
    });

    expect(result.current.state.purchases).toHaveLength(0);
  });

  it('importPurchasesCsv appends valid rows and reports skipped ones', async () => {
    const { result } = await renderReadyState();

    let importResult!: ReturnType<typeof result.current.importPurchasesCsv>;
    act(() => {
      importResult = result.current.importPurchasesCsv([
        { ingredient: 'Gin', product: 'Bombay Sapphire' },
        { ingredient: 'Rum', product: '' },
      ]);
    });

    expect(importResult.created).toHaveLength(1);
    expect(importResult.skipped).toBe(1);
    expect(result.current.state.purchases.map((p) => p.ingredient)).toContain('Gin');
  });

  it('upsertRecipe adds and updates recipes', async () => {
    const { result } = await renderReadyState();

    act(() => {
      result.current.upsertRecipe({ id: 'new', name: 'Caipirinha', description: '', preparation: '', salePrice: 7, ingredients: [] });
    });
    expect(result.current.state.recipes.map((r) => r.name)).toContain('Caipirinha');

    act(() => {
      result.current.upsertRecipe({ id: 'new', name: 'Caipirinha Deluxe', description: '', preparation: '', salePrice: 9, ingredients: [] });
    });
    expect(result.current.state.recipes.filter((r) => r.id === 'new')).toHaveLength(1);
    expect(result.current.state.recipes.find((r) => r.id === 'new')?.name).toBe('Caipirinha Deluxe');
  });

  it('deleteRecipe also removes its plan entry', async () => {
    const { result } = await renderReadyState();
    const id = result.current.state.recipes[0].id;

    act(() => {
      result.current.setPlan(id, { selected: true, value: 5 });
    });
    expect(result.current.state.plans[id]).toBeTruthy();

    act(() => {
      result.current.deleteRecipe(id);
    });
    expect(result.current.state.recipes).toHaveLength(0);
    expect(result.current.state.plans[id]).toBeUndefined();
  });

  it('duplicateRecipe creates a copy with a new id and a suffixed name', async () => {
    const { result } = await renderReadyState();
    const original = result.current.state.recipes[0];

    act(() => {
      result.current.duplicateRecipe(original.id);
    });

    expect(result.current.state.recipes).toHaveLength(2);
    const copy = result.current.state.recipes.find((r) => r.id !== original.id)!;
    expect(copy.name).toContain(original.name);
    expect(copy.ingredients[0].id).not.toBe(original.ingredients[0].id);
  });

  it('setPlan and toggleAllPlans update the plan map', async () => {
    const { result } = await renderReadyState();
    const id = result.current.state.recipes[0].id;

    act(() => {
      result.current.setPlan(id, { mode: 'pieces', value: 20, selected: true });
    });
    expect(result.current.state.plans[id]).toMatchObject({ value: 20, selected: true });

    act(() => {
      result.current.toggleAllPlans(false);
    });
    expect(result.current.state.plans[id]?.selected).toBe(false);
  });

  it('resetToDefaults discards custom changes', async () => {
    const { result } = await renderReadyState();

    act(() => {
      result.current.deletePurchase(result.current.state.purchases[0].id);
    });
    expect(result.current.state.purchases).toHaveLength(0);

    act(() => {
      result.current.resetToDefaults();
    });
    expect(result.current.state.purchases).toHaveLength(1);
  });

  it('importBackup replaces the whole state and reports warnings for a bare state object', async () => {
    const { result } = await renderReadyState();

    let outcome!: ReturnType<typeof result.current.importBackup>;
    act(() => {
      outcome = result.current.importBackup(
        {
          settings: { recipePackVersion: 2 }, // avoid triggering the one-time classic-recipe migration
          purchases: [],
          recipes: [{ name: 'Imported Drink', ingredients: [{ ingredient: 'Gin', ml: 40 }] }],
          plans: {},
        },
        'de',
      );
    });

    expect(outcome.ok).toBe(true);
    expect(outcome.warnings.length).toBeGreaterThan(0);
    expect(result.current.state.recipes.map((r) => r.name)).toEqual(['Imported Drink']);
  });

  it('importBackup rejects an unusable file without touching the current state', async () => {
    const { result } = await renderReadyState();
    const before = result.current.state;

    let outcome!: ReturnType<typeof result.current.importBackup>;
    act(() => {
      outcome = result.current.importBackup('not an object', 'en');
    });

    expect(outcome.ok).toBe(false);
    expect(result.current.state).toBe(before);
  });

  it('importRecipesFile replaces only the recipes', async () => {
    const { result } = await renderReadyState();
    const purchasesBefore = result.current.state.purchases;

    act(() => {
      result.current.importRecipesFile([{ name: 'Negroni', ingredients: [{ ingredient: 'Gin', ml: 30 }] }], 'en');
    });

    expect(result.current.state.recipes.map((r) => r.name)).toEqual(['Negroni']);
    expect(result.current.state.purchases).toBe(purchasesBefore);
  });

  it('persists state changes to localStorage after the autosave debounce', async () => {
    const { result } = await renderReadyState();

    act(() => {
      result.current.deletePurchase(result.current.state.purchases[0].id);
    });

    await waitFor(
      () => {
        const raw = localStorage.getItem(STORAGE_KEY);
        expect(raw).toBeTruthy();
        expect(JSON.parse(raw!).purchases).toEqual([]);
      },
      { timeout: 1000 },
    );
  });
});
