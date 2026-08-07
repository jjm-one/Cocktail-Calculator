import { useT } from '../i18n/useLang';
import { BrandMark } from './BrandMark';

export function Footer() {
  const { t } = useT();
  return (
    <footer className="site-footer">
      <a href="https://github.com/jjm-one/Cocktail-Calculator" target="_blank" rel="noreferrer">
        {t.footer.repository}
      </a>
      <span className="site-footer-sep" aria-hidden="true">·</span>
      <span>© 2026 jjm.one · LGPLv3</span>
      <a href="https://jjm.one" target="_blank" rel="noreferrer" className="footer-mark-link" aria-label="jjm.one">
        <BrandMark size={14} className="footer-mark" />
      </a>
    </footer>
  );
}
