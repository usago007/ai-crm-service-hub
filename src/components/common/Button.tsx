import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[#5A4BD6]',
  secondary: 'bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-border-light)] hover:border-[#D1D5DB]',
  success: 'bg-[var(--color-success)] text-white hover:bg-[#059669]',
  danger: 'bg-[var(--color-danger)] text-white hover:bg-[#DC2626]',
  warning: 'bg-[var(--color-warning)] text-white hover:bg-[#D97706]',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const sizeClass = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-1.5 text-[13px]';
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] font-medium cursor-pointer border-none transition-all duration-[var(--transition)] font-[var(--font-family-sans)] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
