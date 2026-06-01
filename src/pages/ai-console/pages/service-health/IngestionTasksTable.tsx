import { useMemo } from 'react';
import { Badge } from '../../../../components/common/Badge';
import { Button } from '../../../../components/common/Button';
import { DataTable } from '../../shared';
import { commonValueLabel, queueTaskStatusLabel } from './helperLabels';
import type { IngestionQueueTask } from '../../../../types';

interface IngestionTasksTableProps {
  tasks: IngestionQueueTask[];
  onRetryFailedJobs: () => void;
}

const STATUS_ORDER: Record<string, number> = { failed: 0, retrying: 1, running: 2, pending: 3, completed: 4 };

function stageLabel(stage: string) {
  if (stage === 'Parse') return '解析';
  if (stage === 'Chunk') return '切片';
  if (stage === 'Embedding') return '向量化';
  if (stage === 'Index') return '入索引';
  if (stage === 'Publish') return '发布';
  return stage;
}

function taskBadgeVariant(status: string) {
  if (status === 'failed') return 'red';
  if (status === 'running' || status === 'retrying') return 'yellow';
  return 'green';
}

export function IngestionTasksTable({ tasks, onRetryFailedJobs }: IngestionTasksTableProps) {
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));
  }, [tasks]);

  const completedTasks = sortedTasks.filter(t => t.status === 'completed');
  const activeTasks = sortedTasks.filter(t => t.status !== 'completed');

  if (tasks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--color-text)]">文档接入任务</div>
        <div className="shell-card rounded-[24px] p-5 text-center text-sm text-[var(--color-text-secondary)] py-8">
          当前没有最近队列任务。
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--color-text)]">文档接入任务</div>
        <Button size="sm" variant="secondary" onClick={() => { void onRetryFailedJobs(); }}>
          重试全部失败
        </Button>
      </div>

      <DataTable
        className="bg-transparent border border-[var(--color-border-light)]"
        columns={[
          { key: 'job', label: '任务 ID' },
          { key: 'document', label: '文档名称', width: '22%' },
          { key: 'stage', label: '阶段' },
          { key: 'status', label: '状态' },
          { key: 'started', label: '开始时间', width: '15%' },
          { key: 'duration', label: '耗时' },
          { key: 'error', label: '错误信息', width: '14%' },
          { key: 'actions', label: '操作', width: '10%' },
        ]}
        emptyMessage="当前没有最近队列任务。"
      >
        {activeTasks.map(task => (
          <tr key={task.jobId} className={task.status === 'failed' ? 'bg-[rgba(239,68,68,0.03)]' : ''}>
            <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.jobId}</td>
            <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.documentName}</td>
            <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{stageLabel(task.stage)}</td>
            <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
              <Badge variant={taskBadgeVariant(task.status)} className="rounded-[8px] px-2 py-0.5">
                {queueTaskStatusLabel(task.status)}
              </Badge>
            </td>
            <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.startedAt}</td>
            <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.duration}</td>
            <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{commonValueLabel(task.errorMessage)}</td>
            <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
              <div className="flex items-center gap-1.5">
                {task.status === 'failed' && (
                  <>
                    <span className="text-[var(--color-text-light)] cursor-pointer hover:underline">重试</span>
                    <span className="text-[var(--color-text-light)] cursor-pointer hover:underline">忽略</span>
                  </>
                )}
                {task.status !== 'failed' && (
                  <span className="text-[var(--color-text-light)] cursor-pointer hover:underline">查看</span>
                )}
              </div>
            </td>
          </tr>
        ))}
        {completedTasks.length > 0 && (
          <tr>
            <td colSpan={8} className="px-4 py-2.5 text-xs text-[var(--color-text-light)] border-b border-[var(--color-border-light)] bg-[rgba(30,38,47,0.02)]">
              已完成的 {completedTasks.length} 个任务
            </td>
          </tr>
        )}
      </DataTable>
    </div>
  );
}
