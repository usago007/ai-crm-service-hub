import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { EmptyState } from '../../../components/common/PageChrome';
import type { AIConsoleProps } from '../types';
import { DataTable, SectionCard, StatCard } from '../shared';
import { inputCls } from '../sharedUtils';
import { displayAuditEvent, displayFeedbackStatus, displayRiskLevel, displayRuntimeStatus, displayScenario } from '../../../utils/display';
import type { EvaluationCenterTab, EvaluationRecord, FeedbackLoopRecord } from '../../../types';

type Props = Pick<AIConsoleProps, 'businessCase' | 'evaluations' | 'feedbackLoop' | 'auditLogs' | 'onSelectBusinessTicket' | 'onOpenPage'> & {
  activeTab: EvaluationCenterTab;
  onTabChange: (tab: EvaluationCenterTab) => void;
};

export function EvaluationFeedbackPage({
  businessCase,
  evaluations,
  feedbackLoop,
  auditLogs,
  activeTab,
  onTabChange,
  onSelectBusinessTicket,
  onOpenPage,
}: Props) {
  const [localEvaluations, setLocalEvaluations] = useState(evaluations);
  const [localFeedbackLoop, setLocalFeedbackLoop] = useState(feedbackLoop);
  const [showNewEval, setShowNewEval] = useState(false);
  const [showNewFeedback, setShowNewFeedback] = useState(false);
  const [newEval, setNewEval] = useState({ scenario: '', metric: '', score: '', baseline: '', status: 'good' as const });
  const [newFeedback, setNewFeedback] = useState({ source: '', scenario: '', signal: '', action: '' });

  useEffect(() => { setLocalEvaluations(evaluations); }, [evaluations]);
  useEffect(() => { setLocalFeedbackLoop(feedbackLoop); }, [feedbackLoop]);

  const riskCount = localEvaluations.filter(item => item.status === 'risk').length;
  const shippedCount = localFeedbackLoop.filter(item => item.status === 'shipped').length;
  const highRiskCount = auditLogs.filter(item => item.riskLevel === 'High').length;
  const blockedCount = auditLogs.filter(item => item.outcome.includes('拦截') || item.outcome.toLowerCase().includes('blocked')).length;

  const trendData = useMemo(() => {
    const grouped: Record<string, { scores: number[]; baselines: number[] }> = {};
    localEvaluations.forEach(item => {
      if (!grouped[item.scenario]) grouped[item.scenario] = { scores: [], baselines: [] };
      grouped[item.scenario].scores.push(Number(item.score));
      grouped[item.scenario].baselines.push(Number(item.baseline));
    });
    return Object.entries(grouped).map(([scenario, data]) => ({
      scenario,
      avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      avgBaseline: Math.round(data.baselines.reduce((a, b) => a + b, 0) / data.baselines.length),
    }));
  }, [localEvaluations]);

  function handleCreateEval() {
    setLocalEvaluations(prev => [{
      id: `EVAL-NEW-${Date.now()}`,
      scenario: newEval.scenario,
      metric: newEval.metric,
      score: newEval.score,
      baseline: newEval.baseline,
      status: newEval.status as EvaluationRecord['status'],
    }, ...prev]);
    setNewEval({ scenario: '', metric: '', score: '', baseline: '', status: 'good' });
    setShowNewEval(false);
  }

  function handleCreateFeedback() {
    setLocalFeedbackLoop(prev => [{
      id: `FB-NEW-${Date.now()}`,
      source: newFeedback.source,
      scenario: newFeedback.scenario,
      signal: newFeedback.signal,
      action: newFeedback.action,
      owner: '你',
      status: 'new' as FeedbackLoopRecord['status'],
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }, ...prev]);
    setNewFeedback({ source: '', scenario: '', signal: '', action: '' });
    setShowNewFeedback(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFC_100%)] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[20px] font-semibold tracking-[-0.02em]">评测与反馈</div>
            <div className="text-sm text-[var(--color-text-secondary)] mt-1 leading-6">
              追踪 AI 客服质量指标、收集反馈信号、审查配置变更审计日志。评测结果和反馈将直接影响知识库和策略优化。
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" onClick={() => setShowNewEval(true)}>新建评测</Button>
            <Button size="sm" variant="secondary" onClick={() => setShowNewFeedback(true)}>提交反馈</Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {([
          ['evaluation', '评测与反馈'],
          ['audit', '审计日志'],
        ] as const).map(([key, label]) => (
          <Button key={key} variant={activeTab === key ? 'primary' : 'secondary'} size="sm" onClick={() => onTabChange(key)}>
            {label}
          </Button>
        ))}
      </div>

      {activeTab === 'evaluation' ? (
        <>
          <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
            <StatCard label="评测项" value={String(localEvaluations.length)} detail="" />
            <StatCard label="风险项" value={String(riskCount)} detail="" tone="danger" />
            <StatCard label="已落地反馈" value={String(shippedCount)} detail="" tone="success" />
          </div>

          {trendData.length > 0 ? (
            <SectionCard title="得分趋势（按场景分组）">
              <div className="space-y-3">
                {trendData.map(item => {
                  const maxVal = Math.max(item.avgScore, item.avgBaseline, 100);
                  return (
                    <div key={item.scenario} className="flex items-center gap-3">
                      <div className="w-20 text-xs text-[var(--color-text-secondary)] shrink-0">{displayScenario(item.scenario)}</div>
                      <div className="flex-1 flex items-end gap-2 h-12">
                        <div className="flex-1 flex flex-col items-center gap-0.5">
                          <div className="text-[10px] text-[var(--color-text-light)]">{item.avgScore}</div>
                          <div className="w-full rounded-[4px] bg-[var(--color-primary)] transition-all" style={{ height: `${(item.avgScore / maxVal) * 100}%` }} />
                          <div className="text-[9px] text-[var(--color-text-light)]">得分</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-0.5">
                          <div className="text-[10px] text-[var(--color-text-light)]">{item.avgBaseline}</div>
                          <div className="w-full rounded-[4px] bg-[var(--color-text-light)] opacity-50 transition-all" style={{ height: `${(item.avgBaseline / maxVal) * 100}%` }} />
                          <div className="text-[9px] text-[var(--color-text-light)]">基线</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          ) : null}

          <div className="grid grid-cols-[1fr_0.9fr] gap-4 max-[1200px]:grid-cols-1">
            <DataTable
              columns={[
                { key: 'scenario', label: '场景', width: '26%' },
                { key: 'metric', label: '指标' },
                { key: 'score', label: '得分' },
                { key: 'baseline', label: '基线' },
                { key: 'status', label: '状态' },
              ]}
              emptyMessage="还没有评测数据。"
            >
              {localEvaluations.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-[13px] border-b border-[var(--color-border-light)]">{displayScenario(item.scenario)}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.metric}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] tabular-nums">{item.score}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] tabular-nums">{item.baseline}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={item.status === 'good' ? 'green' : item.status === 'watch' ? 'yellow' : 'red'}>{displayRuntimeStatus(item.status)}</Badge></td>
                </tr>
              ))}
            </DataTable>

            <div className="space-y-4">
              {businessCase.ticket ? (
                <SectionCard title="当前案例">
                  <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-3.5 text-xs">
                    <div><strong>工单：</strong> {businessCase.ticket.id}</div>
                    <div className="mt-1"><strong>审计事件：</strong> {businessCase.auditLogs.length} 条</div>
                    <div className="mt-1"><strong>后续任务：</strong> {businessCase.followUpTasks.length} 个</div>
                  </div>
                </SectionCard>
              ) : null}
              <SectionCard title="反馈记录">
                <div className="space-y-2">
                  {localFeedbackLoop.map(item => (
                    <div key={item.id} className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-3.5 text-xs">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="font-medium">{item.source} · {displayScenario(item.scenario)}</div>
                        <Badge variant={item.status === 'shipped' ? 'green' : item.status === 'triaged' ? 'yellow' : 'gray'}>{displayFeedbackStatus(item.status)}</Badge>
                      </div>
                      <div className="text-[var(--color-text-secondary)] leading-5">{item.signal}</div>
                      <div className="mt-2"><strong>动作：</strong> {item.action}</div>
                      <div className="mt-1 text-[11px] text-[var(--color-text-light)]">{item.owner} · {item.updatedAt}</div>
                    </div>
                  ))}
                  {localFeedbackLoop.length === 0 ? <EmptyState title="暂无反馈记录" compact /> : null}
                </div>
              </SectionCard>
            </div>
          </div>
        </>
      ) : null}

      {activeTab === 'audit' ? (
        <>
          <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
            <StatCard label="审计记录" value={String(auditLogs.length)} detail="" />
            <StatCard label="高风险事件" value={String(highRiskCount)} detail="" tone="danger" />
            <StatCard label="阻止执行" value={String(blockedCount)} detail="" tone="warning" />
          </div>
          {businessCase.ticket ? (
            <SectionCard title="当前案例审计链路">
              <div className="flex items-start justify-between gap-4 flex-wrap text-xs">
                <div className="space-y-1">
                  <div>工单 {businessCase.ticket.id} 当前已有 {businessCase.auditLogs.length} 条审计记录。</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => { onSelectBusinessTicket(businessCase.ticket!.id); onOpenPage('service'); }}>回到客服工作台</Button>
                </div>
              </div>
            </SectionCard>
          ) : null}
          <SectionCard title="事件明细">
            <DataTable
              columns={[
                { key: 'timestamp', label: '时间', width: '16%' },
                { key: 'ticket', label: '工单' },
                { key: 'event', label: '事件', width: '16%' },
                { key: 'actor', label: '执行方' },
                { key: 'risk', label: '风险' },
                { key: 'outcome', label: '结果', width: '16%' },
                { key: 'detail', label: '详情', width: '28%' },
              ]}
              emptyMessage="还没有审计日志。"
              className="rounded-[20px]"
            >
              {auditLogs.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] whitespace-nowrap">{item.timestamp}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.ticketId}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{displayAuditEvent(item.eventType)}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.actor}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={item.riskLevel === 'High' ? 'red' : item.riskLevel === 'Medium' ? 'yellow' : 'green'}>{displayRiskLevel(item.riskLevel)}</Badge></td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.outcome}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)]">{item.detail}</td>
                </tr>
              ))}
            </DataTable>
          </SectionCard>
        </>
      ) : null}

      <Modal open={showNewEval} onClose={() => setShowNewEval(false)} title="新建评测" actions={<Button size="sm" onClick={handleCreateEval} disabled={!newEval.scenario || !newEval.metric}>确认创建</Button>}>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">场景</div>
            <select className={inputCls} value={newEval.scenario} onChange={e => setNewEval(p => ({ ...p, scenario: e.target.value }))}>
              <option value="">选择场景</option>
              {['Shipping', 'Refund', 'Complaint', 'Payment', 'Product Inquiry'].map(s => <option key={s} value={s}>{displayScenario(s)}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">指标名称</div>
            <input className={inputCls} value={newEval.metric} onChange={e => setNewEval(p => ({ ...p, metric: e.target.value }))} placeholder="如：准确率、召回率" />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">得分</div>
            <input className={inputCls} value={newEval.score} onChange={e => setNewEval(p => ({ ...p, score: e.target.value }))} placeholder="如：92.5" />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">基线</div>
            <input className={inputCls} value={newEval.baseline} onChange={e => setNewEval(p => ({ ...p, baseline: e.target.value }))} placeholder="如：85.0" />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">状态</div>
            <select className={inputCls} value={newEval.status} onChange={e => setNewEval(p => ({ ...p, status: e.target.value as typeof newEval.status }))}>
              <option value="good">良好</option>
              <option value="watch">观察</option>
              <option value="risk">风险</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={showNewFeedback} onClose={() => setShowNewFeedback(false)} title="提交反馈" actions={<Button size="sm" onClick={handleCreateFeedback} disabled={!newFeedback.source || !newFeedback.scenario}>确认提交</Button>}>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">来源</div>
            <select className={inputCls} value={newFeedback.source} onChange={e => setNewFeedback(p => ({ ...p, source: e.target.value }))}>
              <option value="">选择来源</option>
              <option value="人工复核">人工复核</option>
              <option value="护栏拦截">护栏拦截</option>
              <option value="客户投诉">客户投诉</option>
              <option value="知识异常">知识异常</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">场景</div>
            <select className={inputCls} value={newFeedback.scenario} onChange={e => setNewFeedback(p => ({ ...p, scenario: e.target.value }))}>
              <option value="">选择场景</option>
              {['Shipping', 'Refund', 'Complaint', 'Payment', 'Product Inquiry'].map(s => <option key={s} value={s}>{displayScenario(s)}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">信号描述</div>
            <textarea className={`${inputCls} h-20 py-2 resize-none`} value={newFeedback.signal} onChange={e => setNewFeedback(p => ({ ...p, signal: e.target.value }))} placeholder="描述反馈信号..." />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">建议动作</div>
            <textarea className={`${inputCls} h-16 py-2 resize-none`} value={newFeedback.action} onChange={e => setNewFeedback(p => ({ ...p, action: e.target.value }))} placeholder="建议的处理方式..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
