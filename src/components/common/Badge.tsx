import type { ReactNode } from 'react';

type BadgeVariant = 'blue' | 'purple' | 'orange' | 'yellow' | 'green' | 'red' | 'gray' | 'ai' | 'success' | 'danger' | 'info';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  blue: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
  purple: 'bg-[var(--color-purple-bg)] text-[var(--color-purple)]',
  orange: 'bg-[#FFF7ED] text-[#EA580C]',
  yellow: 'bg-[var(--color-warning-bg)] text-[#B45309]',
  green: 'bg-[var(--color-success-bg)] text-[#059669]',
  red: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
  gray: 'bg-[#F3F4F6] text-[var(--color-text-secondary)]',
  ai: 'bg-[rgba(108,92,231,0.12)] text-[var(--color-primary)]',
  success: 'bg-[var(--color-success-bg)] text-[#059669]',
  danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
  info: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  title?: string;
}

export function Badge({ children, variant = 'gray', className = '', title }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[10px] text-[11px] font-medium gap-1 ${VARIANT_CLASSES[variant]} ${className}`}
      title={title}
    >
      {children}
    </span>
  );
}
