import type { FollowUpTask, Customer } from '../types';
import { slaSt, slaLbl } from '../utils/format';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { getC } from '../utils/ticket';
import { useT } from '../i18n';
import { EmptyState, PageHeader, PanelCard, StatCard } from '../components/common/PageChrome';
import { displayGenericStatus, displayPriority } from '../utils/display';

interface FollowUpTasksProps {
  tasks: FollowUpTask[];
  customers: Customer[];
  onCreateTask: () => void;
}

const priorityVariantMap: Record<FollowUpTask['priority'], BadgeVariant> = {
  Urgent: 'red',
  High: 'orange',
  Normal: 'blue',
  Low: 'gray',
};

export function FollowUpTasks({ tasks, customers, onCreateTask }: FollowUpTasksProps) {
  const { t } = useT();
  const activeCount = tasks.filter(tsk => tsk.status !== 'Completed').length;
  const urgentCount = tasks.filter(tsk => tsk.priority === 'Urgent').length;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Follow-up orchestration"
        title={t.page.tasks}
        description={t.page.subtitle_tasks}
        actions={<Button onClick={onCreateTask}>{t.tasks.newTask}</Button>}
        aside={
          <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
            <StatCard label="活动任务" value={String(activeCount)} detail="仍在等待处理或推进中的任务。" />
            <StatCard label="紧急任务" value={String(urgentCount)} detail="需要优先处理的高压事项。" tone="danger" />
            <StatCard label="完成总量" value={String(tasks.filter(task => task.status === 'Completed').length)} detail="已完成的闭环任务记录。" tone="success" />
          </div>
        }
      />

      <PanelCard title="任务队列" description="所有跟进任务按客户、相关工单、SLA 和责任人统一展示。">
        {tasks.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full border-collapse min-w-[980px]">
              <thead>
                <tr>
                  {[t.tableHeader.task, t.tableHeader.customer, t.tableHeader.relatedTicket, t.tableHeader.due, t.tableHeader.priority, t.tableHeader.triggeredBy, t.tableHeader.status, t.tableHeader.owner].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map(tsk => {
                  const c = getC(customers, tsk.customerId);
                  const sla = slaSt(tsk.due);
                  return (
                    <tr key={tsk.id} className="border-b border-[var(--color-border-light)] hover:bg-[rgba(255,255,255,0.42)]">
                      <td className="px-4 py-3 text-[13px] align-middle">{tsk.description}</td>
                      <td className="px-4 py-3 text-[13px] align-middle">{c ? c.name : '—'}</td>
                      <td className="px-4 py-3 text-[13px] align-middle">{tsk.ticketId || '—'}</td>
                      <td className="px-4 py-3 text-[13px] align-middle">
                        <span className={`text-[11px] font-medium ${sla === 'critical' ? 'text-[var(--color-danger)]' : sla === 'warning' ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
                          {slaLbl(tsk.due)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] align-middle">
                        <Badge variant={priorityVariantMap[tsk.priority]}>{displayPriority(tsk.priority)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[13px] align-middle">{displayGenericStatus(tsk.triggeredBy)}</td>
                      <td className="px-4 py-3 text-[13px] align-middle">
                        <Badge variant={tsk.status === 'Pending' ? 'yellow' : tsk.status === 'In Progress' ? 'blue' : 'green'}>{displayGenericStatus(tsk.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[13px] align-middle">{tsk.owner}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="暂无跟进任务" description="当前没有需要跟进的任务，新增任务后会出现在这里。" />
        )}
      </PanelCard>
    </div>
  );
}
