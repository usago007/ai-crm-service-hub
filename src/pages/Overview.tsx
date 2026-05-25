import type { ReactNode } from 'react';
import { ArrowRight, BookOpen, Bot, CheckSquare, MessageSquare, Package, Scale, TicketCheck, Users } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState, PanelCard, StatCard } from '../components/common/PageChrome';
import type { AnalyticsData, OverviewNavigationTarget, OverviewSnapshot } from '../types';

interface OverviewProps {
  overview: OverviewSnapshot;
  onOpenTarget: (target: OverviewNavigationTarget) => void;
}

const shortcutIconMap = {
  'shortcut-service': MessageSquare,
  'shortcut-tickets': TicketCheck,
  'shortcut-tasks': CheckSquare,
  'shortcut-customers': Users,
  'shortcut-orders': Package,
  'shortcut-knowledge': BookOpen,
  'shortcut-rag': Bot,
  'shortcut-audit': Scale,
} as const;

export function Overview({ overview, onOpenTarget }: OverviewProps) {
  return (
    <div className="space-y-4">
      <section className="shell-card shell-elevated rounded-[32px] px-6 py-6 relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-[320px] bg-[radial-gradient(circle_at_top_right,rgba(179,92,32,0.16),transparent_58%)] pointer-events-none" />
        <div className="relative grid grid-cols-4 gap-3 max-[1400px]:grid-cols-2 max-[720px]:grid-cols-1">
          {overview.metrics.map(metric => (
            <button
              key={metric.id}
              className="text-left"
              onClick={() => metric.target ? onOpenTarget(metric.target) : undefined}
              type="button"
            >
              <StatCard label={metric.label} value={metric.value} detail={metric.detail} tone={metric.tone} />
            </button>
          ))}
        </div>
      </section>

      <AnalyticsSection analytics={overview.analytics} />

      <section className="grid grid-cols-[1.05fr_0.95fr] gap-4 max-[1260px]:grid-cols-1">
        <PanelCard
          title="关键事件摘要"
          actions={<Button size="sm" variant="secondary" onClick={() => onOpenTarget({ page: 'ai-console-evaluation-feedback' })}>查看审计与异常</Button>}
        >
          {overview.events.length > 0 ? (
            <div className="space-y-3">
              {overview.events.map(item => (
                <button
                  key={item.id}
                  className="w-full text-left rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.62)] p-4 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bg)] transition-colors"
                  onClick={() => onOpenTarget(item.target)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold">{item.title}</div>
                      <div className="text-[13px] text-[var(--color-text-secondary)] mt-2 leading-6">{item.detail}</div>
                      <div className="text-[11px] text-[var(--color-text-light)] mt-2">{item.meta}</div>
                    </div>
                    <Badge variant={item.tone}>{badgeLabel(item.tone)}</Badge>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无关键事件" description="当前没有需要优先提升到系统总览的跨模块异常。" compact />
          )}
        </PanelCard>

        <PanelCard
          title="待办事项"
          actions={<Button size="sm" variant="secondary" onClick={() => onOpenTarget({ page: 'tasks' })}>查看全部待办</Button>}
        >
          {overview.todos.length > 0 ? (
            <div className="space-y-3">
              {overview.todos.map(item => (
                <button
                  key={item.id}
                  className="w-full text-left rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.62)] p-4 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bg)] transition-colors"
                  onClick={() => onOpenTarget(item.target)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold">{item.title}</div>
                      <div className="text-[13px] text-[var(--color-text-secondary)] mt-2 leading-6">{item.detail}</div>
                    </div>
                    <Badge variant={item.tone}>{item.badge}</Badge>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无待办" description="当前没有需要在系统总览里优先派发的处理事项。" compact />
          )}
        </PanelCard>
      </section>

      <PanelCard
        title="快捷跳转"
      >
        <div className="grid grid-cols-4 gap-3 max-[1400px]:grid-cols-2 max-[800px]:grid-cols-1">
          {overview.shortcuts.map(item => {
            const Icon = shortcutIconMap[item.id as keyof typeof shortcutIconMap] ?? ArrowRight;
            return (
              <button
                key={item.id}
                className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] p-4 text-left hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bg)] transition-colors"
                onClick={() => onOpenTarget(item.target)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-[14px] bg-[linear-gradient(135deg,rgba(179,92,32,0.14),rgba(45,107,93,0.14))] flex items-center justify-center text-[var(--color-primary)]">
                    <Icon size={18} />
                  </div>
                  <Badge variant={item.tone}>{item.countLabel}</Badge>
                </div>
                <div className="mt-4 text-[15px] font-semibold">{item.label}</div>
                <div className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--color-primary)]">
                  进入模块
                  <ArrowRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </PanelCard>
    </div>
  );
}

function badgeLabel(tone: 'green' | 'yellow' | 'red' | 'blue' | 'gray') {
  if (tone === 'red') return '高优先';
  if (tone === 'yellow') return '需关注';
  if (tone === 'blue') return '处理中';
  if (tone === 'green') return '已联动';
  return '信息';
}

function AnalyticsSection({ analytics }: { analytics: AnalyticsData }) {
  return (
    <PanelCard title="经营与数据洞察">
      <div className="grid grid-cols-4 gap-3 max-[1400px]:grid-cols-2 max-[720px]:grid-cols-1">
        {analytics.metrics.map(metric => (
          <div key={metric.label} className="rounded-[20px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-light)]">{metric.label}</div>
            <div className="mt-3 text-[28px] leading-none font-semibold">{metric.value}</div>
            <div className={`mt-3 text-[12px] font-medium ${metric.direction === 'up' ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>{metric.trend}</div>
            <div className="mt-1 text-[12px] text-[var(--color-text-secondary)]">{metric.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 max-[1200px]:grid-cols-1">
        <ChartCard title="工单效率">
          <LineTrendChart labels={analytics.ticketVolume.labels} values={analytics.ticketVolume.values} stroke="var(--color-primary)" fill="rgba(179,92,32,0.12)" />
        </ChartCard>
        <ChartCard title="审核压力">
          <HorizontalBarChart items={analytics.manualReviewBreakdown.map(item => ({ label: item.label, value: item.pct, color: 'var(--color-warning)' }))} suffix="%" />
        </ChartCard>
        <ChartCard title="AI 建议采纳">
          <LineTrendChart labels={analytics.aiAdoptionTrend.map(item => item.label)} values={analytics.aiAdoptionTrend.map(item => item.value)} stroke="var(--color-success)" fill="rgba(15,159,110,0.12)" suffix="%" />
        </ChartCard>
        <ChartCard title="知识健康度">
          <HorizontalBarChart items={analytics.topFAQ.map(item => ({ label: item.label, value: item.count, color: 'var(--color-primary)' }))} />
        </ChartCard>
        <ChartCard title="客户风险分布">
          <DonutChart items={analytics.issueDist} />
        </ChartCard>
        <ChartCard title="渠道负载">
          <DonutChart items={analytics.channelDist} />
        </ChartCard>
      </div>
    </PanelCard>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.58)] p-4">
      <div className="text-[15px] font-semibold">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function LineTrendChart({
  labels,
  values,
  stroke,
  fill,
  suffix = '',
}: {
  labels: string[];
  values: number[];
  stroke: string;
  fill: string;
  suffix?: string;
}) {
  const width = 460;
  const height = 180;
  const padding = 22;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y, value, label: labels[index] };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const area = `${path} L ${points.at(-1)?.x ?? width - padding} ${height - padding} L ${points[0]?.x ?? padding} ${height - padding} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[180px] overflow-visible">
        <path d={area} fill={fill} />
        <path d={path} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(point => (
          <g key={`${point.label}-${point.value}`}>
            <circle cx={point.x} cy={point.y} r="4" fill={stroke} />
          </g>
        ))}
      </svg>
      <div className="mt-3 grid grid-cols-7 gap-2 text-[11px] text-[var(--color-text-secondary)] max-[720px]:grid-cols-4">
        {points.map(point => (
          <div key={point.label} className="rounded-[12px] bg-[rgba(255,255,255,0.72)] px-2 py-1.5">
            <div>{point.label}</div>
            <div className="mt-1 font-semibold text-[var(--color-text)]">{point.value}{suffix}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({
  items,
  suffix = '',
}: {
  items: Array<{ label: string; value: number; color: string }>;
  suffix?: string;
}) {
  const max = Math.max(...items.map(item => item.value), 1);
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <div className="text-[var(--color-text-secondary)]">{item.label}</div>
            <div className="font-semibold">{item.value}{suffix}</div>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-[rgba(15,23,42,0.06)] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(item.value / max) * 100}%`, background: item.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const segments = items.reduce<{
    offset: number;
    values: Array<{ label: string; value: number; color: string; length: number; dashOffset: number }>;
  }>(
    (acc, item) => {
      const length = (item.value / total) * circumference;
      acc.values.push({ ...item, length, dashOffset: -acc.offset });
      acc.offset += length;
      return acc;
    },
    { offset: 0, values: [] },
  ).values;

  return (
    <div className="flex items-center gap-6 max-[720px]:flex-col max-[720px]:items-start">
      <svg viewBox="0 0 160 160" className="w-[160px] h-[160px] flex-shrink-0">
        <g transform="translate(80 80) rotate(-90)">
          <circle r={radius} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="18" />
          {segments.map(item => (
            <circle
              key={item.label}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="18"
              strokeDasharray={`${item.length} ${circumference - item.length}`}
              strokeDashoffset={item.dashOffset}
              strokeLinecap="butt"
            />
          ))}
        </g>
        <text x="80" y="74" textAnchor="middle" className="fill-[var(--color-text-light)] text-[11px] uppercase tracking-[0.16em]">Total</text>
        <text x="80" y="96" textAnchor="middle" className="fill-[var(--color-text)] text-[20px] font-semibold">{total}</text>
      </svg>
      <div className="flex-1 space-y-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-2 text-[12px] rounded-[14px] bg-[rgba(255,255,255,0.72)] px-3 py-2">
            <span className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ background: item.color }} />
            <span className="text-[var(--color-text-secondary)]">{item.label}</span>
            <span className="ml-auto font-semibold">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
