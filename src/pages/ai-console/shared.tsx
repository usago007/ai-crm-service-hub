import type { ReactNode } from 'react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/common/DataTable';
import { PanelCard, StatCard as BaseStatCard } from '../../components/common/PageChrome';
import type { NavKey } from '../../types';
import type { AIConsoleBusinessCase } from './types';
import {
  displayFulfillmentStatus,
  displayIssueType,
  displayPaymentStatus,
  displayReviewStatus,
  displayRiskLevel,
  displayTicketStatus,
  displayWorkflow,
} from '../../utils/display';

export function PageHeader({ title, description, actions, meta }: { title: string; description?: string; actions?: ReactNode; meta?: ReactNode }) {
  return (
    <div className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFC_100%)] p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-[20px] font-semibold tracking-[-0.02em]">{title}</div>
          {description ? <div className="text-sm text-[var(--color-text-secondary)] mt-1 leading-6">{description}</div> : null}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {meta ? <span className="text-[11px] text-[var(--color-text-light)]">{meta}</span> : null}
          {actions}
        </div>
      </div>
    </div>
  );
}

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return <PanelCard eyebrow={title} className="p-5">{children}</PanelCard>;
}

export function StatCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'green' | 'yellow' | 'red';
}) {
  return <BaseStatCard label={label} value={value} detail={detail} tone={tone} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

export function InlineAction({ label, onClick }: { label: string; onClick: () => void }) {
  return <Button variant="ghost" size="sm" onClick={onClick}>{label}</Button>;
}

export function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.68)] p-3.5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)]">{label}</div>
      <div className="text-[13px] font-medium mt-2 leading-5">{value}</div>
    </div>
  );
}

export function PromptBlock({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] rounded-[20px] p-4 text-xs ${className}`}>
      <div className="text-[var(--color-text-light)] uppercase tracking-[0.16em] font-semibold mb-2 text-[11px]">{label}</div>
      <div className="leading-6 whitespace-pre-wrap">{value}</div>
    </div>
  );
}

export function PromptListBlock({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] rounded-[20px] p-4 text-xs">
      <div className="text-[var(--color-text-light)] uppercase tracking-[0.16em] font-semibold mb-2 text-[11px]">{label}</div>
      <ul className="list-disc pl-4 space-y-1">
        {values.map(value => <li key={value}>{value}</li>)}
      </ul>
    </div>
  );
}

function stageDone(value: boolean) {
  return value ? 'green' : 'gray';
}

export function BusinessLoopPanel({
  businessCase,
  onOpenPage,
  onReplayRun,
  onDraftTicket,
}: {
  businessCase: AIConsoleBusinessCase;
  onOpenPage: (page: NavKey) => void;
  onReplayRun: (ticketId: string) => void;
  onDraftTicket: (ticketId: string) => void;
}) {
  const ticket = businessCase.ticket;
  const customer = businessCase.customer;
  const order = businessCase.order;
  const review = businessCase.review;

  if (!ticket || !customer) {
    return (
      <PanelCard className="p-5">
        <div className="text-sm font-semibold">当前没有可串联的业务案例</div>
        <div className="mt-2 text-xs text-[var(--color-text-secondary)]">先从客服工作台选择一张工单，系统设置目录下的页面才会围绕真实客户、订单与客服上下文运行。</div>
      </PanelCard>
    );
  }

  return (
    <PanelCard className="p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-light)]">业务闭环案例</div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <div className="text-lg font-semibold">{ticket.id} · {displayIssueType(ticket.issueType)}</div>
            <Badge variant={ticket.riskLevel === 'High' ? 'red' : ticket.riskLevel === 'Medium' ? 'yellow' : 'green'}>{displayRiskLevel(ticket.riskLevel)}</Badge>
            <Badge variant="blue">{displayWorkflow(ticket.workflowStage)}</Badge>
            <Badge variant="gray">{displayTicketStatus(ticket.status)}</Badge>
          </div>
          <div className="mt-2 text-xs text-[var(--color-text-secondary)]">
            {customer.name} / {customer.country} / {customer.segment}
            {order ? ` / ${order.id} / ${displayPaymentStatus(order.paymentStatus)} / ${displayFulfillmentStatus(order.fulfillmentStatus)}` : ' / 当前未关联订单'}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="secondary" onClick={() => onOpenPage('service')}>打开客服工作台</Button>
          <Button size="sm" variant="secondary" onClick={() => onOpenPage('customers')}>查看客户</Button>
          <Button size="sm" variant="secondary" onClick={() => onOpenPage('orders')}>查看订单</Button>
          <Button size="sm" onClick={() => onReplayRun(ticket.id)}>重跑检索</Button>
          <Button size="sm" onClick={() => onDraftTicket(ticket.id)}>生成草稿</Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-3 max-[1200px]:grid-cols-2">
        <InfoCard label="会话消息" value={`${businessCase.messageCount} 条`} />
        <InfoCard label="知识命中" value={`${businessCase.knowledgeDocuments.length} 份`} />
        <InfoCard label="审计事件" value={`${businessCase.auditLogs.length} 条`} />
        <InfoCard label="跟进任务" value={`${businessCase.followUpTasks.length} 个`} />
        <InfoCard label="人工复核" value={review ? displayReviewStatus(review.status) : '尚未进入'} />
      </div>

      <div className="mt-4 flex gap-2 flex-wrap text-xs">
        <Badge variant={stageDone(Boolean(customer))}>客户已识别</Badge>
        <Badge variant={stageDone(Boolean(order))}>订单已关联</Badge>
        <Badge variant={stageDone(Boolean(businessCase.ragRun))}>检索已沉淀</Badge>
        <Badge variant={stageDone(Boolean(businessCase.draft))}>草稿已产出</Badge>
        <Badge variant={stageDone(review?.status === 'approved')}>复核已通过</Badge>
        <Badge variant={stageDone(ticket.workflowStage === 'follow-up' || ticket.workflowStage === 'resolved')}>执行已落账</Badge>
      </div>
    </PanelCard>
  );
}

export { DataTable };
