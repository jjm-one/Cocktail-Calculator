import { useState, type ReactNode } from 'react';
import { parseCsv } from '../lib/csv';
import {
  downloadDefaultPrices,
  exportAllCsv,
  exportBackupJson,
  exportCalculationPdf,
  exportExcel,
  exportOrderPdf,
  exportPdfReport,
  exportPurchasesCsv,
  exportRecipesJson,
} from '../lib/exporters';
import { useAppState } from '../state/AppStateContext';
import { useToast } from '../components/Toast';
import { useT } from '../i18n/useLang';
import { FileDropZone } from '../components/FileDropZone';

function DataSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="data-card-section">
      <span className="data-card-label">{label}</span>
      {children}
    </div>
  );
}

export default function DataPage() {
  const { lang, t } = useT();
  const { state, computed, importPurchasesCsv, importBackup, importRecipesFile, resetToDefaults } = useAppState();
  const { showToast } = useToast();
  const [csvStatus, setCsvStatus] = useState('');
  const [recipesStatus, setRecipesStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [configStatus, setConfigStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const currency = state.settings.currency;

  const handleCsvImport = async (file: File) => {
    try {
      const rows = parseCsv(await file.text());
      const result = importPurchasesCsv(rows);
      const parts = [t.data.importedCount(result.created.length)];
      if (result.skipped > 0) parts.push(t.data.importSkippedCount(result.skipped));
      setCsvStatus(parts.join(' '));
    } catch (err) {
      setCsvStatus(t.data.importFailed(err instanceof Error ? err.message : String(err)));
    }
  };

  const handleRecipesImport = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text());
      const result = importRecipesFile(raw, lang);
      if (result.ok) {
        showToast(t.data.recipesImported);
        setRecipesStatus(result.warnings.length ? { ok: true, text: result.warnings.join(' ') } : null);
      } else {
        setRecipesStatus({ ok: false, text: result.error || t.data.recipesInvalid });
      }
    } catch {
      setRecipesStatus({ ok: false, text: t.data.recipesInvalid });
    }
  };

  const handleConfigImport = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text());
      const result = importBackup(raw, lang);
      if (result.ok) {
        showToast(t.data.configImported);
        setConfigStatus(result.warnings.length ? { ok: true, text: result.warnings.join(' ') } : null);
      } else {
        setConfigStatus({ ok: false, text: result.error || t.data.configInvalid });
      }
    } catch {
      setConfigStatus({ ok: false, text: t.data.configInvalid });
    }
  };

  const handleReset = () => {
    if (confirm(t.data.resetConfirm)) {
      resetToDefaults();
      showToast(t.data.resetDone);
      setCsvStatus('');
      setRecipesStatus(null);
      setConfigStatus(null);
    }
  };

  return (
    <section>
      <div className="section-head">
        <div>
          <h1>{t.data.title}</h1>
          <p>{t.data.subtitle}</p>
        </div>
      </div>

      <div className="grid two">
        <article className="card data-card">
          <h2>{t.data.importPricesTitle}</h2>
          <p>{t.data.importPricesBody}</p>
          <DataSection label={t.data.sectionExport}>
            <div className="button-row">
              <button type="button" onClick={() => void downloadDefaultPrices()}>
                {t.data.defaultList}
              </button>
              <button type="button" onClick={() => exportPurchasesCsv(state)}>
                {t.data.exportPurchasesCsv}
              </button>
            </div>
          </DataSection>
          <DataSection label={t.data.sectionImport}>
            <FileDropZone label={t.data.chooseCsv} hint={t.data.dropHint} accept=".csv,text/csv" onFile={(f) => void handleCsvImport(f)} />
            {csvStatus && <div className="status">{csvStatus}</div>}
          </DataSection>
        </article>

        <article className="card data-card">
          <h2>{t.data.recipesTitle}</h2>
          <p>{t.data.recipesBody}</p>
          <DataSection label={t.data.sectionExport}>
            <div className="button-row">
              <button type="button" onClick={() => exportRecipesJson(state)}>
                {t.data.exportRecipesJson}
              </button>
            </div>
          </DataSection>
          <DataSection label={t.data.sectionImport}>
            <FileDropZone
              label={t.data.importRecipesJson}
              hint={t.data.dropHint}
              accept=".json,application/json"
              onFile={(f) => void handleRecipesImport(f)}
            />
            {recipesStatus && <div className={`status${recipesStatus.ok ? '' : ' status-error'}`}>{recipesStatus.text}</div>}
          </DataSection>
        </article>

        <article className="card data-card">
          <h2>{t.data.configTitle}</h2>
          <p>{t.data.configBody}</p>
          <DataSection label={t.data.sectionExport}>
            <div className="button-row">
              <button type="button" className="primary" onClick={() => exportBackupJson(state)}>
                {t.data.downloadConfig}
              </button>
            </div>
          </DataSection>
          <DataSection label={t.data.sectionImport}>
            <FileDropZone
              label={t.data.uploadConfig}
              hint={t.data.dropHint}
              accept=".json,application/json"
              onFile={(f) => void handleConfigImport(f)}
            />
            {configStatus && <div className={`status${configStatus.ok ? '' : ' status-error'}`}>{configStatus.text}</div>}
          </DataSection>
        </article>

        <article className="card data-card">
          <h2>{t.data.reportsTitle}</h2>
          <p>{t.data.reportsBody}</p>
          <DataSection label={t.data.sectionExport}>
            <div className="button-stack">
              <button type="button" className="primary" onClick={() => void exportPdfReport(computed, lang, currency)}>
                {t.data.exportPdf}
              </button>
              <div className="pdf-parts">
                <span className="pdf-parts-label">{t.data.exportPdfParts}</span>
                <div className="pdf-parts-buttons">
                  <button type="button" onClick={() => void exportCalculationPdf(computed, lang, currency)}>
                    {t.data.exportCalculationPdf}
                  </button>
                  <button type="button" onClick={() => void exportOrderPdf(computed, lang, currency)}>
                    {t.data.exportOrderPdf}
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => void exportExcel(state, computed)}>
                {t.data.exportExcel}
              </button>
              <button type="button" onClick={() => exportAllCsv(state, computed)}>
                {t.data.exportAllCsv}
              </button>
            </div>
          </DataSection>
        </article>
      </div>

      <article className="card data-card top-gap">
        <h2>{t.data.resetTitle}</h2>
        <p>{t.data.resetBody}</p>
        <button type="button" className="danger ghost" onClick={handleReset}>
          {t.data.resetAction}
        </button>
      </article>
    </section>
  );
}
