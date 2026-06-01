import type { CustomerProfile, Order, ReplyDraft, ReviewDecision, ServiceTicket } from '../../types';
import { displayFulfillmentStatus, displayIssueType, displayLanguage, displayPaymentStatus, displayRiskLevel, displayWorkflow } from '../../utils/display';

export interface ReviewChecklistItem {
  label: string;
  detail: string;
  status: 'Completed' | 'Pending' | 'Blocked';
}

export interface SlaProgress {
  diffMs: number;
  pct: number;
  barColor: string;
}

export function getSlaProgress(sla: string, nowMs: number): SlaProgress {
  const diffMs = new Date(sla).getTime() - nowMs;
  const totalWindowMs = 72 * 60 * 60 * 1000;
  const pct = Math.max(0, Math.min(100, (diffMs / totalWindowMs) * 100));
  const barColor = pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-rose-500';
  return { diffMs, pct, barColor };
}

export function buildReviewChecklist({
  ticket,
  customer,
  order,
  draft,
  review,
  sendBlocked,
  riskReason,
}: {
  ticket: ServiceTicket | null;
  customer: CustomerProfile | null;
  order: Order | null;
  draft: ReplyDraft | null;
  review: ReviewDecision | null;
  sendBlocked: boolean;
  riskReason: string;
}): ReviewChecklistItem[] {
  const evidenceBlocked = /补充证据|缺少证据/.test(ticket?.policyDecision ?? riskReason);

  return [
    {
      label: '核对客户身份',
      status: customer ? 'Completed' : 'Blocked',
      detail: customer ? `${customer.name} / ${customer.country} / ${displayLanguage(customer.preferredLanguage)}` : '缺少客户身份信息',
    },
    {
      label: '核对订单状态',
      status: order ? 'Completed' : 'Blocked',
      detail: order ? `${displayPaymentStatus(order.paymentStatus)} · ${displayFulfillmentStatus(order.fulfillmentStatus)}` : '未关联订单上下文',
    },
    {
      label: '核对退款 / 投诉 / 赔偿政策',
      status: draft?.sourceTrace ? 'Completed' : 'Pending',
      detail: draft?.sourceTrace ? `${draft.sourceTrace.scenarioConfigName} ${draft.sourceTrace.scenarioConfigVersion}` : '尚未确认对应政策',
    },
    {
      label: '检查客户证据',
      status: evidenceBlocked ? 'Blocked' : draft?.citations.length ? 'Completed' : 'Pending',
      detail: evidenceBlocked ? '当前仍提示需补充证据' : draft?.citations.length ? `已命中 ${draft.citations.length} 条证据` : '待补充客户证据或知识引用',
    },
    {
      label: '主管审批',
      status: review?.status === 'approved' ? 'Completed' : sendBlocked ? 'Blocked' : 'Pending',
      detail: review?.status === 'approved' ? '人工复核已通过' : sendBlocked ? '发送前必须先通过复核' : '当前无需主管审批',
    },
    {
      label: '准备最终回复',
      status: !sendBlocked && draft?.content ? 'Completed' : 'Pending',
      detail: !sendBlocked && draft?.content ? '已满足发送前条件' : '完成以上步骤后才能发送最终回复',
    },
  ];
}

export function getCustomerOverview({
  activeCustomer,
  activeTicket,
  activeOrder,
  sendBlocked,
}: {
  activeCustomer: CustomerProfile | null;
  activeTicket: ServiceTicket | null;
  activeOrder: Order | null;
  sendBlocked: boolean;
}) {
  if (!activeCustomer) return '暂无客户概览。';

  return `${activeCustomer.name}是${activeCustomer.country}${displayLanguage(activeCustomer.preferredLanguage)}客户，当前围绕${displayIssueType(activeTicket?.issueType ?? 'Complaint')}发起服务请求。${activeOrder ? `订单${displayPaymentStatus(activeOrder.paymentStatus)}，履约${displayFulfillmentStatus(activeOrder.fulfillmentStatus)}。` : ''}${sendBlocked ? '建议先核对证据与政策适用范围，不要直接承诺退款或赔偿。' : '建议按当前知识引用确认措辞后，由客服人工发送最终回复。'}`;
}

export function getStatusSummary(ticket: ServiceTicket | null, canSend: boolean) {
  if (!ticket) return '';
  return `${displayRiskLevel(ticket.riskLevel)} · ${displayWorkflow(ticket.workflowStage)} · ${canSend ? '可发送' : '不可发送'}`;
}

export function getRiskRuleName(ticket: ServiceTicket | null, draft: ReplyDraft | null) {
  return draft?.sourceTrace?.scenarioConfigName ?? `${displayIssueType(ticket?.issueType ?? 'Complaint')}策略`;
}

export function getHighestCitation(draft: ReplyDraft) {
  return draft.citations.reduce((max, item) => {
    const parsed = Number(item.match.replace('%', ''));
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);
}
