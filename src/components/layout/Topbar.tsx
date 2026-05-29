import { ChevronRight } from 'lucide-react';

interface TopbarProps {
  path: string[];
  onOpenAdmin: () => void;
}

export function Topbar({ path, onOpenAdmin }: TopbarProps) {
  return (
    <div className="px-6 pt-2 pb-0 flex items-center flex-shrink-0 sticky top-0 z-10 bg-[var(--color-bg)]">
      <div className="flex-1 flex items-center justify-between gap-4 max-w-[1460px] mx-auto w-full min-h-[48px] border-b border-[var(--color-border-light)]">
        <div className="min-w-0 flex items-center gap-2 flex-wrap py-2">
          {path.map((segment, index) => (
            <div key={`${segment}-${index}`} className="flex items-center gap-2 min-w-0">
              {index > 0 ? <ChevronRight size={12} className="text-[var(--color-text-light)] flex-shrink-0" /> : null}
              <span className={`${index === path.length - 1 ? 'text-[14px] font-semibold text-[var(--color-text)]' : 'text-[12px] text-[var(--color-text-secondary)]'} truncate`}>
                {segment}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            className="flex items-center gap-1.5 px-2 py-1 rounded-[12px] bg-[rgba(21,32,50,0.03)] border border-transparent transition-colors hover:bg-[rgba(21,32,50,0.06)]"
            onClick={onOpenAdmin}
          >
            <div className="w-6 h-6 rounded-[8px] bg-[rgba(100,116,139,0.2)] flex items-center justify-center text-[var(--color-text)] text-[10px] font-semibold flex-shrink-0">管</div>
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)] whitespace-nowrap">超级管理员</span>
          </button>
        </div>
      </div>
    </div>
  );
}
