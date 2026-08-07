import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from './Toast';

function Consumer() {
  const { showToast } = useToast();
  return (
    <>
      <button onClick={() => showToast('Gespeichert')}>show A</button>
      <button onClick={() => showToast('Zweite Meldung')}>show B</button>
    </>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders an empty, hidden status region by default', () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');
    expect(status).not.toHaveClass('toast-show');
  });

  it('shows the message immediately after showToast is called', () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('show A'));
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Gespeichert');
    expect(status).toHaveClass('toast-show');
  });

  it('hides the message again after the timeout elapses', () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('show A'));
    act(() => {
      vi.advanceTimersByTime(2200);
    });
    const status = screen.getByRole('status');
    expect(status).not.toHaveClass('toast-show');
  });

  it('restarts the hide timer when a second toast is shown before the first expires', () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('show A'));
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    fireEvent.click(screen.getByText('show B'));
    act(() => {
      vi.advanceTimersByTime(1500); // 3000ms since the first call, but only 1500ms since the second
    });
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Zweite Meldung');
    expect(status).toHaveClass('toast-show');
  });

  it('useToast throws when used outside a ToastProvider', () => {
    const Broken = () => {
      useToast();
      return null;
    };
    // Suppress the expected React error boundary console noise for this assertion.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Broken />)).toThrow('useToast must be used within ToastProvider');
    spy.mockRestore();
  });
});
