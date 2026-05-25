import { Badge } from '../../../components/common/Badge';
import type { AIConsoleProps } from '../types';
import { displayAuditEvent, displayRiskLevel } from '../../../utils/display';
import { Button } from '../../../components/common/Button';
import { DataTable, PageHeader, SectionCard, StatCard } from '../shared';

type Props = Pick<AIConsoleProps, 'businessCase' | 'auditLogs' | 'onSelectBusinessTicket' | 'onOpenPage'>;

export function AuditLogsPage({ businessCase, auditLogs, onSelectBusinessTicket, onOpenPage }: Props) {
  const highRiskCount = auditLogs.filter(item => item.riskLevel === 'High').length;
  const blockedCount = auditLogs.filter(item => item.outcome.includes('拦截') || item.outcome.toLowerCase().includes('blocked')).length;

  return (
    <div className="space-y-4">
      <PageHeader title="审计日志" description="记录人工发送、关闭、护栏拦截、知识事件与人工改判，不再复用其他页面头部。" />
      <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
        <StatCard label="审计记录" value={String(auditLogs.length)} detail="所有发送、关闭、护栏与知识事件都保留可追踪记录。" />
        <StatCard label="高风险事件" value={String(highRiskCount)} detail="需要重点核查的越权、赔付、投诉与拦截路径。" tone="danger" />
        <StatCard label="阻止执行" value={String(blockedCount)} detail="AI 或人工动作被护栏阻止，避免错误触达客户。" tone="warning" />
      </div>
      {businessCase.ticket ? (
        <SectionCard title="当前案例审计链路">
          <div className="flex items-start justify-between gap-4 flex-wrap text-xs">
            <div className="space-y-1">
              <div>工单 {businessCase.ticket.id} 当前已有 {businessCase.auditLogs.length} 条审计记录。</div>
              <div className="text-[var(--color-text-secondary)]">这些记录覆盖检索、发送、关闭、人工改判与知识异常，能直接解释 AI 为何停在当前节点。</div>
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
    </div>
  );
}
