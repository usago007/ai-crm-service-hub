import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 min-h-0">
      {children}
    </div>
  );
}
