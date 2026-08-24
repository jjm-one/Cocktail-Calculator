import { fromMl, toMl } from '../lib/calc';
import { useAppState } from '../state/AppStateContext';
import { useT } from '../i18n/useLang';
import { Tooltip } from '../components/Tooltip';
import type { CommissionMode } from '../lib/types';

export default function SettingsPage() {
  const { t } = useT();
  const { state, setSettings } = useAppState();
  const s = state.settings;

  return (
    <section>
      <div className="section-head">
        <div>
          <h1>{t.settings.title}</h1>
        </div>
      </div>
      <div className="grid two">
        <article className="card form-grid">
          <label>
            {t.settings.serving} <Tooltip text={t.settings.servingTip} />
            <div className="inline">
              <input
                type="number"
                min="1"
                step="1"
                value={Math.round(fromMl(s.defaultServingMl, 'ml'))}
                onChange={(e) => setSettings({ defaultServingMl: toMl(e.target.value, 'ml') })}
              />
              <select value="ml" disabled>
                <option>ml</option>
              </select>
            </div>
          </label>
          <label>
            {t.settings.buffer} <Tooltip text={t.settings.bufferTip} />
            <input type="number" min="0" step="0.1" value={s.bufferPct} onChange={(e) => setSettings({ bufferPct: Number(e.target.value) || 0 })} />
          </label>
          <label>
            {t.settings.consumptionLoss} <Tooltip text={t.settings.consumptionLossTip} />
            <input
              type="number"
              min="0"
              step="0.1"
              value={s.consumptionLossPct}
              onChange={(e) => setSettings({ consumptionLossPct: Number(e.target.value) || 0 })}
            />
          </label>
          <label>
            {t.settings.yieldLoss} <Tooltip text={t.settings.yieldLossTip} />
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={s.yieldLossPct}
              onChange={(e) => setSettings({ yieldLossPct: Number(e.target.value) || 0 })}
            />
          </label>
          <label>
            {t.settings.commissionMode} <Tooltip text={t.settings.commissionModeTip} />
            <select value={s.commissionMode} onChange={(e) => setSettings({ commissionMode: e.target.value as CommissionMode })}>
              <option value="case">{t.settings.commissionCase}</option>
              <option value="bottle">{t.settings.commissionBottle}</option>
            </select>
          </label>
          <label>
            {t.settings.soldPct} <Tooltip text={t.settings.soldPctTip} />
            <input type="number" min="0" max="100" step="1" value={s.soldPct} onChange={(e) => setSettings({ soldPct: Number(e.target.value) || 0 })} />
          </label>
          <label>
            {t.settings.currency} <Tooltip text={t.settings.currencyTip} />
            <input type="text" maxLength={3} value={s.currency} onChange={(e) => setSettings({ currency: e.target.value.toUpperCase() })} />
          </label>
        </article>
        <article className="card prose-card">
          <h2>{t.settings.logicTitle}</h2>
          <p>{t.settings.logicP1}</p>
          <p>{t.settings.logicP2}</p>
          <p>{t.settings.logicP3}</p>
          <p>{t.settings.logicP4}</p>
        </article>
      </div>
    </section>
  );
}
