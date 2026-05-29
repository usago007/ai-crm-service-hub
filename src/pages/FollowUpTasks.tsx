import { useMemo, useState } from 'react';
import type { Customer, FollowUpTask, ListQuery, PagedResult, TaskFilters } from '../types';
import { slaSt, slaLbl } from '../utils/format';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Drawer } from '../components/common/Drawer';
import { Pagination } from '../components/common/Pagination';
import { getC } from '../utils/ticket';
import { useT } from '../i18n';
import { EmptyState, FilterBar, PanelCard, StatCard, SummaryHeader, inputCls } from '../components/common/PageChrome';
import { displayGenericStatus, displayPriority } from '../utils/display';

interface FollowUpTasksProps {
  result: PagedResult<FollowUpTask>;
  query: ListQuery<TaskFilters>;
  onQueryChange: (updater: (prev: ListQuery<TaskFilters>) => ListQuery<TaskFilters>) => void;
  customers: Customer[];
}

const priorityVariantMap: Record<FollowUpTask['priority'], BadgeVariant> = {
  Urgent: 'red',
  High: 'orange',
  Normal: 'blue',
  Low: 'gray',
};

const taskStatusOptions = ['待处理', '进行中', 'Completed'];
const taskPriorityOptions: FollowUpTask['priority'][] = ['Urgent', 'High', 'Normal', 'Low'];
const taskSourceOptions = ['triage', 'retrieve', 'draft', 'review', 'execute', 'follow-up', 'resolved'];

export function FollowUpTasks({ result, query, onQueryChange, customers }: FollowUpTasksProps) {
  const { t } = useT();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(result.items[0]?.id ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeTask = useMemo(
    () => (selectedTaskId ? result.items.find(task => task.id === selectedTaskId) ?? result.items[0] ?? null : result.items[0] ?? null),
    [result.items, selectedTaskId],
  );
  const activeCustomer = activeTask ? getC(customers, activeTask.customerId) : null;
  const pendingCount = useMemo(() => result.items.filter(task => task.status === '待处理').length, [result.items]);
  const urgentCount = useMemo(() => result.items.filter(task => task.priority === 'Urgent').length, [result.items]);

  return (
    <div className="space-y-4">
      <SummaryHeader
        aside={
          <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
            <StatCard label="任务总量" value={String(result.total)} detail="当前筛选条件下的跟进任务总量。" />
            <StatCard label="待处理" value={String(pendingCount)} detail="当前页仍待领取或继续推进的任务。" tone="warning" />
            <StatCard label="紧急任务" value={String(urgentCount)} detail="当前页需要优先处理的高压事项。" tone="danger" />
          </div>
        }
      />

      <FilterBar>
        <select
          className={inputCls}
          value={query.filters.status ?? ''}
          onChange={event => onQueryChange(prev => ({
            ...prev,
            page: 1,
            filters: { ...prev.filters, status: event.target.value || undefined },
          }))}
        >
          <option value="">全部状态</option>
          {taskStatusOptions.map(item => (
            <option key={item} value={item}>{displayGenericStatus(item)}</option>
          ))}
        </select>
        <select
          className={inputCls}
          value={query.filters.priority ?? ''}
          onChange={event => onQueryChange(prev => ({
            ...prev,
            page: 1,
            filters: { ...prev.filters, priority: event.target.value || undefined },
          }))}
        >
          <option value="">全部优先级</option>
          {taskPriorityOptions.map(item => (
            <option key={item} value={item}>{displayPriority(item)}</option>
          ))}
        </select>
        <select
          className={inputCls}
          value={query.filters.triggeredBy ?? ''}
          onChange={event => onQueryChange(prev => ({
            ...prev,
            page: 1,
            filters: { ...prev.filters, triggeredBy: event.target.value || undefined },
          }))}
        >
          <option value="">全部来源</option>
          {taskSourceOptions.map(item => (
            <option key={item} value={item}>{displayGenericStatus(item)}</option>
          ))}
        </select>
        <div className="filter-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onQueryChange(prev => ({ ...prev, page: 1, filters: {} }))}
          >
            重置筛选
          </Button>
        </div>
      </FilterBar>

      <PanelCard title="任务队列" description="统一查看客户、关联工单、SLA、优先级与负责人。点击任务描述或查看按钮后在抽屉查看详情。">
        {result.items.length > 0 ? (
          <>
            <div className="overflow-auto">
              <table className="w-full border-collapse min-w-[980px]">
                <thead>
                  <tr>
                    {[t.tableHeader.task, t.tableHeader.customer, t.tableHeader.relatedTicket, t.tableHeader.due, t.tableHeader.priority, t.tableHeader.triggeredBy, t.tableHeader.status, t.tableHeader.owner, '操作'].map((header, index) => (
                      <th key={`${header}-${index}`} className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.items.map(task => {
                    const customer = getC(customers, task.customerId);
                    const sla = slaSt(task.due);
                    return (
                      <tr
                        key={task.id}
                        className={`cursor-pointer border-b border-[var(--color-border-light)] hover:bg-[rgba(255,255,255,0.42)] ${activeTask?.id === task.id ? 'bg-[var(--color-primary-bg)]' : ''}`}
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setDrawerOpen(true);
                        }}
                      >
                        <td className="px-4 py-3 text-[13px] align-middle">
                          <button
                            type="button"
                            className="text-left hover:text-[var(--color-primary)]"
                            onClick={event => {
                              event.stopPropagation();
                              setSelectedTaskId(task.id);
                              setDrawerOpen(true);
                            }}
                          >
                            {task.description}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[13px] align-middle">{customer ? customer.name : '—'}</td>
                        <td className="px-4 py-3 text-[13px] align-middle">{task.ticketId || '—'}</td>
                        <td className="px-4 py-3 text-[13px] align-middle">
                          <span className={`text-[11px] font-medium ${sla === 'critical' ? 'text-[var(--color-danger)]' : sla === 'warning' ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
                            {slaLbl(task.due)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] align-middle">
                          <Badge variant={priorityVariantMap[task.priority]}>{displayPriority(task.priority)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-[13px] align-middle">{displayGenericStatus(task.triggeredBy)}</td>
                        <td className="px-4 py-3 text-[13px] align-middle">
                          <Badge variant={task.status === '待处理' ? 'yellow' : task.status === '进行中' ? 'blue' : 'green'}>
                            {displayGenericStatus(task.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[13px] align-middle">{task.owner}</td>
                        <td className="px-4 py-3 text-[13px] align-middle">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={event => {
                              event.stopPropagation();
                              setSelectedTaskId(task.id);
                              setDrawerOpen(true);
                            }}
                          >
                            查看
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              onPageChange={page => onQueryChange(prev => ({ ...prev, page }))}
            />
          </>
        ) : (
          <EmptyState title="暂无跟进任务" description="当前筛选条件下没有任务，重置筛选后查看全量队列。" />
        )}
      </PanelCard>

      <Drawer open={drawerOpen && Boolean(activeTask)} onClose={() => setDrawerOpen(false)} title={activeTask?.description ?? '任务详情'}>
        {activeTask ? (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <InfoCard label="关联客户" value={activeCustomer?.name ?? '—'} />
              <InfoCard label="关联工单" value={activeTask.ticketId || '—'} />
              <InfoCard label="优先级" value={displayPriority(activeTask.priority)} />
              <InfoCard label="状态" value={displayGenericStatus(activeTask.status)} />
            </div>
            <PanelCard title="任务信息" className="p-4">
              <div className="space-y-2 text-[13px] text-[var(--color-text-secondary)]">
                <div><span className="text-[var(--color-text)] font-medium">SLA：</span> {slaLbl(activeTask.due)}</div>
                <div><span className="text-[var(--color-text)] font-medium">来源：</span> {displayGenericStatus(activeTask.triggeredBy)}</div>
                <div><span className="text-[var(--color-text)] font-medium">负责人：</span> {activeTask.owner}</div>
                <div><span className="text-[var(--color-text)] font-medium">任务描述：</span> {activeTask.description}</div>
              </div>
            </PanelCard>
            <PanelCard title="任务摘要" className="p-4">
              <div className="space-y-2 text-[13px] text-[var(--color-text-secondary)]">
                <div><span className="text-[var(--color-text)] font-medium">优先推进：</span> {activeTask.status === '待处理' ? '先确认负责人并开始处理。' : activeTask.status === '进行中' ? '持续跟进当前动作并确保按 SLA 完成。' : '已完成，可回看闭环结果。'} </div>
                <div><span className="text-[var(--color-text)] font-medium">来源链路：</span> 当前任务由 {displayGenericStatus(activeTask.triggeredBy)} 阶段触发。</div>
              </div>
            </PanelCard>
          </div>
        ) : (
          <EmptyState title="尚未选择任务" description="从列表选择任务后查看详情。" compact />
        )}
      </Drawer>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.55)] p-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)]">{label}</div>
      <div className="font-medium mt-2">{value}</div>
    </div>
  );
}
