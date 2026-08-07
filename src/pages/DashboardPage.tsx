import { useT } from '../i18n/useLang';
import { money, num } from '../lib/format';
import { useAppState } from '../state/AppStateContext';
import { MissingItemsBanner } from '../components/MissingItemsBanner';

export default function DashboardPage() {
  const { lang, t } = useT();
  const { state, computed } = useAppState();
  const currency = state.settings.currency;
  const be = (v: number | null) => (v === null ? t.dashboard.unreachable : `${num(v, lang, 1)} %`);

  const cards: [string, string][] = [
    [t.dashboard.plannedDrinks, num(computed.totalServings, lang, 1)],
    [t.dashboard.orderCost, money(computed.totalOrderGross, lang, currency)],
    [t.dashboard.plannedRevenue, money(computed.totalRevenue, lang, currency)],
    [t.dashboard.plannedResult, money(computed.profit, lang, currency)],
    [t.dashboard.foodCostRatio, `${num(computed.overallFoodCostPct, lang, 1)} %`],
    [t.dashboard.returnOnCost, `${num(computed.returnOnCostPct, lang, 1)} %`],
  ];

  return (
    <section>
      <div className="section-head">
        <div>
          <h1>{t.dashboard.title}</h1>
          <p>{t.dashboard.subtitle}</p>
        </div>
      </div>

      <MissingItemsBanner />

      <div className="cards">
        {cards.map(([label, value]) => (
          <article className="card metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="grid two">
        <article className="card">
          <h2>{t.dashboard.orderOverview}</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.order.thIngredient}</th>
                  <th>{t.order.thProduct}</th>
                  <th className="num">{t.order.thRequired}</th>
                  <th className="num">{t.order.thBottles}</th>
                  <th className="num">{t.order.thCost}</th>
                </tr>
              </thead>
              <tbody>
                {computed.orderRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted">
                      {t.order.empty}
                    </td>
                  </tr>
                )}
                {computed.orderRows.map((row) => (
                  <tr key={row.ingredient}>
                    <td>{row.ingredient}</td>
                    <td>{row.purchase ? row.purchase.product : <strong>{t.order.missing}</strong>}</td>
                    <td className="num">{num(row.requiredMl / 1000, lang, 3)} l</td>
                    <td className="num">{row.bottles}</td>
                    <td className="num">{money(row.orderCostGross, lang, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <h2>{t.dashboard.business}</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.dashboard.metric}</th>
                  <th className="num">{t.dashboard.value}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t.dashboard.plannedRevenue}</td>
                  <td className="num">{money(computed.totalRevenue, lang, currency)}</td>
                </tr>
                <tr>
                  <td>{t.dashboard.orderCost}</td>
                  <td className="num">{money(computed.totalOrderGross, lang, currency)}</td>
                </tr>
                <tr>
                  <td>{t.dashboard.plannedResult}</td>
                  <td className="num">{money(computed.profit, lang, currency)}</td>
                </tr>
                <tr>
                  <td>{t.dashboard.foodCostRatioTotal}</td>
                  <td className="num">{num(computed.overallFoodCostPct, lang, 1)} %</td>
                </tr>
                <tr>
                  <td>{t.dashboard.packageSurplus}</td>
                  <td className="num">{money(computed.totalSurplusValue, lang, currency)}</td>
                </tr>
                <tr>
                  <td>{t.dashboard.breakEvenNoCommission}</td>
                  <td className="num">{be(computed.beNoCommission)}</td>
                </tr>
                <tr>
                  <td>{t.dashboard.breakEvenCommission}</td>
                  <td className="num">{be(computed.beCommission)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
