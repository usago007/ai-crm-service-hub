import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  aside?: ReactNode;
}

interface SummaryHeaderProps {
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
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
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export const inputCls =
  'h-11 border border-[var(--color-border-strong)] rounded-[16px] px-3.5 text-[13px] bg-[rgba(255,255,255,0.84)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none focus:border-[rgba(179,92,32,0.34)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(179,92,32,0.10)] w-full transition-all duration-200 text-[var(--color-text)]';

export function PageHeader({ title, actions, aside }: PageHeaderProps) {
  void title;
  if (!actions && !aside) return null;

  return (
    <div className="shell-card shell-elevated rounded-[32px] px-6 py-6 relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-[320px] bg-[radial-gradient(circle_at_top_right,rgba(179,92,32,0.16),transparent_58%)] pointer-events-none" />
      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        {actions ? <div className="relative flex items-center gap-2 flex-wrap">{actions}</div> : null}
      </div>
      {aside ? <div className="relative mt-5">{aside}</div> : null}
    </div>
  );
}

export function SummaryHeader({ actions, aside, className = '' }: SummaryHeaderProps) {
  return (
    <div className={`shell-card shell-elevated rounded-[32px] px-6 py-5 relative overflow-hidden ${className}`}>
      <div className="absolute inset-y-0 right-0 w-[320px] bg-[radial-gradient(circle_at_top_right,rgba(179,92,32,0.16),transparent_58%)] pointer-events-none" />
      {(actions || aside) ? (
        <div className="relative space-y-4">
          {actions ? <div className="flex items-center justify-end gap-2 flex-wrap">{actions}</div> : null}
          {aside ? <div>{aside}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

export function FilterBar({ children, align = 'start' }: FilterBarProps) {
  return (
    <div
      className={`shell-card rounded-[24px] px-4 py-3.5 grid gap-3 [&>*]:min-w-0 [&>.filter-actions]:flex [&>.filter-actions]:items-center [&>.filter-actions]:justify-end [&>.filter-compact-actions]:flex [&>.filter-compact-actions]:items-center [&>.filter-compact-actions]:gap-3 [&>.filter-span-2]:xl:col-span-2 [&>.filter-span-full]:xl:col-span-4 ${
        align === 'between'
          ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-start'
          : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-center'
      }`}
    >
      {children}
    </div>
  );
}

export function PanelCard({ title, eyebrow, actions, children, className = '' }: PanelCardProps) {
  return (
    <section className={`shell-card rounded-[24px] p-5 ${className}`}>
      {(title || eyebrow || actions) ? (
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            {eyebrow ? <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-light)] mb-1.5">{eyebrow}</div> : null}
            {title ? <div className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--color-text)]">{title}</div> : null}
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

export function EmptyState({ title, action, compact = false }: EmptyStateProps) {
  return (
    <div
      className={`rounded-[22px] border border-dashed border-[var(--color-border-strong)] bg-[rgba(255,255,255,0.45)] text-center ${
        compact ? 'px-4 py-6' : 'px-6 py-10'
      }`}
    >
      <div className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--color-text)]">{title}</div>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
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
    </div>
  );
}
