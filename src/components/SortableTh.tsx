import type { ReactNode } from 'react';
import type { SortState } from '../hooks/useSortFilter';

export function SortableTh({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: ReactNode;
  sortKey: string;
  sort: SortState | null;
  onSort: (key: string) => void;
  className?: string;
}) {
  const active = sort?.key === sortKey;
  const dir = active ? sort!.dir : null;
  return (
    <th className={className} aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}>
      <button type="button" className={`th-sort${active ? ' is-active' : ''}`} onClick={() => onSort(sortKey)}>
        <span>{label}</span>
        <span className="th-sort-icon" aria-hidden="true">
          {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '⇅'}
        </span>
      </button>
    </th>
  );
}
