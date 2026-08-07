import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useT } from '../i18n/useLang';
import { LangToggle } from './LangToggle';
import { NavMenu } from './NavMenu';

export function Header() {
  const { lang, t } = useT();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="site-header">
      <div className="site-header-row">
        <Link to={`/${lang}`} className="brand">
          <span className="brand-mark" aria-hidden="true">🍸</span>
          <span className="brand-name">{t.brand.name}</span>
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="menu-toggle-bars" aria-hidden="true" />
          <span className="sr-only">{t.nav.menu}</span>
        </button>

        <div id="primary-nav" className={`site-header-nav${menuOpen ? ' is-open' : ''}`}>
          <NavMenu onNavigate={() => setMenuOpen(false)} />
          <LangToggle />
        </div>
      </div>
    </header>
  );
}
