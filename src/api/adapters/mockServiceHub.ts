import type {
  CreateKnowledgeDocumentRequest,
  IngestionActionRequest,
  TicketCloseRequest,
  TicketDraftSaveRequest,
  TicketReplySendRequest,
  RagTestRunResult,
  RunRagTestRequest,
  ServiceHubApi,
  TicketActionRequest,
  TicketDraftRequest,
  TicketRetrieveRequest,
  TicketReviewRequest,
  UpdatePipelineNodeConfigRequest,
  UpdateRagConfigRequest,
  UpdateScenarioModelConfigRequest,
} from '../contracts/serviceHub';
import type {
  AdminSnapshot,
  AIConsoleSnapshot,
  CustomerFilters,
  CustomerProfile,
  DocumentFilters,
  FollowUpTask,
  GlobalOperationLogEntry,
  GuardrailCheckResult,
  IngestionDocumentRecord,
  IngestionJob,
  InsightsSnapshot,
  PromptPreviewSnapshot,
  KnowledgeDocument,
  ListQuery,
  Order,
  OrderFilters,
  OperationLogFilters,
  TaskFilters,
  PagedResult,
  RagRun,
  RagTestRun,
  RagRunFilters,
  ReviewDecision,
  ScenarioModelConfig,
  SendGuardrailResult,
  ServiceHubSnapshot,
  ServiceTicket,
  TicketAction,
  TicketFilters,
} from '../../types';
import { deriveServiceHealthSnapshot } from '../../mocks/fixtures/serviceHub';
import {
  buildDerivedRoutingSummary,
  buildEffectiveNodePolicies,
  buildEffectiveScenarioPolicies,
  buildGuardrailDecision,
  getMissingRequiredNodeIds,
  findNodeConfig,
  findScenarioConfig as resolveScenarioConfig,
} from '../../shared/lib/aiConsolePolicy';

function cloneSnapshot(snapshot: ServiceHubSnapshot): ServiceHubSnapshot {
  return structuredClone(snapshot);
}

function nowIso() {
  return new Date().toISOString();
}

function nowUiStamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function prependAudit(snapshot: ServiceHubSnapshot, eventType: string, detail: string, riskLevel: 'Low' | 'Medium' | 'High' = 'Low') {
  snapshot.auditLogs = [{
    id: `AUD-${String(snapshot.auditLogs.length + 1).padStart(3, '0')}`,
    ticketId: 'SYSTEM',
    eventType,
    actor: '系统',
    outcome: '配置变更已生效。',
    riskLevel,
    timestamp: nowUiStamp(),
    detail,
  }, ...snapshot.auditLogs];
}

function withServiceHealth(snapshot: ServiceHubSnapshot) {
  snapshot.serviceHealth = deriveServiceHealthSnapshot(snapshot);
  return snapshot;
}

function paginate<T>(items: T[], query: Pick<ListQuery<object>, 'page' | 'pageSize'>): PagedResult<T> {
  const pageSize = query.pageSize;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

function applySearch<T>(items: T[], search: string | undefined, extractor: (item: T) => string): T[] {
  if (!search?.trim()) return items;
  const keyword = search.trim().toLowerCase();
  return items.filter(item => extractor(item).toLowerCase().includes(keyword));
}

function sortByKey<T>(items: T[], key: string, order: 'asc' | 'desc') {
  return [...items].sort((left, right) => {
    const leftValue = String((left as Record<string, unknown>)[key] ?? '');
    const rightValue = String((right as Record<string, unknown>)[key] ?? '');
    return order === 'asc' ? leftValue.localeCompare(rightValue) : rightValue.localeCompare(leftValue);
  });
}

function parseOperationLogTimestamp(value: string) {
  const relativeMatch = value.match(/^(\d+)\s*分钟前$/);
  if (relativeMatch) {
    const minutes = Number(relativeMatch[1]);
    return Date.now() - minutes * 60_000;
  }
  const hourMatch = value.match(/^(\d+)\s*小时前$/);
  if (hourMatch) {
    const hours = Number(hourMatch[1]);
    return Date.now() - hours * 3_600_000;
  }
  const direct = Date.parse(value.replace(' ', 'T'));
  return Number.isNaN(direct) ? 0 : direct;
}

function sortOperationLogs(items: GlobalOperationLogEntry[], query: Pick<ListQuery<object>, 'sortBy' | 'sortOrder'>) {
  if (query.sortBy !== 'timestampLabel') {
    return sortByKey(items, query.sortBy, query.sortOrder);
  }
  return [...items].sort((left, right) => {
    const leftValue = parseOperationLogTimestamp(left.timestampLabel);
    const rightValue = parseOperationLogTimestamp(right.timestampLabel);
    return query.sortOrder === 'asc' ? leftValue - rightValue : rightValue - leftValue;
  });
}

function filterCustomers(items: CustomerProfile[], filters: CustomerFilters) {
  return items.filter(item => {
    if (filters.segment && item.segment !== filters.segment) return false;
    if (filters.country && item.country !== filters.country) return false;
    if (filters.language && item.preferredLanguage !== filters.language) return false;
    if (filters.riskFlag && !item.riskFlags.includes(filters.riskFlag)) return false;
    return true;
  });
}

function filterTickets(items: ServiceTicket[], filters: TicketFilters) {
  return items.filter(item => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.workflowStage && item.workflowStage !== filters.workflowStage) return false;
    if (filters.channel && item.channel !== filters.channel) return false;
    if (filters.riskLevel && item.riskLevel !== filters.riskLevel) return false;
    if (filters.assignee && item.assignee !== filters.assignee) return false;
    return true;
  });
}

function filterOrders(items: Order[], filters: OrderFilters, customers: CustomerProfile[]) {
  return items.filter(item => {
    const customer = customers.find(entry => entry.id === item.customerId);
    if (filters.fulfillmentStatus && item.fulfillmentStatus !== filters.fulfillmentStatus) return false;
    if (filters.paymentStatus && item.paymentStatus !== filters.paymentStatus) return false;
    if (filters.country && customer?.country !== filters.country) return false;
    if (filters.risk && filters.risk === 'risk_only' && !item.riskAlert) return false;
    return true;
  });
}

function filterTasks(items: FollowUpTask[], filters: TaskFilters) {
  return items.filter(item => {
    if (filters.status && item.status !== filters.status) return false;
    if (filters.priority && item.priority !== filters.priority) return false;
    if (filters.triggeredBy && item.triggeredBy !== filters.triggeredBy) return false;
    return true;
  });
}

function filterOperationLogs(items: GlobalOperationLogEntry[], filters: OperationLogFilters) {
  return items.filter(item => {
    if (filters.sourceType && item.sourceType !== filters.sourceType) return false;
    if (filters.scope && item.scope !== filters.scope) return false;
    if (filters.riskLevel && item.riskLevel !== filters.riskLevel) return false;
    if (filters.actor && item.actor !== filters.actor) return false;
    return true;
  });
}

function filterDocuments(items: KnowledgeDocument[], filters: DocumentFilters) {
  return items.filter(item => {
    if (filters.scenario && item.scenario !== filters.scenario) return false;
    if (filters.language && item.language !== filters.language) return false;
    if (filters.publishStatus && item.publishStatus !== filters.publishStatus) return false;
    if (filters.owner && item.owner !== filters.owner) return false;
    return true;
  });
}

function filterRagRuns(items: RagRun[], filters: RagRunFilters) {
  return items.filter(item => {
    if (filters.scenario && item.scenario !== filters.scenario) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.locale && item.locale !== filters.locale) return false;
    if (filters.hasFallback !== undefined && Boolean(item.fallbackReason) !== filters.hasFallback) return false;
    if (filters.knowledgeGapType && item.knowledgeGapType !== filters.knowledgeGapType) return false;
    return true;
  });
}

function findTicket(snapshot: ServiceHubSnapshot, ticketId: string) {
  return snapshot.tickets.find(ticket => ticket.id === ticketId);
}

function findCustomer(snapshot: ServiceHubSnapshot, customerId: string) {
  return snapshot.customers.find(customer => customer.id === customerId);
}

function scenarioToIssueType(scenario: string): ServiceTicket['issueType'] {
  switch (scenario) {
    case 'Shipping':
      return 'Shipping Delay';
    case 'Refund':
    case 'Compensation':
    case 'Chargeback':
      return 'Refund Request';
    case 'Product Inquiry':
      return 'Product Inquiry';
    case 'Complaint':
      return 'Complaint';
    case 'Payment':
      return 'Payment Failed';
    case 'Address Change':
      return 'Address Change';
    case 'Return':
      return 'Return Request';
    default:
      return 'Shipping Delay';
  }
}

function issueTypeToScenario(issueType: ServiceTicket['issueType']) {
  switch (issueType) {
    case 'Shipping Delay':
      return 'Shipping';
    case 'Refund Request':
      return 'Refund';
    case 'Product Inquiry':
      return 'Product Inquiry';
    case 'Complaint':
      return 'Complaint';
    case 'Payment Failed':
      return 'Payment';
    case 'Return Request':
      return 'Refund';
    default:
      return 'Shipping';
  }
}

function buildSendGuardrail(snapshot: ServiceHubSnapshot, ticket: ServiceTicket): SendGuardrailResult {
  const scenario = issueTypeToScenario(ticket.issueType);
  const config = resolveScenarioConfig(snapshot.scenarioModelConfigs, scenario);
  const review = snapshot.reviewDecisions.find(item => item.id === ticket.reviewDecisionId);
  const approved = review?.status === 'approved';
  const manualReviewRequired = config.manualReviewRequired;
  const blocked = manualReviewRequired && !approved;
  return {
    blocked,
    manualReviewRequired,
    reason: blocked
      ? '当前场景必须先完成人工复核，之后才能由人工发送。'
      : config.humanSendAllowed
      ? '当前场景允许人工发送，AI 仍不可自动发送。'
      : '当前场景仍需人工处理结论，AI 只能保留建议草稿。',
    scenario,
    aiPermission: config.aiSuggestAllowed ? 'suggest_only' : 'disabled',
    autoSend: 'disabled',
  };
}

function buildDraftTraceFromSnapshot(snapshot: ServiceHubSnapshot, ticket: ServiceTicket) {
  const scenario = issueTypeToScenario(ticket.issueType);
  const scenarioConfig = resolveScenarioConfig(snapshot.scenarioModelConfigs, scenario);
  const replyDraftingNode = findNodeConfig(snapshot.pipelineNodeConfigs, 'reply-drafting');
  const riskNode = findNodeConfig(snapshot.pipelineNodeConfigs, 'risk-detection');
  const retrievalNode = findNodeConfig(snapshot.pipelineNodeConfigs, 'knowledge-retrieval');
  return {
    scenario,
    scenarioConfigId: scenarioConfig.id,
    scenarioConfigName: scenarioConfig.name,
    scenarioConfigVersion: scenarioConfig.version,
    draftingModel: replyDraftingNode?.primaryModel ?? scenarioConfig.primaryModel,
    retrievalSummary: `Top K ${scenarioConfig.topK} / 阈值 ${scenarioConfig.similarityThreshold} / ${scenarioConfig.rerankerEnabled ? '启用重排序' : '关闭重排序'}`,
    citationRequired: scenarioConfig.citationRequired,
    manualReviewRequired: scenarioConfig.manualReviewRequired,
    guardrailResult: buildSendGuardrail(snapshot, ticket).blocked ? '发送前要求人工复核' : '允许人工发送',
    nodeModels: [
      `回复草稿：${replyDraftingNode?.primaryModel ?? '继承场景默认'}`,
      `风险识别：${riskNode?.primaryModel ?? '继承场景默认'}`,
      `知识检索：${retrievalNode?.primaryModel ?? scenarioConfig.primaryModel}`,
    ],
  };
}

function createPromptPreview(customerName: string, scenario: string, question: string, orderId: string, sources: string[], scenarioConfig: ScenarioModelConfig): PromptPreviewSnapshot {
  return {
    systemRole: '你是跨境电商独立站客服 Copilot，只能提供可编辑建议，不能直接发送消息或做出审批决定。',
    customerContext: `客户：${customerName}；问题：${question}；场景：${scenario}`,
    orderContext: `关联订单：${orderId}；需要结合订单履约、支付、物流与客服上下文综合判断。`,
    conversationSummary: `当前问题围绕${scenario}展开，系统需先完成检索与规则校验，再输出可编辑回复草稿。`,
    retrievedKnowledge: sources,
    businessRules: ['必须引用检索证据。', '回复不得超出政策允许范围。'],
    riskPolicy: [
      scenarioConfig.manualReviewRequired ? '当前场景策略要求先人工复核。' : '当前场景可继续产出建议草稿。',
      scenarioConfig.humanSendAllowed ? '人工发送已开放，AI 自动发送保持禁用。' : '当前场景不允许直接发送，需等待人工结论。',
    ],
    blockedClaims: scenarioConfig.blockedClaims,
    outputFormat: '可编辑回复草稿',
  };
}

function createGuardrailCheck(snapshot: ServiceHubSnapshot, scenario: string, citationCount: number): GuardrailCheckResult {
  return buildGuardrailDecision(scenario, citationCount, snapshot.scenarioModelConfigs, snapshot.pipelineNodeConfigs);
}

function scenarioFromKnowledgeCollectionId(collectionId: string) {
  const map: Record<string, { scenario: string; name: string }> = {
    'KBC-OPS-LOGISTICS': { scenario: 'Shipping', name: '物流知识集合' },
    'KBC-OPS-DELIVERY-SLA': { scenario: 'Shipping', name: '配送时效知识集合' },
    'KBC-OPS-ORDER-TRACKING': { scenario: 'Shipping', name: '订单追踪知识集合' },
    'KBC-AFTERSALES-REFUND': { scenario: 'Refund', name: '退款知识集合' },
    'KBC-AFTERSALES-RETURN': { scenario: 'Refund', name: '退货知识集合' },
    'KBC-AFTERSALES-PAYMENT-COMPENSATION': { scenario: 'Payment', name: '支付与赔付知识集合' },
    'KBC-ESC-COMPLAINT': { scenario: 'Complaint', name: '投诉处理知识集合' },
    'KBC-ESC-ESCALATION': { scenario: 'Complaint', name: '升级规范知识集合' },
    'KBC-ESC-HIGH-RISK-SCRIPT': { scenario: 'Complaint', name: '高风险话术知识集合' },
    'KBC-PROD-FAQ': { scenario: 'Product Inquiry', name: '商品 FAQ 知识集合' },
    'KBC-PROD-SERVICE-POLICY': { scenario: 'Product Inquiry', name: '服务政策知识集合' },
  };
  return map[collectionId]?.scenario;
}

function knowledgeCollectionName(collectionId: string) {
  const names: Record<string, string> = {
    'KBC-OPS-LOGISTICS': '物流知识集合',
    'KBC-OPS-DELIVERY-SLA': '配送时效知识集合',
    'KBC-OPS-ORDER-TRACKING': '订单追踪知识集合',
    'KBC-AFTERSALES-REFUND': '退款知识集合',
    'KBC-AFTERSALES-RETURN': '退货知识集合',
    'KBC-AFTERSALES-PAYMENT-COMPENSATION': '支付与赔付知识集合',
    'KBC-ESC-COMPLAINT': '投诉处理知识集合',
    'KBC-ESC-ESCALATION': '升级规范知识集合',
    'KBC-ESC-HIGH-RISK-SCRIPT': '高风险话术知识集合',
    'KBC-PROD-FAQ': '商品 FAQ 知识集合',
    'KBC-PROD-SERVICE-POLICY': '服务政策知识集合',
  };
  return names[collectionId] ?? collectionId;
}

function createRagTestRun(snapshot: ServiceHubSnapshot, request: RunRagTestRequest): RagTestRunResult {
  const customer = findCustomer(snapshot, request.customerId) ?? snapshot.customers[0];
  const order = snapshot.orders.find(item => item.id === request.relatedOrderId) ?? snapshot.orders[0];
  const scenarioConfig = resolveScenarioConfig(snapshot.scenarioModelConfigs, request.scenario);
  const boundScenarios = new Set(
    scenarioConfig.knowledgeBindings
      .filter(binding => binding.enabled)
      .flatMap(binding => binding.collectionIds)
      .map(scenarioFromKnowledgeCollectionId)
      .filter((value): value is string => Boolean(value)),
  );
  const boundKnowledgeBaseIds = scenarioConfig.knowledgeBindings.filter(binding => binding.enabled).map(binding => binding.knowledgeBaseId);
  const boundCollectionIds = scenarioConfig.knowledgeBindings.filter(binding => binding.enabled).flatMap(binding => binding.collectionIds);
  const matchedDocs = snapshot.knowledgeDocuments
    .filter(doc => boundScenarios.has(doc.scenario))
    .slice(0, 3);
  const candidates = matchedDocs.map((doc, index) => ({
    id: `LAB-${String(snapshot.ragTestRuns.length + index + 1).padStart(3, '0')}`,
    source: doc.name,
    chunkId: snapshot.knowledgeChunks.find(chunk => chunk.documentId === doc.id)?.id ?? `CHK-LAB-${index + 1}`,
    score: Number((0.92 - index * 0.08).toFixed(2)),
    rerankScore: Number((0.95 - index * 0.09).toFixed(2)),
    selected: index < 2,
    rejectReason: index < 2 ? undefined : '相关度较低，已在重排序阶段丢弃。',
    metadata: {
      language: request.language,
      scenario: request.scenario,
      scenarioType: request.scenario,
      strategyId: scenarioConfig.id,
      knowledgeBaseIds: boundKnowledgeBaseIds.join(','),
      collectionIds: boundCollectionIds.join(','),
      collectionName: knowledgeCollectionName(boundCollectionIds.find(collectionId => scenarioFromKnowledgeCollectionId(collectionId) === doc.scenario) ?? boundCollectionIds[0] ?? ''),
      retrievalProfileId: `${scenarioConfig.id}-retrieval`,
      nodeId: 'knowledge-retrieval',
      country: customer.country,
      policy_version: doc.version,
      customer_type: customer.type,
    },
    snippet: snapshot.knowledgeChunks.find(chunk => chunk.documentId === doc.id)?.content ?? `${doc.name} 的核心规则片段。`,
  }));

  const promptPreview = createPromptPreview(customer.name, request.scenario, request.customerQuestion, order.id, candidates.filter(item => item.selected).map(item => item.source), scenarioConfig);
  const guardrailCheck = createGuardrailCheck(snapshot, request.scenario, candidates.filter(item => item.selected).length);
  const run: RagTestRun = {
    id: `LAB-${String(snapshot.ragTestRuns.length + 1).padStart(3, '0')}`,
    customerQuestion: request.customerQuestion,
    customerId: customer.id,
    customerName: customer.name,
    scenario: request.scenario,
    language: request.language,
    relatedOrderId: order.id,
    ticketId: snapshot.tickets.find(ticket => ticket.customerId === customer.id && ticket.issueType === scenarioToIssueType(request.scenario))?.id,
    retrievedChunks: candidates,
    promptPreview,
    aiDraftReply: guardrailCheck.manualReviewRequired
      ? `您好，关于您的${request.scenario}问题，我们已经整理了订单与政策信息。由于该场景涉及高风险处理，建议客服说明当前正在人工复核中，并承诺在下一个处理节点同步结论。`
      : `您好，关于订单 ${order.id} 的问题，我们已结合订单与知识库信息完成检查。当前建议先向客户同步已知状态、说明下一步处理动作，并保留后续跟进时间点。`,
    guardrailCheck,
    createdAt: nowUiStamp(),
  };

  return { snapshot, run, promptPreview, guardrailCheck };
}

export function createMockServiceHubApi(snapshot: ServiceHubSnapshot): ServiceHubApi {
  return {
    async getSnapshot() {
      return cloneSnapshot(snapshot);
    },
    async getCustomers(query) {
      const next = cloneSnapshot(snapshot);
      const filtered = applySearch(filterCustomers(next.customers, query.filters), query.search, item => `${item.name} ${item.email} ${item.segment} ${item.country}`);
      return paginate(sortByKey(filtered, query.sortBy, query.sortOrder), query);
    },
    async getCustomer(id: string) {
      return cloneSnapshot(snapshot).customers.find(customer => customer.id === id);
    },
    async getTickets(query) {
      const next = cloneSnapshot(snapshot);
      const filtered = applySearch(filterTickets(next.tickets, query.filters), query.search, item => `${item.id} ${item.summary} ${item.intent} ${item.assignee}`);
      return paginate(sortByKey(filtered, query.sortBy, query.sortOrder), query);
    },
    async getTicket(id: string) {
      return cloneSnapshot(snapshot).tickets.find(ticket => ticket.id === id);
    },
    async getOrders(query) {
      const next = cloneSnapshot(snapshot);
      const filtered = applySearch(filterOrders(next.orders, query.filters, next.customers), query.search, item => `${item.id} ${item.carrier} ${item.fulfillmentStatus} ${item.paymentStatus}`);
      return paginate(sortByKey(filtered, query.sortBy, query.sortOrder), query);
    },
    async getTasks(query) {
      const next = cloneSnapshot(snapshot);
      const filtered = applySearch(filterTasks(next.tasks, query.filters), query.search, item => `${item.description} ${item.ticketId} ${item.owner} ${item.triggeredBy}`);
      return paginate(sortByKey(filtered, query.sortBy, query.sortOrder), query);
    },
    async getOperationLogs(query) {
      const next = cloneSnapshot(snapshot);
      const filtered = applySearch(
        filterOperationLogs(next.operationLogs, query.filters),
        query.search,
        item => `${item.actor} ${item.action} ${item.scope} ${item.detail} ${item.result}`,
      );
      return paginate(sortOperationLogs(filtered, query), query);
    },
    async retrieveTicket(request: TicketRetrieveRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      if (ticket) {
        ticket.workflowStage = 'retrieve';
        ticket.lastUpdated = nowIso();
        ticket.aiSummary = `${ticket.aiSummary} Retrieval replayed from mock API.`;
      }
      return { snapshot: next, ragRun: next.ragRuns.find(run => run.ticketId === request.ticketId) };
    },
    async draftTicket(request: TicketDraftRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      if (ticket) {
        ticket.workflowStage = ticket.manualReview ? 'review' : 'draft';
        ticket.lastUpdated = nowIso();
      }
      const draft = ticket ? next.replyDrafts.find(item => item.id === ticket.draftId) : undefined;
      if (draft && ticket) {
        draft.sourceTrace = buildDraftTraceFromSnapshot(next, ticket);
      }
      return { snapshot: next, draft };
    },
    async sendTicketReply(request: TicketReplySendRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      if (!ticket) return { snapshot: next, ticket: undefined, guardrail: undefined };

      const guardrail = buildSendGuardrail(next, ticket);
      ticket.sendGuardrailResult = guardrail;
      if (guardrail.blocked) {
        next.auditLogs = [
          {
            id: `AUD-${String(next.auditLogs.length + 1).padStart(3, '0')}`,
            ticketId: ticket.id,
            eventType: 'Guardrail block',
            actor: request.agentName,
            outcome: '发送前被人工复核闸门阻止。',
            riskLevel: ticket.riskLevel,
            timestamp: nowUiStamp(),
            detail: guardrail.reason,
          },
          ...next.auditLogs,
        ];
        return { snapshot: next, ticket, guardrail };
      }

      next.messages = [
        ...next.messages,
        {
          ticketId: ticket.id,
          sender: 'agent',
          type: 'text',
          content: request.content,
          timestamp: nowIso(),
        },
        {
          ticketId: ticket.id,
          sender: 'system',
          type: 'system',
          content: '客服已人工发送回复，AI 仅作为建议来源保留。',
          timestamp: nowIso(),
        },
      ];
      ticket.workflowStage = 'follow-up';
      ticket.status = 'Waiting Customer';
      ticket.lastUpdated = nowIso();
      ticket.lastReplyAt = nowIso();
      ticket.lastReplyBy = request.agentName;
      next.auditLogs = [
        {
          id: `AUD-${String(next.auditLogs.length + 1).padStart(3, '0')}`,
          ticketId: ticket.id,
          eventType: 'Manual send',
          actor: request.agentName,
          outcome: '客服已人工发送客户回复。',
          riskLevel: ticket.riskLevel,
          timestamp: nowUiStamp(),
          detail: `使用 ${resolveScenarioConfig(next.scenarioModelConfigs, issueTypeToScenario(ticket.issueType)).name}，AI 自动发送保持禁用。`,
        },
        ...next.auditLogs,
      ];
      return { snapshot: next, ticket, guardrail };
    },
    async saveTicketDraft(request: TicketDraftSaveRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      const draft = ticket ? next.replyDrafts.find(item => item.id === ticket.draftId) : undefined;
      if (ticket && draft) {
        draft.content = request.content;
        draft.sourceTrace = buildDraftTraceFromSnapshot(next, ticket);
        ticket.draftSavedAt = nowIso();
        ticket.lastUpdated = nowIso();
      }
      return { snapshot: next, draft };
    },
    async closeTicket(request: TicketCloseRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      if (!ticket) return { snapshot: next, ticket: undefined, blocked: true, message: '未找到工单。' };

      const guardrail = buildSendGuardrail(next, ticket);
      if (guardrail.manualReviewRequired) {
        const review = next.reviewDecisions.find(item => item.id === ticket.reviewDecisionId);
        if (review?.status !== 'approved') {
          return { snapshot: next, ticket, blocked: true, message: '高风险场景必须先通过人工复核，之后才能关闭工单。' };
        }
      }

      ticket.status = 'Closed';
      ticket.workflowStage = 'resolved';
      ticket.lastUpdated = nowIso();
      next.messages = [
        ...next.messages,
        {
          ticketId: ticket.id,
          sender: 'system',
          type: 'system',
          content: '工单已由人工关闭。',
          timestamp: nowIso(),
        },
      ];
      next.auditLogs = [
        {
          id: `AUD-${String(next.auditLogs.length + 1).padStart(3, '0')}`,
          ticketId: ticket.id,
          eventType: 'Manual close',
          actor: request.actor,
          outcome: '客服已人工关闭工单。',
          riskLevel: ticket.riskLevel,
          timestamp: nowUiStamp(),
          detail: '关闭前已完成必要的人工审核与处理动作确认。',
        },
        ...next.auditLogs,
      ];
      return { snapshot: next, ticket, blocked: false, message: '工单已关闭。' };
    },
    async reviewTicket(request: TicketReviewRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      let review: ReviewDecision | undefined;
      if (ticket) {
        review = next.reviewDecisions.find(item => item.id === ticket.reviewDecisionId);
        if (review) {
          review.status = request.decision;
          review.reviewer = request.reviewer;
          review.reason = request.reason;
          review.updatedAt = nowIso();
        }
        ticket.workflowStage = request.decision === 'approved' ? 'execute' : request.decision === 'rejected' ? 'draft' : 'review';
        ticket.status = request.decision === 'approved' ? 'In Progress' : request.decision === 'escalated' ? 'Escalated' : ticket.status;
        ticket.lastUpdated = nowIso();
        ticket.sendGuardrailResult = buildSendGuardrail(next, ticket);
      }
      return { snapshot: next, review };
    },
    async runTicketAction(request: TicketActionRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      let action: TicketAction | undefined;
      const tasks: FollowUpTask[] = [];
      if (ticket) {
        action = next.ticketActions.find(item => item.id === request.actionId);
        if (action) {
          action.status = action.status === 'blocked' ? 'blocked' : 'completed';
          action.result = action.status === 'blocked' ? action.result : 'Completed through mock workflow execution.';
        }
        ticket.workflowStage = action?.status === 'completed' ? 'follow-up' : 'execute';
        ticket.status = action?.status === 'completed' ? 'Waiting Customer' : ticket.status;
        ticket.lastUpdated = nowIso();
        if (action?.status === 'completed' && ticket.executionOutcome.followUpNeeded) {
          const followupTask: FollowUpTask = {
            id: `TSK-${String(next.tasks.length + 1).padStart(3, '0')}`,
            description: ticket.executionOutcome.customerPromise,
            customerId: ticket.customerId,
            ticketId: ticket.id,
            due: ticket.executionOutcome.followUpAt ?? nowIso(),
            priority: ticket.priority,
            triggeredBy: 'Ticket Action',
            status: 'Pending',
            owner: ticket.assignee,
          };
          next.tasks = [followupTask, ...next.tasks];
          tasks.push(followupTask);
        }
      }
      return { snapshot: next, action, tasks };
    },
    async getKnowledgeDocuments(query) {
      const next = cloneSnapshot(snapshot);
      const filtered = applySearch(filterDocuments(next.knowledgeDocuments, query.filters), query.search, item => `${item.name} ${item.scenario} ${item.owner}`);
      return paginate(sortByKey(filtered, query.sortBy, query.sortOrder), query);
    },
    async getKnowledgeDocument(id: string) {
      return cloneSnapshot(snapshot).knowledgeDocuments.find(doc => doc.id === id);
    },
    async getFaqs() {
      return cloneSnapshot(snapshot).faqs;
    },
    async getReplyTemplates() {
      return cloneSnapshot(snapshot).replyTemplates;
    },
    async getBusinessRules() {
      return cloneSnapshot(snapshot).businessRules;
    },
    async getPolicyDocs() {
      return cloneSnapshot(snapshot).policyDocs;
    },
    async createKnowledgeDocument(request: CreateKnowledgeDocumentRequest) {
      const next = cloneSnapshot(snapshot);
      const document: KnowledgeDocument = {
        id: `DOC-${String(next.knowledgeDocuments.length + 1).padStart(3, '0')}`,
        name: request.name,
        sourceType: request.sourceType,
        knowledgeType: request.knowledgeType,
        scenario: request.scenario,
        language: request.language,
        owner: request.owner,
        version: request.version,
        publishStatus: request.scenario === 'Complaint' ? 'version_conflict' : 'parsing',
        effectiveDate: request.effectiveDate,
        chunkCount: 0,
        vectorCount: 0,
        coverageScore: 0,
        parseError: request.scenario === 'Complaint' ? '检测到文档版本冲突，当前文件与已有入库记录存在重复或不一致内容。' : undefined,
      };
      const job: IngestionJob = {
        id: `JOB-${String(next.ingestionJobs.length + 1).padStart(3, '0')}`,
        documentId: document.id,
        documentName: document.name,
        status: document.publishStatus,
        startedAt: nowIso(),
        updatedAt: nowIso(),
        detail: document.parseError ?? '文档已进入解析队列，等待切片与向量化。',
      };
      const ingestionDocument: IngestionDocumentRecord = {
        id: `ING-${String(next.ingestionDocuments.length + 1).padStart(3, '0')}`,
        documentId: document.id,
        documentName: document.name,
        sourceType: document.sourceType,
        knowledgeType: document.knowledgeType,
        scenario: document.scenario,
        language: document.language,
        owner: document.owner,
        version: document.version,
        effectiveDate: document.effectiveDate,
        parseStatus: 'uploaded',
        chunkStatus: 'pending',
        embeddingStatus: 'pending',
        indexStatus: 'pending',
        chunkCount: 0,
        vectorCount: 0,
        lastSync: nowUiStamp(),
        parsedText: `${document.name} 尚未完成解析，当前仅展示上传元数据。`,
        chunkIds: [],
        disabled: false,
      };
      next.knowledgeDocuments = [document, ...next.knowledgeDocuments];
      next.ingestionJobs = [job, ...next.ingestionJobs];
      next.ingestionDocuments = [ingestionDocument, ...next.ingestionDocuments];
      withServiceHealth(next);
      return { snapshot: next, job, document };
    },
    async reindexKnowledgeDocument(id: string) {
      const next = cloneSnapshot(snapshot);
      const job = next.ingestionJobs.find(item => item.documentId === id);
      const document = next.knowledgeDocuments.find(item => item.id === id);
      const ingestionDocument = next.ingestionDocuments.find(item => item.documentId === id);
      if (job && document) {
        job.status = document.publishStatus === 'expired' ? 'expired' : 'indexed';
        job.updatedAt = nowIso();
        job.detail = document.publishStatus === 'expired' ? '文档已过期，需先刷新知识内容后再重建索引。' : '模拟重建索引已完成，并重新进入发布队列。';
      }
      if (ingestionDocument) {
        ingestionDocument.embeddingStatus = document?.publishStatus === 'expired' ? 'failed' : 'embedded';
        ingestionDocument.indexStatus = document?.publishStatus === 'expired' ? 'failed' : 'indexed';
        ingestionDocument.vectorCount = ingestionDocument.chunkCount || Math.max(8, document?.chunkCount ?? 0);
        ingestionDocument.lastSync = nowUiStamp();
      }
      withServiceHealth(next);
      return { snapshot: next, job };
    },
    async runIngestionAction(request: IngestionActionRequest) {
      const next = cloneSnapshot(snapshot);
      const document = next.ingestionDocuments.find(item => item.documentId === request.documentId);
      const job = next.ingestionJobs.find(item => item.documentId === request.documentId);
      const knowledgeDocument = next.knowledgeDocuments.find(item => item.id === request.documentId);

      if (!document) {
        return { snapshot: next, document: undefined, message: '未找到文档记录。' };
      }

      if (request.action === 'view_parsed_text') {
        return { snapshot: next, document, parsedText: document.parsedText, message: '已打开解析文本。' };
      }

      if (request.action === 'view_chunks') {
        const chunks = next.knowledgeChunks.filter(chunk => chunk.documentId === request.documentId).map(chunk => chunk.content);
        const fallbackChunks = document.chunkIds.map((chunkId, index) => `分块 ${index + 1}（${chunkId}）：用于 ${document.scenario} 场景的知识检索与提示词组装。`);
        return { snapshot: next, document, chunks: chunks.length > 0 ? chunks : fallbackChunks, message: '已打开切片结果。' };
      }

      if (request.action === 'rebuild_embedding') {
        document.parseStatus = 'parsed';
        document.chunkStatus = 'indexed';
        document.embeddingStatus = 'embedded';
        document.indexStatus = 'indexed';
        document.vectorCount = Math.max(document.chunkCount, document.vectorCount || document.chunkCount || 12);
        document.lastSync = nowUiStamp();
        if (job) {
          job.status = 'indexed';
          job.updatedAt = nowIso();
          job.detail = '已重建向量并重新写入索引。';
        }
        if (knowledgeDocument) {
          knowledgeDocument.publishStatus = 'indexed';
          knowledgeDocument.vectorCount = document.vectorCount;
          knowledgeDocument.coverageScore = Math.max(knowledgeDocument.coverageScore, 82);
        }
        withServiceHealth(next);
        return { snapshot: next, document, message: '已完成重建向量。' };
      }

      if (request.action === 'publish') {
        document.parseStatus = 'parsed';
        document.chunkStatus = 'indexed';
        document.embeddingStatus = 'indexed';
        document.indexStatus = 'published';
        document.vectorCount = Math.max(document.vectorCount, document.chunkCount || 12);
        document.lastSync = nowUiStamp();
        if (job) {
          job.status = 'published';
          job.updatedAt = nowIso();
          job.detail = '文档已发布，可用于检索与 Prompt 组装。';
        }
        if (knowledgeDocument) {
          knowledgeDocument.publishStatus = 'published';
          knowledgeDocument.vectorCount = document.vectorCount;
          knowledgeDocument.coverageScore = Math.max(knowledgeDocument.coverageScore, 90);
        }
        withServiceHealth(next);
        return { snapshot: next, document, message: '文档已发布。' };
      }

      document.disabled = true;
      document.indexStatus = 'disabled';
      document.lastSync = nowUiStamp();
      if (job) {
        job.status = 'expired';
        job.updatedAt = nowIso();
        job.detail = '文档已禁用，不再参与检索。';
      }
      if (knowledgeDocument) {
        knowledgeDocument.publishStatus = 'expired';
      }
      withServiceHealth(next);
      return { snapshot: next, document, message: '文档已禁用。' };
    },
    async updateRagConfig(request: UpdateRagConfigRequest) {
      const next = cloneSnapshot(snapshot);
      next.ragConfig = {
        ...request.ragConfig,
        updatedAt: nowUiStamp(),
      };
      prependAudit(next, 'Config change', `全局 RAG 配置已更新：Top K=${request.ragConfig.retrieval.topK}，阈值=${request.ragConfig.retrieval.similarityThreshold}，重排序=${request.ragConfig.retrieval.rerankerEnabled ? '开启' : '关闭'}`);
      withServiceHealth(next);
      return { snapshot: next, ragConfig: next.ragConfig };
    },
    async updateScenarioModelConfig(request: UpdateScenarioModelConfigRequest) {
      const next = cloneSnapshot(snapshot);
      const hasKnowledgeBinding = request.config.knowledgeBindings.some(binding => binding.enabled && binding.knowledgeBaseId && binding.collectionIds.length > 0);
      const hasEnabledEmptyBinding = request.config.knowledgeBindings.some(binding => binding.enabled && binding.collectionIds.length === 0);
      if (!hasKnowledgeBinding) {
        throw new Error('场景策略必须至少绑定一个知识库和一个知识集合。');
      }
      if (hasEnabledEmptyBinding) {
        throw new Error('请至少选择一个知识集合。');
      }
      const missingRequiredNodes = getMissingRequiredNodeIds(request.config, next.pipelineNodeConfigs);
      if (request.config.manualReviewRequired && missingRequiredNodes.includes('human-review-routing')) {
        throw new Error('所有输出必须人工复核时，必须启用人工复核路由节点。');
      }
      const draftConfig = { ...request.config, updatedAt: nowUiStamp() };
      const activePolicy = buildEffectiveScenarioPolicies(
        next.scenarioModelConfigs.map(item => item.id === request.config.id ? draftConfig : item),
        next.pipelineNodeConfigs,
        next.ragConfig,
      ).find(item => item.scenarioConfigId === request.config.id);
      if (draftConfig.status === 'active' && activePolicy && !activePolicy.canActivate) {
        throw new Error(activePolicy.validationIssues.join('；'));
      }
      next.scenarioModelConfigs = next.scenarioModelConfigs.map(item => item.id === request.config.id ? draftConfig : item);
      const effectiveScenarioPolicies = buildEffectiveScenarioPolicies(next.scenarioModelConfigs, next.pipelineNodeConfigs);
      const effectiveNodePolicies = buildEffectiveNodePolicies(next.capabilityPipeline, next.pipelineNodeConfigs, next.scenarioModelConfigs);
      next.modelRoutingSummary = {
        ...buildDerivedRoutingSummary(next.aiEnvironment, next.ragConfig, effectiveScenarioPolicies, effectiveNodePolicies),
        defaultScenarioConfigId: next.modelRoutingSummary.defaultScenarioConfigId,
      };
      const config = next.scenarioModelConfigs.find(item => item.id === request.config.id) ?? request.config;
      prependAudit(next, 'Config change', `场景策略已更新：${request.config.scenario}（${request.config.name}），模型=${request.config.primaryModel}`);
      withServiceHealth(next);
      return { snapshot: next, config };
    },
    async updatePipelineNodeConfig(request: UpdatePipelineNodeConfigRequest) {
      const next = cloneSnapshot(snapshot);
      const normalizedConfig = request.config.usesKnowledgeBase
        ? request.config
        : { ...request.config, citationRequired: false, requireCitation: false };
      next.pipelineNodeConfigs = next.pipelineNodeConfigs.map(item => item.id === normalizedConfig.id ? { ...normalizedConfig, updatedAt: nowUiStamp() } : item);
      next.capabilityPipeline = next.capabilityPipeline.map(item => item.id === normalizedConfig.nodeId ? { ...item, enabled: normalizedConfig.enabled, requiresHumanConfirmation: normalizedConfig.humanConfirmationRequired, fallback: normalizedConfig.fallbackStrategy, appliesToScenarios: normalizedConfig.allowedScenarios.map(value => value === 'Product Inquiry' ? '商品咨询' : value === 'Shipping' ? '物流' : value === 'Refund' ? '退款' : value === 'Payment' ? '支付' : value === 'Complaint' ? '投诉' : value === 'Compensation' ? '赔偿' : value === 'Chargeback' ? '拒付' : value) } : item);
      const effectiveScenarioPolicies = buildEffectiveScenarioPolicies(next.scenarioModelConfigs, next.pipelineNodeConfigs);
      const effectiveNodePolicies = buildEffectiveNodePolicies(next.capabilityPipeline, next.pipelineNodeConfigs, next.scenarioModelConfigs);
      next.modelRoutingSummary = {
        ...buildDerivedRoutingSummary(next.aiEnvironment, next.ragConfig, effectiveScenarioPolicies, effectiveNodePolicies),
        defaultScenarioConfigId: next.modelRoutingSummary.defaultScenarioConfigId,
      };
      const config = next.pipelineNodeConfigs.find(item => item.id === normalizedConfig.id) ?? normalizedConfig;
      prependAudit(
        next,
        'Config change',
        `能力节点配置已更新：${normalizedConfig.name}，启用=${normalizedConfig.enabled ? '是' : '否'}${request.config.usesKnowledgeBase ? '' : '；非知识节点引用来源已归一为否'}`,
      );
      withServiceHealth(next);
      return { snapshot: next, config };
    },
    async getRagRuns(query) {
      const next = cloneSnapshot(snapshot);
      const filtered = applySearch(filterRagRuns(next.ragRuns, query.filters), query.search, item => `${item.ticketId} ${item.scenario} ${item.locale}`);
      return paginate(sortByKey(filtered, query.sortBy, query.sortOrder), query);
    },
    async getRagRun(id: string) {
      return cloneSnapshot(snapshot).ragRuns.find(run => run.id === id);
    },
    async runRagTest(request: RunRagTestRequest) {
      const next = cloneSnapshot(snapshot);
      const result = createRagTestRun(next, request);
      next.ragTestRuns = [result.run, ...next.ragTestRuns.filter(item => item.id !== result.run.id)];
      withServiceHealth(next);
      return { ...result, snapshot: next };
    },
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
    async getEvaluations() {
      return cloneSnapshot(snapshot).evaluations;
    },
    async getAIConsoleSnapshot() {
      const next = cloneSnapshot(snapshot);
      const aiConsole: AIConsoleSnapshot = {
        environment: next.aiEnvironment,
        aiCapabilities: next.aiCapabilities,
        permissionBoundaries: next.permissionBoundaries,
        guardrails: next.guardrails,
        aiOpsStages: next.aiOpsStages,
        knowledgeDocuments: next.knowledgeDocuments,
        knowledgeChunks: next.knowledgeChunks,
        ingestionDocuments: next.ingestionDocuments,
        ragConfig: next.ragConfig,
        ragRuns: next.ragRuns,
        ragTestRuns: next.ragTestRuns,
        replyDrafts: next.replyDrafts,
        ingestionJobs: next.ingestionJobs,
        capabilityPipeline: next.capabilityPipeline,
        scenarioModelConfigs: next.scenarioModelConfigs,
        pipelineNodeConfigs: next.pipelineNodeConfigs,
        modelRoutingSummary: next.modelRoutingSummary,
        evaluations: next.evaluations,
        feedbackLoop: next.feedbackLoop,
        auditLogs: next.auditLogs,
        serviceHealth: next.serviceHealth,
      };
      return aiConsole;
    },
    async getInsightsSnapshot() {
      const next = cloneSnapshot(snapshot);
      const insights: InsightsSnapshot = {
        analytics: next.analytics,
        activityLog: next.activityLog,
      };
      return insights;
    },
    async getAdminSnapshot() {
      const next = cloneSnapshot(snapshot);
      const admin: AdminSnapshot = {
        settings: next.settings,
        agents: next.agents,
      };
      return admin;
    },
  };
}
