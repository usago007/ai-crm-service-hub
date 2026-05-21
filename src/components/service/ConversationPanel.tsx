import type { Ticket, Customer, Message } from '../../types';
import { useT } from '../../i18n';
import { slaSt, slaLbl, prioCls, statCls, chIcon, fmtTime } from '../../utils/format';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useEffect, useRef } from 'react';
import { Bot, Send, Save, AlertTriangle, CheckSquare } from 'lucide-react';

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

export function ConversationPanel({ ticket, customer, messages, replyText, onReplyTextChange, onInsertAI, onSendReply, onSaveDraft, onEscalate, onCloseTicket }: ConversationPanelProps) {
  const { t } = useT();
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)] min-w-0">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-3">💬</div>
            <div className="text-sm text-[var(--color-text-secondary)]">{t.common.selectConversation}</div>
          </div>
        </div>
      </div>
    );
  }

  const sla = slaSt(ticket.sla);
  const hasRisk = ticket.needsReview || ticket.issueType === 'Refund Request' || ticket.issueType === 'Complaint' || ticket.issueType === 'Return Request' || ticket.issueType === 'Payment Failed';

  return (
    <div className="flex-1 flex flex-col overflow-hidden border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)] min-w-0">
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{customer ? customer.name : t.sender.unknown}</span>
          <Badge variant={ticket.channel === 'Live Chat' ? 'green' : ticket.channel === 'Email' ? 'blue' : 'purple'}>{chIcon(ticket.channel)} {ticket.channel}</Badge>
          <Badge variant={statCls(ticket.status).replace('badge-', '') as any}>{ticket.status}</Badge>
          <Badge variant={prioCls(ticket.priority).replace('badge-', '') as any}>{ticket.priority}</Badge>
          {hasRisk && <Badge variant="danger">{t.badgeLabel.requiresReview}</Badge>}
        </div>
        <div className="flex gap-1 items-center text-[11px]">
          <span className="text-[var(--color-text-light)]">{t.common.sla}</span>
          <span className={`font-medium ${sla === 'critical' ? 'text-[var(--color-danger)]' : sla === 'warning' ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
            {slaLbl(ticket.sla)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
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
            <div key={i} className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed relative break-words ${
              isC ? 'bg-[#F3F4F6] self-start rounded-bl' : 'bg-[var(--color-primary-bg)] self-end rounded-br text-[var(--color-text)]'
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

      <div className="border-t border-[var(--color-border)] px-4 py-3 flex-shrink-0">
        <textarea
          className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2.5 text-[13px] font-[var(--font-family-sans)] outline-none resize-vertical min-h-[60px] bg-white focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(108,92,231,0.1)]"
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
