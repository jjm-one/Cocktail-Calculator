import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { SUPPORTED_LANGS } from '../i18n/translations';
import { useT } from '../i18n/useLang';
import { UI_LANG_KEY } from '../lib/state';
import { Header } from './Header';
import { Footer } from './Footer';
import type { Lang } from '../lib/types';

export function Layout() {
  const { lang: rawLang } = useParams<{ lang: string }>();
  const location = useLocation();
  const { lang, t } = useT();

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.brand.name;
    localStorage.setItem(UI_LANG_KEY, lang);
  }, [lang, t.brand.name]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!SUPPORTED_LANGS.includes(rawLang as Lang)) {
    const rest = location.pathname.replace(/^\/[^/]+/, '');
    return <Navigate to={`/de${rest}`} replace />;
  }

  return (
    <div className="app-shell">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
