import type { AICapability } from '../types';
import { Toggle } from '../components/common/Toggle';
import { Card } from '../components/common/Card';
import { PERMISSION_BOUNDARIES, GUARDRAILS } from '../data/knowledge';
import { Badge } from '../components/common/Badge';
import { useT } from '../i18n';

interface AIAssistantProps {
  aiCapabilities: AICapability[];
  onToggleCapability: (id: string) => void;
}

export function AIAssistant({ aiCapabilities, onToggleCapability }: AIAssistantProps) {
  const { t } = useT();

  const PERFORMANCE = [
    { label: t.aiAssistantMetrics.todaySuggestions, value: '47', color: '' },
    { label: t.aiAssistantMetrics.adoptionRate, value: '72%', color: 'var(--color-success)' },
    { label: t.aiAssistantMetrics.avgConfidence, value: '84%', color: '' },
    { label: t.aiAssistantMetrics.faqsMatched, value: '312', color: '' },
    { label: t.aiAssistantMetrics.risksDetected, value: '28', color: '' },
  ];

  return (
    <div>
      <div className="text-xl font-bold mb-1">{t.page.aiAssistant}</div>
      <div className="text-[13px] text-[var(--color-text-secondary)] mb-5">{t.page.subtitle_aiAssistant}</div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[var(--color-border)] text-sm font-semibold flex items-center justify-between">
            {t.ai.capabilities}
          </div>
          <div className="p-4">
            {aiCapabilities.map(c => (
              <Toggle
                key={c.id}
                label={c.name}
                description={c.desc}
                on={c.enabled}
                onClick={() => onToggleCapability(c.id)}
              />
            ))}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[var(--color-border)] text-sm font-semibold">{t.ai.permissionBoundary}</div>
          <div className="p-4">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-2 py-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{t.ai.scenario}</th>
                  <th className="text-left px-2 py-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{t.ai.aiCanSuggest}</th>
                  <th className="text-left px-2 py-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{t.ai.aiCanSend}</th>
                  <th className="text-left px-2 py-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{t.ai.manualReview}</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_BOUNDARIES.map((p, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1.5 text-xs border-b border-[var(--color-border-light)]">{p.scenario}</td>
                    <td className="px-2 py-1.5 text-xs border-b border-[var(--color-border-light)]">
                      <Badge variant={p.aiSuggest === 'Yes' ? 'green' : 'red'}>{p.aiSuggest}</Badge>
                    </td>
                    <td className="px-2 py-1.5 text-xs border-b border-[var(--color-border-light)]">
                      <Badge variant="red">{p.aiSend}</Badge>
                    </td>
                    <td className="px-2 py-1.5 text-xs border-b border-[var(--color-border-light)]">
                      <Badge variant={p.manualReview === 'Yes' ? 'red' : 'green'}>{p.manualReview}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[var(--color-border)] text-sm font-semibold">{t.ai.guardrails}</div>
          <div className="p-4">
            {GUARDRAILS.map((g, i) => (
              <div key={i} className="px-3 py-2 mb-1.5 bg-[var(--color-bg)] rounded-[var(--radius-sm)] text-xs border-l-3 border-l-[var(--color-primary)] flex items-center gap-2">
                {g}
              </div>
            ))}
            <div className="mt-3">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">{t.ai.customGuardrail}</label>
              <textarea
                className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-xs font-[var(--font-family-sans)] outline-none resize-vertical bg-white focus:border-[var(--color-primary)]"
                rows={2}
                placeholder={t.ai.addGuardrail}
              />
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[var(--color-border)] text-sm font-semibold">{t.ai.modelSettings}</div>
          <div className="p-4">
            <div className="mb-3">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">{t.settings.model}</label>
              <select className="w-full h-9 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 text-xs bg-white text-[var(--color-text)] cursor-pointer outline-none">
                <option>{t.settingsOptions.modelGpt4oMini}</option>
                <option>{t.settingsOptions.modelGpt4o}</option>
                <option>{t.settingsOptions.modelClaude}</option>
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
                <option>{t.settingsOptions.responseEnglish}</option>
                <option>{t.settingsOptions.autoDetect}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[var(--color-border)] text-sm font-semibold">{t.ai.performance}</div>
          <div className="p-4">
            {PERFORMANCE.map((p, i) => (
              <div key={i} className="flex justify-between py-0.5 text-xs">
                <span className="text-[var(--color-text-secondary)]">{p.label}</span>
                <span className="font-medium text-right ml-3" style={p.color ? { color: p.color } : undefined}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
