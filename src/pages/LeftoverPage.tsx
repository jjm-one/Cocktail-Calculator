import { useMemo } from 'react';
import { money, num } from '../lib/format';
import { useAppState } from '../state/AppStateContext';
import { useT } from '../i18n/useLang';
import { useSortFilter, type ColumnSpec } from '../hooks/useSortFilter';
import { SortableTh } from '../components/SortableTh';
import { FilterRow } from '../components/FilterRow';
import { Tooltip } from '../components/Tooltip';
import type { LeftoverRow } from '../lib/types';

export default function LeftoverPage() {
  const { lang, t } = useT();
  const { state, computed } = useAppState();
  const currency = state.settings.currency;

  const columns: ColumnSpec<LeftoverRow>[] = useMemo(
    () => [
      { key: 'ingredient', sortValue: (r) => r.ingredient, filterValue: (r) => r.ingredient },
      { key: 'product', sortValue: (r) => r.purchase.product, filterValue: (r) => r.purchase.product },
      {
        key: 'commission',
        sortValue: (r) => (r.purchase.commission ? 1 : 0),
        filterValue: (r) => (r.purchase.commission ? t.purchases.yes : t.purchases.no),
      },
      { key: 'leftoverMl', sortValue: (r) => r.leftoverMl, filterValue: (r) => num(r.leftoverMl / 1000, lang, 2) },
      { key: 'leftoverValue', sortValue: (r) => r.leftoverValue, filterValue: (r) => money(r.leftoverValue, lang, currency) },
    ],
    [lang, currency, t],
  );
  const { rows: visibleRows, sort, toggleSort, filters, setFilter } = useSortFilter(computed.leftoverRows, columns);

  return (
    <section>
      <div className="section-head">
        <div>
          <h1>{t.leftover.title}</h1>
          <p>{t.leftover.body}</p>
        </div>
      </div>

      <div className="table-wrap is-wide">
        <table>
          <thead>
            <tr>
              <SortableTh label={t.leftover.thIngredient} sortKey="ingredient" sort={sort} onSort={toggleSort} />
              <SortableTh label={t.leftover.thProduct} sortKey="product" sort={sort} onSort={toggleSort} />
              <SortableTh label={t.leftover.thCommission} sortKey="commission" sort={sort} onSort={toggleSort} />
              <SortableTh label={t.leftover.thLeftoverMl} sortKey="leftoverMl" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh label={t.leftover.thLeftoverValue} sortKey="leftoverValue" sort={sort} onSort={toggleSort} className="num" />
            </tr>
            <FilterRow
              filters={filters}
              onChange={setFilter}
              cells={[
                { key: 'ingredient', label: t.leftover.thIngredient },
                { key: 'product', label: t.leftover.thProduct },
                { key: 'commission', label: t.leftover.thCommission },
                { key: 'leftoverMl', label: t.leftover.thLeftoverMl, className: 'num' },
                { key: 'leftoverValue', label: t.leftover.thLeftoverValue, className: 'num' },
              ]}
            />
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  {t.leftover.empty}
                </td>
              </tr>
            )}
            {visibleRows.map((row) => (
              <tr key={row.ingredient}>
                <td>{row.ingredient}</td>
                <td>{row.purchase.product}</td>
                <td>{row.purchase.commission ? t.purchases.yes : t.purchases.no}</td>
                <td className="num">{num(row.leftoverMl / 1000, lang, 2)} l</td>
                <td className="num">{money(row.leftoverValue, lang, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <article className="card top-gap">
        <div className="metric-grid">
          <div className="metric">
            <span>
              {t.leftover.totalCommission} <Tooltip text={t.leftover.totalCommissionTip} />
            </span>
            <strong>
              {num(computed.totalLeftoverMlCommission / 1000, lang, 2)} l · {money(computed.totalLeftoverValueCommission, lang, currency)}
            </strong>
          </div>
          <div className="metric">
            <span>
              {t.leftover.totalNoCommission} <Tooltip text={t.leftover.totalNoCommissionTip} />
            </span>
            <strong>
              {num(computed.totalLeftoverMlNoCommission / 1000, lang, 2)} l · {money(computed.totalLeftoverValueNoCommission, lang, currency)}
            </strong>
          </div>
        </div>
      </article>
    </section>
  );
}
