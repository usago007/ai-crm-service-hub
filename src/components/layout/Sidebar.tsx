import type { NavKey, Ticket, FollowUpTask } from '../../types';
import { useT } from '../../i18n';
import { LayoutDashboard, MessageSquare, TicketCheck, Users, Package, BookOpen, Bot, Cpu, CheckSquare, BarChart3, Settings } from 'lucide-react';

interface SidebarProps {
  currentPage: NavKey;
  tickets: Ticket[];
  tasks: FollowUpTask[];
  onNavigate: (page: NavKey) => void;
}

export function Sidebar({ currentPage, tickets, tasks, onNavigate }: SidebarProps) {
  const { t } = useT();

  const openCount = tickets.filter(tk => tk.status !== 'Closed' && tk.status !== 'Escalated').length;
  const newCount = tickets.filter(tk => tk.status === 'New').length;
  const pendingTasks = tasks.filter(tsk => tsk.status === 'Pending').length;

  const mainItems = [
    { key: 'overview' as NavKey, label: t.nav.overview, icon: LayoutDashboard },
    { key: 'service' as NavKey, label: t.nav.service, icon: MessageSquare },
    { key: 'tickets' as NavKey, label: t.nav.tickets, icon: TicketCheck },
    { key: 'customers' as NavKey, label: t.nav.customers, icon: Users },
    { key: 'orders' as NavKey, label: t.nav.orders, icon: Package },
  ];

  const resourceItems = [
    { key: 'knowledge' as NavKey, label: t.nav.knowledge, icon: BookOpen },
    { key: 'ai-assistant' as NavKey, label: t.nav.aiAssistant, icon: Bot },
    { key: 'ai-operations' as NavKey, label: t.nav.aiOperations, icon: Cpu },
    { key: 'tasks' as NavKey, label: t.nav.tasks, icon: CheckSquare },
  ];

  const insightItems = [
    { key: 'analytics' as NavKey, label: t.nav.analytics, icon: BarChart3 },
    { key: 'settings' as NavKey, label: t.nav.settings, icon: Settings },
  ];

  function NavButton({ item, count }: { item: { key: NavKey; label: string; icon: typeof LayoutDashboard }; count?: number }) {
    const Icon = item.icon;
    const active = currentPage === item.key;
    return (
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-[var(--radius-sm)] cursor-pointer transition-all duration-[var(--transition)] text-[13px] mb-0.5 whitespace-nowrap ${
          active
            ? 'bg-[rgba(108,92,231,0.2)] text-[var(--color-primary-light)]'
            : 'text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.9)]'
        }`}
        onClick={() => onNavigate(item.key)}
      >
        <Icon size={16} className="flex-shrink-0" />
        <span>{item.label}</span>
        {count !== undefined && count > 0 && (
          item.key === 'tickets'
            ? <span className="ml-auto bg-[var(--color-danger)] text-white text-[10px] px-1.5 py-0.5 rounded-[10px] font-semibold">{count}</span>
            : <span className="ml-auto text-[11px] text-[rgba(255,255,255,0.3)]">{count}</span>
        )}
      </div>
    );
  }

  return (
    <div className="w-[220px] bg-[var(--color-bg-sidebar)] flex flex-col flex-shrink-0 z-[100] overflow-hidden">
      <div className="h-14 flex items-center px-5 gap-2.5 border-b border-[rgba(255,255,255,0.06)]">
        <div className="w-7 h-7 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] rounded-[7px] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          AI
        </div>
        <div>
          <div className="text-white text-sm font-semibold whitespace-nowrap">AI CRM Copilot</div>
          <div className="text-[rgba(255,255,255,0.4)] text-[10px]">Customer Service Platform</div>
        </div>
      </div>

      <div className="flex-1 px-2.5 py-3 overflow-y-auto">
        <div className="text-[rgba(255,255,255,0.25)] text-[10px] uppercase tracking-[0.8px] px-3.5 py-1.5 pb-1.5 font-semibold">{t.nav.main}</div>
        {mainItems.map(item => (
          <NavButton
            key={item.key}
            item={item}
            count={item.key === 'service' ? openCount : item.key === 'tickets' ? newCount : undefined}
          />
        ))}

        <div className="text-[rgba(255,255,255,0.25)] text-[10px] uppercase tracking-[0.8px] px-3.5 py-4 pb-1.5 font-semibold">{t.nav.resources}</div>
        {resourceItems.map(item => (
          <NavButton
            key={item.key}
            item={item}
            count={item.key === 'tasks' ? pendingTasks : undefined}
          />
        ))}

        <div className="text-[rgba(255,255,255,0.25)] text-[10px] uppercase tracking-[0.8px] px-3.5 py-4 pb-1.5 font-semibold">{t.nav.insights}</div>
        {insightItems.map(item => (
          <NavButton key={item.key} item={item} />
        ))}
      </div>

      <div className="px-2.5 py-3 border-t border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-[var(--radius-sm)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.7)] cursor-pointer">
          <div className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[10px] text-white font-semibold">Y</div>
          <span>You</span>
          <span className="ml-auto text-[10px] text-[rgba(255,255,255,0.3)]">{t.common.online}</span>
        </div>
      </div>
    </div>
  );
}
