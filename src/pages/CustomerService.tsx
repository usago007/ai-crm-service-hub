import type { CustomerProfile, ListQuery, Message, Order, PagedResult, ReplyDraft, ReviewDecision, ServiceTicket, TicketAction, TicketFilters } from '../types';
import { useT } from '../i18n';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { Button } from '../components/common/Button';
import { DetailPanel, EmptyState, FilterBar, PageHeader, PanelCard, StatCard, inputCls } from '../components/common/PageChrome';
import { AlertTriangle, Bot, CheckSquare, Save, Send } from 'lucide-react';
import { displayActionStatus, displayChannel, displayFulfillmentStatus, displayIssueType, displayLanguage, displayPaymentStatus, displayReviewStatus, displayRiskLevel, displayWorkflow } from '../utils/display';

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
}

const stageVariant: Record<ServiceTicket['workflowStage'], 'gray' | 'blue' | 'yellow' | 'green' | 'red'> = {
  triage: 'gray',
  retrieve: 'blue',
  draft: 'blue',
  review: 'yellow',
  execute: 'red',
  'follow-up': 'blue',
  resolved: 'green',
};

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
}: CustomerServiceProps) {
  const { t } = useT();
  const activeTicket = selectedTicketId ? result.items.find(item => item.id === selectedTicketId) ?? result.items[0] ?? null : result.items[0] ?? null;
  const activeCustomer = customers.find(item => item.id === activeTicket?.customerId) ?? null;
  const activeOrder = orders.find(item => item.customerId === activeTicket?.customerId) ?? null;
  const activeMessages = messages.filter(item => item.ticketId === activeTicket?.id);
  const activeDraft = drafts.find(item => item.id === activeTicket?.draftId) ?? null;
  const activeReview = reviews.find(item => item.id === activeTicket?.reviewDecisionId) ?? null;
  const activeActions = actions.filter(item => activeTicket?.actionIds.includes(item.id));
  const sendBlocked = activeTicket?.sendGuardrailResult?.blocked ?? false;
  const reviewQueue = result.items.filter(item => item.manualReview).length;
  const blockedCount = result.items.filter(item => item.sendGuardrailResult?.blocked).length;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Agent workspace"
        title={t.page.service}
        description={t.page.subtitle_service}
        aside={
          <div className="grid grid-cols-3 gap-3 max-[980px]:grid-cols-1">
            <StatCard label="待处理队列" value={String(result.total)} detail="客服与工单主链路中的当前任务规模。" />
            <StatCard label="人工复核" value={String(reviewQueue)} detail="命中高风险路径，必须先经过人工判断。" tone="warning" />
            <StatCard label="发送阻止" value={String(blockedCount)} detail="存在高敏感承诺，AI 不允许直接触达客户。" tone="danger" />
          </div>
        }
      />

      <PanelCard
        title="AI 辅助运行规则"
        description="AI 只负责分类、摘要、检索、草稿和风险提醒。客户消息发送、退款批准、赔偿承诺、投诉关闭都保留给人工。"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Badge variant="green">仅作辅助</Badge>
            <Badge variant="red">禁止自动发送</Badge>
            <Badge variant="yellow">风险路径需人工复核</Badge>
          </div>
        }
      >
        <div className="grid grid-cols-3 gap-3 text-xs max-[980px]:grid-cols-1">
          <RuleTile title="AI 可以" detail="分类、摘要、检索知识、生成可编辑回复草稿，并提醒潜在风险。" tone="green" />
          <RuleTile title="AI 不可以" detail="承诺退款、关闭投诉、发送客户消息或生成超出政策边界的结论。" tone="red" />
          <RuleTile title="人工控制" detail="高风险路径保留在人类手中，所有执行动作都必须能解释并可审计。" tone="yellow" />
        </div>
      </PanelCard>

      <FilterBar>
        <select className={inputCls} value={query.filters.channel ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, channel: e.target.value || undefined } }))}>
          <option value="">全部渠道</option>
          {['Email', 'Live Chat', 'Ticket'].map(item => <option key={item} value={item}>{displayChannel(item as ServiceTicket['channel'])}</option>)}
        </select>
        <select className={inputCls} value={query.filters.workflowStage ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, workflowStage: e.target.value || undefined } }))}>
          <option value="">全部流程</option>
          {['triage', 'retrieve', 'draft', 'review', 'execute', 'follow-up', 'resolved'].map(item => <option key={item} value={item}>{displayWorkflow(item as ServiceTicket['workflowStage'])}</option>)}
        </select>
        <select className={inputCls} value={query.filters.riskLevel ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, riskLevel: e.target.value || undefined } }))}>
          <option value="">全部风险</option>
          {['Low', 'Medium', 'High'].map(item => <option key={item} value={item}>{displayRiskLevel(item)}</option>)}
        </select>
        <Button variant="secondary" size="sm" onClick={() => onQueryChange(prev => ({ ...prev, page: 1, filters: {} }))}>重置筛选</Button>
      </FilterBar>

      <div className="grid grid-cols-[320px_minmax(0,1fr)_360px] gap-4 min-h-[calc(100vh-240px)] max-[1400px]:grid-cols-1">
        <PanelCard title="AI 辅助队列" description="按风险、流程和渠道组织当前客服处理任务。" className="overflow-hidden p-0">
          <div className="overflow-y-auto max-h-[calc(100vh-320px)]">
            {result.items.length > 0 ? result.items.map(ticket => {
              const customer = customers.find(item => item.id === ticket.customerId);
              const active = ticket.id === activeTicket?.id;
              return (
                <div
                  key={ticket.id}
                  className={`px-4 py-3 border-b border-[var(--color-border-light)] cursor-pointer transition-all ${active ? 'bg-[var(--color-primary-bg)] shadow-[inset_3px_0_0_var(--color-primary)]' : 'hover:bg-[rgba(255,255,255,0.42)]'}`}
                  onClick={() => onSelectTicket(ticket.id)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-[13px] font-semibold">{ticket.id}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">{customer?.name}</div>
                    </div>
                    <Badge variant={stageVariant[ticket.workflowStage]}>{displayWorkflow(ticket.workflowStage)}</Badge>
                  </div>
                  <div className="text-xs text-[var(--color-text)] mb-2">{ticket.summary}</div>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant={ticket.riskLevel === 'High' ? 'red' : ticket.riskLevel === 'Medium' ? 'yellow' : 'green'}>{displayRiskLevel(ticket.riskLevel)}</Badge>
                    <Badge variant="blue">{ticket.intent}</Badge>
                    <Badge variant="gray">{displayChannel(ticket.channel)}</Badge>
                  </div>
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

        <PanelCard title={activeTicket ? `${activeTicket.id} · ${displayIssueType(activeTicket.issueType)}` : '工单工作区'} description={activeTicket?.aiSummary ?? '选择左侧队列中的工单后查看 AI 草稿、会话上下文和执行动作。'} className="flex flex-col min-h-0 p-0 overflow-hidden">
          {activeTicket ? (
            <>
              <div className="px-4 py-4 border-b border-[var(--color-border)] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant={stageVariant[activeTicket.workflowStage]}>{displayWorkflow(activeTicket.workflowStage)}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs max-[900px]:grid-cols-1">
                  <SignalCard label="意图" value={activeTicket.intent} />
                  <SignalCard label="策略判定" value={activeTicket.policyDecision} />
                  <SignalCard label="所需动作" value={activeTicket.requiredAction} />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" size="sm" onClick={() => onRetrieve(activeTicket.id)}>重新执行检索</Button>
                  <Button variant="secondary" size="sm" onClick={() => onDraft(activeTicket.id)}>生成草稿</Button>
                  <Button variant="secondary" size="sm" onClick={() => onReview(activeTicket.id, 'approved')}>通过复核</Button>
                  <Button variant="secondary" size="sm" onClick={() => onReview(activeTicket.id, 'escalated')}>升级处理</Button>
                  {activeActions[0] ? (
                    <Button size="sm" onClick={() => onRunAction(activeTicket.id, activeActions[0].id)}>执行内部动作</Button>
                  ) : null}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="rounded-[16px] border border-[var(--color-border-light)] p-4 bg-[var(--color-bg)]">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">对话与摘要</div>
                    <Badge variant={activeTicket.manualReview ? 'yellow' : 'green'}>{activeTicket.manualReview ? '需要人工复核' : '标准路径'}</Badge>
                  </div>
                  {activeMessages.length > 0 ? (
                    <div className="space-y-2">
                      {activeMessages.map((message, index) => (
                        <div key={`${message.timestamp}-${index}`} className="border border-[var(--color-border-light)] rounded-[12px] px-3 py-2 bg-white">
                          <div className="text-[11px] text-[var(--color-text-light)] mb-1">{message.sender === 'customer' ? '客户' : message.sender === 'system' ? '系统' : '客服'} · {message.timestamp}</div>
                          <div className="text-xs whitespace-pre-wrap">{message.content}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="暂无会话记录" description="当前工单还没有沉淀出可供复核的消息往来，先执行检索或等待渠道同步。" compact />
                  )}
                </div>

                {activeDraft ? (
                  <div className="rounded-[16px] border border-[var(--color-border)] p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-sm font-semibold">AI 回复草稿</div>
                    <div className="flex gap-2">
                        <Badge variant={activeDraft.riskLevel === 'High' ? 'red' : activeDraft.riskLevel === 'Medium' ? 'yellow' : 'green'}>{displayRiskLevel(activeDraft.riskLevel)}</Badge>
                        <Badge variant="blue">置信度 {activeDraft.confidence}%</Badge>
                      </div>
                    </div>
                    <div className="text-xs whitespace-pre-wrap mb-3">{activeDraft.content}</div>
                    <div className="flex gap-2 flex-wrap mb-3">
                      {activeDraft.citations.map(citation => (
                        <Badge key={citation.chunkId} variant="blue">{citation.source} {citation.match}</Badge>
                      ))}
                    </div>
                    <div className="rounded-[12px] bg-[var(--color-bg)] border border-[var(--color-border-light)] p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)] mb-2">草稿依据</div>
                      <ul className="list-disc pl-4 text-[11px] text-[var(--color-text-secondary)] space-y-1">
                        {activeDraft.explanation.map(line => <li key={line}>{line}</li>)}
                      </ul>
                    </div>
                    {activeDraft.sourceTrace ? (
                      <div className="rounded-[12px] bg-[var(--color-primary-bg)] border border-[var(--color-border-light)] p-3 mt-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-secondary)] mb-2">运行来源</div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] max-[900px]:grid-cols-1">
                          <SignalCard label="当前场景" value={displayIssueType(activeTicket.issueType)} />
                          <SignalCard label="场景配置" value={`${activeDraft.sourceTrace.scenarioConfigName} ${activeDraft.sourceTrace.scenarioConfigVersion}`} />
                          <SignalCard label="草稿模型" value={activeDraft.sourceTrace.draftingModel} />
                          <SignalCard label="检索摘要" value={activeDraft.sourceTrace.retrievalSummary} />
                          <SignalCard label="必须引用" value={activeDraft.sourceTrace.citationRequired ? '是' : '否'} />
                          <SignalCard label="护栏结论" value={activeDraft.sourceTrace.guardrailResult} />
                        </div>
                        <div className="mt-3">
                          <div className="text-[11px] text-[var(--color-text-secondary)] mb-1">节点模型</div>
                          <div className="flex gap-1 flex-wrap">
                            {activeDraft.sourceTrace.nodeModels.map(item => <Badge key={item} variant="blue">{item}</Badge>)}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <EmptyState
                    title="尚未生成回复草稿"
                    description="先运行检索和草稿生成，再决定是否插入 AI 建议或进入人工复核。"
                    compact
                    action={<Button size="sm" variant="secondary" onClick={() => onDraft(activeTicket.id)}>生成草稿</Button>}
                  />
                )}

                <div className="rounded-[16px] border border-[var(--color-danger)] bg-[var(--color-danger-bg)] p-4">
                  <div className="text-sm font-semibold text-[var(--color-danger)] mb-1">人工复核门</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    AI 草稿可以编辑，但不能直接发送。退款、投诉、赔偿和政策敏感路径必须保持人工控制。
                  </div>
                  {activeTicket?.sendGuardrailResult ? (
                    <div className="mt-2 text-xs text-[var(--color-text-secondary)]">
                      当前发送状态：{activeTicket.sendGuardrailResult.reason}
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.18em] mb-2">可编辑回复区</div>
                  <textarea
                    className="w-full h-40 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-xs bg-white outline-none resize-none transition-all duration-200 focus:border-[rgba(179,92,32,0.34)] focus:shadow-[0_0_0_4px_rgba(179,92,32,0.10)]"
                    value={replyText}
                    onChange={e => onReplyTextChange(e.target.value)}
                    placeholder={t.common.typeReply}
                  />
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => onInsertAI(activeTicket.id)}><Bot size={14} /> 插入 AI 建议</Button>
                    <Button size="sm" variant="success" disabled={sendBlocked} onClick={() => onSendReply(activeTicket.id)}><Send size={14} /> {sendBlocked ? '发送前需先复核' : '发送回复'}</Button>
                    <Button size="sm" variant="secondary" onClick={() => onSaveDraft(activeTicket.id)}><Save size={14} /> 保存草稿</Button>
                    <Button size="sm" variant="warning" onClick={() => onReview(activeTicket.id, 'escalated')}><AlertTriangle size={14} /> 升级工单</Button>
                    <Button size="sm" variant="secondary" onClick={() => onCloseTicket(activeTicket.id)}><CheckSquare size={14} /> 关闭工单</Button>
                  </div>
                  {sendBlocked ? (
                    <div className="mt-2 text-[11px] leading-5 text-[var(--color-danger)]">
                      当前草稿已命中发送护栏，必须先通过人工复核或升级处理，不能直接发送给客户。
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div className="p-6"><EmptyState title="尚未选择工单" description={t.common.selectConversation} compact /></div>
          )}
        </PanelCard>

        <DetailPanel title={activeCustomer ? `${activeCustomer.name} 的客户视图` : '客户 360 视图'} description={activeCustomer ? `${activeCustomer.country} · ${displayLanguage(activeCustomer.preferredLanguage)} · 负责人 ${activeCustomer.owner}` : '展示客户标签、订单和复核执行信息。'} className="overflow-y-auto p-4">
          {activeTicket && activeCustomer ? (
            <div className="space-y-4">
              <section>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="text-sm font-semibold">客户 360 视图</div>
                  <Badge variant="blue">{activeCustomer.segment}</Badge>
                </div>
                <div className="text-[13px] font-semibold">{activeCustomer.name}</div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">{activeCustomer.country} · {displayLanguage(activeCustomer.preferredLanguage)} · 负责人 {activeCustomer.owner}</div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <SignalCard label="客户终身价值" value={`$${activeCustomer.lifetimeValue}`} />
                  <SignalCard label="订单数" value={String(activeCustomer.totalOrders)} />
                  <SignalCard label="投诉历史" value={String(activeCustomer.complaintHistory)} />
                  <SignalCard label="履约达成率" value={activeCustomer.promiseFulfillment} />
                </div>
                <div className="flex gap-1 flex-wrap mt-3">
                  {activeCustomer.tags.map(tag => <Badge key={tag} variant="blue">{tag}</Badge>)}
                  {activeCustomer.riskFlags.map(flag => <Badge key={flag} variant="red">{flag}</Badge>)}
                </div>
              </section>

              {activeOrder ? (
                <section>
                <div className="text-sm font-semibold mb-2">订单与物流上下文</div>
                  <div className="rounded-[14px] border border-[var(--color-border-light)] p-3 text-xs space-y-1.5">
                    <div><strong>订单：</strong> {activeOrder.id}</div>
                    <div><strong>履约：</strong> {displayFulfillmentStatus(activeOrder.fulfillmentStatus)}</div>
                    <div><strong>支付：</strong> {displayPaymentStatus(activeOrder.paymentStatus)}</div>
                    <div><strong>物流商：</strong> {activeOrder.carrier || '-'}</div>
                    <div><strong>物流单号：</strong> {activeOrder.tracking || '-'}</div>
                    <div><strong>最新动态：</strong> {activeOrder.latestEvent}</div>
                    <div><strong>风险：</strong> {activeOrder.riskAlert || '无'}</div>
                  </div>
                </section>
              ) : null}

              <section>
                <div className="text-sm font-semibold mb-2">复核与执行</div>
                <div className="space-y-2">
                  <div className="rounded-[14px] border border-[var(--color-border-light)] p-3 text-xs bg-[var(--color-bg)]">
                    <div className="mb-1"><strong>客户承诺：</strong> {activeTicket.executionOutcome.customerPromise}</div>
                    <div className="mb-1"><strong>当前状态：</strong> {activeTicket.executionOutcome.finalState}</div>
                    <div><strong>下次跟进：</strong> {activeTicket.executionOutcome.followUpAt || '待定'}</div>
                  </div>
                  {activeReview ? (
                    <div className="rounded-[14px] border border-[var(--color-border-light)] p-3 text-xs">
                      <div className="mb-1"><strong>复核状态：</strong> {displayReviewStatus(activeReview.status)}</div>
                      <div className="mb-1"><strong>复核人：</strong> {activeReview.reviewer}</div>
                      <div><strong>原因：</strong> {activeReview.reason}</div>
                    </div>
                  ) : null}
                </div>
              </section>

              {activeActions.length > 0 ? (
                <section className="space-y-2">
                  <div className="text-sm font-semibold">内部动作</div>
                  {activeActions.map(action => (
                    <div key={action.id} className="border border-[var(--color-border-light)] rounded-[14px] p-3">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="text-xs font-medium">{action.label}</div>
                        <Badge variant={action.status === 'completed' ? 'green' : action.status === 'blocked' ? 'red' : 'yellow'}>{displayActionStatus(action.status)}</Badge>
                      </div>
                      <div className="text-[11px] text-[var(--color-text-secondary)]">{action.result}</div>
                    </div>
                  ))}
                </section>
              ) : null}
            </div>
          ) : (
            <EmptyState title="暂无客户上下文" description={t.common.noData} compact />
          )}
        </DetailPanel>
      </div>
    </div>
  );
}

function RuleTile({ title, detail, tone }: { title: string; detail: string; tone: 'green' | 'red' | 'yellow' }) {
  return (
    <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.52)] p-4">
      <div className={`text-[11px] uppercase tracking-[0.18em] ${tone === 'green' ? 'text-[var(--color-success)]' : tone === 'red' ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]'}`}>{title}</div>
      <div className="text-[13px] leading-6 text-[var(--color-text-secondary)] mt-2">{detail}</div>
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
