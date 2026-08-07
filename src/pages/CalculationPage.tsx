import { money, num } from '../lib/format';
import { useAppState } from '../state/AppStateContext';
import { useT } from '../i18n/useLang';

export default function CalculationPage() {
  const { lang, t } = useT();
  const { state, computed } = useAppState();
  const currency = state.settings.currency;
  const be = (v: number | null) => (v === null ? t.calculation.unreachable : `${num(v, lang, 1)} %`);

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

      <div className="table-wrap is-wide">
        <table>
          <thead>
            <tr>
              <th>{t.calculation.thCocktail}</th>
              <th className="num">{t.calculation.thServings}</th>
              <th className="num">{t.calculation.thEkNoLoss}</th>
              <th className="num">{t.calculation.thEkWithLoss}</th>
              <th className="num">{t.calculation.thSale}</th>
              <th className="num">{t.calculation.thMargin}</th>
              <th className="num">{t.calculation.thFoodCost}</th>
              <th className="num">{t.calculation.thMarkup}</th>
              <th className="num">{t.calculation.thContribution}</th>
              <th className="num">{t.calculation.thRevenue}</th>
            </tr>
          </thead>
          <tbody>
            {computed.recipeRows.map((row) => (
              <tr key={row.recipe.id}>
                <td>{row.recipe.name}</td>
                <td className="num">{num(row.servings, lang, 2)}</td>
                <td className="num">{money(row.ekNoLoss, lang, currency)}</td>
                <td className="num">{money(row.ekWithLoss, lang, currency)}</td>
                <td className="num">{money(row.sale, lang, currency)}</td>
                <td className="num">
                  {money(row.marginWithLoss, lang, currency)} ({num(row.marginPct, lang, 1)} %)
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
