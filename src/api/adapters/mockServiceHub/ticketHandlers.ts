import type {
  TicketActionRequest,
  TicketCloseRequest,
  TicketDraftRequest,
  TicketDraftSaveRequest,
  TicketReplySendRequest,
  TicketRetrieveRequest,
  TicketReviewRequest,
  ServiceHubApi,
} from '../../contracts/serviceHub';
import type { FollowUpTask, SendGuardrailResult, ServiceHubSnapshot, ServiceTicket, TicketAction } from '../../../types';
import { findNodeConfig, findScenarioConfig as resolveScenarioConfig } from '../../../shared/lib/aiConsolePolicy';
import { cloneSnapshot, nowIso, nowUiStamp } from './shared';

function findTicket(snapshot: ServiceHubSnapshot, ticketId: string) {
  return snapshot.tickets.find(ticket => ticket.id === ticketId);
}

function issueTypeToScenario(issueType: ServiceTicket['issueType']) {
  switch (issueType) {
    case 'Shipping Delay':
      return 'Shipping';
    case 'Refund Request':
      return 'Refund';
    case 'Product Inquiry':
      return 'Product Inquiry';
    case 'Complaint':
      return 'Complaint';
    case 'Payment Failed':
      return 'Payment';
    case 'Return Request':
      return 'Refund';
    default:
      return 'Shipping';
  }
}

function buildSendGuardrail(snapshot: ServiceHubSnapshot, ticket: ServiceTicket): SendGuardrailResult {
  const scenario = issueTypeToScenario(ticket.issueType);
  const config = resolveScenarioConfig(snapshot.scenarioModelConfigs, scenario);
  const review = snapshot.reviewDecisions.find(item => item.id === ticket.reviewDecisionId);
  const approved = review?.status === 'approved';
  const manualReviewRequired = config.manualReviewRequired;
  const blocked = manualReviewRequired && !approved;
  return {
    blocked,
    manualReviewRequired,
    reason: blocked
      ? '当前场景必须先完成人工复核，之后才能由人工发送。'
      : config.humanSendAllowed
      ? '当前场景允许人工发送，AI 仍不可自动发送。'
      : '当前场景仍需人工处理结论，AI 只能保留建议草稿。',
    scenario,
    aiPermission: config.aiSuggestAllowed ? 'suggest_only' : 'disabled',
    autoSend: 'disabled',
  };
}

function buildDraftTraceFromSnapshot(snapshot: ServiceHubSnapshot, ticket: ServiceTicket) {
  const scenario = issueTypeToScenario(ticket.issueType);
  const scenarioConfig = resolveScenarioConfig(snapshot.scenarioModelConfigs, scenario);
  const replyDraftingNode = findNodeConfig(snapshot.pipelineNodeConfigs, 'reply-drafting');
  const riskNode = findNodeConfig(snapshot.pipelineNodeConfigs, 'risk-detection');
  const retrievalNode = findNodeConfig(snapshot.pipelineNodeConfigs, 'knowledge-retrieval');
  return {
    scenario,
    scenarioConfigId: scenarioConfig.id,
    scenarioConfigName: scenarioConfig.name,
    scenarioConfigVersion: scenarioConfig.version,
    draftingModel: replyDraftingNode?.primaryModel ?? scenarioConfig.primaryModel,
    retrievalSummary: `Top K ${scenarioConfig.topK} / 阈值 ${scenarioConfig.similarityThreshold} / ${scenarioConfig.rerankerEnabled ? '启用重排序' : '关闭重排序'}`,
    citationRequired: scenarioConfig.citationRequired,
    manualReviewRequired: scenarioConfig.manualReviewRequired,
    guardrailResult: buildSendGuardrail(snapshot, ticket).blocked ? '发送前要求人工复核' : '允许人工发送',
    nodeModels: [
      `回复草稿：${replyDraftingNode?.primaryModel ?? '继承场景默认'}`,
      `风险识别：${riskNode?.primaryModel ?? '继承场景默认'}`,
      `知识检索：${retrievalNode?.primaryModel ?? scenarioConfig.primaryModel}`,
    ],
  };
}

export function createTicketHandlers(snapshot: ServiceHubSnapshot): Pick<
  ServiceHubApi,
  'retrieveTicket' | 'draftTicket' | 'sendTicketReply' | 'saveTicketDraft' | 'closeTicket' | 'reviewTicket' | 'runTicketAction'
> {
  return {
    async retrieveTicket(request: TicketRetrieveRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      if (ticket) {
        ticket.workflowStage = 'retrieve';
        ticket.lastUpdated = nowIso();
        ticket.aiSummary = `${ticket.aiSummary} Retrieval replayed from mock API.`;
      }
      return { snapshot: next, ragRun: next.ragRuns.find(run => run.ticketId === request.ticketId) };
    },
    async draftTicket(request: TicketDraftRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      if (ticket) {
        ticket.workflowStage = ticket.manualReview ? 'review' : 'draft';
        ticket.lastUpdated = nowIso();
      }
      const draft = ticket ? next.replyDrafts.find(item => item.id === ticket.draftId) : undefined;
      if (draft && ticket) {
        draft.sourceTrace = buildDraftTraceFromSnapshot(next, ticket);
      }
      return { snapshot: next, draft };
    },
    async sendTicketReply(request: TicketReplySendRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      if (!ticket) return { snapshot: next, ticket: undefined, guardrail: undefined };

      const guardrail = buildSendGuardrail(next, ticket);
      ticket.sendGuardrailResult = guardrail;
      if (guardrail.blocked) {
        next.auditLogs = [
          {
            id: `AUD-${String(next.auditLogs.length + 1).padStart(3, '0')}`,
            ticketId: ticket.id,
            eventType: 'Guardrail block',
            actor: request.agentName,
            outcome: '发送前被人工复核闸门阻止。',
            riskLevel: ticket.riskLevel,
            timestamp: nowUiStamp(),
            detail: guardrail.reason,
          },
          ...next.auditLogs,
        ];
        return { snapshot: next, ticket, guardrail };
      }

      next.messages = [
        ...next.messages,
        {
          ticketId: ticket.id,
          sender: 'agent',
          type: 'text',
          content: request.content,
          timestamp: nowIso(),
        },
        {
          ticketId: ticket.id,
          sender: 'system',
          type: 'system',
          content: '客服已人工发送回复，AI 仅作为建议来源保留。',
          timestamp: nowIso(),
        },
      ];
      ticket.workflowStage = 'follow-up';
      ticket.status = 'Waiting Customer';
      ticket.lastUpdated = nowIso();
      ticket.lastReplyAt = nowIso();
      ticket.lastReplyBy = request.agentName;
      next.auditLogs = [
        {
          id: `AUD-${String(next.auditLogs.length + 1).padStart(3, '0')}`,
          ticketId: ticket.id,
          eventType: 'Manual send',
          actor: request.agentName,
          outcome: '客服已人工发送客户回复。',
          riskLevel: ticket.riskLevel,
          timestamp: nowUiStamp(),
          detail: `使用 ${resolveScenarioConfig(next.scenarioModelConfigs, issueTypeToScenario(ticket.issueType)).name}，AI 自动发送保持禁用。`,
        },
        ...next.auditLogs,
      ];
      return { snapshot: next, ticket, guardrail };
    },
    async saveTicketDraft(request: TicketDraftSaveRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      const draft = ticket ? next.replyDrafts.find(item => item.id === ticket.draftId) : undefined;
      if (ticket && draft) {
        draft.content = request.content;
        draft.sourceTrace = buildDraftTraceFromSnapshot(next, ticket);
        ticket.draftSavedAt = nowIso();
        ticket.lastUpdated = nowIso();
      }
      return { snapshot: next, draft };
    },
    async closeTicket(request: TicketCloseRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      if (!ticket) return { snapshot: next, ticket: undefined, blocked: true, message: '未找到工单。' };

      const guardrail = buildSendGuardrail(next, ticket);
      if (guardrail.manualReviewRequired) {
        const review = next.reviewDecisions.find(item => item.id === ticket.reviewDecisionId);
        if (review?.status !== 'approved') {
          return { snapshot: next, ticket, blocked: true, message: '高风险场景必须先通过人工复核，之后才能关闭工单。' };
        }
      }

      ticket.status = 'Closed';
      ticket.workflowStage = 'resolved';
      ticket.lastUpdated = nowIso();
      next.messages = [
        ...next.messages,
        {
          ticketId: ticket.id,
          sender: 'system',
          type: 'system',
          content: '工单已由人工关闭。',
          timestamp: nowIso(),
        },
      ];
      next.auditLogs = [
        {
          id: `AUD-${String(next.auditLogs.length + 1).padStart(3, '0')}`,
          ticketId: ticket.id,
          eventType: 'Manual close',
          actor: request.actor,
          outcome: '客服已人工关闭工单。',
          riskLevel: ticket.riskLevel,
          timestamp: nowUiStamp(),
          detail: '关闭前已完成必要的人工审核与处理动作确认。',
        },
        ...next.auditLogs,
      ];
      return { snapshot: next, ticket, blocked: false, message: '工单已关闭。' };
    },
    async reviewTicket(request: TicketReviewRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      let review;
      if (ticket) {
        review = next.reviewDecisions.find(item => item.id === ticket.reviewDecisionId);
        if (review) {
          review.status = request.decision;
          review.reviewer = request.reviewer;
          review.reason = request.reason;
          review.updatedAt = nowIso();
        }
        ticket.workflowStage = request.decision === 'approved' ? 'execute' : request.decision === 'rejected' ? 'draft' : 'review';
        ticket.status = request.decision === 'approved' ? 'In Progress' : request.decision === 'escalated' ? 'Escalated' : ticket.status;
        ticket.lastUpdated = nowIso();
        ticket.sendGuardrailResult = buildSendGuardrail(next, ticket);
      }
      return { snapshot: next, review };
    },
    async runTicketAction(request: TicketActionRequest) {
      const next = cloneSnapshot(snapshot);
      const ticket = findTicket(next, request.ticketId);
      let action: TicketAction | undefined;
      const tasks: FollowUpTask[] = [];
      if (ticket) {
        action = next.ticketActions.find(item => item.id === request.actionId);
        if (action) {
          action.status = action.status === 'blocked' ? 'blocked' : 'completed';
          action.result = action.status === 'blocked' ? action.result : 'Completed through mock workflow execution.';
        }
        ticket.workflowStage = action?.status === 'completed' ? 'follow-up' : 'execute';
        ticket.status = action?.status === 'completed' ? 'Waiting Customer' : ticket.status;
        ticket.lastUpdated = nowIso();
        if (action?.status === 'completed' && ticket.executionOutcome.followUpNeeded) {
          const followupTask: FollowUpTask = {
            id: `TSK-${String(next.tasks.length + 1).padStart(3, '0')}`,
            description: ticket.executionOutcome.customerPromise,
            customerId: ticket.customerId,
            ticketId: ticket.id,
            due: ticket.executionOutcome.followUpAt ?? nowIso(),
            priority: ticket.priority,
            triggeredBy: 'Ticket Action',
            status: 'Pending',
            owner: ticket.assignee,
          };
          next.tasks = [followupTask, ...next.tasks];
          tasks.push(followupTask);
        }
      }
      return { snapshot: next, action, tasks };
    },
  };
}
