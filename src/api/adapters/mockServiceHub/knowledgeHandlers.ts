import type { CreateKnowledgeDocumentRequest, IngestionActionRequest, ServiceHubApi } from '../../contracts/serviceHub';
import type { DocumentFilters, IngestionDocumentRecord, IngestionJob, KnowledgeDocument, ServiceHubSnapshot } from '../../../types';
import { applySearch, cloneSnapshot, nowIso, nowUiStamp, paginate, sortByKey, withServiceHealth } from './shared';

function filterDocuments(items: KnowledgeDocument[], filters: DocumentFilters) {
  return items.filter(item => {
    if (filters.scenario && item.scenario !== filters.scenario) return false;
    if (filters.language && item.language !== filters.language) return false;
    if (filters.publishStatus && item.publishStatus !== filters.publishStatus) return false;
    if (filters.owner && item.owner !== filters.owner) return false;
    return true;
  });
}

export function createKnowledgeHandlers(snapshot: ServiceHubSnapshot): Pick<
  ServiceHubApi,
  | 'getKnowledgeDocuments'
  | 'getKnowledgeDocument'
  | 'getFaqs'
  | 'getReplyTemplates'
  | 'getBusinessRules'
  | 'getPolicyDocs'
  | 'createKnowledgeDocument'
  | 'reindexKnowledgeDocument'
  | 'runIngestionAction'
> {
  return {
    async getKnowledgeDocuments(query) {
      const next = cloneSnapshot(snapshot);
      const filtered = applySearch(filterDocuments(next.knowledgeDocuments, query.filters), query.search, item => `${item.name} ${item.scenario} ${item.owner}`);
      return paginate(sortByKey(filtered, query.sortBy, query.sortOrder), query);
    },
    async getKnowledgeDocument(id: string) {
      return cloneSnapshot(snapshot).knowledgeDocuments.find(doc => doc.id === id);
    },
    async getFaqs() {
      return cloneSnapshot(snapshot).faqs;
    },
    async getReplyTemplates() {
      return cloneSnapshot(snapshot).replyTemplates;
    },
    async getBusinessRules() {
      return cloneSnapshot(snapshot).businessRules;
    },
    async getPolicyDocs() {
      return cloneSnapshot(snapshot).policyDocs;
    },
    async createKnowledgeDocument(request: CreateKnowledgeDocumentRequest) {
      const next = cloneSnapshot(snapshot);
      const document: KnowledgeDocument = {
        id: `DOC-${String(next.knowledgeDocuments.length + 1).padStart(3, '0')}`,
        name: request.name,
        sourceType: request.sourceType,
        knowledgeType: request.knowledgeType,
        scenario: request.scenario,
        language: request.language,
        owner: request.owner,
        version: request.version,
        publishStatus: request.scenario === 'Complaint' ? 'version_conflict' : 'parsing',
        effectiveDate: request.effectiveDate,
        chunkCount: 0,
        vectorCount: 0,
        coverageScore: 0,
        parseError: request.scenario === 'Complaint' ? '检测到文档版本冲突，当前文件与已有入库记录存在重复或不一致内容。' : undefined,
      };
      const job: IngestionJob = {
        id: `JOB-${String(next.ingestionJobs.length + 1).padStart(3, '0')}`,
        documentId: document.id,
        documentName: document.name,
        status: document.publishStatus,
        startedAt: nowIso(),
        updatedAt: nowIso(),
        detail: document.parseError ?? '文档已进入解析队列，等待切片与向量化。',
      };
      const ingestionDocument: IngestionDocumentRecord = {
        id: `ING-${String(next.ingestionDocuments.length + 1).padStart(3, '0')}`,
        documentId: document.id,
        documentName: document.name,
        sourceType: document.sourceType,
        knowledgeType: document.knowledgeType,
        scenario: document.scenario,
        language: document.language,
        owner: document.owner,
        version: document.version,
        effectiveDate: document.effectiveDate,
        parseStatus: 'uploaded',
        chunkStatus: 'pending',
        embeddingStatus: 'pending',
        indexStatus: 'pending',
        chunkCount: 0,
        vectorCount: 0,
        lastSync: nowUiStamp(),
        parsedText: `${document.name} 尚未完成解析，当前仅展示上传元数据。`,
        chunkIds: [],
        disabled: false,
      };
      next.knowledgeDocuments = [document, ...next.knowledgeDocuments];
      next.ingestionJobs = [job, ...next.ingestionJobs];
      next.ingestionDocuments = [ingestionDocument, ...next.ingestionDocuments];
      withServiceHealth(next);
      return { snapshot: next, job, document };
    },
    async reindexKnowledgeDocument(id: string) {
      const next = cloneSnapshot(snapshot);
      const job = next.ingestionJobs.find(item => item.documentId === id);
      const document = next.knowledgeDocuments.find(item => item.id === id);
      const ingestionDocument = next.ingestionDocuments.find(item => item.documentId === id);
      if (job && document) {
        job.status = document.publishStatus === 'expired' ? 'expired' : 'indexed';
        job.updatedAt = nowIso();
        job.detail = document.publishStatus === 'expired' ? '文档已过期，需先刷新知识内容后再重建索引。' : '模拟重建索引已完成，并重新进入发布队列。';
      }
      if (ingestionDocument) {
        ingestionDocument.embeddingStatus = document?.publishStatus === 'expired' ? 'failed' : 'embedded';
        ingestionDocument.indexStatus = document?.publishStatus === 'expired' ? 'failed' : 'indexed';
        ingestionDocument.vectorCount = ingestionDocument.chunkCount || Math.max(8, document?.chunkCount ?? 0);
        ingestionDocument.lastSync = nowUiStamp();
      }
      withServiceHealth(next);
      return { snapshot: next, job };
    },
    async runIngestionAction(request: IngestionActionRequest) {
      const next = cloneSnapshot(snapshot);
      const document = next.ingestionDocuments.find(item => item.documentId === request.documentId);
      const job = next.ingestionJobs.find(item => item.documentId === request.documentId);
      const knowledgeDocument = next.knowledgeDocuments.find(item => item.id === request.documentId);

      if (!document) {
        return { snapshot: next, document: undefined, message: '未找到文档记录。' };
      }

      if (request.action === 'view_parsed_text') {
        return { snapshot: next, document, parsedText: document.parsedText, message: '已打开解析文本。' };
      }

      if (request.action === 'view_chunks') {
        const chunks = next.knowledgeChunks.filter(chunk => chunk.documentId === request.documentId).map(chunk => chunk.content);
        const fallbackChunks = document.chunkIds.map((chunkId, index) => `分块 ${index + 1}（${chunkId}）：用于 ${document.scenario} 场景的知识检索与提示词组装。`);
        return { snapshot: next, document, chunks: chunks.length > 0 ? chunks : fallbackChunks, message: '已打开切片结果。' };
      }

      if (request.action === 'rebuild_embedding') {
        document.parseStatus = 'parsed';
        document.chunkStatus = 'indexed';
        document.embeddingStatus = 'embedded';
        document.indexStatus = 'indexed';
        document.vectorCount = Math.max(document.chunkCount, document.vectorCount || document.chunkCount || 12);
        document.lastSync = nowUiStamp();
        if (job) {
          job.status = 'indexed';
          job.updatedAt = nowIso();
          job.detail = '已重建向量并重新写入索引。';
        }
        if (knowledgeDocument) {
          knowledgeDocument.publishStatus = 'indexed';
          knowledgeDocument.vectorCount = document.vectorCount;
          knowledgeDocument.coverageScore = Math.max(knowledgeDocument.coverageScore, 82);
        }
        withServiceHealth(next);
        return { snapshot: next, document, message: '已完成重建向量。' };
      }

      if (request.action === 'publish') {
        document.parseStatus = 'parsed';
        document.chunkStatus = 'indexed';
        document.embeddingStatus = 'indexed';
        document.indexStatus = 'published';
        document.vectorCount = Math.max(document.vectorCount, document.chunkCount || 12);
        document.lastSync = nowUiStamp();
        if (job) {
          job.status = 'published';
          job.updatedAt = nowIso();
          job.detail = '文档已发布，可用于检索与 Prompt 组装。';
        }
        if (knowledgeDocument) {
          knowledgeDocument.publishStatus = 'published';
          knowledgeDocument.vectorCount = document.vectorCount;
          knowledgeDocument.coverageScore = Math.max(knowledgeDocument.coverageScore, 90);
        }
        withServiceHealth(next);
        return { snapshot: next, document, message: '文档已发布。' };
      }

      document.disabled = true;
      document.indexStatus = 'disabled';
      document.lastSync = nowUiStamp();
      if (job) {
        job.status = 'expired';
        job.updatedAt = nowIso();
        job.detail = '文档已禁用，不再参与检索。';
      }
      if (knowledgeDocument) {
        knowledgeDocument.publishStatus = 'expired';
      }
      withServiceHealth(next);
      return { snapshot: next, document, message: '文档已禁用。' };
    },
  };
}
