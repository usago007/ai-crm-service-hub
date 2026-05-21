import { useMemo } from 'react';
import type { Customer, Order, Ticket, FollowUpTask } from '../types';
import { fmtDate } from '../utils/format';
import { Badge } from '../components/common/Badge';
import { Drawer } from '../components/common/Drawer';
import { getOrdersByC, getTicketsByC, getTasksByC } from '../utils/ticket';
import { useT } from '../i18n';

interface CustomersPageProps {
  customers: Customer[];
  orders: Order[];
  tickets: Ticket[];
  tasks: FollowUpTask[];
  selectedCustomerId: string | null;
  searchQuery: string;
  onSelectCustomer: (id: string | null) => void;
}

export function CustomersPage({ customers, orders, tickets, tasks, selectedCustomerId, searchQuery, onSelectCustomer }: CustomersPageProps) {
  const { t } = useT();
  const filtered = useMemo(() => {
    return customers.filter(c => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [customers, searchQuery]);

  const selC = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) ?? null : null;

  return (
    <div>
      <div className="text-xl font-bold mb-1">{t.page.customers}</div>
      <div className="text-[13px] text-[var(--color-text-secondary)] mb-5">{t.page.subtitle_customers}</div>

      <div className="flex gap-4 relative">
        <div className="flex-1 overflow-auto border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[t.tableHeader.customerName, t.tableHeader.country, t.tableHeader.language, t.tableHeader.type, t.tableHeader.orders, t.tableHeader.ltv, t.tableHeader.lastContact, t.tableHeader.tags, ''].map((h, i) => (
                  <th key={i} className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const sel = c.id === selectedCustomerId;
                return (
                  <tr
                    key={c.id}
                    className={`cursor-pointer ${sel ? 'bg-[var(--color-primary-bg)]' : ''} hover:bg-[var(--color-bg)]`}
                    onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) onSelectCustomer(c.id); }}
                  >
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-semibold" style={{ background: c.avatarColor }}>{c.name.charAt(0)}</div>
                        <strong>{c.name}</strong>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{c.country}</td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{c.language}</td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle"><Badge variant="purple">{c.type}</Badge></td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{c.totalOrders}</td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">${c.lifetimeValue.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-light)] align-middle">{fmtDate(c.lastContact)}</td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                      <div className="flex gap-1 flex-wrap">
                        {c.tags.slice(0, 2).map((t, i) => <Badge key={i} variant="blue">{t}</Badge>)}
                        {c.tags.length > 2 && <Badge variant="gray">+{c.tags.length - 2}</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                      <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); onSelectCustomer(c.id); }}>{t.common.view}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-10 text-[var(--color-text-light)]">{t.common.noCustomers}</div>}
        </div>

        <Drawer open={!!selC} onClose={() => onSelectCustomer(null)} width="480px">
          {selC && (
            <>
              <div className="flex gap-3.5 items-center p-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: selC.avatarColor }}>{selC.name.charAt(0)}</div>
                <div>
                  <div className="text-base font-semibold">{selC.name}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">{selC.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                {Object.entries({ [t.customerField.country]: selC.country, [t.customerField.language]: selC.language, [t.customerField.type]: selC.type, [t.customerField.ltv]: `$${selC.lifetimeValue.toFixed(2)}`, [t.customerField.totalOrders]: String(selC.totalOrders), [t.customerField.lastContact]: fmtDate(selC.lastContact) }).map(([label, value], i) => (
                  <div key={i}>
                    <label className="text-[11px] text-[var(--color-text-secondary)] block">{label}</label>
                    <span className="text-[13px] font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-3 flex gap-1 flex-wrap">
                {selC.tags.map((t, i) => <Badge key={i} variant="blue">{t}</Badge>)}
              </div>
              <div className="flex border-b border-[var(--color-border)] mx-4">
                {[t.customer.overview, t.customer.orders, t.customer.service, t.customer.tasks].map((tab, i) => (
                  <div key={i} className="px-3.5 py-2 text-xs cursor-pointer border-b-2 border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
                    {tab}
                  </div>
                ))}
              </div>
              <div className="p-4">
                <div className="text-[13px] font-semibold mb-3">{t.customer.aiCustomerSummary}</div>
                <div className="text-xs leading-relaxed bg-[var(--color-primary-bg)] p-2.5 rounded-[var(--radius-sm)] border-l-3 border-l-[var(--color-primary)] mb-3">
                  {selC.name} is a {selC.type.toLowerCase()} from {selC.country} with {selC.totalOrders} orders and a lifetime value of ${selC.lifetimeValue.toFixed(2)}.
                  {selC.tags.includes('Shipping Sensitive') || selC.tags.includes('Logistics Delay')
                    ? ' They have contacted support about shipping issues. Recommend proactive shipping updates and priority handling.'
                    : selC.tags.includes('Refund Request')
                    ? ' They have an active refund request. Handle with care following refund policy.'
                    : selC.tags.includes('VIP')
                    ? ' As a high-value customer, recommend priority service and personalized attention.'
                    : ' No significant flags detected.'}
                </div>
                <div className="text-[13px] font-semibold mt-3 mb-1">{t.customer.marketingOpportunities}</div>
                <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {selC.totalOrders >= 5
                    ? 'Recommend loyalty program enrollment\nBased on purchase history, recommend complementary accessories\nConsider sending personalized re-engagement offer'
                    : selC.totalOrders >= 3
                    ? 'Upsell opportunity based on previous purchases\nRecommend new arrivals in same category'
                    : 'New customer - send onboarding sequence\nOffer first-time buyer discount'}
                </div>
              </div>
            </>
          )}
        </Drawer>
      </div>
    </div>
  );
}
