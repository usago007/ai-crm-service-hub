import type { ReactNode } from 'react';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import { PanelCard, PageHeader as BasePageHeader, StatCard as BaseStatCard } from '../../components/common/PageChrome';

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <BasePageHeader eyebrow="AI workspace" title={title} description={description} actions={actions} />;
}

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return <PanelCard eyebrow={title} className="p-5">{children}</PanelCard>;
}

export function StatCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'green' | 'yellow' | 'red';
}) {
  return <BaseStatCard label={label} value={value} detail={detail} tone={tone} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

export function InlineAction({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button variant="ghost" size="sm" onClick={onClick}>{label}</Button>;
}

export function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.68)] p-3.5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)]">{label}</div>
      <div className="text-[13px] font-medium mt-2 leading-5">{value}</div>
    </div>
  );
}

export function PromptBlock({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] rounded-[20px] p-4 text-xs ${className}`}>
      <div className="text-[var(--color-text-light)] uppercase tracking-[0.16em] font-semibold mb-2 text-[11px]">{label}</div>
      <div className="leading-6 whitespace-pre-wrap">{value}</div>
    </div>
  );
}

export function PromptListBlock({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] rounded-[20px] p-4 text-xs">
      <div className="text-[var(--color-text-light)] uppercase tracking-[0.16em] font-semibold mb-2 text-[11px]">{label}</div>
      <ul className="list-disc pl-4 space-y-1">
        {values.map(value => <li key={value}>{value}</li>)}
      </ul>
    </div>
  );
}

export { DataTable };
