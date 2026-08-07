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
  missing: boolean;
}

export interface ComputeResult {
  recipeRows: RecipeRow[];
  orderRows: OrderRow[];
  totalOrderGross: number;
  totalOrderNet: number;
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
  returnOnCostPct: number;
  taxAmount: number;
}
