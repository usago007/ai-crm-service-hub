import type { ActivityLogItem, AIOpsStage, AnalyticsData, AuditLogRecord, FeedbackLoopRecord, ServiceTicket } from '../types';
import { useT } from '../i18n';
import { Badge } from '../components/common/Badge';
import { PageHeader, PanelCard, StatCard } from '../components/common/PageChrome';
import { displayFeedbackStatus, displayRuntimeStatus } from '../utils/display';

interface OverviewProps {
  analytics: AnalyticsData;
  activityLog: ActivityLogItem[];
  tickets: ServiceTicket[];
  feedbackLoop: FeedbackLoopRecord[];
  auditLogs: AuditLogRecord[];
  aiOpsStages: AIOpsStage[];
}

export function Overview({ analytics, activityLog, tickets, feedbackLoop, auditLogs, aiOpsStages }: OverviewProps) {
  const { t } = useT();
  const reviewQueue = tickets.filter(ticket => ticket.manualReview).length;
  const highRiskCases = tickets.filter(ticket => ticket.riskLevel === 'High').length;
  const blockedActions = tickets.filter(ticket => ticket.workflowStage === 'execute' && ticket.manualReview).length;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Operations pulse" title={t.page.overview} description={t.page.subtitle_overview} />

      <section className="grid grid-cols-[1.2fr_0.8fr] gap-4 max-[1200px]:grid-cols-1">
        <div className="rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(135deg,#0d1526_0%,#142645_54%,#104e5d_100%)] p-7 text-white shadow-[var(--shadow-soft)] relative overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-[240px] bg-[radial-gradient(circle_at_top_right,rgba(110,168,254,0.22),transparent_58%)] pointer-events-none" />
          <div className="text-[11px] uppercase tracking-[0.24em] text-[rgba(255,255,255,0.58)] mb-3">跨境电商 CRM + AI 客服辅助平台</div>
          <div className="text-[28px] leading-[1.1] font-semibold max-w-[720px] mb-3">面向跨境电商独立站客服的工程化协作式 AI 辅助演示，而不是自动客服机器人。</div>
          <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
            <HeroMetric label="处理中工单" value={analytics.metrics[0]?.value ?? '0'} detail="跨渠道客服工作负载" />
            <HeroMetric label="高复核压力工单" value={String(reviewQueue)} detail="必须经过人工复核" />
            <HeroMetric label="被阻止动作" value={String(blockedActions)} detail="AI 不允许直接执行高风险动作" />
          </div>
        </div>

        <PanelCard title="AI 辅助边界" className="rounded-[28px]">
          <div className="space-y-2 text-xs">
            <BoundaryLine label="AI 可以" value="分类、摘要、检索知识、生成可编辑回复草稿、识别风险、建议跟进任务" tone="green" />
            <BoundaryLine label="AI 不可以" value="发送客户消息、批准退款、承诺赔偿、关闭投诉、编造政策或物流信息" tone="red" />
            <BoundaryLine label="人工控制" value="任何高风险路径都必须进入人工复核，操作执行保留在人类手中" tone="yellow" />
          </div>
        </PanelCard>
      </section>

      <section className="grid grid-cols-4 gap-3.5 max-[1400px]:grid-cols-2">
        {analytics.metrics.map(metric => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} detail={`${metric.trend} ${metric.subtitle}`} tone={metric.direction === 'up' ? 'success' : 'warning'} />
        ))}
      </section>

      <section className="grid grid-cols-[1.05fr_0.95fr] gap-4 max-[1200px]:grid-cols-1">
        <PanelCard title="AI 运维生命周期">
          <div className="flex items-center justify-between gap-3 mb-3">
            <Badge variant="blue">{aiOpsStages.length} 个阶段</Badge>
          </div>
          <div className="space-y-3">
            {aiOpsStages.map(stage => (
              <div key={stage.id} className="grid grid-cols-[160px_1fr_140px] gap-3 border border-[var(--color-border-light)] rounded-[14px] p-3 max-[900px]:grid-cols-1">
                <div>
                  <div className="text-xs font-semibold">{stage.stage}</div>
                  <div className="text-[11px] text-[var(--color-text-light)] mt-1">{stage.owner}</div>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  <div className="mb-1">{stage.detail}</div>
                  <div className="text-[var(--color-text)]"><strong>控制点：</strong> {stage.controlPoint}</div>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <Badge variant={stage.status === 'healthy' ? 'green' : stage.status === 'watch' ? 'yellow' : 'red'}>{displayRuntimeStatus(stage.status)}</Badge>
                  <div className="text-xs text-[var(--color-text-secondary)]">{stage.throughput}</div>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>

        <div className="grid grid-rows-[auto_auto_1fr] gap-4">
          <PanelCard title="风险快照">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <MiniStat label="高风险工单" value={String(highRiskCases)} />
              <MiniStat label="待复核队列" value={String(reviewQueue)} />
              <MiniStat label="审计告警" value={String(auditLogs.length)} />
            </div>
          </PanelCard>

          <PanelCard title="反馈闭环">
            <div className="space-y-2">
              {feedbackLoop.map(item => (
                <div key={item.id} className="border border-[var(--color-border-light)] rounded-[12px] p-3 text-xs">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="font-medium">{item.scenario}</div>
                    <Badge variant={item.status === 'shipped' ? 'green' : item.status === 'triaged' ? 'yellow' : 'gray'}>{displayFeedbackStatus(item.status)}</Badge>
                  </div>
                  <div className="text-[var(--color-text-secondary)]">{item.signal}</div>
                  <div className="mt-1 text-[var(--color-text)]"><strong>动作：</strong> {item.action}</div>
                </div>
              ))}
            </div>
          </PanelCard>

          <PanelCard title={t.analytics.recentActivity}>
            <div className="space-y-2">
              {[...activityLog, ...auditLogs.slice(0, 2).map(item => ({
                id: item.id,
                action: item.eventType,
                detail: item.outcome,
                user: item.actor,
                time: item.timestamp,
              }))].slice(0, 5).map(item => (
                <div key={item.id} className="border border-[var(--color-border-light)] rounded-[12px] p-3 text-xs">
                  <div className="font-medium">{item.action}</div>
                  <div className="text-[var(--color-text-secondary)] mt-1">{item.detail}</div>
                  <div className="text-[11px] text-[var(--color-text-light)] mt-1">{item.user} · {item.time}</div>
                </div>
              ))}
            </div>
          </PanelCard>
        </div>
      </section>
    </div>
  );
}

function HeroMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[16px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[rgba(255,255,255,0.55)]">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      <div className="text-xs text-[rgba(255,255,255,0.68)] mt-1">{detail}</div>
    </div>
  );
}

function BoundaryLine({ label, value, tone }: { label: string; value: string; tone: 'green' | 'red' | 'yellow' }) {
  return (
    <div className="rounded-[12px] border border-[var(--color-border-light)] bg-[var(--color-bg)] p-3">
      <div className={`text-[11px] uppercase tracking-[0.18em] ${tone === 'green' ? 'text-[var(--color-success)]' : tone === 'red' ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]'}`}>{label}</div>
      <div className="text-[13px] text-[var(--color-text)] mt-1">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.55)] p-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)]">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
