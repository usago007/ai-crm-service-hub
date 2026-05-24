import { useState } from 'react';
import { Button } from '../../../components/common/Button';
import { Toggle } from '../../../components/common/Toggle';
import type { AIConsoleProps } from '../types';
import { Field, PageHeader, SectionCard } from '../shared';
import { inputCls } from '../sharedUtils';

type Props = Pick<AIConsoleProps, 'ragConfig' | 'onUpdateRagConfig'>;

export function RagConfigPage({ ragConfig, onUpdateRagConfig }: Props) {
  const [draft, setDraft] = useState(ragConfig);
  const [dirty, setDirty] = useState(false);
  const activeDraft = dirty ? draft : ragConfig;

  function mutate(recipe: (next: typeof draft) => void) {
    setDraft(prev => {
      const next = structuredClone(dirty ? prev : ragConfig);
      recipe(next);
      return next;
    });
    setDirty(true);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="全局 RAG 配置" description="这里只定义环境级默认参数，不再直接操作具体文档资产。" />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-[var(--color-text-secondary)]">最近更新：{activeDraft.updatedAt}</div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setDraft(ragConfig); setDirty(false); }}>恢复当前版本</Button>
          <Button size="sm" disabled={!dirty} onClick={() => { void onUpdateRagConfig(activeDraft); setDirty(false); }}>保存配置</Button>
        </div>
      </div>

      <SectionCard title="解析配置">
        <Toggle label="启用 OCR" on={activeDraft.parser.enableOCR} onClick={() => mutate(cfg => { cfg.parser.enableOCR = !cfg.parser.enableOCR; })} />
        <Toggle label="提取表格" on={activeDraft.parser.extractTables} onClick={() => mutate(cfg => { cfg.parser.extractTables = !cfg.parser.extractTables; })} />
        <Toggle label="提取标题" on={activeDraft.parser.extractHeadings} onClick={() => mutate(cfg => { cfg.parser.extractHeadings = !cfg.parser.extractHeadings; })} />
        <Toggle label="保留文档结构" on={activeDraft.parser.preserveDocumentStructure} onClick={() => mutate(cfg => { cfg.parser.preserveDocumentStructure = !cfg.parser.preserveDocumentStructure; })} />
        <Toggle label="移除 boilerplate 文本" on={activeDraft.parser.removeBoilerplateText} onClick={() => mutate(cfg => { cfg.parser.removeBoilerplateText = !cfg.parser.removeBoilerplateText; })} />
        <Toggle label="自动识别语言" on={activeDraft.parser.detectLanguage} onClick={() => mutate(cfg => { cfg.parser.detectLanguage = !cfg.parser.detectLanguage; })} />
      </SectionCard>

      <SectionCard title="切片配置">
        <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
          <Field label="切片策略">
            <select className={inputCls} value={activeDraft.chunking.strategy} onChange={e => mutate(cfg => { cfg.chunking.strategy = e.target.value as typeof activeDraft.chunking.strategy; })}>
              <option value="by heading">按标题</option>
              <option value="by paragraph">按段落</option>
              <option value="fixed tokens">固定 tokens</option>
            </select>
          </Field>
          <Field label="Chunk Size"><input type="number" className={inputCls} value={activeDraft.chunking.chunkSize} onChange={e => mutate(cfg => { cfg.chunking.chunkSize = Number(e.target.value); })} /></Field>
          <Field label="Chunk Overlap"><input type="number" className={inputCls} value={activeDraft.chunking.chunkOverlap} onChange={e => mutate(cfg => { cfg.chunking.chunkOverlap = Number(e.target.value); })} /></Field>
          <Field label="Min Chunk Length"><input type="number" className={inputCls} value={activeDraft.chunking.minChunkLength} onChange={e => mutate(cfg => { cfg.chunking.minChunkLength = Number(e.target.value); })} /></Field>
          <Field label="Max Chunk Length"><input type="number" className={inputCls} value={activeDraft.chunking.maxChunkLength} onChange={e => mutate(cfg => { cfg.chunking.maxChunkLength = Number(e.target.value); })} /></Field>
          <Field label="保留源元数据"><div className="pt-2"><Toggle label="已启用" on={activeDraft.chunking.keepSourceMetadata} onClick={() => mutate(cfg => { cfg.chunking.keepSourceMetadata = !cfg.chunking.keepSourceMetadata; })} /></div></Field>
        </div>
      </SectionCard>

      <SectionCard title="向量配置">
        <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
          <Field label="向量模型"><input className={inputCls} value={activeDraft.embedding.model} onChange={e => mutate(cfg => { cfg.embedding.model = e.target.value; })} /></Field>
          <Field label="Batch Size"><input type="number" className={inputCls} value={activeDraft.embedding.batchSize} onChange={e => mutate(cfg => { cfg.embedding.batchSize = Number(e.target.value); })} /></Field>
          <Field label="Vector Dimension"><input type="number" className={inputCls} value={activeDraft.embedding.vectorDimension} onChange={e => mutate(cfg => { cfg.embedding.vectorDimension = Number(e.target.value); })} /></Field>
          <Field label="Index Name"><input className={inputCls} value={activeDraft.embedding.indexName} onChange={e => mutate(cfg => { cfg.embedding.indexName = e.target.value; })} /></Field>
          <Field label="Index Version"><input className={inputCls} value={activeDraft.embedding.indexVersion} onChange={e => mutate(cfg => { cfg.embedding.indexVersion = e.target.value; })} /></Field>
          <Field label="文档级操作"><div className="pt-2 text-xs text-[var(--color-text-secondary)]">重建向量、发布、禁用等资产操作已移回知识库文档上下文，避免误操作到错误文档。</div></Field>
        </div>
      </SectionCard>

      <SectionCard title="检索配置">
        <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
          <Field label="Top K"><input type="number" className={inputCls} value={activeDraft.retrieval.topK} onChange={e => mutate(cfg => { cfg.retrieval.topK = Number(e.target.value); })} /></Field>
          <Field label="相似度阈值"><input type="number" step="0.01" className={inputCls} value={activeDraft.retrieval.similarityThreshold} onChange={e => mutate(cfg => { cfg.retrieval.similarityThreshold = Number(e.target.value); })} /></Field>
          <Field label="元数据过滤"><div className="flex gap-1 flex-wrap pt-2 text-xs text-[var(--color-text-secondary)]">{activeDraft.retrieval.metadataFilters.join(' / ')}</div></Field>
          <Field label="无命中回退"><input className={inputCls} value={activeDraft.retrieval.noMatchFallback} onChange={e => mutate(cfg => { cfg.retrieval.noMatchFallback = e.target.value; })} /></Field>
          <Field label="低置信度回退"><input className={inputCls} value={activeDraft.retrieval.lowConfidenceFallback} onChange={e => mutate(cfg => { cfg.retrieval.lowConfidenceFallback = e.target.value; })} /></Field>
          <Field label="敏感场景回退"><input className={inputCls} value={activeDraft.retrieval.sensitiveCaseFallback} onChange={e => mutate(cfg => { cfg.retrieval.sensitiveCaseFallback = e.target.value; })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 max-[1000px]:grid-cols-1">
          <Toggle label="启用重排序" on={activeDraft.retrieval.rerankerEnabled} onClick={() => mutate(cfg => { cfg.retrieval.rerankerEnabled = !cfg.retrieval.rerankerEnabled; })} />
          <Toggle label="启用 Query Rewrite" on={activeDraft.retrieval.queryRewriteEnabled} onClick={() => mutate(cfg => { cfg.retrieval.queryRewriteEnabled = !cfg.retrieval.queryRewriteEnabled; })} />
          <Toggle label="必须引用" on={activeDraft.retrieval.citationRequired} onClick={() => mutate(cfg => { cfg.retrieval.citationRequired = !cfg.retrieval.citationRequired; })} />
        </div>
      </SectionCard>

      <SectionCard title="Prompt 组装配置">
        <div className="grid grid-cols-2 gap-2 max-[1000px]:grid-cols-1">
          <Toggle label="注入客户画像" on={activeDraft.promptAssembly.includeCustomerProfile} onClick={() => mutate(cfg => { cfg.promptAssembly.includeCustomerProfile = !cfg.promptAssembly.includeCustomerProfile; })} />
          <Toggle label="注入订单上下文" on={activeDraft.promptAssembly.includeOrderContext} onClick={() => mutate(cfg => { cfg.promptAssembly.includeOrderContext = !cfg.promptAssembly.includeOrderContext; })} />
          <Toggle label="注入会话历史" on={activeDraft.promptAssembly.includeConversationHistory} onClick={() => mutate(cfg => { cfg.promptAssembly.includeConversationHistory = !cfg.promptAssembly.includeConversationHistory; })} />
          <Toggle label="注入检索片段" on={activeDraft.promptAssembly.includeRetrievedChunks} onClick={() => mutate(cfg => { cfg.promptAssembly.includeRetrievedChunks = !cfg.promptAssembly.includeRetrievedChunks; })} />
          <Toggle label="注入业务规则" on={activeDraft.promptAssembly.includeBusinessRules} onClick={() => mutate(cfg => { cfg.promptAssembly.includeBusinessRules = !cfg.promptAssembly.includeBusinessRules; })} />
          <Toggle label="注入风险政策" on={activeDraft.promptAssembly.includeRiskPolicy} onClick={() => mutate(cfg => { cfg.promptAssembly.includeRiskPolicy = !cfg.promptAssembly.includeRiskPolicy; })} />
          <Toggle label="注入禁止承诺" on={activeDraft.promptAssembly.includeBlockedClaims} onClick={() => mutate(cfg => { cfg.promptAssembly.includeBlockedClaims = !cfg.promptAssembly.includeBlockedClaims; })} />
        </div>
        <Field label="输出格式">
          <input className={inputCls} value={activeDraft.promptAssembly.outputFormat} onChange={e => mutate(cfg => { cfg.promptAssembly.outputFormat = e.target.value; })} />
        </Field>
      </SectionCard>
    </div>
  );
}
