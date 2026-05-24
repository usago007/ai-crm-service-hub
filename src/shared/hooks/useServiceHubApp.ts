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
  KnowledgeWizardDraft,
  KnowledgeWizardStep,
  ListQuery,
  NavKey,
  OrderFilters,
  PagedResult,
  PolicyDoc,
  RagConfigSnapshot,
  RagRunFilters,
  ReplyTemplate,
  AIConsolePageKey,
  ServiceHubSnapshot,
  ServiceTicket,
  TicketFilters,
  Toast,
} from '../../types';
import type { Language } from '../../i18n';
import { toLegacyCustomer, toLegacyTicket } from '../lib/serviceHubMappers';
import { displayScenario } from '../../utils/display';
import {
  buildDerivedRoutingSummary,
  buildEffectiveNodePolicies,
  buildEffectiveScenarioPolicies,
} from '../lib/aiConsolePolicy';

const emptyPaged = <T,>(pageSize: number): PagedResult<T> => ({ items: [], total: 0, page: 1, pageSize, totalPages: 1 });

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
      icon: '📦',
      owner: '知识运营',
      tags: ['物流', '退款', '支付'],
      status: 'active',
      scenarios: ['Shipping', 'Refund', 'Payment'],
    },
    {
      id: 'KB-ESC',
      name: '投诉与升级知识库',
      description: '聚焦投诉、赔偿、拒付场景，突出高风险规则、审批边界与升级指引。',
      icon: '🛡',
      owner: '风险运营',
      tags: ['投诉', '赔偿', '拒付'],
      status: 'syncing',
      scenarios: ['Complaint', 'Compensation', 'Chargeback'],
    },
    {
      id: 'KB-PROD',
      name: '商品与服务知识库',
      description: '面向商品咨询、促销说明与客服话术，兼顾规格、FAQ 与模板复用。',
      icon: '🤖',
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
  const [currentPage, setCurrentPage] = useState<NavKey>('service');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>('TKT-001');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [aiConsolePage, setAIConsolePage] = useState<AIConsolePageKey>('ingestion');
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseRecord[]>(() => createSeedKnowledgeBases(createMockSnapshot()));
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<string | null>('KB-OPS');
  const [knowledgeFlow, setKnowledgeFlow] = useState<KnowledgeFlow>('list');
  const [knowledgeDetailTab, setKnowledgeDetailTab] = useState<KnowledgeDetailTab>('documents');
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
  const [documentQuery, setDocumentQuery] = useState<ListQuery<DocumentFilters>>({ page: 1, pageSize: 8, sortBy: 'scenario', sortOrder: 'asc', search: '', filters: {} });
  const [ragRunQuery, setRagRunQuery] = useState<ListQuery<RagRunFilters>>({ page: 1, pageSize: 8, sortBy: 'createdAt', sortOrder: 'desc', search: '', filters: {} });

  const [customerResult, setCustomerResult] = useState<PagedResult<ServiceHubSnapshot['customers'][number]>>(emptyPaged(8));
  const [ticketResult, setTicketResult] = useState<PagedResult<ServiceTicket>>(emptyPaged(10));
  const [orderResult, setOrderResult] = useState<PagedResult<ServiceHubSnapshot['orders'][number]>>(emptyPaged(10));
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

  return {
    snapshot,
    api,
    aiConsole,
    lang,
    setLang,
    currentPage,
    setCurrentPage,
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
    createKnowledgeBase(name?: string) {
      const nextId = `KB-CUSTOM-${Date.now()}`;
      const knowledgeBase: KnowledgeBaseRecord = {
        id: nextId,
        name: name?.trim() || `新知识库 ${knowledgeBases.filter(item => item.id.startsWith('KB-CUSTOM-')).length + 1}`,
        description: '用于承接新导入的业务资料、流程说明或场景 SOP。',
        icon: '🧠',
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
