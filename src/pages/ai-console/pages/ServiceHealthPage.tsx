import type { ReactNode } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import type { AIConsoleProps } from '../types';
import { DataTable, InfoCard, PageHeader, SectionCard, StatCard } from '../shared';
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

function booleanLabel(value: boolean, yes = '是', no = '否') {
  return value ? yes : no;
}

function SectionMeta({
  checkedAt,
  status,
  statusText,
  secondaryText,
  action,
}: {
  checkedAt: string;
  status?: ServiceHealthStatus;
  statusText?: string;
  secondaryText?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="space-y-1">
        <div className="text-xs text-[var(--color-text-secondary)]">最近检查：{checkedAt}</div>
        {secondaryText ? <div className="text-xs text-[var(--color-text-secondary)]">{secondaryText}</div> : null}
      </div>
      <div className="flex items-center gap-2">
        {action}
        {status ? <Badge variant={badgeVariant(status)}>{statusText ?? statusLabel(status)}</Badge> : null}
      </div>
    </div>
  );
}

export function ServiceHealthPage({
  serviceHealth,
  onRefreshServiceHealth,
  onRunServiceHealthCheck,
  onRetryFailedJobs,
  onRebuildVectorIndex,
}: Props) {
  const failedConnectorCount = serviceHealth.connectors.filter(item => item.status !== 'healthy').length;
  const displayedError = serviceHealth.recentErrors[0] ?? null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="运行状态"
        description="用基础设施状态解释 AI 草稿慢、RAG 空结果、引用缺失、文档未生效和业务上下文读取异常。"
        actions={(
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="secondary" onClick={() => { void onRefreshServiceHealth(); }}>刷新状态</Button>
          </div>
        )}
      />

      <div className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-2">
        <StatCard label="总体状态" value={statusLabel(serviceHealth.lastHealthCheck.overallStatus)} detail={serviceHealth.lastHealthCheck.checkedAt} tone={serviceHealth.lastHealthCheck.overallStatus === 'healthy' ? 'success' : 'warning'} />
        <StatCard label="失败队列任务" value={String(serviceHealth.ingestionQueue.failedJobs)} detail={commonValueLabel(serviceHealth.ingestionQueue.retryPolicy)} tone={serviceHealth.ingestionQueue.failedJobs > 0 ? 'warning' : 'success'} />
        <StatCard label="连接器告警" value={String(failedConnectorCount)} detail={`共监控 ${serviceHealth.connectors.length} 个连接器`} tone={failedConnectorCount > 0 ? 'warning' : 'success'} />
        <StatCard label="诊断项" value={String(serviceHealth.diagnostics.length)} detail={serviceHealth.lastHealthCheck.summary} tone={serviceHealth.diagnostics.some(item => item.severity === 'critical') ? 'danger' : 'default'} />
      </div>

      <SectionCard title="模型 API 状态">
        <div className="text-sm font-semibold mb-1">{serviceHealth.llmStatus.provider}</div>
        <SectionMeta checkedAt={serviceHealth.llmStatus.lastChecked} status={serviceHealth.llmStatus.status} />
        <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
          <InfoCard label="主模型" value={serviceHealth.llmStatus.primaryModel} />
          <InfoCard label="备用模型" value={serviceHealth.llmStatus.fallbackModel} />
          <InfoCard label="平均延迟" value={`${(serviceHealth.llmStatus.avgLatencyMs / 1000).toFixed(1)} 秒`} />
          <InfoCard label="错误率" value={`${serviceHealth.llmStatus.errorRate}%`} />
          <InfoCard label="限流使用率" value={`${serviceHealth.llmStatus.rateLimitUsage}%`} />
          <InfoCard label="今日预估成本" value={`$${serviceHealth.llmStatus.estimatedCostToday.toFixed(2)}`} />
          <InfoCard label="今日 Token 用量" value={serviceHealth.llmStatus.tokenUsageToday.toLocaleString()} />
          <InfoCard label="最近错误" value={commonValueLabel(serviceHealth.llmStatus.lastError)} />
        </div>
      </SectionCard>

      <SectionCard title="按职能节点模型">
        <SectionMeta
          checkedAt={serviceHealth.functionalModelStatuses[0]?.lastChecked ?? serviceHealth.lastHealthCheck.checkedAt}
        />
        <DataTable
          columns={[
            { key: 'node', label: '职能节点', width: '14%' },
            { key: 'primary', label: '主模型', width: '11%' },
            { key: 'fallback', label: '备用模型', width: '11%' },
            { key: 'status', label: '状态' },
            { key: 'latency', label: '平均延迟' },
            { key: 'error', label: '错误率' },
            { key: 'timeout', label: '超时' },
            { key: 'retry', label: '重试' },
            { key: 'citation', label: '引用要求' },
            { key: 'review', label: '人工确认' },
            { key: 'usedBy', label: '用途', width: '16%' },
          ]}
          emptyMessage="当前没有职能节点模型状态。"
        >
          {serviceHealth.functionalModelStatuses.map(item => (
            <tr key={item.nodeId}>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.nodeName}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.primaryModel}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.fallbackModel}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={badgeVariant(item.status)}>{statusLabel(item.status)}</Badge></td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.avgLatencyMs} 毫秒</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.errorRate}%</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.timeoutMs} 毫秒</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.retryCount}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{booleanLabel(item.citationRequired, '需要', '无')}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{booleanLabel(item.humanConfirmationRequired, '需要', '无需')}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)]">{item.usedBy}</td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>

      <SectionCard title="按业务场景模型">
        <SectionMeta
          checkedAt={serviceHealth.scenarioModelStatuses[0]?.lastChecked ?? serviceHealth.lastHealthCheck.checkedAt}
        />
        <DataTable
          columns={[
            { key: 'scenario', label: '场景', width: '10%' },
            { key: 'strategy', label: '策略名', width: '16%' },
            { key: 'primary', label: '主模型', width: '11%' },
            { key: 'fallback', label: '备用模型', width: '11%' },
            { key: 'status', label: '状态' },
            { key: 'latency', label: '平均延迟' },
            { key: 'error', label: '错误率' },
            { key: 'temp', label: '温度' },
            { key: 'topK', label: 'TopK' },
            { key: 'threshold', label: '相似度阈值' },
            { key: 'citation', label: '引用要求' },
            { key: 'review', label: '人工复核' },
            { key: 'send', label: '人工发送' },
          ]}
          emptyMessage="当前没有业务场景模型状态。"
        >
          {serviceHealth.scenarioModelStatuses.map(item => (
            <tr key={item.scenario}>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{displayScenario(item.scenario)}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.strategyName}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.primaryModel}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.fallbackModel}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={badgeVariant(item.status)}>{statusLabel(item.status)}</Badge></td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.avgLatencyMs} 毫秒</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.errorRate}%</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.temperature}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.topK}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.similarityThreshold}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{booleanLabel(item.citationRequired, '需要', '无')}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{booleanLabel(item.manualReviewRequired, '需要', '无需')}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{booleanLabel(item.humanSendAllowed, '允许', '禁止')}</td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>

      <div className="grid grid-cols-[1fr_1fr] gap-4 max-[1200px]:grid-cols-1">
        <SectionCard title="向量化服务状态">
          <div className="mb-4">
            <div className="text-sm font-semibold">{serviceHealth.embeddingStatus.provider}</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">用于文档切片向量化、重建队列与发布前索引准备。</div>
          </div>
          <SectionMeta
            checkedAt={serviceHealth.lastHealthCheck.checkedAt}
            status={serviceHealth.embeddingStatus.status}
            secondaryText={`最近成功：${serviceHealth.embeddingStatus.lastSuccessfulRun}`}
          />
          <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
            <InfoCard label="向量模型" value={serviceHealth.embeddingStatus.model} />
            <InfoCard label="向量维度" value={String(serviceHealth.embeddingStatus.vectorDimension)} />
            <InfoCard label="队列长度" value={String(serviceHealth.embeddingStatus.queueSize)} />
            <InfoCard label="平均延迟" value={`${serviceHealth.embeddingStatus.avgLatencyMs} 毫秒`} />
            <InfoCard label="失败任务数" value={String(serviceHealth.embeddingStatus.failedJobs)} />
            <InfoCard label="重建状态" value={rebuildStatusLabel(serviceHealth.embeddingStatus.rebuildStatus)} />
          </div>
        </SectionCard>

        <SectionCard title="向量数据库状态">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="text-sm font-semibold">{serviceHealth.vectorDbStatus.store}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">命名空间：{serviceHealth.vectorDbStatus.namespace}</div>
            </div>
            <Button size="sm" onClick={() => { void onRebuildVectorIndex(); }}>重建索引</Button>
          </div>
          <SectionMeta
            checkedAt={serviceHealth.lastHealthCheck.checkedAt}
            status={serviceHealth.vectorDbStatus.indexStatus === 'ready' ? 'healthy' : serviceHealth.vectorDbStatus.indexStatus === 'building' ? 'degraded' : 'down'}
            statusText={indexStatusLabel(serviceHealth.vectorDbStatus.indexStatus)}
            secondaryText={`最近重建：${serviceHealth.vectorDbStatus.lastRebuild}`}
          />
          <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
            <InfoCard label="索引名称" value={serviceHealth.vectorDbStatus.indexName} />
            <InfoCard label="索引版本" value={serviceHealth.vectorDbStatus.indexVersion} />
            <InfoCard label="向量数量" value={serviceHealth.vectorDbStatus.vectorCount.toLocaleString()} />
            <InfoCard label="存储占用" value={serviceHealth.vectorDbStatus.storageUsage} />
            <InfoCard label="查询延迟" value={`${serviceHealth.vectorDbStatus.queryLatencyMs} 毫秒`} />
            <InfoCard label="最近查询错误" value={commonValueLabel(serviceHealth.vectorDbStatus.lastQueryError)} />
          </div>
        </SectionCard>

        <div className="col-span-2 max-[1200px]:col-span-1">
          <SectionCard title="最近错误与健康检查">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="max-w-[70%]">
                <div className="text-sm font-semibold">系统级健康结论</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { void onRunServiceHealthCheck(); }}>执行健康检查</Button>
              </div>
            </div>
            <SectionMeta checkedAt={serviceHealth.lastHealthCheck.checkedAt} status={serviceHealth.lastHealthCheck.overallStatus} />
            <div className="grid grid-cols-[1.3fr_1fr] gap-4 max-[1200px]:grid-cols-1">
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] p-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)]">健康检查结论</div>
                <div className="mt-3 text-sm font-medium">{serviceHealth.lastHealthCheck.summary}</div>
                <div className="mt-4 space-y-2 text-xs text-[var(--color-text-secondary)]">
                  {serviceHealth.lastHealthCheck.findings.map(item => (
                    <div key={item} className="rounded-[14px] bg-[rgba(245,247,250,0.92)] px-3 py-2">{item}</div>
                  ))}
                </div>
              </div>
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] p-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)]">最近错误</div>
                {displayedError ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">{displayedError.source}</div>
                      <Badge variant={badgeVariant(displayedError.status)}>{statusLabel(displayedError.status)}</Badge>
                    </div>
                    <div className="mt-3 text-sm">{commonValueLabel(displayedError.message)}</div>
                    <div className="mt-3 text-xs text-[var(--color-text-secondary)]">发现时间：{displayedError.detectedAt}</div>
                    <div className="mt-2 text-xs text-[var(--color-text-secondary)]">影响范围：{displayedError.impact}</div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-[var(--color-text-secondary)]">当前没有最近错误。</div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="业务数据连接器">
        <SectionMeta
          checkedAt={serviceHealth.lastHealthCheck.checkedAt}
          secondaryText={`共监控 ${serviceHealth.connectors.length} 个连接器，其中 ${failedConnectorCount} 个存在告警。`}
        />
        <DataTable
          columns={[
            { key: 'system', label: '系统名称', width: '18%' },
            { key: 'status', label: '状态' },
            { key: 'latency', label: '延迟' },
            { key: 'sync', label: '最近同步' },
            { key: 'error', label: '最近错误', width: '20%' },
            { key: 'used', label: '服务对象', width: '24%' },
          ]}
          emptyMessage="当前没有连接器监控数据。"
        >
          {serviceHealth.connectors.map(item => (
            <tr key={item.systemName}>
              <td className="px-4 py-3 text-[13px] border-b border-[var(--color-border-light)]">{item.systemName}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={badgeVariant(item.status)}>{statusLabel(item.status)}</Badge></td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.latencyMs} 毫秒</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{commonValueLabel(item.lastSync)}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{commonValueLabel(item.lastError)}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)]">{item.usedBy}</td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>

      <SectionCard title="文档接入队列">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="max-w-[70%]">
            <div className="text-sm font-semibold">接入队列与发布状态</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">用于定位文档上传后不能检索、向量化失败和发布阶段卡住的问题。</div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => { void onRetryFailedJobs(); }}>重试失败任务</Button>
        </div>
        <SectionMeta checkedAt={serviceHealth.lastHealthCheck.checkedAt} status={serviceHealth.ingestionQueue.queueStatus} secondaryText={`最近成功同步：${serviceHealth.ingestionQueue.lastSuccessfulSync}`} />
        <div className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-2 mb-4">
          <InfoCard label="队列状态" value={statusLabel(serviceHealth.ingestionQueue.queueStatus)} />
          <InfoCard label="待处理任务" value={String(serviceHealth.ingestionQueue.pendingJobs)} />
          <InfoCard label="运行中任务" value={String(serviceHealth.ingestionQueue.runningJobs)} />
          <InfoCard label="失败任务" value={String(serviceHealth.ingestionQueue.failedJobs)} />
          <InfoCard label="最近成功同步" value={serviceHealth.ingestionQueue.lastSuccessfulSync} />
          <InfoCard label="计划同步" value={commonValueLabel(serviceHealth.ingestionQueue.scheduledSync)} />
          <InfoCard label="重试策略" value={commonValueLabel(serviceHealth.ingestionQueue.retryPolicy)} />
          <InfoCard label="最早待处理任务" value={commonValueLabel(serviceHealth.ingestionQueue.oldestPendingJob)} />
        </div>
        <DataTable
          columns={[
            { key: 'job', label: '任务 ID' },
            { key: 'document', label: '文档名称', width: '24%' },
            { key: 'stage', label: '阶段' },
            { key: 'status', label: '状态' },
            { key: 'started', label: '开始时间', width: '16%' },
            { key: 'duration', label: '耗时' },
            { key: 'error', label: '错误信息', width: '18%' },
            { key: 'retry', label: '重试次数' },
          ]}
          emptyMessage="当前没有最近队列任务。"
        >
          {serviceHealth.ingestionQueue.recentTasks.map(task => (
            <tr key={task.jobId}>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.jobId}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.documentName}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.stage === 'Parse' ? '解析' : task.stage === 'Chunk' ? '切片' : task.stage === 'Embedding' ? '向量化' : task.stage === 'Index' ? '入索引' : '发布'}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={task.status === 'failed' ? 'red' : task.status === 'running' || task.status === 'retrying' ? 'yellow' : 'green'}>{queueTaskStatusLabel(task.status)}</Badge></td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.startedAt}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.duration}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{commonValueLabel(task.errorMessage)}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{task.retryCount}</td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>

      <SectionCard title="故障诊断建议">
        <SectionMeta
          checkedAt={serviceHealth.lastHealthCheck.checkedAt}
          secondaryText="诊断建议会优先引用模型、索引、连接器和接入队列的当前状态作为证据。"
        />
        <div className="space-y-3">
          {serviceHealth.diagnostics.map(item => (
            <div key={item.id} className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.68)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">{item.issue}</div>
                <Badge variant={severityVariant(item.severity)}>{severityLabel(item.severity)}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3 max-[1000px]:grid-cols-1">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)] mb-2">可能原因</div>
                  <div className="space-y-1 text-xs">{item.possibleCauses.map(value => <div key={value}>{value}</div>)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)] mb-2">证据</div>
                  <div className="space-y-1 text-xs">{item.evidence.map(value => <div key={value}>{value}</div>)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)] mb-2">建议动作</div>
                  <div className="space-y-1 text-xs">{item.recommendedActions.map(value => <div key={value}>{value}</div>)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
