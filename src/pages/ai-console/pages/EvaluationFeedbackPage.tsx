import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import type { AIConsoleProps } from '../types';
import { DataTable, PageHeader, SectionCard, StatCard } from '../shared';
import { displayAuditEvent, displayFeedbackStatus, displayRiskLevel, displayRuntimeStatus } from '../../../utils/display';
import type { EvaluationCenterTab } from '../../../types';

type Props = Pick<AIConsoleProps, 'businessCase' | 'evaluations' | 'feedbackLoop' | 'auditLogs' | 'onSelectBusinessTicket' | 'onOpenPage'> & {
  activeTab: EvaluationCenterTab;
  onTabChange: (tab: EvaluationCenterTab) => void;
};

export function EvaluationFeedbackPage({
  businessCase,
  evaluations,
  feedbackLoop,
  auditLogs,
  activeTab,
  onTabChange,
  onSelectBusinessTicket,
  onOpenPage,
}: Props) {
  const riskCount = evaluations.filter(item => item.status === 'risk').length;
  const shippedCount = feedbackLoop.filter(item => item.status === 'shipped').length;
  const highRiskCount = auditLogs.filter(item => item.riskLevel === 'High').length;
  const blockedCount = auditLogs.filter(item => item.outcome.includes('拦截') || item.outcome.toLowerCase().includes('blocked')).length;

  return (
    <div className="space-y-4">
      <PageHeader title="评测与反馈" />

      <div className="flex gap-2 flex-wrap">
        {([
          ['evaluation', '评测与反馈'],
          ['audit', '审计日志'],
        ] as const).map(([key, label]) => (
          <Button key={key} variant={activeTab === key ? 'primary' : 'secondary'} size="sm" onClick={() => onTabChange(key)}>
            {label}
          </Button>
        ))}
      </div>

      {activeTab === 'evaluation' ? (
        <>
          <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
            <StatCard label="评测项" value={String(evaluations.length)} detail="" />
            <StatCard label="风险项" value={String(riskCount)} detail="" tone="danger" />
            <StatCard label="已落地反馈" value={String(shippedCount)} detail="" tone="success" />
          </div>
          <div className="grid grid-cols-[1fr_0.9fr] gap-4 max-[1200px]:grid-cols-1">
            <DataTable
              columns={[
                { key: 'scenario', label: '场景', width: '26%' },
                { key: 'metric', label: '指标' },
                { key: 'score', label: '得分' },
                { key: 'baseline', label: '基线' },
                { key: 'status', label: '状态' },
              ]}
              emptyMessage="还没有评测数据。"
            >
              {evaluations.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-[13px] border-b border-[var(--color-border-light)]">{item.scenario}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.metric}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] tabular-nums">{item.score}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] tabular-nums">{item.baseline}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={item.status === 'good' ? 'green' : item.status === 'watch' ? 'yellow' : 'red'}>{displayRuntimeStatus(item.status)}</Badge></td>
                </tr>
              ))}
            </DataTable>

            <div className="space-y-4">
              {businessCase.ticket ? (
                <SectionCard title="当前案例">
                  <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-3.5 text-xs">
                    <div><strong>工单：</strong> {businessCase.ticket.id}</div>
                    <div className="mt-1"><strong>审计事件：</strong> {businessCase.auditLogs.length} 条</div>
                    <div className="mt-1"><strong>后续任务：</strong> {businessCase.followUpTasks.length} 个</div>
                  </div>
                </SectionCard>
              ) : null}
              <SectionCard title="反馈记录">
                <div className="space-y-2">
                  {feedbackLoop.map(item => (
                    <div key={item.id} className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-3.5 text-xs">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="font-medium">{item.source} · {item.scenario}</div>
                        <Badge variant={item.status === 'shipped' ? 'green' : item.status === 'triaged' ? 'yellow' : 'gray'}>{displayFeedbackStatus(item.status)}</Badge>
                      </div>
                      <div className="text-[var(--color-text-secondary)] leading-5">{item.signal}</div>
                      <div className="mt-2"><strong>动作：</strong> {item.action}</div>
                      <div className="mt-1 text-[11px] text-[var(--color-text-light)]">{item.owner} · {item.updatedAt}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        </>
      ) : null}

      {activeTab === 'audit' ? (
        <>
          <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
            <StatCard label="审计记录" value={String(auditLogs.length)} detail="" />
            <StatCard label="高风险事件" value={String(highRiskCount)} detail="" tone="danger" />
            <StatCard label="阻止执行" value={String(blockedCount)} detail="" tone="warning" />
          </div>
          {businessCase.ticket ? (
            <SectionCard title="当前案例审计链路">
              <div className="flex items-start justify-between gap-4 flex-wrap text-xs">
                <div className="space-y-1">
                  <div>工单 {businessCase.ticket.id} 当前已有 {businessCase.auditLogs.length} 条审计记录。</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { onSelectBusinessTicket(businessCase.ticket!.id); onOpenPage('service'); }}>回到客服工作台</Button>
                </div>
              </div>
            </SectionCard>
          ) : null}
          <SectionCard title="事件明细">
            <DataTable
              columns={[
                { key: 'timestamp', label: '时间', width: '16%' },
                { key: 'ticket', label: '工单' },
                { key: 'event', label: '事件', width: '16%' },
                { key: 'actor', label: '执行方' },
                { key: 'risk', label: '风险' },
                { key: 'outcome', label: '结果', width: '16%' },
                { key: 'detail', label: '详情', width: '28%' },
              ]}
              emptyMessage="还没有审计日志。"
              className="rounded-[20px]"
            >
              {auditLogs.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] whitespace-nowrap">{item.timestamp}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.ticketId}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{displayAuditEvent(item.eventType)}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.actor}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={item.riskLevel === 'High' ? 'red' : item.riskLevel === 'Medium' ? 'yellow' : 'green'}>{displayRiskLevel(item.riskLevel)}</Badge></td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.outcome}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)]">{item.detail}</td>
                </tr>
              ))}
            </DataTable>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}
