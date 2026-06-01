import type {
  ServiceHubApi,
} from '../contracts/serviceHub';
import type {
  AdminSnapshot,
  AIConsoleSnapshot,
  CustomerFilters,
  CustomerProfile,
  FollowUpTask,
  GlobalOperationLogEntry,
  InsightsSnapshot,
  Order,
  OrderFilters,
  OperationLogFilters,
  TaskFilters,
  ServiceHubSnapshot,
  ServiceTicket,
  TicketFilters,
} from '../../types';
import { applySearch, cloneSnapshot, paginate, sortByKey, sortOperationLogs } from './mockServiceHub/shared';
import { createKnowledgeHandlers } from './mockServiceHub/knowledgeHandlers';
import { createRagHandlers } from './mockServiceHub/ragHandlers';
import { createServiceHealthHandlers } from './mockServiceHub/serviceHealthHandlers';
import { createTicketHandlers } from './mockServiceHub/ticketHandlers';

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
    ...createTicketHandlers(snapshot),
    ...createKnowledgeHandlers(snapshot),
    ...createRagHandlers(snapshot),
    ...createServiceHealthHandlers(snapshot),
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
