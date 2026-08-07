import type { Lang } from '../lib/types';
import { useT } from '../i18n/useLang';
import { BACKUP_FORMAT, BACKUP_VERSION, RECIPES_FORMAT, RECIPES_FORMAT_VERSION } from '../lib/state';

const RECIPES_JSON_EXAMPLE = `{
  "format": "${RECIPES_FORMAT}",
  "version": ${RECIPES_FORMAT_VERSION},
  "appVersion": "${__APP_VERSION__}",
  "exportedAt": "2026-01-10T09:00:00.000Z",
  "recipes": [
    {
      "name": "Mojito",
      "description": "...",
      "preparation": "...",
      "salePrice": 8.5,
      "ingredients": [
        { "ingredient": "Weißer Rum", "ml": 50 },
        { "ingredient": "Limettensaft", "ml": 25 }
      ]
    }
  ]
}`;

const backupJsonExample = (lang: Lang) => `{
  "format": "${BACKUP_FORMAT}",
  "version": ${BACKUP_VERSION},
  "appVersion": "${__APP_VERSION__}",
  "exportedAt": "2026-01-10T09:00:00.000Z",
  "state": {
    "settings": { "defaultServingMl": 170, "bufferPct": 5, "...": "..." },
    "purchases": [ /* ${lang === 'en' ? 'see CSV import' : 'wie CSV-Import'} */ ],
    "recipes": [ /* ${lang === 'en' ? 'see recipes JSON' : 'wie Rezepte-JSON'} */ ],
    "plans": { "<recipe-id>": { "mode": "pieces", "value": 20, "unit": "ml", "selected": true } }
  }
}`;

export default function HelpPage() {
  const { lang, t } = useT();

  const toc: { id: string; label: string }[] = [
    { id: 'quick', label: t.help.quickTitle },
    { id: 'purchases', label: t.help.purchasesTitle },
    { id: 'recipes', label: t.help.recipesTitle },
    { id: 'planning', label: t.help.planningTitle },
    { id: 'metrics', label: t.help.metricsTitle },
    { id: 'offline', label: t.help.offlineTitle },
    { id: 'formats', label: t.help.formatsTitle },
    { id: 'storage', label: t.help.storageTitle },
    { id: 'privacy', label: t.help.privacyTitle },
    { id: 'license', label: t.help.licenseTitle },
  ];

  const csvColumns: [string, string, string][] = [
    ['ingredient', t.help.formatsCsvColIngredient, 'Vodka'],
    ['product', t.help.formatsCsvColProduct, 'Three Sixty 1,0 l'],
    ['package_ml', t.help.formatsCsvColPackage, '1000'],
    ['price', t.help.formatsCsvColPrice, '10.08'],
    ['tax_rate', t.help.formatsCsvColTax, '19'],
    ['price_basis', t.help.formatsCsvColBasis, 'net'],
    ['commission', t.help.formatsCsvColCommission, 'false'],
    ['units_per_case', t.help.formatsCsvColUnits, '6'],
    ['active', t.help.formatsCsvColActive, 'true'],
    ['stock_units', t.help.formatsCsvColStock, '2'],
    ['source', t.help.formatsCsvColSource, 'Preisliste Januar 2026'],
  ];

  const exportFormats: [string, string][] = [
    [t.help.exportPdfCombined, t.help.exportPdfCombinedDesc],
    [t.help.exportPdfCalc, t.help.exportPdfCalcDesc],
    [t.help.exportPdfOrder, t.help.exportPdfOrderDesc],
    [t.data.exportExcel, t.help.exportExcelDesc],
    [t.data.exportAllCsv, t.help.exportCsvPackageDesc],
    [t.data.exportRecipesJson, t.help.exportRecipesJsonDesc],
  ];

  return (
    <section>
      <div className="section-head">
        <div>
          <h1>{t.help.title}</h1>
          <p>{t.help.intro}</p>
        </div>
      </div>

      <nav className="help-toc" aria-label={t.help.tocTitle}>
        <span className="help-toc-label">{t.help.tocTitle}</span>
        <div className="help-toc-links">
          {toc.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="help-grid">
        <article id="quick" className="card help-card help-card-wide">
          <h3>{t.help.quickTitle}</h3>
          <ol className="help-steps">
            <li>{t.help.quick1}</li>
            <li>{t.help.quick2}</li>
            <li>{t.help.quick3}</li>
            <li>{t.help.quick4}</li>
            <li>{t.help.quick5}</li>
          </ol>
        </article>

        <article id="purchases" className="card help-card">
          <h3>{t.help.purchasesTitle}</h3>
          <p>{t.help.purchasesBody}</p>
        </article>
        <article id="recipes" className="card help-card">
          <h3>{t.help.recipesTitle}</h3>
          <p>{t.help.recipesBody}</p>
        </article>
        <article id="planning" className="card help-card">
          <h3>{t.help.planningTitle}</h3>
          <p>{t.help.planningBody}</p>
        </article>
        <article id="metrics" className="card help-card">
          <h3>{t.help.metricsTitle}</h3>
          <p>{t.help.metricsBody}</p>
        </article>

        <article id="offline" className="card help-card help-card-wide">
          <h3>{t.help.offlineTitle}</h3>
          <p>{t.help.offlineIntro}</p>
          <p>{t.help.offlineHow}</p>
          <div className="help-subgrid">
            <div>
              <h4>{t.help.offlineInstallTitle}</h4>
              <ul className="help-list">
                <li>{t.help.offlineInstallDesktop}</li>
                <li>{t.help.offlineInstallAndroid}</li>
                <li>{t.help.offlineInstallIOS}</li>
              </ul>
            </div>
            <div>
              <h4>{t.help.offlineUpdateTitle}</h4>
              <p>{t.help.offlineUpdateBody}</p>
            </div>
          </div>
        </article>

        <article id="formats" className="card help-card help-card-wide">
          <h3>{t.help.formatsTitle}</h3>
          <p>{t.help.formatsIntro}</p>

          <h4>{t.help.formatsCsvTitle}</h4>
          <p>{t.help.formatsCsvIntro}</p>
          <div className="table-wrap is-wide">
            <table>
              <thead>
                <tr>
                  <th>{t.help.formatsCsvColHeader}</th>
                  <th>{t.help.formatsCsvDescHeader}</th>
                  <th>{t.help.formatsCsvExampleHeader}</th>
                </tr>
              </thead>
              <tbody>
                {csvColumns.map(([col, desc, example]) => (
                  <tr key={col}>
                    <td>
                      <code>{col}</code>
                    </td>
                    <td>{desc}</td>
                    <td className="muted">{example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4>{t.help.formatsRecipesTitle}</h4>
          <p>{t.help.formatsRecipesBody}</p>
          <pre className="code-block">
            <code>{RECIPES_JSON_EXAMPLE}</code>
          </pre>

          <h4>{t.help.formatsBackupTitle}</h4>
          <p>{t.help.formatsBackupBody}</p>
          <pre className="code-block">
            <code>{backupJsonExample(lang)}</code>
          </pre>

          <h4>{t.help.formatsExportsTitle}</h4>
          <p>{t.help.formatsExportsIntro}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.help.formatsExportsNameHeader}</th>
                  <th>{t.help.formatsExportsDescHeader}</th>
                </tr>
              </thead>
              <tbody>
                {exportFormats.map(([name, desc]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article id="storage" className="card help-card">
          <h3>{t.help.storageTitle}</h3>
          <p>{t.help.storageBody}</p>
        </article>
        <article id="privacy" className="card help-card">
          <h3>{t.help.privacyTitle}</h3>
          <p>{t.help.privacyBody}</p>
        </article>
        <article id="license" className="card help-card help-card-wide">
          <h3>{t.help.licenseTitle}</h3>
          <p>{t.help.licenseBody}</p>
          <a className="text-link" href="https://www.gnu.org/licenses/lgpl-3.0.html" target="_blank" rel="noreferrer">
            {t.help.licenseLabel}
          </a>
        </article>
      </div>
    </section>
  );
}
