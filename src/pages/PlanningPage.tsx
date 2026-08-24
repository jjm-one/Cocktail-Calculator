import { useMemo } from 'react';
import { planLiquidMl, planToServings } from '../lib/calc';
import { money, num } from '../lib/format';
import { copyShoppingListToClipboard } from '../lib/exporters';
import { useAppState } from '../state/AppStateContext';
import { useT } from '../i18n/useLang';
import { MissingItemsBanner } from '../components/MissingItemsBanner';
import { useToast } from '../components/Toast';
import { useSortFilter, type ColumnSpec } from '../hooks/useSortFilter';
import { SortableTh } from '../components/SortableTh';
import { FilterRow } from '../components/FilterRow';
import type { OrderRow, Plan, Recipe, Unit } from '../lib/types';

const DEFAULT_PLAN: Plan = { mode: 'pieces', value: 0, unit: 'ml', selected: true };

interface PlanRow {
  recipe: Recipe;
  plan: Plan;
}

export default function PlanningPage() {
  const { lang, t } = useT();
  const { state, computed, setPlan, toggleAllPlans } = useAppState();
  const { showToast } = useToast();
  const currency = state.settings.currency;
  const defaultServingMl = state.settings.defaultServingMl;

  const handleCopyShoppingList = async () => {
    try {
      await copyShoppingListToClipboard(computed, lang);
      showToast(t.planning.copyListSuccess);
    } catch {
      showToast(t.planning.copyListFailed);
    }
  };

  const selectedCount = state.recipes.filter((r) => (state.plans[r.id]?.selected ?? true) !== false).length;
  const allSelected = selectedCount === state.recipes.length && state.recipes.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < state.recipes.length;

  const planRows: PlanRow[] = useMemo(
    () => state.recipes.map((recipe) => ({ recipe, plan: state.plans[recipe.id] || DEFAULT_PLAN })),
    [state.recipes, state.plans],
  );
  const planColumns: ColumnSpec<PlanRow>[] = useMemo(
    () => [
      { key: 'cocktail', sortValue: (row) => row.recipe.name, filterValue: (row) => row.recipe.name },
      {
        key: 'mode',
        sortValue: (row) => row.plan.mode,
        filterValue: (row) => (row.plan.mode === 'pieces' ? t.planning.modePieces : t.planning.modeVolume),
      },
      { key: 'amount', sortValue: (row) => Number(row.plan.value) || 0, filterValue: (row) => num(row.plan.value, lang, 2) },
      { key: 'unit', sortValue: (row) => row.plan.unit, filterValue: (row) => row.plan.unit },
      {
        key: 'servings',
        sortValue: (row) => planToServings(defaultServingMl, row.plan),
        filterValue: (row) => num(planToServings(defaultServingMl, row.plan), lang, 2),
      },
      {
        key: 'liquid',
        sortValue: (row) => planLiquidMl(defaultServingMl, row.plan),
        filterValue: (row) => num(planLiquidMl(defaultServingMl, row.plan) / 1000, lang, 2),
      },
    ],
    [lang, defaultServingMl, t],
  );
  const {
    rows: visiblePlanRows,
    sort: planSort,
    toggleSort: togglePlanSort,
    filters: planFilters,
    setFilter: setPlanFilter,
  } = useSortFilter(planRows, planColumns);

  const orderColumns: ColumnSpec<OrderRow>[] = useMemo(
    () => [
      { key: 'ingredient', sortValue: (r) => r.ingredient, filterValue: (r) => r.ingredient },
      {
        key: 'product',
        sortValue: (r) => r.purchase?.product || '',
        filterValue: (r) => (r.purchase ? r.purchase.product : t.order.missing),
      },
      { key: 'required', sortValue: (r) => r.requiredMl, filterValue: (r) => num(r.requiredMl / 1000, lang, 3) },
      { key: 'stock', sortValue: (r) => r.stockMl, filterValue: (r) => (r.stockMl > 0 ? num(r.stockMl / 1000, lang, 2) : '') },
      { key: 'bottles', sortValue: (r) => r.bottles, filterValue: (r) => String(r.bottles) },
      { key: 'cases', sortValue: (r) => r.cases, filterValue: (r) => (r.cases ? String(r.cases) : '') },
      { key: 'charged', sortValue: (r) => r.chargedBottles, filterValue: (r) => String(r.chargedBottles || 0) },
      { key: 'cost', sortValue: (r) => r.orderCostGross, filterValue: (r) => money(r.orderCostGross, lang, currency) },
    ],
    [lang, currency, t],
  );
  const {
    rows: visibleOrderRows,
    sort: orderSort,
    toggleSort: toggleOrderSort,
    filters: orderFilters,
    setFilter: setOrderFilter,
  } = useSortFilter(computed.orderRows, orderColumns);

  return (
    <section>
      <div className="section-head">
        <div>
          <h1>{t.planning.title}</h1>
          <p>{t.planning.body}</p>
        </div>
      </div>

      <MissingItemsBanner />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={(e) => toggleAllPlans(e.target.checked)}
                  aria-label={t.planning.selectAll}
                />
              </th>
              <SortableTh label={t.planning.thCocktail} sortKey="cocktail" sort={planSort} onSort={togglePlanSort} />
              <SortableTh label={t.planning.thMode} sortKey="mode" sort={planSort} onSort={togglePlanSort} />
              <SortableTh label={t.planning.thAmount} sortKey="amount" sort={planSort} onSort={togglePlanSort} className="num" />
              <SortableTh label={t.planning.thUnit} sortKey="unit" sort={planSort} onSort={togglePlanSort} />
              <SortableTh label={t.planning.thServings} sortKey="servings" sort={planSort} onSort={togglePlanSort} className="num" />
              <SortableTh label={t.planning.thLiquid} sortKey="liquid" sort={planSort} onSort={togglePlanSort} className="num" />
            </tr>
            <FilterRow
              filters={planFilters}
              onChange={setPlanFilter}
              cells={[
                {},
                { key: 'cocktail', label: t.planning.thCocktail },
                { key: 'mode', label: t.planning.thMode },
                { key: 'amount', label: t.planning.thAmount, className: 'num' },
                { key: 'unit', label: t.planning.thUnit },
                { key: 'servings', label: t.planning.thServings, className: 'num' },
                { key: 'liquid', label: t.planning.thLiquid, className: 'num' },
              ]}
            />
          </thead>
          <tbody>
            {visiblePlanRows.map(({ recipe: r, plan }) => {
              const selected = plan.selected !== false;
              return (
                <tr key={r.id} className={selected ? '' : 'muted-row'}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => setPlan(r.id, { selected: e.target.checked })}
                      aria-label={r.name}
                    />
                  </td>
                  <td>
                    {r.name}
                    {r.alcoholFree && <span className="tag-af">{t.recipes.alcoholFree}</span>}
                  </td>
                  <td>
                    <select
                      disabled={!selected}
                      value={plan.mode}
                      onChange={(e) => setPlan(r.id, { mode: e.target.value as Plan['mode'] })}
                    >
                      <option value="pieces">{t.planning.modePieces}</option>
                      <option value="volume">{t.planning.modeVolume}</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      disabled={!selected}
                      value={plan.value}
                      onChange={(e) => setPlan(r.id, { value: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td>
                    <select
                      disabled={!selected || plan.mode === 'pieces'}
                      value={plan.unit}
                      onChange={(e) => setPlan(r.id, { unit: e.target.value as Unit })}
                    >
                      <option value="ml">ml</option>
                      <option value="cl">cl</option>
                      <option value="l">l</option>
                    </select>
                  </td>
                  <td className="num">{num(planToServings(defaultServingMl, plan), lang, 2)}</td>
                  <td className="num">{num(planLiquidMl(defaultServingMl, plan) / 1000, lang, 2)} l</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <article className="card top-gap">
        <div className="section-head compact">
          <h3>{t.planning.orderResult}</h3>
          <button type="button" onClick={() => void handleCopyShoppingList()}>
            {t.planning.copyList}
          </button>
        </div>
        <div className="table-wrap is-wide">
          <table>
            <thead>
              <tr>
                <SortableTh label={t.order.thIngredient} sortKey="ingredient" sort={orderSort} onSort={toggleOrderSort} />
                <SortableTh label={t.order.thProduct} sortKey="product" sort={orderSort} onSort={toggleOrderSort} />
                <SortableTh label={t.order.thRequired} sortKey="required" sort={orderSort} onSort={toggleOrderSort} className="num" />
                <SortableTh label={t.order.thStock} sortKey="stock" sort={orderSort} onSort={toggleOrderSort} className="num" />
                <SortableTh label={t.order.thBottles} sortKey="bottles" sort={orderSort} onSort={toggleOrderSort} className="num" />
                <SortableTh label={t.order.thCases} sortKey="cases" sort={orderSort} onSort={toggleOrderSort} className="num" />
                <SortableTh label={t.order.thCharged} sortKey="charged" sort={orderSort} onSort={toggleOrderSort} className="num" />
                <SortableTh label={t.order.thCost} sortKey="cost" sort={orderSort} onSort={toggleOrderSort} className="num" />
              </tr>
              <FilterRow
                filters={orderFilters}
                onChange={setOrderFilter}
                cells={[
                  { key: 'ingredient', label: t.order.thIngredient },
                  { key: 'product', label: t.order.thProduct },
                  { key: 'required', label: t.order.thRequired, className: 'num' },
                  { key: 'stock', label: t.order.thStock, className: 'num' },
                  { key: 'bottles', label: t.order.thBottles, className: 'num' },
                  { key: 'cases', label: t.order.thCases, className: 'num' },
                  { key: 'charged', label: t.order.thCharged, className: 'num' },
                  { key: 'cost', label: t.order.thCost, className: 'num' },
                ]}
              />
            </thead>
            <tbody>
              {visibleOrderRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted">
                    {t.order.empty}
                  </td>
                </tr>
              )}
              {visibleOrderRows.map((row) => (
                <tr key={row.ingredient}>
                  <td>{row.ingredient}</td>
                  <td>{row.purchase ? row.purchase.product : <strong>{t.order.missing}</strong>}</td>
                  <td className="num">{num(row.requiredMl / 1000, lang, 3)} l</td>
                  <td className="num">{row.stockMl > 0 ? num(row.stockMl / 1000, lang, 2) + ' l' : '–'}</td>
                  <td className="num">{row.bottles}</td>
                  <td className="num">{row.cases || '–'}</td>
                  <td className="num">
                    {row.chargedBottles || 0} {t.order.chargedSuffix}
                  </td>
                  <td className="num">{money(row.orderCostGross, lang, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
