import React, { useMemo, useState } from 'react';
import { TableCell, TableSortLabel, type SxProps, type Theme } from '@mui/material';

export type SortDirection = 'asc' | 'desc';
type SortValue = string | number | null | undefined;
export type SortAccessors<T> = Record<string, (row: T) => SortValue>;

/**
 * Client-side sorting for the admin tables. Stable accessors live at module
 * scope so the memo only recalculates when rows or the sort actually change.
 */
export function useTableSort<T>(
  rows: T[],
  accessors: SortAccessors<T>,
  initialKey = '',
  initialOrder: SortDirection = 'asc',
) {
  const [order, setOrder] = useState<SortDirection>(initialOrder);
  const [orderBy, setOrderBy] = useState(initialKey);

  const sorted = useMemo(() => {
    const read = orderBy ? accessors[orderBy] : undefined;
    if (!read) return rows;
    const factor = order === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = read(a);
      const bv = read(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) * factor;
    });
  }, [rows, order, orderBy, accessors]);

  const toggle = (key: string) => {
    if (key === orderBy) {
      setOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(key);
      setOrder('asc');
    }
  };

  return { sorted, order, orderBy, toggle };
}

type SortableHeadCellProps = {
  label: string;
  sortKey: string;
  order: SortDirection;
  activeKey: string;
  onSort: (key: string) => void;
  sx?: SxProps<Theme>;
};

/** Table head cell with a gold sort affordance and accessible labels. */
export const SortableHeadCell: React.FC<SortableHeadCellProps> = ({
  label,
  sortKey,
  order,
  activeKey,
  onSort,
  sx,
}) => {
  const active = activeKey === sortKey;
  const ariaSort = active ? (order === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <TableCell sortDirection={active ? order : false} scope="col" aria-sort={ariaSort} sx={sx}>
      <TableSortLabel
        active={active}
        direction={active ? order : 'asc'}
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}`}
        sx={{ fontWeight: 700, width: 'max-content', '& .MuiTableSortLabel-icon': { fontSize: 16 } }}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );
};
