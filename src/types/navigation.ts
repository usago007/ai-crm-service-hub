import type { CustomerFilters, OrderFilters } from './customer';
import type { AnalyticsData } from './settings';
import type { TicketFilters } from './ticket';

export type NavKey =
  | 'overview'
  | 'service'
  | 'tickets'
  | 'customers'
  | 'orders'
  | 'knowledge'
  | 'system-operation-logs'
  | 'ai-console-ingestion'
  | 'ai-console-rag-config'
  | 'ai-console-scenario-policy'
  | 'ai-console-capability-nodes'
  | 'ai-console-rag-test-lab'
  | 'ai-console-evaluation-feedback'
  | 'ai-console-service-health'
  | 'ai-console-audit-logs'
  | 'tasks'
  | 'admin-settings'
  | 'admin-general'
  | 'admin-permissions';

export type AIConsolePageKey =
  | 'rag-config'
  | 'scenario-policy'
  | 'rag-test-lab'
  | 'evaluation-feedback'
  | 'service-health';

export interface OverviewNavigationTarget {
  page: NavKey;
  search?: string;
  ticketId?: string;
  customerId?: string;
  orderId?: string;
  ticketFilters?: Partial<TicketFilters>;
  customerFilters?: Partial<CustomerFilters>;
  orderFilters?: Partial<OrderFilters>;
}

export interface OverviewMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  target?: OverviewNavigationTarget;
}

export interface OverviewEventItem {
  id: string;
  title: string;
  detail: string;
  meta: string;
  tone: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  target: OverviewNavigationTarget;
}

export interface OverviewTodoItem {
  id: string;
  title: string;
  detail: string;
  badge: string;
  tone: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  target: OverviewNavigationTarget;
}

export interface OverviewShortcutItem {
  id: string;
  label: string;
  description: string;
  countLabel: string;
  tone: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  target: OverviewNavigationTarget;
}

export interface OverviewSnapshot {
  metrics: OverviewMetric[];
  analytics: AnalyticsData;
  events: OverviewEventItem[];
  todos: OverviewTodoItem[];
  shortcuts: OverviewShortcutItem[];
}
