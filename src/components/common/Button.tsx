import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-[linear-gradient(135deg,#b35c20_0%,#d9863a_100%)] text-white shadow-[0_16px_32px_-20px_rgba(179,92,32,0.68)] border-transparent',
  secondary: 'bg-[rgba(255,255,255,0.82)] text-[var(--color-text)] border-[var(--color-border-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] hover:bg-white hover:border-[rgba(179,92,32,0.24)]',
  success: 'bg-[linear-gradient(135deg,#1f8f67_0%,#33ab7f_100%)] text-white shadow-[0_16px_32px_-20px_rgba(31,143,103,0.58)] border-transparent',
  danger: 'bg-[linear-gradient(135deg,#c8554c_0%,#df7067_100%)] text-white shadow-[0_16px_32px_-20px_rgba(200,85,76,0.56)] border-transparent',
  warning: 'bg-[linear-gradient(135deg,#bb6a1f_0%,#dd8c43_100%)] text-white shadow-[0_16px_32px_-20px_rgba(187,106,31,0.58)] border-transparent',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] border-transparent hover:bg-[rgba(30,38,47,0.05)] hover:text-[var(--color-text)]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'icon';
  loading?: boolean;
}

export function Button({ children, variant = 'primary', size = 'md', className = '', loading = false, disabled, ...props }: ButtonProps) {
  const sizeClass =
    size === 'sm'
      ? 'min-h-[34px] px-3 py-1.5 text-xs rounded-[12px]'
      : size === 'icon'
      ? 'size-10 p-0 rounded-[14px]'
      : 'min-h-10 px-4 py-2 text-[13px] rounded-[14px]';

  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 border font-medium cursor-pointer transition-all duration-[var(--transition)] font-[var(--font-family-sans)] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px] active:translate-y-[1px] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(179,92,32,0.16)] focus-visible:border-[rgba(179,92,32,0.34)] ${VARIANT_CLASSES[variant]} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="size-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
