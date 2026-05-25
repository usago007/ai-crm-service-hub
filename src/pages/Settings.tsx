import { useState } from 'react';
import type { Agent, SettingsData } from '../types';
import { Badge } from '../components/common/Badge';
import { DataTable } from '../components/common/DataTable';
import { Toggle } from '../components/common/Toggle';
import { PanelCard, StatCard, SummaryHeader, inputCls } from '../components/common/PageChrome';
import { useT, type Language } from '../i18n';

interface SettingsProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  settings: SettingsData;
  agents: Agent[];
}

const tabs = ['general', 'team', 'channels', 'notifications'] as const;

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

export function Settings({ lang, onLanguageChange, settings, agents }: SettingsProps) {
  const { t } = useT();
  const [tab, setTab] = useState<(typeof tabs)[number]>('general');

  return (
    <div className="space-y-4">
      <SummaryHeader
        aside={
          <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
            <StatCard label="语言环境" value={lang === 'zh' ? '中文' : lang} detail="后台操作语言与基础文案入口。" />
            <StatCard label="团队席位" value={String(agents.length)} detail="当前可见的在线客服与管理成员。" />
            <StatCard label="通知开关" value={String(Object.values(settings.notifications).filter(Boolean).length)} detail="已启用的提醒规则数量。" tone="warning" />
          </div>
        }
      />

      <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-5 max-[1100px]:grid-cols-1">
        <PanelCard title="设置分组" className="p-3">
          <div className="space-y-1">
            {tabs.map(item => (
              <button key={item} className={`w-full text-left px-3.5 py-3 rounded-[16px] text-[13px] transition-all duration-200 ${tab === item ? 'bg-[rgba(179,92,32,0.12)] text-[var(--color-primary)] font-medium shadow-[inset_0_0_0_1px_rgba(179,92,32,0.12)]' : 'text-[var(--color-text-secondary)] hover:bg-[rgba(30,38,47,0.05)]'}`} onClick={() => setTab(item)}>
                {item === 'general' ? t.settings.general : item === 'team' ? t.settings.team : item === 'channels' ? t.settings.channels : t.settings.notifications}
              </button>
            ))}
          </div>
        </PanelCard>

        <PanelCard title={tab === 'general' ? t.settings.general : tab === 'team' ? t.settings.team : tab === 'channels' ? t.settings.channels : t.settings.notifications}>
          {tab === 'general' ? (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-2">{t.settings.language}</label>
                <select className={inputCls} value={lang} onChange={e => onLanguageChange(e.target.value as Language)}>
                  <option value="zh">简体中文</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs max-[900px]:grid-cols-1">
                <InfoCard label={t.settings.timezone} value={settings.general.timezone} />
                <InfoCard label={t.settings.notificationDelivery} value={settings.general.notifications} />
              </div>
            </div>
          ) : null}

          {tab === 'team' ? (
            <DataTable
              columns={[
                { key: 'name', label: t.settings.name },
                { key: 'role', label: t.settings.role },
                { key: 'status', label: t.settings.status },
              ]}
              emptyMessage="当前没有可见团队成员。"
              className="rounded-[20px]"
            >
              {agents.map(agent => (
                <tr key={agent.name}>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{agent.name}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{agent.role}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant="green">在线</Badge></td>
                </tr>
              ))}
            </DataTable>
          ) : null}

          {tab === 'channels' ? (
            <div>
              {Object.entries(settings.channels).map(([key, value]) => (
                <Toggle key={key} label={channelLabels[key] ?? key} on={value} onClick={() => {}} />
              ))}
            </div>
          ) : null}

          {tab === 'notifications' ? (
            <div>
              {Object.entries(settings.notifications).map(([key, value]) => (
                <Toggle key={key} label={notificationLabels[key] ?? key} on={value} onClick={() => {}} />
              ))}
            </div>
          ) : null}
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
