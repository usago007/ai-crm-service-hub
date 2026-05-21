export type NavKey = 'overview' | 'service' | 'tickets' | 'customers' | 'orders' | 'knowledge' | 'ai-assistant' | 'ai-operations' | 'tasks' | 'analytics' | 'settings';

export type TicketStatus = 'New' | 'In Progress' | 'Pending Review' | 'Waiting Customer' | 'Closed' | 'Escalated';
export type Priority = 'Urgent' | 'High' | 'Normal' | 'Low';
export type IssueType =
  | 'Shipping Delay' | 'Refund Request' | 'Product Inquiry' | 'Coupon Issue'
  | 'Payment Issue' | 'Payment Failed' | 'Complaint' | 'Address Change'
  | 'Return Request' | 'VIP Support' | 'Order Cancellation' | 'Reorder Request';
export type TicketChannel = 'Email' | 'Live Chat' | 'Ticket';
export type MessageSender = 'customer' | 'agent' | 'system';
export type MessageType = 'text' | 'system';

export interface Customer {
  id: string;
  name: string;
  email: string;
  country: string;
  language: string;
  type: string;
  totalOrders: number;
  lifetimeValue: number;
  lastContact: string;
  tags: string[];
  avatarColor: string;
  riskFlags: string[];
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  date: string;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  carrier: string;
  tracking: string;
  latestEvent: string;
  daysSinceUpdate: number;
  riskAlert: string;
  items: OrderItem[];
}

export interface Ticket {
  id: string;
  customerId: string;
  channel: TicketChannel;
  issueType: IssueType;
  priority: Priority;
  status: TicketStatus;
  assignee: string;
  sla: string;
  aiSummary: string;
  aiSuggested: boolean;
  needsReview: boolean;
  lastUpdated: string;
  summary: string;
}

export interface Message {
  ticketId: string;
  sender: MessageSender;
  type: MessageType;
  content: string;
  timestamp: string;
}

export interface FAQ {
  id: string;
  question: string;
  category: string;
  answerSummary: string;
  language: string;
  status: string;
  usageCount: number;
  matchAccuracy: number;
}

export interface ReplyTemplate {
  id: string;
  name: string;
  scenario: string;
  language: string;
  tone: string;
  status: string;
  usageCount: number;
  content: string;
}

export interface BusinessRule {
  id: string;
  name: string;
  scenario: string;
  trigger: string;
  aiPermission: string;
  manualReviewRequired: string;
  status: string;
}

export interface FollowUpTask {
  id: string;
  description: string;
  customerId: string;
  ticketId: string;
  due: string;
  priority: Priority;
  triggeredBy: string;
  status: string;
  owner: string;
}

export interface PolicyDoc {
  name: string;
  description: string;
  version: string;
  updated: string;
}

export interface AISuggestion {
  content: string;
  confidence: number;
  sources: { name: string; match: string }[];
  needsReview: boolean;
}

export interface AnalyticsMetric {
  label: string;
  value: string;
  trend: string;
  direction: 'up' | 'down';
  subtitle: string;
  color: string;
}

export interface AnalyticsData {
  metrics: AnalyticsMetric[];
  ticketVolume: { labels: string[]; values: number[] };
  channelDist: { label: string; value: number; color: string }[];
  issueDist: { label: string; value: number; color: string }[];
  aiAdoptionTrend: { label: string; value: number }[];
  topFAQ: { label: string; count: number }[];
  manualReviewBreakdown: { label: string; pct: number }[];
}

export interface AICapability {
  id: string;
  name: string;
  enabled: boolean;
  desc: string;
}

export interface PermissionBoundary {
  scenario: string;
  aiSuggest: string;
  aiSend: string;
  manualReview: string;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  user: string;
  time: string;
  detail: string;
}

export interface Agent {
  name: string;
  role: string;
}

export interface SettingsData {
  general: { language: string; timezone: string; notifications: string };
  ai: { model: string; temperature: number; maxTokens: number; language: string };
  team: Agent[];
  channels: Record<string, boolean>;
  notifications: Record<string, boolean>;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
