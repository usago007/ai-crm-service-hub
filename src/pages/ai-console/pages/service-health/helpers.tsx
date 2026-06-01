import { Badge } from '../../../../components/common/Badge';
import type { ServiceHealthStatus } from '../../../../types';
import { healthBadgeVariant, healthStatusLabel } from './helperLabels';

export function StatusPill({ status, text }: { status: ServiceHealthStatus; text?: string }) {
  return <Badge variant={healthBadgeVariant(status)} className="rounded-[12px] px-3 py-1.5 text-[11px]">{text ?? healthStatusLabel(status)}</Badge>;
}

export function DependencyNode({ label, status, size = 'md' }: { label: string; status: ServiceHealthStatus; size?: 'sm' | 'md' }) {
  const colors = status === 'healthy'
    ? 'border-[var(--color-success)] bg-[rgba(5,150,105,0.08)] text-[var(--color-success)]'
    : status === 'degraded'
    ? 'border-[#b46417] bg-[rgba(180,100,23,0.08)] text-[#b46417]'
    : 'border-[var(--color-danger)] bg-[rgba(239,68,68,0.08)] text-[var(--color-danger)]';
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-[14px] border px-3 py-2 ${colors} ${size === 'sm' ? 'text-xs' : 'text-sm font-medium'}`}>
      <div className={`rounded-full ${status === 'healthy' ? 'bg-[var(--color-success)]' : status === 'degraded' ? 'bg-[#b46417]' : 'bg-[var(--color-danger)]'} ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
      {label}
    </div>
  );
}

export function SurfaceCard({
  title,
  meta,
  action,
  children,
  className = '',
}: {
  title: string;
  meta?: string[];
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`shell-card rounded-[28px] p-5 relative overflow-hidden ${className}`}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,rgba(179,92,32,0.82),rgba(45,107,93,0.52),transparent)]" />
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--color-text)]">{title}</div>
          {meta?.length ? (
            <div className="mt-2 space-y-1">
              {meta.map(item => (
                <div key={item} className="text-xs text-[var(--color-text-secondary)]">{item}</div>
              ))}
            </div>
          ) : null}
        </div>
        {action ? <div className="flex items-center gap-2 shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function KeyNumber({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-[var(--color-success)]'
      : tone === 'warning'
      ? 'text-[var(--color-warning)]'
      : tone === 'danger'
      ? 'text-[var(--color-danger)]'
      : 'text-[var(--color-text)]';

  return (
    <div className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.62)] px-4 py-4 min-h-[106px]">
      <div className="text-[11px] tracking-[0.16em] uppercase text-[var(--color-text-light)]">{label}</div>
      <div className={`mt-4 text-[34px] leading-none font-semibold tracking-[-0.05em] ${toneClass}`}>{value}</div>
    </div>
  );
}

export function FactGrid({
  items,
  columns = 2,
}: {
  items: Array<{ label: string; value: string }>;
  columns?: 2 | 3;
}) {
  return (
    <div className={`grid gap-3 ${columns === 3 ? 'grid-cols-3 max-[1200px]:grid-cols-2 max-[720px]:grid-cols-1' : 'grid-cols-2 max-[900px]:grid-cols-1'}`}>
      {items.map(item => (
        <div key={item.label} className="rounded-[20px] bg-[rgba(255,255,255,0.58)] border border-[var(--color-border-light)] px-4 py-3">
          <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--color-text-light)]">{item.label}</div>
          <div className="mt-2 text-[15px] font-medium leading-5 text-[var(--color-text)]">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
