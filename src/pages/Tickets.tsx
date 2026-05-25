import type { ListQuery, PagedResult, ReviewDecision, ServiceTicket, TicketFilters } from '../types';
import { useState } from 'react';
import { useT } from '../i18n';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { Button } from '../components/common/Button';
import { Drawer } from '../components/common/Drawer';
import { EmptyState, FilterBar, PanelCard, StatCard, SummaryHeader, inputCls } from '../components/common/PageChrome';
import { displayBoolean, displayChannel, displayIssueType, displayReviewStatus, displayRiskLevel, displayWorkflow, displayTicketStatus } from '../utils/display';

interface TicketsPageProps {
  result: PagedResult<ServiceTicket>;
  reviews: ReviewDecision[];
  query: ListQuery<TicketFilters>;
  onQueryChange: (updater: (prev: ListQuery<TicketFilters>) => ListQuery<TicketFilters>) => void;
  selectedTicketId: string | null;
  onSelectTicket: (id: string | null) => void;
  onViewTicket: (id: string) => void;
}

export function TicketsPage({ result, reviews, query, onQueryChange, selectedTicketId, onSelectTicket, onViewTicket }: TicketsPageProps) {
  const { t } = useT();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeTicket = selectedTicketId ? result.items.find(ticket => ticket.id === selectedTicketId) ?? result.items[0] ?? null : result.items[0] ?? null;
  const activeReview = activeTicket ? reviews.find(item => item.id === activeTicket.reviewDecisionId) ?? null : null;
  const reviewQueue = result.items.filter(ticket => ticket.manualReview).length;
  const highRiskCount = result.items.filter(ticket => ticket.riskLevel === 'High').length;

  return (
    <div className="space-y-4">
      <SummaryHeader
        aside={
          <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
            <StatCard label="工单总量" value={String(result.total)} detail="当前筛选条件下的客服工单。" />
            <StatCard label="人工复核" value={String(reviewQueue)} detail="需要人工确认后才可继续流转。" tone="warning" />
            <StatCard label="高风险" value={String(highRiskCount)} detail="命中高风险策略或敏感动作。" tone="danger" />
          </div>
        }
      />

      <FilterBar>
        <select className={inputCls} value={query.filters.status ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, status: e.target.value || undefined } }))}>
          <option value="">全部状态</option>
          {['New', 'In Progress', 'Pending Review', 'Waiting Customer', 'Closed', 'Escalated'].map(item => <option key={item} value={item}>{displayTicketStatus(item as ServiceTicket['status'])}</option>)}
        </select>
        <select className={inputCls} value={query.filters.workflowStage ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, workflowStage: e.target.value || undefined } }))}>
          <option value="">全部流程</option>
          {['triage', 'retrieve', 'draft', 'review', 'execute', 'follow-up', 'resolved'].map(item => <option key={item} value={item}>{displayWorkflow(item as ServiceTicket['workflowStage'])}</option>)}
        </select>
        <select className={inputCls} value={query.filters.channel ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, channel: e.target.value || undefined } }))}>
          <option value="">全部渠道</option>
          {['Email', 'Live Chat', 'Ticket'].map(item => <option key={item} value={item}>{displayChannel(item as ServiceTicket['channel'])}</option>)}
        </select>
        <div className="filter-compact-actions">
          <select className={inputCls} value={query.filters.riskLevel ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, riskLevel: e.target.value || undefined } }))}>
            <option value="">全部风险</option>
            {['Low', 'Medium', 'High'].map(item => <option key={item} value={item}>{displayRiskLevel(item)}</option>)}
          </select>
          <Button variant="secondary" size="sm" onClick={() => onQueryChange(prev => ({ ...prev, page: 1, filters: {} }))}>重置筛选</Button>
        </div>
      </FilterBar>

      <PanelCard title="工单队列" description="统一查看意图、流程阶段、风险等级和人工复核状态。点击工单号或查看按钮后在抽屉查看详情。">
          {result.items.length > 0 ? (
            <>
              <div className="overflow-auto">
                <table className="w-full border-collapse min-w-[1200px]">
                  <thead>
                    <tr>
                      {['工单', '意图', '渠道', '流程', '风险', '负责人', '所需动作', '区域', '复核', '操作'].map(header => (
                        <th key={header} className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map(ticket => {
                      const review = reviews.find(item => item.id === ticket.reviewDecisionId);
                      return (
                        <tr
                          key={ticket.id}
                          className={`cursor-pointer border-b border-[var(--color-border-light)] ${activeTicket?.id === ticket.id ? 'bg-[var(--color-primary-bg)]' : 'hover:bg-[rgba(255,255,255,0.42)]'}`}
                          onClick={() => {
                            onSelectTicket(ticket.id);
                            setDrawerOpen(true);
                          }}
                        >
                          <td className="px-4 py-3 text-[13px]">
                            <button
                              type="button"
                              className="font-semibold text-left hover:text-[var(--color-primary)]"
                              onClick={event => {
                                event.stopPropagation();
                                onSelectTicket(ticket.id);
                                setDrawerOpen(true);
                              }}
                            >
                              {ticket.id}
                            </button>
                            <div className="text-[11px] text-[var(--color-text-light)] mt-1">{displayIssueType(ticket.issueType)}</div>
                          </td>
                          <td className="px-4 py-3 text-xs">{ticket.intent}</td>
                          <td className="px-4 py-3 text-xs">{displayChannel(ticket.channel)}</td>
                          <td className="px-4 py-3 text-xs"><Badge variant="blue">{displayWorkflow(ticket.workflowStage)}</Badge></td>
                          <td className="px-4 py-3 text-xs"><Badge variant={ticket.riskLevel === 'High' ? 'red' : ticket.riskLevel === 'Medium' ? 'yellow' : 'green'}>{displayRiskLevel(ticket.riskLevel)}</Badge></td>
                          <td className="px-4 py-3 text-xs">{ticket.assignee}</td>
                          <td className="px-4 py-3 text-xs">{ticket.requiredAction}</td>
                          <td className="px-4 py-3 text-xs">{ticket.region}</td>
                          <td className="px-4 py-3 text-xs"><Badge variant={review?.status === 'approved' ? 'green' : review?.status === 'pending' ? 'yellow' : 'red'}>{review ? displayReviewStatus(review.status) : '无'}</Badge></td>
                          <td className="px-4 py-3 text-xs">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={event => {
                                event.stopPropagation();
                                onSelectTicket(ticket.id);
                                setDrawerOpen(true);
                              }}
                            >
                              {t.common.view}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={result.page} totalPages={result.totalPages} total={result.total} onPageChange={page => onQueryChange(prev => ({ ...prev, page }))} />
            </>
          ) : (
            <EmptyState title="暂无工单" description="当前筛选条件下没有工单，重置筛选后查看全量队列。" />
          )}
      </PanelCard>

      <Drawer
        open={drawerOpen && Boolean(activeTicket)}
        onClose={() => setDrawerOpen(false)}
        title={activeTicket?.id ?? '工单详情'}
        actions={
          activeTicket ? (
            <Button size="sm" onClick={() => onViewTicket(activeTicket.id)}>
              进入客服工作台
            </Button>
          ) : null
        }
      >
        {activeTicket ? (
          <div className="space-y-4 text-xs">
            <div>
              <div className="text-sm font-semibold">{activeTicket.id}</div>
              <div className="text-[var(--color-text-secondary)] mt-1 leading-6">{activeTicket.summary}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InfoCard label="流程" value={displayWorkflow(activeTicket.workflowStage)} />
              <InfoCard label="人工复核" value={displayBoolean(activeTicket.manualReview)} />
              <InfoCard label="负责人" value={activeTicket.assignee} />
              <InfoCard label="区域" value={activeTicket.region} />
            </div>
            <PanelCard title="策略判定" className="p-4">
              <div className="space-y-2 text-[13px] text-[var(--color-text-secondary)]">
                <div><span className="text-[var(--color-text)] font-medium">所需动作：</span> {activeTicket.requiredAction}</div>
                <div><span className="text-[var(--color-text)] font-medium">策略判定：</span> {activeTicket.policyDecision}</div>
                <div><span className="text-[var(--color-text)] font-medium">客户承诺：</span> {activeTicket.executionOutcome.customerPromise}</div>
              </div>
            </PanelCard>
            {activeReview ? (
              <PanelCard title="人工复核结果" className="p-4">
                <div className="text-[13px]"><span className="font-medium">状态：</span> {displayReviewStatus(activeReview.status)}</div>
                <div className="mt-2 text-[var(--color-text-secondary)]">{activeReview.reason}</div>
              </PanelCard>
            ) : null}
          </div>
        ) : (
          <EmptyState title="尚未选择工单" description="从列表选择工单后查看详情。" compact />
        )}
      </Drawer>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.55)] p-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)]">{label}</div>
      <div className="font-medium mt-2">{value}</div>
    </div>
  );
}
