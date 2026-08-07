import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { toMl } from '../lib/calc';
import { uid } from '../lib/format';
import { useAppState } from '../state/AppStateContext';
import { useT } from '../i18n/useLang';
import type { Recipe, Unit } from '../lib/types';

export interface RecipeDialogHandle {
  open: (recipe?: Recipe) => void;
}

interface EditableIngredient {
  id: string;
  ingredient: string;
  amount: number;
  unit: Unit;
}

const emptyRecipe = (): Recipe => ({ id: '', name: '', description: '', preparation: '', salePrice: 0, ingredients: [] });

export const RecipeDialog = forwardRef<RecipeDialogHandle>(function RecipeDialog(_props, ref) {
  const { t } = useT();
  const { state, upsertRecipe } = useAppState();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [recipeId, setRecipeId] = useState('');
  const [name, setName] = useState('');
  const [salePrice, setSalePrice] = useState(0);
  const [description, setDescription] = useState('');
  const [preparation, setPreparation] = useState('');
  const [ingredients, setIngredients] = useState<EditableIngredient[]>([]);

  useImperativeHandle(ref, () => ({
    open(recipe) {
      const r = recipe || emptyRecipe();
      setRecipeId(r.id);
      setName(r.name);
      setSalePrice(r.salePrice);
      setDescription(r.description);
      setPreparation(r.preparation);
      setIngredients(r.ingredients.map((i) => ({ id: i.id, ingredient: i.ingredient, amount: i.ml, unit: 'ml' })));
      dialogRef.current?.showModal();
    },
  }));

  const ingredientNames = [...new Set(state.purchases.map((p) => p.ingredient))];

  const updateIngredient = (id: string, patch: Partial<EditableIngredient>) => {
    setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const addIngredient = () => {
    setIngredients((prev) => [...prev, { id: uid(), ingredient: '', amount: 0, unit: 'ml' }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const recipe: Recipe = {
      id: recipeId || uid(),
      name: trimmedName,
      description: description.trim(),
      preparation: preparation.trim(),
      salePrice: Number(salePrice) || 0,
      ingredients: ingredients
        .map((i) => ({ id: i.id, ingredient: i.ingredient.trim(), ml: toMl(i.amount, i.unit) }))
        .filter((i) => i.ingredient && i.ml > 0),
    };
    upsertRecipe(recipe);
    dialogRef.current?.close();
  };

  return (
    <dialog ref={dialogRef}>
      <form onSubmit={handleSubmit}>
        <div className="dialog-head">
          <h2>{t.dialog.recipeTitle}</h2>
          <button type="button" className="icon" onClick={() => dialogRef.current?.close()} aria-label={t.dialog.cancel}>
            ×
          </button>
        </div>
        <div className="form-grid two-col">
          <label>
            {t.dialog.recipeName}
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            {t.dialog.salePrice}
            <input type="number" min="0" step="0.01" value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value) || 0)} />
          </label>
          <label>
            {t.dialog.description}
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label>
            {t.dialog.preparation}
            <textarea rows={2} value={preparation} onChange={(e) => setPreparation(e.target.value)} />
          </label>
        </div>
        <div className="section-head compact">
          <h3>{t.dialog.ingredients}</h3>
          <button type="button" onClick={addIngredient}>
            {t.dialog.addIngredient}
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t.recipes.scalerColIngredient}</th>
                <th className="num">{t.dialog.amount}</th>
                <th>{t.dialog.unit}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((i) => (
                <tr key={i.id}>
                  <td>
                    <input
                      value={i.ingredient}
                      onChange={(e) => updateIngredient(i.id, { ingredient: e.target.value })}
                      list="recipe-ingredient-options"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={i.amount}
                      onChange={(e) => updateIngredient(i.id, { amount: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td>
                    <select value={i.unit} onChange={(e) => updateIngredient(i.id, { unit: e.target.value as Unit })}>
                      <option value="ml">ml</option>
                      <option value="cl">cl</option>
                      <option value="l">l</option>
                    </select>
                  </td>
                  <td>
                    <button type="button" className="danger" onClick={() => removeIngredient(i.id)}>
                      {t.common.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <datalist id="recipe-ingredient-options">
            {ingredientNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <div className="dialog-actions">
          <button type="button" onClick={() => dialogRef.current?.close()}>
            {t.dialog.cancel}
          </button>
          <button type="submit" className="primary">
            {t.dialog.save}
          </button>
        </div>
      </form>
    </dialog>
  );
});
