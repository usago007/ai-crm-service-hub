import type { GlobalOperationLogEntry, ListQuery, OperationLogFilters, PagedResult } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Pagination } from '../components/common/Pagination';
import { EmptyState, FilterBar, PanelCard, StatCard, SummaryHeader, inputCls } from '../components/common/PageChrome';

interface OperationLogsPageProps {
  result: PagedResult<GlobalOperationLogEntry>;
  query: ListQuery<OperationLogFilters>;
  onQueryChange: (updater: (prev: ListQuery<OperationLogFilters>) => ListQuery<OperationLogFilters>) => void;
}

const scopeOptions = ['系统设置', '知识运营', '工单执行', 'RAG 配置', '知识事件', 'AI 审计 / 工单链路'];

function sourceBadge(value: GlobalOperationLogEntry['sourceType']) {
  return value === 'system_activity'
    ? { label: '系统活动', variant: 'blue' as const }
    : { label: 'AI / 审计', variant: 'yellow' as const };
}

function riskBadge(value?: GlobalOperationLogEntry['riskLevel']) {
  if (!value) return { label: '普通', variant: 'gray' as const };
  if (value === 'High') return { label: '高风险', variant: 'red' as const };
  if (value === 'Medium') return { label: '中风险', variant: 'yellow' as const };
  return { label: '低风险', variant: 'green' as const };
}

export function OperationLogsPage({ result, query, onQueryChange }: OperationLogsPageProps) {
  const systemActivityCount = result.items.filter(item => item.sourceType === 'system_activity').length;
  const auditEventCount = result.items.filter(item => item.sourceType === 'ai_audit').length;
  const highRiskEventCount = result.items.filter(item => item.riskLevel === 'High').length;

  return (
    <div className="space-y-4">
      <SummaryHeader
        aside={
          <div className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2">
            <StatCard label="日志总数" value={String(result.total)} detail="当前筛选条件下的全局日志总量。" />
            <StatCard label="系统活动数" value={String(systemActivityCount)} detail="当前页来自系统活动流的记录。" />
            <StatCard label="审计事件数" value={String(auditEventCount)} detail="当前页来自 AI / 审计链路的记录。" />
            <StatCard label="高风险事件数" value={String(highRiskEventCount)} detail="当前页需要优先关注的高风险事件。" tone="danger" />
          </div>
        }
      />

      <FilterBar>
        <select
          className={inputCls}
          value={query.filters.sourceType ?? ''}
          onChange={event => onQueryChange(prev => ({
            ...prev,
            page: 1,
            filters: { ...prev.filters, sourceType: (event.target.value || undefined) as OperationLogFilters['sourceType'] },
          }))}
        >
          <option value="">全部来源</option>
          <option value="system_activity">系统活动</option>
          <option value="ai_audit">AI / 审计</option>
        </select>
        <select
          className={inputCls}
          value={query.filters.scope ?? ''}
          onChange={event => onQueryChange(prev => ({
            ...prev,
            page: 1,
            filters: { ...prev.filters, scope: event.target.value || undefined },
          }))}
        >
          <option value="">全部范围</option>
          {scopeOptions.map(item => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          className={inputCls}
          value={query.filters.riskLevel ?? ''}
          onChange={event => onQueryChange(prev => ({
            ...prev,
            page: 1,
            filters: { ...prev.filters, riskLevel: (event.target.value || undefined) as OperationLogFilters['riskLevel'] },
          }))}
        >
          <option value="">全部风险</option>
          <option value="Low">低风险</option>
          <option value="Medium">中风险</option>
          <option value="High">高风险</option>
        </select>
        <div className="filter-compact-actions">
          <input
            className={inputCls}
            value={query.search ?? ''}
            onChange={event => onQueryChange(prev => ({ ...prev, page: 1, search: event.target.value }))}
            placeholder="搜索操作人、动作、范围或详情"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onQueryChange(prev => ({ ...prev, page: 1, search: '', filters: {} }))}
          >
            重置筛选
          </Button>
        </div>
      </FilterBar>

      <PanelCard title="全局操作日志" description="统一查看系统活动与 AI / 审计事件；案例级深入排查仍建议进入 AI Console 审计日志。">
        {result.items.length > 0 ? (
          <>
            <div className="overflow-auto">
              <table className="w-full border-collapse min-w-[1180px]">
                <thead>
                  <tr>
                    {['时间', '来源', '操作人', '动作', '作用范围', '风险等级', '结果', '详情'].map(header => (
                      <th key={header} className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.items.map(entry => {
                    const source = sourceBadge(entry.sourceType);
                    const risk = riskBadge(entry.riskLevel);
                    return (
                      <tr key={entry.id} className="border-b border-[var(--color-border-light)] hover:bg-[rgba(255,255,255,0.42)]">
                        <td className="px-4 py-3 text-xs whitespace-nowrap">{entry.timestampLabel}</td>
                        <td className="px-4 py-3 text-xs"><Badge variant={source.variant}>{source.label}</Badge></td>
                        <td className="px-4 py-3 text-xs">{entry.actor}</td>
                        <td className="px-4 py-3 text-xs">{entry.action}</td>
                        <td className="px-4 py-3 text-xs">{entry.scope}</td>
                        <td className="px-4 py-3 text-xs"><Badge variant={risk.variant}>{risk.label}</Badge></td>
                        <td className="px-4 py-3 text-xs">{entry.result}</td>
                        <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)] leading-6">{entry.detail}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={result.page} totalPages={result.totalPages} total={result.total} onPageChange={page => onQueryChange(prev => ({ ...prev, page }))} />
          </>
        ) : (
          <EmptyState title="暂无操作日志" description="当前筛选条件下没有匹配记录，重置筛选后查看全量日志。" />
        )}
      </PanelCard>
    </div>
  );
}
