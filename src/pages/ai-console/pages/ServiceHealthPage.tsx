import { useState } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { DataTable, PageHeader } from '../shared';
import { inputCls } from '../sharedUtils';
import type { AIConsoleProps } from '../types';
import type { ServiceHealthStatus } from '../../../types';
import { displayScenario } from '../../../utils/display';

type Props = Pick<
  AIConsoleProps,
  'serviceHealth' | 'onRefreshServiceHealth' | 'onRunServiceHealthCheck' | 'onRetryFailedJobs' | 'onRebuildVectorIndex'
>;

function badgeVariant(status: ServiceHealthStatus) {
  if (status === 'healthy') return 'green';
  if (status === 'degraded') return 'yellow';
  return 'red';
}

function statusLabel(status: ServiceHealthStatus) {
  if (status === 'healthy') return '健康';
  if (status === 'degraded') return '降级';
  return '故障';
}

function severityVariant(severity: 'info' | 'warning' | 'critical') {
  if (severity === 'critical') return 'red';
  if (severity === 'warning') return 'yellow';
  return 'blue';
}

function severityLabel(severity: 'info' | 'warning' | 'critical') {
  if (severity === 'critical') return '严重';
  if (severity === 'warning') return '预警';
  return '提示';
}

function indexStatusLabel(status: 'ready' | 'building' | 'degraded' | 'failed') {
  if (status === 'ready') return '就绪';
  if (status === 'building') return '构建中';
  if (status === 'degraded') return '降级';
  return '失败';
}

function rebuildStatusLabel(status: 'idle' | 'running' | 'failed') {
  if (status === 'idle') return '空闲';
  if (status === 'running') return '执行中';
  return '失败';
}

function queueTaskStatusLabel(status: 'pending' | 'running' | 'failed' | 'completed' | 'retrying') {
  if (status === 'pending') return '待处理';
  if (status === 'running') return '运行中';
  if (status === 'failed') return '失败';
  if (status === 'completed') return '已完成';
  return '重试中';
}

function commonValueLabel(value: string) {
  if (value === 'none') return '无';
  if (value === 'real-time') return '实时';
  if (value === 'Every 15 minutes') return '每 15 分钟';
  return value;
}

function DependencyNode({ label, status, size = 'md' }: { label: string; status: ServiceHealthStatus; size?: 'sm' | 'md' }) {
  const colors = status === 'healthy' ? 'border-[var(--color-success)] bg-[rgba(5,150,105,0.08)] text-[var(--color-success)]' : status === 'degraded' ? 'border-[var(--color-warning)] bg-[rgba(234,179,8,0.08)] text-[var(--color-warning)]' : 'border-[var(--color-danger)] bg-[rgba(239,68,68,0.08)] text-[var(--color-danger)]';
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-[14px] border px-3 py-2 ${colors} ${size === 'sm' ? 'text-xs' : 'text-sm font-medium'}`}>
      <div className={`rounded-full ${status === 'healthy' ? 'bg-[var(--color-success)]' : status === 'degraded' ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-danger)]'} ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
      {label}
    </div>
  );
}

function booleanLabel(value: boolean, yes = '是', no = '否') {
  return value ? yes : no;
}

function SurfaceCard({
  title,
  meta,
  action,
  children,
  className = '',
}: {
  title: string;
  meta?: string[];
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`shell-card rounded-[28px] p-5 relative overflow-hidden ${className}`}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,rgba(179,92,32,0.82),rgba(45,107,93,0.52),transparent)]" />
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="text-[17px] font-semibold tracking-[-0.03em] text-[var(--color-text)]">{title}</div>
          {meta?.length ? (
            <div className="mt-2 space-y-1">
              {meta.map(item => (
                <div key={item} className="text-xs text-[var(--color-text-secondary)]">{item}</div>
              ))}
            </div>
          ) : null}
        </div>
        {action ? <div className="flex items-center gap-2 shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function KeyNumber({
  label,
  value,
  tone = 'default',
  wide = false,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  wide?: boolean;
}) {
  const toneClass =
    tone === 'success'
      ? 'text-[var(--color-success)]'
      : tone === 'warning'
      ? 'text-[var(--color-warning)]'
      : tone === 'danger'
      ? 'text-[var(--color-danger)]'
      : 'text-[var(--color-text)]';

  return (
    <div className={`rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.62)] px-4 py-4 ${wide ? 'min-h-[132px]' : 'min-h-[106px]'}`}>
      <div className="text-[11px] tracking-[0.16em] uppercase text-[var(--color-text-light)]">{label}</div>
      <div className={`mt-4 text-[34px] leading-none font-semibold tracking-[-0.05em] ${toneClass}`}>{value}</div>
    </div>
  );
}

function FactGrid({
  items,
  columns = 2,
}: {
  items: Array<{ label: string; value: string }>;
  columns?: 2 | 3;
}) {
  return (
    <div className={`grid gap-3 ${columns === 3 ? 'grid-cols-3 max-[1200px]:grid-cols-2 max-[720px]:grid-cols-1' : 'grid-cols-2 max-[900px]:grid-cols-1'}`}>
      {items.map(item => (
        <div key={item.label} className="rounded-[20px] bg-[rgba(255,255,255,0.58)] border border-[var(--color-border-light)] px-4 py-3">
          <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--color-text-light)]">{item.label}</div>
          <div className="mt-2 text-[15px] font-medium leading-5 text-[var(--color-text)]">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status, text }: { status: ServiceHealthStatus; text?: string }) {
  return <Badge variant={badgeVariant(status)} className="rounded-[12px] px-3 py-1.5 text-[11px]">{text ?? statusLabel(status)}</Badge>;
}

export function ServiceHealthPage({
  serviceHealth,
  onRefreshServiceHealth,
  onRunServiceHealthCheck,
  onRetryFailedJobs,
  onRebuildVectorIndex,
}: Props) {
  const failedConnectorCount = serviceHealth.connectors.filter(item => item.status !== 'healthy').length;
  const criticalDiagnostics = serviceHealth.diagnostics.filter(item => item.severity === 'critical').length;
  const displayedError = serviceHealth.recentErrors[0] ?? null;

  const [alertThresholds, setAlertThresholds] = useState({ errorRate: 5, latencyMs: 3000, rateLimit: 80 });
  const [alertDirty, setAlertDirty] = useState(false);

  const healthHistory = [
    { checkedAt: serviceHealth.lastHealthCheck.checkedAt, status: serviceHealth.lastHealthCheck.overallStatus, summary: serviceHealth.lastHealthCheck.summary, findings: serviceHealth.lastHealthCheck.findings.length },
    { checkedAt: '2026-05-27 09:35', status: 'healthy' as const, summary: '所有核心依赖运行正常，未检测到明显异常。', findings: 0 },
    { checkedAt: '2026-05-26 16:12', status: 'degraded' as const, summary: '嵌入服务队列出现短暂积压，已自动恢复。', findings: 2 },
    { checkedAt: '2026-05-26 10:48', status: 'healthy' as const, summary: '定期全面巡检完成，所有指标正常。', findings: 1 },
    { checkedAt: '2026-05-25 14:22', status: 'degraded' as const, summary: '向量数据库查询延迟上升，建议关注并发压力。', findings: 3 },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="运行状态"
        actions={(
          <Button size="sm" variant="secondary" onClick={() => { void onRefreshServiceHealth(); }}>
            刷新状态
          </Button>
        )}
      />

      <div className="grid grid-cols-[1.35fr_0.9fr] gap-5 max-[1200px]:grid-cols-1">
        <section className="shell-card rounded-[32px] px-5 py-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(179,92,32,0.14),transparent_44%),radial-gradient(circle_at_bottom_right,rgba(45,107,93,0.10),transparent_36%)] pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[12px] tracking-[0.18em] uppercase text-[var(--color-text-light)]">运行状态</div>
              <div className="mt-3 text-[42px] leading-[0.92] font-semibold tracking-[-0.06em] text-[var(--color-text)]">
                {statusLabel(serviceHealth.lastHealthCheck.overallStatus)}
              </div>
              <div className="mt-4 max-w-[26ch] text-[18px] leading-7 font-medium tracking-[-0.03em] text-[var(--color-text)]">
                {serviceHealth.lastHealthCheck.summary}
              </div>
            </div>
            <StatusPill status={serviceHealth.lastHealthCheck.overallStatus} />
          </div>
          <div className="relative mt-8 flex items-center gap-6 flex-wrap text-xs text-[var(--color-text-secondary)]">
            <span>最近检查：{serviceHealth.lastHealthCheck.checkedAt}</span>
            <span>模型：{serviceHealth.llmStatus.primaryModel}</span>
            <span>队列失败：{serviceHealth.ingestionQueue.failedJobs}</span>
            <span>连接器告警：{failedConnectorCount}</span>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">
          <KeyNumber label="失败队列任务" value={String(serviceHealth.ingestionQueue.failedJobs)} tone={serviceHealth.ingestionQueue.failedJobs > 0 ? 'warning' : 'success'} />
          <KeyNumber label="连接器告警" value={String(failedConnectorCount)} tone={failedConnectorCount > 0 ? 'warning' : 'success'} />
          <KeyNumber label="诊断项" value={String(serviceHealth.diagnostics.length)} tone={criticalDiagnostics > 0 ? 'danger' : 'default'} />
          <KeyNumber label="严重项" value={String(criticalDiagnostics)} tone={criticalDiagnostics > 0 ? 'danger' : 'success'} />
        </div>
      </div>

      <div className="grid grid-cols-[1.1fr_0.9fr] gap-5 max-[1200px]:grid-cols-1">
        <SurfaceCard
          title="最近错误与健康检查"
          meta={[`最近检查：${serviceHealth.lastHealthCheck.checkedAt}`]}
          action={(
            <Button size="sm" variant="secondary" onClick={() => { void onRunServiceHealthCheck(); }}>
              执行健康检查
            </Button>
          )}
        >
          <div className="grid grid-cols-[1.1fr_0.9fr] gap-4 max-[900px]:grid-cols-1">
            <div className="rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(248,249,251,0.66))] border border-[var(--color-border-light)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[15px] font-medium tracking-[-0.02em]">{serviceHealth.lastHealthCheck.summary}</div>
                <StatusPill status={serviceHealth.lastHealthCheck.overallStatus} />
              </div>
              <div className="mt-4 space-y-2">
                {serviceHealth.lastHealthCheck.findings.map(item => (
                  <div key={item} className="rounded-[16px] bg-[rgba(255,255,255,0.7)] border border-[var(--color-border-light)] px-3 py-2.5 text-xs text-[var(--color-text-secondary)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[22px] bg-[rgba(255,255,255,0.62)] border border-[var(--color-border-light)] p-4">
              {displayedError ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[15px] font-medium tracking-[-0.02em]">{displayedError.source}</div>
                    <StatusPill status={displayedError.status} />
                  </div>
                  <div className="mt-4 text-[15px] leading-6">{commonValueLabel(displayedError.message)}</div>
                  <div className="mt-5 space-y-2 text-xs text-[var(--color-text-secondary)]">
                    <div>发现时间：{displayedError.detectedAt}</div>
                    <div>影响范围：{displayedError.impact}</div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-[var(--color-text-secondary)]">当前没有最近错误。</div>
              )}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="模型 API 状态"
          meta={[`最近检查：${serviceHealth.llmStatus.lastChecked}`]}
          action={<StatusPill status={serviceHealth.llmStatus.status} />}
        >
          <div className="mb-4 text-[18px] font-medium tracking-[-0.03em]">{serviceHealth.llmStatus.provider}</div>
          <FactGrid
            items={[
              { label: '主模型', value: serviceHealth.llmStatus.primaryModel },
              { label: '备用模型', value: serviceHealth.llmStatus.fallbackModel },
              { label: '平均延迟', value: `${(serviceHealth.llmStatus.avgLatencyMs / 1000).toFixed(1)} 秒` },
              { label: '错误率', value: `${serviceHealth.llmStatus.errorRate}%` },
              { label: '限流使用率', value: `${serviceHealth.llmStatus.rateLimitUsage}%` },
              { label: '今日成本', value: `$${serviceHealth.llmStatus.estimatedCostToday.toFixed(2)}` },
              { label: 'Token 用量', value: serviceHealth.llmStatus.tokenUsageToday.toLocaleString() },
              { label: '最近错误', value: commonValueLabel(serviceHealth.llmStatus.lastError) },
            ]}
          />
        </SurfaceCard>
      </div>

      <div className="grid grid-cols-2 gap-5 max-[1200px]:grid-cols-1">
        <SurfaceCard title="按职能节点模型" meta={[`最近检查：${serviceHealth.functionalModelStatuses[0]?.lastChecked ?? serviceHealth.lastHealthCheck.checkedAt}`]}>
          <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
            {serviceHealth.functionalModelStatuses.map(item => (
              <article key={item.nodeId} className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-medium tracking-[-0.02em]">{item.nodeName}</div>
                    <div className="mt-2 text-xs text-[var(--color-text-secondary)]">{item.primaryModel}</div>
                    <div className="mt-1 text-[11px] text-[var(--color-text-light)]">备用：{item.fallbackModel}</div>
                  </div>
                  <StatusPill status={item.status} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2"><span className="text-[var(--color-text-light)]">延迟</span><div className="mt-1 font-medium">{item.avgLatencyMs} 毫秒</div></div>
                  <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2"><span className="text-[var(--color-text-light)]">错误率</span><div className="mt-1 font-medium">{item.errorRate}%</div></div>
                  <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2"><span className="text-[var(--color-text-light)]">超时</span><div className="mt-1 font-medium">{item.timeoutMs} 毫秒</div></div>
                </div>
                <div className="mt-4 text-xs text-[var(--color-text-secondary)]">{item.usedBy}</div>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="按业务场景模型" meta={[`最近检查：${serviceHealth.scenarioModelStatuses[0]?.lastChecked ?? serviceHealth.lastHealthCheck.checkedAt}`]}>
          <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
            {serviceHealth.scenarioModelStatuses.map(item => (
              <article key={item.scenario} className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-medium tracking-[-0.02em]">{displayScenario(item.scenario)}</div>
                    <div className="mt-1 text-xs text-[var(--color-text-secondary)]">{item.strategyName}</div>
                    <div className="mt-2 text-xs text-[var(--color-text-secondary)]">{item.primaryModel}</div>
                    <div className="mt-1 text-[11px] text-[var(--color-text-light)]">备用：{item.fallbackModel}</div>
                  </div>
                  <StatusPill status={item.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2"><span className="text-[var(--color-text-light)]">延迟</span><div className="mt-1 font-medium">{item.avgLatencyMs} 毫秒</div></div>
                  <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2"><span className="text-[var(--color-text-light)]">错误率</span><div className="mt-1 font-medium">{item.errorRate}%</div></div>
                  <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2"><span className="text-[var(--color-text-light)]">人工复核</span><div className="mt-1 font-medium">{booleanLabel(item.manualReviewRequired, '需要', '无需')}</div></div>
                  <div className="rounded-[14px] bg-[rgba(255,255,255,0.74)] px-3 py-2"><span className="text-[var(--color-text-light)]">人工发送</span><div className="mt-1 font-medium">{booleanLabel(item.humanSendAllowed, '允许', '禁止')}</div></div>
                </div>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid grid-cols-3 gap-5 max-[1200px]:grid-cols-1">
        <SurfaceCard title="向量化服务状态" meta={[`最近检查：${serviceHealth.lastHealthCheck.checkedAt}`, `最近成功：${serviceHealth.embeddingStatus.lastSuccessfulRun}`]} action={<StatusPill status={serviceHealth.embeddingStatus.status} />}>
          <FactGrid
            columns={2}
            items={[
              { label: '提供方', value: serviceHealth.embeddingStatus.provider },
              { label: '向量模型', value: serviceHealth.embeddingStatus.model },
              { label: '向量维度', value: String(serviceHealth.embeddingStatus.vectorDimension) },
              { label: '队列长度', value: String(serviceHealth.embeddingStatus.queueSize) },
              { label: '平均延迟', value: `${serviceHealth.embeddingStatus.avgLatencyMs} 毫秒` },
              { label: '失败任务', value: String(serviceHealth.embeddingStatus.failedJobs) },
              { label: '重建状态', value: rebuildStatusLabel(serviceHealth.embeddingStatus.rebuildStatus) },
            ]}
          />
        </SurfaceCard>

        <SurfaceCard
          title="向量数据库状态"
          meta={[`最近检查：${serviceHealth.lastHealthCheck.checkedAt}`, `最近重建：${serviceHealth.vectorDbStatus.lastRebuild}`]}
          action={(
            <>
              <Button size="sm" onClick={() => { void onRebuildVectorIndex(); }}>重建索引</Button>
              <StatusPill
                status={serviceHealth.vectorDbStatus.indexStatus === 'ready' ? 'healthy' : serviceHealth.vectorDbStatus.indexStatus === 'building' ? 'degraded' : 'down'}
                text={indexStatusLabel(serviceHealth.vectorDbStatus.indexStatus)}
              />
            </>
          )}
        >
          <FactGrid
            columns={2}
            items={[
              { label: '存储引擎', value: serviceHealth.vectorDbStatus.store },
              { label: '命名空间', value: serviceHealth.vectorDbStatus.namespace },
              { label: '索引名称', value: serviceHealth.vectorDbStatus.indexName },
              { label: '索引版本', value: serviceHealth.vectorDbStatus.indexVersion },
              { label: '向量数量', value: serviceHealth.vectorDbStatus.vectorCount.toLocaleString() },
              { label: '存储占用', value: serviceHealth.vectorDbStatus.storageUsage },
              { label: '查询延迟', value: `${serviceHealth.vectorDbStatus.queryLatencyMs} 毫秒` },
              { label: '最近查询错误', value: commonValueLabel(serviceHealth.vectorDbStatus.lastQueryError) },
            ]}
          />
        </SurfaceCard>

        <SurfaceCard
          title="文档接入队列"
          meta={[`最近检查：${serviceHealth.lastHealthCheck.checkedAt}`, `最近成功同步：${serviceHealth.ingestionQueue.lastSuccessfulSync}`]}
          action={(
            <Button size="sm" variant="secondary" onClick={() => { void onRetryFailedJobs(); }}>
              重试失败任务
            </Button>
          )}
        >
          <div className="grid grid-cols-2 gap-3">
            <KeyNumber label="待处理" value={String(serviceHealth.ingestionQueue.pendingJobs)} />
            <KeyNumber label="运行中" value={String(serviceHealth.ingestionQueue.runningJobs)} />
            <KeyNumber label="失败" value={String(serviceHealth.ingestionQueue.failedJobs)} tone={serviceHealth.ingestionQueue.failedJobs > 0 ? 'danger' : 'success'} />
            <KeyNumber label="队列状态" value={statusLabel(serviceHealth.ingestionQueue.queueStatus)} tone={serviceHealth.ingestionQueue.queueStatus === 'healthy' ? 'success' : 'warning'} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[var(--color-text-secondary)]">
            <div className="rounded-[16px] bg-[rgba(255,255,255,0.56)] px-3 py-2">计划同步：{commonValueLabel(serviceHealth.ingestionQueue.scheduledSync)}</div>
            <div className="rounded-[16px] bg-[rgba(255,255,255,0.56)] px-3 py-2">最早待处理：{commonValueLabel(serviceHealth.ingestionQueue.oldestPendingJob)}</div>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard title="文档接入任务" meta={[`最近检查：${serviceHealth.lastHealthCheck.checkedAt}`]}>
        <DataTable
          className="bg-transparent border border-[var(--color-border-light)]"
          columns={[
            { key: 'job', label: '任务 ID' },
            { key: 'document', label: '文档名称', width: '25%' },
            { key: 'stage', label: '阶段' },
            { key: 'status', label: '状态' },
            { key: 'started', label: '开始时间', width: '16%' },
            { key: 'duration', label: '耗时' },
            { key: 'error', label: '错误信息', width: '18%' },
          ]}
          emptyMessage="当前没有最近队列任务。"
        >
          {serviceHealth.ingestionQueue.recentTasks.map(task => (
            <tr key={task.jobId}>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.jobId}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.documentName}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                {task.stage === 'Parse' ? '解析' : task.stage === 'Chunk' ? '切片' : task.stage === 'Embedding' ? '向量化' : task.stage === 'Index' ? '入索引' : '发布'}
              </td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                <Badge variant={task.status === 'failed' ? 'red' : task.status === 'running' || task.status === 'retrying' ? 'yellow' : 'green'}>
                  {queueTaskStatusLabel(task.status)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.startedAt}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.duration}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{commonValueLabel(task.errorMessage)}</td>
            </tr>
          ))}
        </DataTable>
      </SurfaceCard>

      <div className="grid grid-cols-2 gap-5 max-[1200px]:grid-cols-1">
        <SurfaceCard
          title="告警阈值配置"
          meta={['调整后点击保存生效，当前仅作用于本地会话。']}
          action={
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setAlertThresholds({ errorRate: 5, latencyMs: 3000, rateLimit: 80 }); setAlertDirty(false); }}>重置</Button>
              <Button size="sm" disabled={!alertDirty} onClick={() => setAlertDirty(false)}>保存</Button>
            </div>
          }
        >
          <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
            <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] p-4">
              <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--color-text-light)] mb-3">错误率阈值</div>
              <div className="flex items-center gap-2">
                <input type="number" className={inputCls} value={alertThresholds.errorRate} onChange={e => { setAlertThresholds(prev => ({ ...prev, errorRate: Number(e.target.value) })); setAlertDirty(true); }} />
                <span className="text-xs text-[var(--color-text-secondary)]">%</span>
              </div>
              <div className="mt-2 text-xs text-[var(--color-text-secondary)]">当前：{serviceHealth.llmStatus.errorRate}%</div>
            </div>
            <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] p-4">
              <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--color-text-light)] mb-3">延迟阈值</div>
              <div className="flex items-center gap-2">
                <input type="number" className={inputCls} value={alertThresholds.latencyMs} onChange={e => { setAlertThresholds(prev => ({ ...prev, latencyMs: Number(e.target.value) })); setAlertDirty(true); }} />
                <span className="text-xs text-[var(--color-text-secondary)]">ms</span>
              </div>
              <div className="mt-2 text-xs text-[var(--color-text-secondary)]">当前：{serviceHealth.llmStatus.avgLatencyMs} ms</div>
            </div>
            <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] p-4">
              <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--color-text-light)] mb-3">限流使用率阈值</div>
              <div className="flex items-center gap-2">
                <input type="number" className={inputCls} value={alertThresholds.rateLimit} onChange={e => { setAlertThresholds(prev => ({ ...prev, rateLimit: Number(e.target.value) })); setAlertDirty(true); }} />
                <span className="text-xs text-[var(--color-text-secondary)]">%</span>
              </div>
              <div className="mt-2 text-xs text-[var(--color-text-secondary)]">当前：{serviceHealth.llmStatus.rateLimitUsage}%</div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="健康检查历史"
          meta={[`最近检查：${serviceHealth.lastHealthCheck.checkedAt}`]}
        >
          <div className="space-y-0">
            {healthHistory.map((item, index) => (
              <div key={item.checkedAt} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 ${item.status === 'healthy' ? 'bg-[var(--color-success)] border-[var(--color-success)]' : item.status === 'degraded' ? 'bg-[var(--color-warning)] border-[var(--color-warning)]' : 'bg-[var(--color-danger)] border-[var(--color-danger)]'} shrink-0`} />
                  {index < healthHistory.length - 1 ? <div className="w-0.5 flex-1 bg-[var(--color-border)] my-1" /> : null}
                </div>
                <div className={`pb-4 ${index === healthHistory.length - 1 ? '' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{item.checkedAt}</div>
                    <Badge variant={item.status === 'healthy' ? 'green' : item.status === 'degraded' ? 'yellow' : 'red'} className="rounded-[8px] px-2 py-0.5 text-[10px]">
                      {statusLabel(item.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-1">{item.summary}</div>
                  {item.findings > 0 ? (
                    <div className="text-[11px] text-[var(--color-text-light)] mt-1">{item.findings} 项发现</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard
        title="服务依赖关系"
        meta={['展示核心服务之间的调用链路与依赖方向。']}
      >
        <div className="space-y-4">
          <div className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-5">
            <div className="flex items-center gap-4 flex-wrap max-[900px]:flex-col max-[900px]:items-start">
              <DependencyNode label="LLM API" status={serviceHealth.llmStatus.status} />
              <div className="text-[var(--color-text-light)] text-lg max-[900px]:rotate-90">→</div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <DependencyNode label="职能模型 (7)" status={serviceHealth.functionalModelStatuses.filter(item => item.status !== 'healthy').length > 0 ? 'degraded' : 'healthy'} size="sm" />
                  <div className="text-[var(--color-text-light)] text-sm">→</div>
                  <DependencyNode label="场景模型 (7)" status={serviceHealth.scenarioModelStatuses.filter(item => item.status !== 'healthy').length > 0 ? 'degraded' : 'healthy'} size="sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
            <div className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-4">
              <div className="flex items-center gap-3">
                <DependencyNode label="Embedding" status={serviceHealth.embeddingStatus.status} size="sm" />
                <div className="text-[var(--color-text-light)]">→</div>
                <DependencyNode label="Vector DB" status={serviceHealth.vectorDbStatus.indexStatus === 'ready' ? 'healthy' : 'degraded'} size="sm" />
              </div>
              <div className="mt-3 text-xs text-[var(--color-text-secondary)]">向量化与检索链路</div>
            </div>
            <div className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <DependencyNode label="Connectors" status={failedConnectorCount > 0 ? 'degraded' : 'healthy'} size="sm" />
                <div className="text-[var(--color-text-light)]">→</div>
                <DependencyNode label="Knowledge DB" status={serviceHealth.ingestionQueue.queueStatus} size="sm" />
              </div>
              <div className="mt-3 text-xs text-[var(--color-text-secondary)]">数据接入与知识资产</div>
            </div>
            <div className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <DependencyNode label="Ingestion Queue" status={serviceHealth.ingestionQueue.queueStatus} size="sm" />
                <div className="text-[var(--color-text-light)]">→</div>
                <DependencyNode label="Index Pipeline" status={serviceHealth.vectorDbStatus.indexStatus === 'ready' ? 'healthy' : serviceHealth.vectorDbStatus.indexStatus === 'building' ? 'degraded' : 'down'} size="sm" />
              </div>
              <div className="mt-3 text-xs text-[var(--color-text-secondary)]">文档接入与索引发布</div>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard
        title="故障诊断建议"
        meta={[`最近检查：${serviceHealth.lastHealthCheck.checkedAt}`]}
        action={<StatusPill status={criticalDiagnostics > 0 ? 'down' : serviceHealth.diagnostics.some(item => item.severity === 'warning') ? 'degraded' : 'healthy'} />}
      >
        <div className="grid grid-cols-2 gap-4 max-[1200px]:grid-cols-1">
          {serviceHealth.diagnostics.map(item => (
            <article key={item.id} className="rounded-[22px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.64)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-[15px] font-medium tracking-[-0.02em]">{item.issue}</div>
                <Badge variant={severityVariant(item.severity)} className="rounded-[12px] px-3 py-1.5">
                  {severityLabel(item.severity)}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
                <div className="rounded-[16px] bg-[rgba(255,255,255,0.74)] px-3 py-3">
                  <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--color-text-light)]">可能原因</div>
                  <div className="mt-2 space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                    {item.possibleCauses.map(value => <div key={value}>{value}</div>)}
                  </div>
                </div>
                <div className="rounded-[16px] bg-[rgba(255,255,255,0.74)] px-3 py-3">
                  <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--color-text-light)]">证据</div>
                  <div className="mt-2 space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                    {item.evidence.map(value => <div key={value}>{value}</div>)}
                  </div>
                </div>
                <div className="rounded-[16px] bg-[rgba(255,255,255,0.74)] px-3 py-3">
                  <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--color-text-light)]">建议动作</div>
                  <div className="mt-2 space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                    {item.recommendedActions.map(value => <div key={value}>{value}</div>)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
