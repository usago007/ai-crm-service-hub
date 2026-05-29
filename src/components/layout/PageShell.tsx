import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 min-h-0">
      <div className="max-w-[1460px] mx-auto pt-6">
        {children}
      </div>
    </div>
  );
}
