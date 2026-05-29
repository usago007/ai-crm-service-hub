import { Badge } from '../../../../components/common/Badge';
import { severityBadgeVariant, severityLabel } from './helpers';
import type { ServiceHealthSeverity } from '../../../../types';

interface AnomalyItem {
  id: string;
  issue: string;
  severity: ServiceHealthSeverity;
  cause: string;
  suggestedAction: string;
  impact: string;
}

interface CriticalAnomaliesProps {
  anomalies: AnomalyItem[];
  maxItems?: number;
}

export function CriticalAnomalies({ anomalies, maxItems }: CriticalAnomaliesProps) {
  if (anomalies.length === 0) return null;

  const displayItems = maxItems ? anomalies.slice(0, maxItems) : anomalies;
  const remaining = anomalies.length - displayItems.length;

  return (
    <section id="critical-anomalies" className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--color-text)]">当前需要处理</div>
        <Badge variant="red" className="rounded-[12px] px-3 py-1.5 text-[11px]">{anomalies.length} 项</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {displayItems.map(item => (
          <article key={item.id} className="shell-card rounded-[28px] p-5 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,rgba(179,92,32,0.82),rgba(45,107,93,0.52),transparent)]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--color-text)]">{item.issue}</div>
                    <Badge variant={severityBadgeVariant(item.severity)} className="rounded-[12px] px-3 py-1.5 text-[11px]">
                      {severityLabel(item.severity)}
                    </Badge>
                  </div>
                  <div className="text-[13px] leading-6 text-[var(--color-text-secondary)]">影响范围：{item.impact}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
                <div className="rounded-[18px] bg-[rgba(255,255,255,0.72)] border border-[var(--color-border-light)] px-4 py-3">
                  <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--color-text-light)] mb-1.5">可能原因</div>
                  <div className="text-[14px] leading-6 text-[var(--color-text)]">{item.cause}</div>
                </div>
                <div className="rounded-[18px] bg-[rgba(255,255,255,0.72)] border border-[var(--color-border-light)] px-4 py-3">
                  <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--color-text-light)] mb-1.5">建议操作</div>
                  <div className="text-[14px] leading-6 text-[var(--color-text)]">{item.suggestedAction}</div>
                </div>
              </div>
            </div>
          </article>
        ))}
        {remaining > 0 && (
          <div className="text-center text-xs text-[var(--color-text-secondary)] py-2">
            还有 {remaining} 项，请查看「诊断记录」Tab 了解详情
          </div>
        )}
      </div>
    </section>
  );
}
