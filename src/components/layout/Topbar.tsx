import { Search, Bot } from 'lucide-react';
import { useT } from '../../i18n';

interface TopbarProps {
  title: string;
  searchQuery: string;
  channelFilter: string;
  aiEnabled: boolean;
  onSearchChange: (val: string) => void;
  onSearchEnter: () => void;
  onChannelFilterChange: (val: string) => void;
}

export function Topbar({ title, searchQuery, channelFilter, aiEnabled, onSearchChange, onSearchEnter, onChannelFilterChange }: TopbarProps) {
  const { t } = useT();

  return (
    <div className="h-14 bg-[var(--bg-topbar)] border-b border-[var(--color-border)] flex items-center px-6 gap-4 flex-shrink-0">
      <div className="text-base font-semibold whitespace-nowrap">{title}</div>

      <div className="flex-1 max-w-[380px] relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-light)]" />
        <input
          type="text"
          placeholder={t.common.searchPlaceholder}
          className="w-full h-[34px] border border-[var(--color-border)] rounded-[20px] pl-9 pr-3.5 text-[13px] bg-[var(--color-bg)] outline-none transition-all duration-[var(--transition)] font-[var(--font-family-sans)] focus:border-[var(--color-primary)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(108,92,231,0.1)]"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSearchEnter(); }}
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <select
          className="h-8 border border-[var(--color-border)] rounded-[var(--radius-sm)] pl-2.5 pr-7 text-xs bg-[var(--color-bg)] text-[var(--color-text)] cursor-pointer outline-none appearance-none"
          value={channelFilter}
          onChange={e => onChannelFilterChange(e.target.value)}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          <option value="all">{t.channelFilter.all}</option>
          <option value="Live Chat">{t.channelFilter.liveChat}</option>
          <option value="Email">{t.channelFilter.email}</option>
          <option value="Ticket">{t.channelFilter.ticket}</option>
        </select>

        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] px-3 py-1 bg-[var(--color-success-bg)] rounded-[20px] whitespace-nowrap">
          <Bot size={12} className="text-[var(--color-success)]" />
          {t.common.aiStatus}: {aiEnabled ? t.common.enabled : t.common.disabled}
        </div>

        <div className="w-[30px] h-[30px] rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-semibold cursor-pointer flex-shrink-0">
          Y
        </div>
        <div className="text-xs text-[var(--color-text)] font-medium whitespace-nowrap">You</div>
      </div>
    </div>
  );
}
