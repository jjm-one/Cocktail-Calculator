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

function TipLabel({ label, tip }: { label: string; tip?: string }) {
  return (
    <>
      {label}{' '}
      {tip && (
        <span className="tooltip" data-tip={tip}>
          ?
        </span>
      )}
    </>
  );
}

function Metric({ label, tip, value }: { label: string; tip?: string; value: string }) {
  return (
    <div className="metric">
      <span>
        <TipLabel label={label} tip={tip} />
      </span>
      <strong>{value}</strong>
    </div>
  );
}

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
      {
        key: 'ekAtSoldShare',
        sortValue: (r) => r.ekAtSoldShare,
        filterValue: (r) => money(r.ekAtSoldShare, lang, currency),
      },
      { key: 'sale', sortValue: (r) => r.sale, filterValue: (r) => money(r.sale, lang, currency) },
      {
        key: 'margin',
        sortValue: (r) => r.margin,
        filterValue: (r) => `${money(r.margin, lang, currency)} ${num(r.marginPct, lang, 1)}`,
      },
      {
        key: 'marginAtSoldShare',
        sortValue: (r) => r.marginAtSoldShare,
        filterValue: (r) => `${money(r.marginAtSoldShare, lang, currency)} ${num(r.marginPctAtSoldShare, lang, 1)}`,
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

  const comparisonRows: [string, string, string, string][] = [
    [
      t.calculation.cmpRevenue,
      t.calculation.cmpRevenueTip,
      money(computed.totalRevenue, lang, currency),
      money(computed.totalRevenueAtSold, lang, currency),
    ],
    [
      t.calculation.cmpCost,
      t.calculation.cmpCostTip,
      money(computed.totalOrderGross, lang, currency),
      money(computed.commissionCostAtSold, lang, currency),
    ],
    [
      t.calculation.cmpResult,
      t.calculation.cmpResultTip,
      money(computed.profit, lang, currency),
      money(computed.profitAtSold, lang, currency),
    ],
    [
      t.calculation.cmpFoodCost,
      t.calculation.cmpFoodCostTip,
      `${num(computed.overallFoodCostPct, lang, 1)} %`,
      `${num(computed.foodCostPctAtSold, lang, 1)} %`,
    ],
    [
      t.calculation.cmpGrossMargin,
      t.calculation.cmpGrossMarginTip,
      `${num(computed.grossMarginPct, lang, 1)} %`,
      `${num(computed.grossMarginPctAtSold, lang, 1)} %`,
    ],
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
              <SortableTh
                label={t.calculation.thEkAtSoldShare}
                tooltip={t.calculation.thEkAtSoldShareTip}
                sortKey="ekAtSoldShare"
                sort={sort}
                onSort={toggleSort}
                className="num"
              />
              <SortableTh label={t.calculation.thSale} sortKey="sale" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh label={t.calculation.thMargin} sortKey="margin" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh
                label={t.calculation.thMarginAtSoldShare}
                tooltip={t.calculation.thMarginAtSoldShareTip}
                sortKey="marginAtSoldShare"
                sort={sort}
                onSort={toggleSort}
                className="num"
              />
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
                { key: 'ekAtSoldShare', label: t.calculation.thEkAtSoldShare, className: 'num' },
                { key: 'sale', label: t.calculation.thSale, className: 'num' },
                { key: 'margin', label: t.calculation.thMargin, className: 'num' },
                { key: 'marginAtSoldShare', label: t.calculation.thMarginAtSoldShare, className: 'num' },
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
                <td>
                  {row.recipe.name}
                  {row.recipe.alcoholFree && <span className="tag-af">{t.recipes.alcoholFree}</span>}
                </td>
                <td className="num">{num(row.servings, lang, 2)}</td>
                <td className="num">{money(row.ek, lang, currency)}</td>
                <td className="num">{money(row.ekAtSoldShare, lang, currency)}</td>
                <td className="num">{money(row.sale, lang, currency)}</td>
                <td className="num">
                  {money(row.margin, lang, currency)} ({num(row.marginPct, lang, 1)} %)
                </td>
                <td className="num">
                  {money(row.marginAtSoldShare, lang, currency)} ({num(row.marginPctAtSoldShare, lang, 1)} %)
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

        <h4>{t.calculation.sectionOrderCosts}</h4>
        <div className="metric-grid">
          <Metric label={t.calculation.grossOrderCost} tip={t.calculation.grossOrderCostTip} value={money(computed.totalOrderGross, lang, currency)} />
          <Metric label={t.calculation.includedTax} tip={t.calculation.includedTaxTip} value={money(computed.taxAmount, lang, currency)} />
          <Metric
            label={t.calculation.orderCostNoStock}
            tip={t.calculation.orderCostNoStockTip}
            value={money(computed.totalOrderGrossNoStock, lang, currency)}
          />
          <Metric
            label={t.calculation.stockSavings}
            tip={t.calculation.stockSavingsTip}
            value={`${money(computed.stockSavings, lang, currency)} (${num(computed.stockCoveragePct, lang, 1)} %)`}
          />
          <Metric
            label={t.calculation.packageSurplus}
            tip={t.calculation.packageSurplusTip}
            value={`${money(computed.totalSurplusValue, lang, currency)} · ${num(computed.totalSurplusMl / 1000, lang, 2)} l`}
          />
        </div>

        <h4>{t.calculation.sectionAverages}</h4>
        <div className="metric-grid">
          <Metric
            label={t.calculation.avgRevenuePerDrink}
            tip={t.calculation.avgRevenuePerDrinkTip}
            value={money(computed.averageRevenuePerDrink, lang, currency)}
          />
          <Metric
            label={t.calculation.orderCostPerDrink}
            tip={t.calculation.orderCostPerDrinkTip}
            value={money(computed.averageOrderCostPerDrink, lang, currency)}
          />
        </div>

        <h4>{t.calculation.sectionComparison}</h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th className="num">{t.calculation.comparisonAt100}</th>
                <th className="num">
                  {t.calculation.comparisonAtSoldShare} ({num(state.settings.soldPct, lang, 0)} %)
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([label, tip, at100, atSold]) => (
                <tr key={label}>
                  <td>
                    <TipLabel label={label} tip={tip} />
                  </td>
                  <td className="num">{at100}</td>
                  <td className="num">{atSold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4>{t.calculation.sectionLeftover}</h4>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th className="num">
                  <TipLabel label={t.calculation.leftoverColCommission} tip={t.calculation.leftoverColCommissionTip} />
                </th>
                <th className="num">
                  <TipLabel label={t.calculation.leftoverColNoCommission} tip={t.calculation.leftoverColNoCommissionTip} />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <TipLabel label={t.calculation.leftoverMl} tip={t.calculation.leftoverMlTip} />
                </td>
                <td className="num">{num(computed.totalLeftoverMlCommission / 1000, lang, 2)} l</td>
                <td className="num">{num(computed.totalLeftoverMlNoCommission / 1000, lang, 2)} l</td>
              </tr>
              <tr>
                <td>
                  <TipLabel label={t.calculation.leftoverValue} tip={t.calculation.leftoverValueTip} />
                </td>
                <td className="num">{money(computed.totalLeftoverValueCommission, lang, currency)}</td>
                <td className="num">{money(computed.totalLeftoverValueNoCommission, lang, currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4>{t.calculation.sectionBreakEven}</h4>
        <div className="metric-grid">
          <Metric
            label={t.calculation.returnOnFoodCost}
            tip={t.calculation.returnOnFoodCostTip}
            value={`${num(computed.returnOnCostPct, lang, 1)} %`}
          />
          <Metric label={t.calculation.breakEvenNoCommission} tip={t.calculation.breakEvenNoCommissionTip} value={be(computed.beNoCommission)} />
          <Metric label={t.calculation.breakEvenCommission} tip={t.calculation.breakEvenCommissionTip} value={be(computed.beCommission)} />
        </div>
      </article>
    </section>
  );
}
