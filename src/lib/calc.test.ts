import { describe, expect, it } from 'vitest';
import { compute, computeRecipeCalcRows, fromMl, grossPrice, netPrice, planToServings, recipeBaseMl, toMl } from './calc';
import type { AppState, Plan, Purchase, Recipe, RecipeCalcOptions, Settings } from './types';

const NO_OPTIONS: RecipeCalcOptions = {
  includeStock: false,
  includeLoss: false,
  includeBuffer: false,
  includeCommission: false,
};

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    defaultServingMl: 100,
    bufferPct: 0,
    consumptionLossPct: 0,
    yieldLossPct: 0,
    commissionMode: 'case',
    soldPct: 100,
    currency: 'EUR',
    language: 'de',
    recipePackVersion: 2,
    ...overrides,
  };
}

function makePurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: 'p1',
    ingredient: 'Vodka',
    product: 'Test Vodka 1,0 l',
    packageMl: 1000,
    price: 10,
    taxRate: 0,
    priceBasis: 'gross',
    commission: false,
    unitsPerCase: 1,
    active: true,
    stockUnits: 0,
    ...overrides,
  };
}

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    name: 'Test Drink',
    description: '',
    preparation: '',
    salePrice: 5,
    ingredients: [{ id: 'i1', ingredient: 'Vodka', ml: 100 }],
    ...overrides,
  };
}

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    settings: makeSettings(),
    purchases: [makePurchase()],
    recipes: [makeRecipe()],
    plans: { r1: { mode: 'pieces', value: 10, unit: 'ml', selected: true } },
    ...overrides,
  };
}

describe('unit conversion', () => {
  it('converts to millilitres', () => {
    expect(toMl(1, 'l')).toBe(1000);
    expect(toMl(1, 'cl')).toBe(10);
    expect(toMl(500, 'ml')).toBe(500);
  });

  it('converts from millilitres', () => {
    expect(fromMl(1000, 'l')).toBe(1);
    expect(fromMl(1000, 'cl')).toBe(100);
  });
});

describe('price helpers', () => {
  it('derives gross price from a net-basis purchase', () => {
    const p = makePurchase({ price: 10, taxRate: 19, priceBasis: 'net' });
    expect(grossPrice(p)).toBeCloseTo(11.9, 5);
    expect(netPrice(p)).toBeCloseTo(10, 5);
  });

  it('derives net price from a gross-basis purchase', () => {
    const p = makePurchase({ price: 11.9, taxRate: 19, priceBasis: 'gross' });
    expect(netPrice(p)).toBeCloseTo(10, 5);
    expect(grossPrice(p)).toBeCloseTo(11.9, 5);
  });
});

describe('recipeBaseMl', () => {
  it('sums ingredient quantities', () => {
    const r = makeRecipe({ ingredients: [{ id: 'a', ingredient: 'Gin', ml: 50 }, { id: 'b', ingredient: 'Tonic', ml: 120 }] });
    expect(recipeBaseMl(r)).toBe(170);
  });
});

describe('planToServings', () => {
  it('returns the raw value for piece-mode plans', () => {
    expect(planToServings(170, { mode: 'pieces', value: 5, unit: 'ml', selected: true })).toBe(5);
  });

  it('derives servings from volume-mode plans', () => {
    expect(planToServings(170, { mode: 'volume', value: 1, unit: 'l', selected: true })).toBeCloseTo(1000 / 170, 5);
  });

  it('returns 0 when unselected or missing', () => {
    const unselected: Plan = { mode: 'pieces', value: 5, unit: 'ml', selected: false };
    expect(planToServings(170, unselected)).toBe(0);
    expect(planToServings(170, undefined)).toBe(0);
  });
});

describe('compute', () => {
  it('calculates cost, margin and order quantities for a simple plan', () => {
    const result = compute(makeState());
    const row = result.recipeRows[0];
    expect(row.servings).toBe(10);
    expect(row.ekNoLoss).toBeCloseTo(1, 5); // 100ml * (10 EUR / 1000ml)
    expect(row.sale).toBe(5);
    expect(row.marginWithLoss).toBeCloseTo(4, 5);
    expect(row.totalContribution).toBeCloseTo(40, 5);

    const order = result.orderRows.find((o) => o.ingredient === 'Vodka')!;
    expect(order.requiredMl).toBeCloseTo(1000, 5);
    expect(order.bottles).toBe(1);
    expect(order.orderCostGross).toBeCloseTo(10, 5);

    expect(result.totalOrderGross).toBeCloseTo(10, 5);
    expect(result.totalRevenue).toBeCloseTo(50, 5);
    expect(result.profit).toBeCloseTo(40, 5);
    expect(result.overallFoodCostPct).toBeCloseTo(20, 5);
    expect(result.beNoCommission).toBeCloseTo(20, 1);
  });

  it('nets stock on hand against the required order quantity', () => {
    const state = makeState({ purchases: [makePurchase({ stockUnits: 1 })] });
    const result = compute(state);
    const order = result.orderRows.find((o) => o.ingredient === 'Vodka')!;
    expect(order.stockMl).toBe(1000);
    expect(order.netRequiredMl).toBe(0);
    expect(order.bottles).toBe(0);
    expect(order.orderCostGross).toBe(0);
  });

  it('flags ingredients with no active purchase item as missing', () => {
    const state = makeState({ purchases: [] });
    const result = compute(state);
    const order = result.orderRows.find((o) => o.ingredient === 'Vodka')!;
    expect(order.missing).toBe(true);
    expect(order.purchase).toBeNull();
    expect(order.bottles).toBe(0);
  });

  it('excludes unselected recipes from totals', () => {
    const state = makeState({ plans: { r1: { mode: 'pieces', value: 10, unit: 'ml', selected: false } } });
    const result = compute(state);
    expect(result.totalServings).toBe(0);
    expect(result.totalRevenue).toBe(0);
  });

  it('applies buffer and consumption loss to required quantities but not to per-drink cost', () => {
    const state = makeState({ settings: makeSettings({ bufferPct: 10, consumptionLossPct: 10 }) });
    const result = compute(state);
    const order = result.orderRows.find((o) => o.ingredient === 'Vodka')!;
    // 100ml/drink * 10 drinks * 1.1 (loss) * 1.1 (buffer) = 1210ml
    expect(order.requiredMl).toBeCloseTo(1210, 5);
    // per-drink cost itself is unaffected by loss/buffer
    expect(result.recipeRows[0].ekNoLoss).toBeCloseTo(1, 5);
  });

  it('rounds up to full bottles and cases', () => {
    // 100ml/drink * 15 drinks = 1500ml -> 2 bottles of 1000ml -> 1 case of 2
    const state = makeState({
      purchases: [makePurchase({ packageMl: 1000, unitsPerCase: 2 })],
      plans: { r1: { mode: 'pieces', value: 15, unit: 'ml', selected: true } },
    });
    const order = compute(state).orderRows[0];
    expect(order.bottles).toBe(2);
    expect(order.cases).toBe(1);
    expect(order.surplusMl).toBeCloseTo(500, 5);
  });

  it('charges a full case for commission goods in case mode, even for a single bottle', () => {
    const state = makeState({
      settings: makeSettings({ commissionMode: 'case' }),
      purchases: [makePurchase({ packageMl: 1000, unitsPerCase: 6, commission: true })],
      plans: { r1: { mode: 'pieces', value: 10, unit: 'ml', selected: true } }, // needs 1 bottle
    });
    const order = compute(state).orderRows[0];
    expect(order.bottles).toBe(1);
    expect(order.chargedBottles).toBe(6); // rounded up to the full case
  });

  it('charges only the bottles actually needed for commission goods in bottle mode', () => {
    const state = makeState({
      settings: makeSettings({ commissionMode: 'bottle' }),
      purchases: [makePurchase({ packageMl: 1000, unitsPerCase: 6, commission: true })],
      plans: { r1: { mode: 'pieces', value: 10, unit: 'ml', selected: true } },
    });
    const order = compute(state).orderRows[0];
    expect(order.bottles).toBe(1);
    expect(order.chargedBottles).toBe(1);
  });

  it('aggregates a shared ingredient across multiple recipes', () => {
    // Both recipes use a 100ml base (== defaultServingMl), so each ingredient
    // scales 1:1 and the per-drink quantity is exactly the listed ml amount.
    const state = makeState({
      recipes: [
        makeRecipe({ id: 'r1', name: 'A', ingredients: [{ id: 'i1', ingredient: 'Vodka', ml: 100 }] }),
        makeRecipe({ id: 'r2', name: 'B', ingredients: [{ id: 'i2', ingredient: 'Vodka', ml: 100 }] }),
      ],
      plans: {
        r1: { mode: 'pieces', value: 10, unit: 'ml', selected: true },
        r2: { mode: 'pieces', value: 4, unit: 'ml', selected: true },
      },
    });
    const result = compute(state);
    expect(result.orderRows).toHaveLength(1);
    // r1: 100ml * 10 drinks = 1000ml, r2: 100ml * 4 drinks = 400ml -> 1400ml combined
    expect(result.orderRows[0].requiredMl).toBeCloseTo(1400, 5);
  });

  it('avoids division-by-zero metrics for a free (zero sale price) recipe', () => {
    const state = makeState({ recipes: [makeRecipe({ salePrice: 0 })] });
    const row = compute(state).recipeRows[0];
    expect(row.foodCostPct).toBe(0);
    expect(row.markupFactor).toBe(0);
    expect(row.marginPct).toBe(0);
  });
});

describe('computeRecipeCalcRows', () => {
  it('defaults to the plain per-ml purchase price with no toggles active', () => {
    // 100ml/drink * 10 €/l = 1.00 €, unaffected by loss/buffer/stock/commission.
    const state = makeState();
    const [row] = computeRecipeCalcRows(state, NO_OPTIONS);
    expect(row.ek).toBeCloseTo(1, 5);
  });

  it('applies loss and buffer as independent multipliers', () => {
    const state = makeState({ settings: makeSettings({ consumptionLossPct: 10, bufferPct: 20 }) });
    const lossOnly = computeRecipeCalcRows(state, { ...NO_OPTIONS, includeLoss: true })[0];
    expect(lossOnly.ek).toBeCloseTo(1.1, 5);
    const bufferOnly = computeRecipeCalcRows(state, { ...NO_OPTIONS, includeBuffer: true })[0];
    expect(bufferOnly.ek).toBeCloseTo(1.2, 5);
    const both = computeRecipeCalcRows(state, { ...NO_OPTIONS, includeLoss: true, includeBuffer: true })[0];
    expect(both.ek).toBeCloseTo(1.1 * 1.2, 5);
  });

  it('nets existing stock against the blended cost, spread across recipes sharing the ingredient', () => {
    // Two recipes each need 1000ml total (100ml * 10 drinks); 1 bottle (1000ml) is in stock,
    // covering half of the combined 2000ml need, so the effective rate halves for both.
    const state = makeState({
      purchases: [makePurchase({ price: 10, packageMl: 1000, stockUnits: 1 })],
      recipes: [
        makeRecipe({ id: 'r1', name: 'A', ingredients: [{ id: 'i1', ingredient: 'Vodka', ml: 100 }] }),
        makeRecipe({ id: 'r2', name: 'B', ingredients: [{ id: 'i2', ingredient: 'Vodka', ml: 100 }] }),
      ],
      plans: {
        r1: { mode: 'pieces', value: 10, unit: 'ml', selected: true },
        r2: { mode: 'pieces', value: 10, unit: 'ml', selected: true },
      },
    });
    const withoutStock = computeRecipeCalcRows(state, NO_OPTIONS);
    expect(withoutStock[0].ek).toBeCloseTo(1, 5);
    expect(withoutStock[1].ek).toBeCloseTo(1, 5);
    const withStock = computeRecipeCalcRows(state, { ...NO_OPTIONS, includeStock: true });
    expect(withStock[0].ek).toBeCloseTo(0.5, 5);
    expect(withStock[1].ek).toBeCloseTo(0.5, 5);
  });

  it('only prices commission goods via the case/bottle rounding model when the toggle is on', () => {
    // defaultServingMl matches the recipe's total ml, so the recipe scale factor is 1:1.
    // 250ml needed -> 1 bottle (1000ml), rounded up to a full case of 6 -> 6 bottles charged.
    const state = makeState({
      settings: makeSettings({ defaultServingMl: 250, commissionMode: 'case' }),
      purchases: [makePurchase({ price: 10, packageMl: 1000, unitsPerCase: 6, commission: true })],
      recipes: [makeRecipe({ ingredients: [{ id: 'i1', ingredient: 'Vodka', ml: 250 }] })],
      plans: { r1: { mode: 'pieces', value: 1, unit: 'ml', selected: true } },
    });
    const commissionOff = computeRecipeCalcRows(state, NO_OPTIONS)[0];
    expect(commissionOff.ek).toBeCloseTo(2.5, 5); // plain per-ml price, commission ignored
    const commissionOn = computeRecipeCalcRows(state, { ...NO_OPTIONS, includeCommission: true })[0];
    expect(commissionOn.ek).toBeCloseTo(60, 5); // 6 charged bottles * 10 € spread over 250ml
  });

  it('avoids division-by-zero metrics for a free (zero sale price) recipe', () => {
    const state = makeState({ recipes: [makeRecipe({ salePrice: 0 })] });
    const row = computeRecipeCalcRows(state, NO_OPTIONS)[0];
    expect(row.foodCostPct).toBe(0);
    expect(row.markupFactor).toBe(0);
    expect(row.marginPct).toBe(0);
  });
});
