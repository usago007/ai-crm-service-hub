import type { Language } from '../types';
import { AGENTS, SETTINGS_DATA } from '../data/knowledge';
import { Badge } from '../components/common/Badge';
import { Toggle } from '../components/common/Toggle';
import { useT } from '../i18n';

interface SettingsProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  settingsTab: string;
  onSettingsTabChange: (tab: string) => void;
}

const TABS = ['general', 'ai', 'team', 'channels', 'notifications'];

export function Settings({ lang, onLanguageChange, settingsTab, onSettingsTabChange }: SettingsProps) {
  const { t } = useT();
  const tabLabels = [t.settings.general, t.settings.aiSettings, t.settings.team, t.settings.channels, t.settings.notifications];

  return (
    <div>
      <div className="text-xl font-bold mb-1">{t.page.settings}</div>
      <div className="text-[13px] text-[var(--color-text-secondary)] mb-5">{t.page.subtitle_settings}</div>

      <div className="grid grid-cols-[220px_1fr] gap-5">
        <div className="border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)] p-2 overflow-hidden">
          {TABS.map((tab, i) => (
            <div
              key={tab}
              className={`px-3.5 py-2 rounded-[var(--radius-sm)] text-[13px] cursor-pointer transition-all duration-[var(--transition)] ${
                settingsTab === tab
                  ? 'bg-[var(--color-primary-bg)] text-[var(--color-primary)] font-medium'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
              }`}
              onClick={() => onSettingsTabChange(tab)}
            >
              {tabLabels[i]}
            </div>
          ))}
        </div>

        <div className="border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)] p-5">
          {settingsTab === 'general' && (
            <>
              <div className="text-[15px] font-semibold mb-4">{t.settings.general}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-4">{t.settings.generalDesc}</div>
              <div className="mb-3">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">{t.settings.language}</label>
                <select
                  className="w-full h-9 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 text-xs bg-white text-[var(--color-text)] cursor-pointer outline-none"
                  value={lang}
                  onChange={e => onLanguageChange(e.target.value as Language)}
                >
                  <option value="en">{t.settings.english}</option>
                  <option value="zh">{t.settings.chinese}</option>
                  <option value="en" disabled>{t.settings.spanish}</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">{t.settings.timezone}</label>
                <select className="w-full h-9 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 text-xs bg-white text-[var(--color-text)] cursor-pointer outline-none">
                  <option>UTC-5 (Eastern Time)</option>
                  <option>UTC+0 (GMT)</option>
                  <option>UTC+8 (China)</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">{t.settings.notificationDelivery}</label>
                <select className="w-full h-9 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 text-xs bg-white text-[var(--color-text)] cursor-pointer outline-none">
                  <option>Email + In-app</option>
                  <option>Email Only</option>
                  <option>In-app Only</option>
                </select>
              </div>
              <button className="btn btn-primary">{t.common.saveChanges}</button>
            </>
          )}

          {settingsTab === 'ai' && (
            <>
              <div className="text-[15px] font-semibold mb-4">{t.settings.aiSettings}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-4">{t.settings.aiSettingsDesc}</div>
              <div className="mb-3">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">{t.settings.model}</label>
                <select className="w-full h-9 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 text-xs bg-white text-[var(--color-text)] cursor-pointer outline-none">
                  <option>GPT-4o-mini</option>
                  <option>GPT-4o</option>
                  <option>Claude 3.5 Sonnet</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">{t.settings.temperature}</label>
                <input className="w-full h-9 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 text-xs bg-white outline-none" type="number" defaultValue={0.3} min={0} max={1} step={0.1} />
              </div>
              <div className="mb-3">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">{t.settings.maxTokens}</label>
                <input className="w-full h-9 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 text-xs bg-white outline-none" type="number" defaultValue={512} />
              </div>
              <div className="mb-3">
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">{t.settings.defaultLanguage}</label>
                <select className="w-full h-9 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 text-xs bg-white text-[var(--color-text)] cursor-pointer outline-none">
                  <option>{t.settings.english}</option>
                  <option>{t.settings.autoDetect}</option>
                </select>
              </div>
              <button className="btn btn-primary">{t.common.saveChanges}</button>
            </>
          )}

          {settingsTab === 'team' && (
            <>
              <div className="text-[15px] font-semibold mb-4">{t.settings.team}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-4">{t.settings.teamDesc}</div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{t.settings.name}</th>
                    <th className="text-left px-2 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{t.settings.role}</th>
                    <th className="text-left px-2 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{t.settings.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {AGENTS.map((a, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5 text-xs border-b border-[var(--color-border-light)]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[10px] text-white font-semibold">{a.name.charAt(0)}</div>
                          {a.name}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-xs border-b border-[var(--color-border-light)]">{a.role}</td>
                      <td className="px-2 py-1.5 text-xs border-b border-[var(--color-border-light)]"><Badge variant="green">{t.common.online}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-primary mt-4">{t.settings.inviteMember}</button>
            </>
          )}

          {settingsTab === 'channels' && (
            <>
              <div className="text-[15px] font-semibold mb-4">{t.settings.channels}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-4">{t.settings.channelsDesc}</div>
              {Object.entries({ liveChat: 'Live Chat', email: 'Email', ticket: 'Ticket System', whatsapp: 'WhatsApp', messenger: 'Messenger' }).map(([k, v]) => (
                <Toggle key={k} label={v} on={SETTINGS_DATA.channels[k]} onClick={() => {}} />
              ))}
              <button className="btn btn-primary mt-4">{t.common.saveChanges}</button>
            </>
          )}

          {settingsTab === 'notifications' && (
            <>
              <div className="text-[15px] font-semibold mb-4">{t.settings.notifications}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-4">{t.settings.notificationsDesc}</div>
              {Object.entries({ newTicket: 'New Ticket', slaWarning: 'SLA Warning', aiAlert: 'AI Alert', taskReminder: 'Task Reminder', reviewRequired: 'Review Required' }).map(([k, v]) => (
                <Toggle key={k} label={v} on={SETTINGS_DATA.notifications[k]} onClick={() => {}} />
              ))}
              <button className="btn btn-primary mt-4">{t.common.saveChanges}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
