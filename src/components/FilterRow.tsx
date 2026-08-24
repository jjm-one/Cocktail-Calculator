export interface FilterCell {
  /** Column key to filter by. Omit to render an empty, non-filterable cell (e.g. an action column). */
  key?: string;
  label?: string;
  className?: string;
}

export function FilterRow({
  cells,
  filters,
  onChange,
}: {
  cells: FilterCell[];
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <tr className="filter-row">
      {cells.map((cell, i) =>
        cell.key ? (
          <th key={cell.key} className={cell.className}>
            <input
              type="text"
              value={filters[cell.key] || ''}
              onChange={(e) => onChange(cell.key!, e.target.value)}
              placeholder={cell.label}
              aria-label={cell.label}
              className="filter-input"
            />
          </th>
        ) : (
          <th key={i} className={cell.className} />
        ),
      )}
    </tr>
  );
}
