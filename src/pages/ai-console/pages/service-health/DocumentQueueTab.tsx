import { useState, useMemo } from 'react';
import { Button } from '../../../../components/common/Button';
import { KeyNumber } from './helpers';
import { IngestionTasksTable } from './IngestionTasksTable';
import type { DocumentIngestionQueueStatus, IngestionQueueTask } from '../../../../types';

interface DocumentQueueTabProps {
  ingestionQueue: DocumentIngestionQueueStatus;
  tasks: IngestionQueueTask[];
  onRetryFailedJobs: () => void;
}

type FilterMode = 'all' | 'failed' | 'running' | 'completed';

const FILTERS: Array<{ key: FilterMode; label: string }> = [
  { key: 'all', label: '全部任务' },
  { key: 'failed', label: '失败任务' },
  { key: 'running', label: '运行中任务' },
  { key: 'completed', label: '已完成任务' },
];

export function DocumentQueueTab({ ingestionQueue, tasks, onRetryFailedJobs }: DocumentQueueTabProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const filteredTasks = useMemo(() => {
    if (filterMode === 'all') return tasks;
    return tasks.filter(t => t.status === filterMode);
  }, [tasks, filterMode]);

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4 max-[1400px]:grid-cols-2 max-[720px]:grid-cols-1">
        <KeyNumber label="待处理" value={String(pendingCount)} tone="default" />
        <KeyNumber label="运行中" value={String(ingestionQueue.runningJobs)} tone="default" />
        <KeyNumber label="失败" value={String(ingestionQueue.failedJobs)} tone={ingestionQueue.failedJobs > 0 ? 'danger' : 'success'} />
        <KeyNumber label="已完成" value={String(completedCount)} tone="success" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="secondary" onClick={() => { void onRetryFailedJobs(); }}>
          重试失败任务
        </Button>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <Button
              key={f.key}
              variant={filterMode === f.key ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilterMode(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <IngestionTasksTable
        tasks={filteredTasks}
        onRetryFailedJobs={() => { void onRetryFailedJobs(); }}
      />
    </div>
  );
}
