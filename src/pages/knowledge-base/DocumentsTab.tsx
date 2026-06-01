import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/PageChrome';
import type { IngestionDocumentRecord, KnowledgeBaseRecord, KnowledgeDocument } from '../../types/knowledge';
import { displayLanguage, displayScenario } from '../../utils/display';
import { displayStageStatus, inputCls, stageVariant } from '../ai-console/sharedUtils';

interface DocumentsTabProps {
  selectedKnowledgeBase: KnowledgeBaseRecord;
  selectedDocuments: KnowledgeDocument[];
  selectedIngestionDocs: IngestionDocumentRecord[];
  documentTags: string[];
  documentTag: string;
  documentSearch: string;
  documentSort: 'latest' | 'name';
  onDocumentTagChange: (value: string) => void;
  onDocumentSearchChange: (value: string) => void;
  onDocumentSortChange: (value: 'latest' | 'name') => void;
  onOpenMetadata: () => void;
  onStartKnowledgeImport: (knowledgeBaseId?: string) => void;
  onResetDocumentFilters: () => void;
}

export function DocumentsTab({
  selectedKnowledgeBase,
  selectedDocuments,
  selectedIngestionDocs,
  documentTags,
  documentTag,
  documentSearch,
  documentSort,
  onDocumentTagChange,
  onDocumentSearchChange,
  onDocumentSortChange,
  onOpenMetadata,
  onStartKnowledgeImport,
  onResetDocumentFilters,
}: DocumentsTabProps) {
  const hasDocuments = selectedKnowledgeBase.documentIds.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">文档</div>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="grid grid-cols-[160px_200px_220px] gap-3 max-[900px]:grid-cols-1 flex-1">
          <select className={inputCls} value={documentTag} onChange={event => onDocumentTagChange(event.target.value)}>
            <option value="all">全部</option>
            {documentTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <input className={inputCls} value={documentSearch} onChange={event => onDocumentSearchChange(event.target.value)} placeholder="搜索文档" />
          <select className={inputCls} value={documentSort} onChange={event => onDocumentSortChange(event.target.value as 'latest' | 'name')}>
            <option value="latest">排序：上传时间</option>
            <option value="name">排序：文档名称</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onOpenMetadata}>元数据</Button>
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
            action={<Button variant="secondary" size="sm" onClick={onResetDocumentFilters}>重置文档筛选</Button>}
          />
        )
      )}
    </div>
  );
}
