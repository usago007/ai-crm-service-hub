import type {
  FunctionalModelStatus,
  IngestionDocumentRecord,
  IngestionJob,
  PipelineNodeModelConfig,
  ScenarioModelConfig,
  ScenarioModelStatus,
  ServiceHealthCheckResult,
  ServiceHealthDiagnostic,
  ServiceHealthError,
  ServiceHealthSnapshot,
  ServiceHealthStatus,
  ServiceHubSnapshot,
} from '../../types';

function mostUsedModel(configs: ScenarioModelConfig[], field: 'primaryModel' | 'fallbackModel') {
  const counts = new Map<string, number>();
  for (const config of configs) {
    const model = config[field];
    counts.set(model, (counts.get(model) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'unknown';
}

function deriveHealthStatusFromLatency(latencyMs: number, errorRate: number, usage: number): ServiceHealthStatus {
  if (errorRate >= 3 || latencyMs >= 3200 || usage >= 92) return 'down';
  if (errorRate >= 1 || latencyMs >= 2200 || usage >= 75) return 'degraded';
  return 'healthy';
}

function functionalNodeUsageLabel(nodeId: PipelineNodeModelConfig['nodeId']) {
  switch (nodeId) {
    case 'intent-classification':
      return '工单分诊';
    case 'conversation-summary':
      return '会话摘要';
    case 'knowledge-retrieval':
      return 'RAG 召回';
    case 'policy-check':
      return '政策边界校验';
    case 'reply-drafting':
      return 'AI 草稿生成';
    case 'risk-detection':
      return '人工复核前置判断';
    case 'feedback-capture':
      return '反馈闭环采集';
    default:
      return '通用模型链路';
  }
}

function functionalLatencyProfile(nodeId: PipelineNodeModelConfig['nodeId']) {
  switch (nodeId) {
    case 'reply-drafting':
      return { avgLatencyMs: 2380, errorRate: 1.2, usage: 72 };
    case 'policy-check':
      return { avgLatencyMs: 2480, errorRate: 1.4, usage: 76 };
    case 'risk-detection':
      return { avgLatencyMs: 2260, errorRate: 1.1, usage: 71 };
    case 'knowledge-retrieval':
      return { avgLatencyMs: 1680, errorRate: 0.8, usage: 58 };
    case 'conversation-summary':
      return { avgLatencyMs: 1560, errorRate: 0.6, usage: 52 };
    case 'feedback-capture':
      return { avgLatencyMs: 1480, errorRate: 0.5, usage: 48 };
    case 'intent-classification':
      return { avgLatencyMs: 1320, errorRate: 0.4, usage: 44 };
    default:
      return { avgLatencyMs: 1520, errorRate: 0.6, usage: 50 };
  }
}

function findScenarioModelConfig(snapshot: ServiceHubSnapshot, scenario: string) {
  return snapshot.scenarioModelConfigs.find(item => item.scenario === scenario) ?? snapshot.scenarioModelConfigs[0];
}

function scenarioLatencyProfile(config: ScenarioModelConfig) {
  const sensitive = ['Refund', 'Complaint', 'Compensation', 'Chargeback'].includes(config.scenario);
  return {
    avgLatencyMs: sensitive ? 2240 : config.scenario === 'Product Inquiry' ? 1660 : 1780,
    errorRate: sensitive ? 1.3 : config.scenario === 'Payment' ? 0.8 : 0.6,
    usage: sensitive ? 74 : 58,
  };
}

function buildFunctionalModelStatuses(snapshot: ServiceHubSnapshot, lastChecked: string): FunctionalModelStatus[] {
  const visibleNodeIds: PipelineNodeModelConfig['nodeId'][] = [
    'intent-classification',
    'conversation-summary',
    'knowledge-retrieval',
    'policy-check',
    'reply-drafting',
    'risk-detection',
    'feedback-capture',
  ];

  return snapshot.pipelineNodeConfigs
    .filter(item => visibleNodeIds.includes(item.nodeId))
    .map(item => {
      const scenarioFallback = findScenarioModelConfig(snapshot, item.allowedScenarios[0] ?? 'Shipping');
      const metrics = functionalLatencyProfile(item.nodeId);
      return {
        nodeId: item.nodeId,
        nodeName: item.name.replace(/配置$/, ''),
        status: deriveHealthStatusFromLatency(metrics.avgLatencyMs, metrics.errorRate, metrics.usage),
        primaryModel: item.primaryModel ?? scenarioFallback.primaryModel,
        fallbackModel: item.fallbackModel ?? scenarioFallback.fallbackModel,
        timeoutMs: item.timeoutMs,
        retryCount: item.retryCount,
        citationRequired: item.citationRequired,
        humanConfirmationRequired: item.humanConfirmationRequired,
        avgLatencyMs: metrics.avgLatencyMs,
        errorRate: metrics.errorRate,
        lastChecked,
        usedBy: functionalNodeUsageLabel(item.nodeId),
      };
    });
}

function buildScenarioModelStatuses(snapshot: ServiceHubSnapshot, lastChecked: string): ScenarioModelStatus[] {
  return snapshot.scenarioModelConfigs.map(item => {
    const metrics = scenarioLatencyProfile(item);
    return {
      scenario: item.scenario,
      strategyName: item.name,
      status: deriveHealthStatusFromLatency(metrics.avgLatencyMs, metrics.errorRate, metrics.usage),
      primaryModel: item.primaryModel,
      fallbackModel: item.fallbackModel,
      modelChannel: item.modelChannel,
      temperature: item.temperature,
      topK: item.topK,
      similarityThreshold: item.similarityThreshold,
      citationRequired: item.citationRequired,
      manualReviewRequired: item.manualReviewRequired,
      humanSendAllowed: item.humanSendAllowed,
      avgLatencyMs: metrics.avgLatencyMs,
      errorRate: metrics.errorRate,
      lastChecked,
    };
  });
}

function deriveQueueTaskStage(document: IngestionDocumentRecord): 'Parse' | 'Chunk' | 'Embedding' | 'Index' | 'Publish' {
  if (document.indexStatus === 'failed' || document.indexStatus === 'published') return 'Publish';
  if (document.embeddingStatus === 'failed' || document.embeddingStatus === 'embedded' || document.embeddingStatus === 'indexed') return 'Index';
  if (document.chunkStatus === 'failed' || document.chunkStatus === 'indexed' || document.chunkStatus === 'chunking') return 'Embedding';
  if (document.parseStatus === 'parsed') return 'Chunk';
  return 'Parse';
}

function deriveQueueTaskStatus(job: IngestionJob): 'pending' | 'running' | 'failed' | 'completed' | 'retrying' {
  if (job.status === 'version_conflict' || job.status === 'chunk_failed' || job.status === 'embedding_failed' || job.status === 'expired') return 'failed';
  if (job.status === 'published') return 'completed';
  if (job.status === 'indexed' || job.status === 'parsed' || job.status === 'parsing') return 'running';
  return 'pending';
}

function buildRecentQueueTasks(snapshot: ServiceHubSnapshot) {
  return snapshot.ingestionJobs.slice(0, 8).map(job => {
    const document = snapshot.ingestionDocuments.find(item => item.documentId === job.documentId);
    const failed = deriveQueueTaskStatus(job) === 'failed';
    return {
      jobId: job.id,
      documentName: job.documentName,
      stage: document ? deriveQueueTaskStage(document) : 'Parse',
      status: deriveQueueTaskStatus(job),
      startedAt: job.startedAt.replace('T', ' ').slice(0, 16),
      duration: failed ? '11m 24s' : document?.indexStatus === 'published' ? '4m 12s' : '2m 48s',
      errorMessage: failed ? job.detail : 'none',
      retryCount: failed ? 2 : 0,
    };
  });
}

function buildServiceHealthErrors(snapshot: ServiceHubSnapshot): ServiceHealthError[] {
  const errors: ServiceHealthError[] = [];
  const ragFailure = snapshot.ragRuns.find(run => run.status === 'failed');
  if (ragFailure) {
    errors.push({
      id: 'ERR-RAG-001',
      source: 'Knowledge DB',
      status: 'degraded',
      message: ragFailure.fallbackReason || 'RAG retrieval returned no usable evidence.',
      detectedAt: '2026-05-25 11:12',
      impact: `工单 ${ragFailure.ticketId} 检索链路命中异常，可能导致引用缺失或草稿转人工。`,
    });
  }
  const ingestionFailure = snapshot.ingestionJobs.find(job => ['embedding_failed', 'chunk_failed', 'version_conflict', 'expired'].includes(job.status));
  if (ingestionFailure) {
    errors.push({
      id: 'ERR-ING-001',
      source: 'Document Ingestion Queue',
      status: 'degraded',
      message: ingestionFailure.detail,
      detectedAt: '2026-05-25 10:48',
      impact: `${ingestionFailure.documentName} 暂时无法稳定参与检索。`,
    });
  }
  errors.push({
    id: 'ERR-LLM-001',
    source: 'LLM API',
    status: 'healthy',
    message: 'none',
    detectedAt: '2026-05-25 11:20',
    impact: '当前未发现阻断生成的模型侧错误。',
  });
  return errors;
}

function buildServiceHealthDiagnostics(snapshot: ServiceHubSnapshot, health: Omit<ServiceHealthSnapshot, 'diagnostics'>): ServiceHealthDiagnostic[] {
  const diagnostics: ServiceHealthDiagnostic[] = [];
  const lowCitationRun = snapshot.ragRuns.find(run => run.citationCoverage < 82 && snapshot.ragConfig.retrieval.citationRequired);
  const retrievalNode = health.functionalModelStatuses.find(item => item.nodeId === 'knowledge-retrieval');
  const draftingNode = health.functionalModelStatuses.find(item => item.nodeId === 'reply-drafting');
  const policyNode = health.functionalModelStatuses.find(item => item.nodeId === 'policy-check');
  const riskNode = health.functionalModelStatuses.find(item => item.nodeId === 'risk-detection');
  if (lowCitationRun) {
    const relatedScenario = health.scenarioModelStatuses.find(item => item.scenario === lowCitationRun.scenario);
    diagnostics.push({
      id: 'DIAG-CITATION-001',
      issue: 'AI 回复没有引用来源',
      severity: 'warning',
      possibleCauses: [
        'Retrieval 返回为空或有效证据不足',
        'Prompt Assembly 未注入 retrieved chunks',
        'Citation Required 已开启但向量索引未返回可用片段',
      ],
      evidence: [
        `RAG ${lowCitationRun.id} citation coverage ${lowCitationRun.citationCoverage}%`,
        `Prompt includeRetrievedChunks=${snapshot.ragConfig.promptAssembly.includeRetrievedChunks ? 'on' : 'off'}`,
        `Vector index status=${health.vectorDbStatus.indexStatus}`,
        retrievalNode ? `knowledge-retrieval ${retrievalNode.primaryModel} ${retrievalNode.avgLatencyMs}ms` : 'knowledge-retrieval node unavailable',
        relatedScenario ? `${relatedScenario.strategyName} citationRequired=${relatedScenario.citationRequired ? 'on' : 'off'}` : `scenario=${lowCitationRun.scenario}`,
      ],
      recommendedActions: [
        '检查检索过滤条件与相似度阈值是否过严',
        '确认 Prompt 组装继续注入 retrieved chunks',
        '检查向量索引是否 ready 且 query latency 正常',
      ],
    });
  }

  const slowDraftingNode = snapshot.pipelineNodeConfigs.find(item => item.nodeId === 'reply-drafting');
  if (slowDraftingNode && (health.llmStatus.avgLatencyMs >= 1800 || health.llmStatus.rateLimitUsage >= 60)) {
    diagnostics.push({
      id: 'DIAG-DRAFT-001',
      issue: 'AI 草稿生成慢',
      severity: health.llmStatus.status === 'healthy' ? 'warning' : 'critical',
      possibleCauses: [
        'LLM API latency 偏高',
        'Rate limit usage 接近上限',
        'reply-drafting timeout 较紧或 retry 不足',
        'RAG returned chunks 偏多导致 prompt 变长',
      ],
      evidence: [
        `LLM avg latency ${health.llmStatus.avgLatencyMs}ms`,
        `Rate limit usage ${health.llmStatus.rateLimitUsage}%`,
        `reply-drafting timeout=${slowDraftingNode.timeoutMs}ms retry=${slowDraftingNode.retryCount}`,
        draftingNode ? `reply-drafting model=${draftingNode.primaryModel} latency=${draftingNode.avgLatencyMs}ms error=${draftingNode.errorRate}%` : 'reply-drafting node unavailable',
      ],
      recommendedActions: [
        '降低检索返回量或收敛 topK',
        '启用或验证 fallback model 可用性',
        '检查 reply-drafting 节点预算与超时配置',
      ],
    });
  }

  const retrievalFailure = snapshot.ragRuns.find(run => run.status === 'failed' || Boolean(run.knowledgeGapType));
  if (retrievalFailure) {
    const relatedScenario = health.scenarioModelStatuses.find(item => item.scenario === retrievalFailure.scenario);
    diagnostics.push({
      id: 'DIAG-RAG-001',
      issue: 'RAG 检索为空或证据不足',
      severity: 'critical',
      possibleCauses: [
        '文档未发布或主文档已过期',
        'Embedding 失败',
        'Vector Index 未就绪',
        'Similarity Threshold 过高',
        'Metadata Filter 过窄',
      ],
      evidence: [
        `RAG ${retrievalFailure.id} status=${retrievalFailure.status}`,
        `knowledge gap=${retrievalFailure.knowledgeGapType ?? 'none'}`,
        `threshold=${snapshot.ragConfig.retrieval.similarityThreshold}`,
        retrievalNode ? `knowledge-retrieval latency=${retrievalNode.avgLatencyMs}ms error=${retrievalNode.errorRate}%` : 'knowledge-retrieval node unavailable',
        relatedScenario ? `${relatedScenario.strategyName} topK=${relatedScenario.topK} threshold=${relatedScenario.similarityThreshold}` : `scenario=${retrievalFailure.scenario}`,
      ],
      recommendedActions: [
        '检查文档发布状态与 chunk/vector 覆盖',
        '核验 embedding 队列与索引状态',
        '放宽场景/语言/区域过滤条件后重跑检索',
      ],
    });
  }

  const ingestionIssue = snapshot.ingestionDocuments.find(item => item.embeddingStatus === 'failed' || item.indexStatus === 'failed' || item.indexStatus === 'pending');
  if (ingestionIssue) {
    diagnostics.push({
      id: 'DIAG-INGEST-001',
      issue: '文档上传后不能检索',
      severity: 'warning',
      possibleCauses: [
        '文档未发布',
        'Chunk Count 为 0 或向量化未完成',
        'Embedding 任务失败',
        'Vector index 未完成 publish',
      ],
      evidence: [
        `${ingestionIssue.documentName} parse=${ingestionIssue.parseStatus} chunk=${ingestionIssue.chunkStatus} embedding=${ingestionIssue.embeddingStatus} index=${ingestionIssue.indexStatus}`,
      ],
      recommendedActions: [
        '重试失败任务并确认最终 publish 状态',
        '检查文档解析与切片产出是否为 0',
      ],
    });
  }

  const connectorIssue = health.connectors.find(item => item.status !== 'healthy');
  if (connectorIssue) {
    diagnostics.push({
      id: 'DIAG-CONN-001',
      issue: '业务连接器异常影响上下文读取',
      severity: 'warning',
      possibleCauses: [
        '业务库延迟升高',
        '权限或审计服务响应异常',
        '下游同步落后导致上下文不完整',
      ],
      evidence: [
        `${connectorIssue.systemName} latency=${connectorIssue.latencyMs}ms`,
        `used by ${connectorIssue.usedBy}`,
        `last error=${connectorIssue.lastError}`,
      ],
      recommendedActions: [
        '检查对应业务数据源同步与权限边界',
        '优先核验受影响的客服链路节点',
      ],
    });
  }

  const highReviewScenario = health.scenarioModelStatuses.find(item => item.manualReviewRequired && item.status !== 'healthy');
  if (highReviewScenario && (policyNode || riskNode)) {
    diagnostics.push({
      id: 'DIAG-REVIEW-001',
      issue: '高敏场景复核压力高',
      severity: 'warning',
      possibleCauses: [
        '高敏场景使用更保守的模型链路',
        '政策检查与风险识别延迟升高',
        '场景要求强制人工复核，放大了队列压力',
      ],
      evidence: [
        `${highReviewScenario.strategyName} model=${highReviewScenario.primaryModel} latency=${highReviewScenario.avgLatencyMs}ms`,
        policyNode ? `policy-check latency=${policyNode.avgLatencyMs}ms error=${policyNode.errorRate}%` : 'policy-check node unavailable',
        riskNode ? `risk-detection latency=${riskNode.avgLatencyMs}ms error=${riskNode.errorRate}%` : 'risk-detection node unavailable',
      ],
      recommendedActions: [
        '优先检查高敏场景的政策与风险节点超时预算',
        '核验高敏场景是否需要缩短 prompt 或减少检索返回量',
        '关注人工复核队列是否需要临时扩容',
      ],
    });
  }

  return diagnostics;
}

export function deriveServiceHealthSnapshot(snapshot: ServiceHubSnapshot): ServiceHealthSnapshot {
  const primaryModel = mostUsedModel(snapshot.scenarioModelConfigs, 'primaryModel');
  const fallbackModel = mostUsedModel(snapshot.scenarioModelConfigs, 'fallbackModel');
  const failedIngestionJobs = snapshot.ingestionJobs.filter(job => ['embedding_failed', 'chunk_failed', 'version_conflict', 'expired'].includes(job.status));
  const vectorCount = snapshot.knowledgeDocuments.reduce((sum, item) => sum + item.vectorCount, 0);
  const llmStatus = {
    provider: 'OpenAI',
    primaryModel,
    fallbackModel,
    status: deriveHealthStatusFromLatency(1820, 0.7, 62),
    avgLatencyMs: 1820,
    errorRate: 0.7,
    rateLimitUsage: 62,
    tokenUsageToday: 1200000,
    estimatedCostToday: 18.4,
    lastError: 'none',
    lastChecked: '2026-05-25 11:20',
  } as const;
  const functionalModelStatuses = buildFunctionalModelStatuses(snapshot, llmStatus.lastChecked);
  const scenarioModelStatuses = buildScenarioModelStatuses(snapshot, llmStatus.lastChecked);
  const embeddingStatus = {
    provider: 'OpenAI',
    model: snapshot.ragConfig.embedding.model,
    status: failedIngestionJobs.length >= 3 ? 'degraded' : 'healthy',
    queueSize: 12,
    avgLatencyMs: 420,
    failedJobs: failedIngestionJobs.length,
    vectorDimension: snapshot.ragConfig.embedding.vectorDimension,
    lastSuccessfulRun: '2026-05-25 11:05',
    rebuildStatus: 'idle',
  } as const;
  const vectorDbStatus = {
    store: 'pgvector mock',
    indexName: snapshot.ragConfig.embedding.indexName,
    indexStatus: failedIngestionJobs.length > 0 ? 'degraded' : 'ready',
    vectorCount,
    namespace: 'customer-service-prod',
    storageUsage: '3.8 GB',
    queryLatencyMs: 86,
    indexVersion: snapshot.ragConfig.embedding.indexVersion,
    lastRebuild: '2026-05-20 10:30',
    lastQueryError: failedIngestionJobs.length > 0 ? 'Knowledge index contains unpublished or expired assets.' : 'none',
  } as const;
  const connectors = [
    { systemName: 'CRM Database', status: 'healthy', latencyMs: 42, lastSync: '2 min ago', lastError: 'none', usedBy: 'Customer Briefing / customer-matching' },
    { systemName: 'OMS Database', status: 'healthy', latencyMs: 58, lastSync: '1 min ago', lastError: 'none', usedBy: 'Order Context / order-linking' },
    { systemName: 'Ticket Database', status: 'healthy', latencyMs: 47, lastSync: 'real-time', lastError: 'none', usedBy: 'Service Workspace' },
    { systemName: 'Knowledge DB', status: failedIngestionJobs.length > 0 ? 'degraded' : 'healthy', latencyMs: failedIngestionJobs.length > 0 ? 120 : 72, lastSync: '8 min ago', lastError: failedIngestionJobs.length > 0 ? 'slow query on localized policy namespace' : 'none', usedBy: 'RAG Retrieval' },
    { systemName: 'Permission Service', status: 'healthy', latencyMs: 39, lastSync: 'real-time', lastError: 'none', usedBy: 'human review / send guardrail' },
    { systemName: 'Audit Log DB', status: 'healthy', latencyMs: 35, lastSync: 'real-time', lastError: 'none', usedBy: 'audit logs / feedback trace' },
  ] as const;
  const recentTasks = buildRecentQueueTasks(snapshot);
  const ingestionQueue = {
    queueStatus: failedIngestionJobs.length > 0 ? 'degraded' : 'healthy',
    pendingJobs: snapshot.ingestionJobs.filter(job => job.status === 'uploaded').length,
    runningJobs: snapshot.ingestionJobs.filter(job => ['parsing', 'parsed', 'indexed'].includes(job.status)).length,
    failedJobs: failedIngestionJobs.length,
    lastSuccessfulSync: '2026-05-25 11:05',
    scheduledSync: 'Every 15 minutes',
    retryPolicy: 'Exponential backoff, max 3 retries',
    oldestPendingJob: recentTasks.find(task => task.status === 'pending')?.startedAt ?? 'none',
    recentTasks,
  } as const;
  const recentErrors = buildServiceHealthErrors(snapshot);
  const lastHealthCheck: ServiceHealthCheckResult = {
    checkedAt: '2026-05-25 11:20',
    overallStatus: failedIngestionJobs.length > 0 ? 'degraded' : 'healthy',
    summary: failedIngestionJobs.length > 0 ? '向量化与知识发布链路存在待处理异常，生成链路当前仍可回退运行。' : '所有核心依赖可用，未发现阻断性故障。',
    findings: [
      `LLM 通道 ${llmStatus.status === 'healthy' ? '稳定' : '需关注'}，主模型 ${primaryModel}`,
      `Embedding 队列 ${embeddingStatus.queueSize} 个待处理任务，失败 ${embeddingStatus.failedJobs} 个`,
      `Knowledge DB ${connectors.find(item => item.systemName === 'Knowledge DB')?.status === 'healthy' ? '稳定' : '存在慢查询'}`,
    ],
  };
  const baseHealth = {
    llmStatus,
    functionalModelStatuses,
    scenarioModelStatuses,
    embeddingStatus,
    vectorDbStatus,
    connectors: [...connectors],
    ingestionQueue: { ...ingestionQueue, recentTasks: [...recentTasks] },
    recentErrors,
    lastHealthCheck,
  };

  return {
    ...baseHealth,
    diagnostics: buildServiceHealthDiagnostics(snapshot, baseHealth),
  };
}
