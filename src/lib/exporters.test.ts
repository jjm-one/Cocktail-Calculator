import { describe, expect, it } from 'vitest';
import { buildShoppingListText, importPurchasesFromCsvRows, scaledRecipeData } from './exporters';
import type { ComputeResult, OrderRow, Recipe } from './types';

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    name: 'Mojito',
    description: '',
    preparation: '',
    salePrice: 8,
    ingredients: [
      { id: 'i1', ingredient: 'Weißer Rum', ml: 50 },
      { id: 'i2', ingredient: 'Limettensaft', ml: 25 },
    ],
    ...overrides,
  };
}

function makeOrderRow(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    ingredient: 'Weißer Rum',
    requiredMl: 1000,
    netRequiredMl: 1000,
    stockMl: 0,
    purchase: {
      id: 'p1',
      ingredient: 'Weißer Rum',
      product: 'Bacardi 1,0 l',
      packageMl: 1000,
      price: 15,
      taxRate: 19,
      priceBasis: 'gross',
      commission: false,
      unitsPerCase: 1,
      active: true,
      stockUnits: 0,
    },
    bottles: 1,
    cases: 1,
    chargedBottles: 1,
    orderedMl: 1000,
    surplusMl: 0,
    surplusValue: 0,
    orderCostGross: 15,
    orderCostNet: 12.6,
    orderCostGrossNoStock: 15,
    missing: false,
    ...overrides,
  };
}

function makeComputeResult(orderRows: OrderRow[]): ComputeResult {
  return {
    recipeRows: [],
    orderRows,
    totalOrderGross: 0,
    totalOrderNet: 0,
    totalOrderGrossNoStock: 0,
    stockSavings: 0,
    stockCoveragePct: 0,
    totalLeftoverMl: 0,
    totalLeftoverValue: 0,
    totalRevenue: 0,
    totalRevenueAtSold: 0,
    totalServings: 0,
    totalSurplusValue: 0,
    totalSurplusMl: 0,
    profit: 0,
    profitAtSold: 0,
    beNoCommission: null,
    beCommission: null,
    commissionCostAtSold: 0,
    averageRevenuePerDrink: 0,
    averageOrderCostPerDrink: 0,
    overallFoodCostPct: 0,
    foodCostPctAtSold: 0,
    returnOnCostPct: 0,
    grossMarginPct: 0,
    grossMarginPctAtSold: 0,
    taxAmount: 0,
  };
}

describe('scaledRecipeData', () => {
  it('scales ingredient quantities proportionally to the target volume', () => {
    const data = scaledRecipeData(makeRecipe(), 150, 'ml');
    expect(data.baseMl).toBe(75);
    expect(data.targetMl).toBe(150);
    expect(data.factor).toBe(2);
    expect(data.rows).toEqual([
      { ingredient: 'Weißer Rum', baseMl: 50, scaledMl: 100 },
      { ingredient: 'Limettensaft', baseMl: 25, scaledMl: 50 },
    ]);
  });

  it('returns an empty result for an undefined recipe', () => {
    const data = scaledRecipeData(undefined, 500, 'ml');
    expect(data.recipe).toBeUndefined();
    expect(data.rows).toEqual([]);
    expect(data.factor).toBe(0);
  });

  it('avoids division by zero for a recipe with no ingredients', () => {
    const data = scaledRecipeData(makeRecipe({ ingredients: [] }), 500, 'ml');
    expect(data.baseMl).toBe(0);
    expect(data.factor).toBe(0);
  });
});

describe('buildShoppingListText', () => {
  it('lists ingredient, product and bottle count per order row', () => {
    const text = buildShoppingListText(makeComputeResult([makeOrderRow()]), 'de');
    expect(text).toContain('Weißer Rum');
    expect(text).toContain('Bacardi 1,0 l');
    expect(text).toContain('1 Flasche(n)');
  });

  it('notes stock already on hand', () => {
    const text = buildShoppingListText(makeComputeResult([makeOrderRow({ stockMl: 2000 })]), 'en');
    expect(text).toContain('already in stock');
  });

  it('flags ingredients without a purchase item', () => {
    const text = buildShoppingListText(makeComputeResult([makeOrderRow({ purchase: null, missing: true })]), 'en');
    expect(text).toContain('no purchase item set up');
  });

  it('skips rows with no actual requirement', () => {
    const text = buildShoppingListText(makeComputeResult([makeOrderRow({ requiredMl: 0 })]), 'en');
    expect(text).toContain('nothing planned yet');
  });
});

describe('importPurchasesFromCsvRows', () => {
  it('creates a purchase per valid row and reports skipped rows', () => {
    const result = importPurchasesFromCsvRows([
      { ingredient: 'Gin', product: 'Bombay Sapphire', price: '19.99', stock_units: '2' },
      { ingredient: 'Rum', product: '' }, // missing product -> skipped
      { ingredient: '', product: 'Nothing' }, // missing ingredient -> skipped
    ]);
    expect(result.created).toHaveLength(1);
    expect(result.skipped).toBe(2);
    expect(result.created[0]).toMatchObject({ ingredient: 'Gin', product: 'Bombay Sapphire', price: 19.99, stockUnits: 2 });
  });

  it('understands German column aliases', () => {
    const result = importPurchasesFromCsvRows([{ zutat: 'Vodka', produkt: 'Three Sixty', preis: '10,50', steuersatz: '19' }]);
    expect(result.created[0]).toMatchObject({ ingredient: 'Vodka', product: 'Three Sixty', price: 10.5, taxRate: 19 });
  });

  it('defaults units_per_case to 1 and price_basis to gross when absent', () => {
    const result = importPurchasesFromCsvRows([{ ingredient: 'Gin', product: 'Test' }]);
    expect(result.created[0]).toMatchObject({ unitsPerCase: 1, priceBasis: 'gross', active: true, stockUnits: 0 });
  });
});
