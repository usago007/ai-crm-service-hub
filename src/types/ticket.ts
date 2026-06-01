import type { DraftSourceTrace, SendGuardrailResult } from './ai-console';
import type { Citation } from './knowledge';

export type TicketStatus = 'New' | 'In Progress' | 'Pending Review' | 'Waiting Customer' | 'Closed' | 'Escalated';
export type Priority = 'Urgent' | 'High' | 'Normal' | 'Low';
export type IssueType =
  | 'Shipping Delay'
  | 'Refund Request'
  | 'Product Inquiry'
  | 'Coupon Issue'
  | 'Payment Issue'
  | 'Payment Failed'
  | 'Complaint'
  | 'Address Change'
  | 'Return Request'
  | 'VIP Support'
  | 'Order Cancellation'
  | 'Reorder Request';
export type TicketChannel = 'Email' | 'Live Chat' | 'Ticket';
export type MessageSender = 'customer' | 'agent' | 'system';
export type MessageType = 'text' | 'system';
export type TicketWorkflowStage =
  | 'triage'
  | 'retrieve'
  | 'draft'
  | 'review'
  | 'execute'
  | 'follow-up'
  | 'resolved';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'escalated';
export type ActionStatus = 'pending' | 'blocked' | 'completed';

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

export interface ReplyDraft {
  id: string;
  language: string;
  confidence: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  content: string;
  explanation: string[];
  citations: Citation[];
  sourceTrace?: DraftSourceTrace;
}

export interface ReviewDecision {
  id: string;
  status: ReviewStatus;
  reviewer: string;
  reason: string;
  updatedAt: string;
}

export interface TicketAction {
  id: string;
  label: string;
  status: ActionStatus;
  owner: string;
  result: string;
}

export interface ExecutionOutcome {
  customerPromise: string;
  followUpNeeded: boolean;
  followUpAt?: string;
  finalState: string;
}

export interface ServiceTicket extends Ticket {
  workflowStage: TicketWorkflowStage;
  intent: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  region: string;
  manualReview: boolean;
  policyDecision: string;
  requiredAction: string;
  selectedKnowledgeIds: string[];
  retrievalRunId: string;
  draftId: string;
  reviewDecisionId: string;
  actionIds: string[];
  executionOutcome: ExecutionOutcome;
  lastReplyAt?: string;
  lastReplyBy?: string;
  draftSavedAt?: string;
  sendGuardrailResult?: SendGuardrailResult;
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

export interface TicketFilters {
  status?: string;
  workflowStage?: string;
  channel?: string;
  riskLevel?: string;
  assignee?: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  triggeredBy?: string;
}
