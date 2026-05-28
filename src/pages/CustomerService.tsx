import type { ReactNode } from 'react';
import type { CustomerProfile, ListQuery, Message, Order, PagedResult, ReplyDraft, ReplyTemplate, ReviewDecision, ServiceTicket, TicketAction, TicketFilters } from '../types';
import { useT } from '../i18n';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { Button } from '../components/common/Button';
import { DetailPanel, EmptyState, PanelCard, inputCls } from '../components/common/PageChrome';
import { AlertTriangle, Bot, CheckSquare, ChevronDown, ChevronUp, FileText, Save, Send, SlidersHorizontal } from 'lucide-react';
import { displayChannel, displayFulfillmentStatus, displayIssueType, displayLanguage, displayPaymentStatus, displayReviewStatus, displayRiskLevel, displayScenario, displayTicketStatus, displayWorkflow } from '../utils/display';
import { useMemo, useState } from 'react';

interface CustomerServiceProps {
  result: PagedResult<ServiceTicket>;
  query: ListQuery<TicketFilters>;
  onQueryChange: (updater: (prev: ListQuery<TicketFilters>) => ListQuery<TicketFilters>) => void;
  customers: CustomerProfile[];
  orders: Order[];
  messages: Message[];
  drafts: ReplyDraft[];
  reviews: ReviewDecision[];
  actions: TicketAction[];
  selectedTicketId: string | null;
  replyText: string;
  onSelectTicket: (id: string | null) => void;
  onReplyTextChange: (val: string) => void;
  onInsertAI: (ticketId: string) => void;
  onRetrieve: (ticketId: string) => void;
  onDraft: (ticketId: string) => void;
  onSendReply: (ticketId: string) => void;
  onSaveDraft: (ticketId: string) => void;
  onCloseTicket: (ticketId: string) => void;
  onReview: (ticketId: string, decision: 'approved' | 'rejected' | 'escalated') => void;
  onRunAction: (ticketId: string, actionId: string) => void;
  replyTemplates: ReplyTemplate[];
}

export function CustomerService({
  result,
  query,
  onQueryChange,
  customers,
  orders,
  messages,
  drafts,
  reviews,
  actions,
  selectedTicketId,
  replyText,
  onSelectTicket,
  onReplyTextChange,
  onInsertAI,
  onRetrieve,
  onDraft,
  onSendReply,
  onSaveDraft,
  onCloseTicket,
  onReview,
  onRunAction,
  replyTemplates,
}: CustomerServiceProps) {
  const { t } = useT();
  const [showConversation, setShowConversation] = useState(false);
  const [showRiskDetails, setShowRiskDetails] = useState(false);
  const [showRagEvidence, setShowRagEvidence] = useState(false);
  const [showSourceTrace, setShowSourceTrace] = useState(false);
  const [queueFilterOpen, setQueueFilterOpen] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const activeTicket = selectedTicketId ? result.items.find(item => item.id === selectedTicketId) ?? result.items[0] ?? null : result.items[0] ?? null;
  const activeCustomer = customers.find(item => item.id === activeTicket?.customerId) ?? null;
  const activeOrder = orders.find(item => item.customerId === activeTicket?.customerId) ?? null;
  const activeMessages = messages.filter(item => item.ticketId === activeTicket?.id);
  const activeDraft = drafts.find(item => item.id === activeTicket?.draftId) ?? null;
  const activeReview = reviews.find(item => item.id === activeTicket?.reviewDecisionId) ?? null;
  const activeActions = actions.filter(item => activeTicket?.actionIds.includes(item.id));
  const sendBlocked = activeTicket?.sendGuardrailResult?.blocked ?? false;
  const visibleMessages = showConversation ? activeMessages : activeMessages.slice(-2);
  const latestCustomerMessage = [...activeMessages].reverse().find(item => item.sender === 'customer') ?? null;
  const riskRuleName = activeDraft?.sourceTrace?.scenarioConfigName ?? `${displayIssueType(activeTicket?.issueType ?? 'Complaint')}策略`;
  const riskReason = activeTicket?.sendGuardrailResult?.reason
    ?? activeReview?.reason
    ?? (activeTicket?.manualReview ? '当前场景命中高敏流程，需要先人工确认，再决定是否向客户发送。' : '当前问题未命中强制复核策略，可按标准路径继续处理。');
  const needsChecklist = useMemo(
    () => Boolean(activeDraft?.sourceTrace?.scenario && ['Refund', 'Complaint', 'Compensation', 'Chargeback'].includes(activeDraft.sourceTrace.scenario)),
    [activeDraft],
  );
  const checklist = useMemo(
    () => buildReviewChecklist({
      ticket: activeTicket,
      customer: activeCustomer,
      order: activeOrder,
      draft: activeDraft,
      review: activeReview,
      sendBlocked,
      riskReason,
    }),
    [activeCustomer, activeDraft, activeOrder, activeReview, activeTicket, riskReason, sendBlocked],
  );
  const blockedChecklistItem = checklist.find(item => item.status === 'Blocked') ?? checklist.find(item => item.status === 'Pending') ?? null;
  const checklistBlocked = needsChecklist && checklist.some((item, index) => index < checklist.length - 1 && item.status !== 'Completed');
  const canSend = !sendBlocked && !checklistBlocked;
  const statusSummary = activeTicket
    ? `${displayRiskLevel(activeTicket.riskLevel)} · ${displayWorkflow(activeTicket.workflowStage)} · ${canSend ? '可发送' : '不可发送'}`
    : '';
  const conclusionSummary = sendBlocked
    ? `高风险${displayIssueType(activeTicket?.issueType ?? 'Complaint')}，AI 不允许直接发送。`
    : '当前未命中发送阻断，可以进入最终人工发送。';
  const blockingReason = sendBlocked
    ? activeTicket?.policyDecision ?? riskReason
    : checklistBlocked
    ? `${blockedChecklistItem?.label ?? '人工复核 Checklist'}尚未完成。`
    : '当前没有发送阻塞。';
  const recommendedAction = canSend
    ? '检查草稿措辞后，由客服人工点击最终发送。'
    : `优先完成${blockedChecklistItem?.label ?? '人工复核'}，再${activeTicket?.requiredAction ?? '决定是否发送回复'}。`;
  const sendDecision = sendBlocked
    ? { label: '不可发送', tone: 'red' as const, detail: activeTicket?.sendGuardrailResult?.reason ?? '当前流程仍有复核阻断，不能直接发送。' }
    : { label: '可发送', tone: 'green' as const, detail: '当前场景已通过现有护栏与复核条件，可由客服人工发送。' };
  const ragEvidenceSummary = activeDraft
    ? `命中 ${activeDraft.citations.length} 个政策文档，最高匹配 ${highestCitation(activeDraft)}%，用于判断${displayIssueType(activeTicket?.issueType ?? 'Complaint')}。`
    : '暂无 RAG 证据，请先生成 AI 草稿。';
  const customerOverview = activeCustomer
    ? `${activeCustomer.name}是${activeCustomer.country}${displayLanguage(activeCustomer.preferredLanguage)}客户，当前围绕${displayIssueType(activeTicket?.issueType ?? 'Complaint')}发起服务请求。${activeOrder ? `订单${displayPaymentStatus(activeOrder.paymentStatus)}，履约${displayFulfillmentStatus(activeOrder.fulfillmentStatus)}。` : ''}${sendBlocked ? '建议先核对证据与政策适用范围，不要直接承诺退款或赔偿。' : '建议按当前知识引用确认措辞后，由客服人工发送最终回复。'}`
    : '暂无客户概览。';
  const primaryAction = !activeTicket
    ? null
    : canSend
    ? { label: '最终发送', icon: Send, onClick: () => onSendReply(activeTicket.id), variant: 'success' as const, disabled: false }
    : activeReview?.status === 'pending'
    ? { label: '提交复核', onClick: () => onReview(activeTicket.id, 'approved'), variant: 'warning' as const, disabled: false }
    : activeActions[0]
    ? { label: activeActions[0].label, onClick: () => onRunAction(activeTicket.id, activeActions[0].id), variant: 'warning' as const, disabled: false }
    : { label: '升级处理', onClick: () => onReview(activeTicket.id, 'escalated'), variant: 'warning' as const, disabled: false };
  const secondaryActions = activeTicket
    ? [
        { label: '采用草稿', icon: Bot, onClick: () => onInsertAI(activeTicket.id) },
        { label: '拒绝建议', onClick: () => onReplyTextChange('') },
        { label: '重新生成', onClick: () => onDraft(activeTicket.id) },
        { label: '重新检索', onClick: () => onRetrieve(activeTicket.id) },
        { label: '保存草稿', icon: Save, onClick: () => onSaveDraft(activeTicket.id) },
        ...(sendBlocked ? [{ label: '查看详情', onClick: () => setShowRiskDetails(prev => !prev) }] : [{ label: '查看详情', onClick: () => setShowRagEvidence(prev => !prev) }]),
      ]
    : [];
  const hasActiveQueueFilters = Boolean(query.filters.channel || query.filters.workflowStage || query.filters.riskLevel);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[300px_minmax(0,1fr)_280px] gap-4 min-h-[calc(100vh-240px)] max-[1320px]:grid-cols-[280px_minmax(0,1fr)] max-[1180px]:grid-cols-1">
        <PanelCard
          title="AI 辅助队列"
          actions={
            <div className="relative">
              <Button
                variant={hasActiveQueueFilters ? 'warning' : 'secondary'}
                size="icon"
                onClick={() => setQueueFilterOpen(prev => !prev)}
                aria-label="筛选队列"
                title="筛选队列"
                className={`${hasActiveQueueFilters ? 'shadow-[0_0_0_2px_rgba(179,92,32,0.12)]' : ''} h-8 w-8 rounded-[12px]`}
              >
                <SlidersHorizontal size={14} />
              </Button>
              {queueFilterOpen ? (
                <>
                  <button
                    type="button"
                    aria-label="关闭队列筛选"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setQueueFilterOpen(false)}
                  />
                  <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[280px] rounded-[20px] border border-[var(--color-border)] bg-white/95 p-3 shadow-[0_20px_48px_rgba(15,23,42,0.16)] backdrop-blur">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-light)] mb-2">队列筛选</div>
                    <div className="space-y-2.5">
                      <select
                        className={inputCls}
                        value={query.filters.channel ?? ''}
                        onChange={e => {
                          onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, channel: e.target.value || undefined } }));
                          setQueueFilterOpen(false);
                        }}
                      >
                        <option value="">全部渠道</option>
                        {['Email', 'Live Chat', 'Ticket'].map(item => <option key={item} value={item}>{displayChannel(item as ServiceTicket['channel'])}</option>)}
                      </select>
                      <select
                        className={inputCls}
                        value={query.filters.workflowStage ?? ''}
                        onChange={e => {
                          onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, workflowStage: e.target.value || undefined } }));
                          setQueueFilterOpen(false);
                        }}
                      >
                        <option value="">全部流程</option>
                        {['triage', 'retrieve', 'draft', 'review', 'execute', 'follow-up', 'resolved'].map(item => <option key={item} value={item}>{displayWorkflow(item as ServiceTicket['workflowStage'])}</option>)}
                      </select>
                      <select
                        className={inputCls}
                        value={query.filters.riskLevel ?? ''}
                        onChange={e => {
                          onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, riskLevel: e.target.value || undefined } }));
                          setQueueFilterOpen(false);
                        }}
                      >
                        <option value="">全部风险</option>
                        {['Low', 'Medium', 'High'].map(item => <option key={item} value={item}>{displayRiskLevel(item)}</option>)}
                      </select>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-[var(--color-text-light)]">共 {result.total} 条记录</div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onQueryChange(prev => ({ ...prev, page: 1, filters: {} }));
                          setQueueFilterOpen(false);
                        }}
                      >
                        重置筛选
                      </Button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          }
          className="relative overflow-hidden p-0"
        >
          <div className="px-5 pb-1 text-xs text-[var(--color-text-secondary)]">
            共 {result.total} 条记录
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-320px)]">
            {result.items.length > 0 ? result.items.map(ticket => {
              const customer = customers.find(item => item.id === ticket.customerId);
              const active = ticket.id === activeTicket?.id;
              const review = reviews.find(item => item.id === ticket.reviewDecisionId);
              const statusBadges: Array<{ label: string; variant: 'gray' | 'yellow' | 'red' | 'green' }> = [
                { label: displayRiskLevel(ticket.riskLevel), variant: ticket.riskLevel === 'High' ? 'red' : ticket.riskLevel === 'Medium' ? 'yellow' : 'green' as const },
                { label: review?.status === 'pending' ? '待复核' : displayTicketStatus(ticket.status), variant: review?.status === 'pending' ? 'yellow' as const : 'gray' as const },
              ];
              return (
                <div
                  key={ticket.id}
                  className={`px-4 py-3 border-b border-[var(--color-border-light)] cursor-pointer transition-all ${active ? 'bg-[rgba(179,92,32,0.08)] shadow-[inset_2px_0_0_var(--color-primary)]' : 'hover:bg-[rgba(255,255,255,0.42)]'}`}
                  onClick={() => onSelectTicket(ticket.id)}
                >
                  <div className="mb-1.5">
                    <div className="text-[13px] font-semibold">{ticket.id}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{customer?.name}</div>
                  </div>
                  <div className="text-xs text-[var(--color-text)] mb-2 line-clamp-2">{summarizeQueue(ticket.summary)}</div>
                  <div className="flex gap-1 flex-wrap">
                    {statusBadges.map(item => (
                      <Badge key={item.label} variant={item.variant}>{item.label}</Badge>
                    ))}
                  </div>
                  {(() => {
                    const diffMs = new Date(ticket.sla).getTime() - Date.now();
                    const windowMs = 72 * 60 * 60 * 1000;
                    const pct = Math.max(0, Math.min(100, (diffMs / windowMs) * 100));
                    const barColor = pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-rose-500';
                    const lbl = diffMs <= 0 ? '超时' : diffMs < 3_600_000 ? `${Math.round(diffMs / 60_000)}m` : diffMs < 86_400_000 ? `${Math.round(diffMs / 3_600_000)}h` : `${Math.ceil(diffMs / 86_400_000)}d`;
                    return (
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="flex-1 h-1 rounded-full bg-[var(--color-border-light)] overflow-hidden">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-[10px] tabular-nums ${diffMs <= 0 ? 'text-rose-600' : 'text-[var(--color-text-light)]'}`}>{lbl}</span>
                      </div>
                    );
                  })()}
                </div>
              );
            }) : (
              <div className="p-4">
                <EmptyState
                  title="暂无工单队列"
                  description={t.common.noTickets}
                  compact
                  action={<Button variant="secondary" size="sm" onClick={() => onQueryChange(prev => ({ ...prev, page: 1, filters: {} }))}>清空筛选</Button>}
                />
              </div>
            )}
          </div>
          <Pagination page={result.page} totalPages={result.totalPages} total={result.total} onPageChange={page => onQueryChange(prev => ({ ...prev, page }))} />
        </PanelCard>

        <PanelCard title={activeTicket ? undefined : '工单工作区'} className="flex flex-col min-h-0 p-0 overflow-hidden">
          {activeTicket ? (
            <>
              <div className="px-4 py-4 border-b border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.48))]">
                <div className="text-[18px] font-semibold tracking-[-0.02em]">{activeTicket.id} · {displayIssueType(activeTicket.issueType)}</div>
                <div className="text-sm text-[var(--color-text-secondary)] mt-1">{statusSummary}</div>
                {(() => {
                  const diffMs = new Date(activeTicket.sla).getTime() - Date.now();
                  const totalWindowMs = 72 * 60 * 60 * 1000;
                  const pct = Math.max(0, Math.min(100, (diffMs / totalWindowMs) * 100));
                  const barColor = pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-rose-500';
                  const label = diffMs <= 0 ? '已超时' : diffMs < 3_600_000 ? `${Math.round(diffMs / 60_000)}m` : diffMs < 86_400_000 ? `${Math.round(diffMs / 3_600_000)}h` : `${Math.ceil(diffMs / 86_400_000)}d`;
                  return (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[11px] text-[var(--color-text-light)]">SLA</span>
                      <div className="flex-1 max-w-[140px] h-1.5 rounded-full bg-[var(--color-border-light)] overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-[11px] tabular-nums ${diffMs <= 0 ? 'text-rose-600 font-semibold' : 'text-[var(--color-text-secondary)]'}`}>{label}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Workflow progress */}
              <div className="px-4 py-3 border-b border-[var(--color-border-light)] bg-[rgba(255,255,255,0.42)] overflow-x-auto">
                <div className="flex items-center justify-between min-w-[560px]">
                  {(['triage', 'retrieve', 'draft', 'review', 'execute', 'follow-up', 'resolved'] as const).map((stage, index, arr) => {
                    const currentIndex = arr.indexOf(activeTicket.workflowStage);
                    const isActive = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    return (
                      <div key={stage} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${isCurrent ? 'bg-[var(--color-primary)] text-white shadow-[0_0_0_4px_rgba(179,92,32,0.2)]' : isActive ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-border-light)] text-[var(--color-text-light)]'}`}>
                            {index + 1}
                          </div>
                          <div className={`text-[9px] mt-1 whitespace-nowrap ${isCurrent ? 'text-[var(--color-primary)] font-semibold' : isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-light)]'}`}>
                            {displayWorkflow(stage)}
                          </div>
                        </div>
                        {index < arr.length - 1 ? (
                          <div className={`flex-1 h-[2px] mx-1 mt-[-16px] ${index < currentIndex ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-light)]'}`} />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <section className="rounded-[18px] border border-[var(--color-border-light)] p-4 bg-[rgba(255,255,255,0.68)]">
                  <div className="text-sm font-semibold">当前结论与下一步</div>
                  <div className="mt-3 rounded-[14px] border border-[var(--color-border-light)] bg-[var(--color-bg)] p-3 text-sm">
                    <div><span className="font-medium">当前结论：</span>{conclusionSummary}</div>
                    <div className="mt-2"><span className="font-medium">当前阻塞：</span>{blockingReason}</div>
                    <div className="mt-2"><span className="font-medium">推荐下一步：</span>{recommendedAction}</div>
                  </div>
                </section>

                {needsChecklist ? (
                  <section className="rounded-[18px] border border-[var(--color-border-light)] p-4 bg-[rgba(255,255,255,0.68)]">
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div>
                      <div className="text-sm font-semibold">人工复核 Checklist</div>
                      <div className="text-xs text-[var(--color-text-secondary)] mt-1">高风险工单按复核步骤推进，一眼看出卡在哪一步。</div>
                    </div>
                    <Badge variant="yellow">需要复核</Badge>
                  </div>
                  <div className="grid gap-2">
                    {checklist.map(item => (
                      <div key={item.label} className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--color-border-light)] bg-white px-3 py-2.5">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{item.label}</div>
                          <div className="text-xs text-[var(--color-text-secondary)] mt-1">{item.detail}</div>
                        </div>
                        <Badge variant={item.status === 'Completed' ? 'green' : item.status === 'Blocked' ? 'red' : 'yellow'}>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  </section>
                ) : null}

                <section className="rounded-[18px] border border-[var(--color-border)] p-4 bg-white">
                  {activeDraft ? (
                    <>
                    <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold">AI Draft Reply</div>
                        <div className="text-xs text-[var(--color-text-secondary)] mt-1">{sendDecision.detail}</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={activeDraft.riskLevel === 'High' ? 'red' : activeDraft.riskLevel === 'Medium' ? 'yellow' : 'green'}>{displayRiskLevel(activeDraft.riskLevel)}</Badge>
                        <Badge variant={activeTicket.manualReview ? 'yellow' : 'gray'}>{activeTicket.manualReview ? '需要复核' : '无需复核'}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-3 max-[980px]:grid-cols-2 max-[640px]:grid-cols-1">
                      <SignalCard label="Confidence" value={`${activeDraft.confidence}%`} />
                      <SignalCard label="Citation Coverage" value={`${highestCitation(activeDraft)}%`} />
                      <SignalCard label="Risk Level" value={displayRiskLevel(activeDraft.riskLevel)} />
                      <SignalCard label="Manual Review" value={activeTicket.manualReview ? 'Required' : 'Not Required'} />
                    </div>
                    <textarea
                      className="w-full h-44 border border-[var(--color-border)] rounded-[16px] px-3 py-3 text-sm bg-white outline-none resize-none transition-all duration-200 focus:border-[rgba(179,92,32,0.34)] focus:shadow-[0_0_0_4px_rgba(179,92,32,0.10)]"
                      value={replyText}
                      onChange={e => onReplyTextChange(e.target.value)}
                      placeholder={activeDraft.content}
                    />
                    <div className="mt-3 relative">
                      <Button size="sm" variant="secondary" onClick={() => setShowTemplatePicker(prev => !prev)}>
                        <FileText size={14} />
                        回复模板
                        {showTemplatePicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </Button>
                      {showTemplatePicker ? (
                        <>
                          <button type="button" aria-label="关闭模板面板" className="fixed inset-0 z-10 cursor-default" onClick={() => setShowTemplatePicker(false)} />
                          <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-[380px] max-h-64 overflow-y-auto rounded-[16px] border border-[var(--color-border)] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
                            {replyTemplates.length > 0 ? replyTemplates.map(tpl => (
                              <button
                                key={tpl.id}
                                type="button"
                                className="w-full text-left px-4 py-3 text-sm border-b border-[var(--color-border-light)] hover:bg-[rgba(179,92,32,0.06)] transition-colors last:border-b-0"
                                onClick={() => { onReplyTextChange(tpl.content); setShowTemplatePicker(false); }}
                              >
                                <div className="font-medium">{tpl.name}</div>
                                <div className="flex gap-1 mt-1">
                                  <Badge variant="blue">{displayScenario(tpl.scenario)}</Badge>
                                  <Badge variant="gray">{displayLanguage(tpl.language)}</Badge>
                                  <Badge variant="gray">{tpl.tone}</Badge>
                                </div>
                              </button>
                            )) : (
                              <div className="p-4 text-xs text-[var(--color-text-secondary)]">暂无可用模板</div>
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>
                    <div className="mt-3 rounded-[14px] border border-[var(--color-border-light)] bg-[var(--color-bg)] px-3 py-2.5 text-sm">
                      <span className="font-medium">发送判定：</span>
                      <span className={canSend ? 'text-emerald-700' : 'text-rose-700'}>{sendDecision.label}</span>
                      <span className="text-[var(--color-text-secondary)]"> · {canSend ? '可进入最终人工发送。' : blockingReason}</span>
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {primaryAction ? (
                        <Button variant={primaryAction.variant} size="sm" disabled={primaryAction.disabled} onClick={primaryAction.onClick}>
                          {'icon' in primaryAction && primaryAction.icon ? <primaryAction.icon size={14} /> : null}
                          {primaryAction.label}
                        </Button>
                      ) : null}
                      {secondaryActions.map(item => (
                        <Button key={item.label} size="sm" variant="secondary" onClick={item.onClick}>
                          {'icon' in item && item.icon ? <item.icon size={14} /> : null}
                          {item.label}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <Button size="sm" variant="warning" onClick={() => onReview(activeTicket.id, 'escalated')}><AlertTriangle size={14} /> 强制升级</Button>
                      <Button size="sm" variant="secondary" onClick={() => onCloseTicket(activeTicket.id)}><CheckSquare size={14} /> 关闭工单</Button>
                    </div>

                    <div className="mt-4 space-y-3">
                      <CollapsibleSummary
                        title="风险详情"
                        summary={`${displayRiskLevel(activeTicket.riskLevel)}，命中 ${riskRuleName}。`}
                        open={showRiskDetails}
                        onToggle={() => setShowRiskDetails(prev => !prev)}
                      >
                        <div className="space-y-2 text-xs">
                          <div><strong>白话解释：</strong>{riskReason}</div>
                          <div><strong>策略判定：</strong>{activeTicket.policyDecision}</div>
                          <div><strong>当前要求：</strong>{activeTicket.requiredAction}</div>
                        </div>
                      </CollapsibleSummary>

                      <CollapsibleSummary
                        title="RAG 证据"
                        summary={`RAG 证据：${ragEvidenceSummary}`}
                        open={showRagEvidence}
                        onToggle={() => setShowRagEvidence(prev => !prev)}
                      >
                        <div className="space-y-2">
                          {activeDraft.citations.map(citation => (
                            <div key={citation.chunkId} className="rounded-[12px] border border-[var(--color-border-light)] p-3 text-xs bg-[var(--color-bg)]">
                              <div><strong>Source：</strong>{citation.source}</div>
                              <div><strong>Match Score：</strong>{citation.match}</div>
                              <div><strong>Evidence Type：</strong>政策文档</div>
                              <div><strong>Why Used：</strong>用于支撑{displayIssueType(activeTicket.issueType)}的回复判断。</div>
                              <div><strong>Chunk Text：</strong>{activeDraft.explanation[0] ?? '当前引用用于支撑策略与措辞边界。'}</div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleSummary>

                      <CollapsibleSummary
                        title="运行日志"
                        summary={activeDraft.sourceTrace ? `草稿由 ${activeDraft.sourceTrace.draftingModel} 生成，检索摘要为“${activeDraft.sourceTrace.retrievalSummary}”。` : '暂无运行日志'}
                        open={showSourceTrace}
                        onToggle={() => setShowSourceTrace(prev => !prev)}
                      >
                        {activeDraft.sourceTrace ? (
                          <div className="grid grid-cols-2 gap-2 text-xs max-[900px]:grid-cols-1">
                            <SignalCard label="场景配置" value={`${activeDraft.sourceTrace.scenarioConfigName} ${activeDraft.sourceTrace.scenarioConfigVersion}`} />
                            <SignalCard label="检索摘要" value={activeDraft.sourceTrace.retrievalSummary} />
                            <SignalCard label="草稿模型" value={activeDraft.sourceTrace.draftingModel} />
                            <SignalCard label="护栏结论" value={activeDraft.sourceTrace.guardrailResult} />
                          </div>
                        ) : (
                          <div className="text-xs text-[var(--color-text-secondary)]">暂无运行来源信息</div>
                        )}
                      </CollapsibleSummary>

                      <CollapsibleSummary
                        title="对话摘要"
                        summary={latestCustomerMessage ? `客户最新消息：${latestCustomerMessage.content}` : '暂无对话摘要'}
                        open={showConversation}
                        onToggle={() => setShowConversation(prev => !prev)}
                      >
                        {activeMessages.length > 0 ? (
                          <div className="space-y-2">
                            {visibleMessages.map((message, index) => (
                              <div key={`${message.timestamp}-${index}`} className="border border-[var(--color-border-light)] rounded-[12px] px-3 py-2 bg-[var(--color-bg)] text-xs">
                                <div className="text-[11px] text-[var(--color-text-light)] mb-1">{message.sender === 'customer' ? '客户' : message.sender === 'system' ? '系统' : '客服'} · {message.timestamp}</div>
                                <div className="whitespace-pre-wrap">{message.content}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-[var(--color-text-secondary)]">暂无会话记录</div>
                        )}
                      </CollapsibleSummary>
                    </div>
                    </>
                  ) : (
                    <EmptyState
                      title="尚未生成回复草稿"
                      description="先生成 AI 草稿，再决定是否采用、复核或最终发送。"
                      compact
                      action={<Button size="sm" variant="secondary" onClick={() => onDraft(activeTicket.id)}>重新生成</Button>}
                    />
                  )}
                </section>
              </div>
            </>
          ) : (
            <div className="p-6"><EmptyState title="尚未选择工单" description={t.common.selectConversation} compact /></div>
          )}
        </PanelCard>

        <DetailPanel title="客户 360 视图" className="overflow-y-auto p-4 max-[1320px]:col-span-2 max-[1180px]:col-span-1">
          {activeTicket && activeCustomer ? (
            <div className="space-y-4">
              <section>
                <div className="text-sm font-semibold mb-2">AI 客户概览</div>
                <div className="text-xs text-[var(--color-text-secondary)] leading-6">{customerOverview}</div>
                <div className="flex gap-1 flex-wrap mt-3">
                  {[activeCustomer.segment, activeTicket.riskLevel === 'High' ? '高风险' : null, activeReview?.status === 'pending' ? '待复核' : null].filter(Boolean).slice(0, 3).map(item => (
                    <Badge key={String(item)} variant={item === '高风险' ? 'red' : item === '待复核' ? 'yellow' : 'blue'}>{item}</Badge>
                  ))}
                </div>
              </section>

              <section>
                <div className="text-sm font-semibold mb-2">客户关键指标</div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <SignalCard label="客户终身价值" value={`$${activeCustomer.lifetimeValue}`} />
                  <SignalCard label="订单数" value={String(activeCustomer.totalOrders)} />
                  <SignalCard label="投诉历史" value={String(activeCustomer.complaintHistory)} />
                  <SignalCard label="履约达成率" value={activeCustomer.promiseFulfillment} />
                </div>
              </section>

              {activeOrder ? (
                <section>
                <div className="text-sm font-semibold mb-2">当前订单上下文</div>
                  <div className="rounded-[14px] border border-[var(--color-border-light)] p-3 text-xs space-y-1.5">
                    <div><strong>订单：</strong> {activeOrder.id}</div>
                    <div><strong>支付：</strong> {displayPaymentStatus(activeOrder.paymentStatus)}</div>
                    <div><strong>履约：</strong> {displayFulfillmentStatus(activeOrder.fulfillmentStatus)}</div>
                    <div><strong>物流：</strong> {activeOrder.latestEvent}</div>
                    <div><strong>风险：</strong> {activeOrder.riskAlert || '无'}</div>
                  </div>
                </section>
              ) : null}

              <section>
                <div className="text-sm font-semibold mb-2">复核与跟进状态</div>
                <div className="space-y-2">
                  <div className="rounded-[14px] border border-[var(--color-border-light)] p-3 text-xs bg-[var(--color-bg)]">
                    <div className="mb-1"><strong>复核状态：</strong> {activeReview ? displayReviewStatus(activeReview.status) : '无'}</div>
                    <div className="mb-1"><strong>负责人：</strong> {activeReview?.reviewer ?? activeCustomer.owner}</div>
                    <div className="mb-1"><strong>客户承诺：</strong> {activeTicket.executionOutcome.customerPromise}</div>
                    <div><strong>下一次跟进：</strong> {activeTicket.executionOutcome.followUpAt || '待定'}</div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <EmptyState title="暂无客户上下文" description={t.common.noData} compact />
          )}
        </DetailPanel>
      </div>
    </div>
  );
}

function SignalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--color-border-light)] rounded-[14px] bg-[rgba(255,255,255,0.56)] p-2.5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)]">{label}</div>
      <div className="text-xs font-medium mt-1">{value}</div>
    </div>
  );
}

function CollapsibleSummary({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.55)] p-3">
      <button type="button" className="w-full flex items-start justify-between gap-3 text-left" onClick={onToggle}>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">{title}</div>
          <div className="mt-1 text-xs text-[var(--color-text-secondary)]">{summary}</div>
        </div>
        {open ? <ChevronUp size={16} className="text-[var(--color-text-secondary)] shrink-0" /> : <ChevronDown size={16} className="text-[var(--color-text-secondary)] shrink-0" />}
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function summarizeQueue(summary: string) {
  return summary.replace('客户', '').replace('。', '').trim();
}

function highestCitation(draft: ReplyDraft) {
  return draft.citations.reduce((max, item) => {
    const parsed = Number(item.match.replace('%', ''));
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);
}

function buildReviewChecklist({
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
}) {
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
  ] as const;
}
