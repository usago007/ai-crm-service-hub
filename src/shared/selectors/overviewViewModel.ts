import type {
  NavKey,
  OverviewEventItem,
  OverviewMetric,
  OverviewShortcutItem,
  OverviewSnapshot,
  OverviewTodoItem,
  ServiceHubSnapshot,
} from '../../types';
import {
  displayAuditEvent,
  displayFulfillmentStatus,
  displayGenericStatus,
  displayPaymentStatus,
  displayRiskLevel,
  displayTicketStatus,
} from '../../utils/display';

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

export function buildOverviewSnapshot(snapshot: ServiceHubSnapshot): OverviewSnapshot {
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
    { id: 'shortcut-audit', label: 'AI 质量监控', description: '追踪拦截、人工改判、知识异常与执行留痕。', countLabel: `${blockedAuditLogs.length} 个阻止事件`, tone: 'red', target: { page: 'ai-console-evaluation-feedback' } },
  ];

  return {
    metrics,
    analytics: snapshot.analytics,
    events,
    todos,
    shortcuts,
  };
}
