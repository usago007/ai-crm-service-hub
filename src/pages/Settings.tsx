import { useEffect, useState } from 'react';
import type { Agent, PermissionBoundary, SettingsData } from '../types';
import { Badge } from '../components/common/Badge';
import { DataTable } from '../components/common/DataTable';
import { Toggle } from '../components/common/Toggle';
import { PanelCard, StatCard } from '../components/common/PageChrome';
import { useT, type Language } from '../i18n';
import { inputCls } from './ai-console/sharedUtils';
import { Bell, Globe, MessageSquare, Shield, Users } from 'lucide-react';

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
  { key: 'team', label: '团队', icon: Users },
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

function boundaryBadge(value: string) {
  if (value === 'Yes') return { label: '允许', variant: 'green' as const };
  if (value === 'No') return { label: '禁止', variant: 'red' as const };
  if (value === 'Conditional') return { label: '条件触发', variant: 'yellow' as const };
  return { label: value, variant: 'gray' as const };
}

function renderTabContent(tab: string, lang: Language, onLanguageChange: (l: Language) => void, settings: SettingsData, agents: Agent[], permissionBoundaries: PermissionBoundary[], t: ReturnType<typeof useT>['t']) {
  const manualReviewCount = permissionBoundaries.filter(item => item.manualReview !== 'No').length;
  const blockedSendCount = permissionBoundaries.filter(item => item.aiSend === 'No').length;
  const roleCount = settings.permissions.roleProfiles.length;

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

  if (tab === 'team') return (
    <DataTable columns={[{ key: 'name', label: t.settings.name }, { key: 'role', label: t.settings.role }, { key: 'status', label: t.settings.status }]} emptyMessage="当前没有可见团队成员。" className="rounded-[20px]">
      {agents.map(agent => (
        <tr key={agent.name}>
          <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{agent.name}</td>
          <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{agent.role}</td>
          <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant="green">在线</Badge></td>
        </tr>
      ))}
    </DataTable>
  );

  if (tab === 'permissions') return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2">
        <StatCard label="角色数" value={String(roleCount)} detail="当前定义的默认权限角色。" />
        <StatCard label="团队成员数" value={String(agents.length)} detail="均默认继承角色权限。" />
        <StatCard label="强制复核场景" value={String(manualReviewCount)} detail="命中这些场景时必须进入人工复核。" tone="warning" />
        <StatCard label="禁止 AI 发送场景" value={String(blockedSendCount)} detail="AI 只能建议，不能直接发送。" tone="danger" />
      </div>
      <PanelCard title="角色权限概览" description="角色权限是团队成员的默认继承源。">
        <DataTable columns={[
          { key: 'role', label: '角色', width: '14%' }, { key: 'scope', label: '职责范围', width: '22%' },
          { key: 'suggest', label: 'AI 建议' }, { key: 'send', label: '人工发送' }, { key: 'review', label: '复核处理' },
          { key: 'knowledge', label: '知识访问', width: '18%' }, { key: 'settings', label: '设置访问', width: '14%' }, { key: 'audit', label: '审计访问', width: '18%' },
        ]} emptyMessage="当前没有角色权限画像。" className="rounded-[20px]">
          {settings.permissions.roleProfiles.map(profile => (
            <tr key={profile.role}>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.role}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)]">{profile.scopeSummary}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.aiSuggest}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.humanSend}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.manualReviewOverride}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.knowledgeAccess}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.settingsAccess}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.auditAccess}</td>
            </tr>
          ))}
        </DataTable>
      </PanelCard>
      <PanelCard title="成员继承关系" description="当前版本默认按角色继承。">
        <DataTable columns={[
          { key: 'member', label: '成员', width: '18%' }, { key: 'role', label: '角色', width: '16%' },
          { key: 'inherit', label: '继承状态', width: '12%' }, { key: 'effective', label: '有效权限摘要', width: '34%' }, { key: 'override', label: '单独覆盖', width: '20%' },
        ]} emptyMessage="当前没有成员权限继承数据。" className="rounded-[20px]">
          {settings.permissions.memberAssignments.map(member => (
            <tr key={member.memberName}>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{member.memberName}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{member.role}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={member.inheritsFromRole ? 'green' : 'yellow'}>{member.inheritsFromRole ? '继承角色' : '单独覆盖'}</Badge></td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)]">{member.effectivePermissions}</td>
              <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{member.overrideSummary}</td>
            </tr>
          ))}
        </DataTable>
      </PanelCard>
      <PanelCard title="场景权限边界" description="统一查看不同业务场景下 AI 建议权、发送权和人工复核要求。">
        <DataTable columns={[
          { key: 'scenario', label: '场景', width: '22%' }, { key: 'suggest', label: 'AI 建议' },
          { key: 'send', label: 'AI 发送' }, { key: 'review', label: '人工复核' }, { key: 'roles', label: '适用角色说明', width: '34%' },
        ]} emptyMessage="当前没有场景权限边界。" className="rounded-[20px]">
          {permissionBoundaries.map(boundary => {
            const s = boundaryBadge(boundary.aiSuggest);
            const sd = boundaryBadge(boundary.aiSend);
            const r = boundaryBadge(boundary.manualReview);
            const roleSummary = boundary.manualReview === 'Yes' ? '客服专员与高级客服可处理前置动作，团队负责人负责最终复核。' : boundary.manualReview === 'Conditional' ? '标准客服可处理，命中异常时升级给高级客服或负责人。' : '客服专员和高级客服可按场景规则完成处理，知识运营仅提供知识支持。';
            return (
              <tr key={boundary.scenario}>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{boundary.scenario}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={s.variant}>{s.label}</Badge></td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={sd.variant}>{sd.label}</Badge></td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={r.variant}>{r.label}</Badge></td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)]">{roleSummary}</td>
              </tr>
            );
          })}
        </DataTable>
      </PanelCard>
    </div>
  );

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
                {tab === 'general' ? '配置语言环境、时区和通知偏好。' : tab === 'team' ? '查看和管理团队成员与角色。' : tab === 'permissions' ? '管理角色权限和场景级 AI 操作边界。' : tab === 'channels' ? '启用或禁用客户服务渠道。' : '管理消息提醒规则和通知偏好。'}
              </div>
            </div>
          </div>
        </div>
        <PanelCard>{renderTabContent(tab, lang, onLanguageChange, settings, agents, permissionBoundaries, t)}</PanelCard>
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
          {renderTabContent(tab, lang, onLanguageChange, settings, agents, permissionBoundaries, t)}
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
