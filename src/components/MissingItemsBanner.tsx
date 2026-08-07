import { Link } from 'react-router-dom';
import { useT } from '../i18n/useLang';
import { useAppState } from '../state/AppStateContext';

export function MissingItemsBanner() {
  const { lang, t } = useT();
  const { computed } = useAppState();
  const missing = computed.orderRows.filter((r) => r.missing && r.requiredMl > 0);

  if (missing.length === 0) return null;

  return (
    <div className="alert-banner" role="alert">
      <span className="alert-banner-icon" aria-hidden="true">
        ⚠
      </span>
      <div className="alert-banner-body">
        <strong>{t.alerts.missingTitle}</strong>
        <p>
          {t.alerts.missingBody(missing.map((m) => m.ingredient).join(', '))}{' '}
          <Link to={`/${lang}/purchases`}>{t.alerts.missingCta}</Link>
        </p>
      </div>
    </div>
  );
}
