import { useState } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Toggle } from '../../../components/common/Toggle';
import type { AIConsoleProps } from '../types';
import { Field, PageHeader, SectionCard, StatCard } from '../shared';
import { inputCls } from '../sharedUtils';
import { displayScenario } from '../../../utils/display';
import type { ScenarioModelConfig } from '../../../types';

type Props = Pick<AIConsoleProps, 'scenarioModelConfigs' | 'effectiveScenarioPolicies' | 'routingSummary' | 'guardrails' | 'onUpdateScenarioModelConfig'>;

export function ScenarioModelConfigPage({ scenarioModelConfigs, effectiveScenarioPolicies, routingSummary, guardrails, onUpdateScenarioModelConfig }: Props) {
  const [selectedId, setSelectedId] = useState<string>(scenarioModelConfigs[0]?.id ?? '');
  const [draft, setDraft] = useState<ScenarioModelConfig | undefined>(scenarioModelConfigs[0]);
  const [dirty, setDirty] = useState(false);
  const selected = scenarioModelConfigs.find(item => item.id === selectedId) ?? scenarioModelConfigs[0];
  const activeDraft = dirty ? draft : selected;

  function updateDraft(recipe: (current: ScenarioModelConfig) => ScenarioModelConfig) {
    setDraft(prev => recipe(prev ?? selected ?? scenarioModelConfigs[0]));
    setDirty(true);
  }
  if (!activeDraft) return null;

  return (
    <div className="space-y-4">
      <PageHeader title="场景策略" description="以业务场景为唯一入口，统一维护模型、检索、复核、发送权限与护栏边界。" />

      <div className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-2">
        <StatCard label="场景总数" value={String(routingSummary.activeScenarioCount)} detail="所有场景都从这里定义运行边界" />
        <StatCard label="强制复核场景" value={String(routingSummary.manualReviewScenarioCount)} detail="不再由其他页面单独维护" tone="yellow" />
        <StatCard label="启用备用模型" value={String(routingSummary.fallbackEnabledScenarioCount)} detail="由场景策略直接控制回退模型" />
        <StatCard label="节点覆盖数" value={String(routingSummary.overriddenNodeCount)} detail="只展示真实派生结果，不再写死文案" />
      </div>

      <div className="grid grid-cols-[340px_minmax(0,1fr)] gap-4 max-[1200px]:grid-cols-1">
        <SectionCard title="场景策略列表">
          <div className="space-y-2">
            {effectiveScenarioPolicies.map(item => (
              <div
                key={item.scenarioConfigId}
                className={`border rounded-[14px] p-3 cursor-pointer ${selectedId === item.scenarioConfigId ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)]' : 'border-[var(--color-border-light)]'}`}
                onClick={() => setSelectedId(item.scenarioConfigId)}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="font-medium text-sm">{displayScenario(item.scenario)}</div>
                  <Badge variant={item.riskTone}>{item.manualReviewRequired ? '强制复核' : item.humanSendAllowed ? '人工可发送' : '仅保留建议'}</Badge>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">{item.primaryModel} / {item.fallbackModel}</div>
                <div className="flex gap-1 flex-wrap mt-2">
                  <Badge variant={item.aiSuggestAllowed ? 'blue' : 'gray'}>{item.aiSuggestAllowed ? 'AI 可建议' : 'AI 建议关闭'}</Badge>
                  <Badge variant={item.activeNodeOverrideCount > 0 ? 'yellow' : 'green'}>{item.activeNodeOverrideCount > 0 ? `${item.activeNodeOverrideCount} 个节点覆盖` : '纯场景继承'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-[var(--color-text-secondary)]">最近更新：{activeDraft.updatedAt || '未记录'}</div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => {
                if (selected) setDraft(selected);
                setDirty(false);
              }}>恢复当前版本</Button>
              <Button size="sm" disabled={!dirty} onClick={() => { if (activeDraft) void onUpdateScenarioModelConfig(activeDraft); setDirty(false); }}>保存场景策略</Button>
            </div>
          </div>

          <SectionCard title="场景运行配置">
            <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
              <Field label="策略名称"><input className={inputCls} value={activeDraft.name} onChange={e => updateDraft(prev => ({ ...prev, name: e.target.value }))} /></Field>
              <Field label="版本"><input className={inputCls} value={activeDraft.version} onChange={e => updateDraft(prev => ({ ...prev, version: e.target.value }))} /></Field>
              <Field label="模型通道"><input className={inputCls} value={activeDraft.modelChannel} onChange={e => updateDraft(prev => ({ ...prev, modelChannel: e.target.value }))} /></Field>
              <Field label="主模型"><input className={inputCls} value={activeDraft.primaryModel} onChange={e => updateDraft(prev => ({ ...prev, primaryModel: e.target.value }))} /></Field>
              <Field label="备用模型"><input className={inputCls} value={activeDraft.fallbackModel} onChange={e => updateDraft(prev => ({ ...prev, fallbackModel: e.target.value }))} /></Field>
              <Field label="Temperature"><input type="number" step="0.05" className={inputCls} value={activeDraft.temperature} onChange={e => updateDraft(prev => ({ ...prev, temperature: Number(e.target.value) }))} /></Field>
              <Field label="Top K"><input type="number" className={inputCls} value={activeDraft.topK} onChange={e => updateDraft(prev => ({ ...prev, topK: Number(e.target.value) }))} /></Field>
              <Field label="相似度阈值"><input type="number" step="0.01" className={inputCls} value={activeDraft.similarityThreshold} onChange={e => updateDraft(prev => ({ ...prev, similarityThreshold: Number(e.target.value) }))} /></Field>
              <Field label="敏感场景回退"><input className={inputCls} value={activeDraft.sensitiveCaseFallback} onChange={e => updateDraft(prev => ({ ...prev, sensitiveCaseFallback: e.target.value }))} /></Field>
              <Field label="低置信度回退"><input className={inputCls} value={activeDraft.lowConfidenceFallback} onChange={e => updateDraft(prev => ({ ...prev, lowConfidenceFallback: e.target.value }))} /></Field>
              <Field label="无命中回退"><input className={inputCls} value={activeDraft.noMatchFallback} onChange={e => updateDraft(prev => ({ ...prev, noMatchFallback: e.target.value }))} /></Field>
              <Field label="输出预算"><input type="number" className={inputCls} value={activeDraft.maxOutputTokens} onChange={e => updateDraft(prev => ({ ...prev, maxOutputTokens: Number(e.target.value) }))} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 max-[1000px]:grid-cols-1">
              <Toggle label="AI 允许建议" on={activeDraft.aiSuggestAllowed} onClick={() => updateDraft(prev => ({ ...prev, aiSuggestAllowed: !prev.aiSuggestAllowed }))} />
              <Toggle label="人工可发送" on={activeDraft.humanSendAllowed} onClick={() => updateDraft(prev => ({ ...prev, humanSendAllowed: !prev.humanSendAllowed }))} />
              <Toggle label="强制人工复核" on={activeDraft.manualReviewRequired} onClick={() => updateDraft(prev => ({ ...prev, manualReviewRequired: !prev.manualReviewRequired }))} />
              <Toggle label="启用 Query Rewrite" on={activeDraft.queryRewriteEnabled} onClick={() => updateDraft(prev => ({ ...prev, queryRewriteEnabled: !prev.queryRewriteEnabled }))} />
              <Toggle label="启用重排序" on={activeDraft.rerankerEnabled} onClick={() => updateDraft(prev => ({ ...prev, rerankerEnabled: !prev.rerankerEnabled }))} />
              <Toggle label="必须引用" on={activeDraft.citationRequired} onClick={() => updateDraft(prev => ({ ...prev, citationRequired: !prev.citationRequired }))} />
            </div>
            <Field label="禁止承诺列表">
              <textarea className={`${inputCls} h-28 py-2 resize-none`} value={activeDraft.blockedClaims.join('\n')} onChange={e => updateDraft(prev => ({ ...prev, blockedClaims: e.target.value.split('\n').map(item => item.trim()).filter(Boolean) }))} />
            </Field>
          </SectionCard>

          <SectionCard title="统一护栏说明">
            <div className="space-y-2 text-xs">
              {guardrails.map(item => (
                <div key={item} className="border border-[var(--color-border-light)] rounded-[12px] p-3 bg-[var(--color-bg)]">{item}</div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
