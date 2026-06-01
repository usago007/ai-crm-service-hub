import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState, FilterBar, StatCard } from '../../components/common/PageChrome';
import { Modal } from '../../components/common/Modal';
import type { KnowledgeBaseRecord } from '../../types/knowledge';
import { inputCls } from '../ai-console/sharedUtils';

interface KnowledgeListViewProps {
  knowledgeBases: KnowledgeBaseRecord[];
  filteredKnowledgeBases: KnowledgeBaseRecord[];
  allTags: string[];
  activeDocCount: number;
  syncingCount: number;
  tagFilter: string;
  sourceFilter: 'all' | KnowledgeBaseRecord['source'];
  search: string;
  showCreateModal: boolean;
  newKbName: string;
  newKbDesc: string;
  newKbTags: string;
  onTagFilterChange: (value: string) => void;
  onSourceFilterChange: (value: 'all' | KnowledgeBaseRecord['source']) => void;
  onSearchChange: (value: string) => void;
  onResetFilters: () => void;
  onOpenCreateModal: () => void;
  onCloseCreateModal: () => void;
  onNewKbNameChange: (value: string) => void;
  onNewKbDescChange: (value: string) => void;
  onNewKbTagsChange: (value: string) => void;
  onCreateKnowledgeBase: () => void;
  onOpenKnowledgeBase: (id: string) => void;
}

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

function renderKnowledgeIcon(icon: string, className = '') {
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#FFF3E7_0%,#FFE7D0_100%)] text-[13px] font-semibold tracking-[0.08em] text-[var(--color-primary)] ${className}`}>
      {icon}
    </div>
  );
}

export function KnowledgeListView({
  knowledgeBases,
  filteredKnowledgeBases,
  allTags,
  activeDocCount,
  syncingCount,
  tagFilter,
  sourceFilter,
  search,
  showCreateModal,
  newKbName,
  newKbDesc,
  newKbTags,
  onTagFilterChange,
  onSourceFilterChange,
  onSearchChange,
  onResetFilters,
  onOpenCreateModal,
  onCloseCreateModal,
  onNewKbNameChange,
  onNewKbDescChange,
  onNewKbTagsChange,
  onCreateKnowledgeBase,
  onOpenKnowledgeBase,
}: KnowledgeListViewProps) {
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
          <select className={inputCls} value={tagFilter} onChange={event => onTagFilterChange(event.target.value)}>
            <option value="all">全部标签</option>
            {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <select className={inputCls} value={sourceFilter} onChange={event => onSourceFilterChange(event.target.value as 'all' | KnowledgeBaseRecord['source'])}>
            <option value="all">全部来源</option>
            <option value="service_api">服务 API</option>
            <option value="external_api">外部知识库 API</option>
          </select>
          <input className={inputCls} value={search} onChange={event => onSearchChange(event.target.value)} placeholder="搜索知识库、负责人或描述" />
          <div className="filter-actions">
            <Button variant="secondary" size="sm" onClick={onResetFilters}>重置筛选</Button>
          </div>
        </FilterBar>

        <div className="grid grid-cols-[420px_repeat(2,minmax(300px,1fr))] gap-4 max-[1380px]:grid-cols-1">
          <button
            className="group min-h-[220px] rounded-[22px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#F4F7FF_0%,#F8FAFC_100%)] text-left p-6 hover:border-[var(--color-primary)] transition-colors"
            onClick={onOpenCreateModal}
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
                  <span>{base.documentCount} 个文档 · {base.collections.length} 个集合 · {base.referencedByScenarioIds.length} 个策略引用</span>
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
            action={<Button variant="secondary" size="sm" onClick={onResetFilters}>重置筛选</Button>}
          />
        ) : null}
      </div>

      <Modal open={showCreateModal} onClose={onCloseCreateModal} title="创建知识库" actions={<><Button variant="ghost" size="sm" onClick={onCloseCreateModal}>取消</Button><Button size="sm" onClick={onCreateKnowledgeBase} disabled={!newKbName.trim()}>确认创建</Button></>}>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">名称 <span className="text-[var(--color-danger)]">*</span></div>
            <input className={inputCls} value={newKbName} onChange={e => onNewKbNameChange(e.target.value)} placeholder="如：东南亚物流专项库" autoFocus />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">描述</div>
            <textarea className={`${inputCls} h-20 py-2 resize-none`} value={newKbDesc} onChange={e => onNewKbDescChange(e.target.value)} placeholder="描述知识库的用途和覆盖范围..." />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">标签（逗号分隔）</div>
            <input className={inputCls} value={newKbTags} onChange={e => onNewKbTagsChange(e.target.value)} placeholder="如：物流, 退款, 东南亚" />
          </div>
        </div>
      </Modal>
    </>
  );
}
