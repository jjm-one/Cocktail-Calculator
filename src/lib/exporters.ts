import type { jsPDF } from 'jspdf';
import type { UserOptions } from 'jspdf-autotable';
import { download, exportCsv } from './csv';
import { formatScaledAmount, money, num, safeFileName, uid } from './format';
import { recipeBaseMl, toMl } from './calc';
import { backupPayload, recipesPayload } from './state';
import type { AppState, ComputeResult, Lang, Purchase, Recipe, Unit } from './types';

// jsPDF, jspdf-autotable and xlsx are only needed once a user actually
// triggers an export; loading them lazily keeps them out of the initial
// bundle instead of bloating every page load.
async function loadPdf() {
  const [{ jsPDF: PdfDocument }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  return { PdfDocument, autoTable: autoTableModule.default };
}

async function loadXlsx() {
  return import('xlsx');
}

type AutoTableFn = (doc: jsPDF, options: UserOptions) => void;

// jspdf-autotable v5's functional API sets this on the document as a side
// effect; there is no published module augmentation for it.
type DocWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

interface ScaledRecipeData {
  recipe: Recipe | undefined;
  targetMl: number;
  baseMl: number;
  factor: number;
  rows: { ingredient: string; baseMl: number; scaledMl: number }[];
}

export function scaledRecipeData(recipe: Recipe | undefined, amount: number, unit: Unit): ScaledRecipeData {
  const targetMl = toMl(amount || 0, unit || 'ml');
  const baseMl = recipe ? recipeBaseMl(recipe) : 0;
  const factor = baseMl > 0 ? targetMl / baseMl : 0;
  return {
    recipe,
    targetMl,
    baseMl,
    factor,
    rows: recipe
      ? recipe.ingredients.map((i) => ({
          ingredient: i.ingredient,
          baseMl: Number(i.ml) || 0,
          scaledMl: (Number(i.ml) || 0) * factor,
        }))
      : [],
  };
}

export function exportScaledRecipeCsv(d: ScaledRecipeData, language: Lang): void {
  if (!d.recipe || d.targetMl <= 0) return;
  const headers =
    language === 'en'
      ? ['cocktail', 'target_ml', 'ingredient', 'base_ml', 'scaled_ml', 'preparation']
      : ['cocktail', 'zielmenge_ml', 'zutat', 'basis_ml', 'skaliert_ml', 'zubereitung'];
  const rows = d.rows.map((x) => [
    d.recipe!.name,
    d.targetMl,
    x.ingredient,
    x.baseMl,
    Number(x.scaledMl.toFixed(3)),
    d.recipe!.preparation || '',
  ]);
  exportCsv(`${safeFileName(d.recipe.name)}-${Math.round(d.targetMl)}ml.csv`, headers, rows);
}

export async function exportScaledRecipePdf(d: ScaledRecipeData, language: Lang): Promise<void> {
  if (!d.recipe || d.targetMl <= 0) return;
  const { PdfDocument, autoTable } = await loadPdf();
  const doc = new PdfDocument();
  doc.setFontSize(18);
  doc.text(`JJM's Cocktail-Calculator`, 14, 18);
  doc.setFontSize(15);
  doc.text(d.recipe.name, 14, 29);
  doc.setFontSize(10);
  doc.text(
    language === 'en'
      ? `Target volume: ${formatScaledAmount(d.targetMl, language)} · Base: ${num(d.baseMl, language, 1)} ml · Factor: ${num(d.factor, language, 3)}`
      : `Zielmenge: ${formatScaledAmount(d.targetMl, language)} · Basis: ${num(d.baseMl, language, 1)} ml · Faktor: ${num(d.factor, language, 3)}`,
    14,
    38,
  );
  autoTable(doc, {
    startY: 45,
    head: [[language === 'en' ? 'Ingredient' : 'Zutat', language === 'en' ? 'Base' : 'Basis', language === 'en' ? 'Scaled quantity' : 'Skalierte Menge']],
    body: d.rows.map((x) => [x.ingredient, `${num(x.baseMl, language, 1)} ml`, formatScaledAmount(x.scaledMl, language)]),
  });
  let y = ((doc as DocWithAutoTable).lastAutoTable?.finalY || 45) + 10;
  doc.setFontSize(12);
  doc.text(language === 'en' ? 'Preparation' : 'Zubereitung', 14, y);
  y += 7;
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(d.recipe.preparation || '-', 180), 14, y);
  addPdfFooter(doc, language);
  doc.save(`${safeFileName(d.recipe.name)}-${Math.round(d.targetMl)}ml.pdf`);
}

export function exportPurchasesCsv(state: AppState): void {
  exportCsv(
    'ek-posten.csv',
    ['ingredient', 'product', 'package_ml', 'price', 'tax_rate', 'price_basis', 'commission', 'units_per_case', 'active', 'stock_units', 'source'],
    state.purchases.map((p) => [
      p.ingredient,
      p.product,
      p.packageMl,
      p.price,
      p.taxRate,
      p.priceBasis,
      p.commission,
      p.unitsPerCase,
      p.active,
      p.stockUnits,
      p.source || '',
    ]),
  );
}

export async function downloadDefaultPrices(): Promise<void> {
  const response = await fetch(`${import.meta.env.BASE_URL}default-prices.csv`);
  download('default-prices.csv', await response.text(), 'text/csv;charset=utf-8');
}

export function exportRecipesJson(state: AppState): void {
  download('cocktail-rezepte.json', JSON.stringify(recipesPayload(state), null, 2), 'application/json');
}

export function exportBackupJson(state: AppState): void {
  download('cocktail-kalkulator-komplettsicherung.json', JSON.stringify(backupPayload(state), null, 2), 'application/json');
}

export function exportAllCsv(state: AppState, compute: ComputeResult): void {
  exportCsv(
    'rezepte.csv',
    ['cocktail', 'zutat', 'ml_basis', 'vk'],
    state.recipes.flatMap((r) => r.ingredients.map((i) => [r.name, i.ingredient, i.ml, r.salePrice])),
  );
  setTimeout(
    () =>
      exportCsv(
        'bestellmengen.csv',
        ['zutat', 'produkt', 'bedarf_ml', 'bereits_vorhanden_ml', 'zu_bestellen_ml', 'flaschen', 'kartons', 'kosten_brutto'],
        compute.orderRows.map((x) => [x.ingredient, x.purchase?.product || '', x.requiredMl, x.stockMl, x.netRequiredMl, x.bottles, x.cases, x.orderCostGross]),
      ),
    250,
  );
  setTimeout(
    () =>
      exportCsv(
        'kalkulation.csv',
        ['cocktail', 'getraenke', 'ek_ohne_verlust', 'ek_mit_verlust', 'vk', 'marge', 'erloes'],
        compute.recipeRows.map((x) => [x.recipe.name, x.servings, x.ekNoLoss, x.ekWithLoss, x.sale, x.marginWithLoss, x.revenueWithYield]),
      ),
    500,
  );
}

export async function exportExcel(state: AppState, compute: ComputeResult): Promise<void> {
  const XLSX = await loadXlsx();
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      { Feld: 'App', Wert: "JJM's Cocktail-Calculator" },
      { Feld: 'Version', Wert: __APP_VERSION__ },
      { Feld: 'Exportiert am', Wert: new Date().toLocaleString('de-DE') },
    ]),
    'Info',
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.purchases), 'EK-Posten');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(state.recipes.flatMap((r) => r.ingredients.map((i) => ({ Cocktail: r.name, Zutat: i.ingredient, Menge_ml: i.ml, VK: r.salePrice })))),
    'Rezepte',
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      compute.orderRows.map((x) => ({
        Zutat: x.ingredient,
        Produkt: x.purchase?.product || '',
        Bedarf_ml: x.requiredMl,
        Bereits_vorhanden_ml: x.stockMl,
        Zu_bestellen_ml: x.netRequiredMl,
        Flaschen: x.bottles,
        Kartons: x.cases,
        Kosten_brutto: x.orderCostGross,
      })),
    ),
    'Bestellung',
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(compute.recipeRows.map((x) => ({ Cocktail: x.recipe.name, Getraenke: x.servings, EK: x.ekNoLoss, EK_mit_Verlust: x.ekWithLoss, VK: x.sale, Marge: x.marginWithLoss, Erloes: x.revenueWithYield }))),
    'Kalkulation',
  );
  XLSX.writeFile(wb, 'cocktail-kalkulation.xlsx');
}

function pdfHeader(doc: jsPDF, title: string, subtitle?: string): void {
  doc.setFontSize(18);
  doc.text(title, 14, 16);
  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, 14, 24);
  }
}

// Stamps every page with the app version and export date so a printed or
// forwarded PDF can always be traced back to the data/logic that produced it.
function addPdfFooter(doc: jsPDF, language: Lang): void {
  const pageCount = doc.getNumberOfPages();
  const stamp = `JJM's Cocktail-Calculator v${__APP_VERSION__} · ${new Date().toLocaleString(language === 'en' ? 'en-US' : 'de-DE')}`;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(8);
  doc.setTextColor(140);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(stamp, 14, pageHeight - 8);
    doc.text(
      language === 'en' ? `Page ${i}/${pageCount}` : `Seite ${i}/${pageCount}`,
      pageWidth - 14,
      pageHeight - 8,
      { align: 'right' },
    );
  }
  doc.setTextColor(0);
}

function drawCalculationTable(doc: jsPDF, autoTable: AutoTableFn, compute: ComputeResult, language: Lang, currency: string, startY: number): void {
  const head =
    language === 'en'
      ? ['Cocktail', 'Drinks', 'COGS', 'COGS incl. loss', 'Sales price', 'Margin', 'Revenue']
      : ['Cocktail', 'Getränke', 'EK', 'EK inkl. Verlust', 'VK', 'Marge', 'Erlös'];
  autoTable(doc, {
    startY,
    head: [head],
    body: compute.recipeRows.map((x) => [
      x.recipe.name,
      num(x.servings, language, 1),
      money(x.ekNoLoss, language, currency),
      money(x.ekWithLoss, language, currency),
      money(x.sale, language, currency),
      money(x.marginWithLoss, language, currency),
      money(x.revenueWithYield, language, currency),
    ]),
  });
}

function drawOrderTable(doc: jsPDF, autoTable: AutoTableFn, compute: ComputeResult, language: Lang, currency: string, startY: number): void {
  const head =
    language === 'en'
      ? ['Ingredient', 'Product', 'Required ml', 'Bottles', 'Cases', 'Cost']
      : ['Zutat', 'Produkt', 'Bedarf ml', 'Flaschen', 'Kartons', 'Kosten'];
  autoTable(doc, {
    startY,
    head: [head],
    body: compute.orderRows.map((x) => [
      x.ingredient,
      x.purchase?.product || (language === 'en' ? 'Missing cost item' : 'EK fehlt'),
      num(x.requiredMl, language, 0),
      x.bottles,
      x.cases || '-',
      money(x.orderCostGross, language, currency),
    ]),
  });
}

export async function exportCalculationPdf(compute: ComputeResult, language: Lang, currency: string): Promise<void> {
  const { PdfDocument, autoTable } = await loadPdf();
  const doc = new PdfDocument({ orientation: 'landscape' });
  pdfHeader(
    doc,
    language === 'en' ? 'Calculation' : 'Kalkulation',
    `${language === 'en' ? 'Revenue' : 'Erlös'}: ${money(compute.totalRevenue, language, currency)} | ${language === 'en' ? 'Result' : 'Ergebnis'}: ${money(compute.profit, language, currency)}`,
  );
  drawCalculationTable(doc, autoTable, compute, language, currency, 30);
  addPdfFooter(doc, language);
  doc.save(language === 'en' ? 'calculation.pdf' : 'kalkulation.pdf');
}

export async function exportOrderPdf(compute: ComputeResult, language: Lang, currency: string): Promise<void> {
  const { PdfDocument, autoTable } = await loadPdf();
  const doc = new PdfDocument({ orientation: 'landscape' });
  pdfHeader(
    doc,
    language === 'en' ? 'Order quantities' : 'Bestellmengen',
    `${language === 'en' ? 'Purchase cost' : 'Bestell-EK'}: ${money(compute.totalOrderGross, language, currency)}`,
  );
  drawOrderTable(doc, autoTable, compute, language, currency, 30);
  addPdfFooter(doc, language);
  doc.save(language === 'en' ? 'order-quantities.pdf' : 'bestellmengen.pdf');
}

export async function exportPdfReport(compute: ComputeResult, language: Lang, currency: string): Promise<void> {
  const { PdfDocument, autoTable } = await loadPdf();
  const doc = new PdfDocument({ orientation: 'landscape' });
  pdfHeader(
    doc,
    language === 'en' ? 'Cocktail calculation' : 'Cocktail Kalkulation',
    `${language === 'en' ? 'Purchase cost' : 'Bestell-EK'}: ${money(compute.totalOrderGross, language, currency)} | ${language === 'en' ? 'Revenue' : 'Erlös'}: ${money(compute.totalRevenue, language, currency)} | ${language === 'en' ? 'Result' : 'Ergebnis'}: ${money(compute.profit, language, currency)}`,
  );
  drawCalculationTable(doc, autoTable, compute, language, currency, 30);
  doc.addPage();
  pdfHeader(doc, language === 'en' ? 'Order quantities' : 'Bestellmengen');
  drawOrderTable(doc, autoTable, compute, language, currency, 22);
  addPdfFooter(doc, language);
  doc.save(language === 'en' ? 'cocktail-calculation.pdf' : 'cocktail-kalkulation.pdf');
}

export function buildShoppingListText(compute: ComputeResult, language: Lang): string {
  const header = language === 'en' ? "Shopping list – JJM's Cocktail-Calculator" : "Einkaufsliste – JJM's Cocktail-Calculator";
  const bottleWord = language === 'en' ? 'bottle(s)' : 'Flasche(n)';
  const missingWord = language === 'en' ? 'no purchase item set up' : 'kein EK-Posten hinterlegt';
  const lines = compute.orderRows
    .filter((r) => r.requiredMl > 0)
    .map((r) => {
      if (!r.purchase) return `- ${r.ingredient}: ${missingWord}`;
      const stockNote = r.stockMl > 0 ? ` (${num(r.stockMl / 1000, language, 2)} l ${language === 'en' ? 'already in stock' : 'bereits vorhanden'})` : '';
      return `- ${r.ingredient} – ${r.purchase.product}: ${r.bottles} ${bottleWord}${stockNote}`;
    });
  if (lines.length === 0) {
    lines.push(language === 'en' ? '(nothing planned yet)' : '(noch nichts geplant)');
  }
  return [header, '', ...lines].join('\n');
}

export async function copyShoppingListToClipboard(compute: ComputeResult, language: Lang): Promise<void> {
  await navigator.clipboard.writeText(buildShoppingListText(compute, language));
}

export interface CsvImportResult {
  created: Purchase[];
  skipped: number;
}

export function importPurchasesFromCsvRows(rows: Record<string, string>[]): CsvImportResult {
  const created: Purchase[] = [];
  let skipped = 0;
  for (const r of rows) {
    const ingredient = (r.ingredient || r.zutat || '').trim();
    const product = (r.product || r.produkt || '').trim();
    if (!ingredient || !product) {
      skipped++;
      continue;
    }
    created.push({
      id: uid(),
      ingredient,
      product,
      packageMl: Number(r.package_ml || r.gebinde_ml) || 1000,
      price: Number(String(r.price || r.preis || 0).replace(',', '.')),
      taxRate: Number(String(r.tax_rate || r.steuersatz || 0).replace(',', '.')),
      priceBasis: (r.price_basis || r.preisart || 'gross').toLowerCase().startsWith('net') ? ('net' as const) : ('gross' as const),
      commission: ['true', '1', 'ja', 'yes'].includes(String(r.commission || r.kommission).toLowerCase()),
      unitsPerCase: Math.max(1, Number(r.units_per_case || r.flaschen_pro_karton) || 1),
      active: r.active === undefined ? true : !['false', '0', 'nein'].includes(String(r.active).toLowerCase()),
      stockUnits: Math.max(0, Number(String(r.stock_units || r.bestand || 0).replace(',', '.')) || 0),
      source: r.source || '',
    });
  }
  return { created, skipped };
}
