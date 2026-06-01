import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { ServiceHubApi } from '../../api/contracts/serviceHub';
import type {
  KnowledgeBaseRecord,
  KnowledgeDetailTab,
  KnowledgeFlow,
  KnowledgeProcessingResult,
  KnowledgeWizardDraft,
  KnowledgeWizardStep,
  NavKey,
  ServiceHubSnapshot,
  Toast,
} from '../../types';
import { displayScenario } from '../../utils/display';
import { formatUiTimestamp } from '../lib/time';
import { createKnowledgeWizardDraft } from '../workflows/knowledgeWorkflow';

interface UseKnowledgeWorkflowOptions {
  apiRef: RefObject<ServiceHubApi>;
  snapshot: ServiceHubSnapshot;
  knowledgeBases: KnowledgeBaseRecord[];
  selectedKnowledgeBaseId: string | null;
  knowledgeWizardDraft: KnowledgeWizardDraft;
  knowledgeProcessingResult: KnowledgeProcessingResult | null;
  setSnapshot: Dispatch<SetStateAction<ServiceHubSnapshot>>;
  setKnowledgeBases: Dispatch<SetStateAction<KnowledgeBaseRecord[]>>;
  setSelectedKnowledgeBaseId: Dispatch<SetStateAction<string | null>>;
  setKnowledgeFlow: Dispatch<SetStateAction<KnowledgeFlow>>;
  setKnowledgeDetailTab: Dispatch<SetStateAction<KnowledgeDetailTab>>;
  setKnowledgeWizardStep: Dispatch<SetStateAction<KnowledgeWizardStep>>;
  setKnowledgeWizardDraft: Dispatch<SetStateAction<KnowledgeWizardDraft>>;
  setKnowledgeProcessingResult: Dispatch<SetStateAction<KnowledgeProcessingResult | null>>;
  setCurrentPage: Dispatch<SetStateAction<NavKey>>;
  pushToast: (message: string, type?: Toast['type']) => void;
  refreshWith: <T extends { snapshot: ServiceHubSnapshot }>(promise: Promise<T>) => Promise<T>;
}

const nowUiStamp = formatUiTimestamp;

export function useKnowledgeWorkflow({
  apiRef,
  snapshot,
  knowledgeBases,
  selectedKnowledgeBaseId,
  knowledgeWizardDraft,
  knowledgeProcessingResult,
  setSnapshot,
  setKnowledgeBases,
  setSelectedKnowledgeBaseId,
  setKnowledgeFlow,
  setKnowledgeDetailTab,
  setKnowledgeWizardStep,
  setKnowledgeWizardDraft,
  setKnowledgeProcessingResult,
  setCurrentPage,
  pushToast,
  refreshWith,
}: UseKnowledgeWorkflowOptions) {
  async function createKnowledgeDocumentFlow(payload: Parameters<ServiceHubApi['createKnowledgeDocument']>[0]) {
    const result = await refreshWith(apiRef.current.createKnowledgeDocument(payload));
    const documentId = result.document.id;
    if (result.document.publishStatus === 'version_conflict') {
      pushToast('已创建知识接入任务，当前文档因版本冲突进入失败分支', 'warning');
      return result;
    }
    const updateIngestionProgress = (delay: number, updater: (prev: ServiceHubSnapshot) => ServiceHubSnapshot) => {
      setTimeout(() => {
        setSnapshot(prev => updater(prev));
      }, delay);
    };
    updateIngestionProgress(700, prev => ({
      ...prev,
      ingestionDocuments: prev.ingestionDocuments.map(item => item.documentId === documentId ? { ...item, parseStatus: 'parsing', lastSync: new Date().toISOString().slice(0, 16).replace('T', ' ') } : item),
    }));
    updateIngestionProgress(1400, prev => ({
      ...prev,
      ingestionDocuments: prev.ingestionDocuments.map(item => item.documentId === documentId ? { ...item, parseStatus: 'parsed', parsedText: `文档《${item.documentName}》解析完成，已保留结构、标题与表格信息。`, lastSync: new Date().toISOString().slice(0, 16).replace('T', ' ') } : item),
    }));
    updateIngestionProgress(2200, prev => ({
      ...prev,
      ingestionDocuments: prev.ingestionDocuments.map(item => item.documentId === documentId ? { ...item, chunkStatus: 'chunking', chunkCount: 18, chunkIds: Array.from({ length: 18 }, (_, index) => `ING-CHUNK-${index + 1}`), lastSync: new Date().toISOString().slice(0, 16).replace('T', ' ') } : item),
    }));
    updateIngestionProgress(3000, prev => ({
      ...prev,
      ingestionDocuments: prev.ingestionDocuments.map(item => item.documentId === documentId ? { ...item, chunkStatus: 'indexed', embeddingStatus: 'embedded', vectorCount: item.chunkCount || 18, lastSync: new Date().toISOString().slice(0, 16).replace('T', ' ') } : item),
      knowledgeDocuments: prev.knowledgeDocuments.map(item => item.id === documentId ? { ...item, chunkCount: 18, vectorCount: 18, coverageScore: 78 } : item),
    }));
    updateIngestionProgress(3800, prev => ({
      ...prev,
      ingestionDocuments: prev.ingestionDocuments.map(item => item.documentId === documentId ? { ...item, embeddingStatus: 'indexed', indexStatus: 'published', lastSync: new Date().toISOString().slice(0, 16).replace('T', ' ') } : item),
      knowledgeDocuments: prev.knowledgeDocuments.map(item => item.id === documentId ? { ...item, publishStatus: 'published', chunkCount: 18, vectorCount: 18, coverageScore: 86 } : item),
      ingestionJobs: prev.ingestionJobs.map(item => item.documentId === documentId ? { ...item, status: 'published', detail: '文档已完成解析、切片、向量化并发布，可参与检索。', updatedAt: new Date().toISOString() } : item),
    }));
    pushToast('已创建知识接入任务', 'success');
    return result;
  }

  async function submitKnowledgeImportFlow() {
    const nextRagConfig = {
      ...snapshot.ragConfig,
      parser: structuredClone(knowledgeWizardDraft.parser),
      chunking: structuredClone(knowledgeWizardDraft.chunking),
      retrieval: structuredClone(knowledgeWizardDraft.retrieval),
    };
    await refreshWith(apiRef.current.updateRagConfig({ ragConfig: nextRagConfig }));

    const result = await createKnowledgeDocumentFlow({
      name: knowledgeWizardDraft.documentName || knowledgeWizardDraft.fileName || `${displayScenario(knowledgeWizardDraft.scenario)}资料-${Date.now()}.md`,
      sourceType: knowledgeWizardDraft.fileName.split('.').pop()?.toUpperCase() || 'MD',
      knowledgeType: knowledgeWizardDraft.knowledgeType,
      scenario: knowledgeWizardDraft.scenario,
      language: knowledgeWizardDraft.language,
      owner: knowledgeWizardDraft.owner,
      version: knowledgeWizardDraft.version,
      effectiveDate: knowledgeWizardDraft.effectiveDate,
    });
    const document = result.document;
    const targetId = knowledgeWizardDraft.knowledgeBaseId ?? selectedKnowledgeBaseId;
    if (targetId && document) {
      setKnowledgeBases(prev => prev.map(item => item.id === targetId ? {
        ...item,
        documentIds: item.documentIds.includes(document.id) ? item.documentIds : [document.id, ...item.documentIds],
        documentCount: item.documentIds.includes(document.id) ? item.documentIds.length : item.documentIds.length + 1,
        updatedAt: nowUiStamp(),
        status: item.status === 'draft' ? 'active' : item.status,
      } : item));
    }

    setKnowledgeWizardStep(3);
    setKnowledgeFlow('wizard');
    setKnowledgeProcessingResult({
      status: 'processing',
      knowledgeBaseId: targetId ?? null,
      documentId: document.id,
      documentName: document.name,
      sourceLabel: knowledgeWizardDraft.fileName || '已导入文本',
      chunkCount: 0,
      vectorCount: 0,
      indexMode: knowledgeWizardDraft.retrieval.rerankerEnabled ? '高质量检索' : '标准检索',
      processedAt: nowUiStamp(),
    });

    setTimeout(() => {
      if (document.publishStatus === 'version_conflict') {
        setKnowledgeProcessingResult(prev => prev && prev.documentId === document.id ? {
          ...prev,
          status: 'failed',
          failureReason: document.parseError ?? '检测到文档版本冲突，当前文件与已有入库记录存在重复或不一致内容。',
          failureStage: '写入知识库',
          processedAt: nowUiStamp(),
        } : prev);
        return;
      }
      setKnowledgeProcessingResult(prev => prev && prev.documentId === document.id ? {
        ...prev,
        status: 'success',
        chunkCount: Math.max(18, Math.round(knowledgeWizardDraft.chunking.chunkSize / 56)),
        vectorCount: Math.max(18, Math.round(knowledgeWizardDraft.chunking.chunkSize / 56)),
        processedAt: nowUiStamp(),
      } : prev);
    }, 2200);

    return result;
  }

  return {
    createKnowledgeDocument: createKnowledgeDocumentFlow,
    createKnowledgeBase(name: string, description?: string, tags?: string[]) {
      const nextId = `KB-CUSTOM-${Date.now()}`;
      const knowledgeBase: KnowledgeBaseRecord = {
        id: nextId,
        name: name.trim() || `新知识库 ${knowledgeBases.filter(item => item.id.startsWith('KB-CUSTOM-')).length + 1}`,
        description: description?.trim() || '用于承接新导入的业务资料、流程说明或场景 SOP。',
        icon: 'KB',
        tags: tags && tags.length > 0 ? tags : ['待整理'],
        documentCount: 0,
        updatedAt: nowUiStamp(),
        owner: '知识运营',
        source: 'service_api',
        status: 'draft',
        documentIds: [],
        collections: [],
        referencedByScenarioIds: [],
        referenceStats: { activeCount: 0, draftCount: 0 },
      };
      setKnowledgeBases(prev => [knowledgeBase, ...prev]);
      setSelectedKnowledgeBaseId(knowledgeBase.id);
      setKnowledgeDetailTab('documents');
      setKnowledgeFlow('detail');
      pushToast(`已创建知识库「${knowledgeBase.name}」`, 'success');
    },
    updateKnowledgeBaseMeta(id: string, updates: { name?: string; description?: string; tags?: string[]; owner?: string }) {
      setKnowledgeBases(prev => prev.map(kb => kb.id === id ? { ...kb, ...updates, updatedAt: nowUiStamp() } : kb));
      pushToast('已更新知识库信息', 'success');
    },
    updateKnowledgeBaseOverrides(id: string, configOverrides: KnowledgeBaseRecord['configOverrides']) {
      setKnowledgeBases(prev => prev.map(kb => kb.id === id ? { ...kb, configOverrides, updatedAt: nowUiStamp() } : kb));
      pushToast('已保存知识库配置覆盖', 'success');
    },
    archiveKnowledgeBase(id: string) {
      setKnowledgeBases(prev => prev.map(kb => kb.id === id ? { ...kb, status: 'draft' as const, updatedAt: nowUiStamp() } : kb));
      setKnowledgeFlow('list');
      pushToast('已归档知识库', 'info');
    },
    cloneKnowledgeBase(id: string) {
      const source = knowledgeBases.find(kb => kb.id === id);
      if (!source) return;
      const nextId = `KB-CLONE-${Date.now()}`;
      const clone: KnowledgeBaseRecord = {
        ...source,
        id: nextId,
        name: `${source.name} (副本)`,
        status: 'draft',
        documentIds: [...source.documentIds],
        collections: source.collections.map(collection => ({
          ...collection,
          id: collection.id.replace(source.id, nextId),
          knowledgeBaseId: nextId,
          status: 'draft',
        })),
        referencedByScenarioIds: [],
        referenceStats: { activeCount: 0, draftCount: 0, avgLatestScore: source.referenceStats.avgLatestScore },
        documentCount: source.documentCount,
        updatedAt: nowUiStamp(),
      };
      setKnowledgeBases(prev => [clone, ...prev]);
      setSelectedKnowledgeBaseId(nextId);
      setKnowledgeFlow('detail');
      pushToast(`已克隆知识库「${clone.name}」`, 'success');
    },
    openKnowledgeBase(id: string) {
      setSelectedKnowledgeBaseId(id);
      setKnowledgeDetailTab('documents');
      setKnowledgeFlow('detail');
    },
    backToKnowledgeList() {
      setKnowledgeFlow('list');
      setKnowledgeProcessingResult(null);
      setKnowledgeWizardStep(1);
    },
    startKnowledgeImport(knowledgeBaseId?: string) {
      const targetId = knowledgeBaseId ?? selectedKnowledgeBaseId ?? knowledgeBases[0]?.id ?? null;
      setSelectedKnowledgeBaseId(targetId);
      setKnowledgeWizardDraft(createKnowledgeWizardDraft(snapshot, targetId));
      setKnowledgeProcessingResult(null);
      setKnowledgeWizardStep(1);
      setKnowledgeFlow('wizard');
    },
    updateKnowledgeWizardDraft(updater: (prev: KnowledgeWizardDraft) => KnowledgeWizardDraft) {
      setKnowledgeWizardDraft(prev => updater(prev));
    },
    submitKnowledgeImport: submitKnowledgeImportFlow,
    finishKnowledgeImport(options?: { continueImport?: boolean; openRagTest?: boolean }) {
      if (options?.openRagTest) {
        setKnowledgeFlow('detail');
        setKnowledgeDetailTab('retrieval-test');
        setCurrentPage('ai-console-rag-test-lab');
        return;
      }
      if (options?.continueImport) {
        const targetId = knowledgeProcessingResult?.knowledgeBaseId ?? selectedKnowledgeBaseId;
        const refreshedDraft = createKnowledgeWizardDraft(snapshot, targetId ?? null);
        setKnowledgeWizardDraft(refreshedDraft);
        setKnowledgeWizardStep(1);
        setKnowledgeProcessingResult(null);
        setKnowledgeFlow('wizard');
        return;
      }
      setKnowledgeFlow('detail');
      setKnowledgeDetailTab('documents');
      setKnowledgeWizardStep(1);
      setKnowledgeProcessingResult(null);
    },
  };
}
