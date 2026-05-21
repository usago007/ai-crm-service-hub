import type { FollowUpTask, Customer } from '../types';
import { slaSt, slaLbl, prioCls } from '../utils/format';
import { Badge } from '../components/common/Badge';
import { getC } from '../utils/ticket';
import { useT } from '../i18n';

interface FollowUpTasksProps {
  tasks: FollowUpTask[];
  customers: Customer[];
  onCreateTask: () => void;
}

export function FollowUpTasks({ tasks, customers, onCreateTask }: FollowUpTasksProps) {
  const { t } = useT();
  const activeCount = tasks.filter(tsk => tsk.status !== 'Completed').length;

  return (
    <div>
      <div className="text-xl font-bold mb-1">{t.page.tasks}</div>
      <div className="text-[13px] text-[var(--color-text-secondary)] mb-5">{t.page.subtitle_tasks}</div>

      <div className="flex gap-2 flex-wrap items-center px-4 py-3 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] mb-4">
        <span className="text-[13px] font-medium">Tasks: {activeCount} {t.tasks.active}</span>
        <button className="ml-auto btn btn-primary btn-sm" onClick={onCreateTask}>{t.tasks.newTask}</button>
      </div>

      <div className="overflow-auto border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)]">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr>
              {[t.tableHeader.task, t.tableHeader.customer, t.tableHeader.relatedTicket, t.tableHeader.due, t.tableHeader.priority, t.tableHeader.triggeredBy, t.tableHeader.status, t.tableHeader.owner].map((h, i) => (
                <th key={i} className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map(tsk => {
              const c = getC(customers, tsk.customerId);
              const sla = slaSt(tsk.due);
              return (
                <tr key={tsk.id}>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{tsk.description}</td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{c ? c.name : '—'}</td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{tsk.ticketId || '—'}</td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                    <span className={`text-[11px] font-medium ${sla === 'critical' ? 'text-[var(--color-danger)]' : sla === 'warning' ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
                      {slaLbl(tsk.due)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                    <Badge variant={prioCls(tsk.priority).replace('badge-', '') as any}>{tsk.priority}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{tsk.triggeredBy}</td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                    <Badge variant={tsk.status === 'Pending' ? 'yellow' : tsk.status === 'In Progress' ? 'blue' : 'green'}>{tsk.status}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{tsk.owner}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
