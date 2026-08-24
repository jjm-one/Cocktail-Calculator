import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MissingItemsBanner } from './MissingItemsBanner';
import { useAppState } from '../state/AppStateContext';
import type { OrderRow } from '../lib/types';

vi.mock('../state/AppStateContext', () => ({
  useAppState: vi.fn(),
}));

const mockedUseAppState = vi.mocked(useAppState);

function makeOrderRow(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    ingredient: 'Vodka',
    requiredMl: 500,
    netRequiredMl: 500,
    stockMl: 0,
    purchase: null,
    bottles: 0,
    cases: 0,
    chargedBottles: 0,
    orderedMl: 0,
    surplusMl: 0,
    surplusValue: 0,
    orderCostGross: 0,
    orderCostNet: 0,
    orderCostGrossNoStock: 0,
    missing: true,
    ...overrides,
  };
}

function setComputed(orderRows: OrderRow[]) {
  // Only `computed.orderRows` is read by this component; the rest of the
  // context value is irrelevant to it.
  mockedUseAppState.mockReturnValue({ computed: { orderRows } } as unknown as ReturnType<typeof useAppState>);
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:lang/*" element={<MissingItemsBanner />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MissingItemsBanner', () => {
  it('renders nothing when there are no missing ingredients', () => {
    setComputed([makeOrderRow({ missing: false, purchase: { id: 'p1' } as never })]);
    const { container } = renderAt('/de/planning');
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a missing ingredient that has no actual requirement', () => {
    setComputed([makeOrderRow({ missing: true, requiredMl: 0 })]);
    const { container } = renderAt('/de/planning');
    expect(container).toBeEmptyDOMElement();
  });

  it('lists the missing ingredients and links to the purchases page', () => {
    setComputed([makeOrderRow({ ingredient: 'Vodka' }), makeOrderRow({ ingredient: 'Gin' })]);
    renderAt('/de/planning');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Vodka');
    expect(alert).toHaveTextContent('Gin');
    expect(screen.getByRole('link')).toHaveAttribute('href', '/de/purchases');
  });

  it('keeps the current language in the purchases link', () => {
    setComputed([makeOrderRow()]);
    renderAt('/en/planning');
    expect(screen.getByRole('link')).toHaveAttribute('href', '/en/purchases');
  });
});
