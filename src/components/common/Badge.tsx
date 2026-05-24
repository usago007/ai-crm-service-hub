import type { ReactNode } from 'react';

export type BadgeVariant = 'blue' | 'purple' | 'orange' | 'yellow' | 'green' | 'red' | 'gray' | 'ai' | 'success' | 'danger' | 'info';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  blue: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[rgba(47,110,167,0.16)]',
  purple: 'bg-[var(--color-purple-bg)] text-[var(--color-purple)] border border-[rgba(94,95,177,0.16)]',
  orange: 'bg-[#fff2e4] text-[#b46417] border border-[rgba(180,100,23,0.14)]',
  yellow: 'bg-[var(--color-warning-bg)] text-[#a75912] border border-[rgba(167,89,18,0.14)]',
  green: 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[rgba(31,143,103,0.15)]',
  red: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border border-[rgba(200,85,76,0.16)]',
  gray: 'bg-[rgba(30,38,47,0.05)] text-[var(--color-text-secondary)] border border-[var(--color-border-light)]',
  ai: 'bg-[var(--color-primary-bg)] text-[var(--color-primary)] border border-[rgba(179,92,32,0.16)]',
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[rgba(31,143,103,0.15)]',
  danger: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border border-[rgba(200,85,76,0.16)]',
  info: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[rgba(47,110,167,0.16)]',
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
      className={`inline-flex items-center px-2.5 py-1 rounded-[999px] text-[11px] font-medium gap-1 leading-none ${VARIANT_CLASSES[variant]} ${className}`}
      title={title}
    >
      {children}
    </span>
  );
}
