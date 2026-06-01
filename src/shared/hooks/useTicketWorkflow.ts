import type { RefObject } from 'react';
import type { ServiceHubApi } from '../../api/contracts/serviceHub';
import type { ServiceHubSnapshot, Toast } from '../../types';

interface UseTicketWorkflowOptions {
  apiRef: RefObject<ServiceHubApi>;
  snapshot: ServiceHubSnapshot;
  replyText: string;
  setReplyText: (value: string) => void;
  pushToast: (message: string, type?: Toast['type']) => void;
  refreshWith: <T extends { snapshot: ServiceHubSnapshot }>(promise: Promise<T>) => Promise<T>;
}

export function useTicketWorkflow({
  apiRef,
  snapshot,
  replyText,
  setReplyText,
  pushToast,
  refreshWith,
}: UseTicketWorkflowOptions) {
  return {
    async runRetrieve(ticketId: string) {
      const result = await refreshWith(apiRef.current.retrieveTicket({ ticketId }));
      pushToast('已重新执行检索链路', 'info');
      return result;
    },
    async runDraft(ticketId: string) {
      const result = await refreshWith(apiRef.current.draftTicket({ ticketId }));
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
      const result = await refreshWith(apiRef.current.sendTicketReply({ ticketId, content: replyText, agentName: '你' }));
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
      const result = await refreshWith(apiRef.current.saveTicketDraft({ ticketId, content: replyText }));
      pushToast('已保存回复草稿', 'success');
      return result;
    },
    async closeTicket(ticketId: string) {
      const result = await refreshWith(apiRef.current.closeTicket({ ticketId, actor: '你' }));
      pushToast(result.message, result.blocked ? 'warning' : 'success');
      return result;
    },
    async runReview(ticketId: string, decision: 'approved' | 'rejected' | 'escalated') {
      const result = await refreshWith(apiRef.current.reviewTicket({
        ticketId,
        decision,
        reviewer: '你',
        reason: decision === 'approved' ? '模拟人工复核：通过' : decision === 'escalated' ? '模拟人工复核：升级处理' : '模拟人工复核：驳回',
      }));
      pushToast(
        decision === 'approved' ? '已通过人工复核' : decision === 'escalated' ? '已升级至人工处理' : '已退回复核',
        decision === 'approved' ? 'success' : 'warning',
      );
      return result;
    },
    async runAction(ticketId: string, actionId: string) {
      const result = await refreshWith(apiRef.current.runTicketAction({ ticketId, actionId }));
      pushToast(
        result.action?.status === 'completed' ? '内部动作已执行完成' : '内部动作已被策略拦截',
        result.action?.status === 'completed' ? 'success' : 'warning',
      );
      return result;
    },
  };
}
