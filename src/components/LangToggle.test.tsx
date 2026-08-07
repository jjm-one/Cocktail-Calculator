import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LangToggle } from './LangToggle';
import { UI_LANG_KEY } from '../lib/state';

function LocationDisplay() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/:lang/*"
          element={
            <>
              <LangToggle />
              <LocationDisplay />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LangToggle', () => {
  it('marks the language matching the current route as active', () => {
    renderAt('/de/recipes');
    expect(screen.getByRole('button', { name: 'DE' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches the language segment of the current path and persists the choice', async () => {
    renderAt('/de/recipes');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/en/recipes');
    expect(localStorage.getItem(UI_LANG_KEY)).toBe('en');
  });

  it('does nothing when clicking the already-active language', async () => {
    renderAt('/de/recipes');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'DE' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/de/recipes');
    expect(localStorage.getItem(UI_LANG_KEY)).toBeNull();
  });

  it('preserves the rest of the path when switching language on a deep route', async () => {
    renderAt('/en/purchases');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'DE' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/de/purchases');
  });
});
