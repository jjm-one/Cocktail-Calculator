import { Link } from 'react-router-dom';
import { useT } from '../i18n/useLang';

export default function LandingPage() {
  const { lang, t } = useT();

  return (
    <section className="landing">
      <article className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">{t.landing.eyebrow}</p>
          <h1>{t.landing.title}</h1>
          <p>{t.landing.subtitle}</p>
          <div className="landing-actions">
            <Link to={`/${lang}/planning`} className="btn primary">
              {t.landing.primary}
            </Link>
            <Link to={`/${lang}/recipes`} className="btn">
              {t.landing.secondary}
            </Link>
            <Link to={`/${lang}/purchases`} className="btn">
              {t.landing.tertiary}
            </Link>
          </div>
        </div>
        <div className="landing-visual" aria-hidden="true">
          <span className="landing-glass">🍸</span>
        </div>
      </article>

      <div className="feature-strip">
        <article>
          <strong>{t.landing.featureLocalTitle}</strong>
          <span>{t.landing.featureLocalBody}</span>
        </article>
        <article>
          <strong>{t.landing.featureScaleTitle}</strong>
          <span>{t.landing.featureScaleBody}</span>
        </article>
        <article>
          <strong>{t.landing.featureProfitTitle}</strong>
          <span>{t.landing.featureProfitBody}</span>
        </article>
      </div>

      <Link to={`/${lang}/dashboard`} className="btn primary landing-dashboard-cta">
        {t.landing.dashboardCta}
      </Link>
    </section>
  );
}
