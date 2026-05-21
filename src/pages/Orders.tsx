import { useMemo } from 'react';
import type { Customer, Order } from '../types';
import { fmtDate } from '../utils/format';
import { Badge } from '../components/common/Badge';
import { Drawer } from '../components/common/Drawer';
import { getC } from '../utils/ticket';
import { useT } from '../i18n';

interface OrdersPageProps {
  orders: Order[];
  customers: Customer[];
  selectedOrderId: string | null;
  orderFilter: string;
  onSelectOrder: (id: string | null) => void;
  onOrderFilterChange: (filter: string) => void;
}

export function OrdersPage({ orders, customers, selectedOrderId, orderFilter, onSelectOrder, onOrderFilterChange }: OrdersPageProps) {
  const { t } = useT();
  const filtered = useMemo(() => orders.filter(o => orderFilter === 'all' || o.fulfillmentStatus === orderFilter), [orders, orderFilter]);
  const selO = selectedOrderId ? orders.find(o => o.id === selectedOrderId) ?? null : null;
  const selC = selO ? getC(customers, selO.customerId) : null;

  const filters = ['all', 'Unfulfilled', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div>
      <div className="text-xl font-bold mb-1">{t.page.orders}</div>
      <div className="text-[13px] text-[var(--color-text-secondary)] mb-5">{t.page.subtitle_orders}</div>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {filters.map(f => (
          <span
            key={f}
            className={`px-3 py-1 rounded-[14px] text-xs cursor-pointer border transition-all duration-[var(--transition)] ${
              orderFilter === f
                ? 'bg-[var(--color-primary-bg)] border-[var(--color-primary)] text-[var(--color-primary)] font-medium'
                : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
            }`}
            onClick={() => onOrderFilterChange(f)}
          >
            {f === 'all' ? t.filters.all : t.filters[f as keyof typeof t.filters]}
          </span>
        ))}
      </div>

      <div className="flex gap-4 relative">
        <div className="flex-1 overflow-auto border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[t.tableHeader.orderId, t.tableHeader.customer, t.tableHeader.date, t.tableHeader.total, t.tableHeader.payment, t.tableHeader.fulfillment, t.tableHeader.carrier, t.tableHeader.risk, ''].map((h, i) => (
                  <th key={i} className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const c = customers.find(cu => cu.id === o.customerId);
                return (
                  <tr key={o.id} className="cursor-pointer hover:bg-[var(--color-bg)]" onClick={() => onSelectOrder(o.id)}>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle"><strong>{o.id}</strong></td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{c ? c.name : t.sender.unknown}</td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{new Date(o.date).toLocaleDateString()}</td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">${o.total.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                      <Badge variant={o.paymentStatus === 'Paid' ? 'green' : o.paymentStatus === 'Pending' ? 'yellow' : 'red'}>{o.paymentStatus}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                      <Badge variant={o.fulfillmentStatus === 'Delivered' ? 'green' : o.fulfillmentStatus === 'Shipped' ? 'blue' : 'gray'}>{o.fulfillmentStatus}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{o.carrier || '-'}</td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                      {o.riskAlert ? <Badge variant="red" title={o.riskAlert}>{t.badgeLabel.alert}</Badge> : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                      <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); onSelectOrder(o.id); }}>{t.common.view}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Drawer open={!!selO} onClose={() => onSelectOrder(null)} width="480px">
          {selO && selC && (
            <>
              <div className="px-4 py-3.5 border-b border-[var(--color-border-light)]">
                <div className="flex justify-between">
                  <strong style={{ fontSize: 15 }}>{selO.id}</strong>
                  <Badge variant={selO.fulfillmentStatus === 'Delivered' ? 'green' : selO.fulfillmentStatus === 'Shipped' ? 'blue' : 'gray'}>{selO.fulfillmentStatus}</Badge>
                </div>
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  <Badge variant={selO.paymentStatus === 'Paid' ? 'green' : selO.paymentStatus === 'Pending' ? 'yellow' : 'red'}>{selO.paymentStatus}</Badge>
                  <Badge variant="blue">{selC.name}</Badge>
                </div>
              </div>
              <div className="px-4 py-3.5 border-b border-[var(--color-border-light)]">
                <div className="text-[11px] uppercase tracking-[0.5px] text-[var(--color-text-secondary)] font-semibold mb-2">{t.order.orderInfo}</div>
                {Object.entries({ [t.orderField.date]: new Date(selO.date).toLocaleDateString(), [t.orderField.total]: `$${selO.total.toFixed(2)}`, [t.orderField.payment]: selO.paymentStatus, [t.orderField.fulfillment]: selO.fulfillmentStatus, [t.orderField.carrier]: selO.carrier || '-', [t.orderField.tracking]: selO.tracking || '-' }).map(([label, value], i) => (
                  <div key={i} className="flex justify-between py-0.5 text-xs">
                    <span className="text-[var(--color-text-secondary)]">{label}</span>
                    <span className="font-medium text-right ml-3">{value}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3.5 border-b border-[var(--color-border-light)]">
                <div className="text-[11px] uppercase tracking-[0.5px] text-[var(--color-text-secondary)] font-semibold mb-2">{t.order.items} ({selO.items.length})</div>
                {selO.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-xs border-b border-[var(--color-border-light)]">
                    <span>{i.name} x{i.qty}</span>
                    <span>${(i.price * i.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3.5 border-b border-[var(--color-border-light)]">
                <div className="text-[11px] uppercase tracking-[0.5px] text-[var(--color-text-secondary)] font-semibold mb-2">{t.order.trackingTimeline}</div>
                <ul className="list-none p-0">
                  {[
                    { ev: t.trackingEvent.orderPlaced, time: selO.date, cur: selO.latestEvent === 'Order placed' },
                    { ev: t.trackingEvent.processing, time: new Date(new Date(selO.date).getTime() + 86400000).toISOString(), cur: selO.latestEvent === 'Processing' },
                    { ev: t.trackingEvent.shipped, time: selO.fulfillmentStatus === 'Shipped' || selO.fulfillmentStatus === 'Delivered' ? new Date(new Date(selO.date).getTime() + 172800000).toISOString() : '', cur: ['Shipped', 'Departed', 'In transit'].includes(selO.latestEvent) },
                    { ev: selO.latestEvent || t.trackingEvent.delivered, time: selO.latestEvent ? selO.date : '', cur: true },
                  ].map((e, i) => (
                    <li key={i} className={`relative pl-6 pb-4 text-xs border-l-2 ${e.cur ? 'border-l-[var(--color-success)]' : 'border-l-[var(--color-border)]'} last:border-l-transparent last:pb-0 before:content-[''] before:absolute before:-left-[5px] before:top-1 before:w-2 before:h-2 before:rounded-full ${e.cur ? 'before:bg-[var(--color-success)] before:border-2 before:border-[var(--color-success-bg)]' : 'before:bg-[var(--color-border)]'}`}>
                      <div>{e.ev}</div>
                      <div className="text-[10px] text-[var(--color-text-light)]">{e.time ? fmtDate(e.time) : ''}</div>
                    </li>
                  ))}
                </ul>
              </div>
              {selO.riskAlert && (
                <div className="px-4 py-3.5">
                  <div className="p-2 bg-[var(--color-danger-bg)] rounded-[var(--radius-sm)] text-xs text-[var(--color-danger)]">{selO.riskAlert}</div>
                </div>
              )}
            </>
          )}
        </Drawer>
      </div>
    </div>
  );
}
