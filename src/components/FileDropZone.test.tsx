import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileDropZone } from './FileDropZone';

function setup() {
  const onFile = vi.fn();
  render(<FileDropZone label="CSV auswählen" hint="oder Datei hierher ziehen" accept=".csv,text/csv" onFile={onFile} />);
  return { onFile };
}

describe('FileDropZone', () => {
  it('renders the label, hint and an accessible hidden file input', () => {
    setup();
    expect(screen.getByText('CSV auswählen')).toBeInTheDocument();
    expect(screen.getByText('oder Datei hierher ziehen')).toBeInTheDocument();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toHaveAttribute('accept', '.csv,text/csv');
  });

  it('calls onFile when a file is chosen via the input', async () => {
    const { onFile } = setup();
    const user = userEvent.setup();
    const file = new File(['a;b\n1;2'], 'prices.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    expect(onFile).toHaveBeenCalledTimes(1);
    expect(onFile.mock.calls[0][0].name).toBe('prices.csv');
  });

  it('shows drag feedback on dragenter/dragover and clears it on dragleave', () => {
    setup();
    const zone = screen.getByText('CSV auswählen').closest('label')!;
    expect(zone).not.toHaveClass('is-dragging');

    fireEvent.dragEnter(zone);
    expect(zone).toHaveClass('is-dragging');

    fireEvent.dragLeave(zone);
    expect(zone).not.toHaveClass('is-dragging');
  });

  it('calls onFile with the dropped file and clears the drag state', () => {
    const { onFile } = setup();
    const zone = screen.getByText('CSV auswählen').closest('label')!;
    const file = new File(['a;b\n1;2'], 'dropped.csv', { type: 'text/csv' });

    fireEvent.dragEnter(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });

    expect(onFile).toHaveBeenCalledTimes(1);
    expect(onFile.mock.calls[0][0].name).toBe('dropped.csv');
    expect(zone).not.toHaveClass('is-dragging');
  });
});
