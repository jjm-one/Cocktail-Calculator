import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NavMenu } from './NavMenu';

function renderAt(path: string, onNavigate?: () => void) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:lang/*" element={<NavMenu onNavigate={onNavigate} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('NavMenu', () => {
  it('renders a link for every section with a language-prefixed href', () => {
    renderAt('/de/dashboard');
    expect(screen.getByRole('link', { name: 'Start' })).toHaveAttribute('href', '/de');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/de/dashboard');
    expect(screen.getByRole('link', { name: 'EK-Posten' })).toHaveAttribute('href', '/de/purchases');
    expect(screen.getByRole('link', { name: 'Rezepte' })).toHaveAttribute('href', '/de/recipes');
    expect(screen.getByRole('link', { name: 'Planung' })).toHaveAttribute('href', '/de/planning');
    expect(screen.getByRole('link', { name: 'Kalkulation' })).toHaveAttribute('href', '/de/calculation');
    expect(screen.getByRole('link', { name: 'Daten' })).toHaveAttribute('href', '/de/data');
    expect(screen.getByRole('link', { name: 'Einstellungen' })).toHaveAttribute('href', '/de/settings');
    expect(screen.getByRole('link', { name: 'Hilfe' })).toHaveAttribute('href', '/de/help');
  });

  it('uses English labels and hrefs under /en', () => {
    renderAt('/en/dashboard');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/en/dashboard');
    expect(screen.getByRole('link', { name: 'Purchases' })).toHaveAttribute('href', '/en/purchases');
  });

  it('marks only the link matching the current route as active', () => {
    renderAt('/de/recipes');
    expect(screen.getByRole('link', { name: 'Rezepte' })).toHaveClass('is-active');
    expect(screen.getByRole('link', { name: 'Start' })).not.toHaveClass('is-active');
    expect(screen.getByRole('link', { name: 'Planung' })).not.toHaveClass('is-active');
  });

  it('marks the home link active for the exact index route', () => {
    renderAt('/de');
    expect(screen.getByRole('link', { name: 'Start' })).toHaveClass('is-active');
  });

  it('does not mark the home link active for a nested route', () => {
    renderAt('/de/planning');
    expect(screen.getByRole('link', { name: 'Start' })).not.toHaveClass('is-active');
  });

  it('calls onNavigate when a link is clicked', async () => {
    const onNavigate = vi.fn();
    renderAt('/de/dashboard', onNavigate);
    const user = userEvent.setup();

    await user.click(screen.getByRole('link', { name: 'Rezepte' }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
