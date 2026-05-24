import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
}

interface FilterBarProps {
  children: ReactNode;
  align?: 'start' | 'between';
}

interface PanelCardProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}

export const inputCls =
  'h-11 border border-[var(--color-border-strong)] rounded-[16px] px-3.5 text-[13px] bg-[rgba(255,255,255,0.84)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none focus:border-[rgba(179,92,32,0.34)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(179,92,32,0.10)] w-full transition-all duration-200 text-[var(--color-text)]';

export function PageHeader({ eyebrow = 'Operations workspace', title, description, actions, aside }: PageHeaderProps) {
  return (
    <div className="shell-card shell-elevated rounded-[32px] px-6 py-6 relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-[320px] bg-[radial-gradient(circle_at_top_right,rgba(179,92,32,0.16),transparent_58%)] pointer-events-none" />
      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 max-w-[780px]">
          <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-text-light)] mb-3">{eyebrow}</div>
          <h1 className="text-[32px] leading-[1.02] font-semibold tracking-[-0.04em] text-[var(--color-text)] text-balance">
            {title}
          </h1>
          <p className="text-[14px] leading-6 text-[var(--color-text-secondary)] mt-3 max-w-[70ch] text-pretty">
            {description}
          </p>
        </div>
        {actions ? <div className="relative flex items-center gap-2 flex-wrap">{actions}</div> : null}
      </div>
      {aside ? <div className="relative mt-5">{aside}</div> : null}
    </div>
  );
}

export function FilterBar({ children, align = 'start' }: FilterBarProps) {
  return (
    <div
      className={`shell-card rounded-[24px] px-4 py-3.5 flex gap-2.5 flex-wrap ${
        align === 'between' ? 'items-start justify-between' : 'items-center'
      }`}
    >
      {children}
    </div>
  );
}

export function PanelCard({ title, eyebrow, description, actions, children, className = '' }: PanelCardProps) {
  return (
    <section className={`shell-card rounded-[24px] p-5 ${className}`}>
      {(title || eyebrow || description || actions) ? (
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            {eyebrow ? <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-light)] mb-1.5">{eyebrow}</div> : null}
            {title ? <div className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--color-text)]">{title}</div> : null}
            {description ? <div className="text-[12px] text-[var(--color-text-secondary)] mt-1 leading-5 max-w-[64ch]">{description}</div> : null}
          </div>
          {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function DetailPanel({ title, description, children, actions, className = '' }: Omit<PanelCardProps, 'eyebrow'>) {
  return (
    <PanelCard
      title={title}
      description={description}
      actions={actions}
      className={`sticky top-4 ${className}`}
    >
      {children}
    </PanelCard>
  );
}

export function EmptyState({ title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div
      className={`rounded-[22px] border border-dashed border-[var(--color-border-strong)] bg-[rgba(255,255,255,0.45)] text-center ${
        compact ? 'px-4 py-6' : 'px-6 py-10'
      }`}
    >
      <div className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--color-text)]">{title}</div>
      <div className="text-[13px] text-[var(--color-text-secondary)] mt-2 max-w-[48ch] mx-auto leading-6">{description}</div>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'green' | 'yellow' | 'red';
}) {
  const toneClass =
    tone === 'success' || tone === 'green'
      ? 'text-[var(--color-success)]'
      : tone === 'warning' || tone === 'yellow'
      ? 'text-[var(--color-warning)]'
      : tone === 'danger' || tone === 'red'
      ? 'text-[var(--color-danger)]'
      : 'text-[var(--color-text)]';

  return (
    <div className="shell-card rounded-[22px] p-4 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,rgba(179,92,32,0.72),rgba(45,107,93,0.46),transparent)]" />
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-light)] mb-2">{label}</div>
      <div className={`text-[30px] leading-none font-semibold tracking-[-0.04em] ${toneClass}`}>{value}</div>
      <div className="text-[12px] leading-5 text-[var(--color-text-secondary)] mt-2">{detail}</div>
    </div>
  );
}
