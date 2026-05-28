import { useMemo, useState } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Toggle } from '../../../components/common/Toggle';
import { useBeforeUnload } from '../../../shared/hooks/useBeforeUnload';
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

  const [showTopology, setShowTopology] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useBeforeUnload(scenarioDirty || nodeDirty);

  const topologyNodes = useMemo(() => effectiveNodePolicies.filter(n => n.enabled || n.effectiveSource === 'node'), [effectiveNodePolicies]);

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
      <PageHeader title="AI 场景策略" />

      <div className="flex gap-2 flex-wrap">
        {([
          ['scenario', 'AI 场景策略'],
          ['nodes', '能力节点'],
        ] as const).map(([key, label]) => (
          <Button key={key} variant={!showTopology && activeTab === key ? 'primary' : 'secondary'} size="sm" onClick={() => { setShowTopology(false); onTabChange(key); }}>
            {label}
          </Button>
        ))}
        <Button variant={showTopology ? 'primary' : 'secondary'} size="sm" onClick={() => setShowTopology(prev => !prev)}>流水线拓扑</Button>
        {!showTopology ? (
          <Button variant={compareMode ? 'primary' : 'secondary'} size="sm" onClick={() => { setCompareMode(prev => !prev); setCompareIds([]); }}>
            {compareMode ? '退出对比' : '对比场景'}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-2">
        {stats.map(item => (
          <StatCard key={item.label} label={item.label} value={item.value} detail="" tone={item.tone} />
        ))}
      </div>

      {showTopology ? (
        <SectionCard title="AI 能力流水线拓扑">
          <div className="overflow-x-auto pb-2">
            <div className="flex items-start gap-0 min-w-[1100px] py-4">
              {topologyNodes.map((node, index) => (
                <div key={node.nodeId} className="flex items-start flex-shrink-0">
                  <div className={`flex flex-col items-center ${index > 0 ? 'ml-0' : ''}`}>
                    <div className={`rounded-[18px] border-2 px-4 py-3 min-w-[100px] text-center ${node.enabled ? (node.effectiveSource === 'node' ? 'border-[var(--color-warning)] bg-[rgba(234,179,8,0.06)]' : 'border-[var(--color-success)] bg-[rgba(5,150,105,0.04)]') : 'border-[var(--color-border-light)] bg-[rgba(15,23,42,0.02)] opacity-60'}`}>
                      <div className="text-xs font-semibold">{node.name}</div>
                      <div className="mt-1.5">
                        <Badge variant={node.enabled ? (node.effectiveSource === 'node' ? 'yellow' : 'green') : 'gray'}>
                          {node.enabled ? (node.effectiveSource === 'node' ? '节点覆盖' : '场景继承') : '已停用'}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-[var(--color-text-light)] mt-1.5">{node.effectiveModel}</div>
                      {node.humanConfirmationRequired ? (
                        <div className="text-[11px] text-[var(--color-warning)] mt-0.5">需人工确认</div>
                      ) : null}
                    </div>
                  </div>
                  {index < topologyNodes.length - 1 ? (
                    <div className="flex items-center mx-1 mt-6">
                      <div className="w-6 h-[2px] bg-[var(--color-border)]" />
                      <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-[var(--color-border)]" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex gap-3 text-xs text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-[4px] bg-[rgba(5,150,105,0.2)] border border-[var(--color-success)]" /><span>场景继承（启用）</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-[4px] bg-[rgba(234,179,8,0.12)] border border-[var(--color-warning)]" /><span>节点覆盖（启用）</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-[4px] bg-[rgba(15,23,42,0.02)] border border-[var(--color-border-light)]" /><span>已停用</span></div>
          </div>
        </SectionCard>
      ) : null}

      {compareMode && activeTab === 'scenario' ? (
        <SectionCard title="场景策略对比">
          <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-1 mb-3">
            {effectiveScenarioPolicies.map(item => (
              <button
                key={item.scenarioConfigId}
                type="button"
                className={`rounded-[14px] border p-3 text-left text-xs ${compareIds.includes(item.scenarioConfigId) ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)]' : 'border-[var(--color-border-light)] hover:border-[var(--color-border)]'}`}
                onClick={() => setCompareIds(prev => prev.includes(item.scenarioConfigId) ? prev.filter(id => id !== item.scenarioConfigId) : prev.length < 2 ? [...prev, item.scenarioConfigId] : [prev[1], item.scenarioConfigId])}
              >
                <div className="font-semibold">{displayScenario(item.scenario)}</div>
                <div className="text-[var(--color-text-secondary)] mt-1">{item.strategyName}</div>
              </button>
            ))}
          </div>
          {compareIds.length === 2 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left px-3 py-2 text-[var(--color-text-light)] w-[160px]">配置项</th>
                    {compareIds.map(id => {
                      const policy = effectiveScenarioPolicies.find(p => p.scenarioConfigId === id);
                      return <th key={id} className="text-left px-3 py-2 font-semibold">{policy ? displayScenario(policy.scenario) : id}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {compareRows(effectiveScenarioPolicies, compareIds).map(row => (
                    <tr key={row.label} className="border-b border-[var(--color-border-light)]">
                      <td className="px-3 py-2 text-[var(--color-text-light)]">{row.label}</td>
                      <td className="px-3 py-2">{row.left}</td>
                      <td className="px-3 py-2">{row.right}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-xs text-[var(--color-text-secondary)]">请选择 2 个场景进行对比（点击上方场景卡片选择）。</div>
          )}
        </SectionCard>
      ) : null}

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
                <Button variant="secondary" size="sm" onClick={() => { const blob = new Blob([JSON.stringify(activeScenarioDraft, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `scenario-${activeScenarioDraft.scenario}-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); }}>导出</Button>
                <Button variant="secondary" size="sm" onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'; input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (re) => { try { const parsed = JSON.parse(re.target?.result as string); if (parsed?.scenario && parsed?.primaryModel) { setScenarioDraft(parsed); setScenarioDirty(true); } } catch { /* ignore */ } }; reader.readAsText(file); }; input.click(); }}>导入</Button>
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
                <Field label="输出预算"><input type="number" min="50" max="8000" className={inputCls} value={activeScenarioDraft.maxOutputTokens} onChange={e => updateScenarioDraft(prev => ({ ...prev, maxOutputTokens: Number(e.target.value) }))} /></Field>
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

            <SectionCard title="Prompt 模板">
              <div className="text-xs text-[var(--color-text-secondary)] mb-3">定义该场景的 System Prompt 模板。未填写时使用全局默认模板。支持变量：{'{customer}'} {'{order}'} {'{knowledge}'}</div>
              <textarea
                className={`${inputCls} h-44 py-3 resize-none font-mono text-xs`}
                value={activeScenarioDraft.systemPrompt ?? ''}
                onChange={e => updateScenarioDraft(prev => ({ ...prev, systemPrompt: e.target.value || undefined }))}
                placeholder={activeScenarioDraft.systemPrompt === undefined ? '（继承全局默认模板）' : '输入 System Prompt...'}
              />
              <div className="mt-3 flex gap-2 flex-wrap">
                {['{customer}', '{order}', '{knowledge}', '{conversation}'].map(v => (
                  <Button key={v} variant="secondary" size="sm" onClick={() => updateScenarioDraft(prev => ({ ...prev, systemPrompt: (prev.systemPrompt ?? '') + ` ${v} ` }))}>{v}</Button>
                ))}
              </div>
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

function compareRows(policies: AIConsoleProps['effectiveScenarioPolicies'], ids: string[]) {
  const left = policies.find(p => p.scenarioConfigId === ids[0]);
  const right = policies.find(p => p.scenarioConfigId === ids[1]);
  if (!left || !right) return [];
  const rows: Array<{ label: string; left: string; right: string }> = [
    { label: '策略名称', left: left.strategyName, right: right.strategyName },
    { label: '主模型', left: left.primaryModel, right: right.primaryModel },
    { label: '备用模型', left: left.fallbackModel, right: right.fallbackModel },
    { label: '检索口径', left: left.retrievalSummary, right: right.retrievalSummary },
    { label: 'AI 建议', left: left.aiSuggestAllowed ? '允许' : '禁止', right: right.aiSuggestAllowed ? '允许' : '禁止' },
    { label: '人工发送', left: left.humanSendAllowed ? '允许' : '禁止', right: right.humanSendAllowed ? '允许' : '禁止' },
    { label: '强制复核', left: left.manualReviewRequired ? '是' : '否', right: right.manualReviewRequired ? '是' : '否' },
    { label: '节点覆盖数', left: String(left.activeNodeOverrideCount), right: String(right.activeNodeOverrideCount) },
    { label: '风险评级', left: left.riskTone === 'red' ? '高' : left.riskTone === 'yellow' ? '中' : '低', right: right.riskTone === 'red' ? '高' : right.riskTone === 'yellow' ? '中' : '低' },
  ];
  return rows;
}
