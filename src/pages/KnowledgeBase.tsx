import { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EmptyState, FilterBar, PanelCard, StatCard, SummaryHeader } from '../components/common/PageChrome';
import type {
  IngestionDocumentRecord,
  KnowledgeBaseRecord,
  KnowledgeDetailTab,
  KnowledgeDocument,
  KnowledgeFlow,
  KnowledgeProcessingResult,
  KnowledgeWizardDraft,
  KnowledgeWizardStep,
  RagConfigSnapshot,
  RagTestRun,
} from '../types';
import { displayLanguage, displayScenario } from '../utils/display';
import { displayStageStatus, inputCls, stageVariant } from './ai-console/sharedUtils';

interface KnowledgeBaseProps {
  knowledgeBases: KnowledgeBaseRecord[];
  selectedKnowledgeBase: KnowledgeBaseRecord | null;
  knowledgeFlow: KnowledgeFlow;
  knowledgeDetailTab: KnowledgeDetailTab;
  knowledgeWizardStep: KnowledgeWizardStep;
  knowledgeWizardDraft: KnowledgeWizardDraft;
  knowledgeProcessingResult: KnowledgeProcessingResult | null;
  knowledgeDocuments: KnowledgeDocument[];
  ingestionDocuments: IngestionDocumentRecord[];
  ragConfig: RagConfigSnapshot;
  ragTestRuns: RagTestRun[];
  jobs: Array<{ id: string; documentId?: string; documentName: string; status: string; detail: string }>;
  onIngestionAction: (documentId: string, action: 'view_parsed_text' | 'view_chunks' | 'rebuild_embedding' | 'publish' | 'disable') => Promise<{ parsedText?: string; chunks?: string[]; message: string }>;
  onCreateKnowledgeBase: (name?: string) => void;
  onOpenKnowledgeBase: (id: string) => void;
  onBackToKnowledgeList: () => void;
  onKnowledgeDetailTabChange: (tab: KnowledgeDetailTab) => void;
  onStartKnowledgeImport: (knowledgeBaseId?: string) => void;
  onKnowledgeWizardDraftChange: (updater: (prev: KnowledgeWizardDraft) => KnowledgeWizardDraft) => void;
  onKnowledgeWizardStepChange: (step: KnowledgeWizardStep) => void;
  onSubmitKnowledgeImport: () => void;
  onFinishKnowledgeImport: (options?: { continueImport?: boolean; openRagTest?: boolean }) => void;
}

const SOURCE_OPTIONS = [
  { key: 'file', label: '导入已有文本', enabled: true },
  { key: 'notion', label: '同步自 Notion 内容', enabled: false },
  { key: 'web', label: '同步自 Web 站点', enabled: false },
] as const;

const SAMPLE_FILES = [
  { fileName: '2026-05-08_调研 open-slide 使用方法.md', size: '408.97 KB', scenario: 'Product Inquiry', knowledgeType: 'Product Spec', language: 'ZH' },
  { fileName: '欧区退款说明_v3.0.docx', size: '1.8 MB', scenario: 'Refund', knowledgeType: 'Policy', language: 'EN' },
  { fileName: '投诉赔偿审批清单.pdf', size: '856 KB', scenario: 'Complaint', knowledgeType: 'Business Rule', language: 'ZH' },
] as const;

function formatUpdatedAt(value: string) {
  return `更新于 ${value}`;
}

function statusLabel(status: KnowledgeBaseRecord['status']) {
  if (status === 'active') return '服务中';
  if (status === 'syncing') return '同步中';
  return '待整理';
}

function statusVariant(status: KnowledgeBaseRecord['status']) {
  if (status === 'active') return 'green';
  if (status === 'syncing') return 'blue';
  return 'gray';
}

function sourceLabel(source: KnowledgeBaseRecord['source']) {
  return source === 'service_api' ? '服务 API' : '外部知识库 API';
}

function strategyLabel(value: RagConfigSnapshot['chunking']['strategy']) {
  if (value === 'by heading') return '按标题';
  if (value === 'by paragraph') return '按段落';
  return '固定 tokens';
}

function renderKnowledgeIcon(icon: string, className = '') {
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#FFF3E7_0%,#FFE7D0_100%)] text-[13px] font-semibold tracking-[0.08em] text-[var(--color-primary)] ${className}`}>
      {icon}
    </div>
  );
}

export function KnowledgeBase({
  knowledgeBases,
  selectedKnowledgeBase,
  knowledgeFlow,
  knowledgeDetailTab,
  knowledgeWizardStep,
  knowledgeWizardDraft,
  knowledgeProcessingResult,
  knowledgeDocuments,
  ingestionDocuments,
  ragConfig,
  ragTestRuns,
  jobs,
  onIngestionAction,
  onCreateKnowledgeBase,
  onOpenKnowledgeBase,
  onBackToKnowledgeList,
  onKnowledgeDetailTabChange,
  onStartKnowledgeImport,
  onKnowledgeWizardDraftChange,
  onKnowledgeWizardStepChange,
  onSubmitKnowledgeImport,
  onFinishKnowledgeImport,
}: KnowledgeBaseProps) {
  const [sourceFilter, setSourceFilter] = useState<'all' | KnowledgeBaseRecord['source']>('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [documentSearch, setDocumentSearch] = useState('');
  const [documentTag, setDocumentTag] = useState('all');
  const [documentSort, setDocumentSort] = useState<'latest' | 'name'>('latest');
  const [ingestionModalState, setIngestionModalState] = useState<{ title: string; lines: string[] } | null>(null);
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);

  const allTags = useMemo(
    () => Array.from(new Set(knowledgeBases.flatMap(item => item.tags))),
    [knowledgeBases],
  );

  const filteredKnowledgeBases = useMemo(
    () => knowledgeBases.filter(item => {
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
      if (tagFilter !== 'all' && !item.tags.includes(tagFilter)) return false;
      if (search.trim() && !`${item.name} ${item.description} ${item.owner}`.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    }),
    [knowledgeBases, search, sourceFilter, tagFilter],
  );

  const selectedDocuments = useMemo(() => {
    if (!selectedKnowledgeBase) return [];
    const baseDocs = knowledgeDocuments.filter(item => selectedKnowledgeBase.documentIds.includes(item.id));
    const filtered = baseDocs.filter(item => {
      if (documentTag !== 'all' && item.scenario !== documentTag && item.knowledgeType !== documentTag) return false;
      if (documentSearch.trim() && !`${item.name} ${item.knowledgeType} ${item.owner}`.toLowerCase().includes(documentSearch.trim().toLowerCase())) return false;
      return true;
    });
    return filtered.sort((left, right) => {
      if (documentSort === 'name') return left.name.localeCompare(right.name);
      return right.effectiveDate.localeCompare(left.effectiveDate);
    });
  }, [documentSearch, documentSort, documentTag, knowledgeDocuments, selectedKnowledgeBase]);

  const selectedIngestionDocs = useMemo(() => {
    if (!selectedKnowledgeBase) return [];
    return ingestionDocuments.filter(item => selectedKnowledgeBase.documentIds.includes(item.documentId));
  }, [ingestionDocuments, selectedKnowledgeBase]);

  const ingestionOverview = useMemo(() => {
    const scopedJobs = selectedKnowledgeBase
      ? jobs.filter(job => selectedKnowledgeBase.documentIds.includes(job.documentId ?? ''))
      : jobs;
    const scopedDocs = selectedKnowledgeBase
      ? ingestionDocuments.filter(item => selectedKnowledgeBase.documentIds.includes(item.documentId))
      : ingestionDocuments;
    return {
      jobs: scopedJobs,
      documents: scopedDocs,
      processingCount: scopedJobs.filter(item => ['uploaded', 'parsing', 'parsed', 'indexed'].includes(item.status)).length,
      publishedCount: scopedJobs.filter(item => item.status === 'published').length,
      exceptionCount: scopedJobs.filter(item => ['chunk_failed', 'embedding_failed', 'version_conflict', 'expired'].includes(item.status)).length,
    };
  }, [ingestionDocuments, jobs, selectedKnowledgeBase]);

  const latestRetrievalRuns = useMemo(() => {
    if (!selectedKnowledgeBase) return [];
    return ragTestRuns.filter(item => selectedKnowledgeBase.tags.some(tag => item.scenario.includes(tag) || displayScenario(item.scenario) === tag)).slice(0, 3);
  }, [ragTestRuns, selectedKnowledgeBase]);

  const pipelineJobs = useMemo(() => {
    if (!selectedKnowledgeBase) return [];
    return jobs.filter(job => selectedKnowledgeBase.documentIds.some(id => job.documentName.includes(id) || selectedKnowledgeBase.documentIds.includes(job.documentId ?? ''))).slice(0, 4);
  }, [jobs, selectedKnowledgeBase]);

  const documentTags = useMemo(() => {
    if (!selectedKnowledgeBase) return [];
    return Array.from(new Set(
      knowledgeDocuments
        .filter(item => selectedKnowledgeBase.documentIds.includes(item.id))
        .flatMap(item => [item.scenario, item.knowledgeType]),
    ));
  }, [knowledgeDocuments, selectedKnowledgeBase]);
  const metadataDocumentRows = useMemo(() => selectedDocuments.map(doc => {
    const ingestion = selectedIngestionDocs.find(item => item.documentId === doc.id);
    return {
      id: doc.id,
      name: doc.name,
      owner: doc.owner,
      scenario: displayScenario(doc.scenario),
      knowledgeType: doc.knowledgeType,
      sourceType: doc.sourceType,
      language: displayLanguage(doc.language),
      version: doc.version,
      publishStatus: displayStageStatus(doc.publishStatus),
      chunkCount: doc.chunkCount,
      vectorCount: doc.vectorCount,
      effectiveDate: doc.effectiveDate,
      lastSync: ingestion?.lastSync ?? doc.effectiveDate,
    };
  }), [selectedDocuments, selectedIngestionDocs]);
  const metadataFieldGroups = useMemo(() => {
    const groups: Array<{ label: string; values: string[] }> = [
      { label: '场景', values: metadataDocumentRows.map(item => item.scenario) },
      { label: '知识类型', values: metadataDocumentRows.map(item => item.knowledgeType) },
      { label: '来源', values: metadataDocumentRows.map(item => item.sourceType) },
      { label: '语言', values: metadataDocumentRows.map(item => item.language) },
      { label: '发布状态', values: metadataDocumentRows.map(item => item.publishStatus) },
    ];

    return groups.map(group => {
      const counts = group.values.reduce<Record<string, number>>((acc, value) => {
        acc[value] = (acc[value] ?? 0) + 1;
        return acc;
      }, {});
      return {
        label: group.label,
        entries: Object.entries(counts).map(([value, count]) => ({ value, count })),
      };
    });
  }, [metadataDocumentRows]);
  const metadataSummary = useMemo(() => {
    const latestSync = metadataDocumentRows
      .map(item => item.lastSync)
      .sort((left, right) => right.localeCompare(left))
      .at(0) ?? '暂无同步记录';
    return {
      documentCount: metadataDocumentRows.length,
      scenarioCount: new Set(metadataDocumentRows.map(item => item.scenario)).size,
      knowledgeTypeCount: new Set(metadataDocumentRows.map(item => item.knowledgeType)).size,
      languageCount: new Set(metadataDocumentRows.map(item => item.language)).size,
      latestSync,
    };
  }, [metadataDocumentRows]);
  const syncingCount = knowledgeBases.filter(item => item.status === 'syncing').length;
  const activeDocCount = knowledgeBases.reduce((sum, item) => sum + item.documentCount, 0);

  function applySample(fileName: string) {
    const sample = SAMPLE_FILES.find(item => item.fileName === fileName);
    if (!sample) return;
    onKnowledgeWizardDraftChange(prev => ({
      ...prev,
      fileName: sample.fileName,
      fileSizeLabel: sample.size,
      documentName: sample.fileName,
      scenario: sample.scenario,
      knowledgeType: sample.knowledgeType,
      language: sample.language,
      sourceType: 'file',
    }));
  }

  async function handleIngestionAction(documentId: string, action: 'view_parsed_text' | 'view_chunks' | 'rebuild_embedding' | 'publish' | 'disable') {
    const result = await onIngestionAction(documentId, action);
    if (action === 'view_parsed_text' && result.parsedText) {
      setIngestionModalState({ title: '解析文本预览', lines: [result.parsedText] });
    }
    if (action === 'view_chunks' && result.chunks) {
      setIngestionModalState({ title: '切片结果预览', lines: result.chunks });
    }
  }

  function renderList() {
    return (
      <div className="space-y-5">
        <SummaryHeader
          aside={
            <div className="grid grid-cols-3 gap-3 max-[980px]:grid-cols-1">
              <StatCard label="知识库总量" value={String(knowledgeBases.length)} detail="" />
              <StatCard label="活动文档" value={String(activeDocCount)} detail="" />
              <StatCard label="同步中" value={String(syncingCount)} detail="" tone="warning" />
            </div>
          }
        />

        <FilterBar>
          <select className={inputCls} value={tagFilter} onChange={event => setTagFilter(event.target.value)}>
            <option value="all">全部标签</option>
            {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <select className={inputCls} value={sourceFilter} onChange={event => setSourceFilter(event.target.value as 'all' | KnowledgeBaseRecord['source'])}>
            <option value="all">全部来源</option>
            <option value="service_api">服务 API</option>
            <option value="external_api">外部知识库 API</option>
          </select>
          <input className={inputCls} value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索知识库、负责人或描述" />
          <div className="filter-actions">
            <Button variant="secondary" size="sm" onClick={() => { setSourceFilter('all'); setTagFilter('all'); setSearch(''); }}>重置筛选</Button>
          </div>
        </FilterBar>

        <div className="grid grid-cols-[420px_repeat(2,minmax(300px,1fr))] gap-4 max-[1380px]:grid-cols-1">
          <button
            className="group min-h-[220px] rounded-[22px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#F4F7FF_0%,#F8FAFC_100%)] text-left p-6 hover:border-[var(--color-primary)] transition-colors"
            onClick={() => onCreateKnowledgeBase()}
          >
            <div className="text-[36px] leading-none mb-8 text-[var(--color-primary)]">+</div>
            <div className="text-[15px] font-semibold">创建知识库</div>
            <div className="mt-10 pt-5 border-t border-[var(--color-border)] text-[15px] font-medium text-[var(--color-text-secondary)]">连接外部知识库</div>
          </button>

          {filteredKnowledgeBases.map(base => (
            <button
              key={base.id}
              className="min-h-[220px] rounded-[22px] border border-[var(--color-border)] bg-white text-left p-6 hover:border-[var(--color-primary)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)] transition-all"
              onClick={() => onOpenKnowledgeBase(base.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {renderKnowledgeIcon(base.icon)}
                  <div>
                    <div className="text-lg font-semibold leading-6">{base.name}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">{base.owner} · 编辑于 {base.updatedAt}</div>
                  </div>
                </div>
                <Badge variant={statusVariant(base.status)}>{statusLabel(base.status)}</Badge>
              </div>
              <div className="text-[13px] text-[var(--color-text-secondary)] mt-5 min-h-[40px]">{base.description}</div>
              <div className="mt-4 flex gap-2 flex-wrap">
                {base.tags.map(tag => <Badge key={tag} variant="gray">{tag}</Badge>)}
              </div>
              <div className="mt-6 flex items-center gap-4 text-[13px] text-[var(--color-text-secondary)]">
                <span>{base.documentCount} 个文档</span>
                <span>{base.tags.length} 个标签</span>
                <span>{formatUpdatedAt(base.updatedAt)}</span>
              </div>
            </button>
          ))}
        </div>

        {filteredKnowledgeBases.length === 0 ? (
          <EmptyState
            title="没有匹配的知识库"
            description="当前筛选条件下没有可用知识库。重置标签、来源或搜索词后再查看完整列表。"
            action={<Button variant="secondary" size="sm" onClick={() => { setSourceFilter('all'); setTagFilter('all'); setSearch(''); }}>重置筛选</Button>}
          />
        ) : null}
      </div>
    );
  }

  function renderDocumentsTab() {
    if (!selectedKnowledgeBase) return null;
    const hasDocuments = selectedKnowledgeBase.documentIds.length > 0;
    return (
      <div className="space-y-4">
        <div>
          <div className="text-xl font-semibold">文档</div>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="grid grid-cols-[160px_200px_220px] gap-3 max-[900px]:grid-cols-1 flex-1">
            <select className={inputCls} value={documentTag} onChange={event => setDocumentTag(event.target.value)}>
              <option value="all">全部</option>
              {documentTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
            <input className={inputCls} value={documentSearch} onChange={event => setDocumentSearch(event.target.value)} placeholder="搜索文档" />
            <select className={inputCls} value={documentSort} onChange={event => setDocumentSort(event.target.value as 'latest' | 'name')}>
              <option value="latest">排序：上传时间</option>
              <option value="name">排序：文档名称</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setMetadataModalOpen(true)}>元数据</Button>
            <Button size="sm" onClick={() => onStartKnowledgeImport(selectedKnowledgeBase.id)}>添加文件</Button>
          </div>
        </div>

        {!hasDocuments ? (
          <div className="min-h-[420px] rounded-[24px] border border-[var(--color-border)] bg-white flex items-center justify-center p-10">
            <div className="max-w-[520px] rounded-[24px] border border-[var(--color-border-light)] bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFF_100%)] p-10">
              <div className="mb-4 inline-flex h-12 min-w-12 items-center justify-center rounded-[14px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-semibold tracking-[0.08em] text-[var(--color-primary)]">DOC</div>
              <div className="text-3xl font-semibold mb-3">还没有文档</div>
              <Button onClick={() => onStartKnowledgeImport(selectedKnowledgeBase.id)}>添加文件</Button>
            </div>
          </div>
        ) : (
          selectedDocuments.length > 0 ? (
          <div className="grid gap-3">
            {selectedDocuments.map(doc => {
              const ingestion = selectedIngestionDocs.find(item => item.documentId === doc.id);
              return (
                <div key={doc.id} className="rounded-[18px] border border-[var(--color-border)] bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold">{doc.name}</div>
                      <div className="text-xs text-[var(--color-text-secondary)] mt-1">{doc.owner} · {displayScenario(doc.scenario)} · {displayLanguage(doc.language)} · {doc.version}</div>
                    </div>
                    <Badge variant={stageVariant(doc.publishStatus)}>{displayStageStatus(doc.publishStatus)}</Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-3">
                    <Badge variant="blue">{doc.knowledgeType}</Badge>
                    <Badge variant="gray">{displayScenario(doc.scenario)}</Badge>
                    <Badge variant="gray">{doc.sourceType}</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-4 text-xs text-[var(--color-text-secondary)] max-[1000px]:grid-cols-2">
                    <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2">分段数：<span className="font-semibold text-[var(--color-text)]">{doc.chunkCount}</span></div>
                    <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2">向量数：<span className="font-semibold text-[var(--color-text)]">{doc.vectorCount}</span></div>
                    <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2">覆盖分：<span className="font-semibold text-[var(--color-text)]">{doc.coverageScore}%</span></div>
                    <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2">最近同步：<span className="font-semibold text-[var(--color-text)]">{ingestion?.lastSync ?? doc.effectiveDate}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
          ) : (
            <EmptyState
              title="当前筛选下没有文档"
              description="已存在知识文档，但当前标签、搜索词或排序条件下没有匹配项。重置筛选后可恢复完整文档列表。"
              action={<Button variant="secondary" size="sm" onClick={() => { setDocumentTag('all'); setDocumentSearch(''); setDocumentSort('latest'); }}>重置文档筛选</Button>}
            />
          )
        )}
      </div>
    );
  }

  function renderIngestionTab() {
    if (!selectedKnowledgeBase) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xl font-semibold">接入任务</div>
          <Button size="sm" onClick={() => onStartKnowledgeImport(selectedKnowledgeBase.id)}>添加文件</Button>
        </div>
        <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
          <StatCard label="处理中" value={String(ingestionOverview.processingCount)} detail="" tone="warning" />
          <StatCard label="已发布" value={String(ingestionOverview.publishedCount)} detail="" tone="success" />
          <StatCard label="异常任务" value={String(ingestionOverview.exceptionCount)} detail="" tone="danger" />
        </div>
        <div className="grid grid-cols-[0.95fr_1.05fr] gap-4 max-[1200px]:grid-cols-1">
          <div className="rounded-[18px] border border-[var(--color-border)] bg-white p-4">
            <div className="text-sm font-semibold mb-3">最近接入任务</div>
            <div className="space-y-2">
              {ingestionOverview.jobs.slice(0, 4).map(job => (
                <div key={job.id} className="rounded-[16px] border border-[var(--color-border-light)] bg-[var(--color-bg)] p-3 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium">{job.documentName}</div>
                    <Badge variant={stageVariant(job.status)}>{displayStageStatus(job.status)}</Badge>
                  </div>
                  <div className="text-[var(--color-text-secondary)]">{job.detail}</div>
                </div>
              ))}
              {ingestionOverview.jobs.length === 0 ? <EmptyState title="暂无接入任务" compact /> : null}
            </div>
          </div>
          <div className="rounded-[18px] border border-[var(--color-border)] bg-white p-4">
            <div className="text-sm font-semibold mb-3">接入文档台账</div>
            <div className="space-y-3">
              {ingestionOverview.documents.map(doc => (
                <div key={doc.id} className="rounded-[16px] border border-[var(--color-border-light)] bg-[var(--color-bg)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{doc.documentName}</div>
                      <div className="mt-1 text-xs text-[var(--color-text-secondary)]">{displayScenario(doc.scenario)} · {displayLanguage(doc.language)} · {doc.version}</div>
                    </div>
                    <Badge variant={stageVariant(doc.indexStatus)}>{displayStageStatus(doc.indexStatus)}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-xs max-[980px]:grid-cols-2">
                    <div className="rounded-[12px] bg-white px-3 py-2">解析：{displayStageStatus(doc.parseStatus)}</div>
                    <div className="rounded-[12px] bg-white px-3 py-2">切片：{displayStageStatus(doc.chunkStatus)}</div>
                    <div className="rounded-[12px] bg-white px-3 py-2">向量：{displayStageStatus(doc.embeddingStatus)}</div>
                    <div className="rounded-[12px] bg-white px-3 py-2">索引：{displayStageStatus(doc.indexStatus)}</div>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <Button variant="ghost" size="sm" onClick={() => { void handleIngestionAction(doc.documentId, 'view_parsed_text'); }}>查看解析文本</Button>
                    <Button variant="ghost" size="sm" onClick={() => { void handleIngestionAction(doc.documentId, 'view_chunks'); }}>查看分块</Button>
                    <Button variant="ghost" size="sm" onClick={() => { void handleIngestionAction(doc.documentId, 'rebuild_embedding'); }}>重建向量</Button>
                    <Button variant="ghost" size="sm" onClick={() => { void handleIngestionAction(doc.documentId, 'publish'); }}>发布</Button>
                    <Button variant="ghost" size="sm" onClick={() => { void handleIngestionAction(doc.documentId, 'disable'); }}>禁用</Button>
                  </div>
                </div>
              ))}
              {ingestionOverview.documents.length === 0 ? <EmptyState title="当前知识库还没有接入文档" compact /> : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderPipelineTab() {
    return (
      <div className="space-y-4">
        <div>
          <div className="text-xl font-semibold">流水线</div>
        </div>
        <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
          <div className="rounded-[18px] border border-[var(--color-border)] bg-white p-4">
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">当前分段策略</div>
            <div className="text-lg font-semibold">{strategyLabel(ragConfig.chunking.strategy)}</div>
            <div className="text-xs text-[var(--color-text-light)] mt-2">Chunk Size {ragConfig.chunking.chunkSize} · Overlap {ragConfig.chunking.chunkOverlap}</div>
          </div>
          <div className="rounded-[18px] border border-[var(--color-border)] bg-white p-4">
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">索引模式</div>
            <div className="text-lg font-semibold">{ragConfig.retrieval.rerankerEnabled ? '高质量检索' : '经济检索'}</div>
            <div className="text-xs text-[var(--color-text-light)] mt-2">Top K {ragConfig.retrieval.topK} · Score 阈值 {ragConfig.retrieval.similarityThreshold}</div>
          </div>
          <div className="rounded-[18px] border border-[var(--color-border)] bg-white p-4">
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">Embedding 模型</div>
            <div className="text-lg font-semibold">{ragConfig.embedding.model}</div>
            <div className="text-xs text-[var(--color-text-light)] mt-2">{ragConfig.embedding.indexName} · {ragConfig.embedding.indexVersion}</div>
          </div>
        </div>
        <div className="grid gap-3">
          {pipelineJobs.length > 0 ? pipelineJobs.map(job => (
            <div key={job.id} className="rounded-[18px] border border-[var(--color-border)] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{job.documentName}</div>
                <Badge variant={stageVariant(job.status)}>{displayStageStatus(job.status)}</Badge>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-2">{job.detail}</div>
            </div>
          )) : (
            <EmptyState title="暂无接入轨迹" description="当前知识库还没有独立接入任务记录，后续新增文档后会在这里沉淀解析、切片、向量化与发布轨迹。" compact />
          )}
        </div>
      </div>
    );
  }

  function renderRetrievalTab() {
    return (
      <div className="space-y-4">
        <div>
          <div className="text-xl font-semibold">召回测试</div>
        </div>
        {latestRetrievalRuns.length > 0 ? latestRetrievalRuns.map(run => (
          <div key={run.id} className="rounded-[18px] border border-[var(--color-border)] bg-white p-5">
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
          </div>
        )) : (
          <EmptyState title="暂无召回测试" description="还没有与当前知识库直接相关的召回测试记录。处理完成页会提供“去召回测试”入口。" compact />
        )}
      </div>
    );
  }

  function renderSettingsTab() {
    return (
      <div className="space-y-4">
        <div>
          <div className="text-xl font-semibold">设置</div>
        </div>
        <div className="rounded-[20px] border border-[var(--color-border)] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">当前配置快照</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">最近更新：{ragConfig.updatedAt}</div>
            </div>
            <Button variant="secondary" size="sm">在系统设置中查看</Button>
          </div>
          <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
            <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3 text-sm">OCR：{ragConfig.parser.enableOCR ? '启用' : '关闭'}</div>
            <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3 text-sm">保留文档结构：{ragConfig.parser.preserveDocumentStructure ? '启用' : '关闭'}</div>
            <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3 text-sm">重排序：{ragConfig.retrieval.rerankerEnabled ? '启用' : '关闭'}</div>
            <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3 text-sm">引用要求：{ragConfig.retrieval.citationRequired ? '必须引用' : '可选'}</div>
          </div>
        </div>
      </div>
    );
  }

  function renderDetail() {
    if (!selectedKnowledgeBase) return null;
    const tabs: Array<{ key: KnowledgeDetailTab; label: string }> = [
      { key: 'documents', label: '文档' },
      { key: 'ingestion', label: '接入任务' },
      { key: 'pipeline', label: '流水线' },
      { key: 'retrieval-test', label: '召回测试' },
      { key: 'settings', label: '设置' },
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap rounded-[20px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.62)] px-5 py-4">
          <div className="min-w-0 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBackToKnowledgeList}>返回</Button>
            <div className="min-w-0 text-[24px] leading-none font-semibold tracking-[-0.03em] text-[var(--color-text)] truncate">
              {selectedKnowledgeBase.name}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[180px_1fr] gap-4 max-[1180px]:grid-cols-1">
          <PanelCard className="rounded-[20px] p-3 h-fit">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`w-full rounded-[14px] px-4 py-3 text-left text-sm transition-all duration-200 ${knowledgeDetailTab === tab.key ? 'bg-[rgba(179,92,32,0.12)] text-[var(--color-primary)] font-semibold shadow-[inset_0_0_0_1px_rgba(179,92,32,0.14)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]'}`}
                onClick={() => onKnowledgeDetailTabChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </PanelCard>
          <PanelCard className="rounded-[20px] p-6 bg-[linear-gradient(180deg,#FFFFFF_0%,#FBFCFF_100%)]">
            {knowledgeDetailTab === 'documents' ? renderDocumentsTab() : null}
            {knowledgeDetailTab === 'ingestion' ? renderIngestionTab() : null}
            {knowledgeDetailTab === 'pipeline' ? renderPipelineTab() : null}
            {knowledgeDetailTab === 'retrieval-test' ? renderRetrievalTab() : null}
            {knowledgeDetailTab === 'settings' ? renderSettingsTab() : null}
          </PanelCard>
        </div>
        <Modal open={Boolean(ingestionModalState)} onClose={() => setIngestionModalState(null)} title={ingestionModalState?.title}>
          <div className="space-y-3 text-xs">
            {ingestionModalState?.lines.map((line, index) => (
              <div key={`${index}-${line.slice(0, 12)}`} className="rounded-[16px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.72)] p-3.5 whitespace-pre-wrap leading-6">
                {line}
              </div>
            ))}
          </div>
        </Modal>
        <Modal
          open={metadataModalOpen}
          onClose={() => setMetadataModalOpen(false)}
          title={`${selectedKnowledgeBase.name} / 元数据总览`}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[var(--color-bg)] px-4 py-3">
                <div className="text-xs text-[var(--color-text-secondary)]">文档数</div>
                <div className="mt-1 text-2xl font-semibold">{metadataSummary.documentCount}</div>
              </div>
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[var(--color-bg)] px-4 py-3">
                <div className="text-xs text-[var(--color-text-secondary)]">场景数</div>
                <div className="mt-1 text-2xl font-semibold">{metadataSummary.scenarioCount}</div>
              </div>
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[var(--color-bg)] px-4 py-3">
                <div className="text-xs text-[var(--color-text-secondary)]">知识类型数</div>
                <div className="mt-1 text-2xl font-semibold">{metadataSummary.knowledgeTypeCount}</div>
              </div>
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[var(--color-bg)] px-4 py-3">
                <div className="text-xs text-[var(--color-text-secondary)]">语言数</div>
                <div className="mt-1 text-2xl font-semibold">{metadataSummary.languageCount}</div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[var(--color-border)] bg-white p-4">
              <div className="text-sm font-semibold">知识库属性</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm max-[640px]:grid-cols-1">
                <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2">名称：{selectedKnowledgeBase.name}</div>
                <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2">负责人：{selectedKnowledgeBase.owner}</div>
                <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2">来源：{sourceLabel(selectedKnowledgeBase.source)}</div>
                <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2">状态：{statusLabel(selectedKnowledgeBase.status)}</div>
                <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2 col-span-full max-[640px]:col-span-1">标签：{selectedKnowledgeBase.tags.join(' / ') || '暂无标签'}</div>
                <div className="rounded-[14px] bg-[var(--color-bg)] px-3 py-2 col-span-full max-[640px]:col-span-1">最近同步：{metadataSummary.latestSync}</div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[var(--color-border)] bg-white p-4">
              <div className="text-sm font-semibold">字段分布</div>
              <div className="mt-3 grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
                {metadataFieldGroups.map(group => (
                  <div key={group.label} className="rounded-[16px] border border-[var(--color-border-light)] bg-[var(--color-bg)] p-3">
                    <div className="text-xs font-semibold text-[var(--color-text-secondary)]">{group.label}</div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {group.entries.length > 0 ? group.entries.map(entry => (
                        <Badge key={`${group.label}-${entry.value}`} variant="gray">{entry.value} · {entry.count}</Badge>
                      )) : <span className="text-xs text-[var(--color-text-light)]">暂无数据</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-[var(--color-border)] bg-white p-4">
              <div className="text-sm font-semibold">文档元数据清单</div>
              {metadataDocumentRows.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {metadataDocumentRows.map(item => (
                    <div key={item.id} className="rounded-[16px] border border-[var(--color-border-light)] bg-[var(--color-bg)] p-3">
                      <div className="text-sm font-semibold">{item.name}</div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)] max-[640px]:grid-cols-1">
                        <div>负责人：{item.owner}</div>
                        <div>场景：{item.scenario}</div>
                        <div>知识类型：{item.knowledgeType}</div>
                        <div>来源：{item.sourceType}</div>
                        <div>语言：{item.language}</div>
                        <div>版本：{item.version}</div>
                        <div>发布状态：{item.publishStatus}</div>
                        <div>分段数：{item.chunkCount}</div>
                        <div>向量数：{item.vectorCount}</div>
                        <div>生效时间：{item.effectiveDate}</div>
                        <div className="col-span-full max-[640px]:col-span-1">最近同步：{item.lastSync}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3">
                  <EmptyState title="当前筛选下没有可展示的元数据" compact />
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  function renderWizard() {
    const canContinueStep1 = Boolean(knowledgeWizardDraft.fileName.trim());
    const stepTitle = knowledgeWizardStep === 1 ? '选择数据源' : knowledgeWizardStep === 2 ? '文本分段与清洗' : '处理并完成';
    const handleBackToDetail = () => {
      if (selectedKnowledgeBase) {
        onFinishKnowledgeImport();
        return;
      }
      onBackToKnowledgeList();
    };
    return (
      <div className="space-y-5">
        <div className="rounded-[22px] border border-[var(--color-border)] bg-white p-6">
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={handleBackToDetail}>
              <ChevronLeft size={14} />
              返回
            </Button>
          </div>
          <div className="text-2xl font-semibold mb-1">{stepTitle}</div>
          <div className="text-[13px] text-[var(--color-text-secondary)] mb-6">当前知识库：{selectedKnowledgeBase?.name ?? '未指定知识库'}</div>

          {knowledgeWizardStep === 1 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-1">
                {SOURCE_OPTIONS.map(option => (
                  <button
                    key={option.key}
                    className={`rounded-[18px] border p-5 text-left transition-colors ${knowledgeWizardDraft.sourceType === option.key ? 'border-[var(--color-primary)] shadow-[0_0_0_1px_rgba(52,112,255,0.18)]' : 'border-[var(--color-border)]'} ${option.enabled ? 'bg-white' : 'bg-[var(--color-bg)] opacity-65 cursor-not-allowed'}`}
                    onClick={() => option.enabled && onKnowledgeWizardDraftChange(prev => ({ ...prev, sourceType: option.key }))}
                    disabled={!option.enabled}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold">上传文本文件</div>
                <div className="rounded-[18px] border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-5">
                  {knowledgeWizardDraft.fileName ? (
                    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--color-border)] bg-white px-4 py-3">
                      <div>
                        <div className="font-medium">{knowledgeWizardDraft.fileName}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">MD · {knowledgeWizardDraft.fileSizeLabel || '待确认大小'}</div>
                      </div>
                      <button className="text-[var(--color-text-secondary)]" onClick={() => onKnowledgeWizardDraftChange(prev => ({ ...prev, fileName: '', fileSizeLabel: '', documentName: '' }))}>删除</button>
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--color-text-secondary)] leading-7">拖拽文件至此，或者从下方样例中选择一个文件。</div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
                  {SAMPLE_FILES.map(file => (
                    <button key={file.fileName} className="rounded-[16px] border border-[var(--color-border)] bg-white p-4 text-left hover:border-[var(--color-primary)]" onClick={() => applySample(file.fileName)}>
                      <div className="font-medium text-sm">{file.fileName}</div>
                      <div className="text-xs text-[var(--color-text-secondary)] mt-2">{file.size} · {displayScenario(file.scenario)} · {file.knowledgeType}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button disabled={!canContinueStep1} onClick={() => onKnowledgeWizardStepChange(2)}>下一步</Button>
              </div>
            </div>
          ) : null}

          {knowledgeWizardStep === 2 ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 max-[1100px]:grid-cols-1">
                <div className="rounded-[18px] border border-[var(--color-border)] p-4 space-y-4">
                  <div className="text-sm font-semibold">通用</div>
                  <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
                    <div>
                      <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">文档名</label>
                      <input className={inputCls} value={knowledgeWizardDraft.documentName} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, documentName: event.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">场景</label>
                      <input className={inputCls} value={displayScenario(knowledgeWizardDraft.scenario)} readOnly />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">知识类型</label>
                      <input className={inputCls} value={knowledgeWizardDraft.knowledgeType} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, knowledgeType: event.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">语言</label>
                      <input className={inputCls} value={knowledgeWizardDraft.language} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, language: event.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="rounded-[18px] border border-[var(--color-border)] p-4 space-y-4">
                  <div className="text-sm font-semibold">分段设置</div>
                  <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
                    <div>
                      <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">分段标识符</label>
                      <input className={inputCls} value={'\\n\\n'} readOnly />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">分段最大长度</label>
                      <input type="number" className={inputCls} value={knowledgeWizardDraft.chunking.chunkSize} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, chunking: { ...prev.chunking, chunkSize: Number(event.target.value) } }))} />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">分段重叠长度</label>
                      <input type="number" className={inputCls} value={knowledgeWizardDraft.chunking.chunkOverlap} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, chunking: { ...prev.chunking, chunkOverlap: Number(event.target.value) } }))} />
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={knowledgeWizardDraft.parser.removeBoilerplateText} onChange={() => onKnowledgeWizardDraftChange(prev => ({ ...prev, parser: { ...prev.parser, removeBoilerplateText: !prev.parser.removeBoilerplateText } }))} /> 替换掉连续的空格、换行符和制表符</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={knowledgeWizardDraft.parser.extractHeadings} onChange={() => onKnowledgeWizardDraftChange(prev => ({ ...prev, parser: { ...prev.parser, extractHeadings: !prev.parser.extractHeadings } }))} /> 保留标题与结构信息</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={knowledgeWizardDraft.retrieval.citationRequired} onChange={() => onKnowledgeWizardDraftChange(prev => ({ ...prev, retrieval: { ...prev.retrieval, citationRequired: !prev.retrieval.citationRequired } }))} /> 检索结果必须引用来源</label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-[1100px]:grid-cols-1">
                <div className="rounded-[18px] border border-[var(--color-border)] p-4 space-y-4">
                  <div className="text-sm font-semibold">索引方式</div>
                  <button
                    className={`w-full rounded-[16px] border p-4 text-left ${knowledgeWizardDraft.retrieval.rerankerEnabled ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}
                    onClick={() => onKnowledgeWizardDraftChange(prev => ({ ...prev, retrieval: { ...prev.retrieval, rerankerEnabled: true } }))}
                  >
                    <div className="font-medium">高质量</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-2">调用嵌入模型与重排序模型实现更精确的检索，可帮助 LLM 生成高质量回答。</div>
                  </button>
                  <button
                    className={`w-full rounded-[16px] border p-4 text-left ${!knowledgeWizardDraft.retrieval.rerankerEnabled ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}
                    onClick={() => onKnowledgeWizardDraftChange(prev => ({ ...prev, retrieval: { ...prev.retrieval, rerankerEnabled: false } }))}
                  >
                    <div className="font-medium">经济</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-2">每个数据块使用 10 个关键词进行检索，不额外消耗排序模型成本，但召回精度会下降。</div>
                  </button>
                </div>

                <div className="rounded-[18px] border border-[var(--color-border)] p-4 space-y-4">
                  <div className="text-sm font-semibold">检索设置</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Top K</label>
                      <input type="number" className={inputCls} value={knowledgeWizardDraft.retrieval.topK} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, retrieval: { ...prev.retrieval, topK: Number(event.target.value) } }))} />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Score 阈值</label>
                      <input type="number" step="0.01" className={inputCls} value={knowledgeWizardDraft.retrieval.similarityThreshold} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, retrieval: { ...prev.retrieval, similarityThreshold: Number(event.target.value) } }))} />
                    </div>
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)]">Embedding 模型：{ragConfig.embedding.model} · Index：{ragConfig.embedding.indexName}</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button variant="secondary" onClick={() => onKnowledgeWizardStepChange(1)}>上一步</Button>
                <Button onClick={onSubmitKnowledgeImport}>保存并处理</Button>
              </div>
            </div>
          ) : null}

          {knowledgeWizardStep === 3 ? (
            <div className="space-y-5">
              {!knowledgeProcessingResult || knowledgeProcessingResult.status === 'processing' ? (
                <div className="min-h-[360px] flex items-center justify-center">
                  <div className="w-full max-w-[560px]">
                    <EmptyState title="正在处理文档" description="系统正在依次执行解析、文本分段、向量化与索引发布。完成后会自动展示处理结果与下一步运营入口。" />
                  </div>
                </div>
              ) : null}

              {knowledgeProcessingResult?.status === 'success' ? (
                <div className="space-y-5">
                  <div className="rounded-[20px] border border-[rgba(5,150,105,0.18)] bg-[linear-gradient(180deg,#F0FDF4_0%,#FFFFFF_100%)] p-6">
                    <div className="mb-3 inline-flex h-12 min-w-12 items-center justify-center rounded-[14px] border border-[rgba(5,150,105,0.18)] bg-white px-3 text-sm font-semibold tracking-[0.08em] text-[var(--color-success)]">OK</div>
                    <div className="text-2xl font-semibold">处理完成</div>
                    <div className="text-[13px] text-[var(--color-text-secondary)] mt-2">文档已经完成入库，可直接参与后续检索、引用与召回测试。</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
                    <div className="rounded-[16px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm">文档名：<span className="font-semibold">{knowledgeProcessingResult.documentName}</span></div>
                    <div className="rounded-[16px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm">来源：<span className="font-semibold">{knowledgeProcessingResult.sourceLabel}</span></div>
                    <div className="rounded-[16px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm">分段数：<span className="font-semibold">{knowledgeProcessingResult.chunkCount}</span></div>
                    <div className="rounded-[16px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm">向量数：<span className="font-semibold">{knowledgeProcessingResult.vectorCount}</span></div>
                    <div className="rounded-[16px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm">索引方式：<span className="font-semibold">{knowledgeProcessingResult.indexMode}</span></div>
                    <div className="rounded-[16px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm">处理时间：<span className="font-semibold">{knowledgeProcessingResult.processedAt}</span></div>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Button variant="secondary" onClick={() => onFinishKnowledgeImport()}>返回文档列表</Button>
                    <Button variant="secondary" onClick={() => onFinishKnowledgeImport({ openRagTest: true })}>去召回测试</Button>
                    <Button onClick={() => onFinishKnowledgeImport({ continueImport: true })}>继续上传</Button>
                  </div>
                </div>
              ) : null}

              {knowledgeProcessingResult?.status === 'failed' ? (
                <div className="space-y-5">
                  <div className="rounded-[20px] border border-[rgba(239,68,68,0.18)] bg-[linear-gradient(180deg,#FEF2F2_0%,#FFFFFF_100%)] p-6">
                    <div className="mb-3 inline-flex h-12 min-w-12 items-center justify-center rounded-[14px] border border-[rgba(239,68,68,0.18)] bg-white px-3 text-sm font-semibold tracking-[0.08em] text-[var(--color-danger)]">ERR</div>
                    <div className="text-2xl font-semibold">处理未完成</div>
                    <div className="text-[13px] text-[var(--color-text-secondary)] mt-2">{knowledgeProcessingResult.failureReason}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
                    <div className="rounded-[16px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm">文档名：<span className="font-semibold">{knowledgeProcessingResult.documentName}</span></div>
                    <div className="rounded-[16px] border border-[var(--color-border)] bg-white px-4 py-3 text-sm">检测时间：<span className="font-semibold">{knowledgeProcessingResult.processedAt}</span></div>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Button variant="secondary" onClick={() => onKnowledgeWizardStepChange(2)}>返回调整</Button>
                    <Button onClick={() => onStartKnowledgeImport(selectedKnowledgeBase?.id)}>重新导入</Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (knowledgeFlow === 'detail') return renderDetail();
  if (knowledgeFlow === 'wizard') return renderWizard();
  return renderList();
}
