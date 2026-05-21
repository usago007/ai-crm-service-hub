import React, { type ReactNode } from 'react';

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
  return (
    <div className={`overflow-auto border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)] ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {React.Children.count(children) === 0 && (
        <div className="text-center py-10 text-[var(--color-text-light)]">{emptyMessage}</div>
      )}
    </div>
  );
}
