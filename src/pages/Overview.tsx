import { ANALYTICS_DATA, ACTIVITY_LOG } from '../data/analytics';
import { useT } from '../i18n';

export function Overview() {
  const { t } = useT();
  const a = ANALYTICS_DATA;

  return (
    <div>
      <div className="text-xl font-bold mb-1">{t.page.overview}</div>
      <div className="text-[13px] text-[var(--color-text-secondary)] mb-5">{t.page.subtitle_overview}</div>

      <div className="grid grid-cols-4 gap-3.5 max-[1400px]:grid-cols-2 mb-4">
        {a.metrics.map((m, i) => (
          <div key={i} className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4 flex flex-col gap-1">
            <div className="text-2xl font-bold leading-tight" style={m.color ? { color: m.color } : undefined}>{m.value}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">{m.label}</div>
            <div className={`text-[11px] flex items-center gap-1 ${m.direction === 'up' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
              {m.direction === 'up' ? '↑' : '↓'} {m.trend} <span className="text-[var(--color-text-light)] font-normal">{m.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3.5 max-[1400px]:grid-cols-1">
        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
          <div className="text-[13px] font-semibold mb-3">{t.analyticsChart.weeklyTicketVolume}</div>
          <div className="flex items-end gap-1.5 pt-5 h-[160px]" style={{ padding: '20px 4px 0', alignItems: 'flex-end', height: '160px' }}>
            {a.ticketVolume.labels.map((l, i) => {
              const v = a.ticketVolume.values[i];
              const h = Math.max(20, v / 56 * 140);
              return (
                <div key={l} className="flex-1 rounded-t-[4px] relative min-w-[12px]" style={{ height: `${h}px`, background: 'var(--color-primary)', opacity: 0.5 + i * 0.07 }}>
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-[var(--color-text-secondary)]">{v}</span>
                  <span className="absolute -bottom-4.5 left-1/2 -translate-x-1/2 text-[9px] text-[var(--color-text-light)] whitespace-nowrap">{l}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
          <div className="text-[13px] font-semibold mb-3">{t.analyticsChart.channelDistribution}</div>
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
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4 mt-3.5">
        <div className="text-sm font-semibold mb-3">{t.analyticsChart.recentActivity}</div>
        <div>
          {ACTIVITY_LOG.slice(0, 8).map(a => {
            const icons: Record<string, string> = { Ticket: '🎫', AI: '🤖', Task: '✅', SLA: '⏰', Refund: '💰', Knowledge: '📚' };
            let icon = '📌';
            for (const k in icons) { if (a.action.includes(k)) { icon = icons[k]; break; } }
            return (
              <div key={a.id} className="flex gap-3 py-2.5 border-b border-[var(--color-border-light)] text-xs last:border-b-0">
                <div className="w-7 h-7 rounded-full bg-[var(--color-bg)] flex items-center justify-center flex-shrink-0 text-[13px]">{icon}</div>
                <div className="flex-1">
                  <div className="text-[var(--color-text)]"><strong>{a.action}</strong> - {a.user}<br />{a.detail}</div>
                  <div className="text-[11px] text-[var(--color-text-light)] mt-0.5">{a.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
