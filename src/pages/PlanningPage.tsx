import { planLiquidMl, planToServings } from '../lib/calc';
import { money, num } from '../lib/format';
import { copyShoppingListToClipboard } from '../lib/exporters';
import { useAppState } from '../state/AppStateContext';
import { useT } from '../i18n/useLang';
import { MissingItemsBanner } from '../components/MissingItemsBanner';
import { useToast } from '../components/Toast';
import type { Plan, Unit } from '../lib/types';

const DEFAULT_PLAN: Plan = { mode: 'pieces', value: 0, unit: 'ml', selected: true };

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
              <th>{t.planning.thCocktail}</th>
              <th>{t.planning.thMode}</th>
              <th className="num">{t.planning.thAmount}</th>
              <th>{t.planning.thUnit}</th>
              <th className="num">{t.planning.thServings}</th>
              <th className="num">{t.planning.thLiquid}</th>
            </tr>
          </thead>
          <tbody>
            {state.recipes.map((r) => {
              const plan = state.plans[r.id] || DEFAULT_PLAN;
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
                  <td>{r.name}</td>
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
                <th>{t.order.thIngredient}</th>
                <th>{t.order.thProduct}</th>
                <th className="num">{t.order.thRequired}</th>
                <th className="num">{t.order.thStock}</th>
                <th className="num">{t.order.thBottles}</th>
                <th className="num">{t.order.thCases}</th>
                <th className="num">{t.order.thCharged}</th>
                <th className="num">{t.order.thCost}</th>
              </tr>
            </thead>
            <tbody>
              {computed.orderRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted">
                    {t.order.empty}
                  </td>
                </tr>
              )}
              {computed.orderRows.map((row) => (
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
