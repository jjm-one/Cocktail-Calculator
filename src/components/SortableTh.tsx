import type { ReactNode } from 'react';
import type { SortState } from '../hooks/useSortFilter';
import { Tooltip } from './Tooltip';

export function SortableTh({
  label,
  tooltip,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: ReactNode;
  tooltip?: string;
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
      {tooltip && <Tooltip text={tooltip} />}
    </th>
  );
}
