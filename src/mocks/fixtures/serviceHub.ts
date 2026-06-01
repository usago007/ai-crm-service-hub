import type {
  CustomerProfile,
  FollowUpTask,
  IngestionDocumentRecord,
  IngestionJob,
  KnowledgeChunk,
  KnowledgeDocument,
  Message,
  RagRun,
  ReplyDraft,
  ReviewDecision,
  ReviewStatus,
  ServiceHealthSnapshot,
  ServiceHubSnapshot,
  ServiceTicket,
  TicketAction,
  TicketChannel,
} from '../../types';
import { displayIssueType, displayLanguage, displayRiskLevel, displayRuntimeStatus, displayScenario, displayWorkflow } from '../../utils/display';
import { deriveServiceHealthSnapshot } from './service-health';
import { buildCustomers, buildOrders, isoDay, issueTemplates, pad } from './customer-orders';
import {
  aiEnvironment,
  buildDraftSourceTrace,
  buildInitialRagTestRuns,
  buildSendGuardrailResult,
  capabilityPipeline,
  modelRoutingSummary,
  pipelineNodeConfigs,
  ragConfig,
  scenarioModelConfigs,
} from './ai-console-policy';
import {
  activityLog,
  agents,
  aiCapabilities,
  aiOpsStages,
  analytics,
  auditLogs,
  buildSettingsOperationLogs,
  businessRules,
  evaluations,
  faqs,
  feedbackLoop,
  guardrails,
  permissionBoundaries,
  policyDocs,
  replyTemplates,
  settings,
} from './settings-admin';

export { deriveServiceHealthSnapshot } from './service-health';

function stageBadgeFromPublishStatus(status: KnowledgeDocument['publishStatus']): Pick<IngestionDocumentRecord, 'parseStatus' | 'chunkStatus' | 'embeddingStatus' | 'indexStatus'> {
  switch (status) {
    case 'parsing':
      return { parseStatus: 'parsing', chunkStatus: 'pending', embeddingStatus: 'pending', indexStatus: 'pending' };
    case 'indexed':
      return { parseStatus: 'parsed', chunkStatus: 'indexed', embeddingStatus: 'indexed', indexStatus: 'indexed' };
    case 'published':
      return { parseStatus: 'parsed', chunkStatus: 'indexed', embeddingStatus: 'indexed', indexStatus: 'published' };
    case 'version_conflict':
    case 'expired':
      return { parseStatus: 'parsed', chunkStatus: 'indexed', embeddingStatus: 'indexed', indexStatus: 'failed' };
    default:
      return { parseStatus: 'pending', chunkStatus: 'pending', embeddingStatus: 'pending', indexStatus: 'pending' };
  }
}

function buildKnowledgeDocuments(): KnowledgeDocument[] {
  const scenarios = ['Shipping', 'Refund', 'Complaint', 'Payment', 'Address Change', 'Product Inquiry', 'VIP', 'Return'];
  const languages = ['EN', 'ZH', 'DE', 'FR', 'ES', 'JA'];
  const baseDocs = Array.from({ length: 28 }, (_, index) => {
    const scenario = scenarios[index % scenarios.length];
    const language = languages[index % languages.length];
    const publishStatus: KnowledgeDocument['publishStatus'] = index % 11 === 0 ? 'version_conflict' : index % 7 === 0 ? 'expired' : index % 5 === 0 ? 'indexed' : 'published';
    return {
      id: pad('DOC', index + 1),
      name: `${displayScenario(scenario)}手册 v${1 + (index % 3)}.${index % 10}.${index % 5}.${language}.pdf`,
      sourceType: ['PDF', 'DOCX', 'HTML', 'XLSX'][index % 4],
      knowledgeType: scenario === 'Product Inquiry' ? '商品规格' : scenario === 'Complaint' ? '业务规则' : '政策文档',
      scenario,
      language,
      owner: ['运营', '客服负责人', '知识运营', '商品团队'][index % 4],
      version: `v${1 + (index % 3)}.${index % 10}`,
      publishStatus,
      effectiveDate: `2026-0${1 + (index % 5)}-${String(1 + (index % 25)).padStart(2, '0')}`,
      chunkCount: 12 + (index % 10) * 4,
      vectorCount: 12 + (index % 10) * 4,
      coverageScore: 64 + (index % 8) * 4,
      parseError: publishStatus === 'version_conflict' ? '当前版本与草稿版本的审批元数据冲突。' : publishStatus === 'expired' ? '文档已过期，应从检索中剔除。' : undefined,
    };
  });

  // Extra docs for demo data richness (diverse health states)
  const extraDocs: KnowledgeDocument[] = [
    { id: 'DOC-029', name: '东南亚物流时效与赔付政策 v2.1.EN.pdf', sourceType: 'PDF', knowledgeType: '政策文档', scenario: 'Shipping', language: 'EN', owner: '物流运营', version: 'v2.1', publishStatus: 'published' as const, effectiveDate: '2026-05-12', chunkCount: 22, vectorCount: 22, coverageScore: 88 },
    { id: 'DOC-030', name: '退款审批权限矩阵 v1.0.ZH.xlsx', sourceType: 'XLSX', knowledgeType: '业务规则', scenario: 'Refund', language: 'ZH', owner: '财务', version: 'v1.0', publishStatus: 'published' as const, effectiveDate: '2026-05-20', chunkCount: 16, vectorCount: 16, coverageScore: 91 },
    { id: 'DOC-031', name: '支付异常处理流程 v3.2.DE.docx', sourceType: 'DOCX', knowledgeType: '政策文档', scenario: 'Payment', language: 'DE', owner: '支付团队', version: 'v3.2', publishStatus: 'indexed' as const, effectiveDate: '2026-04-28', chunkCount: 28, vectorCount: 26, coverageScore: 65 },
    { id: 'DOC-032', name: '投诉赔偿审批清单 v2.0.ZH.pdf', sourceType: 'PDF', knowledgeType: '业务规则', scenario: 'Complaint', language: 'ZH', owner: '风控', version: 'v2.0', publishStatus: 'version_conflict' as const, effectiveDate: '2026-05-01', chunkCount: 18, vectorCount: 0, coverageScore: 0, parseError: '版本 v2.0 与草稿 v2.1 存在审批人冲突，需人工确认后再发布。' },
    { id: 'DOC-033', name: '2024 年退款政策（已过期）v1.0.EN.pdf', sourceType: 'PDF', knowledgeType: '政策文档', scenario: 'Refund', language: 'EN', owner: '知识运营', version: 'v1.0', publishStatus: 'expired' as const, effectiveDate: '2024-06-15', chunkCount: 14, vectorCount: 0, coverageScore: 22, parseError: '文档已过期，应归档并从活跃检索中剔除。' },
    { id: 'DOC-034', name: '跨境物流常见问题FAQ v1.5.ZH.html', sourceType: 'HTML', knowledgeType: 'FAQ', scenario: 'Shipping', language: 'ZH', owner: '客服', version: 'v1.5', publishStatus: 'published' as const, effectiveDate: '2026-03-10', chunkCount: 32, vectorCount: 30, coverageScore: 45 },
  ];

  return [...baseDocs, ...extraDocs];
}

function buildKnowledgeChunks(documents: KnowledgeDocument[]): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  documents.forEach(document => {
    for (let i = 0; i < 6; i += 1) {
      chunks.push({
        id: pad('CHK', chunks.length + 1),
        documentId: document.id,
        title: `${displayScenario(document.scenario)}分块 ${i + 1}`,
        content: `${displayScenario(document.scenario)}指引片段 ${i + 1}，语言 ${displayLanguage(document.language)}，版本 ${document.version}。`,
        language: document.language,
        scenario: document.scenario,
      });
    }
  });
  return chunks;
}

function buildTickets(customers: CustomerProfile[], documents: KnowledgeDocument[]): ServiceTicket[] {
  return Array.from({ length: 96 }, (_, index) => {
    const customer = customers[index % customers.length];
    const template = issueTemplates[index % issueTemplates.length];
    const reviewRequired = template.riskLevel !== 'Low';
    const scenario = template.issueType === 'Shipping Delay' ? 'Shipping'
      : template.issueType === 'Refund Request' ? 'Refund'
      : template.issueType === 'Product Inquiry' ? 'Product Inquiry'
      : template.issueType === 'Payment Failed' ? 'Payment'
      : template.issueType === 'Complaint' ? 'Complaint'
      : template.issueType === 'Return Request' ? 'Refund'
      : 'Shipping';
    const relatedDoc = documents.find(doc => doc.scenario === (template.issueType === 'VIP Support' ? 'VIP' : template.issueType === 'Return Request' ? 'Return' : template.issueType === 'Payment Failed' ? 'Payment' : template.issueType)) ?? documents[index % documents.length];
    return {
      id: pad('TKT', index + 1),
      customerId: customer.id,
      channel: (['Email', 'Live Chat', 'Ticket'] as TicketChannel[])[index % 3],
      issueType: template.issueType,
      priority: template.priority,
      status: template.status,
      assignee: ['你', '陈艾琳', '吴柏霖', '戴珂岚'][index % 4],
      sla: isoDay(20 + (index % 8), 9 + (index % 6)),
      aiSummary: `${template.summary} 客户分群为${customer.segment}，偏好语言为${displayLanguage(customer.preferredLanguage)}，区域策略为${customer.regionStrategy}。`,
      aiSuggested: true,
      needsReview: reviewRequired,
      lastUpdated: isoDay(15 + (index % 10), 8 + (index % 10)),
      summary: template.summary,
      workflowStage: template.workflowStage,
      intent: template.intent,
      riskLevel: template.riskLevel,
      region: customer.regionStrategy,
      manualReview: reviewRequired,
      policyDecision: template.policyDecision,
      requiredAction: template.requiredAction,
      selectedKnowledgeIds: [relatedDoc.id],
      retrievalRunId: pad('RAG', index + 1),
      draftId: pad('DRF', index + 1),
      reviewDecisionId: pad('REV', index + 1),
      actionIds: [pad('ACT', index + 1)],
      lastReplyAt: index % 3 === 0 ? isoDay(16 + (index % 6), 17) : undefined,
      lastReplyBy: index % 3 === 0 ? ['你', '陈艾琳', '吴柏霖'][index % 3] : undefined,
      draftSavedAt: isoDay(16 + (index % 7), 14),
      sendGuardrailResult: buildSendGuardrailResult(scenario),
      executionOutcome: {
        customerPromise: template.riskLevel === 'High' ? '待主管决策后向客户提供复核结论。' : '在下一业务节点向客户同步处理进展。',
        followUpNeeded: template.workflowStage !== 'resolved',
        followUpAt: isoDay(22 + (index % 6), 10),
        finalState: template.workflowStage === 'execute' ? '等待执行结果' : '等待流程推进',
      },
    };
  });
}

function buildRagRuns(tickets: ServiceTicket[], documents: KnowledgeDocument[]): RagRun[] {
  return tickets.map((ticket, index) => {
    const document = documents.find(item => item.id === ticket.selectedKnowledgeIds[0]) ?? documents[0];
    const hasFallback = document.publishStatus !== 'published' || ticket.riskLevel === 'High';
    const knowledgeGapType = document.publishStatus === 'expired' ? 'expired_document' : document.publishStatus === 'version_conflict' ? 'version_conflict' : ticket.issueType === 'Complaint' ? 'localized_policy_missing' : null;
    return {
      id: pad('RAG', index + 1),
      ticketId: ticket.id,
      scenario: ticket.issueType,
      locale: ticket.region.includes('亚太区') ? 'apac' : ticket.region.includes('欧区') ? 'eu' : 'global',
      originalQuery: `${displayIssueType(ticket.issueType)} | ${ticket.summary}`,
      rewrittenQuery: `${ticket.intent} ${ticket.region} ${displayRiskLevel(ticket.riskLevel)}`,
      metadataFilters: [`语言=${displayLanguage(documents[index % documents.length].language)}`, `场景=${displayScenario(document.scenario)}`, `区域=${ticket.region}`],
      topK: 5,
      candidates: Array.from({ length: 3 }, (_, candidateIndex) => ({
        id: pad('RC', index * 3 + candidateIndex + 1),
        source: candidateIndex === 0 ? document.name : documents[(index + candidateIndex) % documents.length].name,
        chunkId: pad('CHK', index * 3 + candidateIndex + 1),
        score: Number((0.92 - candidateIndex * 0.08).toFixed(2)),
        rerankScore: Number((0.95 - candidateIndex * 0.12).toFixed(2)),
        selected: candidateIndex < 2,
        rejectReason: candidateIndex < 2 ? undefined : '重排后场景与语言匹配度较低，因此被丢弃。',
        metadata: {
          language: candidateIndex === 0 ? document.language : documents[(index + candidateIndex) % documents.length].language,
          scenario: candidateIndex === 0 ? document.scenario : documents[(index + candidateIndex) % documents.length].scenario,
          version: candidateIndex === 0 ? document.version : documents[(index + candidateIndex) % documents.length].version,
        },
        snippet: `${ticket.intent} 相关证据，来源于${candidateIndex === 0 ? '主文档' : '辅助文档'}。`,
      })),
      citations: [
        { source: document.name, chunkId: pad('CHK', index * 3 + 1), match: `${93 - (index % 9)}%` },
        { source: documents[(index + 1) % documents.length].name, chunkId: pad('CHK', index * 3 + 2), match: `${87 - (index % 7)}%` },
      ],
      citationCoverage: 78 + (index % 6) * 4,
      knowledgeGapType,
      fallbackReason: hasFallback ? (knowledgeGapType === 'localized_policy_missing' ? '该区域的本地化政策尚未发布。' : knowledgeGapType === 'expired_document' ? '主 SOP 已过期，已从检索结果中剔除。' : '当前流程阶段必须进入人工复核。') : '',
      status: knowledgeGapType ? 'failed' : ticket.riskLevel === 'Medium' ? 'warning' : 'healthy',
      createdAt: isoDay(15 + (index % 10), 8 + (index % 8)),
    };
  });
}

function buildReplyDrafts(tickets: ServiceTicket[], ragRuns: RagRun[]): ReplyDraft[] {
  return tickets.map((ticket, index) => ({
    id: pad('DRF', index + 1),
    language: ['EN', 'ZH', 'DE', 'FR', 'ES', 'JA'][index % 6],
    confidence: ticket.riskLevel === 'Low' ? 92 - (index % 5) : ticket.riskLevel === 'Medium' ? 82 - (index % 7) : 71 - (index % 6),
    riskLevel: ticket.riskLevel,
    content: `${ticket.id} 的${displayIssueType(ticket.issueType)}回复草稿。对客户的承诺为：${ticket.executionOutcome.customerPromise}`,
    explanation: [
      `已应用 ${ticket.region} 与 ${displayWorkflow(ticket.workflowStage)} 路由策略。`,
      `本次检索共使用 ${ragRuns[index].citations.length} 条引用证据。`,
      ticket.manualReview ? '由于需要人工复核，草稿保持保守表达。' : '标准 QA 通过后可继续流转。',
    ],
    citations: ragRuns[index].citations,
    sourceTrace: buildDraftSourceTrace(ticket),
  }));
}

function buildReviews(tickets: ServiceTicket[]): ReviewDecision[] {
  return tickets.map((ticket, index) => {
    const status: ReviewStatus = ticket.manualReview ? (index % 4 === 0 ? 'escalated' : 'pending') : 'approved';
    return {
      id: pad('REV', index + 1),
      status,
      reviewer: status === 'approved' ? '自动质检' : ['戴珂岚', '知识运营', '你'][index % 3],
      reason: status === 'approved' ? '低风险路径已通过策略校验。' : ticket.policyDecision,
      updatedAt: isoDay(16 + (index % 8), 12),
    };
  });
}

function buildActions(tickets: ServiceTicket[]): TicketAction[] {
  return tickets.map((ticket, index) => ({
    id: pad('ACT', index + 1),
    label: ticket.requiredAction,
    status: ticket.workflowStage === 'execute' ? (ticket.manualReview ? 'blocked' : 'pending') : ticket.workflowStage === 'follow-up' ? 'completed' : 'pending',
    owner: ticket.assignee,
    result: ticket.workflowStage === 'execute' && ticket.manualReview ? '在人工复核和本地化知识校验通过前，动作保持阻止状态。' : '等待流程执行。',
  }));
}

function buildTasks(tickets: ServiceTicket[]): FollowUpTask[] {
  return tickets.slice(0, 54).map((ticket, index) => ({
    id: pad('TSK', index + 1),
    description: ticket.requiredAction,
    customerId: ticket.customerId,
    ticketId: ticket.id,
    due: ticket.executionOutcome.followUpAt ?? isoDay(23, 10),
    priority: ticket.priority,
    triggeredBy: ticket.workflowStage,
    status: index % 3 === 0 ? '进行中' : '待处理',
    owner: ticket.assignee,
  }));
}

function buildMessages(tickets: ServiceTicket[], ragRuns: RagRun[]): Message[] {
  return tickets.flatMap((ticket, index) => [
    { ticketId: ticket.id, sender: 'customer', type: 'text', content: ticket.summary, timestamp: isoDay(14 + (index % 8), 9) },
    { ticketId: ticket.id, sender: 'system', type: 'system', content: `RAG ${displayRuntimeStatus(ragRuns[index].status)}：${ragRuns[index].fallbackReason || '检索状态健康'}`, timestamp: isoDay(14 + (index % 8), 10) },
  ]);
}

function buildIngestionJobs(documents: KnowledgeDocument[]): IngestionJob[] {
  return documents.map((document, index) => ({
    id: pad('JOB', index + 1),
    documentId: document.id,
    documentName: document.name,
    status: document.publishStatus,
    startedAt: isoDay(2 + (index % 18), 8),
    updatedAt: isoDay(2 + (index % 18), 10),
    detail: document.parseError ?? '已发布并可被检索过滤器使用。',
  }));
}

function buildIngestionDocuments(documents: KnowledgeDocument[], chunks: KnowledgeChunk[]): IngestionDocumentRecord[] {
  return documents.map((document, index) => {
    const relatedChunks = chunks.filter(chunk => chunk.documentId === document.id);
    const stageStatus = stageBadgeFromPublishStatus(document.publishStatus);
    const chunkStatus = document.publishStatus === 'parsing'
      ? index % 2 === 0
        ? 'chunking'
        : 'pending'
      : stageStatus.chunkStatus;
    const embeddingStatus = document.publishStatus === 'parsing'
      ? 'pending'
      : document.publishStatus === 'indexed' && index % 4 === 0
      ? 'embedded'
      : stageStatus.embeddingStatus;

    return {
      id: `ING-${String(index + 1).padStart(3, '0')}`,
      documentId: document.id,
      documentName: document.name,
      sourceType: document.sourceType,
      knowledgeType: document.knowledgeType,
      scenario: document.scenario,
      language: document.language,
      owner: document.owner,
      version: document.version,
      effectiveDate: document.effectiveDate,
      parseStatus: stageStatus.parseStatus,
      chunkStatus,
      embeddingStatus,
      indexStatus: stageStatus.indexStatus,
      chunkCount: relatedChunks.length || document.chunkCount,
      vectorCount: document.vectorCount,
      lastSync: `2026-05-${String(3 + (index % 18)).padStart(2, '0')} 10:${String((index % 6) * 10).padStart(2, '0')}`,
      parsedText: `${displayScenario(document.scenario)}资料《${document.name}》解析结果。该文档当前语言为${displayLanguage(document.language)}，版本为${document.version}，主要用于${displayScenario(document.scenario)}场景的客服辅助回答、规则判断与人工复核依据。`,
      chunkIds: relatedChunks.map(chunk => chunk.id),
      disabled: false,
    };
  });
}

export function createMockSnapshot(): ServiceHubSnapshot {
  const customers = buildCustomers();
  const orders = buildOrders(customers);
  const knowledgeDocuments = buildKnowledgeDocuments();
  const knowledgeChunks = buildKnowledgeChunks(knowledgeDocuments);
  const ingestionDocuments = buildIngestionDocuments(knowledgeDocuments, knowledgeChunks);
  const tickets = buildTickets(customers, knowledgeDocuments);
  const ragRuns = buildRagRuns(tickets, knowledgeDocuments);
  const ragTestRuns = buildInitialRagTestRuns(customers, orders, knowledgeDocuments);
  const replyDrafts = buildReplyDrafts(tickets, ragRuns);
  const reviewDecisions = buildReviews(tickets);
  const ticketActions = buildActions(tickets);
  const tasks = buildTasks(tickets);
  const messages = buildMessages(tickets, ragRuns);
  const ingestionJobs = buildIngestionJobs(knowledgeDocuments);
  const operationLogs = buildSettingsOperationLogs(activityLog, auditLogs).entries;

  const snapshot = {
    customers,
    orders,
    tickets,
    messages,
    tasks,
    faqs,
    replyTemplates,
    businessRules,
    policyDocs,
    agents,
    settings,
    analytics,
    activityLog,
    operationLogs,
    aiEnvironment,
    aiCapabilities,
    permissionBoundaries,
    guardrails,
    aiOpsStages,
    knowledgeDocuments,
    knowledgeChunks,
    ingestionDocuments,
    ragConfig,
    ragRuns,
    ragTestRuns,
    replyDrafts,
    reviewDecisions,
    ticketActions,
    ingestionJobs,
    capabilityPipeline,
    scenarioModelConfigs,
    pipelineNodeConfigs,
    modelRoutingSummary,
    evaluations,
    feedbackLoop,
    auditLogs,
    serviceHealth: {} as ServiceHealthSnapshot,
  };

  snapshot.serviceHealth = deriveServiceHealthSnapshot(snapshot);
  return snapshot;
}
