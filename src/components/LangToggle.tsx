import { useLocation, useNavigate } from 'react-router-dom';
import { SUPPORTED_LANGS } from '../i18n/translations';
import { useLang } from '../i18n/useLang';
import { UI_LANG_KEY } from '../lib/state';
import type { Lang } from '../lib/types';

export function LangToggle() {
  const lang = useLang();
  const location = useLocation();
  const navigate = useNavigate();

  const switchTo = (target: Lang) => {
    if (target === lang) return;
    localStorage.setItem(UI_LANG_KEY, target);
    const targetPath = location.pathname.replace(/^\/(de|en)(?=\/|$)/, `/${target}`);
    navigate(`${targetPath}${location.search}`);
  };

  return (
    <div className="lang-toggle" role="group" aria-label="Sprache / Language">
      {SUPPORTED_LANGS.map((code) => (
        <button
          key={code}
          type="button"
          className={code === lang ? 'is-active' : ''}
          onClick={() => switchTo(code)}
          aria-pressed={code === lang}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
