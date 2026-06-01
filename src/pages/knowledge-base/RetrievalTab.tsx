import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/PageChrome';
import type { RagTestRun } from '../../types/knowledge';
import { displayLanguage, displayRiskLevel, displayScenario } from '../../utils/display';

interface RetrievalTabProps {
  latestRetrievalRuns: RagTestRun[];
  showAllRetrievalRuns: boolean;
  retrievalExpandedRunId: string | null;
  onExpandedRunChange: (id: string | null) => void;
  onShowAllRetrievalRunsChange: (updater: (prev: boolean) => boolean) => void;
  onNavigateToRagTestLab: () => void;
}

export function RetrievalTab({
  latestRetrievalRuns,
  showAllRetrievalRuns,
  retrievalExpandedRunId,
  onExpandedRunChange,
  onShowAllRetrievalRunsChange,
  onNavigateToRagTestLab,
}: RetrievalTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">召回测试</div>
      </div>
      {latestRetrievalRuns.length > 0 ? (showAllRetrievalRuns ? latestRetrievalRuns : latestRetrievalRuns.slice(0, 3)).map(run => {
        const expanded = retrievalExpandedRunId === run.id;
        return (
          <div key={run.id} className="rounded-[18px] border border-[var(--color-border)] bg-white p-5">
            <button type="button" className="w-full text-left" onClick={() => onExpandedRunChange(expanded ? null : run.id)}>
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{run.customerQuestion}</div>
                <Badge variant={run.guardrailCheck.result === 'passed' ? 'green' : 'yellow'}>{run.guardrailCheck.result === 'passed' ? '护栏通过' : '需复核'}</Badge>
              </div>
              <div className="mt-2 text-xs text-[var(--color-text-secondary)]">{displayScenario(run.scenario)} · {displayLanguage(run.language)} · {run.createdAt}</div>
              <div className="grid grid-cols-3 gap-3 mt-4 max-[1000px]:grid-cols-1">
                <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2 text-xs">召回片段：<span className="font-semibold text-[var(--color-text)]">{run.retrievedChunks.length}</span></div>
                <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2 text-xs">引用覆盖率：<span className="font-semibold text-[var(--color-text)]">{run.guardrailCheck.citationCoverage}%</span></div>
                <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2 text-xs">风险等级：<span className="font-semibold text-[var(--color-text)]">{run.guardrailCheck.riskLevel}</span></div>
              </div>
            </button>

            {expanded ? (
              <div className="mt-4 pt-4 border-t border-[var(--color-border-light)] space-y-4">
                <div>
                  <div className="text-sm font-semibold mb-2">检索片段详情</div>
                  <div className="space-y-2">
                    {run.retrievedChunks.map(chunk => (
                      <div key={chunk.id} className="rounded-[14px] border border-[var(--color-border-light)] bg-[var(--color-bg)] p-3 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="font-medium">{chunk.source}</div>
                          <Badge variant={chunk.selected ? 'green' : 'gray'}>分数 {chunk.score} · 重排序 {chunk.rerankScore}</Badge>
                        </div>
                        <div className="text-[var(--color-text-secondary)] leading-5">{chunk.snippet}</div>
                        {chunk.rejectReason ? <div className="mt-1 text-[11px] text-[var(--color-warning)]">{chunk.rejectReason}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2">AI 草稿</div>
                  <div className="rounded-[14px] border border-[var(--color-border-light)] bg-[var(--color-bg)] p-3 text-xs whitespace-pre-wrap leading-6">{run.aiDraftReply}</div>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2">护栏检查详情</div>
                  <div className="grid grid-cols-3 gap-3 mb-3 max-[900px]:grid-cols-2">
                    <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2 text-xs"><span className="text-[var(--color-text-light)]">置信度</span><div className="font-semibold">{run.guardrailCheck.confidence}%</div></div>
                    <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2 text-xs"><span className="text-[var(--color-text-light)]">引用覆盖率</span><div className="font-semibold">{run.guardrailCheck.citationCoverage}%</div></div>
                    <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2 text-xs"><span className="text-[var(--color-text-light)]">风险等级</span><div className="font-semibold">{displayRiskLevel(run.guardrailCheck.riskLevel)}</div></div>
                  </div>
                  <div className="rounded-[14px] border border-[var(--color-border-light)] bg-[var(--color-bg)] p-3 text-xs">
                    <Badge variant={run.guardrailCheck.result === 'passed' ? 'green' : 'red'}>{run.guardrailCheck.result === 'passed' ? '通过' : '需复核'}</Badge>
                    <ul className="list-disc pl-4 mt-2 space-y-1 text-[var(--color-text-secondary)]">
                      {run.guardrailCheck.notes.map(note => <li key={note}>{note}</li>)}
                    </ul>
                    {run.guardrailCheck.trace ? (
                      <div className="mt-2 pt-2 border-t border-[var(--color-border-light)] text-[var(--color-text-light)]">
                        策略来源：{run.guardrailCheck.trace.scenarioStrategyName} · 命中 {run.guardrailCheck.trace.matchedNodeIds.length} 个节点
                      </div>
                    ) : null}
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => onExpandedRunChange(null)}>收起详情</Button>
              </div>
            ) : null}
          </div>
        );
      }) : (
        <EmptyState title="暂无召回测试" description="还没有与当前知识库直接相关的召回测试记录。" compact action={<Button size="sm" variant="secondary" onClick={onNavigateToRagTestLab}>前往 RAG 调试台</Button>} />
      )}
      {latestRetrievalRuns.length > 3 ? (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => onShowAllRetrievalRunsChange(prev => !prev)}>
            {showAllRetrievalRuns ? '收起' : `查看更多（共 ${latestRetrievalRuns.length} 条）`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
