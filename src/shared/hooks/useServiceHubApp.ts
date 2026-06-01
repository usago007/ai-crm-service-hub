import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createMockServiceHubApi } from '../../api/adapters/mockServiceHub';
import { createMockSnapshot } from '../../mocks/fixtures/serviceHub';
import type {
  CustomerFilters,
  DocumentFilters,
  KnowledgeBaseRecord,
  KnowledgeDetailTab,
  KnowledgeFlow,
  KnowledgeProcessingResult,
  EvaluationCenterTab,
  KnowledgeWizardDraft,
  KnowledgeWizardStep,
  NavKey,
  OperationLogFilters,
  OrderFilters,
  OverviewNavigationTarget,
  OverviewSnapshot,
  PagedResult,
  PermissionBoundary,
  RagConfigSnapshot,
  RagRunFilters,
  AIConsolePageKey,
  ScenarioSettingsTab,
  ServiceHubSnapshot,
  TaskFilters,
  TicketFilters,
} from '../../types';
import type { Language } from '../../i18n';
import { toLegacyCustomer, toLegacyTicket } from '../lib/serviceHubMappers';
import {
  buildDerivedRoutingSummary,
  buildEffectiveNodePolicies,
  buildEffectiveScenarioPolicies,
} from '../lib/aiConsolePolicy';
import type { AIConsoleBusinessCase } from '../../pages/ai-console/types';
import { buildOverviewSnapshot } from '../selectors/overviewViewModel';
import { useKnowledgeWorkflow } from './useKnowledgeWorkflow';
import { useListQueryState } from './useListQueryState';
import { useTicketWorkflow } from './useTicketWorkflow';
import { useToastQueue } from './useToastQueue';
import { formatUiTimestamp } from '../lib/time';
import { createKnowledgeWizardDraft, createSeedKnowledgeBases } from '../workflows/knowledgeWorkflow';
import { applyPageNavigation, openOverviewNavigationTarget } from '../workflows/navigationWorkflow';

const emptyPaged = <T,>(pageSize: number): PagedResult<T> => ({ items: [], total: 0, page: 1, pageSize, totalPages: 1 });
const nowUiStamp = formatUiTimestamp;

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
  const { toasts, pushToast } = useToastQueue();

  const [customerQuery, setCustomerQuery] = useListQueryState<CustomerFilters>(8, 'name', 'asc');
  const [ticketQuery, setTicketQuery] = useListQueryState<TicketFilters>(10, 'lastUpdated', 'desc');
  const [orderQuery, setOrderQuery] = useListQueryState<OrderFilters>(10, 'date', 'desc');
  const [taskQuery, setTaskQuery] = useListQueryState<TaskFilters>(10, 'due', 'asc');
  const [operationLogQuery, setOperationLogQuery] = useListQueryState<OperationLogFilters>(10, 'timestampLabel', 'desc');
  const [documentQuery, setDocumentQuery] = useListQueryState<DocumentFilters>(8, 'scenario', 'asc');
  const [ragRunQuery, setRagRunQuery] = useListQueryState<RagRunFilters>(8, 'createdAt', 'desc');

  const queryClient = useQueryClient();
  const snapshotRef = useRef(snapshot);
  const apiRef = useRef(createMockServiceHubApi(snapshot));
  useEffect(() => {
    snapshotRef.current = snapshot;
    apiRef.current = createMockServiceHubApi(snapshot);
  }, [snapshot]);

  const { data: customerResult = emptyPaged(8) } = useQuery({
    queryKey: ['customers', customerQuery, globalSearch],
    queryFn: () => apiRef.current.getCustomers({ ...customerQuery, search: customerQuery.search || globalSearch }),
  });
  const { data: ticketResult = emptyPaged(10) } = useQuery({
    queryKey: ['tickets', ticketQuery, globalSearch],
    queryFn: () => apiRef.current.getTickets({ ...ticketQuery, search: ticketQuery.search || globalSearch }),
  });
  const { data: orderResult = emptyPaged(10) } = useQuery({
    queryKey: ['orders', orderQuery, globalSearch],
    queryFn: () => apiRef.current.getOrders({ ...orderQuery, search: orderQuery.search || globalSearch }),
  });
  const { data: taskResult = emptyPaged(10) } = useQuery({
    queryKey: ['tasks', taskQuery, globalSearch],
    queryFn: () => apiRef.current.getTasks({ ...taskQuery, search: taskQuery.search || globalSearch }),
  });
  const { data: operationLogResult = emptyPaged(10) } = useQuery({
    queryKey: ['operationLogs', operationLogQuery, globalSearch],
    queryFn: () => apiRef.current.getOperationLogs({ ...operationLogQuery, search: operationLogQuery.search || globalSearch }),
  });
  const { data: documentResult = emptyPaged(8) } = useQuery({
    queryKey: ['knowledgeDocuments', documentQuery, globalSearch],
    queryFn: () => apiRef.current.getKnowledgeDocuments({ ...documentQuery, search: documentQuery.search || globalSearch }),
  });
  const { data: ragRunResult = emptyPaged(8) } = useQuery({
    queryKey: ['ragRuns', ragRunQuery, globalSearch],
    queryFn: () => apiRef.current.getRagRuns({ ...ragRunQuery, search: ragRunQuery.search || globalSearch }),
  });
  const { data: refData } = useQuery({
    queryKey: ['referenceData'],
    queryFn: async () => {
      const [faqs, templates, rules, docs] = await Promise.all([
        apiRef.current.getFaqs(),
        apiRef.current.getReplyTemplates(),
        apiRef.current.getBusinessRules(),
        apiRef.current.getPolicyDocs(),
      ]);
      return { faqs, replyTemplates: templates, businessRules: rules, policyDocs: docs };
    },
    staleTime: 60_000,
  });
  const faqList = refData?.faqs ?? [];
  const replyTemplates = refData?.replyTemplates ?? [];
  const businessRules = refData?.businessRules ?? [];
  const policyDocs = refData?.policyDocs ?? [];

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
  const overview = useMemo<OverviewSnapshot>(() => buildOverviewSnapshot(snapshot), [snapshot]);

  function refreshWith<T extends { snapshot: ServiceHubSnapshot }>(promise: Promise<T>) {
    return promise.then(result => {
      setSnapshot(result.snapshot);
      queryClient.invalidateQueries();
      return result;
    });
  }

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

  function navigateToPage(page: NavKey) {
    applyPageNavigation(page, {
      knowledgeBases,
      selectedKnowledgeBaseId,
      setAIConsolePage,
      setCurrentPage,
      setEvaluationCenterTab,
      setKnowledgeDetailTab,
      setKnowledgeFlow,
      setScenarioSettingsTab,
      setSelectedKnowledgeBaseId,
    });
  }

  function openOverviewTarget(target: OverviewNavigationTarget) {
    openOverviewNavigationTarget(target, {
      navigateToPage,
      setCustomerQuery,
      setOrderQuery,
      setSelectedCustomerId,
      setSelectedOrderId,
      setSelectedTicketId,
      setTicketQuery,
    });
  }

  const ticketWorkflow = useTicketWorkflow({
    apiRef,
    snapshot,
    replyText,
    setReplyText,
    pushToast,
    refreshWith,
  });
  const knowledgeWorkflow = useKnowledgeWorkflow({
    apiRef,
    snapshot,
    knowledgeBases,
    selectedKnowledgeBaseId,
    knowledgeWizardDraft,
    knowledgeProcessingResult,
    setSnapshot,
    setKnowledgeBases,
    setSelectedKnowledgeBaseId,
    setKnowledgeFlow,
    setKnowledgeDetailTab,
    setKnowledgeWizardStep,
    setKnowledgeWizardDraft,
    setKnowledgeProcessingResult,
    setCurrentPage,
    pushToast,
    refreshWith,
  });

  return {
    snapshot,
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
    setKnowledgeDetailTab,
    setKnowledgeWizardStep,
    ...knowledgeWorkflow,
    ...ticketWorkflow,
    async runIngestionAction(documentId: string, action: 'view_parsed_text' | 'view_chunks' | 'rebuild_embedding' | 'publish' | 'disable') {
      const result = await refreshWith(apiRef.current.runIngestionAction({ documentId, action }));
      pushToast(result.message, action === 'disable' ? 'warning' : 'info');
      return result;
    },
    async reindexKnowledgeDocument(id: string) {
      const result = await refreshWith(apiRef.current.reindexKnowledgeDocument(id));
      pushToast('已处理重建索引请求', 'info');
      return result;
    },
    async updateRagConfig(ragConfig: RagConfigSnapshot) {
      const result = await refreshWith(apiRef.current.updateRagConfig({ ragConfig }));
      pushToast('已更新 RAG 配置', 'success');
      return result;
    },
    async updateScenarioModelConfig(config: ServiceHubSnapshot['scenarioModelConfigs'][number]) {
      try {
        const result = await refreshWith(apiRef.current.updateScenarioModelConfig({ config }));
        pushToast('已更新场景策略', 'success');
        return result;
      } catch (error) {
        pushToast(error instanceof Error ? error.message : '场景策略保存失败', 'warning');
        throw error;
      }
    },
    async updatePipelineNodeConfig(config: ServiceHubSnapshot['pipelineNodeConfigs'][number]) {
      const result = await refreshWith(apiRef.current.updatePipelineNodeConfig({ config }));
      pushToast('已更新能力节点配置', 'success');
      return result;
    },
    async runRagTest(payload: { customerQuestion: string; customerId: string; scenario: string; language: string; relatedOrderId: string }) {
      const result = await refreshWith(apiRef.current.runRagTest(payload));
      pushToast('已完成 RAG 调试运行', 'success');
      return result;
    },
    async refreshServiceHealth() {
      const result = await refreshWith(apiRef.current.refreshServiceHealth());
      pushToast('已刷新运行状态', 'info');
      return result.serviceHealth;
    },
    async runServiceHealthCheck() {
      const result = await refreshWith(apiRef.current.runServiceHealthCheck());
      pushToast('已完成健康检查', 'success');
      return result.result;
    },
    async retryFailedJobs() {
      const result = await refreshWith(apiRef.current.retryFailedIngestionJobs());
      pushToast(result.retriedJobs.length > 0 ? `已重试 ${result.retriedJobs.length} 个失败任务` : '当前没有失败任务需要重试', result.retriedJobs.length > 0 ? 'success' : 'info');
      return { retriedJobs: result.retriedJobs };
    },
    async rebuildVectorIndex() {
      const result = await refreshWith(apiRef.current.rebuildVectorIndex());
      pushToast(result.message, 'info');
      return { message: result.message };
    },
    async viewServiceHealthLastError(id?: string) {
      const error = await apiRef.current.getServiceHealthLastError(id);
      pushToast(error ? `${error.source}: ${error.message}` : '当前没有可查看的错误', error ? 'warning' : 'info');
      return error;
    },
    updateSettings(updater: (prev: ServiceHubSnapshot['settings']) => ServiceHubSnapshot['settings']) {
      setSnapshot(prev => ({ ...prev, settings: updater(prev.settings) }));
    },
    updatePermissionBoundaries(updater: (prev: PermissionBoundary[]) => PermissionBoundary[]) {
      setSnapshot(prev => ({ ...prev, permissionBoundaries: updater(prev.permissionBoundaries) }));
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
