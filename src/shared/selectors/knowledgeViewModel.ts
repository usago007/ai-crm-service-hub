import type { IngestionDocumentRecord, KnowledgeBaseRecord, KnowledgeDocument, RagConfigSnapshot, RagTestRun } from '../../types';

export type KnowledgeIngestionJob = {
  id: string;
  documentId?: string;
  documentName: string;
  status: string;
  detail: string;
  updatedAt?: string;
};

export type KnowledgeIngestionRow = {
  doc: IngestionDocumentRecord;
  job?: KnowledgeIngestionJob;
};

export type KnowledgeIngestionAction = 'view_parsed_text' | 'view_chunks' | 'rebuild_embedding' | 'publish' | 'disable';
export type KnowledgeIngestionStageTone = 'done' | 'fail' | 'active' | 'pending';

export function getIngestionStages(doc: IngestionDocumentRecord) {
  return [
    { key: 'parse', label: '解析', status: doc.parseStatus },
    { key: 'chunk', label: '切片', status: doc.chunkStatus },
    { key: 'embed', label: '向量', status: doc.embeddingStatus },
    { key: 'index', label: '索引', status: doc.indexStatus },
  ];
}

export function getIngestionStageTone(status: string): KnowledgeIngestionStageTone {
  if (['completed', 'published'].includes(status)) return 'done';
  if (['failed', 'chunk_failed', 'embedding_failed'].includes(status)) return 'fail';
  if (['processing', 'indexing', 'parsing', 'parsed', 'indexed', 'uploaded'].includes(status)) return 'active';
  return 'pending';
}

export function getPrimaryIngestionAction(statusLabel: string): { label: string; action: KnowledgeIngestionAction } | null {
  if (statusLabel === '已发布') return { label: '查看解析', action: 'view_parsed_text' };
  if (statusLabel === '版本冲突') return { label: '查看解析', action: 'view_parsed_text' };
  if (statusLabel === '待处理') return { label: '发布', action: 'publish' };
  if (statusLabel === '失败') return { label: '重试', action: 'rebuild_embedding' };
  if (statusLabel === '处理中') return { label: '查看进度', action: 'view_parsed_text' };
  return null;
}

export function getMoreIngestionActions(statusLabel: string): Array<{ label: string; action: KnowledgeIngestionAction; danger?: boolean }> {
  if (statusLabel === '已发布') return [{ label: '重建索引', action: 'rebuild_embedding' }, { label: '禁用', action: 'disable', danger: true }];
  if (statusLabel === '失败') return [{ label: '查看解析', action: 'view_parsed_text' }, { label: '查看分块', action: 'view_chunks' }, { label: '重建索引', action: 'rebuild_embedding' }, { label: '禁用', action: 'disable', danger: true }];
  if (statusLabel === '版本冲突') return [{ label: '查看解析', action: 'view_parsed_text' }, { label: '查看分块', action: 'view_chunks' }, { label: '重建索引', action: 'rebuild_embedding' }, { label: '禁用', action: 'disable', danger: true }];
  if (statusLabel === '处理中') return [{ label: '查看解析', action: 'view_parsed_text' }, { label: '查看分块', action: 'view_chunks' }];
  return [{ label: '查看解析', action: 'view_parsed_text' }, { label: '禁用', action: 'disable', danger: true }];
}

export function getKnowledgeTags(knowledgeBases: KnowledgeBaseRecord[]) {
  return Array.from(new Set(knowledgeBases.flatMap(item => item.tags)));
}

export function filterKnowledgeBases({
  knowledgeBases,
  sourceFilter,
  tagFilter,
  search,
}: {
  knowledgeBases: KnowledgeBaseRecord[];
  sourceFilter: 'all' | KnowledgeBaseRecord['source'];
  tagFilter: string;
  search: string;
}) {
  const query = search.trim().toLowerCase();
  return knowledgeBases.filter(item => {
    if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
    if (tagFilter !== 'all' && !item.tags.includes(tagFilter)) return false;
    if (query && !`${item.name} ${item.description} ${item.owner}`.toLowerCase().includes(query)) return false;
    return true;
  });
}

export function selectKnowledgeDocuments({
  selectedKnowledgeBase,
  knowledgeDocuments,
  documentTag,
  documentSearch,
  documentSort,
}: {
  selectedKnowledgeBase: KnowledgeBaseRecord | null;
  knowledgeDocuments: KnowledgeDocument[];
  documentTag: string;
  documentSearch: string;
  documentSort: 'latest' | 'name';
}) {
  if (!selectedKnowledgeBase) return [];
  const query = documentSearch.trim().toLowerCase();
  const baseDocs = knowledgeDocuments.filter(item => selectedKnowledgeBase.documentIds.includes(item.id));
  const filtered = baseDocs.filter(item => {
    if (documentTag !== 'all' && item.scenario !== documentTag && item.knowledgeType !== documentTag) return false;
    if (query && !`${item.name} ${item.knowledgeType} ${item.owner}`.toLowerCase().includes(query)) return false;
    return true;
  });
  return filtered.sort((left, right) => {
    if (documentSort === 'name') return left.name.localeCompare(right.name);
    return right.effectiveDate.localeCompare(left.effectiveDate);
  });
}

export function selectIngestionDocuments(selectedKnowledgeBase: KnowledgeBaseRecord | null, ingestionDocuments: IngestionDocumentRecord[]) {
  if (!selectedKnowledgeBase) return [];
  return ingestionDocuments.filter(item => selectedKnowledgeBase.documentIds.includes(item.documentId));
}

export function selectDocumentTags(selectedKnowledgeBase: KnowledgeBaseRecord | null, knowledgeDocuments: KnowledgeDocument[]) {
  if (!selectedKnowledgeBase) return [];
  return Array.from(new Set(
    knowledgeDocuments
      .filter(item => selectedKnowledgeBase.documentIds.includes(item.id))
      .flatMap(item => [item.scenario, item.knowledgeType]),
  ));
}

export function buildKnowledgeIngestionView({
  selectedKnowledgeBase,
  ingestionDocuments,
  jobs,
  ingestionSearch,
  ingestionStatusFilter,
  ingestionScenarioFilter,
  ingestionLanguageFilter,
  ingestionPage,
  pageSize,
  getStatusLabel,
}: {
  selectedKnowledgeBase: KnowledgeBaseRecord | null;
  ingestionDocuments: IngestionDocumentRecord[];
  jobs: KnowledgeIngestionJob[];
  ingestionSearch: string;
  ingestionStatusFilter: string;
  ingestionScenarioFilter: string;
  ingestionLanguageFilter: string;
  ingestionPage: number;
  pageSize: number;
  getStatusLabel: (doc: IngestionDocumentRecord, job?: KnowledgeIngestionJob | null) => { label: string };
}) {
  const scopedJobs = selectedKnowledgeBase
    ? jobs.filter(job => selectedKnowledgeBase.documentIds.includes(job.documentId ?? ''))
    : jobs;
  const scopedDocs = selectedKnowledgeBase
    ? ingestionDocuments.filter(item => selectedKnowledgeBase.documentIds.includes(item.documentId))
    : ingestionDocuments;
  const overview = {
    jobs: scopedJobs,
    documents: scopedDocs,
    processingCount: scopedJobs.filter(item => ['uploaded', 'parsing', 'parsed', 'indexed'].includes(item.status)).length,
    publishedCount: scopedJobs.filter(item => item.status === 'published').length,
    exceptionCount: scopedJobs.filter(item => ['chunk_failed', 'embedding_failed', 'version_conflict', 'expired'].includes(item.status)).length,
  };
  const merged = overview.documents.map(doc => ({
    doc,
    job: overview.jobs.find(job => job.documentId === doc.documentId),
  }));
  const uniqueScenarios = Array.from(new Set(merged.map(item => item.doc.scenario)));
  const uniqueLanguages = Array.from(new Set(merged.map(item => item.doc.language)));
  let filtered = merged;

  if (ingestionSearch.trim()) {
    const query = ingestionSearch.trim().toLowerCase();
    filtered = filtered.filter(item => item.doc.documentName.toLowerCase().includes(query));
  }

  if (ingestionStatusFilter !== 'all') {
    filtered = filtered.filter(item => getStatusLabel(item.doc, item.job).label === ingestionStatusFilter);
  }

  if (ingestionScenarioFilter !== 'all') {
    filtered = filtered.filter(item => item.doc.scenario === ingestionScenarioFilter);
  }

  if (ingestionLanguageFilter !== 'all') {
    filtered = filtered.filter(item => item.doc.language === ingestionLanguageFilter);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(ingestionPage, totalPages);

  return {
    overview,
    merged,
    uniqueScenarios,
    uniqueLanguages,
    filtered,
    totalPages,
    safePage,
    paginated: filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
  };
}

export function selectLatestRetrievalRuns(
  ragTestRuns: RagTestRun[],
  selectedKnowledgeBase: KnowledgeBaseRecord | null,
  knowledgeDocuments: KnowledgeDocument[],
) {
  if (!selectedKnowledgeBase) return [];
  const documentIds = new Set(selectedKnowledgeBase.documentIds);
  const documentNames = new Set(
    knowledgeDocuments
      .filter(document => documentIds.has(document.id))
      .map(document => document.name),
  );
  return ragTestRuns
    .filter(run => run.retrievedChunks.some(chunk => documentNames.has(chunk.source) || documentIds.has(chunk.metadata.documentId ?? '')))
    .slice(0, 5);
}

export function buildKnowledgeSettingsView({
  baseOverrides,
  draftOverrides,
  dirty,
  ragConfig,
}: {
  baseOverrides: KnowledgeBaseRecord['configOverrides'];
  draftOverrides: KnowledgeBaseRecord['configOverrides'];
  dirty: boolean;
  ragConfig: RagConfigSnapshot;
}) {
  const activeOverrides = dirty ? draftOverrides : baseOverrides;
  const overriddenFields = {
    strategy: activeOverrides?.chunking?.strategy !== undefined,
    chunkSize: activeOverrides?.chunking?.chunkSize !== undefined,
    chunkOverlap: activeOverrides?.chunking?.chunkOverlap !== undefined,
    topK: activeOverrides?.retrieval?.topK !== undefined,
    threshold: activeOverrides?.retrieval?.similarityThreshold !== undefined,
  };

  return {
    activeOverrides,
    effectiveStrategy: activeOverrides?.chunking?.strategy ?? ragConfig.chunking.strategy,
    effectiveChunkSize: activeOverrides?.chunking?.chunkSize ?? ragConfig.chunking.chunkSize,
    effectiveChunkOverlap: activeOverrides?.chunking?.chunkOverlap ?? ragConfig.chunking.chunkOverlap,
    effectiveTopK: activeOverrides?.retrieval?.topK ?? ragConfig.retrieval.topK,
    effectiveThreshold: activeOverrides?.retrieval?.similarityThreshold ?? ragConfig.retrieval.similarityThreshold,
    isOverridden(field: keyof typeof overriddenFields) {
      return overriddenFields[field];
    },
  };
}
