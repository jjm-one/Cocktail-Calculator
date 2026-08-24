import { parseCsv } from './csv';
import { uid } from './format';
import type { AppState, Lang, Purchase, Recipe, RecipeIngredient, Settings } from './types';

export const STORAGE_KEY = 'cocktail-kalkulator-v2';
export const UI_LANG_KEY = 'jjm-ui-language';
export const BACKUP_FORMAT = 'cocktail-kalkulator-backup';
export const RECIPES_FORMAT = 'cocktail-kalkulator-recipes';
export const BACKUP_VERSION = 4;
export const RECIPES_FORMAT_VERSION = 1;

const ADDITIONAL_CLASSIC_NAMES = [
  'Caipirinha',
  'Piña Colada',
  'Espresso Martini',
  'Mojito',
  'Moscow Mule',
  'Cuba Libre',
  'Margarita',
  'Whiskey Sour',
  'Cosmopolitan',
  'Aperol Spritz',
  'Gin Tonic',
  'Negroni',
  'White Russian',
  'Mai Tai',
];

async function loadDefaultRecipes(): Promise<Recipe[]> {
  const manifestResponse = await fetch(`${import.meta.env.BASE_URL}default-recipes/manifest.json`);
  if (!manifestResponse.ok) throw new Error(`Default recipe manifest could not be loaded (${manifestResponse.status})`);
  const files: string[] = await manifestResponse.json();
  return Promise.all(
    files.map(async (file) => {
      const response = await fetch(`${import.meta.env.BASE_URL}default-recipes/${file}`);
      if (!response.ok) throw new Error(`Default recipe could not be loaded: ${file}`);
      const recipe = await response.json();
      return {
        ...recipe,
        id: uid(),
        salePrice: Number(recipe.salePrice) || 0,
        alcoholFree: recipe.alcoholFree === true,
        ingredients: (recipe.ingredients || []).map((ingredient: { ingredient: string; ml: number }) => ({
          ...ingredient,
          id: uid(),
          ml: Number(ingredient.ml) || 0,
        })),
      } satisfies Recipe;
    }),
  );
}

async function loadDefaultPurchases(): Promise<Purchase[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}default-prices.csv`);
  if (!response.ok) throw new Error(`Default prices could not be loaded (${response.status})`);
  const rows = parseCsv(await response.text());
  return rows
    .map(
      (row): Purchase => ({
        id: uid(),
        ingredient: row.ingredient || '',
        product: row.product || '',
        packageMl: Number(String(row.package_ml || 1000).replace(',', '.')) || 1000,
        price: Number(String(row.price || 0).replace(',', '.')) || 0,
        taxRate: Number(String(row.tax_rate || 0).replace(',', '.')) || 0,
        priceBasis: String(row.price_basis || 'gross').toLowerCase().startsWith('net') ? 'net' : 'gross',
        commission: ['true', '1', 'ja', 'yes'].includes(String(row.commission || '').toLowerCase()),
        unitsPerCase: Math.max(1, Number(row.units_per_case) || 1),
        active: !['false', '0', 'nein', 'no'].includes(String(row.active ?? 'true').toLowerCase()),
        source: row.source || '',
        stockUnits: Math.max(0, Number(String(row.stock_units || 0).replace(',', '.')) || 0),
      }),
    )
    .filter((item) => item.ingredient && item.product);
}

let cachedDefaults: { recipes: Recipe[]; purchases: Purchase[] } | null = null;

export async function loadDefaults(): Promise<{ recipes: Recipe[]; purchases: Purchase[] }> {
  if (!cachedDefaults) {
    const [recipes, purchases] = await Promise.all([loadDefaultRecipes(), loadDefaultPurchases()]);
    cachedDefaults = { recipes, purchases };
  }
  return cachedDefaults;
}

export function defaultSettings(): Settings {
  return {
    defaultServingMl: 170,
    bufferPct: 5,
    consumptionLossPct: 3,
    yieldLossPct: 0,
    commissionMode: 'case',
    soldPct: 100,
    currency: 'EUR',
    language: 'de',
    recipePackVersion: 2,
  };
}

export function buildDefaultState(defaults: { recipes: Recipe[]; purchases: Purchase[] }): AppState {
  return {
    settings: defaultSettings(),
    purchases: structuredClone(defaults.purchases),
    recipes: structuredClone(defaults.recipes),
    plans: {},
  };
}

function sanitizePurchase(raw: unknown): Purchase | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<Purchase>;
  const ingredient = String(p.ingredient ?? '').trim();
  const product = String(p.product ?? '').trim();
  if (!ingredient || !product) return null;
  return {
    id: p.id || uid(),
    ingredient,
    product,
    packageMl: Number(p.packageMl) || 1000,
    price: Number(p.price) || 0,
    taxRate: Number(p.taxRate) || 0,
    priceBasis: p.priceBasis === 'net' ? 'net' : 'gross',
    commission: p.commission === true,
    unitsPerCase: Math.max(1, Number(p.unitsPerCase) || 1),
    active: p.active !== false,
    source: typeof p.source === 'string' ? p.source : '',
    stockUnits: Math.max(0, Number(p.stockUnits) || 0),
  };
}

function sanitizeRecipeIngredient(raw: unknown): RecipeIngredient | null {
  if (!raw || typeof raw !== 'object') return null;
  const i = raw as Partial<RecipeIngredient>;
  const ingredient = String(i.ingredient ?? '').trim();
  const ml = Number(i.ml) || 0;
  if (!ingredient || ml <= 0) return null;
  return { id: i.id || uid(), ingredient, ml };
}

function sanitizeRecipe(raw: unknown): Recipe | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<Recipe>;
  const name = String(r.name ?? '').trim();
  if (!name) return null;
  const ingredients = Array.isArray(r.ingredients)
    ? r.ingredients.map(sanitizeRecipeIngredient).filter((i): i is RecipeIngredient => i !== null)
    : [];
  return {
    id: r.id || uid(),
    name,
    description: typeof r.description === 'string' ? r.description : '',
    preparation: typeof r.preparation === 'string' ? r.preparation : '',
    salePrice: Number(r.salePrice) || 0,
    alcoholFree: r.alcoholFree === true,
    ingredients,
  };
}

export function normalizeState(raw: unknown, defaults: { recipes: Recipe[]; purchases: Purchase[] }): AppState {
  const base = buildDefaultState(defaults);
  const input = (raw && typeof raw === 'object' ? raw : {}) as Partial<AppState> & { settings?: Partial<Settings> };
  const sanitizedPurchases = Array.isArray(input.purchases)
    ? input.purchases.map(sanitizePurchase).filter((p): p is Purchase => p !== null)
    : null;
  const sanitizedRecipes = Array.isArray(input.recipes)
    ? input.recipes.map(sanitizeRecipe).filter((r): r is Recipe => r !== null)
    : null;
  const next: AppState = {
    ...base,
    ...input,
    settings: { ...base.settings, ...(input.settings || {}) },
    purchases: sanitizedPurchases ?? base.purchases,
    recipes: sanitizedRecipes ?? base.recipes,
    plans: input.plans && typeof input.plans === 'object' ? input.plans : {},
  };
  if (input.settings && Number(input.settings.recipePackVersion || 0) < 2) {
    const existing = new Set(next.recipes.map((r) => String(r.name).trim().toLowerCase()));
    for (const recipe of defaults.recipes.filter((r) => ADDITIONAL_CLASSIC_NAMES.includes(r.name))) {
      if (!existing.has(recipe.name.toLowerCase())) next.recipes.push(structuredClone(recipe));
    }
    next.settings.recipePackVersion = 2;
  }
  return next;
}

export function backupPayload(state: AppState) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    appVersion: __APP_VERSION__,
    exportedAt: new Date().toISOString(),
    state,
  };
}

export function recipesPayload(state: AppState) {
  return {
    format: RECIPES_FORMAT,
    version: RECIPES_FORMAT_VERSION,
    appVersion: __APP_VERSION__,
    exportedAt: new Date().toISOString(),
    recipes: state.recipes,
  };
}

export interface ImportOutcome<T> {
  ok: boolean;
  data?: T;
  error?: string;
  warnings: string[];
}

export function parseBackupFile(
  raw: unknown,
  defaults: { recipes: Recipe[]; purchases: Purchase[] },
  language: Lang,
): ImportOutcome<AppState> {
  const warnings: string[] = [];
  if (!raw || typeof raw !== 'object') {
    return { ok: false, warnings, error: language === 'en' ? 'The file is not a valid JSON object.' : 'Die Datei ist kein gültiges JSON-Objekt.' };
  }
  const obj = raw as Record<string, unknown>;
  const isBackup = obj.format === BACKUP_FORMAT;
  const stateSource = isBackup ? obj.state : obj;
  if (!stateSource || typeof stateSource !== 'object') {
    return {
      ok: false,
      warnings,
      error: language === 'en' ? 'No usable data ("state") found in the file.' : 'Keine verwertbaren Daten ("state") in der Datei gefunden.',
    };
  }
  if (!isBackup) {
    warnings.push(
      language === 'en'
        ? 'The file has no recognizable backup header and was imported as a bare data set.'
        : 'Die Datei hat keine erkennbare Sicherungs-Kennung und wurde als reiner Datenstand importiert.',
    );
  }
  const fileVersion = Number(obj.version);
  if (isBackup && Number.isFinite(fileVersion) && fileVersion > BACKUP_VERSION) {
    warnings.push(
      language === 'en'
        ? `This backup was created with a newer app version (format ${fileVersion} vs. ${BACKUP_VERSION} supported); some fields may be ignored.`
        : `Diese Sicherung stammt von einer neueren App-Version (Format ${fileVersion} statt unterstütztem ${BACKUP_VERSION}); einzelne Felder könnten ignoriert werden.`,
    );
  }
  const state = normalizeState(stateSource, defaults);
  if (state.purchases.length === 0 && state.recipes.length === 0) {
    warnings.push(
      language === 'en'
        ? 'The imported file contained neither purchase items nor recipes.'
        : 'Die importierte Datei enthielt weder EK-Posten noch Rezepte.',
    );
  }
  return { ok: true, data: state, warnings };
}

export function parseRecipesFile(raw: unknown, language: Lang): ImportOutcome<Recipe[]> {
  const warnings: string[] = [];
  if (!raw || typeof raw !== 'object') {
    return { ok: false, warnings, error: language === 'en' ? 'The file is not a valid JSON object.' : 'Die Datei ist kein gültiges JSON-Objekt.' };
  }
  const obj = raw as Record<string, unknown>;
  const isRecipesFile = obj.format === RECIPES_FORMAT;
  const rawList = Array.isArray(raw) ? raw : Array.isArray(obj.recipes) ? obj.recipes : null;
  if (!rawList) {
    return {
      ok: false,
      warnings,
      error: language === 'en' ? 'No "recipes" array found in the file.' : 'Kein "recipes"-Array in der Datei gefunden.',
    };
  }
  if (!isRecipesFile && !Array.isArray(raw)) {
    warnings.push(
      language === 'en'
        ? 'The file has no recognizable recipes header; the contained "recipes" array was imported anyway.'
        : 'Die Datei hat keine erkennbare Rezepte-Kennung; das enthaltene "recipes"-Array wurde trotzdem importiert.',
    );
  }
  const recipes = rawList.map(sanitizeRecipe).filter((r): r is Recipe => r !== null);
  const skipped = rawList.length - recipes.length;
  if (skipped > 0) {
    warnings.push(
      language === 'en'
        ? `${skipped} recipe(s) were skipped (missing name or ingredients).`
        : `${skipped} Rezept(e) übersprungen (fehlender Name oder fehlende Zutaten).`,
    );
  }
  if (recipes.length === 0) {
    return {
      ok: false,
      warnings,
      error: language === 'en' ? 'No valid recipes found in the file.' : 'Keine gültigen Rezepte in der Datei gefunden.',
    };
  }
  return { ok: true, data: recipes, warnings };
}
