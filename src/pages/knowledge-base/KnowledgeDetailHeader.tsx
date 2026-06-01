import { ChevronLeft } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import type { KnowledgeBaseRecord, KnowledgeDetailTab } from '../../types/knowledge';

interface KnowledgeDetailHeaderProps {
  selectedKnowledgeBase: KnowledgeBaseRecord;
  knowledgeDetailTab: KnowledgeDetailTab;
  onBackToKnowledgeList: () => void;
  onKnowledgeDetailTabChange: (tab: KnowledgeDetailTab) => void;
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

export function KnowledgeDetailHeader({
  selectedKnowledgeBase,
  knowledgeDetailTab,
  onBackToKnowledgeList,
  onKnowledgeDetailTabChange,
}: KnowledgeDetailHeaderProps) {
  const tabs: Array<{ key: KnowledgeDetailTab; label: string }> = [
    { key: 'documents', label: '文档' },
    { key: 'ingestion', label: '接入流水线' },
    { key: 'retrieval-test', label: '召回测试' },
    { key: 'settings', label: '设置' },
  ];

  return (
    <>
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
            <span><span className="font-semibold text-[var(--color-text)]">{selectedKnowledgeBase.documentCount}</span><span className="ml-1">文档</span></span>
            <span className="w-[3px] h-[3px] rounded-full bg-[var(--color-text-light)]" />
            <span><span className="font-semibold text-[var(--color-text)]">{selectedKnowledgeBase.tags.length}</span><span className="ml-1">标签</span></span>
            <span className="w-[3px] h-[3px] rounded-full bg-[var(--color-text-light)]" />
            <span><span className="font-semibold text-[var(--color-text)]">{selectedKnowledgeBase.collections.length}</span><span className="ml-1">集合</span></span>
            <span className="w-[3px] h-[3px] rounded-full bg-[var(--color-text-light)]" />
            <span><span className="font-semibold text-[var(--color-text)]">{selectedKnowledgeBase.referencedByScenarioIds.length}</span><span className="ml-1">策略引用</span></span>
            <span className="w-[3px] h-[3px] rounded-full bg-[var(--color-text-light)]" />
            <span><span className="text-[var(--color-text-light)]">更新 </span><span className="font-medium text-[var(--color-text-secondary)]">{selectedKnowledgeBase.updatedAt}</span></span>
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
    </>
  );
}
