import { useMemo, useState } from 'react';
import { computeRecipeCalcRows } from '../lib/calc';
import { money, num } from '../lib/format';
import { useAppState } from '../state/AppStateContext';
import { useT } from '../i18n/useLang';
import type { RecipeCalcOptions } from '../lib/types';

const DEFAULT_CALC_OPTIONS: RecipeCalcOptions = {
  includeStock: false,
  includeLoss: false,
  includeBuffer: false,
  includeCommission: false,
};

export default function CalculationPage() {
  const { lang, t } = useT();
  const { state, computed } = useAppState();
  const currency = state.settings.currency;
  const be = (v: number | null) => (v === null ? t.calculation.unreachable : `${num(v, lang, 1)} %`);
  const [calcOptions, setCalcOptions] = useState<RecipeCalcOptions>(DEFAULT_CALC_OPTIONS);
  const rows = useMemo(() => computeRecipeCalcRows(state, calcOptions), [state, calcOptions]);
  const toggle = (key: keyof RecipeCalcOptions) => setCalcOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  const overallRows: [string, string][] = [
    [t.calculation.grossOrderCost, money(computed.totalOrderGross, lang, currency)],
    [t.calculation.includedTax, money(computed.taxAmount, lang, currency)],
    [t.calculation.revenueAt100, money(computed.totalRevenue, lang, currency)],
    [t.calculation.avgRevenuePerDrink, money(computed.averageRevenuePerDrink, lang, currency)],
    [t.calculation.orderCostPerDrink, money(computed.averageOrderCostPerDrink, lang, currency)],
    [t.calculation.foodCostRatioTotal, `${num(computed.overallFoodCostPct, lang, 1)} %`],
    [t.calculation.returnOnFoodCost, `${num(computed.returnOnCostPct, lang, 1)} %`],
    [t.calculation.packageSurplus, `${money(computed.totalSurplusValue, lang, currency)} · ${num(computed.totalSurplusMl / 1000, lang, 2)} l`],
    [t.calculation.revenueAtSoldShare, money(computed.totalRevenueAtSold, lang, currency)],
    [t.calculation.costAtSoldSharePlusCommission, money(computed.commissionCostAtSold, lang, currency)],
    [t.calculation.resultAtSoldShare, money(computed.profitAtSold, lang, currency)],
    [t.calculation.breakEvenNoCommission, be(computed.beNoCommission)],
    [t.calculation.breakEvenCommission, be(computed.beCommission)],
  ];

  return (
    <section>
      <div className="section-head">
        <div>
          <h1>{t.calculation.title}</h1>
          <p>{t.calculation.body}</p>
        </div>
      </div>

      <article className="card">
        <h3>{t.calculation.optionsTitle}</h3>
        <div className="form-grid form-grid-inline">
          <label className="checkbox">
            <input type="checkbox" checked={calcOptions.includeStock} onChange={() => toggle('includeStock')} />{' '}
            {t.calculation.optionStock} <span className="tooltip" data-tip={t.calculation.optionStockTip}>?</span>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={calcOptions.includeLoss} onChange={() => toggle('includeLoss')} />{' '}
            {t.calculation.optionLoss} <span className="tooltip" data-tip={t.calculation.optionLossTip}>?</span>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={calcOptions.includeBuffer} onChange={() => toggle('includeBuffer')} />{' '}
            {t.calculation.optionBuffer} <span className="tooltip" data-tip={t.calculation.optionBufferTip}>?</span>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={calcOptions.includeCommission} onChange={() => toggle('includeCommission')} />{' '}
            {t.calculation.optionCommission} <span className="tooltip" data-tip={t.calculation.optionCommissionTip}>?</span>
          </label>
        </div>
      </article>

      <div className="table-wrap is-wide top-gap">
        <table>
          <thead>
            <tr>
              <th>{t.calculation.thCocktail}</th>
              <th className="num">{t.calculation.thServings}</th>
              <th className="num">{t.calculation.thEkNoLoss}</th>
              <th className="num">{t.calculation.thSale}</th>
              <th className="num">{t.calculation.thMargin}</th>
              <th className="num">{t.calculation.thFoodCost}</th>
              <th className="num">{t.calculation.thMarkup}</th>
              <th className="num">{t.calculation.thContribution}</th>
              <th className="num">{t.calculation.thRevenue}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.recipe.id}>
                <td>{row.recipe.name}</td>
                <td className="num">{num(row.servings, lang, 2)}</td>
                <td className="num">{money(row.ek, lang, currency)}</td>
                <td className="num">{money(row.sale, lang, currency)}</td>
                <td className="num">
                  {money(row.margin, lang, currency)} ({num(row.marginPct, lang, 1)} %)
                </td>
                <td className="num">{num(row.foodCostPct, lang, 1)} %</td>
                <td className="num">{num(row.markupFactor, lang, 2)}×</td>
                <td className="num">{money(row.totalContribution, lang, currency)}</td>
                <td className="num">{money(row.revenueWithYield, lang, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <article className="card top-gap">
        <h3>{t.calculation.overall}</h3>
        <div className="metric-grid">
          {overallRows.map(([label, value]) => (
            <div className="metric" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
