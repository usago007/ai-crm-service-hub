import type { Dispatch, SetStateAction } from 'react';
import type {
  AIConsolePageKey,
  CustomerFilters,
  KnowledgeBaseRecord,
  KnowledgeDetailTab,
  KnowledgeFlow,
  ListQuery,
  NavKey,
  OrderFilters,
  OverviewNavigationTarget,
  ScenarioSettingsTab,
  EvaluationCenterTab,
  TicketFilters,
} from '../../types';

interface NavigationWorkflowControls {
  selectedKnowledgeBaseId: string | null;
  knowledgeBases: KnowledgeBaseRecord[];
  setCurrentPage: Dispatch<SetStateAction<NavKey>>;
  setAIConsolePage: Dispatch<SetStateAction<AIConsolePageKey>>;
  setScenarioSettingsTab: Dispatch<SetStateAction<ScenarioSettingsTab>>;
  setEvaluationCenterTab: Dispatch<SetStateAction<EvaluationCenterTab>>;
  setSelectedKnowledgeBaseId: Dispatch<SetStateAction<string | null>>;
  setKnowledgeFlow: Dispatch<SetStateAction<KnowledgeFlow>>;
  setKnowledgeDetailTab: Dispatch<SetStateAction<KnowledgeDetailTab>>;
}

export function applyPageNavigation(page: NavKey, controls: NavigationWorkflowControls) {
  const {
    knowledgeBases,
    selectedKnowledgeBaseId,
    setAIConsolePage,
    setCurrentPage,
    setEvaluationCenterTab,
    setKnowledgeDetailTab,
    setKnowledgeFlow,
    setScenarioSettingsTab,
    setSelectedKnowledgeBaseId,
  } = controls;

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

interface OverviewNavigationControls {
  navigateToPage: (page: NavKey) => void;
  setSelectedTicketId: Dispatch<SetStateAction<string | null>>;
  setSelectedCustomerId: Dispatch<SetStateAction<string | null>>;
  setSelectedOrderId: Dispatch<SetStateAction<string | null>>;
  setTicketQuery: Dispatch<SetStateAction<ListQuery<TicketFilters>>>;
  setCustomerQuery: Dispatch<SetStateAction<ListQuery<CustomerFilters>>>;
  setOrderQuery: Dispatch<SetStateAction<ListQuery<OrderFilters>>>;
}

export function openOverviewNavigationTarget(target: OverviewNavigationTarget, controls: OverviewNavigationControls) {
  const {
    navigateToPage,
    setCustomerQuery,
    setOrderQuery,
    setSelectedCustomerId,
    setSelectedOrderId,
    setSelectedTicketId,
    setTicketQuery,
  } = controls;

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
