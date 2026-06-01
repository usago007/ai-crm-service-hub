import { deriveServiceHealthSnapshot } from '../../../mocks/fixtures/serviceHub';
import type { ServiceHubApi } from '../../contracts/serviceHub';
import type { ServiceHubSnapshot } from '../../../types';
import { cloneSnapshot, nowIso, nowUiStamp, withServiceHealth } from './shared';

export function createServiceHealthHandlers(snapshot: ServiceHubSnapshot): Pick<
  ServiceHubApi,
  | 'refreshServiceHealth'
  | 'runServiceHealthCheck'
  | 'retryFailedIngestionJobs'
  | 'rebuildVectorIndex'
  | 'getServiceHealthLastError'
> {
  return {
    async refreshServiceHealth() {
      const next = cloneSnapshot(snapshot);
      const health = structuredClone(next.serviceHealth);
      health.llmStatus.lastChecked = nowUiStamp();
      health.llmStatus.avgLatencyMs = Math.max(1550, health.llmStatus.avgLatencyMs + 40);
      health.llmStatus.rateLimitUsage = Math.min(78, health.llmStatus.rateLimitUsage + 1);
      health.embeddingStatus.queueSize = Math.max(6, health.embeddingStatus.queueSize - 1);
      health.embeddingStatus.lastSuccessfulRun = nowUiStamp();
      health.vectorDbStatus.queryLatencyMs = Math.max(72, health.vectorDbStatus.queryLatencyMs - 4);
      health.functionalModelStatuses = health.functionalModelStatuses.map(item => ({
        ...item,
        lastChecked: health.llmStatus.lastChecked,
        avgLatencyMs: Math.max(1100, item.avgLatencyMs + (item.nodeId === 'reply-drafting' ? 35 : 18)),
      }));
      health.scenarioModelStatuses = health.scenarioModelStatuses.map(item => ({
        ...item,
        lastChecked: health.llmStatus.lastChecked,
        avgLatencyMs: Math.max(1500, item.avgLatencyMs + (['Refund', 'Complaint', 'Compensation', 'Chargeback'].includes(item.scenario) ? 28 : 16)),
      }));
      health.ingestionQueue.lastSuccessfulSync = nowUiStamp();
      health.ingestionQueue.oldestPendingJob = health.ingestionQueue.pendingJobs > 0 ? nowUiStamp() : 'none';
      health.recentErrors = health.recentErrors.map((item, index) => index === 0 ? { ...item, detectedAt: nowUiStamp() } : item);
      next.serviceHealth = health;
      return { snapshot: next, serviceHealth: next.serviceHealth };
    },
    async runServiceHealthCheck() {
      const next = cloneSnapshot(snapshot);
      const health = deriveServiceHealthSnapshot(next);
      health.lastHealthCheck = {
        checkedAt: nowUiStamp(),
        overallStatus: health.diagnostics.some(item => item.severity === 'critical') ? 'degraded' : 'healthy',
        summary: health.diagnostics.some(item => item.severity === 'critical')
          ? '发现知识发布与检索侧异常，建议先处理失败接入任务。'
          : '核心依赖稳定，未发现阻断性问题。',
        findings: health.diagnostics.slice(0, 3).map(item => item.issue),
      };
      next.serviceHealth = health;
      return { snapshot: next, result: next.serviceHealth.lastHealthCheck };
    },
    async retryFailedIngestionJobs() {
      const next = cloneSnapshot(snapshot);
      const retriedJobRecords = next.ingestionJobs
        .filter(job => ['embedding_failed', 'chunk_failed', 'version_conflict', 'expired'].includes(job.status))
        .slice(0, 3)
        .map(job => ({ id: job.id, documentId: job.documentId }));
      const retriedJobs = retriedJobRecords.map(item => item.id);
      const retriedDocumentIds = new Set(retriedJobRecords.map(item => item.documentId));
      next.ingestionJobs = next.ingestionJobs.map(job => retriedJobs.includes(job.id)
        ? { ...job, status: 'indexed', updatedAt: nowIso(), detail: '已加入重试队列，等待重新发布。' }
        : job);
      next.ingestionDocuments = next.ingestionDocuments.map(document => retriedDocumentIds.has(document.documentId)
        ? { ...document, embeddingStatus: 'embedded', indexStatus: 'indexed', lastSync: nowUiStamp() }
        : document);
      withServiceHealth(next);
      next.serviceHealth.ingestionQueue.recentTasks = next.serviceHealth.ingestionQueue.recentTasks.map(task => retriedJobs.includes(task.jobId)
        ? { ...task, status: 'retrying', retryCount: task.retryCount + 1, errorMessage: 'none' }
        : task);
      return { snapshot: next, serviceHealth: next.serviceHealth, retriedJobs };
    },
    async rebuildVectorIndex() {
      const next = cloneSnapshot(snapshot);
      withServiceHealth(next);
      next.serviceHealth.vectorDbStatus.indexStatus = 'building';
      next.serviceHealth.vectorDbStatus.lastRebuild = nowUiStamp();
      next.serviceHealth.vectorDbStatus.lastQueryError = 'none';
      next.serviceHealth.lastHealthCheck = {
        checkedAt: nowUiStamp(),
        overallStatus: 'degraded',
        summary: '已触发 mock 重建索引，请等待向量索引回到 ready。',
        findings: ['Vector index rebuild requested'],
      };
      return { snapshot: next, serviceHealth: next.serviceHealth, message: '已触发 mock 索引重建。' };
    },
    async getServiceHealthLastError(id?: string) {
      const next = cloneSnapshot(snapshot);
      if (id) return next.serviceHealth.recentErrors.find(item => item.id === id);
      return next.serviceHealth.recentErrors[0];
    },
  };
}
