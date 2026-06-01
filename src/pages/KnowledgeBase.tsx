import { useMemo, useState } from 'react';
import { Badge } from '../components/common/Badge';
import type { BadgeVariant } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/PageChrome';
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
} from '../types/knowledge';
import { displayLanguage, displayScenario } from '../utils/display';
import { displayStageStatus, inputCls } from './ai-console/sharedUtils';
import {
  buildKnowledgeIngestionView,
  buildKnowledgeSettingsView,
  filterKnowledgeBases,
  getKnowledgeTags,
  type KnowledgeIngestionAction,
  selectDocumentTags,
  selectIngestionDocuments,
  selectKnowledgeDocuments,
  selectLatestRetrievalRuns,
} from '../shared/selectors/knowledgeViewModel';
import { KnowledgeDetailHeader } from './knowledge-base/KnowledgeDetailHeader';
import { KnowledgeListView } from './knowledge-base/KnowledgeListView';
import { DocumentsTab } from './knowledge-base/DocumentsTab';
import { IngestionTab } from './knowledge-base/IngestionTab';
import { ImportWizard } from './knowledge-base/ImportWizard';
import { RetrievalTab } from './knowledge-base/RetrievalTab';
import { SettingsTab } from './knowledge-base/SettingsTab';

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
  jobs: Array<{ id: string; documentId?: string; documentName: string; status: string; detail: string; updatedAt?: string }>;
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

const INGESTION_PAGE_SIZE = 10;

function statusLabel(status: KnowledgeBaseRecord['status']) {
  if (status === 'active') return '服务中';
  if (status === 'syncing') return '同步中';
  return '待整理';
}

function sourceLabel(source: KnowledgeBaseRecord['source']) {
  return source === 'service_api' ? '服务 API' : '外部知识库 API';
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
  const [kbSettingsDraft, setKbSettingsDraft] = useState<{
    knowledgeBaseId: string | null;
    overrides: KnowledgeBaseRecord['configOverrides'];
    dirty: boolean;
  }>({ knowledgeBaseId: null, overrides: undefined, dirty: false });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKbName, setNewKbName] = useState('');
  const [newKbDesc, setNewKbDesc] = useState('');
  const [newKbTags, setNewKbTags] = useState('');
  const [editMetaModalOpen, setEditMetaModalOpen] = useState(false);
  const [editMetaName, setEditMetaName] = useState('');
  const [editMetaDesc, setEditMetaDesc] = useState('');
  const [editMetaTags, setEditMetaTags] = useState('');
  const [editMetaOwner, setEditMetaOwner] = useState('');

  const kbSettingsDirty = kbSettingsDraft.knowledgeBaseId === selectedKnowledgeBase?.id && kbSettingsDraft.dirty;
  const kbSettingsOverrides = kbSettingsDraft.knowledgeBaseId === selectedKnowledgeBase?.id ? kbSettingsDraft.overrides : selectedKnowledgeBase?.configOverrides;

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

  function setKbOverrideDraft(overrides: KnowledgeBaseRecord['configOverrides'], dirty: boolean) {
    setKbSettingsDraft({
      knowledgeBaseId: selectedKnowledgeBase?.id ?? null,
      overrides,
      dirty,
    });
  }

  const allTags = useMemo(
    () => getKnowledgeTags(knowledgeBases),
    [knowledgeBases],
  );

  const filteredKnowledgeBases = useMemo(
    () => filterKnowledgeBases({ knowledgeBases, sourceFilter, tagFilter, search }),
    [knowledgeBases, search, sourceFilter, tagFilter],
  );

  const selectedDocuments = useMemo(
    () => selectKnowledgeDocuments({ selectedKnowledgeBase, knowledgeDocuments, documentTag, documentSearch, documentSort }),
    [documentSearch, documentSort, documentTag, knowledgeDocuments, selectedKnowledgeBase],
  );

  const selectedIngestionDocs = useMemo(
    () => selectIngestionDocuments(selectedKnowledgeBase, ingestionDocuments),
    [ingestionDocuments, selectedKnowledgeBase],
  );

  const ingestionView = useMemo(() => buildKnowledgeIngestionView({
    selectedKnowledgeBase,
    ingestionDocuments,
    jobs,
    ingestionSearch,
    ingestionStatusFilter,
    ingestionScenarioFilter,
    ingestionLanguageFilter,
    ingestionPage,
    pageSize: INGESTION_PAGE_SIZE,
    getStatusLabel: getOverallStatusLabel,
  }), [
    ingestionDocuments,
    ingestionLanguageFilter,
    ingestionPage,
    ingestionScenarioFilter,
    ingestionSearch,
    ingestionStatusFilter,
    jobs,
    selectedKnowledgeBase,
  ]);
  const ingestionOverview = ingestionView.overview;
  const ingestionMerged = ingestionView.merged;
  const ingestionUniqueScenarios = ingestionView.uniqueScenarios;
  const ingestionUniqueLanguages = ingestionView.uniqueLanguages;
  const ingestionFilteredMerged = ingestionView.filtered;
  const ingestionTotalPages = ingestionView.totalPages;
  const ingestionSafePage = ingestionView.safePage;
  const ingestionPaginatedMerged = ingestionView.paginated;

  const latestRetrievalRuns = useMemo(
    () => selectLatestRetrievalRuns(ragTestRuns, selectedKnowledgeBase, knowledgeDocuments),
    [ragTestRuns, selectedKnowledgeBase, knowledgeDocuments],
  );

  const [showAllRetrievalRuns, setShowAllRetrievalRuns] = useState(false);

  const documentTags = useMemo(() => selectDocumentTags(selectedKnowledgeBase, knowledgeDocuments), [knowledgeDocuments, selectedKnowledgeBase]);
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

  async function handleIngestionAction(documentId: string, action: KnowledgeIngestionAction) {
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
      <KnowledgeListView
        knowledgeBases={knowledgeBases}
        filteredKnowledgeBases={filteredKnowledgeBases}
        allTags={allTags}
        activeDocCount={activeDocCount}
        syncingCount={syncingCount}
        tagFilter={tagFilter}
        sourceFilter={sourceFilter}
        search={search}
        showCreateModal={showCreateModal}
        newKbName={newKbName}
        newKbDesc={newKbDesc}
        newKbTags={newKbTags}
        onTagFilterChange={setTagFilter}
        onSourceFilterChange={setSourceFilter}
        onSearchChange={setSearch}
        onResetFilters={() => { setSourceFilter('all'); setTagFilter('all'); setSearch(''); }}
        onOpenCreateModal={() => { setNewKbName(''); setNewKbDesc(''); setNewKbTags(''); setShowCreateModal(true); }}
        onCloseCreateModal={() => setShowCreateModal(false)}
        onNewKbNameChange={setNewKbName}
        onNewKbDescChange={setNewKbDesc}
        onNewKbTagsChange={setNewKbTags}
        onCreateKnowledgeBase={() => {
          if (!newKbName.trim()) return;
          onCreateKnowledgeBase(newKbName.trim(), newKbDesc.trim() || undefined, newKbTags.split(/[,，]/).map(s => s.trim()).filter(Boolean));
          setShowCreateModal(false);
        }}
        onOpenKnowledgeBase={onOpenKnowledgeBase}
      />
    );
  }

  function renderDocumentsTab() {
    if (!selectedKnowledgeBase) return null;
    return (
      <DocumentsTab
        selectedKnowledgeBase={selectedKnowledgeBase}
        selectedDocuments={selectedDocuments}
        selectedIngestionDocs={selectedIngestionDocs}
        documentTags={documentTags}
        documentTag={documentTag}
        documentSearch={documentSearch}
        documentSort={documentSort}
        onDocumentTagChange={setDocumentTag}
        onDocumentSearchChange={setDocumentSearch}
        onDocumentSortChange={setDocumentSort}
        onOpenMetadata={() => setMetadataModalOpen(true)}
        onStartKnowledgeImport={onStartKnowledgeImport}
        onResetDocumentFilters={() => { setDocumentTag('all'); setDocumentSearch(''); setDocumentSort('latest'); }}
      />
    );
  }

  function renderIngestionTab() {
    if (!selectedKnowledgeBase) return null;
    return (
      <IngestionTab
        selectedKnowledgeBase={selectedKnowledgeBase}
        ragConfig={ragConfig}
        ingestionOverview={ingestionOverview}
        ingestionMerged={ingestionMerged}
        ingestionFilteredMerged={ingestionFilteredMerged}
        ingestionPaginatedMerged={ingestionPaginatedMerged}
        ingestionUniqueScenarios={ingestionUniqueScenarios}
        ingestionUniqueLanguages={ingestionUniqueLanguages}
        ingestionSafePage={ingestionSafePage}
        ingestionTotalPages={ingestionTotalPages}
        ingestionSearch={ingestionSearch}
        ingestionStatusFilter={ingestionStatusFilter}
        ingestionScenarioFilter={ingestionScenarioFilter}
        ingestionLanguageFilter={ingestionLanguageFilter}
        openMore={openMore}
        onSearchChange={(value) => handleIngestionFilterChange(setIngestionSearch, value)}
        onStatusFilterChange={(value) => handleIngestionFilterChange(setIngestionStatusFilter, value)}
        onScenarioFilterChange={(value) => handleIngestionFilterChange(setIngestionScenarioFilter, value)}
        onLanguageFilterChange={(value) => handleIngestionFilterChange(setIngestionLanguageFilter, value)}
        onResetFilters={resetIngestionFilters}
        onPageChange={setIngestionPage}
        onOpenMoreChange={setOpenMore}
        onIngestionAction={(documentId, action) => { void handleIngestionAction(documentId, action); }}
        getOverallStatusLabel={getOverallStatusLabel}
      />
    );
  }

  function renderRetrievalTab() {
    return (
      <RetrievalTab
        latestRetrievalRuns={latestRetrievalRuns}
        showAllRetrievalRuns={showAllRetrievalRuns}
        retrievalExpandedRunId={retrievalExpandedRunId}
        onExpandedRunChange={setRetrievalExpandedRunId}
        onShowAllRetrievalRunsChange={setShowAllRetrievalRuns}
        onNavigateToRagTestLab={onNavigateToRagTestLab}
      />
    );
  }

  function renderSettingsTab() {
    const overrides = selectedKnowledgeBase?.configOverrides;
    const settingsView = buildKnowledgeSettingsView({
      baseOverrides: overrides,
      draftOverrides: kbSettingsOverrides,
      dirty: kbSettingsDirty,
      ragConfig,
    });
    const {
      activeOverrides,
      effectiveStrategy,
      effectiveChunkSize,
      effectiveChunkOverlap,
      effectiveTopK,
      effectiveThreshold,
      isOverridden,
    } = settingsView;

    function updateOverride(field: string, value: number | string | undefined) {
      setKbSettingsDraft(prev => {
        const base = prev.knowledgeBaseId === selectedKnowledgeBase?.id ? prev.overrides : overrides;
        const next = structuredClone(base ?? {});
        if (field === 'strategy') { next.chunking = { ...next.chunking, strategy: value as string }; }
        if (field === 'chunkSize') { next.chunking = { ...next.chunking, chunkSize: value as number }; }
        if (field === 'chunkOverlap') { next.chunking = { ...next.chunking, chunkOverlap: value as number }; }
        if (field === 'topK') { next.retrieval = { ...next.retrieval, topK: value as number }; }
        if (field === 'threshold') { next.retrieval = { ...next.retrieval, similarityThreshold: value as number }; }
        return { knowledgeBaseId: selectedKnowledgeBase?.id ?? null, overrides: next, dirty: true };
      });
    }

    if (!selectedKnowledgeBase) return null;
    return (
      <SettingsTab
        selectedKnowledgeBase={selectedKnowledgeBase}
        ragConfig={ragConfig}
        activeOverrides={activeOverrides}
        effectiveStrategy={effectiveStrategy as RagConfigSnapshot['chunking']['strategy']}
        effectiveChunkSize={effectiveChunkSize}
        effectiveChunkOverlap={effectiveChunkOverlap}
        effectiveTopK={effectiveTopK}
        effectiveThreshold={effectiveThreshold}
        kbSettingsDirty={kbSettingsDirty}
        isOverridden={isOverridden}
        onOpenEditMeta={() => {
          setEditMetaName(selectedKnowledgeBase.name);
          setEditMetaDesc(selectedKnowledgeBase.description);
          setEditMetaTags(selectedKnowledgeBase.tags.join(', '));
          setEditMetaOwner(selectedKnowledgeBase.owner);
          setEditMetaModalOpen(true);
        }}
        onArchiveKnowledgeBase={onArchiveKnowledgeBase}
        onCloneKnowledgeBase={onCloneKnowledgeBase}
        onRestoreOverrides={() => setKbOverrideDraft(overrides, false)}
        onClearOverrides={() => setKbOverrideDraft(undefined, true)}
        onSaveOverrides={(nextOverrides) => {
          onUpdateKnowledgeBaseOverrides(selectedKnowledgeBase.id, nextOverrides);
          setKbOverrideDraft(nextOverrides, false);
        }}
        onUpdateOverride={updateOverride}
      />
    );
  }

  function renderDetail() {
    if (!selectedKnowledgeBase) return null;
    return (
      <div className="space-y-4">
        <KnowledgeDetailHeader
          selectedKnowledgeBase={selectedKnowledgeBase}
          knowledgeDetailTab={knowledgeDetailTab}
          onBackToKnowledgeList={onBackToKnowledgeList}
          onKnowledgeDetailTabChange={onKnowledgeDetailTabChange}
        />

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

        <Modal open={editMetaModalOpen} onClose={() => setEditMetaModalOpen(false)} title="编辑知识库" actions={<><Button variant="ghost" size="sm" onClick={() => setEditMetaModalOpen(false)}>取消</Button><Button size="sm" onClick={() => { if (editMetaName.trim() && selectedKnowledgeBase) { onUpdateKnowledgeBaseMeta(selectedKnowledgeBase.id, { name: editMetaName.trim(), description: editMetaDesc.trim() || undefined, tags: editMetaTags.split(/[,，]/).map(s => s.trim()).filter(Boolean), owner: editMetaOwner.trim() || undefined }); setEditMetaModalOpen(false); } }} disabled={!editMetaName.trim()}>保存</Button></>}>
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
    return (
      <ImportWizard
        selectedKnowledgeBase={selectedKnowledgeBase}
        knowledgeWizardStep={knowledgeWizardStep}
        knowledgeWizardDraft={knowledgeWizardDraft}
        knowledgeProcessingResult={knowledgeProcessingResult}
        ragConfig={ragConfig}
        advancedOpen={advancedOpen}
        onAdvancedOpenChange={setAdvancedOpen}
        onKnowledgeWizardDraftChange={onKnowledgeWizardDraftChange}
        onKnowledgeWizardStepChange={onKnowledgeWizardStepChange}
        onSubmitKnowledgeImport={onSubmitKnowledgeImport}
        onFinishKnowledgeImport={onFinishKnowledgeImport}
        onStartKnowledgeImport={onStartKnowledgeImport}
        onBackToKnowledgeList={onBackToKnowledgeList}
      />
    );
  }

  if (knowledgeFlow === 'detail') return renderDetail();
  if (knowledgeFlow === 'wizard') return renderWizard();
  return renderList();
}
