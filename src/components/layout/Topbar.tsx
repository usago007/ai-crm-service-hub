import { ChevronRight } from 'lucide-react';

interface TopbarProps {
  path: string[];
  onOpenAdmin: () => void;
}

export function Topbar({ path, onOpenAdmin }: TopbarProps) {
  return (
    <div className="px-6 pt-4 pb-3 flex items-center gap-4 flex-shrink-0">
      <div className="shell-card shell-elevated flex-1 rounded-[24px] px-5 py-3 flex items-center justify-between gap-4 max-w-[1460px] mx-auto w-full relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-[220px] bg-[radial-gradient(circle_at_top_right,rgba(179,92,32,0.12),transparent_60%)] pointer-events-none" />
        <div className="min-w-0 flex-1">
          <div className="min-w-0 flex items-center gap-2 flex-wrap">
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
          <button
            type="button"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[16px] bg-[rgba(21,32,50,0.04)] border border-[var(--color-border-light)] transition-colors hover:bg-[rgba(21,32,50,0.08)] hover:border-[rgba(21,32,50,0.12)]"
            onClick={onOpenAdmin}
          >
            <div className="w-8 h-8 rounded-[12px] bg-[linear-gradient(135deg,#155eef_0%,#0f766e_100%)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">管</div>
            <div className="pr-1">
              <div className="text-xs font-semibold text-[var(--color-text)] whitespace-nowrap">超级管理员</div>
              <div className="text-[11px] text-[var(--color-text-light)] whitespace-nowrap">系统管理</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
