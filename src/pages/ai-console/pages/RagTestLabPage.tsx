import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/PageChrome';
import type { AIConsoleProps } from '../types';
import { languageOptions, scenarioOptions } from '../types';
import { Field, InfoCard, PageHeader, PromptBlock, PromptListBlock, SectionCard } from '../shared';
import { inputCls } from '../sharedUtils';
import { displayIssueType, displayLanguage, displayRiskLevel, displayScenario } from '../../../utils/display';

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

  return (
    <div className="space-y-4">
      <PageHeader title="RAG 调试台" />

      {businessCase.ticket && businessCase.customer ? (
        <SectionCard title="当前案例输入上下文">
          <div className="grid grid-cols-4 gap-3 max-[1000px]:grid-cols-2 text-xs">
            <InfoCard label="工单" value={`${businessCase.ticket.id} / ${displayIssueType(businessCase.ticket.issueType)}`} />
            <InfoCard label="客户" value={`${businessCase.customer.name} / ${businessCase.customer.country}`} />
            <InfoCard label="订单" value={businessCase.order?.id ?? '未关联订单'} />
            <InfoCard label="历史检索" value={businessCase.ragRun?.createdAt ?? '尚未沉淀'} />
          </div>
        </SectionCard>
      ) : null}

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
        <div className="mt-4">
          <Button size="sm" onClick={() => { void onRunRagTest({ ...testForm, relatedOrderId: effectiveRelatedOrderId }).then(result => setSelectedRunId(result.run.id)); }}>运行本次调试</Button>
        </div>
      </SectionCard>

      <div className="grid grid-cols-[1fr_320px] gap-4 max-[1200px]:grid-cols-1">
        <div className="space-y-4">
          <SectionCard title="策略来源">
            <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-1 text-xs">
              <InfoCard label="当前场景策略" value={`${displayScenario(activeScenarioPolicy.scenario)} / ${activeScenarioPolicy.strategyName}`} />
              <InfoCard label="检索口径" value={activeScenarioPolicy.retrievalSummary} />
              <InfoCard label="人工边界" value={activeScenarioPolicy.manualReviewRequired ? '必须人工复核' : activeScenarioPolicy.humanSendAllowed ? '人工可发送' : '仅保留建议'} />
            </div>
            <div className="mt-3 flex gap-2 flex-wrap text-xs">
              {activeNodePolicies.map(item => (
                <Badge key={item.nodeId} variant={item.effectiveSource === 'scenario' ? 'blue' : 'yellow'}>
                  {item.name} · {item.effectiveSource === 'scenario' ? '继承场景' : '节点覆盖'}
                </Badge>
              ))}
            </div>
          </SectionCard>

          {effectiveSelectedRun ? (
            <>
              <SectionCard title="检索结果">
                <div className="space-y-3">
                  {effectiveSelectedRun.retrievedChunks.map(chunk => (
                    <div key={chunk.id} className="border border-[var(--color-border-light)] rounded-[14px] p-3 text-xs">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="font-medium">{chunk.source}</div>
                        <Badge variant={chunk.selected ? 'green' : 'gray'}>分数 {chunk.score}</Badge>
                      </div>
                      <div className="text-[var(--color-text-secondary)] mb-2">{chunk.snippet}</div>
                      <div className="flex gap-1 flex-wrap mb-2">
                        {Object.entries(chunk.metadata).map(([key, value]) => <Badge key={key} variant="blue">{key}: {value}</Badge>)}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-light)]">{chunk.rejectReason ?? '命中原因：与当前问题、场景和客户上下文高度匹配。'}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Prompt 预览">
                <div className="grid grid-cols-2 gap-3 max-[1000px]:grid-cols-1">
                  <PromptBlock label="系统角色" value={effectiveSelectedRun.promptPreview.systemRole} />
                  <PromptBlock label="客户上下文" value={effectiveSelectedRun.promptPreview.customerContext} />
                  <PromptBlock label="订单上下文" value={effectiveSelectedRun.promptPreview.orderContext} />
                  <PromptBlock label="会话摘要" value={effectiveSelectedRun.promptPreview.conversationSummary} />
                  <PromptListBlock label="检索知识" values={effectiveSelectedRun.promptPreview.retrievedKnowledge} />
                  <PromptListBlock label="业务规则" values={effectiveSelectedRun.promptPreview.businessRules} />
                  <PromptListBlock label="风险政策" values={effectiveSelectedRun.promptPreview.riskPolicy} />
                  <PromptListBlock label="禁止承诺" values={effectiveSelectedRun.promptPreview.blockedClaims} />
                  <PromptBlock label="输出格式" value={effectiveSelectedRun.promptPreview.outputFormat} className="col-span-2 max-[1000px]:col-span-1" />
                </div>
              </SectionCard>

              <SectionCard title="AI 草稿与护栏检查">
                <div className="border border-[var(--color-border-light)] rounded-[14px] p-3 bg-[var(--color-bg)] text-xs whitespace-pre-wrap mb-3">{effectiveSelectedRun.aiDraftReply}</div>
                <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
                  <InfoCard label="置信度" value={`${effectiveSelectedRun.guardrailCheck.confidence}%`} />
                  <InfoCard label="引用覆盖率" value={`${effectiveSelectedRun.guardrailCheck.citationCoverage}%`} />
                  <InfoCard label="风险等级" value={displayRiskLevel(effectiveSelectedRun.guardrailCheck.riskLevel)} />
                  <InfoCard label="需要人工复核" value={effectiveSelectedRun.guardrailCheck.manualReviewRequired ? '是' : '否'} />
                  <InfoCard label="AI 权限" value={effectiveSelectedRun.guardrailCheck.aiPermission === 'suggest_only' ? '仅建议' : '已禁用'} />
                  <InfoCard label="自动发送" value="禁用" />
                </div>
                <div className="mt-3 border border-[var(--color-border-light)] rounded-[14px] p-3 text-xs">
                  <div className="font-semibold mb-2">护栏结果</div>
                  <Badge variant={effectiveSelectedRun.guardrailCheck.result === 'passed' ? 'green' : 'red'}>
                    {effectiveSelectedRun.guardrailCheck.result === 'passed' ? '通过' : '要求人工复核'}
                  </Badge>
                  <ul className="list-disc pl-4 mt-2 space-y-1 text-[var(--color-text-secondary)]">
                    {effectiveSelectedRun.guardrailCheck.notes.map(note => <li key={note}>{note}</li>)}
                  </ul>
                  {effectiveSelectedRun.guardrailCheck.trace ? (
                    <div className="mt-3 border-t border-[var(--color-border-light)] pt-3 space-y-1">
                      <div>场景策略来源：{effectiveSelectedRun.guardrailCheck.trace.scenarioStrategyName}</div>
                      <div>命中节点：{effectiveSelectedRun.guardrailCheck.trace.matchedNodeIds.join(' / ') || '无'}</div>
                      <div>禁止承诺：{effectiveSelectedRun.guardrailCheck.trace.blockedClaims.join(' / ') || '无'}</div>
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            </>
          ) : (
            <SectionCard title="运行结果">
              <EmptyState
                title="还没有本次调试结果"
                action={<Button size="sm" onClick={() => { void onRunRagTest({ ...testForm, relatedOrderId: effectiveRelatedOrderId }).then(result => setSelectedRunId(result.run.id)); }}>立即运行</Button>}
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
