import type { AnalyticsData } from '../types';
import { PanelCard, StatCard, SummaryHeader } from '../components/common/PageChrome';

interface AnalyticsProps {
  analytics: AnalyticsData;
}

export function Analytics({ analytics }: AnalyticsProps) {
  return (
    <div className="space-y-4">
      <SummaryHeader
        aside={
          <div className="grid grid-cols-4 gap-3.5 max-[1400px]:grid-cols-2">
            {analytics.metrics.map(metric => (
              <StatCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                detail={`${metric.trend} ${metric.subtitle}`}
                tone={metric.direction === 'up' ? 'success' : 'warning'}
              />
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 max-[1200px]:grid-cols-1">
        <MetricList title="工单效率" items={analytics.ticketVolume.labels.map((label, index) => ({ label, value: String(analytics.ticketVolume.values[index]), color: 'var(--color-primary)' }))} />
        <MetricList title="审核压力" items={analytics.manualReviewBreakdown.map(item => ({ label: item.label, value: `${item.pct}%`, color: 'var(--color-warning)' }))} />
        <MetricList title="AI 建议采纳" items={analytics.aiAdoptionTrend.map(item => ({ label: item.label, value: `${item.value}%`, color: 'var(--color-success)' }))} />
        <MetricList title="知识健康度" items={analytics.topFAQ.map(item => ({ label: item.label, value: String(item.count), color: 'var(--color-primary)' }))} />
        <MetricList title="客户风险分布" items={analytics.issueDist.map(item => ({ label: item.label, value: `${item.value}%`, color: item.color }))} />
        <MetricList title="渠道负载" items={analytics.channelDist.map(item => ({ label: item.label, value: `${item.value}%`, color: item.color }))} />
      </div>
    </div>
  );
}

function MetricList({ title, items }: { title: string; items: { label: string; value: string; color: string }[] }) {
  return (
    <PanelCard title={title}>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-2 text-xs rounded-[16px] bg-[rgba(255,255,255,0.45)] px-3 py-2">
            <span className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ background: item.color }} />
            <span>{item.label}</span>
            <span className="ml-auto font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}
