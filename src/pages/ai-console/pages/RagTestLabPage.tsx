import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { Toggle } from '../../../components/common/Toggle';
import { EmptyState } from '../../../components/common/PageChrome';
import type { AIConsoleProps } from '../types';
import { languageOptions, scenarioOptions } from '../types';
import { Field, InfoCard, PromptBlock, PromptListBlock, SectionCard } from '../shared';
import { inputCls } from '../sharedUtils';
import { displayIssueType, displayLanguage, displayRiskLevel, displayScenario } from '../../../utils/display';
import type { RagTestRun } from '../../../types';

type Props = Pick<AIConsoleProps, 'businessCase' | 'customers' | 'orders' | 'ragTestRuns' | 'effectiveScenarioPolicies' | 'effectiveNodePolicies' | 'onRunRagTest'>;

export function RagTestLabPage({ businessCase, customers, orders, ragTestRuns, effectiveScenarioPolicies, effectiveNodePolicies, onRunRagTest }: Props) {
  const initialCustomer = businessCase.customer ?? customers[0] ?? null;
  const initialTicket = businessCase.ticket ?? null;
  const initialOrder = businessCase.order ?? orders[0] ?? null;
  const [testForm, setTestForm] = useState({
    customerQuestion: initialTicket?.summary ?? 'Where is my order? Tracking has not updated.',
    customerId: initialCustomer?.id ?? '',
    scenario: businessCase.ragRun?.scenario ?? 'Shipping',
    language: initialCustomer?.preferredLanguage ?? 'EN',
    relatedOrderId: initialOrder?.id ?? '',
  });
  const [selectedRunId, setSelectedRunId] = useState<string | null>(ragTestRuns[0]?.id ?? null);

  // A/B comparison & feedback state
  const [abMode, setAbMode] = useState(false);
  const [abRuns, setAbRuns] = useState<{ a: RagTestRun | null; b: RagTestRun | null }>({ a: null, b: null });
  const [abParams, setAbParams] = useState({ scenario: 'Refund', topK: 8, threshold: 0.7, reranker: true });
  const [chunkFeedback, setChunkFeedback] = useState<Record<string, 'helpful' | 'not_helpful'>>({});
  const [presets, setPresets] = useState<Array<{ name: string; form: typeof testForm }>>([]);
  const [presetName, setPresetName] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    const ticket = businessCase.ticket;
    const customer = businessCase.customer;
    if (!ticket || !customer) return;
    queueMicrotask(() => {
      setTestForm({
        customerQuestion: businessCase.ragRun?.originalQuery ?? ticket.summary,
        customerId: customer.id,
        scenario: businessCase.ragRun?.scenario ?? 'Shipping',
        language: customer.preferredLanguage,
        relatedOrderId: businessCase.order?.id ?? '',
      });
      setSelectedRunId(businessCase.ragRun?.id ?? ticket.retrievalRunId ?? null);
    });
  }, [businessCase.customer, businessCase.order?.id, businessCase.ragRun, businessCase.ticket]);

  const customerOrders = useMemo(() => orders.filter(item => item.customerId === testForm.customerId), [orders, testForm.customerId]);
  const runHistory = useMemo(
    () => ragTestRuns.filter(item => item.customerId === testForm.customerId && item.scenario === testForm.scenario).slice(0, 5),
    [ragTestRuns, testForm.customerId, testForm.scenario],
  );
  const effectiveSelectedRunId = selectedRunId ?? runHistory[0]?.id ?? ragTestRuns[0]?.id ?? null;
  const effectiveSelectedRun = ragTestRuns.find(item => item.id === effectiveSelectedRunId) ?? null;
  const activeScenarioPolicy = useMemo(
    () => effectiveScenarioPolicies.find(item => item.scenario === (effectiveSelectedRun?.scenario ?? testForm.scenario)) ?? effectiveScenarioPolicies[0],
    [effectiveScenarioPolicies, effectiveSelectedRun?.scenario, testForm.scenario],
  );
  const activeNodePolicies = useMemo(
    () => effectiveNodePolicies.filter(item => item.appliesToScenarios.includes(effectiveSelectedRun?.scenario ?? testForm.scenario)),
    [effectiveNodePolicies, effectiveSelectedRun?.scenario, testForm.scenario],
  );
  const effectiveRelatedOrderId =
    customerOrders.find(item => item.id === testForm.relatedOrderId)?.id ??
    customerOrders[0]?.id ??
    '';

  async function handleRun() {
    const payload = { ...testForm, relatedOrderId: effectiveRelatedOrderId };
    if (!abMode) {
      const result = await onRunRagTest(payload);
      setSelectedRunId(result.run.id);
      return;
    }
    setAbRuns({ a: null, b: null });
    const resultA = await onRunRagTest(payload);
    const resultB = await onRunRagTest({
      ...payload,
      scenario: abParams.scenario,
      customerQuestion: payload.customerQuestion,
    });
    setAbRuns({ a: resultA.run, b: resultB.run });
    setSelectedRunId(resultA.run.id);
  }

  function savePreset() {
    if (!presetName.trim()) return;
    setPresets(prev => [...prev, { name: presetName.trim(), form: { ...testForm } }]);
    setPresetName('');
    setShowPresets(false);
  }

  function loadPreset(index: number) {
    const preset = presets[index];
    if (!preset) return;
    setTestForm({ ...preset.form });
    setShowPresets(false);
  }

  function removePreset(index: number) {
    setPresets(prev => prev.filter((_, i) => i !== index));
  }

  function exportRun(run: RagTestRun) {
    const data = {
      id: run.id,
      question: run.customerQuestion,
      scenario: run.scenario,
      language: run.language,
      guardrailResult: run.guardrailCheck.result,
      confidence: run.guardrailCheck.confidence,
      citationCoverage: run.guardrailCheck.citationCoverage,
      riskLevel: run.guardrailCheck.riskLevel,
      chunks: run.retrievedChunks.map(c => ({ source: c.source, score: c.score, selected: c.selected, snippet: c.snippet })),
      draft: run.aiDraftReply,
      createdAt: run.createdAt,
    };
    void navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  }

  function saveToEvaluation(run: RagTestRun) {
    try {
      const existing = JSON.parse(sessionStorage.getItem('saved-evaluations') || '[]');
      existing.push({
        id: `EVAL-SAVED-${Date.now()}`,
        scenario: run.scenario,
        metric: `${run.guardrailCheck.result === 'passed' ? '护栏通过' : '需复核'} | 置信度 ${run.guardrailCheck.confidence}%`,
        score: String(run.guardrailCheck.citationCoverage),
        baseline: '70',
        status: run.guardrailCheck.result === 'passed' ? 'good' : 'watch',
      });
      sessionStorage.setItem('saved-evaluations', JSON.stringify(existing));
    } catch (error) {
      console.warn('保存评估集失败', error);
    }
  }

  function copyPrompt(run: RagTestRun) {
    const prompt = [
      `System: ${run.promptPreview.systemRole}`,
      `Customer: ${run.promptPreview.customerContext}`,
      `Order: ${run.promptPreview.orderContext}`,
      `Summary: ${run.promptPreview.conversationSummary}`,
      `Knowledge:\n${run.promptPreview.retrievedKnowledge.join('\n')}`,
      `Rules:\n${run.promptPreview.businessRules.join('\n')}`,
      `Risk:\n${run.promptPreview.riskPolicy.join('\n')}`,
      `Blocked:\n${run.promptPreview.blockedClaims.join('\n')}`,
      `Format: ${run.promptPreview.outputFormat}`,
    ].join('\n\n');
    void navigator.clipboard.writeText(prompt);
  }

  function toggleChunkFeedback(chunkId: string) {
    setChunkFeedback(prev => {
      const cur = prev[chunkId];
      if (cur === 'helpful') return { ...prev, [chunkId]: 'not_helpful' };
      if (cur === 'not_helpful') {
        const rest = { ...prev };
        delete rest[chunkId];
        return rest;
      }
      return { ...prev, [chunkId]: 'helpful' };
    });
  }

  const feedbackCounts = useMemo(() => {
    const helpful = Object.values(chunkFeedback).filter(v => v === 'helpful').length;
    const unhelpful = Object.values(chunkFeedback).filter(v => v === 'not_helpful').length;
    return { helpful, unhelpful };
  }, [chunkFeedback]);

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFC_100%)] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[20px] font-semibold tracking-[-0.02em]">RAG 调试台</div>
            <div className="text-sm text-[var(--color-text-secondary)] mt-1 leading-6">
              输入客户问题，模拟完整的检索→组装→护栏检查链路。用于验证知识和策略配置是否按预期工作。
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[11px] text-[var(--color-text-light)]">历史运行 {ragTestRuns.length} 条</span>
            <Toggle label="AB 对比" on={abMode} onClick={() => setAbMode(prev => !prev)} />
            {abMode ? (
              <select className={`${inputCls} w-auto h-8 text-xs`} value={abParams.scenario} onChange={e => setAbParams(p => ({ ...p, scenario: e.target.value }))}>
                <option value="">B 栏场景...</option>
                {scenarioOptions.filter(([v]) => v !== testForm.scenario).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ) : null}
          </div>
        </div>
        {businessCase.ticket && businessCase.customer ? (
          <div className="mt-3 pt-3 border-t border-[var(--color-border-light)] grid grid-cols-4 gap-3 max-[1000px]:grid-cols-2 text-xs">
            <InfoCard label="工单" value={`${businessCase.ticket.id} / ${displayIssueType(businessCase.ticket.issueType)}`} />
            <InfoCard label="客户" value={`${businessCase.customer.name} / ${businessCase.customer.country}`} />
            <InfoCard label="订单" value={businessCase.order?.id ?? '未关联订单'} />
            <InfoCard label="历史检索" value={businessCase.ragRun?.createdAt ?? '尚未沉淀'} />
          </div>
        ) : (
          <div className="mt-3 pt-3 border-t border-[var(--color-border-light)] text-xs text-[var(--color-text-light)]">
            提示：从客服工作台选择一个工单后，此处将显示该工单的客户与订单上下文，方便快速定位调试目标。
          </div>
        )}
      </div>

      <SectionCard title="输入">
        <div className="grid grid-cols-2 gap-3 max-[1000px]:grid-cols-1">
          <Field label="客户问题">
            <textarea className={`${inputCls} h-24 py-2 resize-none`} value={testForm.customerQuestion} onChange={e => setTestForm(prev => ({ ...prev, customerQuestion: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3 max-[1000px]:grid-cols-1">
            <Field label="客户">
              <select className={inputCls} value={testForm.customerId} onChange={e => {
                const customer = customers.find(item => item.id === e.target.value);
                setTestForm(prev => ({
                  ...prev,
                  customerId: e.target.value,
                  language: customer?.preferredLanguage ?? prev.language,
                  relatedOrderId: orders.find(item => item.customerId === e.target.value)?.id ?? prev.relatedOrderId,
                }));
              }}>
                {customers.slice(0, 12).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </Field>
            <Field label="场景">
              <select className={inputCls} value={testForm.scenario} onChange={e => setTestForm(prev => ({ ...prev, scenario: e.target.value }))}>
                {scenarioOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="语言">
              <select className={inputCls} value={testForm.language} onChange={e => setTestForm(prev => ({ ...prev, language: e.target.value }))}>
                {languageOptions.map(item => <option key={item} value={item}>{displayLanguage(item)}</option>)}
              </select>
            </Field>
            <Field label="关联订单">
              {customerOrders.length > 0 ? (
                <select className={inputCls} value={effectiveRelatedOrderId} onChange={e => setTestForm(prev => ({ ...prev, relatedOrderId: e.target.value }))}>
                  {customerOrders.map(item => <option key={item.id} value={item.id}>{item.id}</option>)}
                </select>
              ) : (
                <div className="rounded-[16px] border border-dashed border-[var(--color-border-strong)] bg-[rgba(255,255,255,0.5)] px-3.5 py-3 text-xs text-[var(--color-text-secondary)]">
                  当前客户没有可关联订单，本次调试将只使用客户与问题上下文。
                </div>
              )}
            </Field>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <Button size="sm" onClick={handleRun}>{abMode ? '执行 AB 对比' : '运行调试'}</Button>
          <Button variant="secondary" size="sm" onClick={() => setTestForm({ customerQuestion: '', customerId: customers[0]?.id ?? '', scenario: 'Shipping', language: 'EN', relatedOrderId: '' })}>重置表单</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowPresets(true)}>预设配置</Button>
          <Modal open={showPresets} onClose={() => setShowPresets(false)} title="预设配置" actions={null}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input className={inputCls} value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="预设名称" autoFocus />
                <Button size="sm" variant="secondary" onClick={savePreset} disabled={!presetName.trim()}>保存</Button>
              </div>
              {presets.length > 0 ? (
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                  {presets.map((preset, index) => (
                    <div key={preset.name} className="flex items-center justify-between gap-2 rounded-[12px] border border-[var(--color-border-light)] bg-[var(--color-bg)] px-3 py-2">
                      <button type="button" className="text-xs font-medium text-left flex-1 hover:text-[var(--color-primary)]" onClick={() => loadPreset(index)}>
                        {preset.name}
                        <div className="text-[11px] text-[var(--color-text-light)] mt-0.5">{preset.form.scenario} · {preset.form.language}</div>
                      </button>
                      <button type="button" className="text-[11px] text-[var(--color-text-light)] hover:text-[var(--color-danger)]" onClick={(e) => { e.stopPropagation(); removePreset(index); }}>删除</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[var(--color-text-secondary)] py-2">还没有保存的预设，输入名称后点击保存。</div>
              )}
            </div>
          </Modal>
        </div>
      </SectionCard>

      <div className="grid grid-cols-[1fr_320px] gap-4 max-[1200px]:grid-cols-1">
        <div className="space-y-4">
          <SectionCard title="策略来源">
            <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-1 text-xs">
              <InfoCard label="当前场景策略" value={`${displayScenario(activeScenarioPolicy.scenario)} / ${activeScenarioPolicy.strategyName}`} />
              <InfoCard label="知识范围" value={activeScenarioPolicy.knowledgeSummary} />
              <InfoCard label="检索口径" value={activeScenarioPolicy.retrievalSummary} />
            </div>
            <div className="mt-3 flex gap-2 flex-wrap text-xs">
              {activeNodePolicies.map(item => (
                <Badge key={item.nodeId} variant="blue">
                  {item.name} · 节点默认
                </Badge>
              ))}
            </div>
          </SectionCard>

          {effectiveSelectedRun && !abMode ? (
            <RunResultDetail
              run={effectiveSelectedRun}
              chunkFeedback={chunkFeedback}
              onToggleFeedback={toggleChunkFeedback}
              feedbackCounts={feedbackCounts}
              onExport={exportRun}
              onCopyPrompt={copyPrompt}
              onSaveToEval={saveToEvaluation}
            />
          ) : abMode && (abRuns.a || abRuns.b) ? (
            <div className={abRuns.a && abRuns.b ? 'grid grid-cols-2 gap-4 max-[1200px]:grid-cols-1' : ''}>
              {abRuns.a ? (
                <div>
                  <div className="text-xs font-semibold text-[var(--color-primary)] mb-2 px-1">Run A（标准参数）</div>
                  <RunResultDetail run={abRuns.a} chunkFeedback={chunkFeedback} onToggleFeedback={toggleChunkFeedback} feedbackCounts={feedbackCounts} onExport={exportRun} onCopyPrompt={copyPrompt} onSaveToEval={saveToEvaluation} />
                </div>
              ) : null}
              {abRuns.b ? (
                <div>
                  <div className="text-xs font-semibold text-[var(--color-accent)] mb-2 px-1">Run B（变体参数）</div>
                  <RunResultDetail run={abRuns.b} chunkFeedback={chunkFeedback} onToggleFeedback={toggleChunkFeedback} feedbackCounts={feedbackCounts} onExport={exportRun} onCopyPrompt={copyPrompt} />
                </div>
              ) : null}
            </div>
          ) : abMode ? (
            <SectionCard title="A/B 对比结果">
              <EmptyState title="点击 A/B 对比运行执行两次检索" description="系统将使用当前参数和变体参数各运行一次，并排展示结果。" compact />
            </SectionCard>
          ) : (
            <SectionCard title="运行结果">
              <EmptyState
                title="还没有本次调试结果"
                action={<Button size="sm" onClick={handleRun}>立即运行</Button>}
                compact
              />
            </SectionCard>
          )}
        </div>

        <SectionCard title="历史运行记录">
          {runHistory.length > 0 ? (
            <div className="space-y-2">
              {runHistory.map(run => (
                <div key={run.id} className={`border rounded-[12px] p-3 text-xs cursor-pointer ${effectiveSelectedRunId === run.id ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)]' : 'border-[var(--color-border-light)]'}`} onClick={() => setSelectedRunId(run.id)}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium">{displayScenario(run.scenario)} · {run.createdAt}</div>
                    <Badge variant={run.guardrailCheck.result === 'passed' ? 'green' : 'red'}>{run.guardrailCheck.result === 'passed' ? '通过' : '复核'}</Badge>
                  </div>
                  <div className="text-[var(--color-text-secondary)] line-clamp-2">{run.customerQuestion}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无历史运行" description="当前客户和场景组合还没有保存的测试记录，先执行一次调试再回看结果。" compact />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function RunResultDetail({
  run,
  chunkFeedback,
  onToggleFeedback,
  feedbackCounts,
  onExport,
  onCopyPrompt,
  onSaveToEval,
}: {
  run: RagTestRun;
  chunkFeedback: Record<string, 'helpful' | 'not_helpful'>;
  onToggleFeedback: (chunkId: string) => void;
  feedbackCounts: { helpful: number; unhelpful: number };
  onExport: (run: RagTestRun) => void;
  onCopyPrompt: (run: RagTestRun) => void;
  onSaveToEval?: (run: RagTestRun) => void;
}) {
  return (
    <>
      <SectionCard title="检索结果">
        {(feedbackCounts.helpful > 0 || feedbackCounts.unhelpful > 0) ? (
          <div className="flex items-center gap-3 mb-3 text-xs">
            <Badge variant="green">{feedbackCounts.helpful} 个有帮助</Badge>
            <Badge variant="red">{feedbackCounts.unhelpful} 个无帮助</Badge>
          </div>
        ) : null}
        <div className="space-y-3">
          {run.retrievedChunks.map(chunk => {
            const fb = chunkFeedback[chunk.id];
            return (
              <div key={chunk.id} className="border border-[var(--color-border-light)] rounded-[14px] p-3 text-xs">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="font-medium">{chunk.source}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={chunk.selected ? 'green' : 'gray'}>分数 {chunk.score}</Badge>
                    <button
                      type="button"
                      className={`text-[11px] px-2 py-0.5 rounded-[8px] border transition-colors ${fb === 'helpful' ? 'bg-[rgba(5,150,105,0.12)] border-[var(--color-success)] text-[var(--color-success)]' : fb === 'not_helpful' ? 'bg-[rgba(239,68,68,0.10)] border-[var(--color-danger)] text-[var(--color-danger)]' : 'border-[var(--color-border-light)] text-[var(--color-text-light)] hover:border-[var(--color-border)]'}`}
                      onClick={() => onToggleFeedback(chunk.id)}
                    >
                      {fb === 'helpful' ? '有帮助' : fb === 'not_helpful' ? '无帮助' : '反馈'}
                    </button>
                  </div>
                </div>
                <div className="text-[var(--color-text-secondary)] mb-2">{chunk.snippet}</div>
                <div className="flex gap-1 flex-wrap mb-2">
                  {Object.entries(chunk.metadata).map(([key, value]) => <Badge key={key} variant="blue">{key}: {value}</Badge>)}
                </div>
                <div className="text-[11px] text-[var(--color-text-light)]">{chunk.rejectReason ?? '命中原因：与当前问题、场景和客户上下文高度匹配。'}</div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Prompt 预览">
        <div className="grid grid-cols-2 gap-3 max-[1000px]:grid-cols-1">
          <PromptBlock label="系统角色" value={run.promptPreview.systemRole} />
          <PromptBlock label="客户上下文" value={run.promptPreview.customerContext} />
          <PromptBlock label="订单上下文" value={run.promptPreview.orderContext} />
          <PromptBlock label="会话摘要" value={run.promptPreview.conversationSummary} />
          <PromptListBlock label="检索知识" values={run.promptPreview.retrievedKnowledge} />
          <PromptListBlock label="业务规则" values={run.promptPreview.businessRules} />
          <PromptListBlock label="风险政策" values={run.promptPreview.riskPolicy} />
          <PromptListBlock label="禁止承诺" values={run.promptPreview.blockedClaims} />
          <PromptBlock label="输出格式" value={run.promptPreview.outputFormat} className="col-span-2 max-[1000px]:col-span-1" />
        </div>
      </SectionCard>

      <SectionCard title="AI 草稿与护栏检查">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Button size="sm" variant="secondary" onClick={() => onExport(run)}>导出结果</Button>
          <Button size="sm" variant="secondary" onClick={() => onCopyPrompt(run)}>复制 Prompt</Button>
          {onSaveToEval ? <Button size="sm" variant="secondary" onClick={() => onSaveToEval(run)}>保存到评测集</Button> : null}
        </div>
        <div className="border border-[var(--color-border-light)] rounded-[14px] p-3 bg-[var(--color-bg)] text-xs whitespace-pre-wrap mb-3">{run.aiDraftReply}</div>
        <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
          <InfoCard label="置信度" value={`${run.guardrailCheck.confidence}%`} />
          <InfoCard label="引用覆盖率" value={`${run.guardrailCheck.citationCoverage}%`} />
          <InfoCard label="风险等级" value={displayRiskLevel(run.guardrailCheck.riskLevel)} />
          <InfoCard label="需要人工复核" value={run.guardrailCheck.manualReviewRequired ? '是' : '否'} />
          <InfoCard label="AI 权限" value={run.guardrailCheck.aiPermission === 'suggest_only' ? '仅建议' : '已禁用'} />
          <InfoCard label="自动发送" value="禁用" />
        </div>
        <div className="mt-3 border border-[var(--color-border-light)] rounded-[14px] p-3 text-xs">
          <div className="font-semibold mb-2">护栏结果</div>
          <Badge variant={run.guardrailCheck.result === 'passed' ? 'green' : 'red'}>
            {run.guardrailCheck.result === 'passed' ? '通过' : '要求人工复核'}
          </Badge>
          <ul className="list-disc pl-4 mt-2 space-y-1 text-[var(--color-text-secondary)]">
            {run.guardrailCheck.notes.map(note => <li key={note}>{note}</li>)}
          </ul>
          {run.guardrailCheck.trace ? (
            <div className="mt-3 border-t border-[var(--color-border-light)] pt-3 space-y-1">
              <div>场景策略来源：{run.guardrailCheck.trace.scenarioStrategyName}</div>
              <div>命中节点：{run.guardrailCheck.trace.matchedNodeIds.join(' / ') || '无'}</div>
              <div>禁止承诺：{run.guardrailCheck.trace.blockedClaims.join(' / ') || '无'}</div>
            </div>
          ) : null}
        </div>
      </SectionCard>
    </>
  );
}
