import { useState, useMemo } from 'react';
import type { AIConsoleProps } from '../../types';
import type { ServiceHealthSeverity } from '../../../../types';
import { PageHeader } from '../../shared';
import { ServiceHealthTabs } from './ServiceHealthTabs';
import type { HealthTab } from './ServiceHealthTabs';
import { OverviewTab } from './OverviewTab';
import { ServicesAndModelsTab } from './ServicesAndModelsTab';
import { DocumentQueueTab } from './DocumentQueueTab';
import { DiagnosticsTab } from './DiagnosticsTab';

type Props = Pick<
  AIConsoleProps,
  'serviceHealth' | 'onRunServiceHealthCheck' | 'onRetryFailedJobs' | 'onRebuildVectorIndex'
>;

interface AnomalyItem {
  id: string;
  issue: string;
  severity: ServiceHealthSeverity;
  cause: string;
  suggestedAction: string;
  impact: string;
}

export function ServiceHealthPage({
  serviceHealth,
  onRunServiceHealthCheck,
  onRetryFailedJobs,
  onRebuildVectorIndex,
}: Props) {
  const [activeTab, setActiveTab] = useState<HealthTab>('overview');

  const failedConnectorCount = serviceHealth.connectors.filter(item => item.status !== 'healthy').length;
  const criticalDiagCount = serviceHealth.diagnostics.filter(item => item.severity === 'critical').length;
  const affectedScenarioCount = serviceHealth.scenarioModelStatuses.filter(s => s.status !== 'healthy').length;

  const topAnomalies: AnomalyItem[] = useMemo(() => {
    return serviceHealth.diagnostics
      .filter(d => d.severity === 'critical' || d.severity === 'warning')
      .slice(0, 3)
      .map(d => ({
        id: d.id,
        issue: d.issue,
        severity: d.severity,
        cause: d.possibleCauses[0] ?? '',
        suggestedAction: d.recommendedActions[0] ?? '',
        impact: d.evidence[0] ?? '',
      }));
  }, [serviceHealth.diagnostics]);

  const healthHistory = [
    { checkedAt: serviceHealth.lastHealthCheck.checkedAt, status: serviceHealth.lastHealthCheck.overallStatus, summary: serviceHealth.lastHealthCheck.summary, findings: serviceHealth.lastHealthCheck.findings.length },
    { checkedAt: '2026-05-27 09:35', status: 'healthy' as const, summary: '所有核心依赖运行正常，未检测到明显异常。', findings: 0 },
    { checkedAt: '2026-05-26 16:12', status: 'degraded' as const, summary: '嵌入服务队列出现短暂积压，已自动恢复。', findings: 2 },
    { checkedAt: '2026-05-26 10:48', status: 'healthy' as const, summary: '定期全面巡检完成，所有指标正常。', findings: 1 },
    { checkedAt: '2026-05-25 14:22', status: 'degraded' as const, summary: '向量数据库查询延迟上升，建议关注并发压力。', findings: 3 },
  ];

  const modelChainAnomalyCount = useMemo(() => {
    const functionalAbnormal = serviceHealth.functionalModelStatuses.filter(f => f.status !== 'healthy').length;
    const scenarioAbnormal = serviceHealth.scenarioModelStatuses.filter(s => s.status !== 'healthy').length;
    return functionalAbnormal + scenarioAbnormal;
  }, [serviceHealth.functionalModelStatuses, serviceHealth.scenarioModelStatuses]);

  const tabAnomalyCounts: Partial<Record<HealthTab, number>> = {
    overview: topAnomalies.length > 0 ? topAnomalies.length : undefined,
    services: modelChainAnomalyCount,
    queue: serviceHealth.ingestionQueue.failedJobs,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="运行状态"
        description="监控模型服务、向量数据库、知识库接入队列与业务场景链路的健康状态。"
      />

      <ServiceHealthTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        anomalyCounts={tabAnomalyCounts}
      />

      {activeTab === 'overview' && (
        <OverviewTab
          overallStatus={serviceHealth.lastHealthCheck.overallStatus}
          lastCheckedAt={serviceHealth.lastHealthCheck.checkedAt}
          failedJobs={serviceHealth.ingestionQueue.failedJobs}
          failedConnectorCount={failedConnectorCount}
          criticalDiagCount={criticalDiagCount}
          affectedScenarioCount={affectedScenarioCount}
          topAnomalies={topAnomalies}
          onRunDiagnostic={() => { void onRunServiceHealthCheck(); }}
        />
      )}

      {activeTab === 'services' && (
        <ServicesAndModelsTab
          llmStatus={serviceHealth.llmStatus}
          embeddingStatus={serviceHealth.embeddingStatus}
          vectorDbStatus={serviceHealth.vectorDbStatus}
          ingestionQueue={serviceHealth.ingestionQueue}
          functionalModelStatuses={serviceHealth.functionalModelStatuses}
          scenarioModelStatuses={serviceHealth.scenarioModelStatuses}
          onRetryFailedJobs={() => { void onRetryFailedJobs(); }}
          onRebuildVectorIndex={() => { void onRebuildVectorIndex(); }}
        />
      )}

      {activeTab === 'queue' && (
        <DocumentQueueTab
          ingestionQueue={serviceHealth.ingestionQueue}
          tasks={serviceHealth.ingestionQueue.recentTasks}
          onRetryFailedJobs={() => { void onRetryFailedJobs(); }}
        />
      )}

      {activeTab === 'diagnostics' && (
        <DiagnosticsTab
          history={healthHistory}
          llmStatus={serviceHealth.llmStatus}
          embeddingStatus={serviceHealth.embeddingStatus}
          vectorDbStatus={serviceHealth.vectorDbStatus}
          ingestionQueue={serviceHealth.ingestionQueue}
          functionalModelStatuses={serviceHealth.functionalModelStatuses}
          scenarioModelStatuses={serviceHealth.scenarioModelStatuses}
          failedConnectorCount={failedConnectorCount}
          llmErrorRate={serviceHealth.llmStatus.errorRate}
          llmAvgLatency={serviceHealth.llmStatus.avgLatencyMs}
          llmRateLimitUsage={serviceHealth.llmStatus.rateLimitUsage}
        />
      )}
    </div>
  );
}
