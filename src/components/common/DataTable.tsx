import React, { type ReactNode } from 'react';
import { EmptyState } from './PageChrome';

interface Column {
  key: string;
  label: string;
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  children: ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function DataTable({ columns, children, emptyMessage = 'No data', className = '' }: DataTableProps) {
  const hasRows = React.Children.count(children) > 0;

  return (
    <div className={`overflow-hidden shell-card rounded-[24px] ${className}`}>
      <div className="overflow-auto">
      <table className="w-full border-collapse min-w-full">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      </div>
      {!hasRows ? <div className="p-4"><EmptyState title="暂无数据" description={emptyMessage} compact /></div> : null}
    </div>
  );
}
