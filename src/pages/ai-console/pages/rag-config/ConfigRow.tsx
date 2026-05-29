import type { ReactNode } from 'react';

interface ConfigRowProps {
  title: string;
  description: string;
  children: ReactNode;
  modified?: boolean;
}

export function ConfigRow({ title, description, children, modified = false }: ConfigRowProps) {
  return (
    <div className={`flex items-center justify-start gap-8 py-3.5 px-4 border-b border-[var(--color-border-light)] ${modified ? 'border-l-2 border-[var(--color-warning)] pl-[14px] bg-[rgba(187,106,31,0.03)]' : 'border-l-2 border-transparent pl-[14px]'}`}>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-[var(--color-text)]">{title}</div>
        <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-4">{description}</div>
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}
