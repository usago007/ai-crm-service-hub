import type { Customer, Ticket, AISuggestion, Order } from '../../types';
import { useT } from '../../i18n';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { fmtDate } from '../../utils/format';
import { Bot, RefreshCw, AlertTriangle } from 'lucide-react';
import { PanelCard } from '../common/PageChrome';

interface CustomerContextPanelProps {
  ticket: Ticket;
  customer: Customer | null;
  aiSummary: string;
  aiSug: AISuggestion | null;
  aiSugs: AISuggestion[];
  orders: Order[];
  onInsertSuggestion: () => void;
  onRegenerate: () => void;
}

export function CustomerContextPanel({ ticket, customer, aiSummary, aiSug, aiSugs, orders, onInsertSuggestion, onRegenerate }: CustomerContextPanelProps) {
  const { t } = useT();
  const hasRisk = ticket.needsReview || ticket.issueType === 'Refund Request' || ticket.issueType === 'Complaint' || ticket.issueType === 'Return Request' || ticket.issueType === 'Payment Failed';
  const order = orders.length > 0 ? orders[0] : null;

  const riskKeyMap: Record<string, keyof typeof t.riskMessage> = {
    'Refund Request': 'refundRequest',
    'Complaint': 'complaint',
    'Return Request': 'defectiveProduct',
    'Payment Failed': 'paymentFailed',
  };
  const riskMsg = t.riskMessage[riskKeyMap[ticket.issueType] || 'default'];

  return (
    <div className="w-[340px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto scroll-smooth">
      {hasRisk && (
        <div className="rounded-[22px] border border-[rgba(200,85,76,0.24)] bg-[rgba(255,241,239,0.88)] p-3.5 flex gap-2.5 items-start shadow-[0_16px_28px_-24px_rgba(200,85,76,0.58)]">
          <AlertTriangle size={18} className="text-[var(--color-danger)] flex-shrink-0" />
          <div className="text-xs text-[var(--color-danger)] leading-5">
            <strong>{t.service.manualReviewRequired}</strong><br />
            {riskMsg}
          </div>
        </div>
      )}

      <PanelCard title={t.service.aiSummary} className="p-4">
        <div className="text-xs leading-6 bg-[rgba(179,92,32,0.10)] p-3 rounded-[18px] shadow-[inset_3px_0_0_var(--color-primary)]">
          {aiSummary || 'AI analysis in progress...'}
        </div>
      </PanelCard>

      <PanelCard title={t.service.aiSuggestedReply} className="overflow-hidden p-0">
        <div className="bg-[rgba(179,92,32,0.10)] px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-primary)]">{t.service.aiSuggestedReply}</span>
          {aiSug && (
            <span className="text-[11px] font-medium flex items-center gap-1.5">
              {aiSug.confidence}%
              <div className="w-[50px] h-1 rounded-sm bg-[var(--color-border-light)] overflow-hidden inline-block align-middle">
                <div
                  className={`h-full rounded-sm ${aiSug.confidence >= 85 ? 'bg-[var(--color-success)]' : aiSug.confidence >= 70 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-danger)]'}`}
                  style={{ width: `${aiSug.confidence}%` }}
                />
              </div>
            </span>
          )}
        </div>
        {aiSug ? (
          <>
            <div className="px-4 py-3 text-xs leading-6">{aiSug.content}</div>
            <div className="px-4 py-3 bg-[rgba(255,255,255,0.48)] border-t border-[var(--color-border-light)]">
              <div className="text-[11px] text-[var(--color-text-light)] mb-1">Sources:</div>
              {aiSug.sources.filter(s => s.name).map((s, i) => (
                <div key={i} className="text-[11px] text-[var(--color-text-secondary)] py-0.5 flex items-center gap-1.5">
                  {s.name}
                  {s.match && <span className="text-[10px] px-1.5 rounded-[3px] bg-[var(--color-success-bg)] text-[var(--color-success)] font-medium">{s.match}</span>}
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-[var(--color-border-light)] flex gap-1.5 flex-wrap">
              <Button size="sm" onClick={onInsertSuggestion}><Bot size={12} /> {t.service.insertToReply}</Button>
              <Button size="sm" variant="secondary" onClick={onRegenerate}><RefreshCw size={12} /> {t.service.regenerate}</Button>
              {aiSug.needsReview && <span className="text-[11px] text-[var(--color-danger)] ml-auto font-medium">{t.service.reviewRequired}</span>}
            </div>
          </>
        ) : (
          <div className="px-4 py-3 text-xs text-[var(--color-text-light)]">{t.service.noSuggestion}</div>
        )}
      </PanelCard>

      <PanelCard title={t.service.customerProfile} className="p-4">
        {customer ? (
          <>
            {[
              [t.customerField.name, customer.name],
              [t.customerField.email, customer.email],
              [t.customerField.country, customer.country],
              [t.customerField.language, customer.language],
              [t.customerField.type, customer.type],
              [t.customerField.totalOrders, String(customer.totalOrders)],
              [t.customerField.ltv, `$${customer.lifetimeValue.toFixed(2)}`],
              [t.customerField.lastContact, fmtDate(customer.lastContact)],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between py-0.5 text-xs">
                <span className="text-[var(--color-text-secondary)]">{k as string}</span>
                <span className="font-medium text-right ml-3">{v as string}</span>
              </div>
            ))}
            {customer.tags.length > 0 && (
              <div className="mt-2 flex gap-1 flex-wrap">
                {customer.tags.map((t, i) => <Badge key={i} variant="blue">{t}</Badge>)}
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-[var(--color-text-secondary)]">{t.common.noData}</div>
        )}
      </PanelCard>

      {order && (
        <PanelCard title={t.service.orderContext} className="p-4">
          {[
            [t.orderField.orderId, order.id],
            [t.orderField.date, new Date(order.date).toLocaleDateString()],
            [t.orderField.total, `$${order.total.toFixed(2)}`],
            [t.orderField.payment, order.paymentStatus],
            [t.orderField.fulfillment, order.fulfillmentStatus],
            [t.orderField.carrier, order.carrier || '-'],
            [t.orderField.tracking, order.tracking || '-'],
            [t.orderField.latest, order.latestEvent || '-'],
            [t.orderField.daysSinceUpdate, `${order.daysSinceUpdate} days`],
          ].map(([k, v]) => (
            <div key={k as string} className="flex justify-between py-0.5 text-xs">
              <span className="text-[var(--color-text-secondary)]">{k as string}</span>
              <span className="font-medium text-right ml-3">{v as string}</span>
            </div>
          ))}
          {order.riskAlert && (
            <div className="mt-2 p-2.5 bg-[rgba(255,241,239,0.86)] rounded-[16px] text-xs text-[var(--color-danger)]">{order.riskAlert}</div>
          )}
        </PanelCard>
      )}

      <PanelCard title={t.service.knowledgeMatches} className="p-4">
        {(aiSugs.length > 0 ? aiSugs[0].sources.filter(s => s.name) : [
          { name: 'Shipping Delay Policy', match: '92%' },
          { name: 'Logistics Tracking FAQ', match: '86%' },
          { name: 'Lost Package Handling', match: '78%' },
          { name: 'Apology Template', match: '91%' },
        ]).map((s, i) => {
          const p = parseInt(s.match) || 85;
          const cl = p >= 90 ? 'bg-[var(--color-success)]' : p >= 75 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-danger)]';
          return (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-[var(--color-border-light)] text-xs last:border-b-0">
              <span>{s.name}</span>
              <span className="font-semibold flex items-center gap-1.5 text-[11px]">
                {s.match || p + '%'}
                <div className="w-10 h-1 rounded-sm bg-[var(--color-border-light)] overflow-hidden">
                  <div className={`h-full rounded-sm ${cl}`} style={{ width: `${p}%` }} />
                </div>
              </span>
            </div>
          );
        })}
      </PanelCard>

      <PanelCard title={t.service.riskReview} className="p-4">
        {[
          [t.service.riskLevel, hasRisk ? 'Medium-High' : 'Low', hasRisk],
          [t.service.sensitiveTopic, ['Refund Request', 'Compensation', 'Complaint', 'Return Request'].includes(ticket.issueType) ? 'Yes' : 'No', false],
          [t.service.manualReviewRequired, hasRisk ? 'Yes' : 'No', hasRisk],
          [t.service.nextAction, hasRisk ? 'Review & notify supervisor' : 'Standard reply with AI', false],
        ].map(([k, v, highlight]) => (
          <div key={k as string} className="flex justify-between py-0.5 text-xs">
            <span className="text-[var(--color-text-secondary)]">{k as string}</span>
            <span className={`font-medium text-right ml-3 ${highlight ? 'text-[var(--color-primary)]' : ''}`}>{v as string}</span>
          </div>
        ))}
        {hasRisk && <div className="mt-2 text-[11px] text-[var(--color-danger)] font-medium">{t.riskMessage.aiCannotApprove}</div>}
      </PanelCard>
    </div>
  );
}
