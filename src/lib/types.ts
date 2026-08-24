export type Lang = 'de' | 'en';

export type Unit = 'ml' | 'cl' | 'l';
export type PriceBasis = 'gross' | 'net';
export type CommissionMode = 'case' | 'bottle';
export type PlanMode = 'pieces' | 'volume';

export interface Purchase {
  id: string;
  ingredient: string;
  product: string;
  packageMl: number;
  price: number;
  taxRate: number;
  priceBasis: PriceBasis;
  commission: boolean;
  unitsPerCase: number;
  active: boolean;
  source?: string;
  /** Bottles/packages already in stock; reduces the calculated order quantity. */
  stockUnits: number;
}

export interface RecipeIngredient {
  id: string;
  ingredient: string;
  ml: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  preparation: string;
  salePrice: number;
  ingredients: RecipeIngredient[];
  /** Marks the recipe as alcohol-free. Defaults to false/unset when absent. */
  alcoholFree?: boolean;
}

export interface Plan {
  mode: PlanMode;
  value: number;
  unit: Unit;
  selected: boolean;
}

export interface Settings {
  defaultServingMl: number;
  bufferPct: number;
  consumptionLossPct: number;
  yieldLossPct: number;
  commissionMode: CommissionMode;
  soldPct: number;
  currency: string;
  language: Lang;
  recipePackVersion: number;
}

export interface AppState {
  settings: Settings;
  purchases: Purchase[];
  recipes: Recipe[];
  plans: Record<string, Plan>;
}

export interface RecipeRow {
  recipe: Recipe;
  servings: number;
  liquidMl: number;
  ekNoLoss: number;
  ekWithLoss: number;
  sale: number;
  marginNoLoss: number;
  marginWithLoss: number;
  marginPct: number;
  foodCostPct: number;
  markupFactor: number;
  plannedRevenue: number;
  revenueWithYield: number;
  revenueAtSoldPct: number;
  totalContribution: number;
}

export interface OrderRow {
  ingredient: string;
  requiredMl: number;
  /** requiredMl minus stock already on hand; this is what actually needs ordering. */
  netRequiredMl: number;
  stockMl: number;
  purchase: Purchase | null;
  bottles: number;
  cases: number;
  chargedBottles: number;
  orderedMl: number;
  surplusMl: number;
  surplusValue: number;
  orderCostGross: number;
  orderCostNet: number;
  /** orderCostGross if stock on hand were ignored, i.e. the full requiredMl were bought fresh. */
  orderCostGrossNoStock: number;
  missing: boolean;
}

export interface LeftoverRow {
  ingredient: string;
  purchase: Purchase;
  /** Volume left on the shelf (already bought or in stock) if only settings.soldPct of the plan sells. */
  leftoverMl: number;
  /** Value of leftoverMl at gross purchase price. */
  leftoverValue: number;
}

export interface RecipeCalcOptions {
  includeStock: boolean;
  includeLoss: boolean;
  includeBuffer: boolean;
  includeCommission: boolean;
}

export interface RecipeCalcRow {
  recipe: Recipe;
  servings: number;
  ek: number;
  /** Same EK, but stock-netting/commission-case-rounding assume only `settings.soldPct` of the planned demand is actually needed. */
  ekAtSoldShare: number;
  sale: number;
  margin: number;
  marginPct: number;
  foodCostPct: number;
  markupFactor: number;
  totalContribution: number;
  revenueWithYield: number;
}

export interface ComputeResult {
  recipeRows: RecipeRow[];
  orderRows: OrderRow[];
  totalOrderGross: number;
  totalOrderNet: number;
  /** totalOrderGross if existing stock were ignored, i.e. everything required were bought fresh. */
  totalOrderGrossNoStock: number;
  /** totalOrderGrossNoStock - totalOrderGross: how much existing stock reduces the order cost by. */
  stockSavings: number;
  /** stockSavings as a share of totalOrderGrossNoStock. */
  stockCoveragePct: number;
  /** Per-ingredient leftover volume/value if only soldPct of the plan sells; includes commission goods. */
  leftoverRows: LeftoverRow[];
  /** Sum of leftoverRows' volume, excluding commission goods (billed on actual consumption only — nothing of theirs strands). */
  totalLeftoverMlCommission: number;
  /** Value of totalLeftoverMlCommission at gross purchase price. */
  totalLeftoverValueCommission: number;
  /** Sum of leftoverRows' volume, with commission goods treated like regular purchased stock. */
  totalLeftoverMlNoCommission: number;
  /** Value of totalLeftoverMlNoCommission at gross purchase price. */
  totalLeftoverValueNoCommission: number;
  totalRevenue: number;
  totalRevenueAtSold: number;
  totalServings: number;
  totalSurplusValue: number;
  totalSurplusMl: number;
  profit: number;
  profitAtSold: number;
  beNoCommission: number | null;
  beCommission: number | null;
  commissionCostAtSold: number;
  averageRevenuePerDrink: number;
  averageOrderCostPerDrink: number;
  overallFoodCostPct: number;
  /** Food cost ratio at the sold share: commissionCostAtSold / totalRevenueAtSold. */
  foodCostPctAtSold: number;
  returnOnCostPct: number;
  /** profit / totalRevenue: gross margin at 100% of the plan. */
  grossMarginPct: number;
  /** profitAtSold / totalRevenueAtSold: gross margin at the sold share. */
  grossMarginPctAtSold: number;
  taxAmount: number;
}
