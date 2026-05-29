import type {
  AIOpsStage,
  AIEnvironmentConfig,
  ActivityLogItem,
  AICapability,
  Agent,
  AnalyticsData,
  AuditLogRecord,
  BusinessRule,
  CapabilityPipelineNode,
  CustomerProfile,
  DraftSourceTrace,
  EvaluationRecord,
  FeedbackLoopRecord,
  FAQ,
  FunctionalModelStatus,
  FollowUpTask,
  GuardrailCheckResult,
  IngestionDocumentRecord,
  IngestionJob,
  IssueType,
  KnowledgeChunk,
  KnowledgeDocument,
  Message,
  Order,
  PromptPreviewSnapshot,
  PermissionBoundary,
  PipelineNodeModelConfig,
  PolicyDoc,
  Priority,
  RagRun,
  RagConfigSnapshot,
  RagTestRun,
  RetrievalCandidate,
  ReplyDraft,
  ReplyTemplate,
  ReviewDecision,
  ReviewStatus,
  ScenarioModelConfig,
  ScenarioModelStatus,
  SendGuardrailResult,
  ServiceHealthCheckResult,
  ServiceHealthDiagnostic,
  ServiceHealthError,
  ServiceHealthSnapshot,
  ServiceHealthStatus,
  ServiceHubSnapshot,
  ServiceTicket,
  SettingsPermissionSnapshot,
  SettingsOperationLogSnapshot,
  TeamRolePermissionProfile,
  TicketAction,
  TicketChannel,
  TicketStatus,
  TicketWorkflowStage,
  ModelRoutingSummary,
  SettingsData,
} from '../../types';
import { displayIssueType, displayLanguage, displayRiskLevel, displayRuntimeStatus, displayScenario, displayWorkflow } from '../../utils/display';

const people = [
  ['史约翰', '美国', '英语', 'EN', '美区'],
  ['卡特琳', '英国', '英语', 'EN', '英区'],
  ['布朗德', '德国', '德语', 'DE', '欧区'],
  ['苏菲亚', '法国', '法语', 'FR', '欧区'],
  ['陈语安', '中国台湾', '中文', 'ZH', '亚太区'],
  ['田中美亚', '日本', '日语', 'JA', '亚太区'],
  ['马丁卢卡', '加拿大', '英语', 'EN', '北美区'],
  ['加西亚', '西班牙', '西班牙语', 'ES', '欧区'],
  ['金诺亚', '韩国', '韩语', 'KO', '亚太区'],
  ['利亚姆', '澳大利亚', '英语', 'EN', '亚太区'],
];

const issueTemplates: Array<{
  issueType: IssueType;
  intent: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  workflowStage: TicketWorkflowStage;
  status: TicketStatus;
  priority: Priority;
  segment: string;
  riskFlags: string[];
  policyDecision: string;
  requiredAction: string;
  summary: string;
  regionStrategy: string;
  publishGap?: string | null;
}> = [
  {
    issueType: 'Shipping Delay',
    intent: '物流延迟说明',
    riskLevel: 'Medium',
    workflowStage: 'review',
    status: 'In Progress',
    priority: 'High',
    segment: '留存观察',
    riskFlags: ['物流延迟'],
    policyDecision: '需要核查物流商状态，并避免任何金额承诺。',
    requiredAction: '跟进物流商并在 24 小时内回访',
    summary: '物流轨迹已多日未更新。',
    regionStrategy: '标准承诺',
    publishGap: null,
  },
  {
    issueType: 'Refund Request',
    intent: '退款资格核查',
    riskLevel: 'High',
    workflowStage: 'review',
    status: 'Pending Review',
    priority: 'Urgent',
    segment: '风险复核',
    riskFlags: ['退款风险'],
    policyDecision: '需补充证据并提交主管审批。',
    requiredAction: '主管审核证据',
    summary: '客户在签收后提出退款诉求。',
    regionStrategy: '退款护栏',
    publishGap: null,
  },
  {
    issueType: 'Complaint',
    intent: '服务补救诉求',
    riskLevel: 'High',
    workflowStage: 'execute',
    status: 'Escalated',
    priority: 'Urgent',
    segment: '升级监控',
    riskFlags: ['赔偿风险'],
    policyDecision: '因赔偿审批与本地化政策缺口，必须升级处理。',
    requiredAction: '主管决策 + 补齐知识',
    summary: '客户因物流延迟投诉并提出赔偿要求。',
    regionStrategy: '投诉补救',
    publishGap: 'localized_policy_missing',
  },
  {
    issueType: 'Payment Failed',
    intent: '支付恢复',
    riskLevel: 'Medium',
    workflowStage: 'triage',
    status: 'New',
    priority: 'High',
    segment: '结账挽回',
    riskFlags: ['支付风险'],
    policyDecision: '建议重试并提供替代支付方式。',
    requiredAction: '核验支付渠道并重新打开结账链路',
    summary: '支付失败，客户需要重试支持。',
    regionStrategy: '支付恢复',
    publishGap: null,
  },
  {
    issueType: 'Address Change',
    intent: '发货前地址修改',
    riskLevel: 'Low',
    workflowStage: 'draft',
    status: 'New',
    priority: 'Normal',
    segment: '标准服务',
    riskFlags: [],
    policyDecision: '确认地址前需检查物流商截单时间。',
    requiredAction: '核验发货阶段',
    summary: '客户在发货前申请修改地址。',
    regionStrategy: '履约控制',
    publishGap: 'expired_sop',
  },
  {
    issueType: 'VIP Support',
    intent: 'VIP 高优先服务',
    riskLevel: 'Low',
    workflowStage: 'draft',
    status: 'In Progress',
    priority: 'Normal',
    segment: 'VIP 专属服务',
    riskFlags: [],
    policyDecision: '允许升级加急服务并主动跟进。',
    requiredAction: '确认 VIP 权益与物流 SLA',
    summary: 'VIP 客户希望获得优先支持。',
    regionStrategy: 'VIP 快速通道',
    publishGap: null,
  },
  {
    issueType: 'Product Inquiry',
    intent: '售前兼容性答复',
    riskLevel: 'Low',
    workflowStage: 'draft',
    status: 'New',
    priority: 'Low',
    segment: '增长转化',
    riskFlags: [],
    policyDecision: '可直接引用规格文档进行答复。',
    requiredAction: '发送商品细节并引导下单',
    summary: '客户咨询商品兼容性问题。',
    regionStrategy: '售前转化',
    publishGap: null,
  },
  {
    issueType: 'Return Request',
    intent: '退货资格与物流',
    riskLevel: 'High',
    workflowStage: 'review',
    status: 'Pending Review',
    priority: 'High',
    segment: '品质补救',
    riskFlags: ['退货复核'],
    policyDecision: '需核验商品瑕疵证据与退货时效。',
    requiredAction: '人工审批退货',
    summary: '客户反馈商品有瑕疵并申请退货。',
    regionStrategy: '售后补救',
    publishGap: null,
  },
];

const aiEnvironment: AIEnvironmentConfig = {
  defaultModel: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
  rerankerModel: 'bge-reranker-v2-m3',
  regionStrategy: '区域优先，语言回退',
  fallbackStrategy: '置信度不足或本地化缺失时进入人工复核',
  releaseChannel: '稳定版',
  maintenanceMode: false,
  runtimeStatus: 'healthy',
};

function pad(prefix: string, value: number) {
  return `${prefix}-${String(value).padStart(3, '0')}`;
}

function isoDay(day: number, hour: number) {
  return `2026-05-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00`;
}

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

function buildCustomers(): CustomerProfile[] {
  return Array.from({ length: 42 }, (_, index) => {
    const person = people[index % people.length];
    const template = issueTemplates[index % issueTemplates.length];
    const orders = 1 + (index % 6);
    return {
      id: pad('CUST', index + 1),
      name: `${person[0]}${index >= people.length ? ` ${index + 1}` : ''}`.trim(),
      email: `customer${index + 1}@example.com`,
      country: person[1],
      language: person[2],
      preferredLanguage: person[3],
      type: orders > 4 ? 'VIP 客户' : orders > 2 ? '复购客户' : '新客户',
      totalOrders: orders,
      lifetimeValue: Number((120 + index * 23.5).toFixed(2)),
      lastContact: isoDay(10 + (index % 12), 8 + (index % 10)),
      tags: [template.segment, displayIssueType(template.issueType), person[4]],
      avatarColor: ['#6C5CE7', '#F59E0B', '#3B82F6', '#10B981', '#FF6B6B'][index % 5],
      riskFlags: template.riskFlags,
      segment: template.segment,
      owner: ['陈艾琳', '吴柏霖', '戴珂岚', '你'][index % 4],
      regionStrategy: `${person[4]} ${template.regionStrategy}`,
      complaintHistory: template.issueType === 'Complaint' ? 2 + (index % 3) : index % 2,
      refundHistory: template.issueType === 'Refund Request' || template.issueType === 'Return Request' ? 1 + (index % 2) : 0,
      promiseFulfillment: `${88 - (index % 6) * 4}%`,
      recentServiceTimeline: [
        { id: pad('EV', index * 3 + 1), type: 'ticket', title: `${displayIssueType(template.issueType)}工单已创建`, detail: template.summary, at: isoDay(12 + (index % 10), 9) },
        { id: pad('EV', index * 3 + 2), type: 'rag', title: 'RAG 运行已同步', detail: `已应用 ${person[4]} 区域过滤与 ${displayLanguage(person[3])} 语言偏好。`, at: isoDay(12 + (index % 10), 10) },
        { id: pad('EV', index * 3 + 3), type: 'followup', title: '服务跟进已排队', detail: template.requiredAction, at: isoDay(12 + (index % 10), 11) },
      ],
    };
  });
}

function buildOrders(customers: CustomerProfile[]): Order[] {
  const carriers = ['YunExpress', 'DHL', 'Royal Mail', 'SF Express', 'UPS'];
  const statuses = ['Processing', 'Shipped', 'Delivered'] as const;
  const paymentStates = ['Paid', 'Pending', 'Failed'] as const;
  const orders: Order[] = [];
  customers.forEach((customer, customerIndex) => {
    const count = 2 + (customerIndex % 3);
    for (let offset = 0; offset < count; offset += 1) {
      const orderIndex = orders.length + 1;
      const status = statuses[(customerIndex + offset) % statuses.length];
      orders.push({
        id: pad('ORD', orderIndex),
        customerId: customer.id,
        date: isoDay(1 + ((customerIndex + offset) % 20), 9 + (offset % 5)),
        total: Number((79 + customerIndex * 11 + offset * 18).toFixed(2)),
        paymentStatus: paymentStates[(customerIndex + offset) % paymentStates.length],
        fulfillmentStatus: status,
        carrier: status === 'Processing' ? '' : carriers[(customerIndex + offset) % carriers.length],
        tracking: status === 'Processing' ? '' : `TRK${customerIndex + 1}${offset + 1}${1000 + orderIndex}`,
        latestEvent: status === 'Processing' ? '仓库拣货' : status === 'Shipped' ? '运输途中' : '已送达',
        daysSinceUpdate: status === 'Delivered' ? 0 : 1 + ((customerIndex + offset) % 5),
        riskAlert: customer.riskFlags[0] && status !== 'Delivered' ? `${customer.riskFlags[0]}，需要持续关注。` : '',
        items: [
          { name: `配件组合 ${offset + 1}`, qty: 1, price: Number((39 + offset * 9).toFixed(2)) },
          { name: `主推商品 ${customerIndex % 5 + 1}`, qty: 1, price: Number((40 + customerIndex * 3.5).toFixed(2)) },
        ],
      });
    }
  });
  return orders.slice(0, 144);
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

const ragConfig: RagConfigSnapshot = {
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
  },
  updatedAt: '2026-05-22 13:40',
};

const capabilityPipeline: CapabilityPipelineNode[] = [
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

const scenarioModelConfigs: ScenarioModelConfig[] = [
  { id: 'SCN-001', scenario: 'Shipping', name: '物流标准回复策略', version: 'v2.3', primaryModel: 'gpt-4o-mini', fallbackModel: 'gpt-4.1-mini', modelChannel: '稳定版', temperature: 0.2, maxOutputTokens: 320, contextWindow: 16000, queryRewriteEnabled: true, rerankerEnabled: true, topK: 5, similarityThreshold: 0.78, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: false, humanSendAllowed: true, blockedClaims: ['不得编造预计送达日期', '不得承诺赔偿'], lowConfidenceFallback: '转人工补写', noMatchFallback: '转人工编写回复', sensitiveCaseFallback: '升级物流主管复核', updatedAt: '2026-05-22 13:40', systemPrompt: 'You are a cross-border e-commerce customer service agent for an independent online store. Your primary role is to assist customers with logistics, order tracking, delivery delays, and shipping-related inquiries.\n\nRules:\n- Always reference the specific order ID and tracking information when available.\n- Do NOT fabricate estimated delivery dates or promise compensation without policy support.\n- If tracking has not updated for more than 5 business days, escalate to the logistics team.\n- Use a helpful, professional tone. Acknowledge the customer\'s frustration before offering solutions.\n- Cite retrieved knowledge documents to support your advice.' },
  { id: 'SCN-002', scenario: 'Refund', name: '退款复核策略', version: 'v3.1', primaryModel: 'gpt-4.1-mini', fallbackModel: 'gpt-4o-mini', modelChannel: '稳定版', temperature: 0.1, maxOutputTokens: 260, contextWindow: 12000, queryRewriteEnabled: true, rerankerEnabled: true, topK: 6, similarityThreshold: 0.8, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: true, humanSendAllowed: false, blockedClaims: ['不得批准退款', '不得承诺到账时间'], lowConfidenceFallback: '进入人工复核', noMatchFallback: '要求补充证据后转人工', sensitiveCaseFallback: '升级主管审批', updatedAt: '2026-05-22 13:40' },
  { id: 'SCN-003', scenario: 'Product Inquiry', name: '商品咨询转化策略', version: 'v1.8', primaryModel: 'gpt-4o-mini', fallbackModel: 'gpt-4.1-mini', modelChannel: '稳定版', temperature: 0.35, maxOutputTokens: 360, contextWindow: 14000, queryRewriteEnabled: true, rerankerEnabled: true, topK: 4, similarityThreshold: 0.74, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: false, humanSendAllowed: true, blockedClaims: ['不得编造商品规格'], lowConfidenceFallback: '转人工核验规格', noMatchFallback: '回退到商品模板', sensitiveCaseFallback: '升级商品团队确认', updatedAt: '2026-05-22 13:40' },
  { id: 'SCN-004', scenario: 'Payment', name: '支付恢复策略', version: 'v2.0', primaryModel: 'gpt-4o-mini', fallbackModel: 'gpt-4.1-mini', modelChannel: '稳定版', temperature: 0.2, maxOutputTokens: 280, contextWindow: 12000, queryRewriteEnabled: true, rerankerEnabled: false, topK: 4, similarityThreshold: 0.76, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: false, humanSendAllowed: true, blockedClaims: ['不得伪造支付结果'], lowConfidenceFallback: '转人工排查支付渠道', noMatchFallback: '回退到支付 FAQ', sensitiveCaseFallback: '升级支付运营', updatedAt: '2026-05-22 13:40' },
  { id: 'SCN-005', scenario: 'Complaint', name: '投诉升级策略', version: 'v3.4', primaryModel: 'gpt-4.1-mini', fallbackModel: 'gpt-4o-mini', modelChannel: '稳定版', temperature: 0.15, maxOutputTokens: 260, contextWindow: 18000, queryRewriteEnabled: true, rerankerEnabled: true, topK: 6, similarityThreshold: 0.82, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: true, humanSendAllowed: false, blockedClaims: ['不得关闭投诉', '不得承诺赔偿'], lowConfidenceFallback: '进入人工复核', noMatchFallback: '升级投诉主管', sensitiveCaseFallback: '升级法务与主管复核', updatedAt: '2026-05-22 13:40', systemPrompt: 'You are a senior customer service escalation specialist. Your role is to handle escalated complaints with empathy, precision, and strict adherence to company policy.\n\nRules:\n- NEVER close a complaint without supervisor approval.\n- NEVER promise compensation unless explicitly authorized by the compensation policy.\n- Always acknowledge the customer\'s frustration and validate their experience before offering solutions.\n- Escalate to legal or supervisor review for any complaint involving potential liability, chargebacks, or regulatory concerns.\n- Document every action taken and the rationale behind it for audit purposes.' },
  { id: 'SCN-006', scenario: 'Compensation', name: '赔偿高敏策略', version: 'v2.5', primaryModel: 'gpt-4.1-mini', fallbackModel: 'gpt-4o-mini', modelChannel: '稳定版', temperature: 0.1, maxOutputTokens: 220, contextWindow: 12000, queryRewriteEnabled: true, rerankerEnabled: true, topK: 6, similarityThreshold: 0.83, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: true, humanSendAllowed: false, blockedClaims: ['不得承诺赔偿金额', '不得绕过主管审批'], lowConfidenceFallback: '升级主管审批', noMatchFallback: '转人工赔偿评估', sensitiveCaseFallback: '升级法务复核', updatedAt: '2026-05-22 13:40' },
  { id: 'SCN-007', scenario: 'Chargeback', name: '拒付争议策略', version: 'v1.9', primaryModel: 'gpt-4.1-mini', fallbackModel: 'gpt-4o-mini', modelChannel: '稳定版', temperature: 0.1, maxOutputTokens: 220, contextWindow: 12000, queryRewriteEnabled: true, rerankerEnabled: true, topK: 6, similarityThreshold: 0.84, citationRequired: true, aiSuggestAllowed: true, manualReviewRequired: true, humanSendAllowed: false, blockedClaims: ['不得承认拒付责任', '不得承诺退款'], lowConfidenceFallback: '升级拒付专员', noMatchFallback: '转人工争议处理', sensitiveCaseFallback: '升级法务复核', updatedAt: '2026-05-22 13:40' },
];

const pipelineNodeConfigs: PipelineNodeModelConfig[] = [
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

const modelRoutingSummary: ModelRoutingSummary = {
  defaultModel: aiEnvironment.defaultModel,
  embeddingModel: aiEnvironment.embeddingModel,
  rerankerModel: aiEnvironment.rerankerModel,
  defaultScenarioConfigId: 'SCN-001',
  activeScenarioCount: scenarioModelConfigs.length,
  fallbackEnabledScenarioCount: scenarioModelConfigs.filter(item => item.fallbackModel).length,
  manualReviewScenarioCount: scenarioModelConfigs.filter(item => item.manualReviewRequired).length,
  summary: '场景配置定义默认模型与护栏边界，节点配置按需覆盖具体子任务模型与回退策略。',
};

function getScenarioModelConfig(scenario: string) {
  return scenarioModelConfigs.find(item => item.scenario === scenario)
    ?? scenarioModelConfigs.find(item => item.scenario === 'Shipping')
    ?? scenarioModelConfigs[0];
}

function buildSendGuardrailResult(scenario: string): SendGuardrailResult {
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

function buildDraftSourceTrace(ticket: ServiceTicket): DraftSourceTrace {
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

function buildPromptPreviewFromRun(input: {
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

function buildGuardrailCheck(scenario: string, citations: number): GuardrailCheckResult {
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

function buildInitialRagTestRuns(customers: CustomerProfile[], orders: Order[], knowledgeDocuments: KnowledgeDocument[]): RagTestRun[] {
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

const faqs: FAQ[] = Array.from({ length: 24 }, (_, index) => ({
  id: pad('FAQ', index + 1),
  question: `常见问题 ${index + 1}`,
  category: ['物流', '退款', '支付', '商品咨询'][index % 4],
  answerSummary: `可复用答案摘要 ${index + 1}`,
  language: ['EN', 'ZH', 'DE', 'FR', 'ES', 'JA'][index % 6],
  status: index % 6 === 0 ? 'Draft' : 'Published',
  usageCount: 80 + index * 17,
  matchAccuracy: 79 + (index % 5) * 4,
}));

const replyTemplates: ReplyTemplate[] = Array.from({ length: 24 }, (_, index) => ({
  id: pad('TPL', index + 1),
  name: `回复模板 ${index + 1}`,
  scenario: ['物流', '退款', '投诉', '支付', 'VIP'][index % 5],
  language: ['EN', 'ZH', 'DE', 'FR', 'ES'][index % 5],
  tone: ['共情', '专业', '清晰'][index % 3],
  status: index % 7 === 0 ? 'Draft' : 'Active',
  usageCount: 20 + index * 8,
  content: `模板内容 ${index + 1}`,
}));

const businessRules: BusinessRule[] = Array.from({ length: 20 }, (_, index) => ({
  id: pad('RUL', index + 1),
  name: ['签收后退款', '赔偿诉求', '地址截单', 'VIP 加急权益', '支付恢复梯度'][index % 5],
  scenario: ['退款', '投诉', '地址修改', 'VIP', '支付'][index % 5],
  trigger: ['订单已签收', '提到赔偿', '订单未发货', 'VIP 诉求', '支付失败'][index % 5],
  aiPermission: ['仅建议', '仅建议', '建议并核验', '建议并附 SLA 参考', '建议替代支付方法'][index % 5],
  manualReviewRequired: index % 4 === 0 ? 'Yes' : 'No',
  status: index % 6 === 0 ? 'Draft' : 'Active',
}));

const policyDocs: PolicyDoc[] = Array.from({ length: 20 }, (_, index) => ({
  name: `${['物流延迟', '退款', '赔偿', 'VIP', '本地化'][index % 5]}政策 ${index + 1}`,
  description: ['物流商调查流程与承诺边界。', '证据要求与审核路径。', '升级路径与审批规则。', '优先支持权益与 SLA。', '本地化政策发布状态与回退规则。'][index % 5],
  version: `v${1 + (index % 3)}.${index % 10}`,
  updated: `2026-05-${String(1 + (index % 20)).padStart(2, '0')}`,
}));

const aiCapabilities: AICapability[] = [
  { id: 'issue-classification', name: '问题分类', enabled: true, desc: '对流程阶段、风险级别和路由进行分类。' },
  { id: 'crm-policy-link', name: '客户策略联动', enabled: true, desc: '将客户分群、区域和风险注入检索过滤条件。' },
  { id: 'retrieval-debugger', name: '检索调试器', enabled: true, desc: '可重放检索并检查候选结果的丢弃原因。' },
  { id: 'review-gating', name: '复核闸门', enabled: true, desc: '对退款、投诉和高风险执行路径强制人工复核。' },
  { id: 'knowledge-gap-detection', name: '知识缺口检测', enabled: true, desc: '识别过期、冲突或缺失的本地化知识。' },
];

const permissionBoundaries: PermissionBoundary[] = [
  { scenario: '商品咨询', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'No' },
  { scenario: '物流延迟', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'Conditional' },
  { scenario: '退款 / 退货', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'Yes' },
  { scenario: '投诉 / 赔偿', aiSuggest: 'Yes', aiSend: 'No', manualReview: 'Yes' },
];

const guardrails = [
  '所有草稿在发送前都必须展示引用和禁止声明。',
  '过期或冲突知识不能作为主证据使用。',
  '客户语言与区域信号必须参与检索和升级路由。',
  '高风险执行动作必须保留人工控制。',
  'AI 不能发送客户消息、批准退款、承诺赔偿、关闭投诉或编造物流事实。',
];

const aiOpsStages: AIOpsStage[] = [
  {
    id: 'OPS-001',
    stage: '上传与解析',
    owner: '知识运营',
    status: 'healthy',
    throughput: '28 份文档 / 天',
    detail: 'PDF、DOCX、HTML 和 XLSX 文档会统一标准化，并校验来源元数据、语言区域和生效日期。',
    controlPoint: '在切片前拦截元数据异常文档。',
  },
  {
    id: 'OPS-002',
    stage: '切片与向量化',
    owner: '模型平台',
    status: 'watch',
    throughput: '成功率 94%',
    detail: '投诉和本地化文档的切片失败率最高，因为区域附录的标题结构经常不一致。',
    controlPoint: '在索引发布前标记低覆盖文档。',
  },
  {
    id: 'OPS-003',
    stage: '索引与检索',
    owner: '搜索基础设施',
    status: 'healthy',
    throughput: 'P95 420 毫秒',
    detail: '区域、语言、场景、版本和发布状态会作为一级检索过滤条件使用。',
    controlPoint: '把过期和冲突版本从主证据中剔除。',
  },
  {
    id: 'OPS-004',
    stage: '提示词组装与护栏',
    owner: 'AI 辅助运行时',
    status: 'healthy',
    throughput: '通过率 99.2%',
    detail: '客户 360、订单上下文、策略约束和禁止声明会组装成可审计的草稿包。',
    controlPoint: '若缺少引用或触发禁止声明则中断生成。',
  },
  {
    id: 'OPS-005',
    stage: '人工复核与反馈',
    owner: '客服负责人',
    status: 'risk',
    throughput: '人工复核率 41%',
    detail: '退款、投诉和赔偿相关工单仍然构成演示队列中最大的复核积压。',
    controlPoint: '任何运营动作执行前都必须获得主管确认。',
  },
];

const agents: Agent[] = [
  { name: '你', role: '高级客服' },
  { name: '陈艾琳', role: '客服专员' },
  { name: '吴柏霖', role: '客服专员' },
  { name: '戴珂岚', role: '团队负责人' },
  { name: '知识运营', role: '知识运营' },
];

function buildRolePermissionProfiles(): TeamRolePermissionProfile[] {
  return [
    {
      role: '客服专员',
      scopeSummary: '处理标准客服会话，可使用 AI 建议并由人工发送。',
      aiSuggest: '允许',
      humanSend: '允许',
      manualReviewOverride: '不可绕过，命中高风险场景必须复核',
      knowledgeAccess: '查看已发布知识与引用来源',
      settingsAccess: '仅查看系统设置',
      auditAccess: '查看本人相关审计留痕',
    },
    {
      role: '高级客服',
      scopeSummary: '负责复杂会话和升级前分诊，拥有更高的审计与排障可见性。',
      aiSuggest: '允许',
      humanSend: '允许',
      manualReviewOverride: '可发起复核，但不可跳过高风险复核',
      knowledgeAccess: '查看知识命中、引用和 RAG 异常',
      settingsAccess: '查看运行配置与权限边界',
      auditAccess: '查看团队级审计与异常记录',
    },
    {
      role: '团队负责人',
      scopeSummary: '负责复核、升级处理和权限边界监督。',
      aiSuggest: '允许',
      humanSend: '允许',
      manualReviewOverride: '可执行人工复核与升级判定',
      knowledgeAccess: '查看全部知识状态与发布风险',
      settingsAccess: '查看权限管理、通知和渠道策略',
      auditAccess: '查看全部审计、反馈与阻止事件',
    },
    {
      role: '知识运营',
      scopeSummary: '维护知识资产、文档接入和规则覆盖，不直接承担客服发送动作。',
      aiSuggest: '按知识链路提供支持',
      humanSend: '不承担客服发送权限',
      manualReviewOverride: '不可处理客服复核结论',
      knowledgeAccess: '维护知识库、文档接入和规则来源',
      settingsAccess: '查看知识与 AI 相关设置',
      auditAccess: '查看知识事件与接入异常',
    },
  ];
}

function buildMemberPermissionAssignments(agentsList: Agent[], roleProfiles: TeamRolePermissionProfile[]) {
  return agentsList.map(agent => {
    const profile = roleProfiles.find(item => item.role === agent.role);
    return {
      memberName: agent.name,
      role: agent.role,
      inheritsFromRole: true,
      overrideSummary: '无单独覆盖',
      effectivePermissions: profile
        ? `${profile.aiSuggest} AI 建议 / ${profile.humanSend}人工发送 / ${profile.auditAccess}`
        : '沿用默认角色权限',
    };
  });
}

const settingsPermissions: SettingsPermissionSnapshot = {
  roleProfiles: buildRolePermissionProfiles(),
  memberAssignments: buildMemberPermissionAssignments(agents, buildRolePermissionProfiles()),
};

const settings: SettingsData = {
  general: { language: '简体中文', timezone: 'UTC+8（中国）', notifications: '邮件 + 应用内' },
  team: agents,
  permissions: settingsPermissions,
  operationLogs: { entries: [] },
  channels: { liveChat: true, email: true, ticket: true, whatsapp: true, messenger: false },
  notifications: { newTicket: true, slaWarning: true, aiAlert: true, taskReminder: true, reviewRequired: true },
};

const analytics: AnalyticsData = {
  metrics: [
    { label: '处理中工单', value: '96', trend: '+11%', direction: 'up', subtitle: '本周客服工作负载', color: '' },
    { label: '引用覆盖率', value: '86%', trend: '+4%', direction: 'up', subtitle: '覆盖全部检索运行', color: 'var(--color-success)' },
    { label: '人工复核压力', value: '41%', trend: '+7%', direction: 'up', subtitle: '高复核压力队列', color: 'var(--color-warning)' },
    { label: '知识事件', value: '8', trend: '+2', direction: 'up', subtitle: '过期或冲突资产', color: 'var(--color-danger)' },
  ],
  ticketVolume: { labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], values: [68, 74, 71, 89, 84, 63, 58] },
  channelDist: [
    { label: '邮件', value: 34, color: '#6C5CE7' },
    { label: '在线聊天', value: 43, color: '#3B82F6' },
    { label: '工单', value: 23, color: '#10B981' },
  ],
  issueDist: [
    { label: '物流', value: 28, color: '#6C5CE7' },
    { label: '退款', value: 18, color: '#F59E0B' },
    { label: '投诉', value: 12, color: '#EF4444' },
    { label: '支付', value: 11, color: '#3B82F6' },
    { label: '地址/VIP/售前', value: 31, color: '#10B981' },
  ],
  aiAdoptionTrend: [
    { label: '周一', value: 64 },
    { label: '周二', value: 67 },
    { label: '周三', value: 69 },
    { label: '周四', value: 72 },
    { label: '周五', value: 74 },
  ],
  topFAQ: [
    { label: '物流更新', count: 342 },
    { label: '退款证据', count: 287 },
    { label: '支付重试', count: 231 },
    { label: '地址截单', count: 184 },
  ],
  manualReviewBreakdown: [
    { label: '签收后退款', pct: 31 },
    { label: '投诉赔偿', pct: 27 },
    { label: '退货审批', pct: 18 },
    { label: '支付恢复', pct: 12 },
    { label: '本地化缺口', pct: 12 },
  ],
};

const activityLog: ActivityLogItem[] = [
  { id: 'LOG-001', action: 'RAG 发布已提升', user: '知识运营', time: '18 分钟前', detail: '已将欧区投诉处理的稳定检索配置提升为正式版本。' },
  { id: 'LOG-002', action: '知识冲突已标记', user: '系统', time: '27 分钟前', detail: '投诉处理指引 v1.6 草稿与已审批的 v1.5 元数据冲突。' },
  { id: 'LOG-003', action: '工单执行已阻止', user: '戴珂岚', time: '39 分钟前', detail: '在本地化政策发布前，赔偿相关动作保持阻止状态。' },
  { id: 'LOG-004', action: '系统设置已更新', user: '超级管理员', time: '52 分钟前', detail: '更新了通知偏好并同步团队默认提醒策略。' },
  { id: 'LOG-005', action: '知识版本已归档', user: '知识运营', time: '1 小时前', detail: '将旧版退款 SOP 归档，避免继续参与检索。' },
  { id: 'LOG-006', action: 'RAG 阈值已调整', user: '系统', time: '1 小时前', detail: '将欧区投诉场景的相似度阈值从 0.86 下调到 0.82。' },
];

const evaluations: EvaluationRecord[] = Array.from({ length: 32 }, (_, index) => ({
  id: pad('EVAL', index + 1),
  target: ['AI 回复', '知识库召回', '工单处理', '客服会话'][index % 4],
  refId: `TKT-${String(100 + index).padStart(3, '0')}`,
  scenario: ['物流延迟', '退款申请', '投诉', '地址修改', 'VIP 支持', '支付失败', '商品咨询', '退货申请'][index % 8],
  metric: ['回复准确性', '召回命中率', '口径一致性', '人工改写率', '引用覆盖率'][index % 5],
  score: `${68 + (index % 8) * 4}%`,
  issue: index % 9 === 0 ? '引用覆盖不足，AI 回复缺少政策依据链接。' : index % 4 === 0 ? '部分回复口径与最新政策存在偏差。' : '',
  suggestion: '建议补充相关场景知识片段，提升回复引用率。',
  conclusion: index % 9 === 0 ? 'high_risk' : index % 4 === 0 ? 'optimize' : 'pass',
  createdAt: `2026-05-${String(22 - (index % 7)).padStart(2, '0')} 0${8 + (index % 4)}:0${String(index % 6).padStart(2, '0')}`,
}));

const feedbackLoop: FeedbackLoopRecord[] = [
  {
    id: 'FDB-001',
    source: '客服工作台',
    refId: 'CHAT-023',
    scenario: '物流延迟',
    issueType: '知识缺失',
    severity: 'medium',
    description: '客服在欧区包裹场景下会持续补充预计时效免责声明。',
    action: '更新物流提示词模板，并补充欧区物流延迟检索片段。',
    createTodo: false,
    owner: '知识运营',
    status: 'shipped',
    updatedAt: '2026-05-22 09:10',
  },
  {
    id: 'FDB-002',
    source: '人工质检',
    refId: 'TKT-101',
    scenario: '投诉',
    issueType: '知识缺失',
    severity: 'high',
    description: '法国赔偿诉求缺少本地化投诉政策。',
    action: '发布法国投诉附录，并在上线前阻止赔偿相关草稿流转。',
    createTodo: true,
    owner: '知识运营',
    status: 'triaged',
    updatedAt: '2026-05-22 10:25',
  },
  {
    id: 'FDB-003',
    source: '工单审核',
    refId: 'TKT-202',
    scenario: '退款申请',
    issueType: '回复不准',
    severity: 'medium',
    description: '草稿过度强调道歉，但证据清单说明不足。',
    action: '调整退款提示词，强制包含订单状态、证据要求和审批路径。',
    createTodo: true,
    owner: 'AI 辅助运行时',
    status: 'new',
    updatedAt: '2026-05-22 11:05',
  },
  { id: 'FDB-004', source: '召回测试', refId: 'DOC-RAG-REF-042', scenario: '投诉', issueType: '召回错误', severity: 'high', description: '投诉场景中 AI 草稿试图承诺赔偿，护栏正确拦截。', action: '更新投诉场景 blockedClaims，强化赔偿承诺检测规则。', createTodo: true, owner: '风控', status: 'new', updatedAt: '2026-05-27 14:30' },
  { id: 'FDB-005', source: '人工质检', refId: 'TKT-305', scenario: '物流延迟', issueType: '知识缺失', severity: 'medium', description: '泰语物流模板未覆盖热带气候导致的运输延误场景。', action: '新增东南亚物流本地化知识文档，补充气候相关 FAQ。', createTodo: false, owner: '知识运营', status: 'triaged', updatedAt: '2026-05-26 09:15' },
  { id: 'FDB-006', source: '客服工作台', refId: 'CHAT-056', scenario: '退款申请', issueType: '口径冲突', severity: 'medium', description: '客服多次手动修改退款回复中的退款时效说明，与政策文档不一致。', action: '更新退款政策文档 v2.1，统一退款时效口径为 7-14 工作日。', createTodo: false, owner: '知识运营', status: 'shipped', updatedAt: '2026-05-25 16:40' },
  { id: 'FDB-007', source: '用户反馈', refId: 'TKT-410', scenario: '支付失败', issueType: '知识缺失', severity: 'high', description: '客户投诉支付失败后客服回复模板未包含替代支付方式建议。', action: '在支付异常处理流程中增加替代支付方案引导段落。', createTodo: true, owner: '产品支持', status: 'triaged', updatedAt: '2026-05-25 11:20' },
  { id: 'FDB-008', source: '人工质检', refId: 'CHAT-078', scenario: '商品咨询', issueType: '回复不准', severity: 'high', description: '德语商品规格回复中单位制式(公制/英制)混淆导致信息错误。', action: '在 Prompt 模板中增加区域与度量单位约束规则。', createTodo: true, owner: '商品团队', status: 'new', updatedAt: '2026-05-28 08:00' },
];

const auditLogs: AuditLogRecord[] = [
  {
    id: 'AUD-001',
    ticketId: 'TKT-003',
    eventType: 'Guardrail block',
    actor: '系统',
    outcome: '草稿中的赔偿承诺已在复核前移除。',
    riskLevel: 'High',
    timestamp: '2026-05-22 10:42',
    detail: '草稿提及赔偿，但没有引用已批准的本地化政策来源。',
  },
  {
    id: 'AUD-002',
    ticketId: 'TKT-014',
    eventType: 'Reviewer override',
    actor: '戴珂岚',
    outcome: '补充物流追踪编号后，草稿通过审批。',
    riskLevel: 'Medium',
    timestamp: '2026-05-22 10:58',
    detail: '人工复核在物流证据齐备后放行了该草稿。',
  },
  {
    id: 'AUD-003',
    ticketId: 'TKT-021',
    eventType: 'Knowledge incident',
    actor: '知识运营',
    outcome: '过期的地址修改 SOP 已从活动检索集中移除。',
    riskLevel: 'Low',
    timestamp: '2026-05-22 11:16',
    detail: '检测到生效日期不一致后，已排队等待重建索引。',
  },
  {
    id: 'AUD-004',
    ticketId: 'TKT-034',
    eventType: 'Action blocked',
    actor: '系统',
    outcome: '退款执行因等待主管审批而被阻止。',
    riskLevel: 'High',
    timestamp: '2026-05-22 11:39',
    detail: 'AI 辅助仅生成了检查清单，并未审批或执行退款。',
  },
  {
    id: 'AUD-005',
    ticketId: 'TKT-008',
    eventType: 'Manual send',
    actor: '陈艾琳',
    outcome: '客服已人工发送更新后的物流说明。',
    riskLevel: 'Low',
    timestamp: '2026-05-22 12:08',
    detail: '发送前已补齐追踪编号与预计送达窗口。',
  },
  {
    id: 'AUD-006',
    ticketId: 'TKT-012',
    eventType: 'Knowledge incident',
    actor: '知识运营',
    outcome: '法语退货指引因缺少引用来源被标记待修复。',
    riskLevel: 'Medium',
    timestamp: '2026-05-22 12:22',
    detail: '当前版本缺少最新法语条款引用，已暂停进入正式检索集。',
  },
  {
    id: 'AUD-007',
    ticketId: 'TKT-041',
    eventType: 'Reviewer override',
    actor: '团队负责人',
    outcome: '主管要求改写赔偿措辞后重新提交。',
    riskLevel: 'High',
    timestamp: '2026-05-22 12:31',
    detail: '原草稿承诺超出当前政策边界，已退回给客服重写。',
  },
  {
    id: 'AUD-008',
    ticketId: 'TKT-056',
    eventType: 'Guardrail block',
    actor: '系统',
    outcome: '未附引用的退款草稿已被自动拦截。',
    riskLevel: 'High',
    timestamp: '2026-05-22 12:44',
    detail: '当前草稿没有注入有效 retrieved chunks，发送链路被强制中断。',
  },
  { id: 'AUD-009', ticketId: 'SYSTEM', eventType: 'Config change', actor: '知识运营', outcome: '全局 RAG 检索配置已更新。', riskLevel: 'Low', timestamp: '2026-05-26 10:15', detail: 'Top K 从 5 调整为 7，重排序从关闭切换为开启，以提升高敏场景的检索精度。' },
  { id: 'AUD-010', ticketId: 'SYSTEM', eventType: 'Config change', actor: 'AI 辅助运行时', outcome: '物流场景策略已更新。', riskLevel: 'Low', timestamp: '2026-05-25 15:40', detail: '物流场景（SCN-001）主模型从 gpt-4o-mini 切换为 gpt-4.1-mini，temperature 从 0.3 降为 0.2。' },
  { id: 'AUD-011', ticketId: 'SYSTEM', eventType: 'Config change', actor: '知识运营', outcome: '知识库配置覆盖已保存。', riskLevel: 'Low', timestamp: '2026-05-24 09:30', detail: 'KB-OPS（履约与退款知识库）chunkSize 从全局默认 600 覆盖为 500。' },
  { id: 'AUD-012', ticketId: 'SYSTEM', eventType: 'KB created', actor: '知识运营', outcome: '新知识库已创建。', riskLevel: 'Low', timestamp: '2026-05-27 11:00', detail: '创建了「东南亚物流专项库」，覆盖场景：物流、退款，chunkSize=300，topK=8。' },
  { id: 'AUD-013', ticketId: 'SYSTEM', eventType: 'KB archived', actor: '知识运营', outcome: '知识库已归档。', riskLevel: 'Low', timestamp: '2026-05-28 09:00', detail: '「VIP 客户专属知识库」因内容已合并至主知识库，已被归档。' },
  { id: 'AUD-014', ticketId: 'SYSTEM', eventType: 'Scenario config change', actor: '风控', outcome: '投诉场景禁止声明已更新。', riskLevel: 'Medium', timestamp: '2026-05-26 16:20', detail: '投诉场景（SCN-005）blockedClaims 中新增「不得建议客户撤销信用卡争议(chargeback)」。' },
];

function mapActivityScope(action: string) {
  if (action.includes('RAG')) return 'RAG 配置';
  if (action.includes('知识')) return '知识运营';
  if (action.includes('工单')) return '工单执行';
  return '系统设置';
}

function buildSettingsOperationLogs(activityItems: ActivityLogItem[], auditItems: AuditLogRecord[]): SettingsOperationLogSnapshot {
  const activityEntries = activityItems.map(item => ({
    id: item.id,
    timestampLabel: item.time,
    sourceType: 'system_activity' as const,
    actor: item.user,
    action: item.action,
    scope: mapActivityScope(item.action),
    result: '已记录',
    detail: item.detail,
  }));

  const auditEntries = [...auditItems]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .map(item => ({
      id: item.id,
      timestampLabel: item.timestamp,
      sourceType: 'ai_audit' as const,
      actor: item.actor,
      action: item.eventType,
      scope: item.eventType === 'Knowledge incident' ? '知识事件' : 'AI 审计 / 工单链路',
      result: item.outcome,
      detail: item.detail,
      riskLevel: item.riskLevel,
    }));

  return {
    entries: [...activityEntries, ...auditEntries],
  };
}

settings.operationLogs = buildSettingsOperationLogs(activityLog, auditLogs);

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
      const scenarioFallback = getScenarioModelConfig(item.allowedScenarios[0] ?? 'Shipping');
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
