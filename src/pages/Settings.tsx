import { useEffect, useState } from 'react';
import type { Agent, SettingsData } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { Toggle } from '../components/common/Toggle';
import { PanelCard, StatCard } from '../components/common/PageChrome';
import { useT, type Language } from '../i18n';
import { inputCls } from './ai-console/sharedUtils';
import { Bell, Globe, MessageSquare, Shield } from 'lucide-react';

interface SettingsProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  settings: SettingsData;
  agents: Agent[];
  permissionBoundaries: PermissionBoundary[];
  initialTab?: string;
}

const tabs = [
  { key: 'general', label: '通用', icon: Globe },
  { key: 'permissions', label: '权限', icon: Shield },
  { key: 'channels', label: '渠道', icon: MessageSquare },
  { key: 'notifications', label: '通知', icon: Bell },
] as const;

const channelLabels: Record<string, string> = {
  liveChat: '在线聊天',
  email: '邮件',
  ticket: '工单',
  whatsapp: 'WhatsApp',
  messenger: 'Messenger',
};

const notificationLabels: Record<string, string> = {
  newTicket: '新工单提醒',
  slaWarning: 'SLA 预警',
  aiAlert: 'AI 风险提醒',
  taskReminder: '任务提醒',
  reviewRequired: '人工复核提醒',
};

function renderTabContent(tab: string, lang: Language, onLanguageChange: (l: Language) => void, settings: SettingsData, agents: Agent[], t: ReturnType<typeof useT>['t']) {
  if (tab === 'general') return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-2">{t.settings.language}</label>
        <select className={inputCls} value={lang} onChange={e => onLanguageChange(e.target.value as Language)}>
          <option value="zh">简体中文</option>
          <option value="en">English</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs max-[900px]:grid-cols-1">
        <InfoCard label={t.settings.timezone} value={settings.general.timezone} />
        <InfoCard label={t.settings.notificationDelivery} value={settings.general.notifications} />
      </div>
    </div>
  );

  if (tab === 'permissions') return <PermissionsAndTeam settings={settings} agents={agents} />;

  if (tab === 'channels') return (
    <div>
      {Object.entries(settings.channels).map(([key, v]) => (
        <Toggle key={key} label={channelLabels[key] ?? key} on={v} onClick={() => {}} />
      ))}
      <div className="text-xs text-[var(--color-text-light)] mt-4">渠道开关当前为只读快照，编辑功能将在后续版本接入。</div>
    </div>
  );

  return (
    <div>
      {Object.entries(settings.notifications).map(([key, v]) => (
        <Toggle key={key} label={notificationLabels[key] ?? key} on={v} onClick={() => {}} />
      ))}
      <div className="text-xs text-[var(--color-text-light)] mt-4">通知开关当前为只读快照，编辑功能将在后续版本接入。</div>
    </div>
  );
}

function PermissionsAndTeam({ settings, agents: initialAgents }: { settings: SettingsData; agents: Agent[] }) {
  const [members, setMembers] = useState(initialAgents);
  const [showAdd, setShowAdd] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('客服专员');
  useEffect(() => { setMembers(initialAgents); }, [initialAgents]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
        <StatCard label="角色模版" value={String(settings.permissions.roleProfiles.length)} detail="当前定义的权限角色。" />
        <StatCard label="团队成员" value={String(members.length)} detail="均继承对应角色权限。" />
      </div>

      <PanelCard title="角色定义" description="每个角色预设了一组 AI 操作权限。成员分配角色后自动继承这些权限。">
        <DataTable columns={[
          { key: 'role', label: '角色', width: '16%' },
          { key: 'scope', label: '职责范围', width: '22%' },
          { key: 'suggest', label: 'AI 建议' },
          { key: 'send', label: '发送' },
          { key: 'review', label: '复核' },
          { key: 'knowledge', label: '知识访问', width: '12%' },
        ]} emptyMessage="暂无角色定义。" className="rounded-[20px]">
          {settings.permissions.roleProfiles.map(profile => (
            <tr key={profile.role}>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] font-medium">{profile.role}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)]">{profile.scopeSummary}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.aiSuggest}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.humanSend}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.manualReviewOverride}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.knowledgeAccess}</td>
            </tr>
          ))}
        </DataTable>
      </PanelCard>

      <PanelCard title="成员分配" description="每位成员分配一个角色，继承该角色的权限。可随时调整角色。">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="text-xs text-[var(--color-text-secondary)]">共 {members.length} 人</div>
          <Button size="sm" onClick={() => { setNewName(''); setNewRole('客服专员'); setShowAdd(true); }}>添加成员</Button>
        </div>
        <DataTable columns={[
          { key: 'name', label: '姓名', width: '18%' },
          { key: 'role', label: '角色', width: '18%' },
          { key: 'status', label: '状态', width: '12%' },
          { key: 'actions', label: '操作', width: '120px' },
        ]} emptyMessage="暂无成员。" className="rounded-[20px]">
          {members.map((agent, i) => (
            <tr key={agent.name}>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] font-medium">{agent.name}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                {editingRole === agent.name ? (
                  <select className={`${inputCls} h-8 text-xs`} value={agent.role} onChange={e => {
                    setMembers(prev => prev.map((m, j) => j === i ? { ...m, role: e.target.value } : m));
                    setEditingRole(null);
                  }} autoFocus onBlur={() => setEditingRole(null)}>
                    {settings.permissions.roleProfiles.map(rp => <option key={rp.role} value={rp.role}>{rp.role}</option>)}
                  </select>
                ) : (
                  <button type="button" className="text-[var(--color-primary)] hover:underline" onClick={() => setEditingRole(agent.name)}>{agent.role}</button>
                )}
              </td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant="green">在线</Badge></td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingRole(agent.name)}>改角色</Button>
                  <Button variant="ghost" size="sm" onClick={() => setMembers(prev => prev.filter((_, j) => j !== i))}>移除</Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </PanelCard>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="添加成员" actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowAdd(false)}>取消</Button>
          <Button size="sm" onClick={() => { if (newName.trim()) { setMembers(prev => [...prev, { name: newName.trim(), role: newRole }]); setShowAdd(false); } }} disabled={!newName.trim()}>确认添加</Button>
        </div>
      }>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">姓名</div>
            <input className={inputCls} value={newName} onChange={e => setNewName(e.target.value)} placeholder="成员姓名" autoFocus />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">角色</div>
            <select className={inputCls} value={newRole} onChange={e => setNewRole(e.target.value)}>
              {settings.permissions.roleProfiles.map(rp => <option key={rp.role} value={rp.role}>{rp.role}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function Settings({ lang, onLanguageChange, settings, agents, permissionBoundaries, initialTab }: SettingsProps) {
  const { t } = useT();
  const [tab, setTab] = useState<string>(initialTab ?? 'general');
  useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);
  const isSubPage = initialTab !== undefined;
  const activeTabItem = tabs.find(t => t.key === tab) ?? tabs[0];

  if (isSubPage) {
    return (
      <div className="space-y-4">
        <div className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFC_100%)] p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="text-[20px] font-semibold tracking-[-0.02em]">{activeTabItem.label}</div>
              <div className="text-sm text-[var(--color-text-secondary)] mt-1 leading-6">
                {tab === 'general' ? '配置语言环境、时区和通知偏好。' : tab === 'permissions' ? '管理角色权限与团队成员分配。' : tab === 'channels' ? '启用或禁用客户服务渠道。' : '管理消息提醒规则和通知偏好。'}
              </div>
            </div>
          </div>
        </div>
        <PanelCard>{renderTabContent(tab, lang, onLanguageChange, settings, agents, t)}</PanelCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFC_100%)] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[20px] font-semibold tracking-[-0.02em]">系统设置</div>
            <div className="text-sm text-[var(--color-text-secondary)] mt-1 leading-6">管理团队、权限、渠道和通知偏好。所有更改即时生效。</div>
          </div>
          <span className="text-[11px] text-[var(--color-text-light)] flex-shrink-0">{lang === 'zh' ? '简体中文' : 'English'} · 团队 {agents.length} 人</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
          <StatCard label="语言环境" value={lang === 'zh' ? '中文' : lang} detail="后台操作语言与基础文案" />
          <StatCard label="团队席位" value={String(agents.length)} detail="当前可见的在线客服与管理成员" />
          <StatCard label="已启用通知" value={String(Object.values(settings.notifications).filter(Boolean).length)} detail="激活中的提醒规则数量" tone="warning" />
        </div>
      </div>

      <div className="grid grid-cols-[240px_minmax(0,1fr)] gap-5 max-[1100px]:grid-cols-1">
        <PanelCard className="p-2">
          {tabs.map(item => {
            const Icon = item.icon;
            const active = tab === item.key;
            return (
              <button key={item.key}
                className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-[14px] text-[13px] transition-all duration-200 ${active ? 'bg-[rgba(179,92,32,0.12)] text-[var(--color-primary)] font-medium' : 'text-[var(--color-text-secondary)] hover:bg-[rgba(30,38,47,0.05)]'}`}
                onClick={() => setTab(item.key)}>
                <Icon size={15} />{item.label}
              </button>
            );
          })}
        </PanelCard>

        <PanelCard title={activeTabItem.label}>
          {renderTabContent(tab, lang, onLanguageChange, settings, agents, t)}
        </PanelCard>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.55)] p-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)]">{label}</div>
      <div className="font-medium mt-2">{value}</div>
    </div>
  );
}
