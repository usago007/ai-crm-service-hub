import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import type { KnowledgeBaseRecord, RagConfigSnapshot } from '../../types/knowledge';
import { inputCls } from '../ai-console/sharedUtils';

interface SettingsTabProps {
  selectedKnowledgeBase: KnowledgeBaseRecord;
  ragConfig: RagConfigSnapshot;
  activeOverrides: KnowledgeBaseRecord['configOverrides'];
  effectiveStrategy: RagConfigSnapshot['chunking']['strategy'];
  effectiveChunkSize: number;
  effectiveChunkOverlap: number;
  effectiveTopK: number;
  effectiveThreshold: number;
  kbSettingsDirty: boolean;
  isOverridden: (field: 'strategy' | 'chunkSize' | 'chunkOverlap' | 'topK' | 'threshold') => boolean;
  onOpenEditMeta: () => void;
  onArchiveKnowledgeBase: (id: string) => void;
  onCloneKnowledgeBase: (id: string) => void;
  onRestoreOverrides: () => void;
  onClearOverrides: () => void;
  onSaveOverrides: (overrides: KnowledgeBaseRecord['configOverrides']) => void;
  onUpdateOverride: (field: 'strategy' | 'chunkSize' | 'chunkOverlap' | 'topK' | 'threshold', value: number | string) => void;
}

export function SettingsTab({
  selectedKnowledgeBase,
  ragConfig,
  activeOverrides,
  effectiveStrategy,
  effectiveChunkSize,
  effectiveChunkOverlap,
  effectiveTopK,
  effectiveThreshold,
  kbSettingsDirty,
  isOverridden,
  onOpenEditMeta,
  onArchiveKnowledgeBase,
  onCloneKnowledgeBase,
  onRestoreOverrides,
  onClearOverrides,
  onSaveOverrides,
  onUpdateOverride,
}: SettingsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xl font-semibold">设置</div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onOpenEditMeta}>编辑知识库信息</Button>
          <Button variant="secondary" size="sm" onClick={() => onArchiveKnowledgeBase(selectedKnowledgeBase.id)}>归档知识库</Button>
          <Button variant="secondary" size="sm" onClick={() => onCloneKnowledgeBase(selectedKnowledgeBase.id)}>克隆知识库</Button>
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
            <Button variant="secondary" size="sm" onClick={onRestoreOverrides}>恢复</Button>
            <Button variant="secondary" size="sm" onClick={onClearOverrides}>清除覆盖</Button>
            <Button size="sm" disabled={!kbSettingsDirty} onClick={() => onSaveOverrides(activeOverrides)}>保存覆盖</Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
          <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[var(--color-text-secondary)]">切片策略</span>
              {isOverridden('strategy') ? <Badge variant="yellow">已覆盖</Badge> : <Badge variant="gray">继承全局</Badge>}
            </div>
            <select className={inputCls} value={effectiveStrategy} onChange={e => onUpdateOverride('strategy', e.target.value)}>
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
            <input type="number" min="100" max="8000" className={inputCls} value={effectiveChunkSize} onChange={e => onUpdateOverride('chunkSize', Number(e.target.value))} />
          </div>
          <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[var(--color-text-secondary)]">Chunk Overlap</span>
              {isOverridden('chunkOverlap') ? <Badge variant="yellow">已覆盖</Badge> : <Badge variant="gray">继承全局</Badge>}
            </div>
            <input type="number" min="0" max="8000" className={inputCls} value={effectiveChunkOverlap} onChange={e => onUpdateOverride('chunkOverlap', Number(e.target.value))} />
          </div>
          <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[var(--color-text-secondary)]">Top K</span>
              {isOverridden('topK') ? <Badge variant="yellow">已覆盖</Badge> : <Badge variant="gray">继承全局</Badge>}
            </div>
            <input type="number" min="1" max="20" className={inputCls} value={effectiveTopK} onChange={e => onUpdateOverride('topK', Number(e.target.value))} />
          </div>
          <div className="rounded-[14px] bg-[var(--color-bg)] px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[var(--color-text-secondary)]">相似度阈值</span>
              {isOverridden('threshold') ? <Badge variant="yellow">已覆盖</Badge> : <Badge variant="gray">继承全局</Badge>}
            </div>
            <input type="number" min="0.1" max="1.0" step="0.01" className={inputCls} value={effectiveThreshold} onChange={e => onUpdateOverride('threshold', Number(e.target.value))} />
          </div>
        </div>
      </div>
    </div>
  );
}
