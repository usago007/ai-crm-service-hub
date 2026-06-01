import type {
  AIEnvironmentConfig,
  CapabilityPipelineNode,
  CustomerProfile,
  DraftSourceTrace,
  GuardrailCheckResult,
  KnowledgeDocument,
  ModelRoutingSummary,
  Order,
  PipelineNodeModelConfig,
  PromptPreviewSnapshot,
  RagConfigSnapshot,
  RagTestRun,
  RetrievalCandidate,
  ScenarioModelConfig,
  SendGuardrailResult,
  ServiceTicket,
} from '../../types';
import { displayScenario } from '../../utils/display';

export const aiEnvironment: AIEnvironmentConfig = {
  defaultModel: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
  rerankerModel: 'bge-reranker-v2-m3',
  regionStrategy: '区域优先，语言回退',
  fallbackStrategy: '置信度不足或本地化缺失时进入人工复核',
  releaseChannel: '稳定版',
  maintenanceMode: false,
  runtimeStatus: 'healthy',
};

export const ragConfig: RagConfigSnapshot = {
  parser: {
    enableOCR: true,
    extractTables: true,
    extractHeadings: true,
    preserveDocumentStructure: true,
    removeBoilerplateText: true,
    detectLanguage: true,
  },
  chunking: {
    strategy: 'by heading',
    chunkSize: 500,
    chunkOverlap: 80,
    minChunkLength: 80,
    maxChunkLength: 1200,
    keepSourceMetadata: true,
  },
  embedding: {
    model: 'text-embedding-3-small',
    batchSize: 64,
    vectorDimension: 1536,
    indexName: 'crm_service_knowledge',
    indexVersion: 'v1.3',
  },
  retrieval: {
    topK: 5,
    similarityThreshold: 0.78,
    rerankerEnabled: true,
    queryRewriteEnabled: true,
    metadataFilters: ['language', 'scenario', 'country', 'policy_version', 'customer_type'],
    citationRequired: true,
    noMatchFallback: '转人工编写回复',
    lowConfidenceFallback: '进入人工复核',
    sensitiveCaseFallback: '升级主管复核',
  },
  promptAssembly: {
    includeCustomerProfile: true,
    includeOrderContext: true,
    includeConversationHistory: true,
    includeRetrievedChunks: true,
    includeBusinessRules: true,
    includeRiskPolicy: true,
    includeBlockedClaims: true,
    outputFormat: '可编辑回复草稿',
    replyTone: 'standard',
    manualReviewStrategy: 'high_risk_only',
  },
  updatedAt: '2026-05-22 13:40',
};

export const capabilityPipeline: CapabilityPipelineNode[] = [
  { id: 'intent-classification', name: '意图识别', enabled: true, input: '客户问题文本', output: '意图标签与置信度', fallback: '回退到通用咨询分类', appliesToScenarios: ['物流', '退款', '商品咨询', '支付', '投诉'], requiresHumanConfirmation: false },
  { id: 'customer-matching', name: '客户匹配', enabled: true, input: '邮箱 / 姓名 / 订单线索', output: '客户 360 画像', fallback: '创建待确认客户线索', appliesToScenarios: ['物流', '退款', '商品咨询', '支付', '投诉'], requiresHumanConfirmation: false },
  { id: 'order-linking', name: '订单关联', enabled: true, input: '客户 ID 与订单号', output: '订单、履约与物流上下文', fallback: '要求客服补录订单号', appliesToScenarios: ['物流', '退款', '支付', '投诉'], requiresHumanConfirmation: false },
  { id: 'conversation-summary', name: '会话摘要', enabled: true, input: '完整对话历史', output: '摘要与待办要点', fallback: '仅保留最近三条消息', appliesToScenarios: ['物流', '退款', '商品咨询', '支付', '投诉'], requiresHumanConfirmation: false },
  { id: 'knowledge-retrieval', name: '知识检索', enabled: true, input: '问题 + 客户上下文 + 订单上下文', output: 'Top-K 知识片段', fallback: '触发无命中回退策略', appliesToScenarios: ['物流', '退款', '商品咨询', '支付', '投诉'], requiresHumanConfirmation: false },
  { id: 'policy-check', name: '政策检查', enabled: true, input: '检索片段 + 业务规则', output: '可引用政策与禁止动作', fallback: '采用最保守政策口径', appliesToScenarios: ['退款', '赔偿', '拒付', '投诉'], requiresHumanConfirmation: true },
  { id: 'reply-drafting', name: '回复草稿生成', enabled: true, input: 'Prompt 组装上下文', output: '可编辑回复草稿', fallback: '回退到模板草稿', appliesToScenarios: ['物流', '退款', '商品咨询', '支付', '投诉'], requiresHumanConfirmation: false },
  { id: 'risk-detection', name: '风险识别', enabled: true, input: '草稿 + 场景 + 风险标签', output: '风险等级与命中点', fallback: '全部高敏场景转人工', appliesToScenarios: ['退款', '赔偿', '拒付', '投诉'], requiresHumanConfirmation: true },
  { id: 'human-review-routing', name: '人工复核路由', enabled: true, input: '风险结果 + 置信度', output: '标准 / 复核 / 升级', fallback: '不确定时一律复核', appliesToScenarios: ['物流', '退款', '商品咨询', '支付', '投诉'], requiresHumanConfirmation: true },
  { id: 'followup-task', name: '跟进任务创建', enabled: true, input: '处理结果与待办事项', output: '跟进任务', fallback: '由客服手动创建任务', appliesToScenarios: ['物流', '退款', '投诉'], requiresHumanConfirmation: false },
  { id: 'feedback-capture', name: '反馈采集', enabled: true, input: '客服采纳 / 编辑 / 驳回行为', output: '反馈记录与优化建议', fallback: '仅记录审计日志', appliesToScenarios: ['物流', '退款', '商品咨询', '支付', '投诉'], requiresHumanConfirmation: false },
];

type ScenarioModelConfigSeed = Omit<ScenarioModelConfig, 'status' | 'outputMode' | 'knowledgeBindings' | 'evaluationSetIds' | 'safetyRuleIds' | 'nodeOverrides'>;

const standardScenarioNodeOrder = [
  'intent-classification',
  'customer-matching',
  'order-linking',
  'conversation-summary',
  'knowledge-retrieval',
  'policy-check',
  'risk-detection',
  'reply-drafting',
  'human-review-routing',
  'followup-task',
  'feedback-capture',
];

const highRiskScenarioSet = new Set(['Refund', 'Complaint', 'Compensation', 'Chargeback']);
const paymentRiskBlockedClaims = ['不得承诺支付成功', '不得承诺退款到账', '不得承诺赔付结果'];

function defaultSystemPrompt(scenario: string) {
  return `You are an AI customer service copilot for the ${scenario} scenario. Use only the bound knowledge collections, cite policy evidence when required, and never make commitments outside the active scenario strategy.`;
}

function knowledgeBindingsForScenario(scenario: string): ScenarioModelConfig['knowledgeBindings'] {
  const map: Record<string, ScenarioModelConfig['knowledgeBindings']> = {
    Shipping: [{ knowledgeBaseId: 'KB-OPS', enabled: true, collectionIds: ['KBC-OPS-LOGISTICS', 'KBC-OPS-DELIVERY-SLA', 'KBC-OPS-ORDER-TRACKING'] }],
    Refund: [{ knowledgeBaseId: 'KB-AFTERSALES', enabled: true, collectionIds: ['KBC-AFTERSALES-REFUND', 'KBC-AFTERSALES-RETURN', 'KBC-AFTERSALES-PAYMENT-COMPENSATION'] }],
    Payment: [{ knowledgeBaseId: 'KB-AFTERSALES', enabled: true, collectionIds: ['KBC-AFTERSALES-PAYMENT-COMPENSATION'] }],
    'Product Inquiry': [{ knowledgeBaseId: 'KB-PROD', enabled: true, collectionIds: ['KBC-PROD-FAQ', 'KBC-PROD-SERVICE-POLICY'] }],
    Complaint: [{ knowledgeBaseId: 'KB-ESC', enabled: true, collectionIds: ['KBC-ESC-COMPLAINT', 'KBC-ESC-ESCALATION', 'KBC-ESC-HIGH-RISK-SCRIPT'] }],
    Compensation: [{ knowledgeBaseId: 'KB-ESC', enabled: true, collectionIds: ['KBC-ESC-ESCALATION', 'KBC-ESC-HIGH-RISK-SCRIPT'] }],
    Chargeback: [{ knowledgeBaseId: 'KB-ESC', enabled: true, collectionIds: ['KBC-ESC-ESCALATION', 'KBC-ESC-HIGH-RISK-SCRIPT'] }],
  };
  return map[scenario] ?? [];
}

function nodeOverridesForScenario(scenario: string): ScenarioModelConfig['nodeOverrides'] {
  const highRisk = highRiskScenarioSet.has(scenario);
  return standardScenarioNodeOrder.map((nodeId, index) => {
    const alwaysOn = ['intent-classification', 'knowledge-retrieval', 'reply-drafting', 'feedback-capture'].includes(nodeId);
    const highRiskOnly = ['policy-check', 'risk-detection', 'human-review-routing'].includes(nodeId);
    const enabled = alwaysOn || (highRiskOnly && highRisk) || ['customer-matching', 'order-linking', 'conversation-summary'].includes(nodeId);
    return {
      nodeId,
      enabled,
      order: index + 1,
      overrideMode: highRiskOnly && highRisk ? 'override' as const : 'inherit' as const,
      ...(highRiskOnly && highRisk ? { humanConfirmationRequired: true } : {}),
    };
  });
}

function enrichScenarioConfig(config: ScenarioModelConfigSeed): ScenarioModelConfig {
  const highRisk = highRiskScenarioSet.has(config.scenario);
  return {
    ...config,
    status: 'active',
    outputMode: highRisk || config.scenario === 'Payment' ? 'draft_reply' : config.scenario === 'Product Inquiry' ? 'low_risk_auto_reply' : 'agent_suggestion',
    knowledgeBindings: knowledgeBindingsForScenario(config.scenario),
    evaluationSetIds: [`EVAL-${config.scenario.toUpperCase().replace(/\s+/g, '-')}`],
    safetyRuleIds: highRisk ? ['SAFE-HIGH-RISK', 'SAFE-MANUAL-REVIEW'] : ['SAFE-CITATION', 'SAFE-NO-AUTOSEND'],
    nodeOverrides: nodeOverridesForScenario(config.scenario),
    blockedClaims: config.scenario === 'Payment' ? [...new Set([...config.blockedClaims, ...paymentRiskBlockedClaims])] : config.blockedClaims,
    systemPrompt: config.systemPrompt ?? defaultSystemPrompt(config.scenario),
  };
}

const scenarioModelConfigSeeds: ScenarioModelConfigSeed[] = [
  { id: 'SCN-001', scenario: 'Shipping', name: '物流标准回复策略', version: 'v2.3', primaryModel: 'gpt-4o-mini', fallbackModel: 'gpt-4.1-mini', modelChannel: '稳定版', temperature: 0.2, maxOutputTokens: 320, contextWindow: 16000, queryRewriteEnabled: true, rerankerEnabled: true, topK: 5, similarityThreshold: 0.78, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: false, humanSendAllowed: true, blockedClaims: ['不得编造预计送达日期', '不得承诺赔偿'], lowConfidenceFallback: '转人工补写', noMatchFallback: '转人工编写回复', sensitiveCaseFallback: '升级物流主管复核', updatedAt: '2026-05-22 13:40', systemPrompt: 'You are a cross-border e-commerce customer service agent for an independent online store. Your primary role is to assist customers with logistics, order tracking, delivery delays, and shipping-related inquiries.\n\nRules:\n- Always reference the specific order ID and tracking information when available.\n- Do NOT fabricate estimated delivery dates or promise compensation without policy support.\n- If tracking has not updated for more than 5 business days, escalate to the logistics team.\n- Use a helpful, professional tone. Acknowledge the customer\'s frustration before offering solutions.\n- Cite retrieved knowledge documents to support your advice.' },
  { id: 'SCN-002', scenario: 'Refund', name: '退款复核策略', version: 'v3.1', primaryModel: 'gpt-4.1-mini', fallbackModel: 'gpt-4o-mini', modelChannel: '稳定版', temperature: 0.1, maxOutputTokens: 260, contextWindow: 12000, queryRewriteEnabled: true, rerankerEnabled: true, topK: 6, similarityThreshold: 0.8, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: true, humanSendAllowed: false, blockedClaims: ['不得批准退款', '不得承诺到账时间'], lowConfidenceFallback: '进入人工复核', noMatchFallback: '要求补充证据后转人工', sensitiveCaseFallback: '升级主管审批', updatedAt: '2026-05-22 13:40' },
  { id: 'SCN-003', scenario: 'Product Inquiry', name: '商品咨询转化策略', version: 'v1.8', primaryModel: 'gpt-4o-mini', fallbackModel: 'gpt-4.1-mini', modelChannel: '稳定版', temperature: 0.35, maxOutputTokens: 360, contextWindow: 14000, queryRewriteEnabled: true, rerankerEnabled: true, topK: 4, similarityThreshold: 0.74, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: false, humanSendAllowed: true, blockedClaims: ['不得编造商品规格'], lowConfidenceFallback: '转人工核验规格', noMatchFallback: '回退到商品模板', sensitiveCaseFallback: '升级商品团队确认', updatedAt: '2026-05-22 13:40' },
  { id: 'SCN-004', scenario: 'Payment', name: '支付恢复策略', version: 'v2.0', primaryModel: 'gpt-4o-mini', fallbackModel: 'gpt-4.1-mini', modelChannel: '稳定版', temperature: 0.2, maxOutputTokens: 280, contextWindow: 12000, queryRewriteEnabled: true, rerankerEnabled: false, topK: 4, similarityThreshold: 0.76, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: false, humanSendAllowed: true, blockedClaims: ['不得伪造支付结果'], lowConfidenceFallback: '转人工排查支付渠道', noMatchFallback: '回退到支付 FAQ', sensitiveCaseFallback: '升级支付运营', updatedAt: '2026-05-22 13:40' },
  { id: 'SCN-005', scenario: 'Complaint', name: '投诉升级策略', version: 'v3.4', primaryModel: 'gpt-4.1-mini', fallbackModel: 'gpt-4o-mini', modelChannel: '稳定版', temperature: 0.15, maxOutputTokens: 260, contextWindow: 18000, queryRewriteEnabled: true, rerankerEnabled: true, topK: 6, similarityThreshold: 0.82, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: true, humanSendAllowed: false, blockedClaims: ['不得关闭投诉', '不得承诺赔偿'], lowConfidenceFallback: '进入人工复核', noMatchFallback: '升级投诉主管', sensitiveCaseFallback: '升级法务与主管复核', updatedAt: '2026-05-22 13:40', systemPrompt: 'You are a senior customer service escalation specialist. Your role is to handle escalated complaints with empathy, precision, and strict adherence to company policy.\n\nRules:\n- NEVER close a complaint without supervisor approval.\n- NEVER promise compensation unless explicitly authorized by the compensation policy.\n- Always acknowledge the customer\'s frustration and validate their experience before offering solutions.\n- Escalate to legal or supervisor review for any complaint involving potential liability, chargebacks, or regulatory concerns.\n- Document every action taken and the rationale behind it for audit purposes.' },
  { id: 'SCN-006', scenario: 'Compensation', name: '赔偿高敏策略', version: 'v2.5', primaryModel: 'gpt-4.1-mini', fallbackModel: 'gpt-4o-mini', modelChannel: '稳定版', temperature: 0.1, maxOutputTokens: 220, contextWindow: 12000, queryRewriteEnabled: true, rerankerEnabled: true, topK: 6, similarityThreshold: 0.83, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: true, humanSendAllowed: false, blockedClaims: ['不得承诺赔偿金额', '不得绕过主管审批'], lowConfidenceFallback: '升级主管审批', noMatchFallback: '转人工赔偿评估', sensitiveCaseFallback: '升级法务复核', updatedAt: '2026-05-22 13:40' },
  { id: 'SCN-007', scenario: 'Chargeback', name: '拒付争议策略', version: 'v1.9', primaryModel: 'gpt-4.1-mini', fallbackModel: 'gpt-4o-mini', modelChannel: '稳定版', temperature: 0.1, maxOutputTokens: 220, contextWindow: 12000, queryRewriteEnabled: true, rerankerEnabled: true, topK: 6, similarityThreshold: 0.84, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: true, humanSendAllowed: false, blockedClaims: ['不得承认拒付责任', '不得承诺退款'], lowConfidenceFallback: '升级拒付专员', noMatchFallback: '转人工争议处理', sensitiveCaseFallback: '升级法务复核', updatedAt: '2026-05-22 13:40' },
];

export const scenarioModelConfigs: ScenarioModelConfig[] = scenarioModelConfigSeeds.map(enrichScenarioConfig);

type PipelineNodeConfigSeed = Omit<
  PipelineNodeModelConfig,
  | 'nodeName'
  | 'nodeType'
  | 'stage'
  | 'executionMode'
  | 'defaultModel'
  | 'inputFields'
  | 'retryTimes'
  | 'failureStrategy'
  | 'defaultScenarioTypes'
  | 'dependsOn'
  | 'requiredWhen'
  | 'usesKnowledgeBase'
  | 'knowledgeScopeMode'
  | 'requireCitation'
  | 'overridableFields'
  | 'enabledByDefault'
  | 'lockedWhen'
>;

const pipelineNodeMetadata: Record<string, Omit<PipelineNodeModelConfig,
  | 'id'
  | 'nodeId'
  | 'name'
  | 'primaryModel'
  | 'fallbackModel'
  | 'inputSource'
  | 'outputSchema'
  | 'timeoutMs'
  | 'retryCount'
  | 'fallbackStrategy'
  | 'citationRequired'
  | 'humanConfirmationRequired'
  | 'allowedScenarios'
  | 'inheritFromScenario'
  | 'enabled'
  | 'updatedAt'
>> = {
  'intent-classification': {
    nodeName: '意图识别',
    nodeType: 'classification',
    stage: 'pre_process',
    executionMode: 'llm',
    defaultModel: 'gpt-4o-mini',
    inputFields: ['customer_message', 'conversation_summary'],
    retryTimes: 1,
    failureStrategy: '回退到通用咨询分类',
    defaultScenarioTypes: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint', 'Compensation', 'Chargeback'],
    dependsOn: [],
    requiredWhen: ['active'],
    usesKnowledgeBase: false,
    knowledgeScopeMode: 'none',
    requireCitation: false,
    overridableFields: ['model', 'fallbackModel', 'timeoutMs', 'retryTimes', 'failureStrategy'],
    enabledByDefault: true,
    lockedWhen: ['active'],
  },
  'customer-matching': {
    nodeName: '客户匹配',
    nodeType: 'matching',
    stage: 'context_enrichment',
    executionMode: 'deterministic',
    defaultModel: undefined,
    inputFields: ['email', 'order_id', 'customer_name'],
    retryTimes: 0,
    failureStrategy: '创建待确认线索',
    defaultScenarioTypes: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'],
    dependsOn: [],
    requiredWhen: ['optional'],
    usesKnowledgeBase: false,
    knowledgeScopeMode: 'none',
    requireCitation: false,
    overridableFields: ['failureStrategy', 'timeoutMs', 'retryTimes'],
    enabledByDefault: true,
    lockedWhen: [],
  },
  'order-linking': {
    nodeName: '订单关联',
    nodeType: 'lookup',
    stage: 'context_enrichment',
    executionMode: 'deterministic',
    defaultModel: undefined,
    inputFields: ['customer_id', 'order_id'],
    retryTimes: 0,
    failureStrategy: '要求客服补录订单号',
    defaultScenarioTypes: ['Shipping', 'Refund', 'Payment', 'Complaint'],
    dependsOn: ['customer-matching'],
    requiredWhen: ['shipping_refund_payment_recommended'],
    usesKnowledgeBase: false,
    knowledgeScopeMode: 'none',
    requireCitation: false,
    overridableFields: ['failureStrategy', 'timeoutMs', 'retryTimes'],
    enabledByDefault: true,
    lockedWhen: [],
  },
  'conversation-summary': {
    nodeName: '会话摘要',
    nodeType: 'summary',
    stage: 'context_enrichment',
    executionMode: 'llm',
    defaultModel: 'gpt-4o-mini',
    inputFields: ['conversation_history', 'customer_context'],
    retryTimes: 1,
    failureStrategy: '仅保留最近三条消息',
    defaultScenarioTypes: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'],
    dependsOn: [],
    requiredWhen: ['optional'],
    usesKnowledgeBase: false,
    knowledgeScopeMode: 'none',
    requireCitation: false,
    overridableFields: ['model', 'fallbackModel', 'timeoutMs', 'retryTimes', 'failureStrategy'],
    enabledByDefault: true,
    lockedWhen: [],
  },
  'knowledge-retrieval': {
    nodeName: '知识检索',
    nodeType: 'retrieval',
    stage: 'knowledge_grounding',
    executionMode: 'hybrid',
    defaultModel: undefined,
    inputFields: ['customer_question', 'customer_profile', 'order_context'],
    retryTimes: 1,
    failureStrategy: '触发无命中回退策略',
    defaultScenarioTypes: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint', 'Compensation', 'Chargeback'],
    dependsOn: ['intent-classification'],
    requiredWhen: ['active'],
    usesKnowledgeBase: true,
    knowledgeScopeMode: 'strategy_bound',
    requireCitation: true,
    overridableFields: ['topK', 'similarityThreshold', 'queryRewriteEnabled', 'rerankerEnabled', 'requireCitation', 'knowledgeCollectionScope', 'timeoutMs', 'retryTimes', 'failureStrategy'],
    enabledByDefault: true,
    lockedWhen: ['active'],
  },
  'policy-check': {
    nodeName: '政策检查',
    nodeType: 'policy_check',
    stage: 'decision_check',
    executionMode: 'llm',
    defaultModel: 'gpt-4.1-mini',
    inputFields: ['retrieved_chunks', 'business_rules'],
    retryTimes: 1,
    failureStrategy: '采用最保守政策口径',
    defaultScenarioTypes: ['Refund', 'Complaint', 'Compensation', 'Chargeback'],
    dependsOn: ['knowledge-retrieval'],
    requiredWhen: ['sensitive_scenario'],
    usesKnowledgeBase: true,
    knowledgeScopeMode: 'strategy_bound',
    requireCitation: true,
    overridableFields: ['model', 'fallbackModel', 'requireCitation', 'humanConfirmationRequired', 'forbiddenClaims', 'failureStrategy', 'timeoutMs'],
    enabledByDefault: true,
    lockedWhen: ['sensitive_scenario'],
  },
  'reply-drafting': {
    nodeName: '回复草稿生成',
    nodeType: 'generation',
    stage: 'response_generation',
    executionMode: 'llm',
    defaultModel: 'gpt-4o-mini',
    inputFields: ['prompt_context'],
    retryTimes: 1,
    failureStrategy: '回退到模板草稿',
    defaultScenarioTypes: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'],
    dependsOn: ['knowledge-retrieval'],
    requiredWhen: ['active'],
    usesKnowledgeBase: true,
    knowledgeScopeMode: 'retrieved_context',
    requireCitation: true,
    overridableFields: ['model', 'fallbackModel', 'promptFragment', 'tone', 'outputSchema', 'requireCitation', 'timeoutMs'],
    enabledByDefault: true,
    lockedWhen: ['active'],
  },
  'risk-detection': {
    nodeName: '风险识别',
    nodeType: 'risk_check',
    stage: 'decision_check',
    executionMode: 'hybrid',
    defaultModel: 'gpt-4.1-mini',
    inputFields: ['draft_reply', 'scenario', 'risk_tags'],
    retryTimes: 1,
    failureStrategy: '全部高敏场景转人工',
    defaultScenarioTypes: ['Refund', 'Complaint', 'Compensation', 'Chargeback'],
    dependsOn: ['policy-check', 'reply-drafting'],
    requiredWhen: ['sensitive_scenario'],
    usesKnowledgeBase: false,
    knowledgeScopeMode: 'optional_context',
    requireCitation: false,
    overridableFields: ['model', 'fallbackModel', 'riskThreshold', 'humanConfirmationRequired', 'failureStrategy'],
    enabledByDefault: true,
    lockedWhen: ['sensitive_scenario'],
  },
  'human-review-routing': {
    nodeName: '人工复核路由',
    nodeType: 'routing',
    stage: 'review_routing',
    executionMode: 'deterministic',
    defaultModel: undefined,
    inputFields: ['risk_result', 'confidence', 'scenario_strategy'],
    retryTimes: 0,
    failureStrategy: '不确定时一律复核',
    defaultScenarioTypes: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint', 'Compensation', 'Chargeback'],
    dependsOn: ['risk-detection'],
    requiredWhen: ['sensitive_scenario', 'manual_review_required'],
    usesKnowledgeBase: false,
    knowledgeScopeMode: 'none',
    requireCitation: false,
    overridableFields: ['routeRules', 'humanConfirmationRequired', 'failureStrategy'],
    enabledByDefault: true,
    lockedWhen: ['sensitive_scenario', 'manual_review_required'],
  },
  'followup-task': {
    nodeName: '跟进任务创建',
    nodeType: 'task',
    stage: 'post_process',
    executionMode: 'deterministic',
    defaultModel: undefined,
    inputFields: ['processing_result', 'sla'],
    retryTimes: 0,
    failureStrategy: '由客服手动创建任务',
    defaultScenarioTypes: ['Shipping', 'Refund', 'Complaint'],
    dependsOn: ['human-review-routing'],
    requiredWhen: ['optional'],
    usesKnowledgeBase: false,
    knowledgeScopeMode: 'none',
    requireCitation: false,
    overridableFields: ['failureStrategy', 'timeoutMs', 'retryTimes'],
    enabledByDefault: true,
    lockedWhen: [],
  },
  'feedback-capture': {
    nodeName: '反馈采集',
    nodeType: 'feedback',
    stage: 'post_process',
    executionMode: 'deterministic',
    defaultModel: 'gpt-4o-mini',
    inputFields: ['agent_edit', 'send_action', 'reject_action'],
    retryTimes: 0,
    failureStrategy: '仅记录审计日志',
    defaultScenarioTypes: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'],
    dependsOn: [],
    requiredWhen: ['optional'],
    usesKnowledgeBase: false,
    knowledgeScopeMode: 'none',
    requireCitation: false,
    overridableFields: ['failureStrategy', 'timeoutMs', 'retryTimes'],
    enabledByDefault: true,
    lockedWhen: [],
  },
};

function enrichPipelineNodeConfig(config: PipelineNodeConfigSeed): PipelineNodeModelConfig {
  const metadata = pipelineNodeMetadata[config.nodeId];
  return {
    ...config,
    ...metadata,
    defaultModel: metadata.defaultModel ?? config.primaryModel,
    retryTimes: config.retryCount,
    failureStrategy: config.fallbackStrategy,
    defaultScenarioTypes: config.allowedScenarios,
    requireCitation: config.citationRequired,
    enabledByDefault: config.enabled,
  };
}

const pipelineNodeConfigSeeds: PipelineNodeConfigSeed[] = [
  { id: 'NODE-001', nodeId: 'intent-classification', name: '意图识别配置', primaryModel: 'gpt-4o-mini', fallbackModel: 'gpt-4.1-mini', inputSource: '客户最新消息 + 历史摘要', outputSchema: 'intent, confidence, risk_signals', timeoutMs: 2500, retryCount: 1, fallbackStrategy: '回退到通用咨询分类', citationRequired: false, humanConfirmationRequired: false, allowedScenarios: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint', 'Compensation', 'Chargeback'], inheritFromScenario: false, enabled: true, updatedAt: '2026-05-22 13:40' },
  { id: 'NODE-002', nodeId: 'customer-matching', name: '客户匹配配置', primaryModel: undefined, fallbackModel: undefined, inputSource: '邮箱 / 订单号 / 姓名', outputSchema: 'customer_profile', timeoutMs: 0, retryCount: 0, fallbackStrategy: '创建待确认线索', citationRequired: false, humanConfirmationRequired: false, allowedScenarios: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'], inheritFromScenario: true, enabled: true, updatedAt: '2026-05-22 13:40' },
  { id: 'NODE-003', nodeId: 'order-linking', name: '订单关联配置', primaryModel: undefined, fallbackModel: undefined, inputSource: '客户 ID + 订单号', outputSchema: 'order_context', timeoutMs: 0, retryCount: 0, fallbackStrategy: '要求客服补录订单号', citationRequired: false, humanConfirmationRequired: false, allowedScenarios: ['Shipping', 'Refund', 'Payment', 'Complaint'], inheritFromScenario: true, enabled: true, updatedAt: '2026-05-22 13:40' },
  { id: 'NODE-004', nodeId: 'conversation-summary', name: '会话摘要配置', primaryModel: 'gpt-4o-mini', fallbackModel: 'gpt-4.1-mini', inputSource: '完整对话 + 客户上下文', outputSchema: 'conversation_summary', timeoutMs: 3000, retryCount: 1, fallbackStrategy: '仅保留最近三条消息', citationRequired: false, humanConfirmationRequired: false, allowedScenarios: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'], inheritFromScenario: false, enabled: true, updatedAt: '2026-05-22 13:40' },
  { id: 'NODE-005', nodeId: 'knowledge-retrieval', name: '知识检索配置', primaryModel: undefined, fallbackModel: undefined, inputSource: '问题 + 客户画像 + 订单上下文', outputSchema: 'retrieved_chunks[]', timeoutMs: 1800, retryCount: 1, fallbackStrategy: '触发无命中回退策略', citationRequired: true, humanConfirmationRequired: false, allowedScenarios: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint', 'Compensation', 'Chargeback'], inheritFromScenario: true, enabled: true, updatedAt: '2026-05-22 13:40' },
  { id: 'NODE-006', nodeId: 'policy-check', name: '政策检查配置', primaryModel: 'gpt-4.1-mini', fallbackModel: 'gpt-4o-mini', inputSource: '知识片段 + 业务规则', outputSchema: 'policy_decision, blocked_claims', timeoutMs: 3200, retryCount: 1, fallbackStrategy: '采用最保守政策口径', citationRequired: true, humanConfirmationRequired: true, allowedScenarios: ['Refund', 'Complaint', 'Compensation', 'Chargeback'], inheritFromScenario: false, enabled: true, updatedAt: '2026-05-22 13:40' },
  { id: 'NODE-007', nodeId: 'reply-drafting', name: '回复草稿配置', primaryModel: 'gpt-4o-mini', fallbackModel: 'gpt-4.1-mini', inputSource: 'Prompt 组装上下文', outputSchema: 'editable_reply_draft', timeoutMs: 4200, retryCount: 1, fallbackStrategy: '回退到模板草稿', citationRequired: true, humanConfirmationRequired: false, allowedScenarios: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'], inheritFromScenario: false, enabled: true, updatedAt: '2026-05-22 13:40' },
  { id: 'NODE-008', nodeId: 'risk-detection', name: '风险识别配置', primaryModel: 'gpt-4.1-mini', fallbackModel: 'gpt-4o-mini', inputSource: '草稿 + 场景 + 风险标签', outputSchema: 'risk_level, review_required', timeoutMs: 2200, retryCount: 1, fallbackStrategy: '全部高敏场景转人工', citationRequired: false, humanConfirmationRequired: true, allowedScenarios: ['Refund', 'Complaint', 'Compensation', 'Chargeback'], inheritFromScenario: false, enabled: true, updatedAt: '2026-05-22 13:40' },
  { id: 'NODE-009', nodeId: 'human-review-routing', name: '人工复核路由配置', primaryModel: undefined, fallbackModel: undefined, inputSource: '风险结果 + 置信度 + 场景策略', outputSchema: 'route_decision', timeoutMs: 0, retryCount: 0, fallbackStrategy: '不确定时一律复核', citationRequired: false, humanConfirmationRequired: true, allowedScenarios: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint', 'Compensation', 'Chargeback'], inheritFromScenario: true, enabled: true, updatedAt: '2026-05-22 13:40' },
  { id: 'NODE-010', nodeId: 'followup-task', name: '跟进任务配置', primaryModel: undefined, fallbackModel: undefined, inputSource: '处理结果 + SLA', outputSchema: 'followup_task', timeoutMs: 0, retryCount: 0, fallbackStrategy: '由客服手动创建任务', citationRequired: false, humanConfirmationRequired: false, allowedScenarios: ['Shipping', 'Refund', 'Complaint'], inheritFromScenario: true, enabled: true, updatedAt: '2026-05-22 13:40' },
  { id: 'NODE-011', nodeId: 'feedback-capture', name: '反馈采集配置', primaryModel: 'gpt-4o-mini', fallbackModel: undefined, inputSource: '客服编辑 / 发送 / 驳回行为', outputSchema: 'feedback_signal', timeoutMs: 1800, retryCount: 0, fallbackStrategy: '仅记录审计日志', citationRequired: false, humanConfirmationRequired: false, allowedScenarios: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'], inheritFromScenario: false, enabled: true, updatedAt: '2026-05-22 13:40' },
];

export const pipelineNodeConfigs: PipelineNodeModelConfig[] = pipelineNodeConfigSeeds.map(enrichPipelineNodeConfig);

export const modelRoutingSummary: ModelRoutingSummary = {
  defaultModel: aiEnvironment.defaultModel,
  embeddingModel: aiEnvironment.embeddingModel,
  rerankerModel: aiEnvironment.rerankerModel,
  defaultScenarioConfigId: 'SCN-001',
  activeScenarioCount: scenarioModelConfigs.length,
  fallbackEnabledScenarioCount: scenarioModelConfigs.filter(item => item.fallbackModel).length,
  manualReviewScenarioCount: scenarioModelConfigs.filter(item => item.manualReviewRequired).length,
  summary: '场景配置定义默认模型与护栏边界，节点配置按需覆盖具体子任务模型与回退策略。',
};

export function getScenarioModelConfig(scenario: string) {
  return scenarioModelConfigs.find(item => item.scenario === scenario)
    ?? scenarioModelConfigs.find(item => item.scenario === 'Shipping')
    ?? scenarioModelConfigs[0];
}

export function buildSendGuardrailResult(scenario: string): SendGuardrailResult {
  const config = getScenarioModelConfig(scenario);
  return {
    blocked: config.manualReviewRequired,
    manualReviewRequired: config.manualReviewRequired,
    reason: config.manualReviewRequired ? '当前场景必须先完成人工复核，之后才能由人工发送。' : '当前场景允许人工发送，AI 仍不可自动发送。',
    scenario,
    aiPermission: 'suggest_only',
    autoSend: 'disabled',
  };
}

export function buildDraftSourceTrace(ticket: ServiceTicket): DraftSourceTrace {
  const scenario = ticket.issueType === 'Shipping Delay' ? 'Shipping'
    : ticket.issueType === 'Refund Request' ? 'Refund'
    : ticket.issueType === 'Product Inquiry' ? 'Product Inquiry'
    : ticket.issueType === 'Payment Failed' ? 'Payment'
    : ticket.issueType === 'Complaint' ? 'Complaint'
    : ticket.issueType === 'Return Request' ? 'Refund'
    : 'Shipping';
  const scenarioConfig = getScenarioModelConfig(scenario);
  const nodeModels = ['intent-classification', 'conversation-summary', 'knowledge-retrieval', 'policy-check', 'reply-drafting', 'risk-detection']
    .map(nodeId => pipelineNodeConfigs.find(item => item.nodeId === nodeId))
    .filter((item): item is PipelineNodeModelConfig => Boolean(item))
    .map(item => `${item.name}：${item.primaryModel ?? '继承场景默认'}`);

  return {
    scenario,
    scenarioConfigId: scenarioConfig.id,
    scenarioConfigName: scenarioConfig.name,
    scenarioConfigVersion: scenarioConfig.version,
    draftingModel: pipelineNodeConfigs.find(item => item.nodeId === 'reply-drafting')?.primaryModel ?? scenarioConfig.primaryModel,
    retrievalSummary: `Top K ${scenarioConfig.topK} / 阈值 ${scenarioConfig.similarityThreshold} / ${scenarioConfig.rerankerEnabled ? '启用重排序' : '关闭重排序'}`,
    citationRequired: scenarioConfig.citationRequired,
    manualReviewRequired: scenarioConfig.manualReviewRequired,
    guardrailResult: scenarioConfig.manualReviewRequired ? '需要人工复核' : '允许人工发送',
    nodeModels,
  };
}

export function buildPromptPreviewFromRun(input: {
  customerName: string;
  scenario: string;
  question: string;
  orderId: string;
  candidateSources: string[];
}): PromptPreviewSnapshot {
  return {
    systemRole: '你是跨境电商独立站客服 Copilot，只能提供可编辑建议，不能直接发送消息或做出审批决定。',
    customerContext: `客户：${input.customerName}；场景：${displayScenario(input.scenario)}；问题：${input.question}`,
    orderContext: `关联订单：${input.orderId}；需要结合订单履约、支付状态和物流事件进行判断。`,
    conversationSummary: `客户围绕${displayScenario(input.scenario)}提出问题，系统需要先检索知识，再生成可编辑草稿。`,
    retrievedKnowledge: input.candidateSources,
    businessRules: ['必须引用知识来源。', '高风险场景不得越权承诺退款、赔偿或关闭投诉。'],
    riskPolicy: ['退款、赔偿、投诉、拒付场景必须人工复核。', '物流与商品咨询场景可生成建议，但仍不可自动发送。'],
    blockedClaims: ['不得批准退款。', '不得承诺赔偿。', '不得编造物流时效。', '不得关闭投诉。'],
    outputFormat: '可编辑回复草稿',
  };
}

export function buildGuardrailCheck(scenario: string, citations: number): GuardrailCheckResult {
  const manualReviewRequired = ['Refund', 'Complaint', 'Compensation', 'Chargeback'].includes(scenario);
  const riskLevel: GuardrailCheckResult['riskLevel'] = manualReviewRequired ? 'High' : scenario === 'Shipping' ? 'Medium' : 'Low';
  return {
    autoSend: 'disabled',
    aiPermission: 'suggest_only',
    confidence: manualReviewRequired ? 72 : 88,
    citationCoverage: Math.min(98, 72 + citations * 9),
    riskLevel,
    manualReviewRequired,
    result: manualReviewRequired ? 'review_required' : 'passed',
    notes: manualReviewRequired
      ? ['命中高敏场景，必须进入人工复核。', 'AI 仅可生成建议，禁止自动发送。']
      : ['当前场景允许生成建议草稿。', '仍需保留引用与禁止声明。'],
  };
}

export function buildInitialRagTestRuns(customers: CustomerProfile[], orders: Order[], knowledgeDocuments: KnowledgeDocument[]): RagTestRun[] {
  const customer = customers[0];
  const order = orders.find(item => item.customerId === customer.id) ?? orders[0];
  const chunks: RetrievalCandidate[] = [
    {
      id: 'LAB-CHK-001',
      source: knowledgeDocuments.find(item => item.scenario === 'Shipping')?.name ?? '物流手册 v1.0.EN.pdf',
      chunkId: 'CHK-001',
      score: 0.92,
      rerankScore: 0.95,
      selected: true,
      metadata: { language: 'EN', scenario: 'Shipping', country: customer.country, policy_version: 'v2.1', customer_type: customer.type },
      snippet: '若物流轨迹连续 5 个工作日未更新，应先发起物流商调查，并在 24 小时内向客户同步状态。',
      rejectReason: undefined,
    },
    {
      id: 'LAB-CHK-002',
      source: '物流追踪 FAQ v1.4.EN.pdf',
      chunkId: 'CHK-002',
      score: 0.86,
      rerankScore: 0.84,
      selected: true,
      metadata: { language: 'EN', scenario: 'Shipping', country: customer.country, policy_version: 'v1.4', customer_type: customer.type },
      snippet: '客户问“为什么轨迹没有更新”时，应说明包裹可能仍在运输途中，不得编造新的送达日期。',
      rejectReason: undefined,
    },
    {
      id: 'LAB-CHK-003',
      source: '丢件处理规则 v1.5.EN.pdf',
      chunkId: 'CHK-003',
      score: 0.78,
      rerankScore: 0.76,
      selected: false,
      metadata: { language: 'EN', scenario: 'Shipping', country: customer.country, policy_version: 'v1.5', customer_type: customer.type },
      snippet: '若超出预计送达日 7 天仍无更新，可发起丢件申诉，退款仍需主管审批。',
      rejectReason: '当前问题更匹配物流延迟而非丢件场景，因此降权。',
    },
  ];
  const promptPreview = buildPromptPreviewFromRun({
    customerName: customer.name,
    scenario: 'Shipping',
    question: 'Where is my order? Tracking has not updated.',
    orderId: order.id,
    candidateSources: chunks.filter(item => item.selected).map(item => item.source),
  });
  const guardrailCheck = buildGuardrailCheck('Shipping', chunks.filter(item => item.selected).length);

  return [
    {
      id: 'LAB-001',
      customerQuestion: 'Where is my order? Tracking has not updated.',
      customerId: customer.id,
      customerName: customer.name,
      scenario: 'Shipping',
      language: 'EN',
      relatedOrderId: order.id,
      retrievedChunks: chunks,
      promptPreview,
      aiDraftReply: `您好，已为您检查订单 ${order.id} 的物流状态。当前轨迹显示包裹仍在运输途中，但最近一次承运商更新已经延迟。我们已建议客服发起承运商调查，并会在 24 小时内向客户同步下一次更新。`,
      guardrailCheck,
      createdAt: '2026-05-22 13:20',
    },
  ];
}
