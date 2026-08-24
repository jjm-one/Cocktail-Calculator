import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: string;
  dir: SortDir;
}

export interface ColumnSpec<T> {
  key: string;
  /** Value compared when sorting by this column. Omit for non-sortable columns. */
  sortValue?: (row: T) => string | number;
  /** Text matched against the column's filter input. Omit for non-filterable columns. */
  filterValue?: (row: T) => string;
}

export function useSortFilter<T>(rows: T[], columns: ColumnSpec<T>[]) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const byKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => {
      if (!value) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

  const clearFilters = () => setFilters({});
  const hasFilters = Object.values(filters).some((v) => v.trim() !== '');

  const filteredSortedRows = useMemo(() => {
    let out = rows;
    const entries = Object.entries(filters).filter(([, v]) => v.trim() !== '');
    if (entries.length) {
      out = out.filter((row) =>
        entries.every(([key, value]) => {
          const col = byKey.get(key);
          if (!col?.filterValue) return true;
          return col.filterValue(row).toLowerCase().includes(value.trim().toLowerCase());
        }),
      );
    }
    if (sort) {
      const col = byKey.get(sort.key);
      if (col?.sortValue) {
        const dir = sort.dir === 'asc' ? 1 : -1;
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          const cmp =
            typeof av === 'number' && typeof bv === 'number'
              ? av - bv
              : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
          return cmp * dir;
        });
      }
    }
    return out;
  }, [rows, filters, sort, byKey]);

  return { rows: filteredSortedRows, sort, toggleSort, filters, setFilter, clearFilters, hasFilters };
}
