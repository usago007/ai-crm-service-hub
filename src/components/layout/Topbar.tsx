import { Bot, ChevronRight, Sparkles } from 'lucide-react';
import { useT } from '../../i18n';

interface TopbarProps {
  path: string[];
  aiEnabled: boolean;
}

export function Topbar({ path, aiEnabled }: TopbarProps) {
  const { t } = useT();

  return (
    <div className="px-6 pt-4 pb-3 flex items-center gap-4 flex-shrink-0">
      <div className="shell-card shell-elevated flex-1 rounded-[24px] px-5 py-3 flex items-center justify-between gap-4 max-w-[1460px] mx-auto w-full relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-[220px] bg-[radial-gradient(circle_at_top_right,rgba(179,92,32,0.12),transparent_60%)] pointer-events-none" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-light)] mb-1">
            <Sparkles size={12} className="text-[var(--color-primary)]" />
            Workflow Path
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {path.map((segment, index) => (
              <div key={`${segment}-${index}`} className="flex items-center gap-2 min-w-0">
                {index > 0 ? <ChevronRight size={14} className="text-[var(--color-text-light)] flex-shrink-0" /> : null}
                <span className={`${index === path.length - 1 ? 'text-[15px] font-semibold text-[var(--color-text)]' : 'text-[13px] text-[var(--color-text-secondary)]'} truncate`}>
                  {segment}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto relative">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] px-3 py-2 rounded-[16px] bg-[rgba(15,159,110,0.08)] border border-[rgba(15,159,110,0.12)] whitespace-nowrap">
            <Bot size={14} className="text-[var(--color-success)]" />
            <span>{t.common.aiStatus}</span>
            <span className="text-[var(--color-text)] font-semibold">{aiEnabled ? t.common.enabled : t.common.disabled}</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[16px] bg-[rgba(21,32,50,0.04)] border border-[var(--color-border-light)]">
            <div className="w-8 h-8 rounded-[12px] bg-[linear-gradient(135deg,#155eef_0%,#0f766e_100%)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">你</div>
            <div className="pr-1">
              <div className="text-xs font-semibold text-[var(--color-text)] whitespace-nowrap">你</div>
              <div className="text-[11px] text-[var(--color-text-light)] whitespace-nowrap">运营视角</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
