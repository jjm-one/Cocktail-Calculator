import { useMemo, useRef, useState } from 'react';
import { recipeBaseMl } from '../lib/calc';
import { formatScaledAmount, money, num } from '../lib/format';
import { exportScaledRecipeCsv, exportScaledRecipePdf, scaledRecipeData } from '../lib/exporters';
import { useAppState } from '../state/AppStateContext';
import { useT } from '../i18n/useLang';
import { RecipeDialog, type RecipeDialogHandle } from '../components/RecipeDialog';
import { useToast } from '../components/Toast';
import type { Unit } from '../lib/types';

export default function RecipesPage() {
  const { lang, t } = useT();
  const { state, deleteRecipe, duplicateRecipe } = useAppState();
  const { showToast } = useToast();
  const dialogRef = useRef<RecipeDialogHandle>(null);
  const currency = state.settings.currency;

  const [scaleRecipeId, setScaleRecipeId] = useState('');
  const [scaleAmount, setScaleAmount] = useState(5);
  const [scaleUnit, setScaleUnit] = useState<Unit>('l');
  const [search, setSearch] = useState('');

  const activeRecipe = state.recipes.find((r) => r.id === scaleRecipeId) || state.recipes[0];
  const data = useMemo(() => scaledRecipeData(activeRecipe, scaleAmount, scaleUnit), [activeRecipe, scaleAmount, scaleUnit]);

  const filteredRecipes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return state.recipes;
    return state.recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.ingredients.some((i) => i.ingredient.toLowerCase().includes(query)),
    );
  }, [state.recipes, search]);

  const handleDeleteRecipe = (id: string) => {
    if (confirm(t.common.deleteRecipeConfirm)) deleteRecipe(id);
  };

  const handleExportCsv = () => {
    if (!data.recipe || data.targetMl <= 0) return showToast(t.recipes.scalerSelectFirst);
    exportScaledRecipeCsv(data, lang);
  };

  const handleExportPdf = () => {
    if (!data.recipe || data.targetMl <= 0) return showToast(t.recipes.scalerSelectFirst);
    void exportScaledRecipePdf(data, lang);
  };

  return (
    <section>
      <div className="section-head">
        <div>
          <h1>{t.recipes.title}</h1>
          <p>{t.recipes.body}</p>
        </div>
        <button type="button" className="primary" onClick={() => dialogRef.current?.open()}>
          {t.recipes.add}
        </button>
      </div>

      <article className="card recipe-scaler">
        <div className="section-head compact">
          <div>
            <h3>{t.recipes.scalerTitle}</h3>
            <p>{t.recipes.scalerBody}</p>
          </div>
        </div>
        <div className="scale-controls">
          <label>
            {t.recipes.scalerRecipe}
            <select value={activeRecipe?.id || ''} onChange={(e) => setScaleRecipeId(e.target.value)}>
              {state.recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.recipes.scalerTarget}
            <div className="inline">
              <input type="number" min="1" step="0.1" value={scaleAmount} onChange={(e) => setScaleAmount(Number(e.target.value) || 0)} />
              <select value={scaleUnit} onChange={(e) => setScaleUnit(e.target.value as Unit)}>
                <option value="ml">ml</option>
                <option value="cl">cl</option>
                <option value="l">l</option>
              </select>
            </div>
          </label>
        </div>

        {!data.recipe ? (
          <div className="scale-summary">{t.recipes.scalerNoRecipes}</div>
        ) : (
          <div className="scale-summary">
            {t.recipes.scalerSummary(data.recipe.name, num(data.baseMl, lang, 1), num(data.targetMl / 1000, lang, 3), num(data.factor, lang, 3))}
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.recipes.scalerColIngredient}</th>
                <th className="num">{t.recipes.scalerColBase}</th>
                <th className="num">{t.recipes.scalerColScaled}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.ingredient}>
                  <td>{row.ingredient}</td>
                  <td className="num">{num(row.baseMl, lang, 1)} ml</td>
                  <td className="num">{formatScaledAmount(row.scaledMl, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="button-row">
          <button type="button" className="primary" onClick={handleExportPdf}>
            {t.recipes.scalerPdf}
          </button>
          <button type="button" onClick={handleExportCsv}>
            {t.recipes.scalerCsv}
          </button>
        </div>
      </article>

      <div className="search-bar">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.recipes.searchPlaceholder}
          aria-label={t.recipes.searchPlaceholder}
        />
        {search && <span className="search-count">{t.recipes.searchCount(filteredRecipes.length, state.recipes.length)}</span>}
      </div>

      {filteredRecipes.length === 0 && <p className="muted">{t.recipes.searchEmpty}</p>}

      <div className="recipe-list">
        {filteredRecipes.map((r) => (
          <article className="recipe-card" key={r.id}>
            <div className="recipe-meta">
              <span className="pill">
                {num(recipeBaseMl(r), lang, 1)} {t.recipes.mlBase}
              </span>
              <strong>{money(r.salePrice, lang, currency)}</strong>
            </div>
            <h3>{r.name}</h3>
            <p>{r.description}</p>
            <ul>
              {r.ingredients.map((i) => (
                <li key={i.id}>
                  {i.ingredient}: {num(i.ml, lang, 1)} ml
                </li>
              ))}
            </ul>
            <div className="recipe-actions">
              <button type="button" onClick={() => dialogRef.current?.open(r)}>
                {t.common.edit}
              </button>
              <button type="button" onClick={() => duplicateRecipe(r.id)}>
                {t.common.duplicate}
              </button>
              <button type="button" className="danger" onClick={() => handleDeleteRecipe(r.id)}>
                {t.common.delete}
              </button>
            </div>
          </article>
        ))}
      </div>

      <RecipeDialog ref={dialogRef} />
    </section>
  );
}
