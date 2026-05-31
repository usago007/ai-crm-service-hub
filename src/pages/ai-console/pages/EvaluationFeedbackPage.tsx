import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { EmptyState, FilterBar } from '../../../components/common/PageChrome';
import type { AIConsoleProps } from '../types';
import { DataTable, PageHeader, SectionCard, StatCard } from '../shared';
import { inputCls } from '../sharedUtils';
import { displayAuditEvent, displayEvalConclusion, displayFeedbackStatus, displayRiskLevel, displayScenario } from '../../../utils/display';
import type { EvaluationCenterTab, EvaluationRecord, FeedbackLoopRecord } from '../../../types';
import { Pagination } from '../../../components/common/Pagination';

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
  const [localEvaluations, setLocalEvaluations] = useState(() => {
    try { const saved = JSON.parse(sessionStorage.getItem('saved-evaluations') || '[]'); return [...evaluations, ...saved]; } catch { return evaluations; }
  });
  const [localFeedbackLoop, setLocalFeedbackLoop] = useState(feedbackLoop);
  const [showNewEval, setShowNewEval] = useState(false);
  const [showNewFeedback, setShowNewFeedback] = useState(false);
  const [newEval, setNewEval] = useState({ target: '', refId: '', scenario: '', metric: '', score: '', issue: '', suggestion: '', conclusion: 'pass' as const });
  const [newFeedback, setNewFeedback] = useState({ source: '', refId: '', scenario: '', issueType: '', severity: 'medium' as const, description: '', action: '', createTodo: true });

  useEffect(() => { setLocalEvaluations(evaluations); }, [evaluations]);
  useEffect(() => { setLocalFeedbackLoop(feedbackLoop); }, [feedbackLoop]);

  const [auditSearch, setAuditSearch] = useState('');
  const [auditRiskFilter, setAuditRiskFilter] = useState('all');
  const [auditEventTypeFilter, setAuditEventTypeFilter] = useState('all');
  const [auditActorFilter, setAuditActorFilter] = useState('all');
  const [auditPage, setAuditPage] = useState(1);

  function resetAuditFilters() {
    setAuditSearch('');
    setAuditRiskFilter('all');
    setAuditEventTypeFilter('all');
    setAuditActorFilter('all');
  }

  function handleAuditFilterChange(setter: (value: string) => void, value: string) {
    setter(value);
    setAuditPage(1);
  }

  const riskCount = localEvaluations.filter(item => item.conclusion === 'high_risk').length;
  const shippedCount = localFeedbackLoop.filter(item => item.status === 'shipped').length;
  const highRiskCount = auditLogs.filter(item => item.riskLevel === 'High').length;
  const blockedCount = auditLogs.filter(item => item.outcome.includes('拦截') || item.outcome.toLowerCase().includes('blocked')).length;

  const auditUniqueEventTypes = useMemo(() => {
    return Array.from(new Set(auditLogs.map(item => item.eventType)));
  }, [auditLogs]);

  const auditUniqueActors = useMemo(() => {
    return Array.from(new Set(auditLogs.map(item => item.actor)));
  }, [auditLogs]);

  const filteredAuditLogs = useMemo(() => {
    let result = auditLogs;

    if (auditSearch.trim()) {
      const q = auditSearch.trim().toLowerCase();
      result = result.filter(item =>
        item.ticketId.toLowerCase().includes(q) ||
        displayAuditEvent(item.eventType).toLowerCase().includes(q) ||
        item.actor.toLowerCase().includes(q) ||
        item.outcome.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q)
      );
    }

    if (auditRiskFilter !== 'all') {
      result = result.filter(item => item.riskLevel === auditRiskFilter);
    }

    if (auditEventTypeFilter !== 'all') {
      result = result.filter(item => item.eventType === auditEventTypeFilter);
    }

    if (auditActorFilter !== 'all') {
      result = result.filter(item => item.actor === auditActorFilter);
    }

    return result;
  }, [auditLogs, auditSearch, auditRiskFilter, auditEventTypeFilter, auditActorFilter]);

  const AUDIT_PAGE_SIZE = 10;
  const auditTotalPages = Math.max(1, Math.ceil(filteredAuditLogs.length / AUDIT_PAGE_SIZE));
  const auditSafePage = Math.min(auditPage, auditTotalPages);
  const pagedAuditLogs = filteredAuditLogs.slice(
    (auditSafePage - 1) * AUDIT_PAGE_SIZE,
    auditSafePage * AUDIT_PAGE_SIZE,
  );

  const riskRanking = useMemo(() => {
    const grouped = new Map<string, { evals: EvaluationRecord[]; fbCount: number }>();
    for (const e of localEvaluations) {
      const g = grouped.get(e.scenario) || { evals: [], fbCount: 0 };
      g.evals.push(e);
      grouped.set(e.scenario, g);
    }
    for (const fb of localFeedbackLoop) {
      const g = grouped.get(fb.scenario);
      if (g) g.fbCount += 1;
    }
    const rows = Array.from(grouped.entries()).map(([scenario, g]) => {
      const total = g.evals.length;
      const avgScore = total > 0 ? g.evals.reduce((sum, e) => sum + parseFloat(e.score), 0) / total : 0;
      const highRiskCount = g.evals.filter(e => e.conclusion === 'high_risk').length;
      const optimizeCount = g.evals.filter(e => e.conclusion === 'optimize').length;
      const worstConclusion: EvaluationRecord['conclusion'] = highRiskCount > 0 ? 'high_risk' : optimizeCount > 0 ? 'optimize' : 'pass';
      const topMetric = g.evals.reduce((acc, e) => { acc[e.metric] = (acc[e.metric] || 0) + 1; return acc; }, {} as Record<string, number>);
      const mainIssue = Object.entries(topMetric).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '--';
      return { scenario, mainIssue, sampleCount: total, avgScore, worstConclusion, fbCount: g.fbCount };
    });
    const order = { high_risk: 0, optimize: 1, pass: 2 };
    return rows.sort((a, b) => (order[a.worstConclusion] ?? 2) - (order[b.worstConclusion] ?? 2)).slice(0, 8);
  }, [localEvaluations, localFeedbackLoop]);

  const [showAllFeedback, setShowAllFeedback] = useState(false);
  const visibleFeedback = showAllFeedback ? localFeedbackLoop : localFeedbackLoop.slice(0, 4);

  function handleCreateEval() {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setLocalEvaluations(prev => [{
      id: `EVAL-NEW-${Date.now()}`,
      target: newEval.target,
      refId: newEval.refId,
      scenario: newEval.scenario,
      metric: newEval.metric,
      score: newEval.score,
      issue: newEval.issue,
      suggestion: newEval.suggestion,
      conclusion: newEval.conclusion as EvaluationRecord['conclusion'],
      createdAt: now,
    }, ...prev]);
    setNewEval({ target: '', refId: '', scenario: '', metric: '', score: '', issue: '', suggestion: '', conclusion: 'pass' });
    setShowNewEval(false);
  }

  function handleCreateFeedback() {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setLocalFeedbackLoop(prev => [{
      id: `FB-NEW-${Date.now()}`,
      source: newFeedback.source,
      refId: newFeedback.refId,
      scenario: newFeedback.scenario,
      issueType: newFeedback.issueType,
      severity: newFeedback.severity as FeedbackLoopRecord['severity'],
      description: newFeedback.description,
      action: newFeedback.action,
      createTodo: newFeedback.createTodo,
      owner: '你',
      status: 'new' as FeedbackLoopRecord['status'],
      updatedAt: now,
    }, ...prev]);
    setNewFeedback({ source: '', refId: '', scenario: '', issueType: '', severity: 'medium', description: '', action: '', createTodo: true });
    setShowNewFeedback(false);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI 质量监控"
        description="监控 AI 客服回复质量，追踪风险事件、人工改判、用户反馈和知识库优化结果，帮助判断哪些场景需要调整知识库、RAG 配置或客服策略。"
        actions={<><Button size="sm" onClick={() => setShowNewEval(true)}>新建评测</Button>
        <Button size="sm" variant="secondary" onClick={() => setShowNewFeedback(true)}>提交反馈</Button></>}
      />

      <div className="flex gap-2 flex-wrap">
        {([
          ['evaluation', '质量概览'],
          ['audit', '审计事件'],
        ] as const).map(([key, label]) => (
          <Button key={key} variant={activeTab === key ? 'primary' : 'secondary'} size="sm" onClick={() => onTabChange(key)}>
            {label}
          </Button>
        ))}
      </div>

      {activeTab === 'evaluation' ? (
        <>
          <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
            <StatCard label="评测样本" value={String(localEvaluations.length)} detail="" />
            <StatCard label="风险问题" value={String(riskCount)} detail="" tone="danger" />
            <StatCard label="已修复反馈" value={String(shippedCount)} detail="" tone="success" />
          </div>

          <div className="rounded-[16px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.55)] px-4 py-2.5 text-xs text-[var(--color-text-secondary)]">
            质量监控链路：客服工作台产生反馈和审计事件 → 进入质量监控形成问题清单 → 推动知识库、RAG 配置和场景策略优化。
          </div>

          <SectionCard title="风险场景排行">
            {riskRanking.length > 0 ? (
              <DataTable
                columns={[
                  { key: 'scenario', label: '场景', width: '14%' },
                  { key: 'mainIssue', label: '主要问题', width: '16%' },
                  { key: 'sampleCount', label: '评测样本数' },
                  { key: 'avgScore', label: '平均评分' },
                  { key: 'status', label: '状态', width: '10%' },
                  { key: 'fbCount', label: '待处理反馈' },
                  { key: 'suggestion', label: '建议动作', width: '18%' },
                ]}
                emptyMessage="暂无评测数据。"
              >
                {riskRanking.map(item => (
                  <tr key={item.scenario}>
                    <td className="px-4 py-3 text-[13px] border-b border-[var(--color-border-light)]">{displayScenario(item.scenario)}</td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.mainIssue}</td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] tabular-nums text-center">{item.sampleCount}</td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] tabular-nums text-center">{item.sampleCount > 0 ? item.avgScore.toFixed(1) : '--'}</td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={item.worstConclusion === 'pass' ? 'green' : item.worstConclusion === 'optimize' ? 'yellow' : 'red'}>{displayEvalConclusion(item.worstConclusion)}</Badge></td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] text-center">{item.fbCount}</td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] text-[var(--color-text-secondary)]">{item.worstConclusion === 'high_risk' ? '立即优化知识库' : item.worstConclusion === 'optimize' ? '安排评测复查' : '持续监控'}</td>
                  </tr>
                ))}
              </DataTable>
            ) : (
              <EmptyState title="暂无评测数据" description="新建评测后，风险场景排行将在此展示。" compact />
            )}
          </SectionCard>

          {businessCase.ticket ? (
            <SectionCard title="示例工单">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)] flex-wrap">
                  <span><strong>工单：</strong> {businessCase.ticket.id}</span>
                  <span className="w-px h-4 bg-[var(--color-border)]" />
                  <span><strong>场景：</strong> {displayScenario(businessCase.ticket.issueType)}</span>
                  <span className="w-px h-4 bg-[var(--color-border)]" />
                  <span><strong>风险来源：</strong> 引用覆盖率偏低</span>
                  <span className="w-px h-4 bg-[var(--color-border)]" />
                  <span><strong>后续任务：</strong> {businessCase.followUpTasks.length} 个</span>
                </div>
                <Button size="sm" variant="secondary" onClick={() => { onSelectBusinessTicket(businessCase.ticket!.id); onOpenPage('service'); }}>查看工单详情</Button>
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="示例工单">
              <EmptyState title="暂无示例工单" description="从客服工作台选择工单后，可在此查看关联的业务上下文。" compact />
            </SectionCard>
          )}

          <SectionCard title="反馈闭环">
            {localFeedbackLoop.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
                  {visibleFeedback.map(item => (
                    <div key={item.id} className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.66)] p-3.5 text-xs">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="font-medium">{item.source} · {displayScenario(item.scenario)} · {item.issueType}</div>
                        <Badge variant={item.status === 'shipped' ? 'green' : item.status === 'triaged' ? 'yellow' : 'gray'}>{displayFeedbackStatus(item.status)}</Badge>
                      </div>
                      <div className="text-[var(--color-text-secondary)] leading-5">{item.description}</div>
                      <div className="mt-2"><strong>建议动作：</strong> {item.action}</div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-[var(--color-text-light)]">{item.owner} · {item.updatedAt}{item.createTodo ? ' · 待办' : ''}</div>
                        {item.status !== 'shipped' ? (
                          <Button variant="ghost" size="sm" onClick={() => {
                            const next = item.status === 'new' ? 'triaged' as const : 'shipped' as const;
                            setLocalFeedbackLoop(prev => prev.map(f => f.id === item.id ? { ...f, status: next, updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') } : f));
                          }}>
                            {item.status === 'new' ? '→ 分诊' : '→ 落地'}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                {localFeedbackLoop.length > 4 && (
                  <div className="mt-3 text-center">
                    <Button variant="ghost" size="sm" onClick={() => setShowAllFeedback(prev => !prev)}>
                      {showAllFeedback ? '收起' : `查看更多反馈（共 ${localFeedbackLoop.length} 条）`}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState title="暂无反馈记录" compact />
            )}
          </SectionCard>
        </>
      ) : null}

      {activeTab === 'audit' ? (
        <>
          <div className="text-sm text-[var(--color-text-secondary)] leading-6">
            记录 AI 回复过程中的护栏拦截、人工改判、知识事件和动作阻止，便于追踪风险来源和责任链路。
          </div>
          <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
            <StatCard label="审计事件" value={String(auditLogs.length)} detail="" />
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
          <SectionCard title="审计事件明细">
            <div className="mb-4">
              <FilterBar>
                <input className={inputCls} value={auditSearch} onChange={e => handleAuditFilterChange(setAuditSearch, e.target.value)} placeholder="搜索工单、事件、详情" />
                <select className={inputCls} value={auditRiskFilter} onChange={e => handleAuditFilterChange(setAuditRiskFilter, e.target.value)}>
                  <option value="all">全部风险</option>
                  <option value="High">高风险</option>
                  <option value="Medium">中风险</option>
                  <option value="Low">低风险</option>
                </select>
                <select className={inputCls} value={auditEventTypeFilter} onChange={e => handleAuditFilterChange(setAuditEventTypeFilter, e.target.value)}>
                  <option value="all">全部事件</option>
                  {auditUniqueEventTypes.map(et => (
                    <option key={et} value={et}>{displayAuditEvent(et)}</option>
                  ))}
                </select>
                <select className={inputCls} value={auditActorFilter} onChange={e => handleAuditFilterChange(setAuditActorFilter, e.target.value)}>
                  <option value="all">全部执行方</option>
                  {auditUniqueActors.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <div className="filter-actions filter-span-full">
                  <Button variant="secondary" size="sm" onClick={resetAuditFilters}>重置</Button>
                </div>
              </FilterBar>
            </div>
            {filteredAuditLogs.length === 0 ? (
              auditLogs.length === 0 ? (
                <EmptyState title="还没有审计事件" compact />
              ) : (
                <EmptyState title="暂无匹配的审计事件" description="请调整搜索关键词或筛选条件" compact />
              )
            ) : (
              <>
                <DataTable
                  columns={[
                    { key: 'timestamp', label: '时间', width: '140px' },
                    { key: 'ticket', label: '工单', width: '100px' },
                    { key: 'event', label: '事件', width: '120px' },
                    { key: 'actor', label: '执行方', width: '120px' },
                    { key: 'risk', label: '风险', width: '100px' },
                    { key: 'outcome', label: '结果', width: '22%' },
                    { key: 'detail', label: '详情', width: '30%' },
                  ]}
                  emptyMessage="还没有审计事件。"
                  className="rounded-[20px]"
                >
                  {pagedAuditLogs.map(item => (
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
                <Pagination page={auditSafePage} totalPages={auditTotalPages} total={filteredAuditLogs.length} onPageChange={setAuditPage} />
              </>
            )}
          </SectionCard>
        </>
      ) : null}

      <Modal open={showNewEval} onClose={() => setShowNewEval(false)} title="新建评测" actions={<><Button size="sm" variant="secondary" onClick={() => setShowNewEval(false)}>取消</Button><Button size="sm" onClick={handleCreateEval} disabled={!newEval.target || !newEval.scenario || !newEval.metric}>保存评测</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">评测对象</div>
              <select className={inputCls} value={newEval.target} onChange={e => setNewEval(p => ({ ...p, target: e.target.value }))}>
                <option value="">选择对象</option>
                {['AI 回复', '知识库召回', '工单处理', '客服会话'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">关联编号</div>
              <input className={inputCls} value={newEval.refId} onChange={e => setNewEval(p => ({ ...p, refId: e.target.value }))} placeholder="如：TKT-001 / CHAT-023" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">评测场景</div>
              <select className={inputCls} value={newEval.scenario} onChange={e => setNewEval(p => ({ ...p, scenario: e.target.value }))}>
                <option value="">选择场景</option>
                {['物流延迟', '退款申请', '投诉', '地址修改', 'VIP 支持'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">评测指标</div>
              <select className={inputCls} value={newEval.metric} onChange={e => setNewEval(p => ({ ...p, metric: e.target.value }))}>
                <option value="">选择指标</option>
                {['回复准确性', '召回命中率', '口径一致性', '人工改写率', '引用覆盖率'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">评分</div>
            <input className={inputCls} value={newEval.score} onChange={e => setNewEval(p => ({ ...p, score: e.target.value }))} placeholder="如：92.5" />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">问题说明</div>
            <textarea className={`${inputCls} h-20 py-2 resize-none`} value={newEval.issue} onChange={e => setNewEval(p => ({ ...p, issue: e.target.value }))} placeholder="描述本次评测发现的问题" />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">处理建议</div>
            <textarea className={`${inputCls} h-16 py-2 resize-none`} value={newEval.suggestion} onChange={e => setNewEval(p => ({ ...p, suggestion: e.target.value }))} placeholder="建议如何优化知识库、RAG 配置或客服策略" />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">评测结论</div>
            <select className={inputCls} value={newEval.conclusion} onChange={e => setNewEval(p => ({ ...p, conclusion: e.target.value as typeof newEval.conclusion }))}>
              <option value="pass">通过</option>
              <option value="optimize">需优化</option>
              <option value="high_risk">高风险</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={showNewFeedback} onClose={() => setShowNewFeedback(false)} title="提交反馈" actions={<><Button size="sm" variant="secondary" onClick={() => setShowNewFeedback(false)}>取消</Button><Button size="sm" onClick={handleCreateFeedback} disabled={!newFeedback.source || !newFeedback.scenario}>提交反馈</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">来源</div>
              <select className={inputCls} value={newFeedback.source} onChange={e => setNewFeedback(p => ({ ...p, source: e.target.value }))}>
                <option value="">选择来源</option>
                {['客服工作台', '工单审核', '用户反馈', '召回测试', '人工质检'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">关联对象</div>
              <input className={inputCls} value={newFeedback.refId} onChange={e => setNewFeedback(p => ({ ...p, refId: e.target.value }))} placeholder="如：TKT-001 / CHAT-023 / 文档名称" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">场景</div>
              <select className={inputCls} value={newFeedback.scenario} onChange={e => setNewFeedback(p => ({ ...p, scenario: e.target.value }))}>
                <option value="">选择场景</option>
                {['物流延迟', '退款申请', '投诉', '地址修改', 'VIP 支持'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">问题类型</div>
              <select className={inputCls} value={newFeedback.issueType} onChange={e => setNewFeedback(p => ({ ...p, issueType: e.target.value }))}>
                <option value="">选择类型</option>
                {['知识缺失', '召回错误', '回复不准', '口径冲突', '人工改判'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">影响程度</div>
            <select className={inputCls} value={newFeedback.severity} onChange={e => setNewFeedback(p => ({ ...p, severity: e.target.value as typeof newFeedback.severity }))}>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">问题描述</div>
            <textarea className={`${inputCls} h-20 py-2 resize-none`} value={newFeedback.description} onChange={e => setNewFeedback(p => ({ ...p, description: e.target.value }))} placeholder="描述发现的 AI 质量问题" />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">建议动作</div>
            <textarea className={`${inputCls} h-16 py-2 resize-none`} value={newFeedback.action} onChange={e => setNewFeedback(p => ({ ...p, action: e.target.value }))} placeholder="建议补充知识、调整规则或进入人工处理" />
          </div>
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <span className="text-xs text-[var(--color-text-secondary)]">是否进入待办</span>
            <button
              type="button"
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${newFeedback.createTodo ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
              onClick={() => setNewFeedback(p => ({ ...p, createTodo: !p.createTodo }))}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${newFeedback.createTodo ? 'translate-x-[18px]' : 'translate-x-0'}`} />
            </button>
          </label>
        </div>
      </Modal>
    </div>
  );
}
