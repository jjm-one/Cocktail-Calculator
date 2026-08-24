import type {
  AppState,
  ComputeResult,
  OrderRow,
  Plan,
  Purchase,
  Recipe,
  RecipeCalcOptions,
  RecipeCalcRow,
  RecipeRow,
  Settings,
  Unit,
} from './types';

export function toMl(value: number | string, unit: Unit = 'ml'): number {
  const v = Number(value) || 0;
  return unit === 'l' ? v * 1000 : unit === 'cl' ? v * 10 : v;
}

export function fromMl(value: number, unit: Unit = 'ml'): number {
  return unit === 'l' ? value / 1000 : unit === 'cl' ? value / 10 : value;
}

export function unitsPerCase(p: Pick<Purchase, 'unitsPerCase'> | undefined): number {
  return Math.max(1, Number(p?.unitsPerCase) || 1);
}

export function activePurchaseFor(purchases: Purchase[], ingredient: string): Purchase | null {
  return (
    purchases.find(
      (p) => p.ingredient.trim().toLowerCase() === ingredient.trim().toLowerCase() && p.active,
    ) || null
  );
}

export function grossPrice(p: Purchase): number {
  const tax = (Number(p.taxRate) || 0) / 100;
  return p.priceBasis === 'net' ? Number(p.price) * (1 + tax) : Number(p.price);
}

export function netPrice(p: Purchase): number {
  const tax = (Number(p.taxRate) || 0) / 100;
  return p.priceBasis === 'gross' ? Number(p.price) / (1 + tax) : Number(p.price);
}

export function recipeBaseMl(r: Recipe): number {
  return r.ingredients.reduce((s, i) => s + (Number(i.ml) || 0), 0);
}

const DEFAULT_PLAN: Plan = { mode: 'pieces', value: 0, unit: 'ml', selected: true };

export function planToServings(defaultServingMl: number, plan: Plan | undefined): number {
  if (!plan || plan.selected === false) return 0;
  return plan.mode === 'pieces' ? Number(plan.value) || 0 : toMl(plan.value, plan.unit) / defaultServingMl;
}

export function planLiquidMl(defaultServingMl: number, plan: Plan | undefined): number {
  return planToServings(defaultServingMl, plan) * defaultServingMl;
}

export function ingredientFactor(defaultServingMl: number, r: Recipe): number {
  const base = recipeBaseMl(r) || 170;
  return defaultServingMl / base;
}

export function compute(state: AppState): ComputeResult {
  const { settings, recipes, purchases, plans } = state;
  const lossFactor = 1 + (Number(settings.consumptionLossPct) || 0) / 100;
  const bufferFactor = 1 + (Number(settings.bufferPct) || 0) / 100;
  const yieldFactor = 1 - (Number(settings.yieldLossPct) || 0) / 100;
  const soldPct = (Number(settings.soldPct) || 0) / 100;
  const recipeRows: RecipeRow[] = [];
  const needs: Record<string, { ingredient: string; requiredMl: number; purchase: Purchase | null }> = {};

  for (const r of recipes) {
    const plan = plans[r.id] || DEFAULT_PLAN;
    if (plan.selected === false) continue;
    const servings = planToServings(settings.defaultServingMl, plan);
    const scale = ingredientFactor(settings.defaultServingMl, r);
    let exactGross = 0;
    for (const ing of r.ingredients) {
      const qtyPerDrink = (Number(ing.ml) || 0) * scale;
      const p = activePurchaseFor(purchases, ing.ingredient);
      const unitCost = p ? grossPrice(p) / (Number(p.packageMl) || 1) : 0;
      exactGross += qtyPerDrink * unitCost;
      const qty = qtyPerDrink * servings * lossFactor * bufferFactor;
      if (!needs[ing.ingredient]) needs[ing.ingredient] = { ingredient: ing.ingredient, requiredMl: 0, purchase: p };
      needs[ing.ingredient].requiredMl += qty;
    }
    const ekNoLoss = exactGross;
    const ekWithLoss = exactGross * lossFactor * bufferFactor;
    const sale = Number(r.salePrice) || 0;
    const plannedRevenue = servings * sale;
    const revenueWithYield = servings * sale * yieldFactor;
    const revenueAtSoldPct = revenueWithYield * soldPct;
    const marginWithLoss = sale - ekWithLoss;
    recipeRows.push({
      recipe: r,
      servings,
      liquidMl: servings * settings.defaultServingMl,
      ekNoLoss,
      ekWithLoss,
      sale,
      marginNoLoss: sale - ekNoLoss,
      marginWithLoss,
      marginPct: sale ? (marginWithLoss / sale) * 100 : 0,
      foodCostPct: sale ? (ekWithLoss / sale) * 100 : 0,
      markupFactor: ekWithLoss ? sale / ekWithLoss : 0,
      plannedRevenue,
      revenueWithYield,
      revenueAtSoldPct,
      totalContribution: marginWithLoss * servings * yieldFactor,
    });
  }

  const orderRows: OrderRow[] = Object.values(needs).map((n) => {
    const p = n.purchase;
    if (!p) {
      return {
        ...n,
        netRequiredMl: n.requiredMl,
        stockMl: 0,
        purchase: null,
        bottles: 0,
        cases: 0,
        chargedBottles: 0,
        orderedMl: 0,
        surplusMl: 0,
        surplusValue: 0,
        orderCostGross: 0,
        orderCostNet: 0,
        missing: true,
      };
    }
    const packageMl = Number(p.packageMl) || 1;
    const perCase = unitsPerCase(p);
    const stockMl = Math.max(0, Number(p.stockUnits) || 0) * packageMl;
    const netRequiredMl = Math.max(0, n.requiredMl - stockMl);
    const bottles = Math.ceil(netRequiredMl / packageMl);
    const cases = Math.ceil(bottles / perCase);
    let chargedBottles = bottles;
    if (p.commission && settings.commissionMode === 'case') chargedBottles = cases * perCase;
    const orderedMl = chargedBottles * packageMl;
    const surplusMl = Math.max(0, orderedMl - netRequiredMl);
    const costG = chargedBottles * grossPrice(p);
    const costN = chargedBottles * netPrice(p);
    return {
      ...n,
      netRequiredMl,
      stockMl,
      purchase: p,
      bottles,
      cases,
      chargedBottles,
      orderedMl,
      surplusMl,
      surplusValue: (surplusMl / packageMl) * grossPrice(p),
      orderCostGross: costG,
      orderCostNet: costN,
      missing: false,
    };
  });

  const totalOrderGross = orderRows.reduce((s, x) => s + x.orderCostGross, 0);
  const totalOrderNet = orderRows.reduce((s, x) => s + x.orderCostNet, 0);
  const totalRevenue = recipeRows.reduce((s, x) => s + x.revenueWithYield, 0);
  const totalRevenueAtSold = recipeRows.reduce((s, x) => s + x.revenueAtSoldPct, 0);
  const totalServings = recipeRows.reduce((s, x) => s + x.servings, 0);
  const totalSurplusValue = orderRows.reduce((s, x) => s + x.surplusValue, 0);
  const totalSurplusMl = orderRows.reduce((s, x) => s + x.surplusMl, 0);

  const commissionCostAt = (fraction: number) => {
    let total = 0;
    for (const row of orderRows) {
      const p = row.purchase;
      if (!p) continue;
      if (!p.commission) {
        total += row.orderCostGross;
        continue;
      }
      const needed = row.requiredMl * fraction;
      const bottles = Math.ceil(needed / (Number(p.packageMl) || 1));
      const perCase = unitsPerCase(p);
      const charged = settings.commissionMode === 'case' ? Math.ceil(bottles / perCase) * perCase : bottles;
      total += charged * grossPrice(p);
    }
    return total;
  };
  const revenueAt = (fraction: number) => totalRevenue * fraction;

  let beNoCommission: number | null = null;
  let beCommission: number | null = null;
  for (let pct = 0; pct <= 1000; pct++) {
    const f = pct / 1000;
    if (beNoCommission === null && revenueAt(f) >= totalOrderGross) beNoCommission = f * 100;
    if (beCommission === null && revenueAt(f) >= commissionCostAt(f)) beCommission = f * 100;
    if (beNoCommission !== null && beCommission !== null) break;
  }

  const profit = totalRevenue - totalOrderGross;
  const commissionCostAtSold = commissionCostAt(soldPct);
  const profitAtSold = totalRevenueAtSold - commissionCostAtSold;

  return {
    recipeRows,
    orderRows,
    totalOrderGross,
    totalOrderNet,
    totalRevenue,
    totalRevenueAtSold,
    totalServings,
    totalSurplusValue,
    totalSurplusMl,
    profit,
    profitAtSold,
    beNoCommission,
    beCommission,
    commissionCostAtSold,
    averageRevenuePerDrink: totalServings ? totalRevenue / totalServings : 0,
    averageOrderCostPerDrink: totalServings ? totalOrderGross / totalServings : 0,
    overallFoodCostPct: totalRevenue ? (totalOrderGross / totalRevenue) * 100 : 0,
    returnOnCostPct: totalOrderGross ? (profit / totalOrderGross) * 100 : 0,
    taxAmount: totalOrderGross - totalOrderNet,
  };
}

function effectiveUnitCost(
  p: Purchase | null,
  requiredMlGross: number,
  settings: Settings,
  opts: RecipeCalcOptions,
): number {
  if (!p) return 0;
  const packageMl = Number(p.packageMl) || 1;
  const baseUnitCost = grossPrice(p) / packageMl;
  if (requiredMlGross <= 0) return baseUnitCost;
  const stockMl = opts.includeStock ? Math.max(0, Number(p.stockUnits) || 0) * packageMl : 0;
  const netRequiredMl = Math.max(0, requiredMlGross - stockMl);
  if (p.commission && opts.includeCommission) {
    const bottles = Math.ceil(netRequiredMl / packageMl);
    const perCase = unitsPerCase(p);
    const chargedBottles = settings.commissionMode === 'case' ? Math.ceil(bottles / perCase) * perCase : bottles;
    return (chargedBottles * grossPrice(p)) / requiredMlGross;
  }
  return (netRequiredMl * baseUnitCost) / requiredMlGross;
}

/**
 * Per-drink cost table used by the calculation page. Unlike `compute`, the loss, buffer,
 * stock and commission effects are each toggled independently via `opts` instead of always
 * being applied together. Stock and commission-case rounding are netted per ingredient across
 * all selected recipes (mirroring the order logic), then spread back as a blended per-ml rate
 * so every recipe using that ingredient sees the same effective price.
 *
 * Each row also carries `ekAtSoldShare`, the same price but with stock-netting/commission
 * rounding computed against `settings.soldPct` of the demand instead of the full planned
 * amount — since a case/bottle minimum charged for less actual demand raises the effective
 * per-drink rate, this is not simply `ek * soldPct`.
 */
export function computeRecipeCalcRows(state: AppState, opts: RecipeCalcOptions): RecipeCalcRow[] {
  const { settings, recipes, purchases, plans } = state;
  const lossFactor = opts.includeLoss ? 1 + (Number(settings.consumptionLossPct) || 0) / 100 : 1;
  const bufferFactor = opts.includeBuffer ? 1 + (Number(settings.bufferPct) || 0) / 100 : 1;
  const yieldFactor = 1 - (Number(settings.yieldLossPct) || 0) / 100;
  const soldFraction = (Number(settings.soldPct) || 0) / 100;

  const planned: { recipe: Recipe; servings: number; items: { ingredient: string; qtyPerDrink: number }[] }[] = [];
  const requiredMl: Record<string, number> = {};
  const requiredMlAtSoldShare: Record<string, number> = {};

  for (const r of recipes) {
    const plan = plans[r.id] || DEFAULT_PLAN;
    if (plan.selected === false) continue;
    const servings = planToServings(settings.defaultServingMl, plan);
    const scale = ingredientFactor(settings.defaultServingMl, r);
    const items = r.ingredients.map((ing) => ({ ingredient: ing.ingredient, qtyPerDrink: (Number(ing.ml) || 0) * scale }));
    for (const it of items) {
      const qty = it.qtyPerDrink * servings * lossFactor * bufferFactor;
      requiredMl[it.ingredient] = (requiredMl[it.ingredient] || 0) + qty;
      requiredMlAtSoldShare[it.ingredient] = (requiredMlAtSoldShare[it.ingredient] || 0) + qty * soldFraction;
    }
    planned.push({ recipe: r, servings, items });
  }

  const rate: Record<string, number> = {};
  const rateAtSoldShare: Record<string, number> = {};
  for (const ingredient of Object.keys(requiredMl)) {
    const p = activePurchaseFor(purchases, ingredient);
    rate[ingredient] = effectiveUnitCost(p, requiredMl[ingredient], settings, opts);
    rateAtSoldShare[ingredient] = effectiveUnitCost(p, requiredMlAtSoldShare[ingredient], settings, opts);
  }

  return planned.map(({ recipe, servings, items }) => {
    const ek = items.reduce((s, it) => s + it.qtyPerDrink * lossFactor * bufferFactor * (rate[it.ingredient] || 0), 0);
    const ekAtSoldShare = items.reduce(
      (s, it) => s + it.qtyPerDrink * lossFactor * bufferFactor * (rateAtSoldShare[it.ingredient] || 0),
      0,
    );
    const sale = Number(recipe.salePrice) || 0;
    const margin = sale - ek;
    return {
      recipe,
      servings,
      ek,
      ekAtSoldShare,
      sale,
      margin,
      marginPct: sale ? (margin / sale) * 100 : 0,
      foodCostPct: sale ? (ek / sale) * 100 : 0,
      markupFactor: ek ? sale / ek : 0,
      totalContribution: margin * servings * yieldFactor,
      revenueWithYield: servings * sale * yieldFactor,
    };
  });
}
