export type ServiceHealthStatus = 'healthy' | 'degraded' | 'down';
export type ServiceHealthSeverity = 'info' | 'warning' | 'critical';
export type IngestionQueueTaskStage = 'Parse' | 'Chunk' | 'Embedding' | 'Index' | 'Publish';
export type IngestionQueueTaskStatus = 'pending' | 'running' | 'failed' | 'completed' | 'retrying';

export interface LLMStatus {
  provider: string;
  primaryModel: string;
  fallbackModel: string;
  status: ServiceHealthStatus;
  avgLatencyMs: number;
  errorRate: number;
  rateLimitUsage: number;
  tokenUsageToday: number;
  estimatedCostToday: number;
  lastError: string;
  lastChecked: string;
}

export interface EmbeddingServiceStatus {
  provider: string;
  model: string;
  status: ServiceHealthStatus;
  queueSize: number;
  avgLatencyMs: number;
  failedJobs: number;
  vectorDimension: number;
  lastSuccessfulRun: string;
  rebuildStatus: 'idle' | 'running' | 'failed';
}

export interface VectorDbStatus {
  store: string;
  indexName: string;
  indexStatus: 'ready' | 'building' | 'degraded' | 'failed';
  vectorCount: number;
  namespace: string;
  storageUsage: string;
  queryLatencyMs: number;
  indexVersion: string;
  lastRebuild: string;
  lastQueryError: string;
}

export interface FunctionalModelStatus {
  nodeId: string;
  nodeName: string;
  status: ServiceHealthStatus;
  primaryModel: string;
  fallbackModel: string;
  timeoutMs: number;
  retryCount: number;
  citationRequired: boolean;
  humanConfirmationRequired: boolean;
  avgLatencyMs: number;
  errorRate: number;
  lastChecked: string;
  usedBy: string;
}

export interface ScenarioModelStatus {
  scenario: string;
  strategyName: string;
  status: ServiceHealthStatus;
  primaryModel: string;
  fallbackModel: string;
  modelChannel: string;
  temperature: number;
  topK: number;
  similarityThreshold: number;
  citationRequired: boolean;
  manualReviewRequired: boolean;
  humanSendAllowed: boolean;
  avgLatencyMs: number;
  errorRate: number;
  lastChecked: string;
}

export interface ConnectorStatus {
  systemName: string;
  status: ServiceHealthStatus;
  latencyMs: number;
  lastSync: string;
  lastError: string;
  usedBy: string;
}

export interface IngestionQueueTask {
  jobId: string;
  documentName: string;
  stage: IngestionQueueTaskStage;
  status: IngestionQueueTaskStatus;
  startedAt: string;
  duration: string;
  errorMessage: string;
  retryCount: number;
}

export interface DocumentIngestionQueueStatus {
  queueStatus: ServiceHealthStatus;
  pendingJobs: number;
  runningJobs: number;
  failedJobs: number;
  lastSuccessfulSync: string;
  scheduledSync: string;
  retryPolicy: string;
  oldestPendingJob: string;
  recentTasks: IngestionQueueTask[];
}

export interface ServiceHealthError {
  id: string;
  source: string;
  status: ServiceHealthStatus;
  message: string;
  detectedAt: string;
  impact: string;
}

export interface ServiceHealthDiagnostic {
  id: string;
  issue: string;
  severity: ServiceHealthSeverity;
  possibleCauses: string[];
  evidence: string[];
  recommendedActions: string[];
}

export interface ServiceHealthCheckResult {
  checkedAt: string;
  overallStatus: ServiceHealthStatus;
  summary: string;
  findings: string[];
}

export interface ServiceHealthSnapshot {
  llmStatus: LLMStatus;
  functionalModelStatuses: FunctionalModelStatus[];
  scenarioModelStatuses: ScenarioModelStatus[];
  embeddingStatus: EmbeddingServiceStatus;
  vectorDbStatus: VectorDbStatus;
  connectors: ConnectorStatus[];
  ingestionQueue: DocumentIngestionQueueStatus;
  recentErrors: ServiceHealthError[];
  diagnostics: ServiceHealthDiagnostic[];
  lastHealthCheck: ServiceHealthCheckResult;
}
