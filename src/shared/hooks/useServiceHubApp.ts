import { useEffect, useMemo, useState } from 'react';
import { createMockServiceHubApi } from '../../api/adapters/mockServiceHub';
import { createMockSnapshot } from '../../mocks/fixtures/serviceHub';
import type {
  BusinessRule,
  CustomerFilters,
  DocumentFilters,
  FAQ,
  KnowledgeBaseRecord,
  KnowledgeDetailTab,
  KnowledgeFlow,
  KnowledgeProcessingResult,
  EvaluationCenterTab,
  KnowledgeWizardDraft,
  KnowledgeWizardStep,
  ListQuery,
  NavKey,
  OperationLogFilters,
  OrderFilters,
  OverviewEventItem,
  OverviewMetric,
  OverviewNavigationTarget,
  OverviewShortcutItem,
  OverviewSnapshot,
  OverviewTodoItem,
  PagedResult,
  PolicyDoc,
  RagConfigSnapshot,
  RagRunFilters,
  ReplyTemplate,
  AIConsolePageKey,
  ScenarioSettingsTab,
  ServiceHubSnapshot,
  ServiceTicket,
  TaskFilters,
  TicketFilters,
  Toast,
} from '../../types';
import type { Language } from '../../i18n';
import { toLegacyCustomer, toLegacyTicket } from '../lib/serviceHubMappers';
import { displayAuditEvent, displayFulfillmentStatus, displayGenericStatus, displayPaymentStatus, displayRiskLevel, displayScenario, displayTicketStatus } from '../../utils/display';
import {
  buildDerivedRoutingSummary,
  buildEffectiveNodePolicies,
  buildEffectiveScenarioPolicies,
} from '../lib/aiConsolePolicy';
import type { AIConsoleBusinessCase } from '../../pages/ai-console/types';

const emptyPaged = <T,>(pageSize: number): PagedResult<T> => ({ items: [], total: 0, page: 1, pageSize, totalPages: 1 });

function rankTone(rank: number): OverviewEventItem['tone'] {
  if (rank >= 90) return 'red';
  if (rank >= 70) return 'yellow';
  if (rank >= 50) return 'blue';
  if (rank >= 30) return 'green';
  return 'gray';
}

function sortByRankAndTime<T extends { rank: number; timestamp?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    if (right.rank !== left.rank) return right.rank - left.rank;
    return new Date(right.timestamp ?? 0).getTime() - new Date(left.timestamp ?? 0).getTime();
  });
}

function stripRankAndTimestamp<T extends { rank: number; timestamp?: string }>(item: T): Omit<T, 'rank' | 'timestamp'> {
  const { rank: _rank, timestamp: _timestamp, ...next } = item;
  void _rank;
  void _timestamp;
  return next;
}

function nowUiStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function createKnowledgeWizardDraft(snapshot: ServiceHubSnapshot, knowledgeBaseId: string | null = null): KnowledgeWizardDraft {
  return {
    knowledgeBaseId,
    sourceType: 'file',
    fileName: '',
    fileSizeLabel: '',
    documentName: '',
    knowledgeType: 'Policy',
    scenario: 'Shipping',
    language: 'EN',
    owner: '知识运营',
    version: 'v1.0',
    effectiveDate: new Date().toISOString().slice(0, 10),
    parser: structuredClone(snapshot.ragConfig.parser),
    chunking: structuredClone(snapshot.ragConfig.chunking),
    retrieval: structuredClone(snapshot.ragConfig.retrieval),
  };
}

function createSeedKnowledgeBases(snapshot: ServiceHubSnapshot): KnowledgeBaseRecord[] {
  const groups: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    owner: string;
    tags: string[];
    status: KnowledgeBaseRecord['status'];
    scenarios: string[];
  }> = [
    {
      id: 'KB-OPS',
      name: '履约与退款知识库',
      description: '覆盖物流、退款、支付类 SOP、政策与回复模板，是客服主检索入口。',
      icon: 'OPS',
      owner: '知识运营',
      tags: ['物流', '退款', '支付'],
      status: 'active',
      scenarios: ['Shipping', 'Refund', 'Payment'],
    },
    {
      id: 'KB-ESC',
      name: '投诉与升级知识库',
      description: '聚焦投诉、赔偿、拒付场景，突出高风险规则、审批边界与升级指引。',
      icon: 'RISK',
      owner: '风险运营',
      tags: ['投诉', '赔偿', '拒付'],
      status: 'syncing',
      scenarios: ['Complaint', 'Compensation', 'Chargeback'],
    },
    {
      id: 'KB-PROD',
      name: '商品与服务知识库',
      description: '面向商品咨询、促销说明与客服话术，兼顾规格、FAQ 与模板复用。',
      icon: 'PROD',
      owner: '产品支持',
      tags: ['商品咨询', '促销', 'FAQ'],
      status: 'active',
      scenarios: ['Product Inquiry', 'Promotion'],
    },
  ];

  return groups.map(group => {
    const docs = snapshot.knowledgeDocuments.filter(doc => group.scenarios.includes(doc.scenario));
    const latestSync = snapshot.ingestionDocuments
      .filter(item => docs.some(doc => doc.id === item.documentId))
      .map(item => item.lastSync)
      .sort()
      .at(-1);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      icon: group.icon,
      tags: group.tags,
      documentCount: docs.length,
      updatedAt: latestSync ?? nowUiStamp(),
      owner: group.owner,
      source: 'service_api',
      status: group.status,
      documentIds: docs.map(doc => doc.id),
    };
  });
}

export function useServiceHubApp() {
  const [snapshot, setSnapshot] = useState<ServiceHubSnapshot>(() => createMockSnapshot());
  const [lang, setLang] = useState<Language>('zh');
  const [currentPage, setCurrentPage] = useState<NavKey>('overview');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>('TKT-001');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [aiConsolePage, setAIConsolePage] = useState<AIConsolePageKey>('rag-config');
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseRecord[]>(() => createSeedKnowledgeBases(createMockSnapshot()));
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<string | null>('KB-OPS');
  const [knowledgeFlow, setKnowledgeFlow] = useState<KnowledgeFlow>('list');
  const [knowledgeDetailTab, setKnowledgeDetailTab] = useState<KnowledgeDetailTab>('documents');
  const [scenarioSettingsTab, setScenarioSettingsTab] = useState<ScenarioSettingsTab>('scenario');
  const [evaluationCenterTab, setEvaluationCenterTab] = useState<EvaluationCenterTab>('evaluation');
  const [knowledgeWizardStep, setKnowledgeWizardStep] = useState<KnowledgeWizardStep>(1);
  const [knowledgeWizardDraft, setKnowledgeWizardDraft] = useState<KnowledgeWizardDraft>(() => createKnowledgeWizardDraft(createMockSnapshot(), 'KB-OPS'));
  const [knowledgeProcessingResult, setKnowledgeProcessingResult] = useState<KnowledgeProcessingResult | null>(null);
  const [settingsTab, setSettingsTab] = useState('general');
  const [replyText, setReplyText] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [customerQuery, setCustomerQuery] = useState<ListQuery<CustomerFilters>>({ page: 1, pageSize: 8, sortBy: 'name', sortOrder: 'asc', search: '', filters: {} });
  const [ticketQuery, setTicketQuery] = useState<ListQuery<TicketFilters>>({ page: 1, pageSize: 10, sortBy: 'lastUpdated', sortOrder: 'desc', search: '', filters: {} });
  const [orderQuery, setOrderQuery] = useState<ListQuery<OrderFilters>>({ page: 1, pageSize: 10, sortBy: 'date', sortOrder: 'desc', search: '', filters: {} });
  const [taskQuery, setTaskQuery] = useState<ListQuery<TaskFilters>>({ page: 1, pageSize: 10, sortBy: 'due', sortOrder: 'asc', search: '', filters: {} });
  const [operationLogQuery, setOperationLogQuery] = useState<ListQuery<OperationLogFilters>>({ page: 1, pageSize: 10, sortBy: 'timestampLabel', sortOrder: 'desc', search: '', filters: {} });
  const [documentQuery, setDocumentQuery] = useState<ListQuery<DocumentFilters>>({ page: 1, pageSize: 8, sortBy: 'scenario', sortOrder: 'asc', search: '', filters: {} });
  const [ragRunQuery, setRagRunQuery] = useState<ListQuery<RagRunFilters>>({ page: 1, pageSize: 8, sortBy: 'createdAt', sortOrder: 'desc', search: '', filters: {} });

  const [customerResult, setCustomerResult] = useState<PagedResult<ServiceHubSnapshot['customers'][number]>>(emptyPaged(8));
  const [ticketResult, setTicketResult] = useState<PagedResult<ServiceTicket>>(emptyPaged(10));
  const [orderResult, setOrderResult] = useState<PagedResult<ServiceHubSnapshot['orders'][number]>>(emptyPaged(10));
  const [taskResult, setTaskResult] = useState<PagedResult<ServiceHubSnapshot['tasks'][number]>>(emptyPaged(10));
  const [operationLogResult, setOperationLogResult] = useState<PagedResult<ServiceHubSnapshot['operationLogs'][number]>>(emptyPaged(10));
  const [documentResult, setDocumentResult] = useState<PagedResult<ServiceHubSnapshot['knowledgeDocuments'][number]>>(emptyPaged(8));
  const [ragRunResult, setRagRunResult] = useState<PagedResult<ServiceHubSnapshot['ragRuns'][number]>>(emptyPaged(8));
  const [faqList, setFaqList] = useState<FAQ[]>([]);
  const [replyTemplates, setReplyTemplates] = useState<ReplyTemplate[]>([]);
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([]);
  const [policyDocs, setPolicyDocs] = useState<PolicyDoc[]>([]);

  const api = useMemo(() => createMockServiceHubApi(snapshot), [snapshot]);
  const selectedKnowledgeBase = useMemo(
    () => knowledgeBases.find(item => item.id === selectedKnowledgeBaseId) ?? null,
    [knowledgeBases, selectedKnowledgeBaseId],
  );
  const selectedBusinessTicket = useMemo(
    () => snapshot.tickets.find(item => item.id === selectedTicketId) ?? snapshot.tickets[0] ?? null,
    [snapshot.tickets, selectedTicketId],
  );
  const aiConsoleBusinessCase = useMemo<AIConsoleBusinessCase>(() => {
    const ticket = selectedBusinessTicket;
    const customer = ticket ? snapshot.customers.find(item => item.id === ticket.customerId) ?? null : null;
    const order = ticket
      ? snapshot.orders.find(item => item.customerId === ticket.customerId && ticket.summary.includes(item.id)) ??
        snapshot.orders.find(item => item.customerId === ticket.customerId) ??
        null
      : null;
    const review = ticket ? snapshot.reviewDecisions.find(item => item.id === ticket.reviewDecisionId) ?? null : null;
    const draft = ticket ? snapshot.replyDrafts.find(item => item.id === ticket.draftId) ?? null : null;
    const ragRun = ticket ? snapshot.ragRuns.find(item => item.id === ticket.retrievalRunId) ?? null : null;
    const knowledgeDocuments = ticket
      ? snapshot.knowledgeDocuments.filter(item => ticket.selectedKnowledgeIds.includes(item.id))
      : [];
    const auditLogs = ticket ? snapshot.auditLogs.filter(item => item.ticketId === ticket.id) : [];
    const followUpTasks = ticket ? snapshot.tasks.filter(item => item.ticketId === ticket.id) : [];
    const messageCount = ticket ? snapshot.messages.filter(item => item.ticketId === ticket.id).length : 0;

    return {
      ticket,
      customer,
      order,
      review,
      draft,
      ragRun,
      knowledgeDocuments,
      auditLogs,
      followUpTasks,
      messageCount,
    };
  }, [
    selectedBusinessTicket,
    snapshot.auditLogs,
    snapshot.customers,
    snapshot.knowledgeDocuments,
    snapshot.messages,
    snapshot.orders,
    snapshot.ragRuns,
    snapshot.replyDrafts,
    snapshot.reviewDecisions,
    snapshot.tasks,
  ]);
  const overview = useMemo<OverviewSnapshot>(() => {
    const activeCustomers = snapshot.customers.filter(item => new Date(item.lastContact).getTime() >= new Date('2026-05-15T00:00:00').getTime()).length;
    const orderExceptions = snapshot.orders.filter(item => item.riskAlert || item.paymentStatus === 'Failed' || item.fulfillmentStatus !== 'Delivered').length;
    const blockedAuditLogs = snapshot.auditLogs.filter(item => item.outcome.includes('拦截') || item.outcome.toLowerCase().includes('blocked'));
    const pendingTasks = snapshot.tasks.filter(item => item.status !== 'Completed');
    const reviewTickets = snapshot.tickets.filter(item => item.manualReview || item.status === 'Pending Review');
    const highRiskTickets = snapshot.tickets.filter(item => item.riskLevel === 'High');
    const overdueTasks = pendingTasks.filter(item => new Date(item.due).getTime() <= new Date('2026-05-25T23:59:59').getTime());
    const exceptionJobs = snapshot.ingestionJobs.filter(item => ['chunk_failed', 'embedding_failed', 'expired', 'version_conflict'].includes(item.status));
    const ragExceptions = snapshot.ragRuns.filter(item => item.knowledgeGapType || item.fallbackReason || item.status !== 'healthy');

    const metrics: OverviewMetric[] = [
      { id: 'tickets-total', label: '工单总量', value: String(snapshot.tickets.length), detail: '客服、复核与执行链路中的全部工单。', tone: 'default', target: { page: 'tickets' } },
      { id: 'tickets-open', label: '待处理工单', value: String(snapshot.tickets.filter(item => item.status !== 'Closed' && item.status !== 'Escalated').length), detail: '仍在服务、分诊、起草、复核或跟进中的工单。', tone: 'warning', target: { page: 'service' } },
      { id: 'tickets-review', label: '待人工复核', value: String(reviewTickets.length), detail: '命中退款、投诉、赔偿等高敏感策略边界。', tone: 'danger', target: { page: 'tickets', ticketFilters: { status: 'Pending Review' } } },
      { id: 'tickets-risk', label: '高风险工单', value: String(highRiskTickets.length), detail: '优先排查退款、投诉、退货和赔偿相关案例。', tone: 'danger', target: { page: 'tickets', ticketFilters: { riskLevel: 'High' } } },
      { id: 'customers-active', label: '活跃客户', value: String(activeCustomers), detail: '近阶段有订单、服务或跟进动作的客户。', tone: 'success', target: { page: 'customers' } },
      { id: 'orders-exception', label: '异常订单', value: String(orderExceptions), detail: '存在支付异常、履约滞后或风险标记的订单。', tone: 'warning', target: { page: 'orders', orderFilters: { risk: 'risk_only' } } },
      { id: 'tasks-pending', label: '待跟进任务', value: String(pendingTasks.length), detail: '客服承诺、人工回访与后续处理事项。', tone: 'warning', target: { page: 'tasks' } },
      { id: 'ai-audit', label: 'AI 审计/拦截', value: String(snapshot.auditLogs.length), detail: '包含人工改判、护栏阻止与知识异常事件。', tone: 'default', target: { page: 'ai-console-evaluation-feedback' } },
    ];

    const events: OverviewEventItem[] = sortByRankAndTime([
      ...snapshot.tickets
        .filter(item => item.status === 'Escalated' || item.riskLevel === 'High' || item.status === 'Waiting Customer')
        .map(item => ({
          id: `ticket-${item.id}`,
          title: `${item.id} · ${item.summary}`,
          detail: `${item.assignee} 正在处理 ${item.requiredAction}`,
          meta: `${displayTicketStatus(item.status)} / ${displayRiskLevel(item.riskLevel)} / ${item.lastUpdated}`,
          tone: rankTone(item.status === 'Escalated' ? 95 : item.riskLevel === 'High' ? 82 : 55),
          rank: item.status === 'Escalated' ? 95 : item.riskLevel === 'High' ? 82 : 55,
          timestamp: item.lastUpdated,
          target: { page: (item.status === 'Waiting Customer' ? 'service' : 'tickets') as NavKey, ticketId: item.id, search: item.id },
        })),
      ...snapshot.auditLogs.map(item => ({
        id: `audit-${item.id}`,
        title: `${item.ticketId} · ${displayAuditEvent(item.eventType)}`,
        detail: item.detail,
        meta: `${item.actor} / ${item.timestamp}`,
        tone: rankTone(item.riskLevel === 'High' ? 92 : item.riskLevel === 'Medium' ? 72 : 42),
        rank: item.riskLevel === 'High' ? 92 : item.riskLevel === 'Medium' ? 72 : 42,
        timestamp: item.timestamp,
        target: { page: 'ai-console-evaluation-feedback' as NavKey, ticketId: item.ticketId },
      })),
      ...exceptionJobs.map(item => ({
        id: `job-${item.id}`,
        title: `${item.documentName} · 接入异常`,
        detail: item.detail,
        meta: `${displayGenericStatus(item.status)} / ${item.updatedAt.slice(0, 16).replace('T', ' ')}`,
        tone: rankTone(78),
        rank: 78,
        timestamp: item.updatedAt,
        target: { page: 'knowledge' as NavKey },
      })),
      ...snapshot.orders
        .filter(item => item.riskAlert || item.paymentStatus === 'Failed')
        .map(item => ({
          id: `order-${item.id}`,
          title: `${item.id} · 订单异常`,
          detail: `${item.latestEvent}${item.riskAlert ? ` / ${item.riskAlert}` : ''}`,
          meta: `${displayPaymentStatus(item.paymentStatus)} / ${displayFulfillmentStatus(item.fulfillmentStatus)}`,
          tone: rankTone(item.paymentStatus === 'Failed' ? 88 : 63),
          rank: item.paymentStatus === 'Failed' ? 88 : 63,
          timestamp: item.date,
          target: { page: 'orders' as NavKey, orderId: item.id, search: item.id },
        })),
    ]).slice(0, 5).map(stripRankAndTimestamp);

    const todos: OverviewTodoItem[] = sortByRankAndTime([
      ...reviewTickets.map(item => ({
        id: `todo-review-${item.id}`,
        title: `${item.id} 等待人工复核`,
        detail: `${item.summary}，需要先完成人工判断再继续流转。`,
        badge: `${displayRiskLevel(item.riskLevel)} / ${item.assignee}`,
        tone: rankTone(item.riskLevel === 'High' ? 96 : 78),
        rank: item.riskLevel === 'High' ? 96 : 78,
        timestamp: item.lastUpdated,
        target: { page: 'service' as NavKey, ticketId: item.id, search: item.id },
      })),
      ...overdueTasks.map(item => ({
        id: `todo-task-${item.id}`,
        title: `${item.description}`,
        detail: `${item.owner} 需继续跟进 ${item.ticketId}，当前任务已临期或逾期。`,
        badge: `${displayGenericStatus(item.priority)} / ${item.due.slice(5, 16).replace('T', ' ')}`,
        tone: rankTone(item.priority === 'Urgent' ? 90 : 76),
        rank: item.priority === 'Urgent' ? 90 : 76,
        timestamp: item.due,
        target: { page: 'tasks' as NavKey, ticketId: item.ticketId },
      })),
      ...blockedAuditLogs.map(item => ({
        id: `todo-audit-${item.id}`,
        title: `${item.ticketId} 被 AI 护栏阻止`,
        detail: item.detail,
        badge: `${displayRiskLevel(item.riskLevel)} / 待人工处理`,
        tone: rankTone(item.riskLevel === 'High' ? 94 : 74),
        rank: item.riskLevel === 'High' ? 94 : 74,
        timestamp: item.timestamp,
        target: { page: 'ai-console-evaluation-feedback' as NavKey, ticketId: item.ticketId },
      })),
      ...ragExceptions.map(item => ({
        id: `todo-rag-${item.id}`,
        title: `${item.ticketId} 检索链路待排查`,
        detail: item.fallbackReason || item.knowledgeGapType || '当前检索结果未达到稳定可用状态。',
        badge: `${item.status} / ${item.scenario}`,
        tone: rankTone(item.status === 'failed' ? 84 : 64),
        rank: item.status === 'failed' ? 84 : 64,
        timestamp: item.createdAt,
        target: { page: 'ai-console-rag-test-lab' as NavKey, ticketId: item.ticketId },
      })),
    ]).slice(0, 5).map(stripRankAndTimestamp);

    const shortcuts: OverviewShortcutItem[] = [
      { id: 'shortcut-service', label: '客服工作台', description: '处理当前客服会话、草稿、复核和执行动作。', countLabel: `${snapshot.tickets.filter(item => item.status !== 'Closed').length} 个在途`, tone: 'blue', target: { page: 'service' } },
      { id: 'shortcut-tickets', label: '工单管理', description: '查看全量工单队列、筛选高风险与待复核案例。', countLabel: `${reviewTickets.length} 个待复核`, tone: 'red', target: { page: 'tickets' } },
      { id: 'shortcut-tasks', label: '跟进任务', description: '追踪承诺回访、人工补单和后续动作。', countLabel: `${pendingTasks.length} 个待办`, tone: 'yellow', target: { page: 'tasks' } },
      { id: 'shortcut-customers', label: '客户管理', description: '从客户视角查看风险标记、服务历史和价值分层。', countLabel: `${snapshot.customers.filter(item => item.riskFlags.length > 0).length} 个风险客户`, tone: 'green', target: { page: 'customers' } },
      { id: 'shortcut-orders', label: '订单管理', description: '聚合支付、履约、物流与异常订单排查。', countLabel: `${orderExceptions} 个异常订单`, tone: 'yellow', target: { page: 'orders' } },
      { id: 'shortcut-knowledge', label: '知识库', description: '检查当前知识资产、接入任务与覆盖情况。', countLabel: `${snapshot.knowledgeDocuments.length} 份知识`, tone: 'blue', target: { page: 'knowledge' } },
      { id: 'shortcut-rag', label: 'RAG 调试台', description: '围绕真实案例调试检索、Prompt 和护栏。', countLabel: `${ragExceptions.length} 个待排查`, tone: 'yellow', target: { page: 'ai-console-rag-test-lab' } },
      { id: 'shortcut-audit', label: '评测与反馈', description: '追踪拦截、人工改判、知识异常与执行留痕。', countLabel: `${blockedAuditLogs.length} 个阻止事件`, tone: 'red', target: { page: 'ai-console-evaluation-feedback' } },
    ];

    return {
      metrics,
      analytics: snapshot.analytics,
      events,
      todos,
      shortcuts,
    };
  }, [snapshot]);

  function pushToast(message: string, type: Toast['type'] = 'info') {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(item => item.id !== id)), 2800);
  }

  async function refreshWith<T extends { snapshot: ServiceHubSnapshot }>(promise: Promise<T>) {
    const result = await promise;
    setSnapshot(result.snapshot);
    return result;
  }

  useEffect(() => {
    void api.getCustomers({ ...customerQuery, search: customerQuery.search || globalSearch }).then(setCustomerResult);
  }, [api, customerQuery, globalSearch]);

  useEffect(() => {
    void api.getTickets({ ...ticketQuery, search: ticketQuery.search || globalSearch }).then(setTicketResult);
  }, [api, ticketQuery, globalSearch]);

  useEffect(() => {
    void api.getOrders({ ...orderQuery, search: orderQuery.search || globalSearch }).then(setOrderResult);
  }, [api, orderQuery, globalSearch]);

  useEffect(() => {
    void api.getTasks({ ...taskQuery, search: taskQuery.search || globalSearch }).then(setTaskResult);
  }, [api, taskQuery, globalSearch]);

  useEffect(() => {
    void api.getOperationLogs({ ...operationLogQuery, search: operationLogQuery.search || globalSearch }).then(setOperationLogResult);
  }, [api, operationLogQuery, globalSearch]);

  useEffect(() => {
    void api.getKnowledgeDocuments({ ...documentQuery, search: documentQuery.search || globalSearch }).then(setDocumentResult);
  }, [api, documentQuery, globalSearch]);

  useEffect(() => {
    void api.getRagRuns({ ...ragRunQuery, search: ragRunQuery.search || globalSearch }).then(setRagRunResult);
  }, [api, ragRunQuery, globalSearch]);

  useEffect(() => {
    void api.getFaqs().then(setFaqList);
    void api.getReplyTemplates().then(setReplyTemplates);
    void api.getBusinessRules().then(setBusinessRules);
    void api.getPolicyDocs().then(setPolicyDocs);
  }, [api]);

  useEffect(() => {
    queueMicrotask(() => {
      setKnowledgeBases(prev => prev.map(item => {
        if (!item.id.startsWith('KB-')) return item;
        if (item.id.startsWith('KB-CUSTOM-')) return {
          ...item,
          documentCount: item.documentIds.length,
          updatedAt: item.updatedAt || nowUiStamp(),
        };
        const refreshed = createSeedKnowledgeBases(snapshot).find(seed => seed.id === item.id);
        return refreshed ?? item;
      }));
    });
  }, [snapshot]);

  const legacyCustomers = snapshot.customers.map(toLegacyCustomer);
  const legacyTickets = snapshot.tickets.map(toLegacyTicket);

  const effectiveScenarioPolicies = useMemo(
    () => buildEffectiveScenarioPolicies(snapshot.scenarioModelConfigs, snapshot.pipelineNodeConfigs),
    [snapshot.scenarioModelConfigs, snapshot.pipelineNodeConfigs],
  );
  const effectiveNodePolicies = useMemo(
    () => buildEffectiveNodePolicies(snapshot.capabilityPipeline, snapshot.pipelineNodeConfigs, snapshot.scenarioModelConfigs),
    [snapshot.capabilityPipeline, snapshot.pipelineNodeConfigs, snapshot.scenarioModelConfigs],
  );
  const routingSummary = useMemo(
    () => buildDerivedRoutingSummary(snapshot.aiEnvironment, snapshot.ragConfig, effectiveScenarioPolicies, effectiveNodePolicies),
    [snapshot.aiEnvironment, snapshot.ragConfig, effectiveScenarioPolicies, effectiveNodePolicies],
  );

  const aiConsole = {
    environment: snapshot.aiEnvironment,
    guardrails: snapshot.guardrails,
    aiOpsStages: snapshot.aiOpsStages,
    ingestionDocuments: snapshot.ingestionDocuments,
    ragConfig: snapshot.ragConfig,
    ragTestRuns: snapshot.ragTestRuns,
    scenarioModelConfigs: snapshot.scenarioModelConfigs,
    pipelineNodeConfigs: snapshot.pipelineNodeConfigs,
    effectiveScenarioPolicies,
    effectiveNodePolicies,
    routingSummary,
    evaluations: snapshot.evaluations,
    jobs: snapshot.ingestionJobs,
    feedbackLoop: snapshot.feedbackLoop,
    auditLogs: snapshot.auditLogs,
    serviceHealth: snapshot.serviceHealth,
  };

  async function createKnowledgeDocumentFlow(payload: Parameters<typeof api.createKnowledgeDocument>[0]) {
    const result = await refreshWith(api.createKnowledgeDocument(payload));
    const documentId = result.document.id;
    if (result.document.publishStatus === 'version_conflict') {
      pushToast('已创建知识接入任务，当前文档因版本冲突进入失败分支', 'warning');
      return result;
    }
    const updateIngestionProgress = (delay: number, updater: (prev: ServiceHubSnapshot) => ServiceHubSnapshot) => {
      setTimeout(() => {
        setSnapshot(prev => updater(prev));
      }, delay);
    };
    updateIngestionProgress(700, prev => ({
      ...prev,
      ingestionDocuments: prev.ingestionDocuments.map(item => item.documentId === documentId ? { ...item, parseStatus: 'parsing', lastSync: new Date().toISOString().slice(0, 16).replace('T', ' ') } : item),
    }));
    updateIngestionProgress(1400, prev => ({
      ...prev,
      ingestionDocuments: prev.ingestionDocuments.map(item => item.documentId === documentId ? { ...item, parseStatus: 'parsed', parsedText: `文档《${item.documentName}》解析完成，已保留结构、标题与表格信息。`, lastSync: new Date().toISOString().slice(0, 16).replace('T', ' ') } : item),
    }));
    updateIngestionProgress(2200, prev => ({
      ...prev,
      ingestionDocuments: prev.ingestionDocuments.map(item => item.documentId === documentId ? { ...item, chunkStatus: 'chunking', chunkCount: 18, chunkIds: Array.from({ length: 18 }, (_, index) => `ING-CHUNK-${index + 1}`), lastSync: new Date().toISOString().slice(0, 16).replace('T', ' ') } : item),
    }));
    updateIngestionProgress(3000, prev => ({
      ...prev,
      ingestionDocuments: prev.ingestionDocuments.map(item => item.documentId === documentId ? { ...item, chunkStatus: 'indexed', embeddingStatus: 'embedded', vectorCount: item.chunkCount || 18, lastSync: new Date().toISOString().slice(0, 16).replace('T', ' ') } : item),
      knowledgeDocuments: prev.knowledgeDocuments.map(item => item.id === documentId ? { ...item, chunkCount: 18, vectorCount: 18, coverageScore: 78 } : item),
    }));
    updateIngestionProgress(3800, prev => ({
      ...prev,
      ingestionDocuments: prev.ingestionDocuments.map(item => item.documentId === documentId ? { ...item, embeddingStatus: 'indexed', indexStatus: 'published', lastSync: new Date().toISOString().slice(0, 16).replace('T', ' ') } : item),
      knowledgeDocuments: prev.knowledgeDocuments.map(item => item.id === documentId ? { ...item, publishStatus: 'published', chunkCount: 18, vectorCount: 18, coverageScore: 86 } : item),
      ingestionJobs: prev.ingestionJobs.map(item => item.documentId === documentId ? { ...item, status: 'published', detail: '文档已完成解析、切片、向量化并发布，可参与检索。', updatedAt: new Date().toISOString() } : item),
    }));
    pushToast('已创建知识接入任务', 'success');
    return result;
  }

  async function submitKnowledgeImportFlow() {
    const nextRagConfig = {
      ...snapshot.ragConfig,
      parser: structuredClone(knowledgeWizardDraft.parser),
      chunking: structuredClone(knowledgeWizardDraft.chunking),
      retrieval: structuredClone(knowledgeWizardDraft.retrieval),
    };
    await refreshWith(api.updateRagConfig({ ragConfig: nextRagConfig }));

    const result = await createKnowledgeDocumentFlow({
      name: knowledgeWizardDraft.documentName || knowledgeWizardDraft.fileName || `${displayScenario(knowledgeWizardDraft.scenario)}资料-${Date.now()}.md`,
      sourceType: knowledgeWizardDraft.fileName.split('.').pop()?.toUpperCase() || 'MD',
      knowledgeType: knowledgeWizardDraft.knowledgeType,
      scenario: knowledgeWizardDraft.scenario,
      language: knowledgeWizardDraft.language,
      owner: knowledgeWizardDraft.owner,
      version: knowledgeWizardDraft.version,
      effectiveDate: knowledgeWizardDraft.effectiveDate,
    });
    const document = result.document;
    const targetId = knowledgeWizardDraft.knowledgeBaseId ?? selectedKnowledgeBaseId;
    if (targetId && document) {
      setKnowledgeBases(prev => prev.map(item => item.id === targetId ? {
        ...item,
        documentIds: item.documentIds.includes(document.id) ? item.documentIds : [document.id, ...item.documentIds],
        documentCount: item.documentIds.includes(document.id) ? item.documentIds.length : item.documentIds.length + 1,
        updatedAt: nowUiStamp(),
        status: item.status === 'draft' ? 'active' : item.status,
      } : item));
    }

    setKnowledgeWizardStep(3);
    setKnowledgeFlow('wizard');
    setKnowledgeProcessingResult({
      status: 'processing',
      knowledgeBaseId: targetId ?? null,
      documentId: document.id,
      documentName: document.name,
      sourceLabel: knowledgeWizardDraft.fileName || '已导入文本',
      chunkCount: 0,
      vectorCount: 0,
      indexMode: knowledgeWizardDraft.retrieval.rerankerEnabled ? '高质量检索' : '经济检索',
      processedAt: nowUiStamp(),
    });

    setTimeout(() => {
      if (document.publishStatus === 'version_conflict') {
        setKnowledgeProcessingResult(prev => prev && prev.documentId === document.id ? {
          ...prev,
          status: 'failed',
          failureReason: document.parseError ?? '处理链路检测到版本冲突，当前文档未进入可发布状态。',
          processedAt: nowUiStamp(),
        } : prev);
        return;
      }
      setKnowledgeProcessingResult(prev => prev && prev.documentId === document.id ? {
        ...prev,
        status: 'success',
        chunkCount: Math.max(18, Math.round(knowledgeWizardDraft.chunking.chunkSize / 56)),
        vectorCount: Math.max(18, Math.round(knowledgeWizardDraft.chunking.chunkSize / 56)),
        processedAt: nowUiStamp(),
      } : prev);
    }, 2200);

    return result;
  }

  function navigateToPage(page: NavKey) {
    if (page === 'knowledge') {
      setCurrentPage('knowledge');
      return;
    }
    if (page === 'ai-console-ingestion') {
      const fallbackKnowledgeBaseId = selectedKnowledgeBaseId ?? knowledgeBases[0]?.id ?? null;
      if (fallbackKnowledgeBaseId) setSelectedKnowledgeBaseId(fallbackKnowledgeBaseId);
      setKnowledgeFlow('detail');
      setKnowledgeDetailTab('ingestion');
      setCurrentPage('knowledge');
      return;
    }
    if (page === 'ai-console-rag-config') {
      setAIConsolePage('rag-config');
      setCurrentPage('ai-console-rag-config');
      return;
    }
    if (page === 'ai-console-scenario-policy') {
      setAIConsolePage('scenario-policy');
      setScenarioSettingsTab('scenario');
      setCurrentPage('ai-console-scenario-policy');
      return;
    }
    if (page === 'ai-console-capability-nodes') {
      setAIConsolePage('scenario-policy');
      setScenarioSettingsTab('nodes');
      setCurrentPage('ai-console-scenario-policy');
      return;
    }
    if (page === 'ai-console-rag-test-lab') {
      setAIConsolePage('rag-test-lab');
      setCurrentPage('ai-console-rag-test-lab');
      return;
    }
    if (page === 'ai-console-evaluation-feedback') {
      setAIConsolePage('evaluation-feedback');
      setEvaluationCenterTab('evaluation');
      setCurrentPage('ai-console-evaluation-feedback');
      return;
    }
    if (page === 'ai-console-service-health') {
      setAIConsolePage('service-health');
      setCurrentPage('ai-console-service-health');
      return;
    }
    if (page === 'ai-console-audit-logs') {
      setAIConsolePage('evaluation-feedback');
      setEvaluationCenterTab('audit');
      setCurrentPage('ai-console-evaluation-feedback');
      return;
    }
    setCurrentPage(page);
  }

  function openOverviewTarget(target: OverviewNavigationTarget) {
    if (target.page === 'service' || target.page === 'tickets') {
      if (target.ticketId) setSelectedTicketId(target.ticketId);
      setTicketQuery(prev => ({
        ...prev,
        page: 1,
        search: target.search ?? target.ticketId ?? '',
        filters: target.ticketFilters ? { ...target.ticketFilters } : {},
      }));
    }
    if (target.page === 'customers') {
      if (target.customerId) setSelectedCustomerId(target.customerId);
      setCustomerQuery(prev => ({
        ...prev,
        page: 1,
        search: target.search ?? target.customerId ?? '',
        filters: target.customerFilters ? { ...target.customerFilters } : {},
      }));
    }
    if (target.page === 'orders') {
      if (target.orderId) setSelectedOrderId(target.orderId);
      setOrderQuery(prev => ({
        ...prev,
        page: 1,
        search: target.search ?? target.orderId ?? '',
        filters: target.orderFilters ? { ...target.orderFilters } : {},
      }));
    }
    navigateToPage(target.page);
  }

  return {
    snapshot,
    api,
    overview,
    aiConsole,
    aiConsoleBusinessCase,
    lang,
    setLang,
    currentPage,
    setCurrentPage: navigateToPage,
    selectedTicketId,
    setSelectedTicketId,
    selectedCustomerId,
    setSelectedCustomerId,
    selectedOrderId,
    setSelectedOrderId,
    aiConsolePage,
    setAIConsolePage,
    knowledgeBases,
    selectedKnowledgeBase,
    selectedKnowledgeBaseId,
    setSelectedKnowledgeBaseId,
    knowledgeFlow,
    knowledgeDetailTab,
    scenarioSettingsTab,
    setScenarioSettingsTab,
    evaluationCenterTab,
    setEvaluationCenterTab,
    knowledgeWizardStep,
    knowledgeWizardDraft,
    knowledgeProcessingResult,
    settingsTab,
    setSettingsTab,
    replyText,
    setReplyText,
    globalSearch,
    setGlobalSearch,
    toasts,
    pushToast,
    legacyCustomers,
    legacyTickets,
    customerQuery,
    setCustomerQuery,
    customerResult,
    ticketQuery,
    setTicketQuery,
    ticketResult,
    orderQuery,
    setOrderQuery,
    orderResult,
    taskQuery,
    setTaskQuery,
    taskResult,
    operationLogQuery,
    setOperationLogQuery,
    operationLogResult,
    documentQuery,
    setDocumentQuery,
    documentResult,
    ragRunQuery,
    setRagRunQuery,
    ragRunResult,
    faqList,
    replyTemplates,
    businessRules,
    policyDocs,
    openOverviewTarget,
    createKnowledgeBase(name?: string) {
      const nextId = `KB-CUSTOM-${Date.now()}`;
      const knowledgeBase: KnowledgeBaseRecord = {
        id: nextId,
        name: name?.trim() || `新知识库 ${knowledgeBases.filter(item => item.id.startsWith('KB-CUSTOM-')).length + 1}`,
        description: '用于承接新导入的业务资料、流程说明或场景 SOP。',
        icon: 'KB',
        tags: ['待整理'],
        documentCount: 0,
        updatedAt: nowUiStamp(),
        owner: '知识运营',
        source: 'service_api',
        status: 'draft',
        documentIds: [],
      };
      setKnowledgeBases(prev => [knowledgeBase, ...prev]);
      setSelectedKnowledgeBaseId(knowledgeBase.id);
      setKnowledgeDetailTab('documents');
      setKnowledgeFlow('detail');
      pushToast('已创建知识库', 'success');
    },
    openKnowledgeBase(id: string) {
      setSelectedKnowledgeBaseId(id);
      setKnowledgeDetailTab('documents');
      setKnowledgeFlow('detail');
    },
    backToKnowledgeList() {
      setKnowledgeFlow('list');
      setKnowledgeProcessingResult(null);
      setKnowledgeWizardStep(1);
    },
    setKnowledgeDetailTab,
    startKnowledgeImport(knowledgeBaseId?: string) {
      const targetId = knowledgeBaseId ?? selectedKnowledgeBaseId ?? knowledgeBases[0]?.id ?? null;
      setSelectedKnowledgeBaseId(targetId);
      setKnowledgeWizardDraft(createKnowledgeWizardDraft(snapshot, targetId));
      setKnowledgeProcessingResult(null);
      setKnowledgeWizardStep(1);
      setKnowledgeFlow('wizard');
    },
    updateKnowledgeWizardDraft(updater: (prev: KnowledgeWizardDraft) => KnowledgeWizardDraft) {
      setKnowledgeWizardDraft(prev => updater(prev));
    },
    setKnowledgeWizardStep,
    submitKnowledgeImport: submitKnowledgeImportFlow,
    finishKnowledgeImport(options?: { continueImport?: boolean; openRagTest?: boolean }) {
      if (options?.openRagTest) {
        setKnowledgeFlow('detail');
        setKnowledgeDetailTab('retrieval-test');
        setCurrentPage('ai-console-rag-test-lab');
        return;
      }
      if (options?.continueImport) {
        const targetId = knowledgeProcessingResult?.knowledgeBaseId ?? selectedKnowledgeBaseId;
        const refreshedDraft = createKnowledgeWizardDraft(snapshot, targetId ?? null);
        setKnowledgeWizardDraft(refreshedDraft);
        setKnowledgeWizardStep(1);
        setKnowledgeProcessingResult(null);
        setKnowledgeFlow('wizard');
        return;
      }
      setKnowledgeFlow('detail');
      setKnowledgeDetailTab('documents');
      setKnowledgeWizardStep(1);
      setKnowledgeProcessingResult(null);
    },
    async runRetrieve(ticketId: string) {
      const result = await refreshWith(api.retrieveTicket({ ticketId }));
      pushToast('已重新执行检索链路', 'info');
      return result;
    },
    async runDraft(ticketId: string) {
      const result = await refreshWith(api.draftTicket({ ticketId }));
      const draft = result.draft;
      if (draft) setReplyText(draft.content);
      pushToast('已载入 AI 草稿', 'success');
      return result;
    },
    insertDraftToReply(ticketId: string) {
      const ticket = snapshot.tickets.find(item => item.id === ticketId);
      const draft = ticket ? snapshot.replyDrafts.find(item => item.id === ticket.draftId) : undefined;
      if (!draft) {
        pushToast('当前工单暂无可插入的 AI 建议', 'warning');
        return;
      }
      setReplyText(draft.content);
      pushToast('已插入 AI 建议', 'success');
    },
    async sendReply(ticketId: string) {
      const result = await refreshWith(api.sendTicketReply({ ticketId, content: replyText, agentName: '你' }));
      if (result.guardrail?.blocked) {
        pushToast('当前场景必须先完成人工复核，再由人工发送', 'warning');
        return result;
      }
      setReplyText('');
      pushToast('已由人工发送客户回复', 'success');
      return result;
    },
    async saveReplyDraft(ticketId: string) {
      if (!replyText.trim()) {
        pushToast('没有可保存的内容', 'warning');
        return null;
      }
      const result = await refreshWith(api.saveTicketDraft({ ticketId, content: replyText }));
      pushToast('已保存回复草稿', 'success');
      return result;
    },
    async closeTicket(ticketId: string) {
      const result = await refreshWith(api.closeTicket({ ticketId, actor: '你' }));
      pushToast(result.message, result.blocked ? 'warning' : 'success');
      return result;
    },
    async runReview(ticketId: string, decision: 'approved' | 'rejected' | 'escalated') {
      const result = await refreshWith(api.reviewTicket({ ticketId, decision, reviewer: '你', reason: decision === 'approved' ? '模拟人工复核：通过' : decision === 'escalated' ? '模拟人工复核：升级处理' : '模拟人工复核：驳回' }));
      pushToast(decision === 'approved' ? '已通过人工复核' : decision === 'escalated' ? '已升级至人工处理' : '已退回复核', decision === 'approved' ? 'success' : 'warning');
      return result;
    },
    async runAction(ticketId: string, actionId: string) {
      const result = await refreshWith(api.runTicketAction({ ticketId, actionId }));
      pushToast(result.action?.status === 'completed' ? '内部动作已执行完成' : '内部动作已被策略拦截', result.action?.status === 'completed' ? 'success' : 'warning');
      return result;
    },
    createKnowledgeDocument: createKnowledgeDocumentFlow,
    async runIngestionAction(documentId: string, action: 'view_parsed_text' | 'view_chunks' | 'rebuild_embedding' | 'publish' | 'disable') {
      const result = await refreshWith(api.runIngestionAction({ documentId, action }));
      pushToast(result.message, action === 'disable' ? 'warning' : 'info');
      return result;
    },
    async reindexKnowledgeDocument(id: string) {
      const result = await refreshWith(api.reindexKnowledgeDocument(id));
      pushToast('已处理重建索引请求', 'info');
      return result;
    },
    async updateRagConfig(ragConfig: RagConfigSnapshot) {
      const result = await refreshWith(api.updateRagConfig({ ragConfig }));
      pushToast('已更新 RAG 配置', 'success');
      return result;
    },
    async updateScenarioModelConfig(config: ServiceHubSnapshot['scenarioModelConfigs'][number]) {
      const result = await refreshWith(api.updateScenarioModelConfig({ config }));
      pushToast('已更新场景策略', 'success');
      return result;
    },
    async updatePipelineNodeConfig(config: ServiceHubSnapshot['pipelineNodeConfigs'][number]) {
      const result = await refreshWith(api.updatePipelineNodeConfig({ config }));
      pushToast('已更新能力节点配置', 'success');
      return result;
    },
    async runRagTest(payload: { customerQuestion: string; customerId: string; scenario: string; language: string; relatedOrderId: string }) {
      const result = await refreshWith(api.runRagTest(payload));
      pushToast('已完成 RAG 调试运行', 'success');
      return result;
    },
    async refreshServiceHealth() {
      const result = await refreshWith(api.refreshServiceHealth());
      pushToast('已刷新运行状态', 'info');
      return result.serviceHealth;
    },
    async runServiceHealthCheck() {
      const result = await refreshWith(api.runServiceHealthCheck());
      pushToast('已完成健康检查', 'success');
      return result.result;
    },
    async retryFailedJobs() {
      const result = await refreshWith(api.retryFailedIngestionJobs());
      pushToast(result.retriedJobs.length > 0 ? `已重试 ${result.retriedJobs.length} 个失败任务` : '当前没有失败任务需要重试', result.retriedJobs.length > 0 ? 'success' : 'info');
      return { retriedJobs: result.retriedJobs };
    },
    async rebuildVectorIndex() {
      const result = await refreshWith(api.rebuildVectorIndex());
      pushToast(result.message, 'info');
      return { message: result.message };
    },
    async viewServiceHealthLastError(id?: string) {
      const error = await api.getServiceHealthLastError(id);
      pushToast(error ? `${error.source}: ${error.message}` : '当前没有可查看的错误', error ? 'warning' : 'info');
      return error;
    },
    toggleCapability(id: string) {
      const nodeIdByCapability: Record<string, string> = {
        'issue-classification': 'intent-classification',
        'crm-policy-link': 'policy-check',
        'retrieval-debugger': 'knowledge-retrieval',
        'review-gating': 'human-review-routing',
        'knowledge-gap-detection': 'feedback-capture',
      };
      const targetNodeId = nodeIdByCapability[id];
      if (!targetNodeId) return;
      setSnapshot(prev => ({
        ...prev,
        aiCapabilities: prev.aiCapabilities.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item),
        pipelineNodeConfigs: prev.pipelineNodeConfigs.map(item => item.nodeId === targetNodeId ? { ...item, enabled: !item.enabled, updatedAt: nowUiStamp() } : item),
        capabilityPipeline: prev.capabilityPipeline.map(item => item.id === targetNodeId ? { ...item, enabled: !item.enabled } : item),
      }));
      pushToast('已同步能力节点启停状态', 'info');
    },
  };
}
