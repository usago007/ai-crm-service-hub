import { useEffect, useState } from 'react';
import type { Agent, MemberPermissionAssignment, PermissionBoundary, SettingsData, TeamRolePermissionProfile } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { DataTable } from '../components/common/DataTable';
import { Drawer } from '../components/common/Drawer';
import { Modal } from '../components/common/Modal';
import { Toggle } from '../components/common/Toggle';
import { PanelCard, StatCard } from '../components/common/PageChrome';
import { SectionCard } from './ai-console/shared';
import { useT, type Language } from '../i18n';
import { inputCls } from './ai-console/sharedUtils';
import { Globe, Shield } from 'lucide-react';

interface SettingsProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onUpdateSettings: (updater: (prev: SettingsData) => SettingsData) => void;
  onUpdatePermissionBoundaries?: (updater: (prev: PermissionBoundary[]) => PermissionBoundary[]) => void;
  settings: SettingsData;
  agents: Agent[];
  permissionBoundaries: PermissionBoundary[];
  initialTab?: string;
}

const tabs = [
  { key: 'general', label: '通用', icon: Globe },
  { key: 'permissions', label: '权限', icon: Shield },
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

function renderTabContent(
  tab: string,
  lang: Language,
  onLanguageChange: (l: Language) => void,
  onUpdateSettings: (updater: (prev: SettingsData) => SettingsData) => void,
  onUpdatePermissionBoundaries: ((updater: (prev: PermissionBoundary[]) => PermissionBoundary[]) => void) | undefined,
  settings: SettingsData,
  permissionBoundaries: PermissionBoundary[],
  t: ReturnType<typeof useT>['t'],
) {
  const timezoneOptions = [
    { value: 'UTC+8（中国）', label: 'UTC+8（中国）' },
    { value: 'UTC+0（GMT）', label: 'UTC+0（GMT）' },
    { value: 'UTC-5（美东时间）', label: 'UTC-5（美东时间）' },
    { value: 'UTC+9（日本）', label: 'UTC+9（日本）' },
    { value: 'UTC+5:30（印度）', label: 'UTC+5:30（印度）' },
  ];
  const notificationDeliveryOptions = [
    { value: '邮件 + 应用内', label: '邮件 + 应用内' },
    { value: '仅应用内', label: '仅应用内' },
    { value: '仅邮件', label: '仅邮件' },
    { value: 'Slack + 邮件', label: 'Slack + 邮件' },
  ];

  if (tab === 'general') return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.55)] p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)]">{t.settings.language}</div>
          <select className={`${inputCls} mt-2`} value={lang} onChange={e => onLanguageChange(e.target.value as Language)}>
            <option value="zh">简体中文</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.55)] p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)]">{t.settings.timezone}</div>
          <select className={`${inputCls} mt-2`} value={settings.general.timezone} onChange={e => onUpdateSettings(prev => ({ ...prev, general: { ...prev.general, timezone: e.target.value } }))}>
            {timezoneOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.55)] p-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)]">{t.settings.notificationDelivery}</div>
          <select className={`${inputCls} mt-2`} value={settings.general.notifications} onChange={e => onUpdateSettings(prev => ({ ...prev, general: { ...prev.general, notifications: e.target.value } }))}>
            {notificationDeliveryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SectionCard title="服务渠道">
          {Object.entries(settings.channels).map(([key, v]) => (
            <Toggle key={key} label={channelLabels[key] ?? key} on={v} onClick={() => onUpdateSettings(prev => ({ ...prev, channels: { ...prev.channels, [key]: !v } }))} />
          ))}
        </SectionCard>
        <SectionCard title="通知偏好">
          {Object.entries(settings.notifications).map(([key, v]) => (
            <Toggle key={key} label={notificationLabels[key] ?? key} on={v} onClick={() => onUpdateSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: !v } }))} />
          ))}
        </SectionCard>
      </div>
    </div>
  );

  if (tab === 'permissions') return <PermissionsAndTeam settings={settings} permissionBoundaries={permissionBoundaries} onUpdateSettings={onUpdateSettings} onUpdatePermissionBoundaries={onUpdatePermissionBoundaries} />;

  return null;
}

function computeEffectivePerms(role: string, profiles: TeamRolePermissionProfile[]): string {
  const profile = profiles.find(p => p.role === role);
  if (!profile) return '沿用默认角色权限';
  return `${profile.aiSuggest} / ${profile.humanSend} / ${profile.settingsAccess}`;
}

const permOptions = [
  { value: 'Yes', label: '是' },
  { value: 'No', label: '否' },
  { value: 'Conditional', label: '按条件' },
];

interface PermissionsAndTeamProps {
  settings: SettingsData;
  permissionBoundaries: PermissionBoundary[];
  onUpdateSettings: (updater: (prev: SettingsData) => SettingsData) => void;
  onUpdatePermissionBoundaries?: (updater: (prev: PermissionBoundary[]) => PermissionBoundary[]) => void;
}

function PermissionsAndTeam({ settings, permissionBoundaries, onUpdateSettings, onUpdatePermissionBoundaries }: PermissionsAndTeamProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<TeamRolePermissionProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<TeamRolePermissionProfile | null>(null);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('客服专员');

  const assignments: MemberPermissionAssignment[] = settings.permissions.memberAssignments;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
        <StatCard label="角色模版" value={String(settings.permissions.roleProfiles.length)} detail="当前定义的权限角色。" />
        <StatCard label="团队成员" value={String(assignments.length)} detail="均继承对应角色权限。" />
      </div>

      <SectionCard title="AI 权限边界">
        <div className="text-xs text-[var(--color-text-secondary)] mb-3">按服务场景配置 AI 建议、自动发送与人工审核策略。更改即时生效。</div>
        <div className="overflow-x-auto">
          <DataTable columns={[
            { key: 'scenario', label: '场景', width: '28%' },
            { key: 'aiSuggest', label: 'AI 建议', width: '24%' },
            { key: 'aiSend', label: 'AI 发送', width: '24%' },
            { key: 'manualReview', label: '人工审核', width: '24%' },
          ]} emptyMessage="暂无权限边界数据。" className="rounded-[20px]">
            {permissionBoundaries.map(b => (
              <tr key={b.scenario}>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] font-medium">{b.scenario}</td>
                {(['aiSuggest', 'aiSend', 'manualReview'] as const).map(field => (
                  <td key={field} className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                    <select
                      className={`${inputCls} h-8 text-xs`}
                      value={b[field]}
                      onChange={e => {
                        onUpdatePermissionBoundaries?.(prev =>
                          prev.map(pb => pb.scenario === b.scenario ? { ...pb, [field]: e.target.value } : pb),
                        );
                      }}
                    >
                      {permOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </DataTable>
        </div>
      </SectionCard>

      <SectionCard title="角色定义">
        <div className="text-xs text-[var(--color-text-secondary)] mb-3">每个角色预设了一组 AI 操作权限。成员分配角色后自动继承这些权限。</div>
        <div className="overflow-x-auto">
          <DataTable columns={[
            { key: 'role', label: '角色', width: '12%' },
            { key: 'scope', label: '职责范围', width: '20%' },
            { key: 'suggest', label: 'AI 建议', width: '11%' },
            { key: 'send', label: '发送', width: '11%' },
            { key: 'review', label: '复核', width: '14%' },
            { key: 'knowledge', label: '知识访问', width: '14%' },
            { key: 'settings', label: '设置访问', width: '11%' },
            { key: 'actions', label: '操作', width: '70px' },
          ]} emptyMessage="暂无角色定义。" className="rounded-[20px]">
            {settings.permissions.roleProfiles.map(profile => (
              <tr key={profile.role}>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] font-medium">{profile.role}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)]">{profile.scopeSummary}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.aiSuggest}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.humanSend}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.manualReviewOverride}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.knowledgeAccess}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{profile.settingsAccess}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingProfile(profile); setProfileDraft({ ...profile }); }}>编辑</Button>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </SectionCard>

      <SectionCard title="成员分配">
        <div className="text-xs text-[var(--color-text-secondary)] mb-3">每位成员分配一个角色，继承该角色的权限。可随时调整角色。</div>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="text-xs text-[var(--color-text-secondary)]">共 {assignments.length} 人</div>
          <Button size="sm" onClick={() => { setNewName(''); setNewRole('客服专员'); setShowAdd(true); }}>添加成员</Button>
        </div>
        <div className="overflow-x-auto">
          <DataTable columns={[
            { key: 'name', label: '姓名', width: '14%' },
            { key: 'role', label: '角色', width: '16%' },
            { key: 'inherits', label: '继承角色', width: '12%' },
            { key: 'effective', label: '有效权限', width: '32%' },
            { key: 'actions', label: '操作', width: '130px' },
          ]} emptyMessage="暂无成员。" className="rounded-[20px]">
            {assignments.map((ma) => (
              <tr key={ma.memberName}>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] font-medium">{ma.memberName}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                  {editingRole === ma.memberName ? (
                    <select
                      className={`${inputCls} h-8 text-xs`}
                      value={ma.role}
                      onChange={e => {
                        const newRoleValue = e.target.value;
                        onUpdateSettings(prev => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            memberAssignments: prev.permissions.memberAssignments.map(m =>
                              m.memberName === ma.memberName
                                ? { ...m, role: newRoleValue, effectivePermissions: computeEffectivePerms(newRoleValue, prev.permissions.roleProfiles) }
                                : m,
                            ),
                          },
                        }));
                        setEditingRole(null);
                      }}
                      autoFocus
                      onBlur={() => setEditingRole(null)}
                    >
                      {settings.permissions.roleProfiles.map(rp => <option key={rp.role} value={rp.role}>{rp.role}</option>)}
                    </select>
                  ) : (
                    <button type="button" className="text-[var(--color-primary)] hover:underline" onClick={() => setEditingRole(ma.memberName)}>{ma.role}</button>
                  )}
                </td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                  <Badge variant={ma.inheritsFromRole ? 'green' : 'gray'}>{ma.inheritsFromRole ? '是' : '否'}</Badge>
                </td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)]">{ma.effectivePermissions}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingRole(ma.memberName)}>改角色</Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      onUpdateSettings(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          memberAssignments: prev.permissions.memberAssignments.filter(m => m.memberName !== ma.memberName),
                        },
                      }));
                    }}>移除</Button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </SectionCard>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="添加成员" actions={
        <Button size="sm" onClick={() => {
          if (newName.trim()) {
            onUpdateSettings(prev => ({
              ...prev,
              permissions: {
                ...prev.permissions,
                memberAssignments: [
                  ...prev.permissions.memberAssignments,
                  {
                    memberName: newName.trim(),
                    role: newRole,
                    inheritsFromRole: true,
                    overrideSummary: '无单独覆盖',
                    effectivePermissions: computeEffectivePerms(newRole, prev.permissions.roleProfiles),
                  },
                ],
              },
            }));
            setShowAdd(false);
          }
        }} disabled={!newName.trim()}>确认添加</Button>
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

      <Drawer
        open={editingProfile !== null}
        onClose={() => setEditingProfile(null)}
        title={`编辑角色：${editingProfile?.role ?? ''}`}
        actions={
          <Button size="sm" onClick={() => {
            if (!profileDraft || !editingProfile) return;
            const updated = profileDraft;
            onUpdateSettings(prev => ({
              ...prev,
              permissions: {
                ...prev.permissions,
                roleProfiles: prev.permissions.roleProfiles.map(rp =>
                  rp.role === editingProfile.role ? updated : rp,
                ),
                memberAssignments: prev.permissions.memberAssignments.map(ma =>
                  ma.role === editingProfile.role
                    ? { ...ma, effectivePermissions: computeEffectivePerms(updated.role, prev.permissions.roleProfiles.map(rp => rp.role === editingProfile.role ? updated : rp)) }
                    : ma,
                ),
              },
            }));
            setEditingProfile(null);
            setProfileDraft(null);
          }}>保存</Button>
        }
      >
        {profileDraft && (
          <div className="space-y-4">
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">职责范围</div>
              <input className={inputCls} value={profileDraft.scopeSummary} onChange={e => setProfileDraft(prev => prev ? { ...prev, scopeSummary: e.target.value } : prev)} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">AI 建议</div>
              <input className={inputCls} value={profileDraft.aiSuggest} onChange={e => setProfileDraft(prev => prev ? { ...prev, aiSuggest: e.target.value } : prev)} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">人工发送</div>
              <input className={inputCls} value={profileDraft.humanSend} onChange={e => setProfileDraft(prev => prev ? { ...prev, humanSend: e.target.value } : prev)} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">复核覆盖</div>
              <input className={inputCls} value={profileDraft.manualReviewOverride} onChange={e => setProfileDraft(prev => prev ? { ...prev, manualReviewOverride: e.target.value } : prev)} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">知识访问</div>
              <input className={inputCls} value={profileDraft.knowledgeAccess} onChange={e => setProfileDraft(prev => prev ? { ...prev, knowledgeAccess: e.target.value } : prev)} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">设置访问</div>
              <input className={inputCls} value={profileDraft.settingsAccess} onChange={e => setProfileDraft(prev => prev ? { ...prev, settingsAccess: e.target.value } : prev)} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">审计访问</div>
              <input className={inputCls} value={profileDraft.auditAccess} onChange={e => setProfileDraft(prev => prev ? { ...prev, auditAccess: e.target.value } : prev)} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export function Settings({ lang, onLanguageChange, onUpdateSettings, onUpdatePermissionBoundaries, settings, agents, permissionBoundaries, initialTab }: SettingsProps) {
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
                {tab === 'general' ? '配置语言环境、时区、服务渠道和通知偏好。' : '管理角色权限与团队成员分配。'}
              </div>
            </div>
          </div>
        </div>
        <PanelCard>{renderTabContent(tab, lang, onLanguageChange, onUpdateSettings, onUpdatePermissionBoundaries, settings, permissionBoundaries, t)}</PanelCard>
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
          {renderTabContent(tab, lang, onLanguageChange, onUpdateSettings, onUpdatePermissionBoundaries, settings, permissionBoundaries, t)}
        </PanelCard>
      </div>
    </div>
  );
}
