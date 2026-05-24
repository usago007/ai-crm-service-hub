import type { Ticket, Customer } from '../../types';
import { useT } from '../../i18n';
import { Badge, type BadgeVariant } from '../common/Badge';
import { slaSt, chIcon, fmtDate } from '../../utils/format';
import { Search } from 'lucide-react';

interface ConversationListProps {
  tickets: Ticket[];
  customers: Customer[];
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
  searchQuery: string;
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

export function ConversationList({ tickets, customers, selectedTicketId, onSelectTicket, searchQuery }: ConversationListProps) {
  const { t } = useT();
  const filtered = tickets.filter(tk => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const c = customers.find(cu => cu.id === tk.customerId);
      if (!c || (!c.name.toLowerCase().includes(q) && !tk.id.toLowerCase().includes(q) && !tk.summary.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  if (selectedTicketId && !filtered.find(tk => tk.id === selectedTicketId)) {
    if (filtered.length > 0) {
      return null;
    }
  }

  return (
    <div className="w-[300px] flex-shrink-0 flex flex-col overflow-hidden border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)]">
      <div className="px-3.5 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
        <span className="text-[13px] font-semibold">{t.common.conversations}</span>
        <span className="text-xs text-[var(--color-text-secondary)]">{filtered.length}</span>
      </div>
      <div className="px-3.5 py-2.5 border-b border-[var(--color-border-light)] relative">
        <Search size={12} className="absolute left-[22px] top-1/2 -translate-y-1/2 text-[var(--color-text-light)]" />
        <input
          type="text"
          placeholder={t.common.searchConversations}
          className="w-full h-[30px] border border-[var(--color-border)] rounded-[15px] pl-[30px] pr-3 text-xs bg-[var(--color-bg)] outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-8 px-3.5 text-[var(--color-text-light)]">{t.common.noConversations}</div>
        ) : (
          filtered.map(tk => {
            const c = customers.find(cu => cu.id === tk.customerId);
            const active = tk.id === selectedTicketId;
            const sla = slaSt(tk.sla);
            return (
              <div
                key={tk.id}
                className={`px-3.5 py-3 border-b border-[var(--color-border-light)] cursor-pointer transition-all duration-[var(--transition)] ${
                  active ? 'bg-[var(--color-primary-bg)] shadow-[inset_3px_0_0_var(--color-primary)]' : 'hover:bg-[var(--color-bg)]'
                }`}
                onClick={() => onSelectTicket(tk.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[13px] font-semibold">{c ? c.name : t.sender.unknown}</span>
                  <span className="text-[11px] text-[var(--color-text-light)] whitespace-nowrap">{fmtDate(tk.lastUpdated)}</span>
                </div>
                <Badge variant={tk.channel === 'Live Chat' ? 'green' : tk.channel === 'Email' ? 'blue' : 'purple'} className="text-[10px] mb-1">
                  {chIcon(tk.channel)} {tk.channel}
                </Badge>
                <div className="text-xs text-[var(--color-text-secondary)] overflow-hidden text-ellipsis whitespace-nowrap mb-1">{tk.summary}</div>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant={priorityVariantMap[tk.priority]} className="text-[10px]">{tk.priority}</Badge>
                  <Badge variant={statusVariantMap[tk.status]} className="text-[10px]">{tk.status}</Badge>
                </div>
                <div className="flex gap-1 items-center mt-1">
                  {tk.aiSuggested && <span className="w-4 h-4 rounded-[3px] bg-[var(--color-primary-bg)] text-[var(--color-primary)] text-[9px] flex items-center justify-center font-bold" title={t.badgeLabel.ai}>AI</span>}
                  {tk.needsReview && <span className="w-4 h-4 rounded-[3px] bg-[var(--color-danger-bg)] text-[var(--color-danger)] text-[10px] flex items-center justify-center" title={t.badgeLabel.reviewRequired}>!</span>}
                  {sla === 'critical' && <span className="w-4 h-4 rounded-[3px] bg-[var(--color-danger-bg)] text-[var(--color-danger)] text-[10px] flex items-center justify-center" title={t.badgeLabel.slaCritical}>!</span>}
                  {sla === 'warning' && <span className="w-4 h-4 rounded-[3px] bg-[var(--color-warning-bg)] text-[var(--color-warning)] text-[10px] flex items-center justify-center" title={t.badgeLabel.slaWarning}>!</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
