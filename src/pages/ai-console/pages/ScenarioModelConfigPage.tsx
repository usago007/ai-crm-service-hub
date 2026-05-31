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
import type { KnowledgeBaseRecord, PipelineNodeModelConfig, ScenarioSettingsTab, ScenarioModelConfig } from '../../../types';
import { getMissingRequiredNodeIds, getNodeLockReason, validateScenarioPolicy } from '../../../shared/lib/aiConsolePolicy';
import { GitBranch, Settings2 } from 'lucide-react';

type Props = Pick<
  AIConsoleProps,
  | 'scenarioModelConfigs' | 'effectiveScenarioPolicies' | 'routingSummary'
  | 'pipelineNodeConfigs' | 'effectiveNodePolicies' | 'knowledgeBases'
  | 'onUpdateScenarioModelConfig' | 'onUpdatePipelineNodeConfig'
> & { activeTab: ScenarioSettingsTab; onTabChange: (tab: ScenarioSettingsTab) => void };

function statusLabel(status: ScenarioModelConfig['status']) {
  if (status === 'active') return 'Active';
  if (status === 'archived') return 'Archived';
  return 'Draft';
}

function outputModeLabel(mode: ScenarioModelConfig['outputMode']) {
  if (mode === 'low_risk_auto_reply') return '低风险自动回复';
  if (mode === 'agent_suggestion') return '客服建议';
  return '待审核草稿';
}

function bindingLabel(bindings: ScenarioModelConfig['knowledgeBindings'], knowledgeBases: KnowledgeBaseRecord[]) {
  const labels = bindings.filter(binding => binding.enabled).flatMap(binding => {
    const kb = knowledgeBases.find(item => item.id === binding.knowledgeBaseId);
    return binding.collectionIds.map(collectionId => {
      const collection = kb?.collections.find(item => item.id === collectionId);
      return `${kb?.name ?? binding.knowledgeBaseId} / ${collection?.name ?? collectionId}`;
    });
  });
  return labels.length > 0 ? labels.join('；') : '未绑定知识库';
}

function ensureReviewRoute(config: ScenarioModelConfig): ScenarioModelConfig {
  return {
    ...config,
    nodeOverrides: config.nodeOverrides.map(item => item.nodeId === 'human-review-routing'
      ? { ...item, enabled: true, overrideMode: 'override', humanConfirmationRequired: true }
      : item),
  };
}

function validationIssuesForScenario(config: ScenarioModelConfig | undefined, nodeConfigs: PipelineNodeModelConfig[]) {
  if (!config) return [];
  return validateScenarioPolicy(config, nodeConfigs);
}

function nodeTypeLabel(value: PipelineNodeModelConfig['nodeType']) {
  const labels: Record<PipelineNodeModelConfig['nodeType'], string> = {
    classification: '分类',
    matching: '匹配',
    lookup: '查询',
    summary: '摘要',
    retrieval: '检索',
    policy_check: '政策检查',
    generation: '生成',
    risk_check: '风险检查',
    routing: '路由',
    task: '任务',
    feedback: '反馈',
  };
  return labels[value];
}

function formatNodeStageLabel(value: PipelineNodeModelConfig['stage']) {
  const labels: Record<PipelineNodeModelConfig['stage'], string> = {
    pre_process: '前置处理',
    context_enrichment: '上下文补全',
    knowledge_grounding: '知识 grounding',
    decision_check: '决策校验',
    response_generation: '回复生成',
    review_routing: '复核路由',
    post_process: '后处理',
  };
  return labels[value];
}

function formatExecutionModeLabel(value: PipelineNodeModelConfig['executionMode']) {
  if (value === 'llm') return 'LLM';
  if (value === 'hybrid') return 'Hybrid';
  return 'Deterministic';
}

function formatKnowledgeScopeModeLabel(value: PipelineNodeModelConfig['knowledgeScopeMode']) {
  if (value === 'strategy_bound') return '策略绑定知识范围';
  if (value === 'retrieved_context') return '检索上下文';
  if (value === 'optional_context') return '可选上下文';
  return '不使用知识库';
}

function formatNodeRuleLabel(value: PipelineNodeModelConfig['requiredWhen'][number] | PipelineNodeModelConfig['lockedWhen'][number], kind: 'required' | 'locked' = 'required') {
  if (kind === 'locked') {
    const labels: Record<PipelineNodeModelConfig['lockedWhen'][number], string> = {
      active: 'Active 状态下不可关闭',
      sensitive_scenario: '高敏场景下不可关闭',
      manual_review_required: '强制人工复核时不可关闭',
    };
    return labels[value as PipelineNodeModelConfig['lockedWhen'][number]] ?? value;
  }
  const labels: Record<PipelineNodeModelConfig['requiredWhen'][number], string> = {
    active: '策略启用时必选',
    sensitive_scenario: '高敏场景必选',
    manual_review_required: '强制人工复核时必选',
    shipping_refund_payment_recommended: '物流 / 退款 / 支付场景建议启用',
    optional: '可选',
  };
  return labels[value as PipelineNodeModelConfig['requiredWhen'][number]] ?? value;
}

function formatOverridableFieldLabel(value: string) {
  const labels: Record<string, string> = {
    model: '使用模型',
    fallbackModel: '备用模型',
    timeoutMs: '超时',
    retryTimes: '重试次数',
    failureStrategy: '失败策略',
    topK: '检索 Top K',
    similarityThreshold: '相似度阈值',
    queryRewriteEnabled: 'Query Rewrite',
    rerankerEnabled: 'Reranker',
    requireCitation: '要求引用来源',
    knowledgeCollectionScope: '知识集合范围',
    humanConfirmationRequired: '默认人工确认',
    forbiddenClaims: '禁止声明',
    promptFragment: 'Prompt 片段',
    tone: '回复语气',
    outputSchema: '输出结构',
    riskThreshold: '风险阈值',
    routeRules: '路由规则',
  };
  return labels[value] ?? value;
}

export function ScenarioModelConfigPage({
  knowledgeBases, scenarioModelConfigs, effectiveScenarioPolicies, routingSummary,
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
  const scenarioDraftIssues = validationIssuesForScenario(activeScenarioDraft, pipelineNodeConfigs);
  const scenarioHasKnowledgeBinding = Boolean(activeScenarioDraft?.knowledgeBindings.some(binding => binding.enabled && binding.knowledgeBaseId && binding.collectionIds.length > 0));
  const scenarioHasEnabledEmptyBinding = Boolean(activeScenarioDraft?.knowledgeBindings.some(binding => binding.enabled && binding.collectionIds.length === 0));
  const scenarioManualReviewMissingNodes = activeScenarioDraft?.manualReviewRequired ? getMissingRequiredNodeIds(activeScenarioDraft, pipelineNodeConfigs) : [];
  const scenarioCanSave = Boolean(
    activeScenarioDraft
      && scenarioHasKnowledgeBinding
      && !scenarioHasEnabledEmptyBinding
      && scenarioManualReviewMissingNodes.length === 0
      && (activeScenarioDraft.status !== 'active' || scenarioDraftIssues.length === 0),
  );

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
            <StatCard label="节点覆盖项" value={String(routingSummary.overriddenNodeCount)} detail="" />
          </>
        ) : (
          <>
            <StatCard label="节点总数" value={String(effectiveNodePolicies.length)} detail="" />
            <StatCard label="默认启用" value={String(effectiveNodePolicies.filter(i => i.enabled).length)} detail="" />
            <StatCard label="要求引用" value={String(effectiveNodePolicies.filter(i => i.citationRequired).length)} detail="" />
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
                    {['场景', '状态', '知识范围', '主模型', '输出方式', '强制复核', '节点编排', '校验', '操作'].map(header => (
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
                      <td className="px-4 py-3 text-xs"><Badge variant={item.status === 'active' ? 'green' : 'gray'}>{statusLabel(item.status)}</Badge></td>
                      <td className="px-4 py-3 text-xs max-w-[260px] truncate" title={bindingLabel(scenarioModelConfigs.find(c => c.id === item.scenarioConfigId)?.knowledgeBindings ?? [], knowledgeBases)}>{item.knowledgeSummary}</td>
                      <td className="px-4 py-3 text-xs">{item.primaryModel}</td>
                      <td className="px-4 py-3 text-xs">{outputModeLabel(item.outputMode)}</td>
                      <td className="px-4 py-3 text-xs"><Badge variant={item.manualReviewRequired ? 'red' : 'green'}>{item.manualReviewRequired ? '是' : '否'}</Badge></td>
                      <td className="px-4 py-3 text-xs">{item.activeNodeCount} 启用 / {item.activeNodeOverrideCount} 覆盖</td>
                      <td className="px-4 py-3 text-xs">{item.canActivate ? <Badge variant="green">完整</Badge> : <Badge variant="yellow">{item.validationIssues.length} 项</Badge>}</td>
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
                <Button variant="secondary" size="sm" onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'; inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (re) => { try { const p = JSON.parse(re.target?.result as string); if (p?.scenario && p?.primaryModel) { setScenarioDraft(p); setScenarioDirty(true); } } catch { window.alert('导入失败：文件不是有效的场景策略 JSON。'); } }; r.readAsText(f); }; inp.click(); }}>导入</Button>
                <Button size="sm" disabled={!scenarioDirty || !scenarioCanSave} onClick={() => {
                  void onUpdateScenarioModelConfig(activeScenarioDraft!).then(() => {
                    setScenarioDirty(false);
                    setEditingScenario(false);
                  }).catch(() => {});
                }}>保存</Button>
              </div>
            }
          >
            {activeScenarioDraft ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <span>更新于 {activeScenarioDraft.updatedAt || '未记录'}</span>
                  <Badge variant={activeScenarioDraft.status === 'active' ? 'green' : 'gray'}>{statusLabel(activeScenarioDraft.status)}</Badge>
                  {scenarioDirty && <Badge variant="yellow">有未保存的更改</Badge>}
                </div>
                {scenarioDraftIssues.length > 0 ? (
                  <div className="rounded-[14px] border border-[#f5d08a] bg-[#fff8e7] p-3 text-xs leading-6 text-[#7a4b00]">
                    {scenarioDraftIssues.join('；')}。缺少知识库或知识集合时不可保存；保存为 Active 时必须满足全部必选节点与治理规则。
                  </div>
                ) : null}

                <SectionCard title="状态与输出">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="策略状态">
                      <select className={inputCls} value={activeScenarioDraft.status} onChange={e => updateScenarioDraft(p => ({ ...p, status: e.target.value as ScenarioModelConfig['status'] }))}>
                        <option value="draft">Draft</option>
                        <option value="active" disabled={scenarioDraftIssues.length > 0}>Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </Field>
                    <Field label="输出方式">
                      <select className={inputCls} value={activeScenarioDraft.outputMode} onChange={e => updateScenarioDraft(p => ({ ...p, outputMode: e.target.value as ScenarioModelConfig['outputMode'] }))}>
                        <option value="draft_reply">待审核草稿</option>
                        <option value="agent_suggestion">客服建议</option>
                        <option value="low_risk_auto_reply" disabled={['Refund', 'Complaint', 'Compensation', 'Chargeback', 'Payment'].includes(activeScenarioDraft.scenario)}>低风险自动回复</option>
                      </select>
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard title="关联知识库与知识集合">
                  <div className="mb-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                    场景策略必须至少绑定一个知识库和一个知识集合。能力节点执行时，仅在当前策略选定的知识范围内检索和引用内容。
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {knowledgeBases.map(kb => {
                      const binding = activeScenarioDraft.knowledgeBindings.find(item => item.knowledgeBaseId === kb.id);
                      const enabled = Boolean(binding?.enabled);
                      return (
                        <div key={kb.id} className={`rounded-[12px] border p-3 ${enabled && binding && binding.collectionIds.length === 0 ? 'border-[#e7a11a] bg-[#fffaf0]' : 'border-[var(--color-border-light)]'}`}>
                          <Toggle
                            label={`${kb.name} · ${kb.collections.length} 个集合`}
                            on={enabled}
                            onClick={() => updateScenarioDraft(p => ({
                              ...p,
                              knowledgeBindings: p.knowledgeBindings.some(item => item.knowledgeBaseId === kb.id)
                                ? p.knowledgeBindings.map(item => item.knowledgeBaseId === kb.id ? { ...item, enabled: !item.enabled } : item)
                                : [...p.knowledgeBindings, { knowledgeBaseId: kb.id, enabled: true, collectionIds: [] }],
                            }))}
                          />
                          {enabled && binding ? (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {kb.collections.map(collection => (
                                <label key={collection.id} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                  <input
                                    type="checkbox"
                                    checked={binding.collectionIds.includes(collection.id)}
                                    onChange={e => updateScenarioDraft(p => ({
                                      ...p,
                                      knowledgeBindings: p.knowledgeBindings.map(item => item.knowledgeBaseId === kb.id
                                        ? { ...item, collectionIds: e.target.checked ? [...item.collectionIds, collection.id] : item.collectionIds.filter(id => id !== collection.id) }
                                        : item),
                                    }))}
                                  />
                                  {collection.name}
                                </label>
                              ))}
                            </div>
                          ) : null}
                          {enabled && binding && binding.collectionIds.length === 0 ? (
                            <div className="mt-2 text-xs text-[#9a5a00]">请至少选择一个知识集合。</div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>

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
                    <Toggle label="允许 AI 生成回复建议" on={activeScenarioDraft.aiSuggestAllowed} onClick={() => updateScenarioDraft(p => ({ ...p, aiSuggestAllowed: !p.aiSuggestAllowed }))} />
                    <Toggle label="允许人工确认后发送" on={activeScenarioDraft.humanSendAllowed} onClick={() => updateScenarioDraft(p => ({ ...p, humanSendAllowed: !p.humanSendAllowed }))} />
                    <Toggle label="所有输出必须人工复核" on={activeScenarioDraft.manualReviewRequired} onClick={() => updateScenarioDraft(p => {
                      const next = { ...p, manualReviewRequired: !p.manualReviewRequired };
                      return next.manualReviewRequired ? ensureReviewRoute(next) : next;
                    })} />
                  </div>
                  <div className="mb-3 grid gap-1 text-[11px] leading-5 text-[var(--color-text-secondary)]">
                    <span>允许 AI 生成回复建议：控制 AI 是否可以生成回复草稿。</span>
                    <span>允许人工确认后发送：关闭后只能作为内部建议，不进入发送流程。</span>
                    <span>所有输出必须人工复核：开启后必须启用人工复核路由节点。</span>
                  </div>
                  <Field label="禁止声明（每行一条）">
                    <textarea className={`${inputCls} h-24 py-2 resize-none`} value={activeScenarioDraft.blockedClaims.join('\n')}
                      onChange={e => updateScenarioDraft(p => ({ ...p, blockedClaims: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }))}
                      placeholder="AI 不能做出的承诺或声明..." />
                  </Field>
                </SectionCard>

                <SectionCard title="能力节点编排">
                  <div className="space-y-2">
                    {[...activeScenarioDraft.nodeOverrides].sort((a, b) => a.order - b.order).map(override => {
                      const node = pipelineNodeConfigs.find(item => item.nodeId === override.nodeId);
                      if (!node) return null;
                      const requiredReason = getNodeLockReason(activeScenarioDraft, node);
                      const required = Boolean(requiredReason);
                      const disabledControls = !override.enabled;
                      return (
                        <div key={override.nodeId} className={`rounded-[12px] border p-3 ${disabledControls ? 'border-[var(--color-border-light)] bg-[var(--color-bg)] opacity-75' : 'border-[var(--color-border-light)]'}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold">{override.order}. {node.name.replace(/配置$/, '')}</div>
                              <div className="mt-1 text-[11px] text-[var(--color-text-light)]">{node.inputSource} → {node.outputSchema}</div>
                              {requiredReason ? <div className="mt-1 text-[11px] text-[#9a5a00]">{requiredReason}</div> : null}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={override.overrideMode === 'override' ? 'yellow' : 'blue'}>{override.overrideMode === 'override' ? '覆盖' : '继承'}</Badge>
                              <Toggle label="启用" on={override.enabled} onClick={() => {
                                if (required && override.enabled) return;
                                updateScenarioDraft(p => ({ ...p, nodeOverrides: p.nodeOverrides.map(item => item.nodeId === override.nodeId ? { ...item, enabled: !item.enabled } : item) }));
                              }} />
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            <select disabled={disabledControls} className={inputCls} value={override.overrideMode} onChange={e => updateScenarioDraft(p => ({ ...p, nodeOverrides: p.nodeOverrides.map(item => item.nodeId === override.nodeId ? { ...item, overrideMode: e.target.value as ScenarioModelConfig['nodeOverrides'][number]['overrideMode'] } : item) }))}>
                              <option value="inherit">继承节点默认</option>
                              <option value="override">策略覆盖</option>
                            </select>
                            <input disabled={disabledControls} type="number" min="1" className={inputCls} value={override.order} onChange={e => updateScenarioDraft(p => ({ ...p, nodeOverrides: p.nodeOverrides.map(item => item.nodeId === override.nodeId ? { ...item, order: Number(e.target.value) } : item) }))} />
                            <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                              <input disabled={disabledControls} type="checkbox" checked={override.humanConfirmationRequired ?? node.humanConfirmationRequired} onChange={e => updateScenarioDraft(p => ({ ...p, nodeOverrides: p.nodeOverrides.map(item => item.nodeId === override.nodeId ? { ...item, overrideMode: 'override', humanConfirmationRequired: e.target.checked } : item) }))} />
                              人工确认
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
          <PanelCard title="能力节点库" description="维护系统内置固定 AI 原子能力的默认配置。具体业务知识范围和策略覆盖在场景策略中配置。" className="overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full border-collapse min-w-[1180px]">
                <thead>
                  <tr>
                    {['节点名称', '节点类型', '执行阶段', '执行方式', '默认模型', '输入 / 输出', '使用知识库', '默认人工确认', '默认适用场景', '状态', '操作'].map(header => (
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
                      <td className="px-4 py-3 text-xs">{nodeTypeLabel(item.nodeType)}</td>
                      <td className="px-4 py-3 text-xs">{formatNodeStageLabel(item.stage)}</td>
                      <td className="px-4 py-3 text-xs">{formatExecutionModeLabel(item.executionMode)}</td>
                      <td className="px-4 py-3 text-xs">{item.effectiveModel}</td>
                      <td className="px-4 py-3 text-xs max-w-[220px] truncate" title={`${item.inputSource} → ${item.outputSchema}`}>{item.inputSource} → {item.outputSchema}</td>
                      <td className="px-4 py-3 text-xs"><Badge variant={item.usesKnowledgeBase ? 'blue' : 'gray'}>{item.usesKnowledgeBase ? formatKnowledgeScopeModeLabel(item.knowledgeScopeMode) : '否'}</Badge></td>
                      <td className="px-4 py-3 text-xs"><Badge variant={item.humanConfirmationRequired ? 'red' : 'green'}>{item.humanConfirmationRequired ? '是' : '否'}</Badge></td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)] max-w-[180px] truncate" title={item.appliesToScenarios.join('、')}>{item.appliesToScenarios.slice(0, 3).join('、')}{item.appliesToScenarios.length > 3 ? ' ...' : ''}</td>
                      <td className="px-4 py-3 text-xs"><Badge variant={item.enabled ? 'green' : 'gray'}>{item.enabled ? '启用' : '停用'}</Badge></td>
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
            title={`编辑能力节点：${activeNodeDraft?.nodeName ?? activeNodeDraft?.name.replace(/配置$/, '') ?? ''}`}
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

                <SectionCard title="基础信息">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">节点 ID：{activeNodeDraft.nodeId}</div>
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">节点名称：{activeNodeDraft.nodeName}</div>
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">节点类型：{nodeTypeLabel(activeNodeDraft.nodeType)}</div>
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">执行阶段：{formatNodeStageLabel(activeNodeDraft.stage)}</div>
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">执行方式：{formatExecutionModeLabel(activeNodeDraft.executionMode)}</div>
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">默认启用：{activeNodeDraft.enabledByDefault ? '是' : '否'}</div>
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">配置名称：{activeNodeDraft.name}</div>
                  </div>
                </SectionCard>

                <SectionCard title="默认执行配置">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="使用模型"><input className={inputCls} value={activeNodeDraft.primaryModel ?? ''} onChange={e => updateNodeDraft(p => ({ ...p, primaryModel: e.target.value || undefined, defaultModel: e.target.value || undefined }))} /></Field>
                    <Field label="备用模型"><input className={inputCls} value={activeNodeDraft.fallbackModel ?? ''} onChange={e => updateNodeDraft(p => ({ ...p, fallbackModel: e.target.value || undefined }))} /></Field>
                    <Field label="超时 (ms)"><input type="number" min="100" max="30000" className={inputCls} value={activeNodeDraft.timeoutMs} onChange={e => updateNodeDraft(p => ({ ...p, timeoutMs: Number(e.target.value) }))} /></Field>
                    <Field label="重试次数"><input type="number" min="0" max="10" className={inputCls} value={activeNodeDraft.retryCount} onChange={e => updateNodeDraft(p => ({ ...p, retryCount: Number(e.target.value), retryTimes: Number(e.target.value) }))} /></Field>
                    <Field label="失败策略"><input className={inputCls} value={activeNodeDraft.fallbackStrategy} onChange={e => updateNodeDraft(p => ({ ...p, fallbackStrategy: e.target.value, failureStrategy: e.target.value }))} /></Field>
                  </div>
                  <div className="mt-3 rounded-[12px] border border-[var(--color-border-light)] bg-[var(--color-bg)] px-3 py-2 text-[11px] leading-5 text-[var(--color-text-secondary)]">
                    系统默认启用表示该节点在能力库中默认可用；具体场景是否启用、顺序和覆盖参数由场景策略编排决定。
                  </div>
                  <div className="grid grid-cols-1 gap-2 mt-3">
                    <Toggle label="系统默认启用" on={activeNodeDraft.enabled} onClick={() => updateNodeDraft(p => ({ ...p, enabled: !p.enabled, enabledByDefault: !p.enabled }))} />
                    <Toggle label="默认人工确认" on={activeNodeDraft.humanConfirmationRequired} onClick={() => updateNodeDraft(p => ({ ...p, humanConfirmationRequired: !p.humanConfirmationRequired }))} />
                  </div>
                </SectionCard>

                <SectionCard title="输入输出">
                  <div className="space-y-2 text-xs">
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">输入字段：{activeNodeDraft.inputFields.join(' / ') || '未配置'}</div>
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">输出结构：{activeNodeDraft.outputSchema}</div>
                  </div>
                </SectionCard>

                <SectionCard title="默认适用场景">
                  <div className="flex flex-wrap gap-2">
                    {(activeNodeDraft.defaultScenarioTypes.length > 0 ? activeNodeDraft.defaultScenarioTypes : activeNodeDraft.allowedScenarios).map(scenario => (
                      <Badge key={scenario} variant="blue">{scenario}</Badge>
                    ))}
                  </div>
                  <div className="mt-2 text-[11px] leading-5 text-[var(--color-text-secondary)]">
                    默认适用场景来自能力节点定义。业务侧不在此处编辑；如需修改，请通过 fixture 或系统配置层维护。
                  </div>
                </SectionCard>

                <SectionCard title="知识使用规则">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">使用知识库：{activeNodeDraft.usesKnowledgeBase ? '是' : '否'}</div>
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">知识范围模式：{activeNodeDraft.usesKnowledgeBase ? formatKnowledgeScopeModeLabel(activeNodeDraft.knowledgeScopeMode) : '不使用知识库'}</div>
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">默认人工确认：{activeNodeDraft.humanConfirmationRequired ? '是' : '否'}</div>
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">要求引用来源：{activeNodeDraft.usesKnowledgeBase ? (activeNodeDraft.requireCitation ? '是' : '否') : '否'}</div>
                  </div>
                  {activeNodeDraft.usesKnowledgeBase ? (
                    <div className="mt-3">
                      <Toggle label="要求引用来源" on={activeNodeDraft.requireCitation} onClick={() => updateNodeDraft(p => ({ ...p, citationRequired: !p.requireCitation, requireCitation: !p.requireCitation }))} />
                    </div>
                  ) : (
                    <div className="mt-3 rounded-[12px] border border-[var(--color-border-light)] bg-[var(--color-bg)] px-3 py-2 text-[11px] leading-5 text-[var(--color-text-secondary)]">
                      当前节点不使用知识库，要求引用来源固定为否；保存时系统会将引用配置归一为 false。
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="依赖与规则">
                  <div className="space-y-2 text-xs">
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">依赖节点：{activeNodeDraft.dependsOn.join(' / ') || '无'}</div>
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">必选规则：{activeNodeDraft.requiredWhen.map(rule => formatNodeRuleLabel(rule)).join(' / ')}</div>
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">锁定条件：{activeNodeDraft.lockedWhen.map(rule => formatNodeRuleLabel(rule, 'locked')).join(' / ') || '无'}</div>
                    <div className="rounded-[10px] bg-[var(--color-bg)] px-3 py-2">可覆盖字段：{activeNodeDraft.overridableFields.map(formatOverridableFieldLabel).join(' / ') || '无'}</div>
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
