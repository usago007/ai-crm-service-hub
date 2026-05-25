import { useMemo, useState } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Toggle } from '../../../components/common/Toggle';
import type { AIConsoleProps } from '../types';
import { Field, PageHeader, SectionCard, StatCard } from '../shared';
import { inputCls } from '../sharedUtils';
import { displayScenario } from '../../../utils/display';
import type { PipelineNodeModelConfig, ScenarioSettingsTab, ScenarioModelConfig } from '../../../types';

type Props = Pick<
  AIConsoleProps,
  | 'scenarioModelConfigs'
  | 'effectiveScenarioPolicies'
  | 'routingSummary'
  | 'pipelineNodeConfigs'
  | 'effectiveNodePolicies'
  | 'aiOpsStages'
  | 'onUpdateScenarioModelConfig'
  | 'onUpdatePipelineNodeConfig'
> & {
  activeTab: ScenarioSettingsTab;
  onTabChange: (tab: ScenarioSettingsTab) => void;
};

export function ScenarioModelConfigPage({
  scenarioModelConfigs,
  effectiveScenarioPolicies,
  routingSummary,
  pipelineNodeConfigs,
  effectiveNodePolicies,
  aiOpsStages,
  activeTab,
  onTabChange,
  onUpdateScenarioModelConfig,
  onUpdatePipelineNodeConfig,
}: Props) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarioModelConfigs[0]?.id ?? '');
  const [scenarioDraft, setScenarioDraft] = useState<ScenarioModelConfig | undefined>(scenarioModelConfigs[0]);
  const [scenarioDirty, setScenarioDirty] = useState(false);
  const selectedScenario = scenarioModelConfigs.find(item => item.id === selectedScenarioId) ?? scenarioModelConfigs[0];
  const activeScenarioDraft = scenarioDirty ? scenarioDraft : selectedScenario;

  const [selectedNodeId, setSelectedNodeId] = useState<string>(pipelineNodeConfigs[0]?.id ?? '');
  const [nodeDraft, setNodeDraft] = useState<PipelineNodeModelConfig | undefined>(pipelineNodeConfigs[0]);
  const [nodeDirty, setNodeDirty] = useState(false);
  const selectedNode = pipelineNodeConfigs.find(item => item.id === selectedNodeId) ?? pipelineNodeConfigs[0];
  const activeNodeDraft = nodeDirty ? nodeDraft : selectedNode;

  const stats = useMemo(() => {
    if (activeTab === 'scenario') {
      return [
        { label: '场景总数', value: String(routingSummary.activeScenarioCount), tone: undefined },
        { label: '强制复核场景', value: String(routingSummary.manualReviewScenarioCount), tone: 'yellow' as const },
        { label: '启用备用模型', value: String(routingSummary.fallbackEnabledScenarioCount), tone: undefined },
        { label: '节点覆盖数', value: String(routingSummary.overriddenNodeCount), tone: undefined },
      ];
    }
    return [
      { label: '节点总数', value: String(effectiveNodePolicies.length), tone: undefined },
      { label: '节点覆盖', value: String(effectiveNodePolicies.filter(item => item.effectiveSource === 'node').length), tone: undefined },
      { label: '继承场景', value: String(effectiveNodePolicies.filter(item => item.effectiveSource === 'scenario').length), tone: undefined },
      { label: '停用节点', value: String(effectiveNodePolicies.filter(item => !item.enabled).length), tone: 'yellow' as const },
    ];
  }, [activeTab, effectiveNodePolicies, routingSummary]);

  function updateScenarioDraft(recipe: (current: ScenarioModelConfig) => ScenarioModelConfig) {
    setScenarioDraft(prev => recipe(prev ?? selectedScenario ?? scenarioModelConfigs[0]));
    setScenarioDirty(true);
  }

  function updateNodeDraft(recipe: (current: PipelineNodeModelConfig) => PipelineNodeModelConfig) {
    setNodeDraft(prev => recipe(prev ?? selectedNode ?? pipelineNodeConfigs[0]));
    setNodeDirty(true);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="场景策略" />

      <div className="flex gap-2 flex-wrap">
        {([
          ['scenario', '场景策略'],
          ['nodes', '能力节点'],
        ] as const).map(([key, label]) => (
          <Button key={key} variant={activeTab === key ? 'primary' : 'secondary'} size="sm" onClick={() => onTabChange(key)}>
            {label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-2">
        {stats.map(item => (
          <StatCard key={item.label} label={item.label} value={item.value} detail="" tone={item.tone} />
        ))}
      </div>

      {activeTab === 'scenario' && activeScenarioDraft ? (
        <div className="grid grid-cols-[340px_minmax(0,1fr)] gap-4 max-[1200px]:grid-cols-1">
          <SectionCard title="场景策略列表">
            <div className="space-y-2">
              {effectiveScenarioPolicies.map(item => (
                <div
                  key={item.scenarioConfigId}
                  className={`border rounded-[14px] p-3 cursor-pointer ${selectedScenarioId === item.scenarioConfigId ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)]' : 'border-[var(--color-border-light)]'}`}
                  onClick={() => setSelectedScenarioId(item.scenarioConfigId)}
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
              <div className="text-xs text-[var(--color-text-secondary)]">最近更新：{activeScenarioDraft.updatedAt || '未记录'}</div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (selectedScenario) setScenarioDraft(selectedScenario);
                    setScenarioDirty(false);
                  }}
                >
                  恢复当前版本
                </Button>
                <Button size="sm" disabled={!scenarioDirty} onClick={() => { void onUpdateScenarioModelConfig(activeScenarioDraft); setScenarioDirty(false); }}>
                  保存场景策略
                </Button>
              </div>
            </div>

            <SectionCard title="场景运行配置">
              <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
                <Field label="策略名称"><input className={inputCls} value={activeScenarioDraft.name} onChange={e => updateScenarioDraft(prev => ({ ...prev, name: e.target.value }))} /></Field>
                <Field label="版本"><input className={inputCls} value={activeScenarioDraft.version} onChange={e => updateScenarioDraft(prev => ({ ...prev, version: e.target.value }))} /></Field>
                <Field label="模型通道"><input className={inputCls} value={activeScenarioDraft.modelChannel} onChange={e => updateScenarioDraft(prev => ({ ...prev, modelChannel: e.target.value }))} /></Field>
                <Field label="主模型"><input className={inputCls} value={activeScenarioDraft.primaryModel} onChange={e => updateScenarioDraft(prev => ({ ...prev, primaryModel: e.target.value }))} /></Field>
                <Field label="备用模型"><input className={inputCls} value={activeScenarioDraft.fallbackModel} onChange={e => updateScenarioDraft(prev => ({ ...prev, fallbackModel: e.target.value }))} /></Field>
                <Field label="Temperature"><input type="number" step="0.05" className={inputCls} value={activeScenarioDraft.temperature} onChange={e => updateScenarioDraft(prev => ({ ...prev, temperature: Number(e.target.value) }))} /></Field>
                <Field label="Top K"><input type="number" className={inputCls} value={activeScenarioDraft.topK} onChange={e => updateScenarioDraft(prev => ({ ...prev, topK: Number(e.target.value) }))} /></Field>
                <Field label="相似度阈值"><input type="number" step="0.01" className={inputCls} value={activeScenarioDraft.similarityThreshold} onChange={e => updateScenarioDraft(prev => ({ ...prev, similarityThreshold: Number(e.target.value) }))} /></Field>
                <Field label="敏感场景回退"><input className={inputCls} value={activeScenarioDraft.sensitiveCaseFallback} onChange={e => updateScenarioDraft(prev => ({ ...prev, sensitiveCaseFallback: e.target.value }))} /></Field>
                <Field label="低置信度回退"><input className={inputCls} value={activeScenarioDraft.lowConfidenceFallback} onChange={e => updateScenarioDraft(prev => ({ ...prev, lowConfidenceFallback: e.target.value }))} /></Field>
                <Field label="无命中回退"><input className={inputCls} value={activeScenarioDraft.noMatchFallback} onChange={e => updateScenarioDraft(prev => ({ ...prev, noMatchFallback: e.target.value }))} /></Field>
                <Field label="输出预算"><input type="number" className={inputCls} value={activeScenarioDraft.maxOutputTokens} onChange={e => updateScenarioDraft(prev => ({ ...prev, maxOutputTokens: Number(e.target.value) }))} /></Field>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 max-[1000px]:grid-cols-1">
                <Toggle label="AI 允许建议" on={activeScenarioDraft.aiSuggestAllowed} onClick={() => updateScenarioDraft(prev => ({ ...prev, aiSuggestAllowed: !prev.aiSuggestAllowed }))} />
                <Toggle label="人工可发送" on={activeScenarioDraft.humanSendAllowed} onClick={() => updateScenarioDraft(prev => ({ ...prev, humanSendAllowed: !prev.humanSendAllowed }))} />
                <Toggle label="强制人工复核" on={activeScenarioDraft.manualReviewRequired} onClick={() => updateScenarioDraft(prev => ({ ...prev, manualReviewRequired: !prev.manualReviewRequired }))} />
                <Toggle label="启用 Query Rewrite" on={activeScenarioDraft.queryRewriteEnabled} onClick={() => updateScenarioDraft(prev => ({ ...prev, queryRewriteEnabled: !prev.queryRewriteEnabled }))} />
                <Toggle label="启用重排序" on={activeScenarioDraft.rerankerEnabled} onClick={() => updateScenarioDraft(prev => ({ ...prev, rerankerEnabled: !prev.rerankerEnabled }))} />
                <Toggle label="必须引用" on={activeScenarioDraft.citationRequired} onClick={() => updateScenarioDraft(prev => ({ ...prev, citationRequired: !prev.citationRequired }))} />
              </div>
              <Field label="禁止承诺列表">
                <textarea className={`${inputCls} h-28 py-2 resize-none`} value={activeScenarioDraft.blockedClaims.join('\n')} onChange={e => updateScenarioDraft(prev => ({ ...prev, blockedClaims: e.target.value.split('\n').map(item => item.trim()).filter(Boolean) }))} />
              </Field>
            </SectionCard>
          </div>
        </div>
      ) : null}

      {activeTab === 'nodes' && activeNodeDraft ? (
        <div className="grid grid-cols-[340px_minmax(0,1fr)] gap-4 max-[1200px]:grid-cols-1">
          <SectionCard title="能力节点列表">
            <div className="space-y-2">
              {effectiveNodePolicies.map(item => (
                <div
                  key={item.nodeConfigId}
                  className={`border rounded-[14px] p-3 cursor-pointer ${selectedNodeId === item.nodeConfigId ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)]' : 'border-[var(--color-border-light)]'}`}
                  onClick={() => setSelectedNodeId(item.nodeConfigId)}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <Badge variant={item.enabled ? 'green' : 'gray'}>{item.enabled ? '启用' : '停用'}</Badge>
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">{item.effectiveModel}</div>
                  <div className="flex gap-1 flex-wrap mt-2">
                    <Badge variant={item.effectiveSource === 'scenario' ? 'blue' : 'yellow'}>{item.effectiveSource === 'scenario' ? '继承场景' : '节点覆盖'}</Badge>
                    <Badge variant={item.humanConfirmationRequired ? 'red' : 'green'}>{item.humanConfirmationRequired ? '需人工确认' : '自动流转'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-[var(--color-text-secondary)]">最近更新：{activeNodeDraft.updatedAt || '未记录'}</div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (selectedNode) setNodeDraft(selectedNode);
                    setNodeDirty(false);
                  }}
                >
                  恢复当前版本
                </Button>
                <Button size="sm" disabled={!nodeDirty} onClick={() => { void onUpdatePipelineNodeConfig(activeNodeDraft); setNodeDirty(false); }}>
                  保存节点配置
                </Button>
              </div>
            </div>

            <SectionCard title="节点运行配置">
              <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
                <Field label="节点名称"><input className={inputCls} value={activeNodeDraft.name} onChange={e => updateNodeDraft(prev => ({ ...prev, name: e.target.value }))} /></Field>
                <Field label="使用模型"><input className={inputCls} value={activeNodeDraft.primaryModel ?? ''} onChange={e => updateNodeDraft(prev => ({ ...prev, primaryModel: e.target.value || undefined }))} /></Field>
                <Field label="备用模型"><input className={inputCls} value={activeNodeDraft.fallbackModel ?? ''} onChange={e => updateNodeDraft(prev => ({ ...prev, fallbackModel: e.target.value || undefined }))} /></Field>
                <Field label="输入字段来源"><input className={inputCls} value={activeNodeDraft.inputSource} onChange={e => updateNodeDraft(prev => ({ ...prev, inputSource: e.target.value }))} /></Field>
                <Field label="输出结构"><input className={inputCls} value={activeNodeDraft.outputSchema} onChange={e => updateNodeDraft(prev => ({ ...prev, outputSchema: e.target.value }))} /></Field>
                <Field label="超时 ms"><input type="number" className={inputCls} value={activeNodeDraft.timeoutMs} onChange={e => updateNodeDraft(prev => ({ ...prev, timeoutMs: Number(e.target.value) }))} /></Field>
                <Field label="重试次数"><input type="number" className={inputCls} value={activeNodeDraft.retryCount} onChange={e => updateNodeDraft(prev => ({ ...prev, retryCount: Number(e.target.value) }))} /></Field>
                <Field label="失败回退"><input className={inputCls} value={activeNodeDraft.fallbackStrategy} onChange={e => updateNodeDraft(prev => ({ ...prev, fallbackStrategy: e.target.value }))} /></Field>
                <Field label="适用场景"><textarea className={`${inputCls} h-24 py-2 resize-none`} value={activeNodeDraft.allowedScenarios.join('\n')} onChange={e => updateNodeDraft(prev => ({ ...prev, allowedScenarios: e.target.value.split('\n').map(item => item.trim()).filter(Boolean) }))} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 max-[1000px]:grid-cols-1">
                <Toggle label="节点启用" on={activeNodeDraft.enabled} onClick={() => updateNodeDraft(prev => ({ ...prev, enabled: !prev.enabled }))} />
                <Toggle label="默认继承场景配置" on={activeNodeDraft.inheritFromScenario} onClick={() => updateNodeDraft(prev => ({ ...prev, inheritFromScenario: !prev.inheritFromScenario }))} />
                <Toggle label="要求引用" on={activeNodeDraft.citationRequired} onClick={() => updateNodeDraft(prev => ({ ...prev, citationRequired: !prev.citationRequired }))} />
                <Toggle label="要求人工确认" on={activeNodeDraft.humanConfirmationRequired} onClick={() => updateNodeDraft(prev => ({ ...prev, humanConfirmationRequired: !prev.humanConfirmationRequired }))} />
              </div>
            </SectionCard>

            <SectionCard title="运维阶段快照">
              <div className="space-y-2">
                {aiOpsStages.slice(0, 4).map(stage => (
                  <div key={stage.id} className="border border-[var(--color-border-light)] rounded-[12px] p-3 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="font-medium">{stage.stage}</div>
                      <Badge variant={stage.status === 'healthy' ? 'green' : stage.status === 'watch' ? 'yellow' : 'red'}>{stage.status === 'healthy' ? '健康' : stage.status === 'watch' ? '观察' : '风险'}</Badge>
                    </div>
                    <div className="text-[var(--color-text-secondary)]">{stage.detail}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      ) : null}
    </div>
  );
}
