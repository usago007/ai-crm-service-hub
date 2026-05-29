import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import type { BadgeVariant } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EmptyState, FilterBar, PanelCard, StatCard } from '../components/common/PageChrome';
import { Pagination } from '../components/common/Pagination';
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
import { displayLanguage, displayRiskLevel, displayScenario } from '../utils/display';
import { scenarioOptions } from './ai-console/types';
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
  onCreateKnowledgeBase: (name: string, description?: string, tags?: string[]) => void;
  onUpdateKnowledgeBaseMeta: (id: string, updates: { name?: string; description?: string; tags?: string[]; owner?: string }) => void;
  onUpdateKnowledgeBaseOverrides: (id: string, configOverrides: KnowledgeBaseRecord['configOverrides']) => void;
  onArchiveKnowledgeBase: (id: string) => void;
  onCloneKnowledgeBase: (id: string) => void;
  onNavigateToRagTestLab: () => void;
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

function getOverallStatusLabel(
  doc: IngestionDocumentRecord,
  job?: { status: string } | null,
): { label: string; variant: BadgeVariant } {
  const statuses = [doc.parseStatus, doc.chunkStatus, doc.embeddingStatus, doc.indexStatus];
  if (statuses.some(s => ['failed', 'chunk_failed', 'embedding_failed'].includes(s))) {
    return { label: '失败', variant: 'danger' };
  }
  if (job?.status === 'version_conflict') return { label: '版本冲突', variant: 'orange' };
  if (job?.status === 'published') return { label: '已发布', variant: 'success' };
  if (job && ['uploaded', 'parsing', 'parsed', 'indexed', 'processing'].includes(job.status)) {
    return { label: '处理中', variant: 'info' };
  }
  return { label: '待处理', variant: 'gray' };
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
  onUpdateKnowledgeBaseMeta,
  onUpdateKnowledgeBaseOverrides,
  onArchiveKnowledgeBase,
  onCloneKnowledgeBase,
  onNavigateToRagTestLab,
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
  const [openMore, setOpenMore] = useState<string | null>(null);
  const [ingestionSearch, setIngestionSearch] = useState('');
  const [ingestionStatusFilter, setIngestionStatusFilter] = useState('all');
  const [ingestionScenarioFilter, setIngestionScenarioFilter] = useState('all');
  const [ingestionLanguageFilter, setIngestionLanguageFilter] = useState('all');
  const [ingestionPage, setIngestionPage] = useState(1);
  const [metadataModalOpen, setMetadataModalOpen] = useState(false);
  const [retrievalExpandedRunId, setRetrievalExpandedRunId] = useState<string | null>(null);
  const [kbSettingsOverrides, setKbSettingsOverrides] = useState(selectedKnowledgeBase?.configOverrides);
  const [kbSettingsDirty, setKbSettingsDirty] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKbName, setNewKbName] = useState('');
  const [newKbDesc, setNewKbDesc] = useState('');
  const [newKbTags, setNewKbTags] = useState('');
  const [editMetaModalOpen, setEditMetaModalOpen] = useState(false);
  const [editMetaName, setEditMetaName] = useState('');
  const [editMetaDesc, setEditMetaDesc] = useState('');
  const [editMetaTags, setEditMetaTags] = useState('');
  const [editMetaOwner, setEditMetaOwner] = useState('');

  // Sync local overrides when selectedKnowledgeBase changes (fix stale state on KB switch)
  useEffect(() => {
    setKbSettingsOverrides(selectedKnowledgeBase?.configOverrides);
    setKbSettingsDirty(false);
  }, [selectedKnowledgeBase?.id, selectedKnowledgeBase?.configOverrides]);

  function resetIngestionFilters() {
    setIngestionSearch('');
    setIngestionStatusFilter('all');
    setIngestionScenarioFilter('all');
    setIngestionLanguageFilter('all');
  }

  function handleIngestionFilterChange(setter: (value: string) => void, value: string) {
    setter(value);
    setIngestionPage(1);
  }

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

  const ingestionMerged = useMemo(() => {
    return ingestionOverview.documents.map(doc => ({
      doc,
      job: ingestionOverview.jobs.find(j => j.documentId === doc.documentId),
    }));
  }, [ingestionOverview]);

  const ingestionUniqueScenarios = useMemo(() => {
    return Array.from(new Set(ingestionMerged.map(m => m.doc.scenario)));
  }, [ingestionMerged]);

  const ingestionUniqueLanguages = useMemo(() => {
    return Array.from(new Set(ingestionMerged.map(m => m.doc.language)));
  }, [ingestionMerged]);

  const ingestionFilteredMerged = useMemo(() => {
    let result = ingestionMerged;

    if (ingestionSearch.trim()) {
      const q = ingestionSearch.trim().toLowerCase();
      result = result.filter(m => m.doc.documentName.toLowerCase().includes(q));
    }

    if (ingestionStatusFilter !== 'all') {
      result = result.filter(m => getOverallStatusLabel(m.doc, m.job).label === ingestionStatusFilter);
    }

    if (ingestionScenarioFilter !== 'all') {
      result = result.filter(m => m.doc.scenario === ingestionScenarioFilter);
    }

    if (ingestionLanguageFilter !== 'all') {
      result = result.filter(m => m.doc.language === ingestionLanguageFilter);
    }

    return result;
  }, [ingestionMerged, ingestionSearch, ingestionStatusFilter, ingestionScenarioFilter, ingestionLanguageFilter]);

  const INGESTION_PAGE_SIZE = 10;

  const ingestionTotalPages = Math.max(1, Math.ceil(ingestionFilteredMerged.length / INGESTION_PAGE_SIZE));
  const ingestionSafePage = Math.min(ingestionPage, ingestionTotalPages);
  const ingestionPaginatedMerged = ingestionFilteredMerged.slice(
    (ingestionSafePage - 1) * INGESTION_PAGE_SIZE,
    ingestionSafePage * INGESTION_PAGE_SIZE,
  );

  const latestRetrievalRuns = useMemo(() => {
    if (!selectedKnowledgeBase) return [];
    const kbDocNames = new Set(
      knowledgeDocuments
        .filter(d => selectedKnowledgeBase.documentIds.includes(d.id))
        .map(d => d.name)
    );
    return ragTestRuns
      .filter(run => run.retrievedChunks.some(chunk => kbDocNames.has(chunk.source)))
      .slice(0, 5);
  }, [ragTestRuns, selectedKnowledgeBase, knowledgeDocuments]);

  const [showAllRetrievalRuns, setShowAllRetrievalRuns] = useState(false);

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
      <>
      <div className="space-y-5">
        <div className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFC_100%)] p-6">
          <div className="text-[20px] font-semibold tracking-[-0.02em]">AI 知识库</div>
          <div className="text-sm text-[var(--color-text-secondary)] mt-1 leading-6">
            管理知识资产：创建知识库、导入文档、配置检索策略。文档经过解析→切片→向量化→索引后即可参与 RAG 检索。
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 max-[980px]:grid-cols-1">
            <StatCard label="知识库总量" value={String(knowledgeBases.length)} detail="" />
            <StatCard label="活动文档" value={String(activeDocCount)} detail="" />
            <StatCard label="同步中" value={String(syncingCount)} detail="" tone="warning" />
          </div>
        </div>

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
            onClick={() => { setNewKbName(''); setNewKbDesc(''); setNewKbTags(''); setShowCreateModal(true); }}
          >
            <div className="text-[36px] leading-none mb-8 text-[var(--color-primary)]">+</div>
            <div className="text-[15px] font-semibold">创建知识库</div>
            <div className="mt-3 text-[13px] text-[var(--color-text-secondary)]">创建空白知识库，后续可导入文档、配置检索策略。</div>
          </button>

          {filteredKnowledgeBases.map(base => (
            <div key={base.id}>
              <button
                className="w-full min-h-[220px] rounded-[22px] border border-[var(--color-border)] bg-white text-left p-6 hover:border-[var(--color-primary)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)] transition-all"
                onClick={() => onOpenKnowledgeBase(base.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {renderKnowledgeIcon(base.icon)}
                    <div>
                      <div className="text-lg font-semibold leading-6">{base.name}</div>
                      <div className="text-xs text-[var(--color-text-secondary)] mt-1">{base.owner}</div>
                    </div>
                  </div>
                  <Badge variant={statusVariant(base.status)}>{statusLabel(base.status)}</Badge>
                </div>
                <div className="text-[13px] text-[var(--color-text-secondary)] mt-5 min-h-[40px]">{base.description}</div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  {base.tags.map(tag => <Badge key={tag} variant="gray">{tag}</Badge>)}
                </div>
                <div className="mt-6 flex items-center justify-between gap-3 text-[13px] text-[var(--color-text-secondary)] flex-wrap">
                  <span>{base.documentCount} 个文档 · {base.tags.length} 个标签</span>
                  <span>{formatUpdatedAt(base.updatedAt)}</span>
                </div>
              </button>
            </div>
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

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="创建知识库" actions={<Button size="sm" onClick={() => { if (newKbName.trim()) { onCreateKnowledgeBase(newKbName.trim(), newKbDesc.trim() || undefined, newKbTags.split(/[,，]/).map(s => s.trim()).filter(Boolean)); setShowCreateModal(false); } }} disabled={!newKbName.trim()}>确认创建</Button>}>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">名称 <span className="text-[var(--color-danger)]">*</span></div>
            <input className={inputCls} value={newKbName} onChange={e => setNewKbName(e.target.value)} placeholder="如：东南亚物流专项库" autoFocus />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">描述</div>
            <textarea className={`${inputCls} h-20 py-2 resize-none`} value={newKbDesc} onChange={e => setNewKbDesc(e.target.value)} placeholder="描述知识库的用途和覆盖范围..." />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">标签（逗号分隔）</div>
            <input className={inputCls} value={newKbTags} onChange={e => setNewKbTags(e.target.value)} placeholder="如：物流, 退款, 东南亚" />
          </div>
        </div>
      </Modal>
      </>
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
                    <div className="flex gap-1.5">
                      <Badge variant={stageVariant(doc.publishStatus)}>{displayStageStatus(doc.publishStatus)}</Badge>
                      {doc.publishStatus === 'published' && doc.coverageScore >= 80 ? <Badge variant="green">健康</Badge> : null}
                      {doc.publishStatus === 'indexed' || (doc.publishStatus === 'published' && doc.coverageScore < 80 && doc.coverageScore >= 60) ? <Badge variant="yellow">关注</Badge> : null}
                      {['expired', 'version_conflict', 'chunk_failed', 'embedding_failed'].includes(doc.publishStatus) || (doc.coverageScore < 60 && doc.coverageScore > 0) ? <Badge variant="red">异常</Badge> : null}
                      {doc.parseError ? <span className="text-[11px] text-[var(--color-danger)] self-center ml-1" title={doc.parseError}>!</span> : null}
                    </div>
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
    const noData = ingestionMerged.length === 0;
    const filteredEmpty = !noData && ingestionFilteredMerged.length === 0;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2">
          <StatCard label="文档总量" value={String(selectedKnowledgeBase.documentCount)} detail="" />
          <StatCard label="已发布" value={String(ingestionOverview.publishedCount)} detail="" tone="success" />
          <StatCard label="处理中" value={String(ingestionOverview.processingCount)} detail="" tone="warning" />
          <StatCard label="异常任务" value={String(ingestionOverview.exceptionCount)} detail="" tone="danger" />
        </div>
        <div className="flex items-center gap-6 flex-wrap text-xs text-[var(--color-text-secondary)] rounded-[18px] border border-[var(--color-border)] bg-white px-5 py-3">
          <span>
            <span className="text-[var(--color-text-light)]">分段策略：</span>
            <span className="font-medium text-[var(--color-text)]">{strategyLabel((selectedKnowledgeBase.configOverrides?.chunking?.strategy as RagConfigSnapshot['chunking']['strategy'] | undefined) ?? ragConfig.chunking.strategy)}</span>
            <span className="ml-1">· Chunk {selectedKnowledgeBase.configOverrides?.chunking?.chunkSize ?? ragConfig.chunking.chunkSize} / Overlap {selectedKnowledgeBase.configOverrides?.chunking?.chunkOverlap ?? ragConfig.chunking.chunkOverlap}</span>
            {selectedKnowledgeBase.configOverrides?.chunking ? <Badge variant="yellow" className="ml-1.5 !text-[10px] !px-1.5 !py-0.5">已覆盖</Badge> : null}
          </span>
          <span className="w-px h-4 bg-[var(--color-border)]" />
          <span>
            <span className="text-[var(--color-text-light)]">索引模式：</span>
            <span className="font-medium text-[var(--color-text)]">{ragConfig.retrieval.rerankerEnabled ? '高质量检索' : '经济检索'}</span>
            <span className="ml-1">· Top K {selectedKnowledgeBase.configOverrides?.retrieval?.topK ?? ragConfig.retrieval.topK} / Score {selectedKnowledgeBase.configOverrides?.retrieval?.similarityThreshold ?? ragConfig.retrieval.similarityThreshold}</span>
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
              <input
                className={inputCls}
                value={ingestionSearch}
                onChange={e => handleIngestionFilterChange(setIngestionSearch, e.target.value)}
                placeholder="搜索文档名称"
              />
              <select className={inputCls} value={ingestionStatusFilter} onChange={e => handleIngestionFilterChange(setIngestionStatusFilter, e.target.value)}>
                <option value="all">全部状态</option>
                <option value="已发布">已发布</option>
                <option value="处理中">处理中</option>
                <option value="失败">失败</option>
                <option value="版本冲突">版本冲突</option>
                <option value="待处理">待处理</option>
              </select>
              <select className={inputCls} value={ingestionScenarioFilter} onChange={e => handleIngestionFilterChange(setIngestionScenarioFilter, e.target.value)}>
                <option value="all">全部场景</option>
                {ingestionUniqueScenarios.map(s => (
                  <option key={s} value={s}>{displayScenario(s)}</option>
                ))}
              </select>
              <select className={inputCls} value={ingestionLanguageFilter} onChange={e => handleIngestionFilterChange(setIngestionLanguageFilter, e.target.value)}>
                <option value="all">全部语言</option>
                {ingestionUniqueLanguages.map(l => (
                  <option key={l} value={l}>{displayLanguage(l)}</option>
                ))}
              </select>
              <div className="filter-actions filter-span-full">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={resetIngestionFilters}>重置</Button>
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
                      const stages = [
                        { key: 'parse' as const, label: '解析', status: doc.parseStatus },
                        { key: 'chunk' as const, label: '切片', status: doc.chunkStatus },
                        { key: 'embed' as const, label: '向量', status: doc.embeddingStatus },
                        { key: 'index' as const, label: '索引', status: doc.indexStatus },
                      ];
                      function stepTone(s: string) {
                        if (['completed', 'published'].includes(s)) return 'done';
                        if (['failed', 'chunk_failed', 'embedding_failed'].includes(s)) return 'fail';
                        if (['processing', 'indexing', 'parsing', 'parsed', 'indexed', 'uploaded'].includes(s)) return 'active';
                        return 'pending';
                      }
                      const os = getOverallStatusLabel(doc, job ?? null);
                      function primaryAction(): { label: string; action: string } | null {
                        if (os.label === '已发布') return { label: '查看解析', action: 'view_parsed_text' };
                        if (os.label === '版本冲突') return { label: '查看解析', action: 'view_parsed_text' };
                        if (os.label === '待处理') return { label: '发布', action: 'publish' };
                        if (os.label === '失败') return { label: '重试', action: 'rebuild_embedding' };
                        if (os.label === '处理中') return { label: '查看进度', action: 'view_parsed_text' };
                        return null;
                      }
                      const pa = primaryAction();
                      function moreActions(): Array<{ label: string; action: string; danger?: boolean }> {
                        if (os.label === '已发布') return [{ label: '重建索引', action: 'rebuild_embedding' }, { label: '禁用', action: 'disable', danger: true }];
                        if (os.label === '失败') return [{ label: '查看解析', action: 'view_parsed_text' }, { label: '查看分块', action: 'view_chunks' }, { label: '重建索引', action: 'rebuild_embedding' }, { label: '禁用', action: 'disable', danger: true }];
                        if (os.label === '版本冲突') return [{ label: '查看解析', action: 'view_parsed_text' }, { label: '查看分块', action: 'view_chunks' }, { label: '重建索引', action: 'rebuild_embedding' }, { label: '禁用', action: 'disable', danger: true }];
                        if (os.label === '处理中') return [{ label: '查看解析', action: 'view_parsed_text' }, { label: '查看分块', action: 'view_chunks' }];
                        return [{ label: '查看解析', action: 'view_parsed_text' }, { label: '禁用', action: 'disable', danger: true }];
                      }
                      const more = moreActions();
                      return (
                      <tr
                        key={doc.id}
                        className="border-b border-[var(--color-border-light)] hover:bg-[rgba(255,255,255,0.42)]"
                      >
                        <td className="px-3 py-3">
                          <div className="text-[13px] font-medium truncate" title={doc.documentName}>{doc.documentName}</div>
                          <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{displayScenario(doc.scenario)} · {displayLanguage(doc.language)}</div>
                        </td>
                        <td className="px-2 py-3 text-xs text-[var(--color-text-secondary)]">{doc.version}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-0.5 text-[11px]">
                            {stages.map((st, i) => {
                              const tone = stepTone(st.status);
                              return (
                                <span key={st.key} className="flex items-center gap-0.5">
                                  {i > 0 && <span className="text-[var(--color-text-light)] mx-0.5">—</span>}
                                  <span className={`inline-block w-[7px] h-[7px] rounded-full flex-shrink-0 ${
                                    tone === 'done' ? 'bg-[var(--color-success)]' :
                                    tone === 'fail' ? 'bg-[var(--color-danger)]' :
                                    tone === 'active' ? 'bg-[var(--color-primary)]' :
                                    'bg-[var(--color-border)]'
                                  }`} />
                                  <span className={`whitespace-nowrap ${
                                    tone === 'fail' ? 'text-[var(--color-danger)] font-medium' :
                                    tone === 'active' ? 'text-[var(--color-text)] font-medium' :
                                    tone === 'done' ? 'text-[var(--color-text-secondary)]' :
                                    'text-[var(--color-text-light)]'
                                  }`}>{st.label}</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <Badge variant={os.variant} className="!text-[10px] !px-1.5 !py-0.5">{os.label}</Badge>
                        </td>
                        <td className="px-3 py-3 text-xs text-[var(--color-text-secondary)] whitespace-nowrap">{job?.updatedAt ? job.updatedAt.replace('T', ' ').slice(0, 16) : '—'}</td>
                        <td className="px-3 py-3 text-xs">
                          <div className="flex items-center gap-2 flex-nowrap">
                            {pa && (
                              <button type="button" className="text-[12px] font-medium text-[var(--color-primary)] hover:underline whitespace-nowrap" onClick={() => { void handleIngestionAction(doc.documentId, pa.action as 'view_parsed_text' | 'publish' | 'rebuild_embedding'); }}>
                                {pa.label}
                              </button>
                            )}
                            <div className="relative">
                              <button
                                type="button"
                                className="text-[14px] text-[var(--color-text-light)] hover:text-[var(--color-text)] px-1 leading-none"
                                onClick={(e) => { e.stopPropagation(); setOpenMore(openMore === doc.id ? null : doc.id); }}
                              >···</button>
                              {openMore === doc.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenMore(null)} />
                                  <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--color-border)] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.12)] z-20 py-1 min-w-[108px]">
                                    {more.map(item => (
                                      <button
                                        key={item.action}
                                        type="button"
                                        className={`w-full text-left px-3 py-1.5 text-[12px] whitespace-nowrap hover:bg-[var(--color-bg)] ${item.danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-secondary)]'}`}
                                        onClick={() => { void handleIngestionAction(doc.documentId, item.action as 'view_parsed_text' | 'view_chunks' | 'rebuild_embedding' | 'disable'); setOpenMore(null); }}
                                      >{item.label}</button>
                                    ))}
                                  </div>
                                </>
                              )}
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
                onPageChange={setIngestionPage}
              />
            </>
          )}
        </PanelCard>
      </div>
    );
  }

  function renderRetrievalTab() {
    return (
      <div className="space-y-4">
        <div>
          <div className="text-xl font-semibold">召回测试</div>
        </div>
        {latestRetrievalRuns.length > 0 ? (showAllRetrievalRuns ? latestRetrievalRuns : latestRetrievalRuns.slice(0, 3)).map(run => {
          const expanded = retrievalExpandedRunId === run.id;
          return (
          <div key={run.id} className="rounded-[18px] border border-[var(--color-border)] bg-white p-5">
            <button type="button" className="w-full text-left" onClick={() => setRetrievalExpandedRunId(expanded ? null : run.id)}>
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
                <Button variant="secondary" size="sm" onClick={() => setRetrievalExpandedRunId(null)}>收起详情</Button>
              </div>
            ) : null}
          </div>
        )}) : (
          <EmptyState title="暂无召回测试" description="还没有与当前知识库直接相关的召回测试记录。" compact action={<Button size="sm" variant="secondary" onClick={onNavigateToRagTestLab}>前往 RAG 调试台</Button>} />
        )}
        {latestRetrievalRuns.length > 3 ? (
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={() => setShowAllRetrievalRuns(prev => !prev)}>
              {showAllRetrievalRuns ? '收起' : `查看更多（共 ${latestRetrievalRuns.length} 条）`}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  function renderSettingsTab() {
    const overrides = selectedKnowledgeBase?.configOverrides;
    const activeOverrides = kbSettingsDirty ? kbSettingsOverrides : overrides;

    const effectiveStrategy = activeOverrides?.chunking?.strategy ?? ragConfig.chunking.strategy;
    const effectiveChunkSize = activeOverrides?.chunking?.chunkSize ?? ragConfig.chunking.chunkSize;
    const effectiveChunkOverlap = activeOverrides?.chunking?.chunkOverlap ?? ragConfig.chunking.chunkOverlap;
    const effectiveTopK = activeOverrides?.retrieval?.topK ?? ragConfig.retrieval.topK;
    const effectiveThreshold = activeOverrides?.retrieval?.similarityThreshold ?? ragConfig.retrieval.similarityThreshold;

    const isOverridden = (field: string) => {
      if (field === 'strategy') return activeOverrides?.chunking?.strategy !== undefined;
      if (field === 'chunkSize') return activeOverrides?.chunking?.chunkSize !== undefined;
      if (field === 'chunkOverlap') return activeOverrides?.chunking?.chunkOverlap !== undefined;
      if (field === 'topK') return activeOverrides?.retrieval?.topK !== undefined;
      if (field === 'threshold') return activeOverrides?.retrieval?.similarityThreshold !== undefined;
      return false;
    };

    function updateOverride(field: string, value: number | string | undefined) {
      setKbSettingsOverrides(prev => {
        const next = structuredClone(prev ?? {});
        if (field === 'strategy') { next.chunking = { ...next.chunking, strategy: value as string }; }
        if (field === 'chunkSize') { next.chunking = { ...next.chunking, chunkSize: value as number }; }
        if (field === 'chunkOverlap') { next.chunking = { ...next.chunking, chunkOverlap: value as number }; }
        if (field === 'topK') { next.retrieval = { ...next.retrieval, topK: value as number }; }
        if (field === 'threshold') { next.retrieval = { ...next.retrieval, similarityThreshold: value as number }; }
        return next;
      });
      setKbSettingsDirty(true);
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xl font-semibold">设置</div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setEditMetaName(selectedKnowledgeBase!.name); setEditMetaDesc(selectedKnowledgeBase!.description); setEditMetaTags(selectedKnowledgeBase!.tags.join(', ')); setEditMetaOwner(selectedKnowledgeBase!.owner); setEditMetaModalOpen(true); }}>编辑知识库信息</Button>
            <Button variant="secondary" size="sm" onClick={() => onArchiveKnowledgeBase(selectedKnowledgeBase!.id)}>归档知识库</Button>
            <Button variant="secondary" size="sm" onClick={() => onCloneKnowledgeBase(selectedKnowledgeBase!.id)}>克隆知识库</Button>
          </div>
        </div>

        <div className="rounded-[20px] border border-[var(--color-border)] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">全局配置快照</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">最近更新：{ragConfig.updatedAt}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
            <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3 text-sm">OCR：{ragConfig.parser.enableOCR ? '启用' : '关闭'}</div>
            <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3 text-sm">保留文档结构：{ragConfig.parser.preserveDocumentStructure ? '启用' : '关闭'}</div>
            <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3 text-sm">重排序：{ragConfig.retrieval.rerankerEnabled ? '启用' : '关闭'}</div>
            <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3 text-sm">引用要求：{ragConfig.retrieval.citationRequired ? '必须引用' : '可选'}</div>
          </div>
        </div>

        <div className="rounded-[20px] border border-[var(--color-primary)] bg-[linear-gradient(180deg,rgba(179,92,32,0.03),rgba(255,255,255,1))] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold">知识库级覆盖配置</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">覆盖全局默认值，仅对当前知识库生效。留空则继承全局配置。</div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setKbSettingsOverrides(overrides); setKbSettingsDirty(false); }}>恢复</Button>
              <Button variant="secondary" size="sm" onClick={() => { setKbSettingsOverrides(undefined); setKbSettingsDirty(true); }}>清除覆盖</Button>
              <Button size="sm" disabled={!kbSettingsDirty} onClick={() => { if (selectedKnowledgeBase) { onUpdateKnowledgeBaseOverrides(selectedKnowledgeBase.id, activeOverrides); setKbSettingsDirty(false); } }}>保存覆盖</Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
            <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[var(--color-text-secondary)]">切片策略</span>
                {isOverridden('strategy') ? <Badge variant="yellow">已覆盖</Badge> : <Badge variant="gray">继承全局</Badge>}
              </div>
              <select className={inputCls} value={effectiveStrategy} onChange={e => updateOverride('strategy', e.target.value)}>
                <option value="by heading">按标题</option>
                <option value="by paragraph">按段落</option>
                <option value="fixed tokens">固定 tokens</option>
              </select>
            </div>
            <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[var(--color-text-secondary)]">Chunk Size</span>
                {isOverridden('chunkSize') ? <Badge variant="yellow">已覆盖</Badge> : <Badge variant="gray">继承全局</Badge>}
              </div>
              <input type="number" min="100" max="8000" className={inputCls} value={effectiveChunkSize} onChange={e => updateOverride('chunkSize', Number(e.target.value))} />
            </div>
            <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[var(--color-text-secondary)]">Chunk Overlap</span>
                {isOverridden('chunkOverlap') ? <Badge variant="yellow">已覆盖</Badge> : <Badge variant="gray">继承全局</Badge>}
              </div>
              <input type="number" min="0" max="8000" className={inputCls} value={effectiveChunkOverlap} onChange={e => updateOverride('chunkOverlap', Number(e.target.value))} />
            </div>
            <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[var(--color-text-secondary)]">Top K</span>
                {isOverridden('topK') ? <Badge variant="yellow">已覆盖</Badge> : <Badge variant="gray">继承全局</Badge>}
              </div>
              <input type="number" min="1" max="20" className={inputCls} value={effectiveTopK} onChange={e => updateOverride('topK', Number(e.target.value))} />
            </div>
            <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-[var(--color-text-secondary)]">相似度阈值</span>
                {isOverridden('threshold') ? <Badge variant="yellow">已覆盖</Badge> : <Badge variant="gray">继承全局</Badge>}
              </div>
              <input type="number" min="0.1" max="1.0" step="0.01" className={inputCls} value={effectiveThreshold} onChange={e => updateOverride('threshold', Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderDetail() {
    if (!selectedKnowledgeBase) return null;
    const tabs: Array<{ key: KnowledgeDetailTab; label: string }> = [
      { key: 'documents', label: '文档' },
      { key: 'ingestion', label: '接入流水线' },
      { key: 'retrieval-test', label: '召回测试' },
      { key: 'settings', label: '设置' },
    ];



    return (
      <div className="space-y-4">
        <div className="rounded-[22px] border border-[var(--color-border)] bg-white p-5">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="min-w-0 flex items-start gap-3 flex-1">
              <button
                type="button"
                onClick={onBackToKnowledgeList}
                className="mt-0.5 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-[10px] text-[var(--color-text-secondary)] hover:bg-[rgba(30,38,47,0.05)] hover:text-[var(--color-text)] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--color-text)] leading-tight">
                    {selectedKnowledgeBase.name}
                  </h1>
                  <Badge variant={statusVariant(selectedKnowledgeBase.status)} className="text-xs px-2.5 py-0.5">
                    {statusLabel(selectedKnowledgeBase.status)}
                  </Badge>
                </div>
                {selectedKnowledgeBase.description && (
                  <div className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed max-w-[640px]">
                    {selectedKnowledgeBase.description}
                  </div>
                )}
                {selectedKnowledgeBase.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {selectedKnowledgeBase.tags.map(tag => (
                      <Badge key={tag} variant="gray" className="text-[12px] px-2.5 py-0.5 font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] whitespace-nowrap flex-shrink-0 max-sm:items-start">
              <span>
                <span className="font-semibold text-[var(--color-text)]">{selectedKnowledgeBase.documentCount}</span>
                <span className="ml-1">文档</span>
              </span>
              <span className="w-[3px] h-[3px] rounded-full bg-[var(--color-text-light)]" />
              <span>
                <span className="font-semibold text-[var(--color-text)]">{selectedKnowledgeBase.tags.length}</span>
                <span className="ml-1">标签</span>
              </span>
              <span className="w-[3px] h-[3px] rounded-full bg-[var(--color-text-light)]" />
              <span>
                <span className="text-[var(--color-text-light)]">更新 </span>
                <span className="font-medium text-[var(--color-text-secondary)]">{selectedKnowledgeBase.updatedAt}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="border-b border-[var(--color-border-light)]">
          <nav className="flex items-center gap-0 -mb-px ml-5">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => onKnowledgeDetailTabChange(tab.key)}
                className={`relative px-1 py-3 mr-6 text-[14px] font-medium whitespace-nowrap transition-colors ${
                  knowledgeDetailTab === tab.key
                    ? 'text-[var(--color-text)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                {tab.label}
                {knowledgeDetailTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-primary)] rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {knowledgeDetailTab === 'documents' ? renderDocumentsTab() : null}
        {knowledgeDetailTab === 'ingestion' ? renderIngestionTab() : null}
        {knowledgeDetailTab === 'retrieval-test' ? renderRetrievalTab() : null}
        {knowledgeDetailTab === 'settings' ? renderSettingsTab() : null}
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

        <Modal open={editMetaModalOpen} onClose={() => setEditMetaModalOpen(false)} title="编辑知识库" actions={<Button size="sm" onClick={() => { if (editMetaName.trim() && selectedKnowledgeBase) { onUpdateKnowledgeBaseMeta(selectedKnowledgeBase.id, { name: editMetaName.trim(), description: editMetaDesc.trim() || undefined, tags: editMetaTags.split(/[,，]/).map(s => s.trim()).filter(Boolean), owner: editMetaOwner.trim() || undefined }); setEditMetaModalOpen(false); } }} disabled={!editMetaName.trim()}>保存</Button>}>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">名称</div>
              <input className={inputCls} value={editMetaName} onChange={e => setEditMetaName(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">描述</div>
              <textarea className={`${inputCls} h-20 py-2 resize-none`} value={editMetaDesc} onChange={e => setEditMetaDesc(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">标签（逗号分隔）</div>
              <input className={inputCls} value={editMetaTags} onChange={e => setEditMetaTags(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-secondary)] mb-1">负责人</div>
              <input className={inputCls} value={editMetaOwner} onChange={e => setEditMetaOwner(e.target.value)} />
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
                    title={!option.enabled ? '此数据源接入方式即将支持' : option.label}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    {!option.enabled ? <div className="text-[11px] text-[var(--color-text-light)] mt-1">即将支持</div> : null}
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
                      <select className={inputCls} value={knowledgeWizardDraft.scenario} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, scenario: event.target.value }))}>
                        {scenarioOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
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
