import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  borderLeft?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, title, borderLeft, className = '', style }: CardProps) {
  return (
    <div
      className={`shell-card rounded-[24px] p-5 mb-4 ${className}`}
      style={{ ...(borderLeft ? { borderLeft: `3px solid ${borderLeft}` } : {}), ...style }}
    >
      {title && <div className="text-sm font-semibold mb-3 flex items-center gap-2 tracking-[-0.02em]">{title}</div>}
      {children}
    </div>
  );
}
