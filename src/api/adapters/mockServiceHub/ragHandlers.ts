import type {
  RagTestRunResult,
  RunRagTestRequest,
  ServiceHubApi,
  UpdatePipelineNodeConfigRequest,
  UpdateRagConfigRequest,
  UpdateScenarioModelConfigRequest,
} from '../../contracts/serviceHub';
import type {
  GuardrailCheckResult,
  PromptPreviewSnapshot,
  RagRun,
  RagRunFilters,
  RagTestRun,
  ScenarioModelConfig,
  ServiceHubSnapshot,
  ServiceTicket,
} from '../../../types';
import {
  buildDerivedRoutingSummary,
  buildEffectiveNodePolicies,
  buildEffectiveScenarioPolicies,
  buildGuardrailDecision,
  findScenarioConfig as resolveScenarioConfig,
  getMissingRequiredNodeIds,
} from '../../../shared/lib/aiConsolePolicy';
import { applySearch, cloneSnapshot, nowUiStamp, paginate, prependAudit, sortByKey, withServiceHealth } from './shared';

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

function createPromptPreview(
  customerName: string,
  scenario: string,
  question: string,
  orderId: string,
  sources: string[],
  scenarioConfig: ScenarioModelConfig,
): PromptPreviewSnapshot {
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
  const customer = snapshot.customers.find(item => item.id === request.customerId) ?? snapshot.customers[0];
  const order = snapshot.orders.find(item => item.id === request.relatedOrderId) ?? snapshot.orders[0];
  const scenarioConfig = resolveScenarioConfig(snapshot.scenarioModelConfigs, request.scenario);
  const enabledBindings = scenarioConfig.knowledgeBindings.filter(binding => binding.enabled);
  const boundScenarios = new Set(
    enabledBindings
      .flatMap(binding => binding.collectionIds)
      .map(scenarioFromKnowledgeCollectionId)
      .filter((value): value is string => Boolean(value)),
  );
  const boundKnowledgeBaseIds = enabledBindings.map(binding => binding.knowledgeBaseId);
  const boundCollectionIds = enabledBindings.flatMap(binding => binding.collectionIds);
  const candidates = snapshot.knowledgeDocuments
    .filter(doc => boundScenarios.has(doc.scenario))
    .slice(0, 3)
    .map((doc, index) => ({
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

  const selectedSources = candidates.filter(item => item.selected).map(item => item.source);
  const promptPreview = createPromptPreview(customer.name, request.scenario, request.customerQuestion, order.id, selectedSources, scenarioConfig);
  const guardrailCheck = createGuardrailCheck(snapshot, request.scenario, selectedSources.length);
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

function updateRoutingSummary(snapshot: ServiceHubSnapshot) {
  const effectiveScenarioPolicies = buildEffectiveScenarioPolicies(snapshot.scenarioModelConfigs, snapshot.pipelineNodeConfigs);
  const effectiveNodePolicies = buildEffectiveNodePolicies(snapshot.capabilityPipeline, snapshot.pipelineNodeConfigs, snapshot.scenarioModelConfigs);
  snapshot.modelRoutingSummary = {
    ...buildDerivedRoutingSummary(snapshot.aiEnvironment, snapshot.ragConfig, effectiveScenarioPolicies, effectiveNodePolicies),
    defaultScenarioConfigId: snapshot.modelRoutingSummary.defaultScenarioConfigId,
  };
}

export function createRagHandlers(snapshot: ServiceHubSnapshot): Pick<
  ServiceHubApi,
  | 'updateRagConfig'
  | 'updateScenarioModelConfig'
  | 'updatePipelineNodeConfig'
  | 'getRagRuns'
  | 'getRagRun'
  | 'runRagTest'
> {
  return {
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
      updateRoutingSummary(next);
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
      next.capabilityPipeline = next.capabilityPipeline.map(item => item.id === normalizedConfig.nodeId ? {
        ...item,
        enabled: normalizedConfig.enabled,
        requiresHumanConfirmation: normalizedConfig.humanConfirmationRequired,
        fallback: normalizedConfig.fallbackStrategy,
        appliesToScenarios: normalizedConfig.allowedScenarios.map(value => value === 'Product Inquiry' ? '商品咨询' : value === 'Shipping' ? '物流' : value === 'Refund' ? '退款' : value === 'Payment' ? '支付' : value === 'Complaint' ? '投诉' : value === 'Compensation' ? '赔偿' : value === 'Chargeback' ? '拒付' : value),
      } : item);
      updateRoutingSummary(next);
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
  };
}
