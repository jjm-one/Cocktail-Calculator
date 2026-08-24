import { NavLink } from 'react-router-dom';
import { useT } from '../i18n/useLang';

interface NavMenuProps {
  onNavigate?: () => void;
}

export function NavMenu({ onNavigate }: NavMenuProps) {
  const { lang, t } = useT();

  const items: { to: string; label: string; end?: boolean }[] = [
    { to: `/${lang}`, label: t.nav.home, end: true },
    { to: `/${lang}/dashboard`, label: t.nav.dashboard },
    { to: `/${lang}/purchases`, label: t.nav.purchases },
    { to: `/${lang}/recipes`, label: t.nav.recipes },
    { to: `/${lang}/planning`, label: t.nav.planning },
    { to: `/${lang}/calculation`, label: t.nav.calculation },
    { to: `/${lang}/data`, label: t.nav.data },
    { to: `/${lang}/settings`, label: t.nav.settings },
    { to: `/${lang}/help`, label: t.nav.help },
  ];

  return (
    <nav className="nav-menu" aria-label={t.nav.menu}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
          onClick={onNavigate}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
