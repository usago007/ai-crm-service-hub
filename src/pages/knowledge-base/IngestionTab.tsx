import { Badge } from '../../components/common/Badge';
import type { BadgeVariant } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState, FilterBar, PanelCard, StatCard } from '../../components/common/PageChrome';
import { Pagination } from '../../components/common/Pagination';
import type { IngestionDocumentRecord, KnowledgeBaseRecord, RagConfigSnapshot } from '../../types/knowledge';
import { displayLanguage, displayScenario } from '../../utils/display';
import { inputCls } from '../ai-console/sharedUtils';
import {
  getIngestionStages,
  getIngestionStageTone,
  getMoreIngestionActions,
  getPrimaryIngestionAction,
  type KnowledgeIngestionAction,
  type KnowledgeIngestionJob,
  type KnowledgeIngestionRow,
} from '../../shared/selectors/knowledgeViewModel';

interface IngestionOverview {
  exceptionCount: number;
}

interface IngestionTabProps {
  selectedKnowledgeBase: KnowledgeBaseRecord;
  ragConfig: RagConfigSnapshot;
  ingestionOverview: IngestionOverview;
  ingestionMerged: KnowledgeIngestionRow[];
  ingestionFilteredMerged: KnowledgeIngestionRow[];
  ingestionPaginatedMerged: KnowledgeIngestionRow[];
  ingestionUniqueScenarios: string[];
  ingestionUniqueLanguages: string[];
  ingestionSafePage: number;
  ingestionTotalPages: number;
  ingestionSearch: string;
  ingestionStatusFilter: string;
  ingestionScenarioFilter: string;
  ingestionLanguageFilter: string;
  openMore: string | null;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onScenarioFilterChange: (value: string) => void;
  onLanguageFilterChange: (value: string) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onOpenMoreChange: (id: string | null) => void;
  onIngestionAction: (documentId: string, action: KnowledgeIngestionAction) => void;
  getOverallStatusLabel: (doc: IngestionDocumentRecord, job?: KnowledgeIngestionJob | null) => { label: string; variant: BadgeVariant };
}

function strategyLabel(value: RagConfigSnapshot['chunking']['strategy']) {
  if (value === 'by heading') return '按标题';
  if (value === 'by paragraph') return '按段落';
  return '固定 tokens';
}

function stageDotClass(tone: ReturnType<typeof getIngestionStageTone>) {
  if (tone === 'done') return 'bg-[var(--color-success)]';
  if (tone === 'fail') return 'bg-[var(--color-danger)]';
  if (tone === 'active') return 'bg-[var(--color-primary)]';
  return 'bg-[var(--color-border)]';
}

function stageTextClass(tone: ReturnType<typeof getIngestionStageTone>) {
  if (tone === 'fail') return 'text-[var(--color-danger)] font-medium';
  if (tone === 'active') return 'text-[var(--color-text)] font-medium';
  if (tone === 'done') return 'text-[var(--color-text-secondary)]';
  return 'text-[var(--color-text-light)]';
}

export function IngestionTab({
  selectedKnowledgeBase,
  ragConfig,
  ingestionOverview,
  ingestionMerged,
  ingestionFilteredMerged,
  ingestionPaginatedMerged,
  ingestionUniqueScenarios,
  ingestionUniqueLanguages,
  ingestionSafePage,
  ingestionTotalPages,
  ingestionSearch,
  ingestionStatusFilter,
  ingestionScenarioFilter,
  ingestionLanguageFilter,
  openMore,
  onSearchChange,
  onStatusFilterChange,
  onScenarioFilterChange,
  onLanguageFilterChange,
  onResetFilters,
  onPageChange,
  onOpenMoreChange,
  onIngestionAction,
  getOverallStatusLabel,
}: IngestionTabProps) {
  const noData = ingestionMerged.length === 0;
  const filteredEmpty = !noData && ingestionFilteredMerged.length === 0;
  const activeChunking = {
    strategy: selectedKnowledgeBase.configOverrides?.chunking?.strategy ?? ragConfig.chunking.strategy,
    chunkSize: selectedKnowledgeBase.configOverrides?.chunking?.chunkSize ?? ragConfig.chunking.chunkSize,
    chunkOverlap: selectedKnowledgeBase.configOverrides?.chunking?.chunkOverlap ?? ragConfig.chunking.chunkOverlap,
  };
  const activeRetrieval = {
    topK: selectedKnowledgeBase.configOverrides?.retrieval?.topK ?? ragConfig.retrieval.topK,
    similarityThreshold: selectedKnowledgeBase.configOverrides?.retrieval?.similarityThreshold ?? ragConfig.retrieval.similarityThreshold,
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2">
        <StatCard label="文档总量" value={String(selectedKnowledgeBase.documentCount)} detail="" />
        <StatCard label="知识集合" value={String(selectedKnowledgeBase.collections.length)} detail="" tone="success" />
        <StatCard label="策略引用" value={String(selectedKnowledgeBase.referencedByScenarioIds.length)} detail={`${selectedKnowledgeBase.referenceStats.activeCount} active / ${selectedKnowledgeBase.referenceStats.draftCount} draft`} tone="warning" />
        <StatCard label="异常任务" value={String(ingestionOverview.exceptionCount)} detail="" tone="danger" />
      </div>
      <div className="flex items-center gap-6 flex-wrap text-xs text-[var(--color-text-secondary)] rounded-[18px] border border-[var(--color-border)] bg-white px-5 py-3">
        <span>
          <span className="text-[var(--color-text-light)]">分段策略：</span>
          <span className="font-medium text-[var(--color-text)]">{strategyLabel(activeChunking.strategy as RagConfigSnapshot['chunking']['strategy'])}</span>
          <span className="ml-1">· Chunk {activeChunking.chunkSize} / Overlap {activeChunking.chunkOverlap}</span>
          {selectedKnowledgeBase.configOverrides?.chunking ? <Badge variant="yellow" className="ml-1.5 !text-[10px] !px-1.5 !py-0.5">已覆盖</Badge> : null}
        </span>
        <span className="w-px h-4 bg-[var(--color-border)]" />
        <span>
          <span className="text-[var(--color-text-light)]">索引模式：</span>
          <span className="font-medium text-[var(--color-text)]">{ragConfig.retrieval.rerankerEnabled ? '高质量检索' : '标准检索'}</span>
          <span className="ml-1">· Top K {activeRetrieval.topK} / Score {activeRetrieval.similarityThreshold}</span>
          {selectedKnowledgeBase.configOverrides?.retrieval ? <Badge variant="yellow" className="ml-1.5 !text-[10px] !px-1.5 !py-0.5">已覆盖</Badge> : null}
        </span>
        <span className="w-px h-4 bg-[var(--color-border)]" />
        <span>
          <span className="text-[var(--color-text-light)]">Embedding：</span>
          <span className="font-medium text-[var(--color-text)]">{ragConfig.embedding.model}</span>
          <span className="ml-1">· {ragConfig.embedding.indexName} · {ragConfig.embedding.indexVersion}</span>
        </span>
      </div>

      <PanelCard title="文档处理记录" description="文档的接入状态、流水线阶段与操作，每行关联最近一次接入任务。" className="overflow-hidden">
        <div className="mb-4">
          <FilterBar>
            <input className={inputCls} value={ingestionSearch} onChange={event => onSearchChange(event.target.value)} placeholder="搜索文档名称" />
            <select className={inputCls} value={ingestionStatusFilter} onChange={event => onStatusFilterChange(event.target.value)}>
              <option value="all">全部状态</option>
              <option value="已发布">已发布</option>
              <option value="处理中">处理中</option>
              <option value="失败">失败</option>
              <option value="版本冲突">版本冲突</option>
              <option value="待处理">待处理</option>
            </select>
            <select className={inputCls} value={ingestionScenarioFilter} onChange={event => onScenarioFilterChange(event.target.value)}>
              <option value="all">全部场景</option>
              {ingestionUniqueScenarios.map(scenario => (
                <option key={scenario} value={scenario}>{displayScenario(scenario)}</option>
              ))}
            </select>
            <select className={inputCls} value={ingestionLanguageFilter} onChange={event => onLanguageFilterChange(event.target.value)}>
              <option value="all">全部语言</option>
              {ingestionUniqueLanguages.map(language => (
                <option key={language} value={language}>{displayLanguage(language)}</option>
              ))}
            </select>
            <div className="filter-actions filter-span-full">
              <Button variant="secondary" size="sm" onClick={onResetFilters}>重置</Button>
            </div>
          </FilterBar>
        </div>

        {noData ? (
          <div className="py-8"><EmptyState title="当前知识库还没有接入文档" compact /></div>
        ) : filteredEmpty ? (
          <div className="py-8"><EmptyState title="暂无匹配的文档处理记录" description="请调整搜索关键词或筛选条件" compact /></div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full border-collapse table-fixed">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[8%]" />
                  <col className="w-[28%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead>
                  <tr>
                    <th className="text-left px-3 py-3 text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">文档</th>
                    <th className="text-left px-2 py-3 text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">版本</th>
                    <th className="text-left px-3 py-3 text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">处理进度</th>
                    <th className="text-left px-3 py-3 text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">当前状态</th>
                    <th className="text-left px-3 py-3 text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">更新时间</th>
                    <th className="text-left px-3 py-3 text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--color-text-light)] border-b border-[var(--color-border)] whitespace-nowrap bg-[rgba(255,255,255,0.32)]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {ingestionPaginatedMerged.map(({ doc, job }) => {
                    const overallStatus = getOverallStatusLabel(doc, job ?? null);
                    const primaryAction = getPrimaryIngestionAction(overallStatus.label);
                    const moreActions = getMoreIngestionActions(overallStatus.label);
                    return (
                      <tr key={doc.id} className="border-b border-[var(--color-border-light)] hover:bg-[rgba(255,255,255,0.42)]">
                        <td className="px-3 py-3">
                          <div className="text-[13px] font-medium truncate" title={doc.documentName}>{doc.documentName}</div>
                          <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{displayScenario(doc.scenario)} · {displayLanguage(doc.language)}</div>
                        </td>
                        <td className="px-2 py-3 text-xs text-[var(--color-text-secondary)]">{doc.version}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-0.5 text-[11px]">
                            {getIngestionStages(doc).map((stage, index) => {
                              const tone = getIngestionStageTone(stage.status);
                              return (
                                <span key={stage.key} className="flex items-center gap-0.5">
                                  {index > 0 && <span className="text-[var(--color-text-light)] mx-0.5">—</span>}
                                  <span className={`inline-block w-[7px] h-[7px] rounded-full flex-shrink-0 ${stageDotClass(tone)}`} />
                                  <span className={`whitespace-nowrap ${stageTextClass(tone)}`}>{stage.label}</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <Badge variant={overallStatus.variant} className="!text-[10px] !px-1.5 !py-0.5">{overallStatus.label}</Badge>
                        </td>
                        <td className="px-3 py-3 text-xs text-[var(--color-text-secondary)] whitespace-nowrap">{job?.updatedAt ? job.updatedAt.replace('T', ' ').slice(0, 16) : '—'}</td>
                        <td className="px-3 py-3 text-xs">
                          <div className="flex items-center gap-2 flex-nowrap">
                            {primaryAction ? (
                              <button type="button" className="text-[12px] font-medium text-[var(--color-primary)] hover:underline whitespace-nowrap" onClick={() => onIngestionAction(doc.documentId, primaryAction.action)}>
                                {primaryAction.label}
                              </button>
                            ) : null}
                            <div className="relative">
                              <button
                                type="button"
                                className="text-[14px] text-[var(--color-text-light)] hover:text-[var(--color-text)] px-1 leading-none"
                                onClick={(event) => { event.stopPropagation(); onOpenMoreChange(openMore === doc.id ? null : doc.id); }}
                              >···</button>
                              {openMore === doc.id ? (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => onOpenMoreChange(null)} />
                                  <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--color-border)] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.12)] z-20 py-1 min-w-[108px]">
                                    {moreActions.map(item => (
                                      <button
                                        key={item.action}
                                        type="button"
                                        className={`w-full text-left px-3 py-1.5 text-[12px] whitespace-nowrap hover:bg-[var(--color-bg)] ${item.danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'}`}
                                        onClick={() => { onIngestionAction(doc.documentId, item.action); onOpenMoreChange(null); }}
                                      >{item.label}</button>
                                    ))}
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={ingestionSafePage}
              totalPages={ingestionTotalPages}
              total={ingestionFilteredMerged.length}
              onPageChange={onPageChange}
            />
          </>
        )}
      </PanelCard>
    </div>
  );
}
