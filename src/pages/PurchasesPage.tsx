import { useMemo, useRef } from 'react';
import { unitsPerCase, grossPrice } from '../lib/calc';
import { money, num } from '../lib/format';
import { useAppState } from '../state/AppStateContext';
import { useT } from '../i18n/useLang';
import { useSortFilter, type ColumnSpec } from '../hooks/useSortFilter';
import { SortableTh } from '../components/SortableTh';
import { FilterRow } from '../components/FilterRow';
import { PurchaseDialog, type PurchaseDialogHandle } from '../components/PurchaseDialog';
import type { Purchase } from '../lib/types';

export default function PurchasesPage() {
  const { lang, t } = useT();
  const { state, deletePurchase, setPurchaseActive } = useAppState();
  const dialogRef = useRef<PurchaseDialogHandle>(null);
  const currency = state.settings.currency;

  const handleDelete = (id: string) => {
    if (confirm(t.common.deletePurchaseConfirm)) deletePurchase(id);
  };

  const columns: ColumnSpec<Purchase>[] = useMemo(
    () => [
      { key: 'active', sortValue: (p) => (p.active ? 1 : 0), filterValue: (p) => (p.active ? t.purchases.yes : t.purchases.no) },
      { key: 'ingredient', sortValue: (p) => p.ingredient, filterValue: (p) => p.ingredient },
      { key: 'product', sortValue: (p) => p.product, filterValue: (p) => p.product },
      { key: 'package', sortValue: (p) => Number(p.packageMl) || 0, filterValue: (p) => `${num(p.packageMl, lang, 0)} ml` },
      { key: 'price', sortValue: (p) => grossPrice(p), filterValue: (p) => money(grossPrice(p), lang, currency) },
      { key: 'tax', sortValue: (p) => Number(p.taxRate) || 0, filterValue: (p) => `${num(p.taxRate, lang, 1)} %` },
      { key: 'commission', sortValue: (p) => (p.commission ? 1 : 0), filterValue: (p) => (p.commission ? t.purchases.yes : t.purchases.no) },
      { key: 'unitsPerCase', sortValue: (p) => unitsPerCase(p), filterValue: (p) => String(unitsPerCase(p)) },
      {
        key: 'stock',
        sortValue: (p) => Number(p.stockUnits) || 0,
        filterValue: (p) => (p.stockUnits > 0 ? num(p.stockUnits, lang, p.stockUnits % 1 === 0 ? 0 : 1) : ''),
      },
    ],
    [lang, currency, t],
  );
  const { rows: filtered, sort, toggleSort, filters, setFilter, hasFilters } = useSortFilter(state.purchases, columns);

  return (
    <section>
      <div className="section-head">
        <div>
          <h1>{t.purchases.title}</h1>
          <p>{t.purchases.body}</p>
        </div>
        <button type="button" className="primary" onClick={() => dialogRef.current?.open()}>
          {t.purchases.add}
        </button>
      </div>

      {hasFilters && (
        <div className="search-bar">
          <span className="search-count">{t.purchases.searchCount(filtered.length, state.purchases.length)}</span>
        </div>
      )}

      <div className="table-wrap is-wide">
        <table>
          <thead>
            <tr>
              <SortableTh label={t.purchases.thActive} sortKey="active" sort={sort} onSort={toggleSort} />
              <SortableTh label={t.purchases.thIngredient} sortKey="ingredient" sort={sort} onSort={toggleSort} />
              <SortableTh label={t.purchases.thProduct} sortKey="product" sort={sort} onSort={toggleSort} />
              <SortableTh label={t.purchases.thPackage} sortKey="package" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh label={t.purchases.thPriceGross} sortKey="price" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh label={t.purchases.thTax} sortKey="tax" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh label={t.purchases.thCommission} sortKey="commission" sort={sort} onSort={toggleSort} />
              <SortableTh label={t.purchases.thUnitsPerCase} sortKey="unitsPerCase" sort={sort} onSort={toggleSort} className="num" />
              <SortableTh label={t.purchases.thStock} sortKey="stock" sort={sort} onSort={toggleSort} className="num" />
              <th></th>
            </tr>
            <FilterRow
              filters={filters}
              onChange={setFilter}
              cells={[
                { key: 'active', label: t.purchases.thActive },
                { key: 'ingredient', label: t.purchases.thIngredient },
                { key: 'product', label: t.purchases.thProduct },
                { key: 'package', label: t.purchases.thPackage, className: 'num' },
                { key: 'price', label: t.purchases.thPriceGross, className: 'num' },
                { key: 'tax', label: t.purchases.thTax, className: 'num' },
                { key: 'commission', label: t.purchases.thCommission },
                { key: 'unitsPerCase', label: t.purchases.thUnitsPerCase, className: 'num' },
                { key: 'stock', label: t.purchases.thStock, className: 'num' },
                {},
              ]}
            />
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="muted">
                  {state.purchases.length === 0 ? t.purchases.empty : t.purchases.searchEmpty}
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={p.active}
                    onChange={(e) => setPurchaseActive(p.id, e.target.checked)}
                    aria-label={`${p.product}`}
                  />
                </td>
                <td>{p.ingredient}</td>
                <td>{p.product}</td>
                <td className="num">{num(p.packageMl, lang, 0)} ml</td>
                <td className="num">{money(grossPrice(p), lang, currency)}</td>
                <td className="num">{num(p.taxRate, lang, 1)} %</td>
                <td>{p.commission ? t.purchases.yes : t.purchases.no}</td>
                <td className="num">{unitsPerCase(p)}</td>
                <td className="num">{p.stockUnits > 0 ? num(p.stockUnits, lang, p.stockUnits % 1 === 0 ? 0 : 1) : '–'}</td>
                <td>
                  <button type="button" onClick={() => dialogRef.current?.open(p)}>
                    {t.common.edit}
                  </button>{' '}
                  <button type="button" className="danger" onClick={() => handleDelete(p.id)}>
                    {t.common.delete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PurchaseDialog ref={dialogRef} />
    </section>
  );
}
