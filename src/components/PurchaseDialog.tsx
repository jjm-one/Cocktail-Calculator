import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { toMl, unitsPerCase } from '../lib/calc';
import { uid } from '../lib/format';
import { useAppState } from '../state/AppStateContext';
import { useT } from '../i18n/useLang';
import { Tooltip } from './Tooltip';
import type { PriceBasis, Purchase, Unit } from '../lib/types';

export interface PurchaseDialogHandle {
  open: (purchase?: Purchase) => void;
}

const emptyPurchase = (): Purchase => ({
  id: '',
  ingredient: '',
  product: '',
  packageMl: 1000,
  price: 0,
  taxRate: 19,
  priceBasis: 'gross',
  commission: false,
  unitsPerCase: 1,
  active: true,
  stockUnits: 0,
});

export const PurchaseDialog = forwardRef<PurchaseDialogHandle>(function PurchaseDialog(_props, ref) {
  const { t } = useT();
  const { upsertPurchase } = useAppState();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [purchaseId, setPurchaseId] = useState('');
  const [ingredient, setIngredient] = useState('');
  const [product, setProduct] = useState('');
  const [packageSize, setPackageSize] = useState(1000);
  const [packageUnit, setPackageUnit] = useState<Unit>('ml');
  const [price, setPrice] = useState(0);
  const [priceBasis, setPriceBasis] = useState<PriceBasis>('gross');
  const [taxRate, setTaxRate] = useState(19);
  const [unitsPerCaseValue, setUnitsPerCaseValue] = useState(1);
  const [commission, setCommission] = useState(false);
  const [active, setActive] = useState(true);
  const [stockUnits, setStockUnits] = useState(0);

  useImperativeHandle(ref, () => ({
    open(purchase) {
      const p = purchase || emptyPurchase();
      setPurchaseId(p.id);
      setIngredient(p.ingredient);
      setProduct(p.product);
      setPackageSize(p.packageMl);
      setPackageUnit('ml');
      setPrice(p.price);
      setPriceBasis(p.priceBasis);
      setTaxRate(p.taxRate);
      setUnitsPerCaseValue(unitsPerCase(p));
      setCommission(p.commission);
      setActive(p.active);
      setStockUnits(p.stockUnits || 0);
      dialogRef.current?.showModal();
    },
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedIngredient = ingredient.trim();
    const trimmedProduct = product.trim();
    if (!trimmedIngredient || !trimmedProduct) return;
    const purchase: Purchase = {
      id: purchaseId || uid(),
      ingredient: trimmedIngredient,
      product: trimmedProduct,
      packageMl: toMl(packageSize, packageUnit),
      price: Number(price) || 0,
      taxRate: Number(taxRate) || 0,
      priceBasis,
      commission,
      unitsPerCase: Math.max(1, Number(unitsPerCaseValue) || 1),
      active,
      stockUnits: Math.max(0, Number(stockUnits) || 0),
    };
    upsertPurchase(purchase);
    dialogRef.current?.close();
  };

  return (
    <dialog ref={dialogRef}>
      <form onSubmit={handleSubmit}>
        <div className="dialog-head">
          <h2>{t.dialog.purchaseTitle}</h2>
          <button type="button" className="icon" onClick={() => dialogRef.current?.close()} aria-label={t.dialog.cancel}>
            ×
          </button>
        </div>
        <div className="form-grid two-col">
          <label>
            {t.dialog.ingredientType}
            <input value={ingredient} onChange={(e) => setIngredient(e.target.value)} required placeholder={t.dialog.ingredientPlaceholder} />
          </label>
          <label>
            {t.dialog.product}
            <input value={product} onChange={(e) => setProduct(e.target.value)} required placeholder={t.dialog.productPlaceholder} />
          </label>
          <label>
            {t.dialog.packageSize}
            <input type="number" min="1" step="1" value={packageSize} onChange={(e) => setPackageSize(Number(e.target.value) || 0)} required />
          </label>
          <label>
            {t.dialog.unit}
            <select value={packageUnit} onChange={(e) => setPackageUnit(e.target.value as Unit)}>
              <option value="ml">ml</option>
              <option value="cl">cl</option>
              <option value="l">l</option>
            </select>
          </label>
          <label>
            {t.dialog.price}
            <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} required />
          </label>
          <label>
            {t.dialog.priceBasis}
            <select value={priceBasis} onChange={(e) => setPriceBasis(e.target.value as PriceBasis)}>
              <option value="gross">{t.dialog.gross}</option>
              <option value="net">{t.dialog.net}</option>
            </select>
          </label>
          <label>
            {t.dialog.taxRate}
            <input type="number" min="0" step="0.1" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value) || 0)} />
          </label>
          <label>
            {t.dialog.unitsPerCase}
            <input type="number" min="1" step="1" value={unitsPerCaseValue} onChange={(e) => setUnitsPerCaseValue(Number(e.target.value) || 1)} />
          </label>
          <label>
            {t.dialog.stockUnits} <Tooltip text={t.dialog.stockUnitsTip} />
            <input type="number" min="0" step="0.5" value={stockUnits} onChange={(e) => setStockUnits(Number(e.target.value) || 0)} />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={commission} onChange={(e) => setCommission(e.target.checked)} /> {t.dialog.commission}
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> {t.dialog.active}
          </label>
        </div>
        <div className="dialog-actions">
          <button type="button" onClick={() => dialogRef.current?.close()}>
            {t.dialog.cancel}
          </button>
          <button type="submit" className="primary">
            {t.dialog.save}
          </button>
        </div>
      </form>
    </dialog>
  );
});
