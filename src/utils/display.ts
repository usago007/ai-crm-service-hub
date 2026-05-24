import type {
  ActionStatus,
  AuditLogRecord,
  FeedbackLoopRecord,
  IngestionJobStatus,
  IssueType,
  Priority,
  ReviewStatus,
  TicketChannel,
  TicketStatus,
  TicketWorkflowStage,
} from '../types';

const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  New: '新工单',
  'In Progress': '处理中',
  'Pending Review': '待审核',
  'Waiting Customer': '等待客户',
  Closed: '已关闭',
  Escalated: '已升级',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  Urgent: '紧急',
  High: '高',
  Normal: '普通',
  Low: '低',
};

const CHANNEL_LABELS: Record<TicketChannel, string> = {
  Email: '邮件',
  'Live Chat': '在线聊天',
  Ticket: '工单',
};

const WORKFLOW_LABELS: Record<TicketWorkflowStage, string> = {
  triage: '分诊',
  retrieve: '检索',
  draft: '起草',
  review: '复核',
  execute: '执行',
  'follow-up': '跟进',
  resolved: '已解决',
};

const REVIEW_LABELS: Record<ReviewStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  escalated: '已升级',
};

const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  pending: '待执行',
  blocked: '已阻止',
  completed: '已完成',
};

const INGESTION_STATUS_LABELS: Record<IngestionJobStatus, string> = {
  uploaded: '已上传',
  parsing: '解析中',
  parsed: '已解析',
  chunk_failed: '切片失败',
  embedding_failed: '向量化失败',
  indexed: '已入索引',
  published: '已发布',
  expired: '已过期',
  version_conflict: '版本冲突',
};

const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  'Shipping Delay': '物流延迟',
  'Refund Request': '退款申请',
  'Product Inquiry': '商品咨询',
  'Coupon Issue': '优惠券问题',
  'Payment Issue': '支付问题',
  'Payment Failed': '支付失败',
  Complaint: '投诉',
  'Address Change': '地址修改',
  'Return Request': '退货申请',
  'VIP Support': 'VIP 支持',
  'Order Cancellation': '取消订单',
  'Reorder Request': '再次下单',
};

const SCENARIO_LABELS: Record<string, string> = {
  Shipping: '物流',
  Refund: '退款',
  Complaint: '投诉',
  Payment: '支付',
  'Address Change': '地址修改',
  'Product Inquiry': '商品咨询',
  VIP: 'VIP',
  Return: '退货',
  Promotion: '促销',
  Compensation: '赔偿',
  Chargeback: '拒付',
  'Shipping Delay': '物流延迟',
  'Refund Request': '退款申请',
  'VIP Support': 'VIP 支持',
  'Payment Failed': '支付失败',
  'Return Request': '退货申请',
};

const LANGUAGE_LABELS: Record<string, string> = {
  EN: '英文',
  ZH: '中文',
  DE: '德文',
  FR: '法文',
  ES: '西班牙文',
  JA: '日文',
  KO: '韩文',
  English: '英语',
  Chinese: '中文',
  German: '德语',
  French: '法语',
  Spanish: '西班牙语',
  Japanese: '日语',
  Korean: '韩语',
};

const YES_NO_LABELS: Record<string, string> = {
  Yes: '是',
  No: '否',
  Conditional: '条件触发',
  On: '开启',
  Off: '关闭',
  Active: '启用',
  Draft: '草稿',
  Published: '已发布',
  Pending: '待处理',
  'In Progress': '进行中',
  Completed: '已完成',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  Paid: '已支付',
  Pending: '待支付',
  Failed: '支付失败',
};

const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  Processing: '处理中',
  Shipped: '已发货',
  Delivered: '已送达',
};

const RISK_LEVEL_LABELS: Record<string, string> = {
  Low: '低风险',
  Medium: '中风险',
  High: '高风险',
};

const RUNTIME_STATUS_LABELS: Record<string, string> = {
  healthy: '健康',
  warning: '预警',
  risk: '风险',
  failed: '失败',
  good: '良好',
  watch: '观察',
};

const KNOWLEDGE_GAP_LABELS: Record<string, string> = {
  localized_policy_missing: '缺少本地化政策',
  expired_document: '文档已过期',
  version_conflict: '版本冲突',
};

const FEEDBACK_STATUS_LABELS: Record<FeedbackLoopRecord['status'], string> = {
  new: '新增',
  triaged: '已分流',
  shipped: '已上线',
};

const AUDIT_EVENT_LABELS: Record<string, string> = {
  'Guardrail block': '护栏拦截',
  'Reviewer override': '人工改判',
  'Knowledge incident': '知识事件',
  'Action blocked': '动作阻止',
  'Manual send': '人工发送',
  'Manual close': '人工关闭',
};

export function displayTicketStatus(value: TicketStatus) {
  return TICKET_STATUS_LABELS[value];
}

export function displayPriority(value: Priority) {
  return PRIORITY_LABELS[value];
}

export function displayChannel(value: TicketChannel) {
  return CHANNEL_LABELS[value];
}

export function displayWorkflow(value: TicketWorkflowStage) {
  return WORKFLOW_LABELS[value];
}

export function displayReviewStatus(value: ReviewStatus) {
  return REVIEW_LABELS[value];
}

export function displayActionStatus(value: ActionStatus) {
  return ACTION_STATUS_LABELS[value];
}

export function displayIngestionStatus(value: IngestionJobStatus) {
  return INGESTION_STATUS_LABELS[value];
}

export function displayIssueType(value: IssueType) {
  return ISSUE_TYPE_LABELS[value];
}

export function displayScenario(value: string) {
  return SCENARIO_LABELS[value] ?? value;
}

export function displayLanguage(value: string) {
  return LANGUAGE_LABELS[value] ?? value;
}

export function displayYesNo(value: string) {
  return YES_NO_LABELS[value] ?? value;
}

export function displayPaymentStatus(value: string) {
  return PAYMENT_STATUS_LABELS[value] ?? value;
}

export function displayFulfillmentStatus(value: string) {
  return FULFILLMENT_STATUS_LABELS[value] ?? value;
}

export function displayRiskLevel(value: string) {
  return RISK_LEVEL_LABELS[value] ?? value;
}

export function displayRuntimeStatus(value: string) {
  return RUNTIME_STATUS_LABELS[value] ?? value;
}

export function displayKnowledgeGap(value: string | null) {
  return value ? (KNOWLEDGE_GAP_LABELS[value] ?? value) : '无';
}

export function displayFeedbackStatus(value: FeedbackLoopRecord['status']) {
  return FEEDBACK_STATUS_LABELS[value];
}

export function displayAuditEvent(value: AuditLogRecord['eventType']) {
  return AUDIT_EVENT_LABELS[value] ?? value;
}

export function displayBoolean(value: boolean) {
  return value ? '是' : '否';
}

export function displayGenericStatus(value: string) {
  return (
    TICKET_STATUS_LABELS[value as TicketStatus] ??
    PRIORITY_LABELS[value as Priority] ??
    CHANNEL_LABELS[value as TicketChannel] ??
    WORKFLOW_LABELS[value as TicketWorkflowStage] ??
    REVIEW_LABELS[value as ReviewStatus] ??
    ACTION_STATUS_LABELS[value as ActionStatus] ??
    INGESTION_STATUS_LABELS[value as IngestionJobStatus] ??
    RUNTIME_STATUS_LABELS[value] ??
    PAYMENT_STATUS_LABELS[value] ??
    FULFILLMENT_STATUS_LABELS[value] ??
    YES_NO_LABELS[value] ??
    value
  );
}
