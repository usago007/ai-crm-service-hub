import { ANALYTICS_DATA } from '../data/analytics';
import { useT } from '../i18n';

export function Analytics() {
  const { t } = useT();
  const a = ANALYTICS_DATA;

  return (
    <div>
      <div className="text-xl font-bold mb-1">{t.page.analytics}</div>
      <div className="text-[13px] text-[var(--color-text-secondary)] mb-5">{t.page.subtitle_analytics}</div>

      <div className="grid grid-cols-4 gap-3.5 max-[1400px]:grid-cols-2 mb-4">
        {a.metrics.map((m, i) => (
          <div key={i} className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4 flex flex-col gap-1">
            <div className="text-2xl font-bold leading-tight" style={m.color ? { color: m.color } : undefined}>{m.value}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">{m.label}</div>
            <div className={`text-[11px] flex items-center gap-1 ${m.direction === 'up' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
              {m.direction === 'up' ? '↑ ' : '↓ '}{m.trend} <span className="text-[var(--color-text-light)] font-normal">{m.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3.5 max-[1400px]:grid-cols-1">
        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
          <div className="text-[13px] font-semibold mb-3">{t.analyticsChart.ticketVolumeByChannel}</div>
          <div className="flex items-center gap-5">
            <div
              className="w-[100px] h-[100px] rounded-full flex-shrink-0"
              style={{
                background: `conic-gradient(${a.channelDist.map((d, i) => {
                  const start = a.channelDist.slice(0, i).reduce((s, x) => s + x.value, 0);
                  return `${d.color} ${start}% ${start + d.value}%`;
                }).join(',')})`,
              }}
            />
            <div className="flex-1">
              {a.channelDist.map((d, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ background: d.color }} />
                  {d.label}
                  <span className="ml-auto font-semibold">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
          <div className="text-[13px] font-semibold mb-3">{t.analyticsChart.issueTypeDistribution}</div>
          <div className="flex items-center gap-5">
            <div
              className="w-[100px] h-[100px] rounded-full flex-shrink-0"
              style={{
                background: `conic-gradient(${a.issueDist.map((d, i) => {
                  const start = a.issueDist.slice(0, i).reduce((s, x) => s + x.value, 0);
                  return `${d.color} ${start}% ${start + d.value}%`;
                }).join(',')})`,
              }}
            />
            <div className="flex-1">
              {a.issueDist.map((d, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ background: d.color }} />
                  {d.label}
                  <span className="ml-auto font-semibold">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
          <div className="text-[13px] font-semibold mb-3">{t.analyticsChart.aiAdoptionTrend}</div>
          <div className="flex items-end gap-1.5 pt-5" style={{ padding: '20px 4px 0', alignItems: 'flex-end', height: '160px' }}>
            {a.aiAdoptionTrend.map((d, i) => {
              const h = Math.max(15, d.value / 72 * 140);
              return (
                <div key={d.label} className="flex-1 rounded-t-[4px] relative min-w-[12px]" style={{ height: `${h}px`, background: 'var(--color-primary)', opacity: 0.4 + i * 0.12 }}>
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-[var(--color-text-secondary)]">{d.value}%</span>
                  <span className="absolute -bottom-4.5 left-1/2 -translate-x-1/2 text-[9px] text-[var(--color-text-light)] whitespace-nowrap">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
          <div className="text-[13px] font-semibold mb-3">{t.analyticsChart.topFaqMatches}</div>
          <div className="flex flex-col">
            {a.topFAQ.map((d, i) => {
              const w = Math.max(10, d.count / 342 * 100);
              const colors = ['#6C5CE7', '#A29BFE', '#3B82F6', '#10B981', '#F59E0B'];
              return (
                <div key={d.label} className="flex items-center gap-2 py-1.5 text-xs border-b border-[var(--color-border-light)]">
                  <span className="w-[140px] flex-shrink-0">{d.label}</span>
                  <div className="flex-1 h-5 bg-[var(--color-border-light)] rounded-[4px] overflow-hidden">
                    <div className="h-full rounded-[4px]" style={{ width: `${w}%`, background: colors[i] }} />
                  </div>
                  <span className="font-semibold w-10 text-right text-[var(--color-text-secondary)]">{d.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4 col-span-2 max-[1400px]:col-span-1">
          <div className="text-[13px] font-semibold mb-3">{t.analyticsChart.manualReviewBreakdown}</div>
          <div className="flex gap-[30px] items-center py-2.5">
            <div
              className="w-[120px] h-[120px] rounded-full flex-shrink-0"
              style={{
                background: `conic-gradient(${a.manualReviewBreakdown.map((d, i) => {
                  const start = a.manualReviewBreakdown.slice(0, i).reduce((s, x) => s + x.pct, 0);
                  return `${['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'][i]} ${start}% ${start + d.pct}%`;
                }).join(',')})`,
              }}
            />
            <div>
              {a.manualReviewBreakdown.map((d, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ background: ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981'][i] }} />
                  {d.label}
                  <span className="ml-auto font-semibold">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
