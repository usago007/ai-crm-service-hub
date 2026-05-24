import { useMemo } from 'react';
import type { Customer, ListQuery, Order, OrderFilters, PagedResult } from '../types';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { Button } from '../components/common/Button';
import { DetailPanel, EmptyState, FilterBar, PageHeader, PanelCard, StatCard, inputCls } from '../components/common/PageChrome';
import { getC } from '../utils/ticket';
import { useT } from '../i18n';
import { displayFulfillmentStatus, displayPaymentStatus } from '../utils/display';

interface OrdersPageProps {
  result: PagedResult<Order>;
  customers: Customer[];
  query: ListQuery<OrderFilters>;
  onQueryChange: (updater: (prev: ListQuery<OrderFilters>) => ListQuery<OrderFilters>) => void;
  selectedOrderId: string | null;
  onSelectOrder: (id: string | null) => void;
}

export function OrdersPage({ result, customers, query, onQueryChange, selectedOrderId, onSelectOrder }: OrdersPageProps) {
  const { t } = useT();
  const countries = useMemo(() => Array.from(new Set(customers.map(item => item.country))), [customers]);
  const selectedOrder = selectedOrderId ? result.items.find(item => item.id === selectedOrderId) ?? result.items[0] ?? null : result.items[0] ?? null;
  const selectedCustomer = selectedOrder ? getC(customers, selectedOrder.customerId) : null;
  const riskCount = result.items.filter(item => item.riskAlert).length;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Order operations"
        title={t.page.orders}
        description={t.page.subtitle_orders}
        aside={
          <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
            <StatCard label="当前订单" value={String(result.total)} detail="当前筛选条件下可见的订单数量。" />
            <StatCard label="风险订单" value={String(riskCount)} detail="存在支付、履约或物流风险提示。" tone="warning" />
            <StatCard label="重点国家" value={countries[0] ?? '—'} detail="用于观察区域履约和支付差异。" />
          </div>
        }
      />

      <FilterBar>
        <select className={inputCls} value={query.filters.fulfillmentStatus ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, fulfillmentStatus: e.target.value || undefined } }))}>
          <option value="">全部履约状态</option>
          {['Processing', 'Shipped', 'Delivered'].map(item => <option key={item} value={item}>{displayFulfillmentStatus(item)}</option>)}
        </select>
        <select className={inputCls} value={query.filters.paymentStatus ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, paymentStatus: e.target.value || undefined } }))}>
          <option value="">全部支付状态</option>
          {['Paid', 'Pending', 'Failed'].map(item => <option key={item} value={item}>{displayPaymentStatus(item)}</option>)}
        </select>
        <select className={inputCls} value={query.filters.country ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, country: e.target.value || undefined } }))}>
          <option value="">全部国家</option>
          {countries.map(item => <option key={item}>{item}</option>)}
        </select>
        <select className={inputCls} value={query.filters.risk ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, risk: e.target.value || undefined } }))}>
          <option value="">全部风险</option>
          <option value="risk_only">仅看风险</option>
        </select>
        <Button variant="secondary" size="sm" onClick={() => onQueryChange(prev => ({ ...prev, page: 1, filters: {} }))}>重置筛选</Button>
      </FilterBar>

      <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-4 max-[1260px]:grid-cols-1">
        <PanelCard title="订单列表" description="按支付、履约、国家和风险统一浏览订单，并在右侧查看当前订单详情。" className="overflow-hidden">
          {result.items.length > 0 ? (
            <>
              <div className="overflow-auto">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr>
                      {['订单', '客户', '日期', '支付', '履约', '物流商', '国家', '风险'].map(header => (
                        <th key={header} className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map(order => {
                      const customer = customers.find(item => item.id === order.customerId);
                      return (
                        <tr key={order.id} className={`cursor-pointer border-b border-[var(--color-border-light)] ${selectedOrder?.id === order.id ? 'bg-[var(--color-primary-bg)]' : 'hover:bg-[rgba(255,255,255,0.42)]'}`} onClick={() => onSelectOrder(order.id)}>
                          <td className="px-4 py-3 text-[13px]"><div className="font-semibold">{order.id}</div><div className="text-[11px] text-[var(--color-text-light)] mt-1">${order.total.toFixed(2)}</div></td>
                          <td className="px-4 py-3 text-xs">{customer?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-xs">{order.date}</td>
                          <td className="px-4 py-3 text-xs"><Badge variant={order.paymentStatus === 'Paid' ? 'green' : order.paymentStatus === 'Pending' ? 'yellow' : 'red'}>{displayPaymentStatus(order.paymentStatus)}</Badge></td>
                          <td className="px-4 py-3 text-xs"><Badge variant={order.fulfillmentStatus === 'Delivered' ? 'green' : order.fulfillmentStatus === 'Shipped' ? 'blue' : 'gray'}>{displayFulfillmentStatus(order.fulfillmentStatus)}</Badge></td>
                          <td className="px-4 py-3 text-xs">{order.carrier || '—'}</td>
                          <td className="px-4 py-3 text-xs">{customer?.country ?? '—'}</td>
                          <td className="px-4 py-3 text-xs">{order.riskAlert ? <Badge variant="red">风险</Badge> : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={result.page} totalPages={result.totalPages} total={result.total} onPageChange={page => onQueryChange(prev => ({ ...prev, page }))} />
            </>
          ) : (
            <EmptyState title="暂无订单" description="当前筛选条件没有返回订单，重置筛选后再查看完整数据。" />
          )}
        </PanelCard>

        <DetailPanel title={selectedOrder?.id ?? '未选择订单'} description={selectedOrder ? '查看当前订单的支付、履约与客户上下文。' : '从左侧选择订单后查看明细。'}>
          {selectedOrder ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <InfoCard label="支付状态" value={displayPaymentStatus(selectedOrder.paymentStatus)} />
                <InfoCard label="履约状态" value={displayFulfillmentStatus(selectedOrder.fulfillmentStatus)} />
                <InfoCard label="订单日期" value={selectedOrder.date} />
                <InfoCard label="订单金额" value={`$${selectedOrder.total.toFixed(2)}`} />
              </div>
              <PanelCard title="客户与物流" className="p-4">
                <div className="space-y-2 text-[13px] text-[var(--color-text-secondary)]">
                  <div><span className="text-[var(--color-text)] font-medium">客户：</span> {selectedCustomer?.name ?? '—'}</div>
                  <div><span className="text-[var(--color-text)] font-medium">国家：</span> {selectedCustomer?.country ?? '—'}</div>
                  <div><span className="text-[var(--color-text)] font-medium">物流商：</span> {selectedOrder.carrier || '—'}</div>
                  <div><span className="text-[var(--color-text)] font-medium">客户标签：</span> {selectedCustomer?.type ?? '—'}</div>
                </div>
              </PanelCard>
              <PanelCard title="风险信号" className="p-4">
                {selectedOrder.riskAlert ? (
                  <div className="rounded-[16px] border border-[rgba(200,85,76,0.16)] bg-[var(--color-danger-bg)] p-3 text-[var(--color-danger)]">
                    当前订单命中风险信号，需要人工关注支付或履约异常。
                  </div>
                ) : (
                  <div className="rounded-[16px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.55)] p-3 text-[var(--color-text-secondary)]">
                    当前订单未命中高风险提醒，可继续正常流转。
                  </div>
                )}
              </PanelCard>
            </div>
          ) : (
            <EmptyState title="尚未选择订单" description="从左侧订单列表中选择一条记录后，这里会展示支付、履约与风险信息。" compact />
          )}
        </DetailPanel>
      </div>
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
