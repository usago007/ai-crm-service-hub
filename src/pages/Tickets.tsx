import type { Ticket, Customer, FollowUpTask, Message } from '../types';
import { slaSt, slaLbl, prioCls, statCls, chIcon, fmtDate, fmtTime, cName } from '../utils/format';
import { Badge } from '../components/common/Badge';
import { Drawer } from '../components/common/Drawer';
import { X } from 'lucide-react';
import { useT } from '../i18n';

interface TicketsPageProps {
  tickets: Ticket[];
  customers: Customer[];
  tasks: FollowUpTask[];
  messages: Message[];
  ticketFilter: string;
  selectedTicketId: string | null;
  onSelectTicket: (id: string | null) => void;
  onTicketFilterChange: (filter: string) => void;
  onViewTicket: (id: string) => void;
}

export function TicketsPage({ tickets, customers, tasks, messages, ticketFilter, selectedTicketId, onSelectTicket, onTicketFilterChange, onViewTicket }: TicketsPageProps) {
  const { t } = useT();
  const filtered = tickets.filter(tk => ticketFilter === 'all' || tk.status === ticketFilter);
  const selT = selectedTicketId ? tickets.find(tk => tk.id === selectedTicketId) ?? null : null;
  const selC = selT ? customers.find(c => c.id === selT.customerId) ?? null : null;
  const msgs = selT ? messages.filter(m => m.ticketId === selT.id) : [];

  const filters = ['all', 'New', 'In Progress', 'Pending Review', 'Waiting Customer', 'Closed', 'Escalated'];

  return (
    <div>
      <div className="text-xl font-bold mb-1">{t.page.tickets}</div>
      <div className="text-[13px] text-[var(--color-text-secondary)] mb-5">{t.page.subtitle_tickets}</div>

      <div className="flex gap-0 border-b border-[var(--color-border)] mb-4">
        {filters.map(f => {
          const cnt = f === 'all' ? tickets.length : tickets.filter(tk => tk.status === f).length;
          return (
            <div
              key={f}
              className={`px-4 py-2 text-[13px] cursor-pointer border-b-2 transition-all duration-[var(--transition)] whitespace-nowrap ${
                ticketFilter === f
                  ? 'text-[var(--color-primary)] border-b-[var(--color-primary)] font-medium'
                  : 'text-[var(--color-text-secondary)] border-b-transparent hover:text-[var(--color-text)]'
              }`}
              onClick={() => onTicketFilterChange(f)}
            >
              {f === 'all' ? t.common.all : t.status[f as keyof typeof t.status]} <span className="text-[11px] text-[var(--color-text-light)] ml-1">({cnt})</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 relative">
        <div className="flex-1 overflow-auto border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)]">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr>
                {[
                  t.tableHeader.ticketId,
                  t.tableHeader.customer,
                  t.tableHeader.channel,
                  t.tableHeader.issue,
                  t.tableHeader.priority,
                  t.tableHeader.status,
                  t.tableHeader.sla,
                  t.tableHeader.ai,
                  t.tableHeader.updated,
                  '',
                ].map((h, i) => (
                  <th key={i} className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tk => {
                const c = customers.find(cu => cu.id === tk.customerId);
                const s = slaSt(tk.sla);
                const sel = tk.id === selectedTicketId;
                return (
                  <tr
                    key={tk.id}
                    className={`cursor-pointer ${sel ? 'bg-[var(--color-primary-bg)]' : ''} hover:bg-[var(--color-bg)]`}
                    onClick={() => onSelectTicket(tk.id)}
                  >
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle"><strong>{tk.id}</strong></td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{c ? c.name : t.sender.unknown}</td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                      <Badge variant={tk.channel === 'Live Chat' ? 'green' : tk.channel === 'Email' ? 'blue' : 'purple'}>{chIcon(tk.channel)} {tk.channel}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{tk.issueType}</td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                      <Badge variant={prioCls(tk.priority).replace('badge-', '') as any}>{tk.priority}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                      <Badge variant={statCls(tk.status).replace('badge-', '') as any}>{tk.status}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                      <span className={`text-[11px] font-medium ${s === 'critical' ? 'text-[var(--color-danger)]' : s === 'warning' ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
                        {slaLbl(tk.sla)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                      {tk.aiSuggested && <Badge variant="ai">{t.badgeLabel.ai}</Badge>}
                      {tk.needsReview && <Badge variant="red" className="ml-0.5">!</Badge>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-light)] align-middle">{fmtDate(tk.lastUpdated)}</td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                      <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); onViewTicket(tk.id); }}>{t.common.view}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-[var(--color-text-light)]">{t.common.noTickets}</div>}
        </div>

        <Drawer open={!!selT} onClose={() => onSelectTicket(null)}>
          {selT && selC && (
            <>
              <div className="px-4 py-3.5 border-b border-[var(--color-border-light)]">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong style={{ fontSize: 15 }}>{selT.id}</strong>
                  <Badge variant={statCls(selT.status).replace('badge-', '') as any} className="text-xs">{selT.status}</Badge>
                </div>
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  <Badge variant={prioCls(selT.priority).replace('badge-', '') as any}>{selT.priority}</Badge>
                  <Badge variant={selT.channel === 'Live Chat' ? 'green' : selT.channel === 'Email' ? 'blue' : 'purple'}>{chIcon(selT.channel)} {selT.channel}</Badge>
                  <Badge variant="gray">{selT.issueType}</Badge>
                  {selT.aiSuggested && <Badge variant="ai">{t.badgeLabel.ai}</Badge>}
                </div>
              </div>

              <div className="px-4 py-3.5 border-b border-[var(--color-border-light)]">
                <div className="text-[11px] uppercase tracking-[0.5px] text-[var(--color-text-secondary)] font-semibold mb-2">{t.ticket.customerInfo}</div>
                {[
                  [t.customerField.name, selC.name],
                  [t.customerField.email, selC.email],
                  [t.customerField.country, selC.country],
                  [t.customerField.type, selC.type],
                ].map(([label, value], i) => (
                  <div key={i} className="flex justify-between py-0.5 text-xs">
                    <span className="text-[var(--color-text-secondary)]">{label}</span>
                    <span className="font-medium text-right ml-3">{value}</span>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3.5 border-b border-[var(--color-border-light)]">
                <div className="text-[11px] uppercase tracking-[0.5px] text-[var(--color-text-secondary)] font-semibold mb-2">{t.ticket.aiSummary}</div>
                <div className="text-xs leading-relaxed bg-[var(--color-primary-bg)] p-2 rounded-[var(--radius-sm)]">{selT.aiSummary}</div>
              </div>

              <div className="px-4 py-3.5 border-b border-[var(--color-border-light)]">
                <div className="text-[11px] uppercase tracking-[0.5px] text-[var(--color-text-secondary)] font-semibold mb-2">SLA</div>
                <div className="flex justify-between py-0.5 text-xs">
                  <span className="text-[var(--color-text-secondary)]">{t.ticket.deadline}</span>
                  <span className="font-medium text-right ml-3">{new Date(selT.sla).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-0.5 text-xs">
                  <span className="text-[var(--color-text-secondary)]">{t.ticket.timeLeft}</span>
                  <span className={`font-medium text-right ml-3 ${slaSt(selT.sla) === 'critical' ? 'text-[var(--color-danger)]' : slaSt(selT.sla) === 'warning' ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}>
                    {slaLbl(selT.sla)}
                  </span>
                </div>
              </div>

              <div className="px-4 py-3.5 border-b border-[var(--color-border-light)]">
                <div className="text-[11px] uppercase tracking-[0.5px] text-[var(--color-text-secondary)] font-semibold mb-2">{t.ticket.activity} ({msgs.length} {t.ticket.messages})</div>
                {msgs.slice(-5).map((m, i) => (
                  <div key={i} className="py-1.5 text-xs border-b border-[var(--color-border-light)] flex gap-2">
                    <span className="text-[10px] text-[var(--color-text-light)] whitespace-nowrap flex-shrink-0">{fmtTime(m.timestamp)}</span>
                    <span className="text-[var(--color-text)]">{m.sender === 'system' ? t.sender.system : m.sender === 'customer' ? t.sender.customer : t.sender.agent}: {m.content.substring(0, 70)}{m.content.length > 70 ? '...' : ''}</span>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3.5">
                <div className="text-[11px] uppercase tracking-[0.5px] text-[var(--color-text-secondary)] font-semibold mb-2">{t.ticket.followUpTasks}</div>
                {tasks.filter(tsk => tsk.ticketId === selT.id).length > 0 ? tasks.filter(tsk => tsk.ticketId === selT.id).map(tsk => (
                  <div key={tsk.id} className="flex justify-between py-1 text-xs border-b border-[var(--color-border-light)]">
                    <span>{tsk.description}</span>
                    <Badge variant={tsk.status === 'Pending' ? 'yellow' : tsk.status === 'In Progress' ? 'blue' : 'green'}>{tsk.status}</Badge>
                  </div>
                )) : <div className="text-xs text-[var(--color-text-light)]">{t.common.noTasks}</div>}
              </div>
            </>
          )}
        </Drawer>
      </div>
    </div>
  );
}
