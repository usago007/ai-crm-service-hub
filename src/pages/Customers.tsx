import { useMemo, useState } from 'react';
import type { CustomerFilters, CustomerProfile, ListQuery, PagedResult } from '../types';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { Button } from '../components/common/Button';
import { Drawer } from '../components/common/Drawer';
import { EmptyState, FilterBar, PanelCard, StatCard, SummaryHeader, inputCls } from '../components/common/PageChrome';
import { displayLanguage } from '../utils/display';

interface CustomersPageProps {
  result: PagedResult<CustomerProfile>;
  query: ListQuery<CustomerFilters>;
  onQueryChange: (updater: (prev: ListQuery<CustomerFilters>) => ListQuery<CustomerFilters>) => void;
  selectedCustomerId: string | null;
  onSelectCustomer: (id: string | null) => void;
}

const tabs = ['overview', 'timeline', 'service-signals'] as const;

export function CustomersPage({ result, query, onQueryChange, selectedCustomerId, onSelectCustomer }: CustomersPageProps) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeCustomer = selectedCustomerId ? result.items.find(customer => customer.id === selectedCustomerId) ?? null : result.items[0] ?? null;

  const segments = useMemo(() => Array.from(new Set(result.items.map(item => item.segment))), [result.items]);
  const countries = useMemo(() => Array.from(new Set(result.items.map(item => item.country))), [result.items]);
  const riskCount = result.items.filter(item => item.riskFlags.length > 0).length;

  return (
    <div className="space-y-4">
      <SummaryHeader
        aside={
          <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
            <StatCard label="客户总量" value={String(result.total)} detail="当前筛选口径下的客户档案。" />
            <StatCard label="风险客户" value={String(riskCount)} detail="存在退款、履约或赔付风险标签。" tone="warning" />
            <StatCard label="重点分群" value={segments[0] ?? '—'} detail="用于驱动服务信号和策略差异。" />
          </div>
        }
      />

      <FilterBar>
        <select className={inputCls} value={query.filters.segment ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, segment: e.target.value || undefined } }))}>
          <option value="">全部分群</option>
          {segments.map(item => <option key={item}>{item}</option>)}
        </select>
        <select className={inputCls} value={query.filters.country ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, country: e.target.value || undefined } }))}>
          <option value="">全部国家</option>
          {countries.map(item => <option key={item}>{item}</option>)}
        </select>
        <select className={inputCls} value={query.filters.riskFlag ?? ''} onChange={e => onQueryChange(prev => ({ ...prev, page: 1, filters: { ...prev.filters, riskFlag: e.target.value || undefined } }))}>
          <option value="">全部风险</option>
          <option value="Refund Risk">退款风险</option>
          <option value="Compensation Risk">赔偿风险</option>
          <option value="Logistics Delay">物流延迟</option>
          <option value="Payment Risk">支付风险</option>
        </select>
        <div className="filter-actions">
          <Button variant="secondary" size="sm" onClick={() => onQueryChange(prev => ({ ...prev, page: 1, filters: {} }))}>重置筛选</Button>
        </div>
      </FilterBar>

      <PanelCard
        title="客户档案列表"
        description="统一浏览客户分群、区域、履约能力和风险标签。点击客户名称或查看按钮后，用抽屉查看详情。"
        className="overflow-hidden"
      >
          {result.items.length > 0 ? (
            <>
              <div className="overflow-auto">
                <table className="w-full border-collapse min-w-[1100px]">
                  <thead>
                    <tr>
                      {['客户', '分群', '国家', '语言', '负责人', '投诉历史', '退款历史', '履约达成率', '风险标签', '操作'].map(header => (
                        <th key={header} className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map(customer => (
                      <tr
                        key={customer.id}
                        className={`cursor-pointer border-b border-[var(--color-border-light)] ${activeCustomer?.id === customer.id ? 'bg-[var(--color-primary-bg)]' : 'hover:bg-[rgba(255,255,255,0.42)]'}`}
                        onClick={() => {
                          onSelectCustomer(customer.id);
                          setDrawerOpen(true);
                        }}
                      >
                        <td className="px-4 py-3 text-[13px]">
                          <button
                            type="button"
                            className="font-semibold text-left hover:text-[var(--color-primary)]"
                            onClick={event => {
                              event.stopPropagation();
                              onSelectCustomer(customer.id);
                              setDrawerOpen(true);
                            }}
                          >
                            {customer.name}
                          </button>
                          <div className="text-[11px] text-[var(--color-text-light)] mt-1">{customer.email}</div>
                        </td>
                        <td className="px-4 py-3 text-xs"><Badge variant="blue">{customer.segment}</Badge></td>
                        <td className="px-4 py-3 text-xs">{customer.country}</td>
                        <td className="px-4 py-3 text-xs">{displayLanguage(customer.preferredLanguage)}</td>
                        <td className="px-4 py-3 text-xs">{customer.owner}</td>
                        <td className="px-4 py-3 text-xs">{customer.complaintHistory}</td>
                        <td className="px-4 py-3 text-xs">{customer.refundHistory}</td>
                        <td className="px-4 py-3 text-xs">{customer.promiseFulfillment}</td>
                        <td className="px-4 py-3 text-xs">
                          <div className="flex gap-1 flex-wrap">
                            {customer.riskFlags.length > 0 ? customer.riskFlags.map(flag => <Badge key={flag} variant="red">{flag}</Badge>) : <span className="text-[var(--color-text-light)]">无</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={event => {
                              event.stopPropagation();
                              onSelectCustomer(customer.id);
                              setDrawerOpen(true);
                            }}
                          >
                            查看
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={result.page} totalPages={result.totalPages} total={result.total} onPageChange={page => onQueryChange(prev => ({ ...prev, page }))} />
            </>
          ) : (
            <EmptyState title="暂无客户档案" description="当前筛选条件没有匹配结果。重置筛选后再查看完整客户列表。" />
          )}
      </PanelCard>

      <Drawer open={drawerOpen && Boolean(activeCustomer)} onClose={() => setDrawerOpen(false)} title={activeCustomer?.name ?? '客户详情'}>
        {activeCustomer ? (
          <div className="space-y-4">
            <div className="text-xs text-[var(--color-text-secondary)]">{activeCustomer.segment} · {activeCustomer.regionStrategy}</div>
            <div className="flex gap-2 border-b border-[var(--color-border-light)] pb-3 overflow-x-auto">
              {tabs.map(item => (
                <button
                  key={item}
                  className={`px-3 py-2 text-xs rounded-[12px] whitespace-nowrap ${tab === item ? 'bg-[var(--color-primary-bg)] text-[var(--color-primary)] font-medium' : 'text-[var(--color-text-secondary)] hover:bg-[rgba(30,38,47,0.05)]'}`}
                  onClick={() => setTab(item)}
                >
                  {item === 'overview' ? '概览' : item === 'timeline' ? '服务时间线' : '服务信号'}
                </button>
              ))}
            </div>

            {tab === 'overview' ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <InfoCard label="偏好语言" value={displayLanguage(activeCustomer.preferredLanguage)} />
                  <InfoCard label="履约达成率" value={activeCustomer.promiseFulfillment} />
                  <InfoCard label="投诉历史" value={String(activeCustomer.complaintHistory)} />
                  <InfoCard label="退款历史" value={String(activeCustomer.refundHistory)} />
                </div>
                <PanelCard title="影响决策的标签" className="p-4">
                  <div className="flex gap-1 flex-wrap">
                    {activeCustomer.tags.map(tag => <Badge key={tag} variant="blue">{tag}</Badge>)}
                    {activeCustomer.riskFlags.map(flag => <Badge key={flag} variant="red">{flag}</Badge>)}
                  </div>
                </PanelCard>
              </div>
            ) : null}

            {tab === 'timeline' ? (
              <div className="space-y-3">
                {activeCustomer.recentServiceTimeline.map(event => (
                  <div key={event.id} className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.55)] p-3">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <div className="text-xs font-medium">{event.title}</div>
                      <Badge variant="gray">{event.type}</Badge>
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] mb-1">{event.detail}</div>
                    <div className="text-[11px] text-[var(--color-text-light)]">{event.at}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {tab === 'service-signals' ? (
              <div className="space-y-3 text-xs">
                <PanelCard title="RAG 过滤影响" className="p-4">
                  <div className="text-[var(--color-text-secondary)]">客户分群“{activeCustomer.segment}”与区域策略“{activeCustomer.regionStrategy}”会直接影响检索过滤和复核路由。</div>
                </PanelCard>
                <PanelCard title="服务风险画像" className="p-4">
                  <div className="text-[var(--color-text-secondary)]">负责人 {activeCustomer.owner}，投诉历史 {activeCustomer.complaintHistory}，退款历史 {activeCustomer.refundHistory}，履约达成率 {activeCustomer.promiseFulfillment}。</div>
                </PanelCard>
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState title="尚未选择客户" description="从列表选择一个客户后查看档案详情。" compact />
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
