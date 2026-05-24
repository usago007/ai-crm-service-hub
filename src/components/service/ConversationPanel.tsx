import type { Ticket, Customer, Message } from '../../types';
import { useT } from '../../i18n';
import { slaSt, slaLbl, chIcon, fmtTime } from '../../utils/format';
import { Badge, type BadgeVariant } from '../common/Badge';
import { Button } from '../common/Button';
import { useEffect, useRef } from 'react';
import { Bot, Send, Save, AlertTriangle, CheckSquare } from 'lucide-react';
import { EmptyState, inputCls } from '../common/PageChrome';

interface ConversationPanelProps {
  ticket: Ticket | null;
  customer: Customer | null;
  messages: Message[];
  replyText: string;
  onReplyTextChange: (val: string) => void;
  onInsertAI: () => void;
  onSendReply: () => void;
  onSaveDraft: () => void;
  onEscalate: () => void;
  onCloseTicket: () => void;
}

const priorityVariantMap: Record<Ticket['priority'], BadgeVariant> = {
  Urgent: 'red',
  High: 'orange',
  Normal: 'blue',
  Low: 'gray',
};

const statusVariantMap: Record<Ticket['status'], BadgeVariant> = {
  New: 'blue',
  'In Progress': 'yellow',
  'Pending Review': 'red',
  'Waiting Customer': 'gray',
  Closed: 'green',
  Escalated: 'red',
};

export function ConversationPanel({ ticket, customer, messages, replyText, onReplyTextChange, onInsertAI, onSendReply, onSaveDraft, onEscalate, onCloseTicket }: ConversationPanelProps) {
  const { t } = useT();
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden shell-card rounded-[24px] min-w-0">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full px-5">
            <EmptyState title="选择一条会话" description={t.common.selectConversation} compact />
          </div>
        </div>
      </div>
    );
  }

  const sla = slaSt(ticket.sla);
  const hasRisk = ticket.needsReview || ticket.issueType === 'Refund Request' || ticket.issueType === 'Complaint' || ticket.issueType === 'Return Request' || ticket.issueType === 'Payment Failed';

  return (
    <div className="flex-1 flex flex-col overflow-hidden shell-card rounded-[24px] min-w-0">
      <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between gap-3 flex-wrap flex-shrink-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.02))]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[15px] font-semibold tracking-[-0.02em]">{customer ? customer.name : t.sender.unknown}</span>
          <Badge variant={ticket.channel === 'Live Chat' ? 'green' : ticket.channel === 'Email' ? 'blue' : 'purple'}>{chIcon(ticket.channel)} {ticket.channel}</Badge>
          <Badge variant={statusVariantMap[ticket.status]}>{ticket.status}</Badge>
          <Badge variant={priorityVariantMap[ticket.priority]}>{ticket.priority}</Badge>
          {hasRisk && <Badge variant="danger">{t.badgeLabel.requiresReview}</Badge>}
        </div>
        <div className="flex gap-1 items-center text-[11px] px-2.5 py-1.5 rounded-[14px] bg-[rgba(255,255,255,0.62)] border border-[var(--color-border-light)]">
          <span className="text-[var(--color-text-light)]">{t.common.sla}</span>
          <span className={`font-medium ${sla === 'critical' ? 'text-[var(--color-danger)]' : sla === 'warning' ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
            {slaLbl(ticket.sla)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_18%)]">
        {messages.map((m, i) => {
          if (m.type === 'system') {
            const isRisk = m.content.includes('!') || m.content.includes('Refund') || m.content.includes('Manual') || m.content.includes('compensation');
            return (
              <div key={i} className={`self-center text-[11px] italic py-1 ${isRisk ? 'text-[var(--color-danger)] font-medium' : 'text-[var(--color-text-light)]'}`}>
                {m.content}
                <span className="block text-[10px] text-[var(--color-text-light)] mt-0.5">{fmtTime(m.timestamp)}</span>
              </div>
            );
          }
          const isC = m.sender === 'customer';
          return (
            <div key={i} className={`max-w-[80%] px-4 py-3 rounded-[18px] text-[13px] leading-6 relative break-words shadow-[0_14px_28px_-24px_rgba(21,30,47,0.42)] ${
              isC
                ? 'bg-[rgba(255,255,255,0.78)] border border-[var(--color-border-light)] self-start rounded-bl-[8px]'
                : 'bg-[rgba(179,92,32,0.12)] border border-[rgba(179,92,32,0.14)] self-end rounded-br-[8px] text-[var(--color-text)]'
            }`}>
              <span className="text-[10px] text-[var(--color-text-secondary)] font-semibold block mb-0.5">
                {isC ? (customer ? customer.name : t.sender.customer) : t.sender.you}
              </span>
              {m.content}
              <span className="text-[10px] text-[var(--color-text-light)] mt-1 block">{fmtTime(m.timestamp)}</span>
            </div>
          );
        })}
        <div ref={msgEndRef} />
      </div>

      <div className="border-t border-[var(--color-border)] px-5 py-4 flex-shrink-0 bg-[rgba(255,255,255,0.22)]">
        <textarea
          className={`${inputCls} min-h-[112px] py-3 resize-vertical shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]`}
          rows={3}
          placeholder={t.common.typeReply}
          value={replyText}
          onChange={e => onReplyTextChange(e.target.value)}
        />
        <div className="flex gap-1.5 mt-2 flex-wrap items-center">
          <Button size="sm" onClick={onInsertAI}><Bot size={14} /> {t.service.insertAI}</Button>
          <Button size="sm" variant="success" onClick={onSendReply}><Send size={14} /> {t.service.sendReply}</Button>
          <Button size="sm" variant="secondary" onClick={onSaveDraft}><Save size={14} /> {t.service.saveDraft}</Button>
          {ticket.status !== 'Escalated' && (
            <Button size="sm" variant="warning" onClick={onEscalate}><AlertTriangle size={14} /> {t.service.escalate}</Button>
          )}
          {ticket.status !== 'Closed' && (
            <Button size="sm" variant="secondary" onClick={onCloseTicket}><CheckSquare size={14} /> {t.service.closeTicket}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
