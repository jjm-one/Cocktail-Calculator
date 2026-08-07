import { useMemo, useRef, useState } from 'react';
import { unitsPerCase, grossPrice } from '../lib/calc';
import { money, num } from '../lib/format';
import { useAppState } from '../state/AppStateContext';
import { useT } from '../i18n/useLang';
import { PurchaseDialog, type PurchaseDialogHandle } from '../components/PurchaseDialog';

export default function PurchasesPage() {
  const { lang, t } = useT();
  const { state, deletePurchase, setPurchaseActive } = useAppState();
  const dialogRef = useRef<PurchaseDialogHandle>(null);
  const currency = state.settings.currency;
  const [search, setSearch] = useState('');

  const handleDelete = (id: string) => {
    if (confirm(t.common.deletePurchaseConfirm)) deletePurchase(id);
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return state.purchases;
    return state.purchases.filter(
      (p) => p.ingredient.toLowerCase().includes(query) || p.product.toLowerCase().includes(query),
    );
  }, [state.purchases, search]);

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

      <div className="search-bar">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.purchases.searchPlaceholder}
          aria-label={t.purchases.searchPlaceholder}
        />
        {search && <span className="search-count">{t.purchases.searchCount(filtered.length, state.purchases.length)}</span>}
      </div>

      <div className="table-wrap is-wide">
        <table>
          <thead>
            <tr>
              <th>{t.purchases.thActive}</th>
              <th>{t.purchases.thIngredient}</th>
              <th>{t.purchases.thProduct}</th>
              <th className="num">{t.purchases.thPackage}</th>
              <th className="num">{t.purchases.thPriceGross}</th>
              <th className="num">{t.purchases.thTax}</th>
              <th>{t.purchases.thCommission}</th>
              <th className="num">{t.purchases.thUnitsPerCase}</th>
              <th className="num">{t.purchases.thStock}</th>
              <th></th>
            </tr>
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
