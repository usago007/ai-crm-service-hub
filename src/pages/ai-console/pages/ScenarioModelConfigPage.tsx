import { useState } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Drawer } from '../../../components/common/Drawer';
import { PanelCard } from '../../../components/common/PageChrome';
import { Toggle } from '../../../components/common/Toggle';
import { useBeforeUnload } from '../../../shared/hooks/useBeforeUnload';
import type { AIConsoleProps } from '../types';
import { Field, SectionCard, StatCard } from '../shared';
import { inputCls } from '../sharedUtils';
import { displayScenario } from '../../../utils/display';
import type { PipelineNodeModelConfig, ScenarioSettingsTab, ScenarioModelConfig } from '../../../types';
import { GitBranch, Settings2 } from 'lucide-react';

type Props = Pick<
  AIConsoleProps,
  | 'scenarioModelConfigs' | 'effectiveScenarioPolicies' | 'routingSummary'
  | 'pipelineNodeConfigs' | 'effectiveNodePolicies'
  | 'onUpdateScenarioModelConfig' | 'onUpdatePipelineNodeConfig'
> & { activeTab: ScenarioSettingsTab; onTabChange: (tab: ScenarioSettingsTab) => void };

export function ScenarioModelConfigPage({
  scenarioModelConfigs, effectiveScenarioPolicies, routingSummary,
  pipelineNodeConfigs, effectiveNodePolicies,
  activeTab, onTabChange, onUpdateScenarioModelConfig, onUpdatePipelineNodeConfig,
}: Props) {
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarioModelConfigs[0]?.id ?? '');
  const [scenarioDraft, setScenarioDraft] = useState<ScenarioModelConfig | undefined>(scenarioModelConfigs[0]);
  const [scenarioDirty, setScenarioDirty] = useState(false);
  const selectedScenario = scenarioModelConfigs.find(i => i.id === selectedScenarioId) ?? scenarioModelConfigs[0];
  const activeScenarioDraft = scenarioDirty ? scenarioDraft : selectedScenario;

  const [selectedNodeId, setSelectedNodeId] = useState(pipelineNodeConfigs[0]?.id ?? '');
  const [nodeDraft, setNodeDraft] = useState<PipelineNodeModelConfig | undefined>(pipelineNodeConfigs[0]);
  const [nodeDirty, setNodeDirty] = useState(false);
  const selectedNode = pipelineNodeConfigs.find(i => i.id === selectedNodeId) ?? pipelineNodeConfigs[0];
  const activeNodeDraft = nodeDirty ? nodeDraft : selectedNode;

  const [editingScenario, setEditingScenario] = useState(false);
  const [editingNode, setEditingNode] = useState(false);

  useBeforeUnload(scenarioDirty || nodeDirty);

  function updateScenarioDraft(recipe: (cur: ScenarioModelConfig) => ScenarioModelConfig) {
    setScenarioDraft(prev => recipe(prev ?? selectedScenario ?? scenarioModelConfigs[0]));
    setScenarioDirty(true);
  }
  function updateNodeDraft(recipe: (cur: PipelineNodeModelConfig) => PipelineNodeModelConfig) {
    setNodeDraft(prev => recipe(prev ?? selectedNode ?? pipelineNodeConfigs[0]));
    setNodeDirty(true);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFC_100%)] p-6">
        <div className="text-[20px] font-semibold tracking-[-0.02em]">AI 场景策略</div>
        <div className="text-sm text-[var(--color-text-secondary)] mt-1 leading-6">
          为每个业务场景定义独立的模型、检索参数、安全边界和 Prompt 模板。未设置的字段将继承「全局 RAG 配置」的默认值。
        </div>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {([
            ['scenario', '场景策略', Settings2],
            ['nodes', '能力节点', GitBranch],
          ] as const).map(([key, label, Icon]) => (
            <Button key={key} variant={activeTab === key ? 'primary' : 'secondary'} size="sm"
              onClick={() => onTabChange(key)}>
              <Icon size={14} />{label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 max-[1200px]:grid-cols-2">
        {activeTab === 'scenario' ? (
          <>
            <StatCard label="场景总数" value={String(routingSummary.activeScenarioCount)} detail="" />
            <StatCard label="强制复核" value={String(routingSummary.manualReviewScenarioCount)} detail="" tone="yellow" />
            <StatCard label="已启用备用模型" value={String(routingSummary.fallbackEnabledScenarioCount)} detail="" />
            <StatCard label="有节点覆盖" value={String(routingSummary.overriddenNodeCount)} detail="" />
          </>
        ) : (
          <>
            <StatCard label="节点总数" value={String(effectiveNodePolicies.length)} detail="" />
            <StatCard label="独立覆盖" value={String(effectiveNodePolicies.filter(i => i.effectiveSource === 'node').length)} detail="" />
            <StatCard label="继承场景" value={String(effectiveNodePolicies.filter(i => i.effectiveSource === 'scenario').length)} detail="" />
            <StatCard label="已停用" value={String(effectiveNodePolicies.filter(i => !i.enabled).length)} detail="" tone="yellow" />
          </>
        )}
      </div>

      {/* Scenario Tab */}
      {activeTab === 'scenario' && (
        <>
          <PanelCard title="场景策略列表" description="按业务场景统一管理模型、检索、安全与 Prompt 配置。点击行或操作按钮在抽屉中编辑。" className="overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full border-collapse min-w-[1100px]">
                <thead>
                  <tr>
                    {['场景', '策略名称', '主模型', '备用模型', 'AI 建议', '人工发送', '强制复核', '节点覆盖', '操作'].map(header => (
                      <th key={header} className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {effectiveScenarioPolicies.map(item => (
                    <tr
                      key={item.scenarioConfigId}
                      className={`cursor-pointer border-b border-[var(--color-border-light)] ${selectedScenarioId === item.scenarioConfigId ? 'bg-[var(--color-primary-bg)]' : 'hover:bg-[rgba(255,255,255,0.42)]'}`}
                      onClick={() => {
                        const config = scenarioModelConfigs.find(c => c.id === item.scenarioConfigId);
                        if (config) { setSelectedScenarioId(item.scenarioConfigId); setScenarioDraft(config); setScenarioDirty(false); setEditingScenario(true); }
                      }}
                    >
                      <td className="px-4 py-3 text-[13px]">
                        <button type="button" className="font-semibold text-left hover:text-[var(--color-primary)]" onClick={e => { e.stopPropagation(); const config = scenarioModelConfigs.find(c => c.id === item.scenarioConfigId); if (config) { setSelectedScenarioId(item.scenarioConfigId); setScenarioDraft(config); setScenarioDirty(false); setEditingScenario(true); } }}>
                          {displayScenario(item.scenario)}
                        </button>
                        <div className="text-[11px] text-[var(--color-text-light)] mt-1">{item.retrievalSummary}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{item.strategyName}</td>
                      <td className="px-4 py-3 text-xs">{item.primaryModel}</td>
                      <td className="px-4 py-3 text-xs">{item.fallbackModel}</td>
                      <td className="px-4 py-3 text-xs"><Badge variant={item.aiSuggestAllowed ? 'blue' : 'gray'}>{item.aiSuggestAllowed ? '允许' : '关闭'}</Badge></td>
                      <td className="px-4 py-3 text-xs"><Badge variant={item.humanSendAllowed ? 'green' : 'gray'}>{item.humanSendAllowed ? '允许' : '禁止'}</Badge></td>
                      <td className="px-4 py-3 text-xs"><Badge variant={item.manualReviewRequired ? 'red' : 'green'}>{item.manualReviewRequired ? '是' : '否'}</Badge></td>
                      <td className="px-4 py-3 text-xs">{item.activeNodeOverrideCount > 0 ? <Badge variant="yellow">{item.activeNodeOverrideCount} 个</Badge> : '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); const config = scenarioModelConfigs.find(c => c.id === item.scenarioConfigId); if (config) { setSelectedScenarioId(item.scenarioConfigId); setScenarioDraft(config); setScenarioDirty(false); setEditingScenario(true); } }}>
                          编辑
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelCard>

          <Drawer
            open={editingScenario}
            onClose={() => setEditingScenario(false)}
            width="560px"
            title={`编辑场景：${activeScenarioDraft ? displayScenario(activeScenarioDraft.scenario) : ''}`}
            actions={
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => { if (selectedScenario) { setScenarioDraft(selectedScenario); setScenarioDirty(false); } }}>恢复</Button>
                <Button variant="secondary" size="sm" onClick={() => { const blob = new Blob([JSON.stringify(activeScenarioDraft, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `scenario-${activeScenarioDraft!.scenario}.json`; a.click(); URL.revokeObjectURL(url); }}>导出</Button>
                <Button variant="secondary" size="sm" onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'; inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (re) => { try { const p = JSON.parse(re.target?.result as string); if (p?.scenario && p?.primaryModel) { setScenarioDraft(p); setScenarioDirty(true); } } catch {} }; r.readAsText(f); }; inp.click(); }}>导入</Button>
                <Button size="sm" disabled={!scenarioDirty} onClick={() => { void onUpdateScenarioModelConfig(activeScenarioDraft!); setScenarioDirty(false); setEditingScenario(false); }}>保存</Button>
              </div>
            }
          >
            {activeScenarioDraft ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <span>更新于 {activeScenarioDraft.updatedAt || '未记录'}</span>
                  {scenarioDirty && <Badge variant="yellow">有未保存的更改</Badge>}
                </div>

                <SectionCard title="模型与参数">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="策略名称"><input className={inputCls} value={activeScenarioDraft.name} onChange={e => updateScenarioDraft(p => ({ ...p, name: e.target.value }))} /></Field>
                    <Field label="版本"><input className={inputCls} value={activeScenarioDraft.version} onChange={e => updateScenarioDraft(p => ({ ...p, version: e.target.value }))} /></Field>
                    <Field label="模型通道"><input className={inputCls} value={activeScenarioDraft.modelChannel} onChange={e => updateScenarioDraft(p => ({ ...p, modelChannel: e.target.value }))} /></Field>
                    <Field label="主模型"><input className={inputCls} value={activeScenarioDraft.primaryModel} onChange={e => updateScenarioDraft(p => ({ ...p, primaryModel: e.target.value }))} /></Field>
                    <Field label="备用模型"><input className={inputCls} value={activeScenarioDraft.fallbackModel} onChange={e => updateScenarioDraft(p => ({ ...p, fallbackModel: e.target.value }))} /></Field>
                    <Field label="Temperature"><input type="number" min="0" max="2" step="0.05" className={inputCls} value={activeScenarioDraft.temperature} onChange={e => updateScenarioDraft(p => ({ ...p, temperature: Number(e.target.value) }))} /></Field>
                    <Field label="输出预算 (tokens)"><input type="number" min="50" max="8000" className={inputCls} value={activeScenarioDraft.maxOutputTokens} onChange={e => updateScenarioDraft(p => ({ ...p, maxOutputTokens: Number(e.target.value) }))} /></Field>
                  </div>
                </SectionCard>

                <SectionCard title="检索策略">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Top K"><input type="number" min="1" max="20" className={inputCls} value={activeScenarioDraft.topK} onChange={e => updateScenarioDraft(p => ({ ...p, topK: Number(e.target.value) }))} /></Field>
                    <Field label="相似度阈值"><input type="number" min="0.1" max="1.0" step="0.01" className={inputCls} value={activeScenarioDraft.similarityThreshold} onChange={e => updateScenarioDraft(p => ({ ...p, similarityThreshold: Number(e.target.value) }))} /></Field>
                  </div>
                  <div className="grid grid-cols-1 gap-2 mt-3">
                    <Toggle label="启用 Query Rewrite" on={activeScenarioDraft.queryRewriteEnabled} onClick={() => updateScenarioDraft(p => ({ ...p, queryRewriteEnabled: !p.queryRewriteEnabled }))} />
                    <Toggle label="启用重排序 (Reranker)" on={activeScenarioDraft.rerankerEnabled} onClick={() => updateScenarioDraft(p => ({ ...p, rerankerEnabled: !p.rerankerEnabled }))} />
                    <Toggle label="回复必须引用知识来源" on={activeScenarioDraft.citationRequired} onClick={() => updateScenarioDraft(p => ({ ...p, citationRequired: !p.citationRequired }))} />
                  </div>
                </SectionCard>

                <SectionCard title="治理与安全">
                  <div className="grid grid-cols-1 gap-2 mb-3">
                    <Toggle label="AI 可生成建议" on={activeScenarioDraft.aiSuggestAllowed} onClick={() => updateScenarioDraft(p => ({ ...p, aiSuggestAllowed: !p.aiSuggestAllowed }))} />
                    <Toggle label="人工可发送回复" on={activeScenarioDraft.humanSendAllowed} onClick={() => updateScenarioDraft(p => ({ ...p, humanSendAllowed: !p.humanSendAllowed }))} />
                    <Toggle label="强制人工复核" on={activeScenarioDraft.manualReviewRequired} onClick={() => updateScenarioDraft(p => ({ ...p, manualReviewRequired: !p.manualReviewRequired }))} />
                  </div>
                  <Field label="禁止声明（每行一条）">
                    <textarea className={`${inputCls} h-24 py-2 resize-none`} value={activeScenarioDraft.blockedClaims.join('\n')}
                      onChange={e => updateScenarioDraft(p => ({ ...p, blockedClaims: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }))}
                      placeholder="AI 不能做出的承诺或声明..." />
                  </Field>
                </SectionCard>

                <SectionCard title="Prompt 模板">
                  <div className="text-xs text-[var(--color-text-secondary)] mb-3">
                    为该场景定义专属的 System Prompt。留空则使用全局默认模板。支持变量：{'{customer}'} {'{order}'} {'{knowledge}'} {'{conversation}'}
                  </div>
                  <textarea
                    className={`${inputCls} h-44 py-3 resize-none font-mono text-xs`}
                    value={activeScenarioDraft.systemPrompt ?? ''}
                    onChange={e => updateScenarioDraft(p => ({ ...p, systemPrompt: e.target.value || undefined }))}
                    placeholder={activeScenarioDraft.systemPrompt === undefined ? '（使用全局默认 Prompt 模板）' : ''} />
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {['{customer}', '{order}', '{knowledge}', '{conversation}'].map(v => (
                      <Button key={v} variant="ghost" size="sm" onClick={() => updateScenarioDraft(p => ({ ...p, systemPrompt: (p.systemPrompt ?? '') + ` ${v} ` }))}>{v}</Button>
                    ))}
                  </div>
                </SectionCard>
              </div>
            ) : null}
          </Drawer>
        </>
      )}

      {/* Nodes Tab */}
      {activeTab === 'nodes' && (
        <>
          <PanelCard title="能力节点列表" description="管理 AI 流水线中各能力节点的配置、模型指派与生效范围。点击行或操作按钮在抽屉中编辑。" className="overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full border-collapse min-w-[900px]">
                <thead>
                  <tr>
                    {['节点名称', '状态', '使用模型', '配置来源', '需人工确认', '适用场景', '操作'].map(header => (
                      <th key={header} className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {effectiveNodePolicies.map(item => (
                    <tr
                      key={item.nodeConfigId}
                      className={`cursor-pointer border-b border-[var(--color-border-light)] ${selectedNodeId === item.nodeConfigId ? 'bg-[var(--color-primary-bg)]' : 'hover:bg-[rgba(255,255,255,0.42)]'}`}
                      onClick={() => {
                        const config = pipelineNodeConfigs.find(c => c.id === item.nodeConfigId);
                        if (config) { setSelectedNodeId(item.nodeConfigId); setNodeDraft(config); setNodeDirty(false); setEditingNode(true); }
                      }}
                    >
                      <td className="px-4 py-3 text-[13px]">
                        <button type="button" className="font-semibold text-left hover:text-[var(--color-primary)]" onClick={e => { e.stopPropagation(); const config = pipelineNodeConfigs.find(c => c.id === item.nodeConfigId); if (config) { setSelectedNodeId(item.nodeConfigId); setNodeDraft(config); setNodeDirty(false); setEditingNode(true); } }}>
                          {item.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs"><Badge variant={item.enabled ? 'green' : 'gray'}>{item.enabled ? '启用' : '停用'}</Badge></td>
                      <td className="px-4 py-3 text-xs">{item.effectiveModel}</td>
                      <td className="px-4 py-3 text-xs"><Badge variant={item.effectiveSource === 'scenario' ? 'blue' : 'yellow'}>{item.effectiveSource === 'scenario' ? '场景继承' : '节点覆盖'}</Badge></td>
                      <td className="px-4 py-3 text-xs"><Badge variant={item.humanConfirmationRequired ? 'red' : 'green'}>{item.humanConfirmationRequired ? '是' : '否'}</Badge></td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)] max-w-[180px] truncate" title={item.appliesToScenarios.join('、')}>{item.appliesToScenarios.slice(0, 3).join('、')}{item.appliesToScenarios.length > 3 ? ' ...' : ''}</td>
                      <td className="px-4 py-3 text-xs">
                        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); const config = pipelineNodeConfigs.find(c => c.id === item.nodeConfigId); if (config) { setSelectedNodeId(item.nodeConfigId); setNodeDraft(config); setNodeDirty(false); setEditingNode(true); } }}>
                          编辑
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelCard>

          <Drawer
            open={editingNode}
            onClose={() => setEditingNode(false)}
            width="560px"
            title={`编辑节点：${activeNodeDraft?.name ?? ''}`}
            actions={
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => { if (selectedNode) { setNodeDraft(selectedNode); setNodeDirty(false); } }}>恢复</Button>
                <Button size="sm" disabled={!nodeDirty} onClick={() => { void onUpdatePipelineNodeConfig(activeNodeDraft!); setNodeDirty(false); setEditingNode(false); }}>保存</Button>
              </div>
            }
          >
            {activeNodeDraft ? (
              <div className="space-y-4">
                <div className="text-xs text-[var(--color-text-secondary)]">更新于 {activeNodeDraft.updatedAt || '未记录'}</div>

                <SectionCard title="节点配置">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="名称"><input className={inputCls} value={activeNodeDraft.name} onChange={e => updateNodeDraft(p => ({ ...p, name: e.target.value }))} /></Field>
                    <Field label="使用模型"><input className={inputCls} value={activeNodeDraft.primaryModel ?? ''} onChange={e => updateNodeDraft(p => ({ ...p, primaryModel: e.target.value || undefined }))} /></Field>
                    <Field label="备用模型"><input className={inputCls} value={activeNodeDraft.fallbackModel ?? ''} onChange={e => updateNodeDraft(p => ({ ...p, fallbackModel: e.target.value || undefined }))} /></Field>
                    <Field label="输入字段"><input className={inputCls} value={activeNodeDraft.inputSource} onChange={e => updateNodeDraft(p => ({ ...p, inputSource: e.target.value }))} /></Field>
                    <Field label="输出结构"><input className={inputCls} value={activeNodeDraft.outputSchema} onChange={e => updateNodeDraft(p => ({ ...p, outputSchema: e.target.value }))} /></Field>
                    <Field label="超时 (ms)"><input type="number" min="100" max="30000" className={inputCls} value={activeNodeDraft.timeoutMs} onChange={e => updateNodeDraft(p => ({ ...p, timeoutMs: Number(e.target.value) }))} /></Field>
                    <Field label="重试次数"><input type="number" min="0" max="10" className={inputCls} value={activeNodeDraft.retryCount} onChange={e => updateNodeDraft(p => ({ ...p, retryCount: Number(e.target.value) }))} /></Field>
                    <Field label="失败策略"><input className={inputCls} value={activeNodeDraft.fallbackStrategy} onChange={e => updateNodeDraft(p => ({ ...p, fallbackStrategy: e.target.value }))} /></Field>
                    <Field label="适用场景"><textarea className={`${inputCls} h-24 py-2 resize-none`} value={activeNodeDraft.allowedScenarios.join('\n')} onChange={e => updateNodeDraft(p => ({ ...p, allowedScenarios: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }))} /></Field>
                  </div>
                  <div className="grid grid-cols-1 gap-2 mt-3">
                    <Toggle label="启用此节点" on={activeNodeDraft.enabled} onClick={() => updateNodeDraft(p => ({ ...p, enabled: !p.enabled }))} />
                    <Toggle label="继承场景配置" on={activeNodeDraft.inheritFromScenario} onClick={() => updateNodeDraft(p => ({ ...p, inheritFromScenario: !p.inheritFromScenario }))} />
                    <Toggle label="要求引用来源" on={activeNodeDraft.citationRequired} onClick={() => updateNodeDraft(p => ({ ...p, citationRequired: !p.citationRequired }))} />
                    <Toggle label="需要人工确认" on={activeNodeDraft.humanConfirmationRequired} onClick={() => updateNodeDraft(p => ({ ...p, humanConfirmationRequired: !p.humanConfirmationRequired }))} />
                  </div>
                </SectionCard>
              </div>
            ) : null}
          </Drawer>
        </>
      )}
    </div>
  );
}
