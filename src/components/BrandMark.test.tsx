import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandMark } from './BrandMark';

describe('BrandMark', () => {
  it('renders an accessible image with the default size', () => {
    render(<BrandMark />);
    const svg = screen.getByRole('img', { name: 'jjm.one' });
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '28');
    expect(svg).toHaveAttribute('height', '28');
  });

  it('applies a custom size and class name', () => {
    render(<BrandMark size={14} className="footer-mark" />);
    const svg = screen.getByRole('img', { name: 'jjm.one' });
    expect(svg).toHaveAttribute('width', '14');
    expect(svg).toHaveAttribute('height', '14');
    expect(svg).toHaveClass('footer-mark');
  });
});
