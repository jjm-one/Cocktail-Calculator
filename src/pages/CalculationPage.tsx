import { useMemo, useState } from 'react';
import { computeRecipeCalcRows } from '../lib/calc';
import { money, num } from '../lib/format';
import { useAppState } from '../state/AppStateContext';
import { useT } from '../i18n/useLang';
import { useSortFilter, type ColumnSpec } from '../hooks/useSortFilter';
import { SortableTh } from '../components/SortableTh';
import { FilterRow } from '../components/FilterRow';
import type { RecipeCalcOptions, RecipeCalcRow } from '../lib/types';

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

  const columns: ColumnSpec<RecipeCalcRow>[] = useMemo(
    () => [
      { key: 'cocktail', sortValue: (r) => r.recipe.name, filterValue: (r) => r.recipe.name },
      { key: 'servings', sortValue: (r) => r.servings, filterValue: (r) => num(r.servings, lang, 2) },
      { key: 'ek', sortValue: (r) => r.ek, filterValue: (r) => money(r.ek, lang, currency) },
      { key: 'sale', sortValue: (r) => r.sale, filterValue: (r) => money(r.sale, lang, currency) },
      {
        key: 'margin',
        sortValue: (r) => r.margin,
        filterValue: (r) => `${money(r.margin, lang, currency)} ${num(r.marginPct, lang, 1)}`,
      },
      { key: 'foodCost', sortValue: (r) => r.foodCostPct, filterValue: (r) => num(r.foodCostPct, lang, 1) },
      { key: 'markup', sortValue: (r) => r.markupFactor, filterValue: (r) => num(r.markupFactor, lang, 2) },
      {
        key: 'contribution',
        sortValue: (r) => r.totalContribution,
        filterValue: (r) => money(r.totalContribution, lang, currency),
      },
      {
        key: 'revenue',
        sortValue: (r) => r.revenueWithYield,
        filterValue: (r) => money(r.revenueWithYield, lang, currency),
      },
    ],
    [lang, currency],
  );
  const { rows: visibleRows, sort, toggleSort, filters, setFilter } = useSortFilter(rows, columns);

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
              <SortableTh label={t.calculation.thCocktail} sortKey="cocktail" sort={sort} onSort={toggleSort} />
              <SortableTh label={t.calculation.thServings} sortKey="servings" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh label={t.calculation.thEkNoLoss} sortKey="ek" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh label={t.calculation.thSale} sortKey="sale" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh label={t.calculation.thMargin} sortKey="margin" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh label={t.calculation.thFoodCost} sortKey="foodCost" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh label={t.calculation.thMarkup} sortKey="markup" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh label={t.calculation.thContribution} sortKey="contribution" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh label={t.calculation.thRevenue} sortKey="revenue" sort={sort} onSort={toggleSort} className="num" />
            </tr>
            <FilterRow
              filters={filters}
              onChange={setFilter}
              cells={[
                { key: 'cocktail', label: t.calculation.thCocktail },
                { key: 'servings', label: t.calculation.thServings, className: 'num' },
                { key: 'ek', label: t.calculation.thEkNoLoss, className: 'num' },
                { key: 'sale', label: t.calculation.thSale, className: 'num' },
                { key: 'margin', label: t.calculation.thMargin, className: 'num' },
                { key: 'foodCost', label: t.calculation.thFoodCost, className: 'num' },
                { key: 'markup', label: t.calculation.thMarkup, className: 'num' },
                { key: 'contribution', label: t.calculation.thContribution, className: 'num' },
                { key: 'revenue', label: t.calculation.thRevenue, className: 'num' },
              ]}
            />
          </thead>
          <tbody>
            {visibleRows.map((row) => (
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
