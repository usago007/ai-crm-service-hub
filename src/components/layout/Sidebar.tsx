import type { FollowUpTask, NavKey, Ticket } from '../../types';
import { useT } from '../../i18n';
import { Activity, BarChart3, Bell, CheckSquare, Cpu, Database, FlaskConical, LayoutDashboard, Map, MessageSquare, Package, PanelLeftClose, PanelLeftOpen, Settings, Shield, SlidersHorizontal, TicketCheck, Users } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  currentPage: NavKey;
  tickets: Ticket[];
  tasks: FollowUpTask[];
  onNavigate: (page: NavKey) => void;
  onToggleCollapsed: () => void;
}

export function Sidebar({ collapsed, currentPage, tickets, tasks, onNavigate, onToggleCollapsed }: SidebarProps) {
  const { t } = useT();
  const openCount = tickets.filter(ticket => ticket.status !== 'Closed' && ticket.status !== 'Escalated').length;
  const newCount = tickets.filter(ticket => ticket.status === 'New').length;
  const pendingTasks = tasks.filter(task => task.status === 'Pending').length;

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
      label: '知识管理',
      items: [
        { key: 'knowledge' as NavKey, label: 'AI 知识库', icon: Database, count: undefined },
      ],
    },
    {
      label: 'AI 配置',
      items: [
        { key: 'ai-console-rag-config' as NavKey, label: '全局 RAG 配置', icon: SlidersHorizontal, count: undefined },
        { key: 'ai-console-scenario-policy' as NavKey, label: 'AI 场景策略', icon: Map, count: undefined },
        { key: 'ai-console-rag-test-lab' as NavKey, label: 'RAG 调试台', icon: FlaskConical, count: undefined },
      ],
    },
    {
      label: '质量监控',
      items: [
        { key: 'ai-console-evaluation-feedback' as NavKey, label: '评测与反馈', icon: BarChart3, count: undefined },
        { key: 'ai-console-service-health' as NavKey, label: '运行状态', icon: Cpu, count: undefined },
      ],
    },
    {
      label: '系统',
      items: [
        { key: 'admin-general' as NavKey, label: '通用设置', icon: Settings, count: undefined },
        { key: 'admin-team' as NavKey, label: '团队管理', icon: Users, count: undefined },
        { key: 'admin-permissions' as NavKey, label: '权限管理', icon: Shield, count: undefined },
        { key: 'admin-channels' as NavKey, label: '渠道设置', icon: MessageSquare, count: undefined },
        { key: 'admin-notifications' as NavKey, label: '通知设置', icon: Bell, count: undefined },
        { key: 'system-operation-logs' as NavKey, label: '操作日志', icon: Activity, count: undefined },
      ],
    },
  ];

  return (
    <aside
      className={`${collapsed ? 'w-[84px]' : 'w-[252px]'} bg-[linear-gradient(180deg,#0d1526_0%,#101d31_58%,#0d1726_100%)] flex flex-col flex-shrink-0 z-[100] overflow-hidden border-r border-[rgba(255,255,255,0.05)] shadow-[18px_0_50px_-42px_rgba(4,12,24,0.8)] transition-[width] duration-200`}
      aria-label="主导航"
    >
      <div className={`h-[78px] flex items-center ${collapsed ? 'justify-center px-3' : 'px-5'} gap-3 border-b border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]`}>
        <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] via-[#4b8dff] to-[var(--color-accent)] rounded-[14px] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-[0_16px_32px_-18px_rgba(21,94,239,0.9)]">AI</div>
        <div className={`${collapsed ? 'hidden' : 'flex'} min-w-0 items-center`}>
          <div className="text-white text-[15px] font-semibold whitespace-nowrap">AI 客服协作台</div>
        </div>
      </div>

      <nav className={`flex-1 ${collapsed ? 'px-2.5' : 'px-3'} py-4 overflow-y-auto`} aria-label="后台分区">
        {groups.map(group => (
          <div key={group.label} className="mb-4">
            {!collapsed ? (
              <div className="text-[rgba(255,255,255,0.28)] text-[10px] uppercase tracking-[0.18em] px-3.5 py-1.5 pb-2 font-semibold">{group.label}</div>
            ) : null}
            {group.items.map(item => {
              const Icon = item.icon;
              const active = currentPage === item.key;
              return (
                <button
                  type="button"
                  key={item.key}
                  title={item.label}
                  aria-label={item.label}
                  className={`relative w-full flex items-center ${collapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded-[16px] transition-all duration-[var(--transition)] text-[13px] mb-1 whitespace-nowrap border ${
                    active
                      ? 'bg-[linear-gradient(135deg,rgba(21,94,239,0.24),rgba(15,118,110,0.16))] text-white border-[rgba(110,168,254,0.24)] shadow-[0_18px_30px_-24px_rgba(21,94,239,0.85)]'
                      : 'text-[rgba(255,255,255,0.62)] border-transparent hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.94)]'
                  }`}
                  onClick={() => onNavigate(item.key)}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {!collapsed ? <span>{item.label}</span> : null}
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`${
                        collapsed
                          ? 'absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 text-[9px] flex items-center justify-center'
                          : 'ml-auto min-w-[22px] h-5 px-1.5 text-[10px] inline-flex items-center justify-center'
                      } rounded-full font-semibold ${
                        item.key === 'tickets'
                          ? 'bg-[var(--color-danger)] text-white'
                          : item.key === 'service'
                          ? 'bg-[#2f8cff] text-white'
                          : 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.82)]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-[rgba(255,255,255,0.06)]">
        <button
          type="button"
          title={collapsed ? '展开导航' : '收起导航'}
          aria-label={collapsed ? '展开导航' : '收起导航'}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-3 rounded-[18px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.74)] transition-all duration-[var(--transition)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)] hover:text-white`}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <PanelLeftOpen size={18} className="flex-shrink-0" /> : <PanelLeftClose size={18} className="flex-shrink-0" />}
          {!collapsed ? <span>收起导航</span> : null}
        </button>
      </div>
    </aside>
  );
}
