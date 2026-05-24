import type { FollowUpTask, NavKey, Ticket } from '../../types';
import { useT } from '../../i18n';
import { BarChart3, BookOpen, CheckSquare, Cpu, FileUp, FlaskConical, GitBranch, LayoutDashboard, Map, MessageSquare, Package, Scale, Settings, SlidersHorizontal, TicketCheck, Users } from 'lucide-react';
import { AI_CONSOLE_PAGES } from '../../pages/ai-console/types';

interface SidebarProps {
  currentPage: NavKey;
  tickets: Ticket[];
  tasks: FollowUpTask[];
  onNavigate: (page: NavKey) => void;
}

export function Sidebar({ currentPage, tickets, tasks, onNavigate }: SidebarProps) {
  const { t } = useT();
  const openCount = tickets.filter(ticket => ticket.status !== 'Closed' && ticket.status !== 'Escalated').length;
  const newCount = tickets.filter(ticket => ticket.status === 'New').length;
  const pendingTasks = tasks.filter(task => task.status === 'Pending').length;
  const aiConsoleIconMap: Partial<Record<NavKey, typeof Cpu>> = {
    'ai-console-ingestion': FileUp,
    'ai-console-rag-config': SlidersHorizontal,
    'ai-console-scenario-policy': Map,
    'ai-console-capability-nodes': GitBranch,
    'ai-console-rag-test-lab': FlaskConical,
    'ai-console-evaluation-feedback': BarChart3,
    'ai-console-audit-logs': Scale,
  };

  const groups = [
    {
      label: t.nav.workbench,
      items: [
        { key: 'overview' as NavKey, label: t.nav.overview, icon: LayoutDashboard, count: undefined },
        { key: 'service' as NavKey, label: t.nav.service, icon: MessageSquare, count: openCount },
        { key: 'tickets' as NavKey, label: t.nav.tickets, icon: TicketCheck, count: newCount },
        { key: 'tasks' as NavKey, label: t.nav.tasks, icon: CheckSquare, count: pendingTasks },
      ],
    },
    {
      label: t.nav.customerOps,
      items: [
        { key: 'customers' as NavKey, label: t.nav.customers, icon: Users, count: undefined },
        { key: 'orders' as NavKey, label: t.nav.orders, icon: Package, count: undefined },
      ],
    },
    {
      label: t.nav.aiControl,
      items: [
        { key: 'knowledge' as NavKey, label: t.nav.knowledge, icon: BookOpen, count: undefined },
        ...AI_CONSOLE_PAGES.map(item => ({
          key: item.navKey,
          label: item.label,
          icon: aiConsoleIconMap[item.navKey] ?? Cpu,
          count: undefined,
        })),
      ],
    },
    {
      label: t.nav.adminCenter,
      items: [
        { key: 'insights' as NavKey, label: t.nav.insights, icon: BarChart3, count: undefined },
        { key: 'admin-settings' as NavKey, label: t.nav.settings, icon: Settings, count: undefined },
      ],
    },
  ];

  return (
    <aside className="w-[252px] bg-[linear-gradient(180deg,#0d1526_0%,#101d31_58%,#0d1726_100%)] flex flex-col flex-shrink-0 z-[100] overflow-hidden border-r border-[rgba(255,255,255,0.05)] shadow-[18px_0_50px_-42px_rgba(4,12,24,0.8)]" aria-label="主导航">
      <div className="h-[78px] flex items-center px-5 gap-3 border-b border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]">
        <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] via-[#4b8dff] to-[var(--color-accent)] rounded-[14px] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-[0_16px_32px_-18px_rgba(21,94,239,0.9)]">AI</div>
        <div>
          <div className="text-white text-[15px] font-semibold whitespace-nowrap">AI 客服协作台</div>
          <div className="text-[rgba(255,255,255,0.42)] text-[10px] tracking-[0.18em] uppercase">Cross-border Service Ops</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="后台分区">
        {groups.map(group => (
          <div key={group.label} className="mb-4">
            <div className="text-[rgba(255,255,255,0.28)] text-[10px] uppercase tracking-[0.18em] px-3.5 py-1.5 pb-2 font-semibold">{group.label}</div>
            {group.items.map(item => {
              const Icon = item.icon;
              const active = currentPage === item.key;
              return (
                <div
                  key={item.key}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-[16px] cursor-pointer transition-all duration-[var(--transition)] text-[13px] mb-1 whitespace-nowrap border ${
                    active
                      ? 'bg-[linear-gradient(135deg,rgba(21,94,239,0.24),rgba(15,118,110,0.16))] text-white border-[rgba(110,168,254,0.24)] shadow-[0_18px_30px_-24px_rgba(21,94,239,0.85)]'
                      : 'text-[rgba(255,255,255,0.62)] border-transparent hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.94)]'
                  }`}
                  onClick={() => onNavigate(item.key)}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-[10px] font-semibold ${item.key === 'tickets' ? 'bg-[var(--color-danger)] text-white' : 'text-[rgba(255,255,255,0.4)]'}`}>
                      {item.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-[18px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.74)]">
          <div className="w-7 h-7 rounded-[10px] bg-[linear-gradient(135deg,#155eef_0%,#0f766e_100%)] flex items-center justify-center text-[10px] text-white font-semibold">Y</div>
          <span>你</span>
          <span className="ml-auto text-[10px] text-[rgba(255,255,255,0.3)]">{t.common.online}</span>
        </div>
      </div>
    </aside>
  );
}
