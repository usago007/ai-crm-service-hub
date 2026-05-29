import { useState } from 'react';
import { Badge } from '../../../../components/common/Badge';
import { Button } from '../../../../components/common/Button';
import { Drawer } from '../../../../components/common/Drawer';
import { StatusPill, healthStatusLabel, indexStatusLabel, commonValueLabel, FactGrid } from './helpers';
import type { LLMStatus, EmbeddingServiceStatus, VectorDbStatus, DocumentIngestionQueueStatus } from '../../../../types';

interface CoreServiceStatusProps {
  llmStatus: LLMStatus;
  embeddingStatus: EmbeddingServiceStatus;
  vectorDbStatus: VectorDbStatus;
  ingestionQueue: DocumentIngestionQueueStatus;
  onRetryFailedJobs: () => void;
  onRebuildVectorIndex: () => void;
}

function CompactMetric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const toneClass =
    tone === 'success' ? 'text-[var(--color-success)]'
    : tone === 'warning' ? 'text-[var(--color-warning)]'
    : tone === 'danger' ? 'text-[var(--color-danger)]'
    : 'text-[var(--color-text)]';
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[12px] text-[var(--color-text-light)]">{label}</span>
      <span className={`text-[14px] font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

function ServiceMiniCard({
  title,
  status,
  metrics,
  action,
}: {
  title: string;
  status: React.ReactNode;
  metrics: Array<{ label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="shell-card rounded-[24px] p-4 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,rgba(179,92,32,0.72),rgba(45,107,93,0.46),transparent)]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="text-[14px] font-semibold tracking-[-0.02em] text-[var(--color-text)]">{title}</div>
          {status}
        </div>
        <div className="space-y-2.5">
          {metrics.map(m => (
            <CompactMetric key={m.label} label={m.label} value={m.value} tone={m.tone} />
          ))}
        </div>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}

export function CoreServiceStatus({
  llmStatus,
  embeddingStatus,
  vectorDbStatus,
  ingestionQueue,
  onRetryFailedJobs,
  onRebuildVectorIndex,
}: CoreServiceStatusProps) {
  const [drawerService, setDrawerService] = useState<string | null>(null);

  const closeDrawer = () => setDrawerService(null);

  return (
    <div className="space-y-4">
      <div className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--color-text)]">核心服务状态</div>

      <div className="grid grid-cols-4 gap-4 max-[1400px]:grid-cols-2 max-[720px]:grid-cols-1">
        <ServiceMiniCard
          title="LLM API"
          status={<StatusPill status={llmStatus.status} />}
          metrics={[
            { label: '平均延迟', value: `${(llmStatus.avgLatencyMs / 1000).toFixed(1)} 秒` },
            { label: '错误率', value: `${llmStatus.errorRate}%`, tone: llmStatus.errorRate > 5 ? 'danger' : 'default' },
            { label: '限流使用率', value: `${llmStatus.rateLimitUsage}%`, tone: llmStatus.rateLimitUsage > 80 ? 'warning' : 'default' },
          ]}
          action={<Button size="sm" variant="ghost" onClick={() => setDrawerService('llm')}>查看详情</Button>}
        />

        <ServiceMiniCard
          title="Embedding"
          status={<StatusPill status={embeddingStatus.status} />}
          metrics={[
            { label: '队列长度', value: String(embeddingStatus.queueSize) },
            { label: '失败任务', value: String(embeddingStatus.failedJobs), tone: embeddingStatus.failedJobs > 0 ? 'danger' : 'success' },
            { label: '平均延迟', value: `${embeddingStatus.avgLatencyMs} ms` },
          ]}
          action={<Button size="sm" variant="ghost" onClick={() => setDrawerService('embedding')}>查看详情</Button>}
        />

        <ServiceMiniCard
          title="Vector DB"
          status={(
            <Badge
              variant={vectorDbStatus.indexStatus === 'ready' ? 'green' : vectorDbStatus.indexStatus === 'building' ? 'orange' : 'red'}
              className="rounded-[12px] px-3 py-1.5 text-[11px]"
            >
              {indexStatusLabel(vectorDbStatus.indexStatus)}
            </Badge>
          )}
          metrics={[
            { label: '索引', value: vectorDbStatus.indexName },
            { label: '向量数', value: vectorDbStatus.vectorCount.toLocaleString() },
            { label: '最近错误', value: commonValueLabel(vectorDbStatus.lastQueryError), tone: vectorDbStatus.lastQueryError !== 'none' ? 'danger' : 'default' },
          ]}
          action={(
            <div className="space-y-2">
              <Button size="sm" variant="secondary" className="w-full" onClick={() => { void onRebuildVectorIndex(); }}>
                重建索引
              </Button>
              <Button size="sm" variant="ghost" className="w-full" onClick={() => setDrawerService('vector')}>查看详情</Button>
            </div>
          )}
        />

        <ServiceMiniCard
          title="文档接入队列"
          status={(
            <Badge
              variant={ingestionQueue.queueStatus === 'healthy' ? 'green' : ingestionQueue.queueStatus === 'degraded' ? 'orange' : 'red'}
              className="rounded-[12px] px-3 py-1.5 text-[11px]"
            >
              {healthStatusLabel(ingestionQueue.queueStatus)}
            </Badge>
          )}
          metrics={[
            { label: '运行中', value: String(ingestionQueue.runningJobs) },
            { label: '失败', value: String(ingestionQueue.failedJobs), tone: ingestionQueue.failedJobs > 0 ? 'danger' : 'success' },
            { label: '最早待处理', value: commonValueLabel(ingestionQueue.oldestPendingJob) },
          ]}
          action={(
            <div className="space-y-2">
              <Button size="sm" variant="secondary" className="w-full" onClick={() => { void onRetryFailedJobs(); }}>
                重试失败任务
              </Button>
              <Button size="sm" variant="ghost" className="w-full" onClick={() => setDrawerService('ingestion')}>查看详情</Button>
            </div>
          )}
        />
      </div>

      <Drawer open={drawerService !== null} onClose={closeDrawer} width="520px" title={
        drawerService === 'llm' ? 'LLM API 详情'
        : drawerService === 'embedding' ? 'Embedding 详情'
        : drawerService === 'vector' ? 'Vector DB 详情'
        : drawerService === 'ingestion' ? '文档接入队列详情'
        : '详情'
      }>
        {drawerService === 'llm' && (
          <FactGrid items={[
            { label: '提供商', value: llmStatus.provider },
            { label: '主模型', value: llmStatus.primaryModel },
            { label: '备用模型', value: llmStatus.fallbackModel },
            { label: '平均延迟', value: `${llmStatus.avgLatencyMs} ms` },
            { label: '错误率', value: `${llmStatus.errorRate}%` },
            { label: '限流使用率', value: `${llmStatus.rateLimitUsage}%` },
            { label: '今日 Token 用量', value: llmStatus.tokenUsageToday.toLocaleString() },
            { label: '预估费用', value: `$${llmStatus.estimatedCostToday.toFixed(2)}` },
            { label: '上次错误', value: commonValueLabel(llmStatus.lastError) },
            { label: '最后检查', value: llmStatus.lastChecked },
          ]} />
        )}
        {drawerService === 'embedding' && (
          <FactGrid items={[
            { label: '提供方', value: embeddingStatus.provider },
            { label: '向量模型', value: embeddingStatus.model },
            { label: '队列长度', value: String(embeddingStatus.queueSize) },
            { label: '失败任务', value: String(embeddingStatus.failedJobs) },
            { label: '平均延迟', value: `${embeddingStatus.avgLatencyMs} ms` },
            { label: '向量维度', value: String(embeddingStatus.vectorDimension) },
            { label: '最近成功运行', value: embeddingStatus.lastSuccessfulRun },
            { label: '重建状态', value: embeddingStatus.rebuildStatus },
          ]} />
        )}
        {drawerService === 'vector' && (
          <FactGrid items={[
            { label: '存储', value: vectorDbStatus.store },
            { label: '索引名称', value: vectorDbStatus.indexName },
            { label: '索引状态', value: indexStatusLabel(vectorDbStatus.indexStatus) },
            { label: '向量数量', value: vectorDbStatus.vectorCount.toLocaleString() },
            { label: '命名空间', value: vectorDbStatus.namespace },
            { label: '存储占用', value: vectorDbStatus.storageUsage },
            { label: '查询延迟', value: `${vectorDbStatus.queryLatencyMs} ms` },
            { label: '索引版本', value: vectorDbStatus.indexVersion },
            { label: '最近重建', value: vectorDbStatus.lastRebuild },
            { label: '最近错误', value: commonValueLabel(vectorDbStatus.lastQueryError) },
          ]} />
        )}
        {drawerService === 'ingestion' && (
          <FactGrid items={[
            { label: '队列状态', value: healthStatusLabel(ingestionQueue.queueStatus) },
            { label: '待处理', value: String(ingestionQueue.pendingJobs) },
            { label: '运行中', value: String(ingestionQueue.runningJobs) },
            { label: '失败', value: String(ingestionQueue.failedJobs) },
            { label: '最近成功同步', value: ingestionQueue.lastSuccessfulSync },
            { label: '计划同步', value: commonValueLabel(ingestionQueue.scheduledSync) },
            { label: '重试策略', value: ingestionQueue.retryPolicy },
            { label: '最早待处理', value: commonValueLabel(ingestionQueue.oldestPendingJob) },
          ]} />
        )}
      </Drawer>
    </div>
  );
}
