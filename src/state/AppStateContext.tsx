import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { compute } from '../lib/calc';
import { type CsvImportResult, importPurchasesFromCsvRows } from '../lib/exporters';
import { buildDefaultState, type ImportOutcome, loadDefaults, normalizeState, parseBackupFile, parseRecipesFile, STORAGE_KEY } from '../lib/state';
import { uid } from '../lib/format';
import type { AppState, ComputeResult, Lang, Plan, Purchase, Recipe, Settings } from '../lib/types';

interface AppStateContextValue {
  ready: boolean;
  state: AppState;
  computed: ComputeResult;
  setSettings: (patch: Partial<Settings>) => void;
  upsertPurchase: (purchase: Purchase) => void;
  deletePurchase: (id: string) => void;
  setPurchaseActive: (id: string, active: boolean) => void;
  importPurchasesCsv: (rows: Record<string, string>[]) => CsvImportResult;
  upsertRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  duplicateRecipe: (id: string) => void;
  setPlan: (recipeId: string, patch: Partial<Plan>) => void;
  toggleAllPlans: (selected: boolean) => void;
  resetToDefaults: () => void;
  importBackup: (raw: unknown, language: Lang) => ImportOutcome<AppState>;
  importRecipesFile: (raw: unknown, language: Lang) => ImportOutcome<Recipe[]>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

const DEFAULT_PLAN: Plan = { mode: 'pieces', value: 0, unit: 'ml', selected: true };

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [defaults, setDefaults] = useState<{ recipes: Recipe[]; purchases: Purchase[] } | null>(null);
  const [state, setState] = useState<AppState | null>(null);
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    loadDefaults().then((d) => {
      if (cancelled) return;
      setDefaults(d);
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setState(raw ? normalizeState(JSON.parse(raw), d) : buildDefaultState(d));
      } catch {
        setState(buildDefaultState(d));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    const flush = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(flush, 400);

    // A page reload or tab close can happen before the debounce fires;
    // flush synchronously so the latest edits are never silently lost.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', flush);

    return () => {
      window.clearTimeout(saveTimer.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', flush);
    };
  }, [state]);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setState((prev) => (prev ? { ...prev, settings: { ...prev.settings, ...patch } } : prev));
  }, []);

  const upsertPurchase = useCallback((purchase: Purchase) => {
    setState((prev) => {
      if (!prev) return prev;
      const exists = prev.purchases.some((p) => p.id === purchase.id);
      let purchases = exists
        ? prev.purchases.map((p) => (p.id === purchase.id ? purchase : p))
        : [...prev.purchases, purchase];
      if (purchase.active) {
        purchases = purchases.map((p) =>
          p.id !== purchase.id && p.ingredient.trim().toLowerCase() === purchase.ingredient.trim().toLowerCase()
            ? { ...p, active: false }
            : p,
        );
      }
      return { ...prev, purchases };
    });
  }, []);

  const deletePurchase = useCallback((id: string) => {
    setState((prev) => (prev ? { ...prev, purchases: prev.purchases.filter((p) => p.id !== id) } : prev));
  }, []);

  const setPurchaseActive = useCallback((id: string, active: boolean) => {
    setState((prev) => {
      if (!prev) return prev;
      const target = prev.purchases.find((p) => p.id === id);
      if (!target) return prev;
      const purchases = prev.purchases.map((p) => {
        if (p.id === id) return { ...p, active };
        if (active && p.ingredient.trim().toLowerCase() === target.ingredient.trim().toLowerCase()) {
          return { ...p, active: false };
        }
        return p;
      });
      return { ...prev, purchases };
    });
  }, []);

  const importPurchasesCsv = useCallback((rows: Record<string, string>[]) => {
    const result = importPurchasesFromCsvRows(rows);
    setState((prev) => (prev ? { ...prev, purchases: [...prev.purchases, ...result.created] } : prev));
    return result;
  }, []);

  const upsertRecipe = useCallback((recipe: Recipe) => {
    setState((prev) => {
      if (!prev) return prev;
      const exists = prev.recipes.some((r) => r.id === recipe.id);
      const recipes = exists ? prev.recipes.map((r) => (r.id === recipe.id ? recipe : r)) : [...prev.recipes, recipe];
      return { ...prev, recipes };
    });
  }, []);

  const deleteRecipe = useCallback((id: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const plans = { ...prev.plans };
      delete plans[id];
      return { ...prev, recipes: prev.recipes.filter((r) => r.id !== id), plans };
    });
  }, []);

  const duplicateRecipe = useCallback((id: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const source = prev.recipes.find((r) => r.id === id);
      if (!source) return prev;
      const copy: Recipe = {
        ...structuredClone(source),
        id: uid(),
        name: `${source.name} – Kopie`,
        ingredients: source.ingredients.map((i) => ({ ...i, id: uid() })),
      };
      return { ...prev, recipes: [...prev.recipes, copy] };
    });
  }, []);

  const setPlan = useCallback((recipeId: string, patch: Partial<Plan>) => {
    setState((prev) => {
      if (!prev) return prev;
      const current = prev.plans[recipeId] || DEFAULT_PLAN;
      return { ...prev, plans: { ...prev.plans, [recipeId]: { ...current, ...patch } } };
    });
  }, []);

  const toggleAllPlans = useCallback((selected: boolean) => {
    setState((prev) => {
      if (!prev) return prev;
      const plans: Record<string, Plan> = { ...prev.plans };
      for (const r of prev.recipes) {
        plans[r.id] = { ...(plans[r.id] || DEFAULT_PLAN), selected };
      }
      return { ...prev, plans };
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    if (!defaults) return;
    setState(buildDefaultState(defaults));
  }, [defaults]);

  const importBackup = useCallback(
    (raw: unknown, language: Lang): ImportOutcome<AppState> => {
      if (!defaults) return { ok: false, warnings: [], error: 'Not ready yet.' };
      const result = parseBackupFile(raw, defaults, language);
      if (result.ok && result.data) setState(result.data);
      return result;
    },
    [defaults],
  );

  const importRecipesFile = useCallback((raw: unknown, language: Lang): ImportOutcome<Recipe[]> => {
    const result = parseRecipesFile(raw, language);
    if (result.ok && result.data) {
      const recipes = result.data;
      setState((prev) => (prev ? { ...prev, recipes } : prev));
    }
    return result;
  }, []);

  const computed = useMemo(() => (state ? compute(state) : null), [state]);

  const value = useMemo<AppStateContextValue | null>(() => {
    if (!state || !computed) return null;
    return {
      ready: true,
      state,
      computed,
      setSettings,
      upsertPurchase,
      deletePurchase,
      setPurchaseActive,
      importPurchasesCsv,
      upsertRecipe,
      deleteRecipe,
      duplicateRecipe,
      setPlan,
      toggleAllPlans,
      resetToDefaults,
      importBackup,
      importRecipesFile,
    };
  }, [
    state,
    computed,
    setSettings,
    upsertPurchase,
    deletePurchase,
    setPurchaseActive,
    importPurchasesCsv,
    upsertRecipe,
    deleteRecipe,
    duplicateRecipe,
    setPlan,
    toggleAllPlans,
    resetToDefaults,
    importBackup,
    importRecipesFile,
  ]);

  if (!value) {
    return (
      <div className="app-loading" aria-hidden="true">
        <span className="app-loading-spinner" />
      </div>
    );
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
