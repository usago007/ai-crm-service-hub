import { useMemo, useState } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { Toggle } from '../../../components/common/Toggle';
import { useBeforeUnload } from '../../../shared/hooks/useBeforeUnload';
import type { AIConsoleProps } from '../types';
import { Field, PageHeader, SectionCard } from '../shared';
import { inputCls } from '../sharedUtils';
import { displayScenario } from '../../../utils/display';

type Props = Pick<AIConsoleProps, 'ragConfig' | 'onUpdateRagConfig' | 'onOpenPage' | 'effectiveScenarioPolicies'>;

const PRESETS = {
  'high-quality': {
    label: '高质量',
    description: '重排序 + 高召回，适合对准确率要求极高的场景。',
    recipe: (cfg: AIConsoleProps['ragConfig']) => {
      cfg.retrieval.rerankerEnabled = true;
      cfg.retrieval.topK = 7;
      cfg.retrieval.similarityThreshold = 0.75;
      cfg.retrieval.queryRewriteEnabled = true;
      cfg.retrieval.citationRequired = true;
    },
  },
  'cost-optimized': {
    label: '成本优化',
    description: '关闭重排序，适合高频低风险查询场景。',
    recipe: (cfg: AIConsoleProps['ragConfig']) => {
      cfg.retrieval.rerankerEnabled = false;
      cfg.retrieval.topK = 4;
      cfg.retrieval.similarityThreshold = 0.78;
      cfg.retrieval.queryRewriteEnabled = false;
      cfg.retrieval.citationRequired = false;
    },
  },
  balanced: {
    label: '平衡模式',
    description: '返回当前已保存的默认配置。',
    recipe: (_cfg: AIConsoleProps['ragConfig']) => {
      // reset to current saved values — handled outside
    },
  },
} as const;

export function RagConfigPage({ ragConfig, onUpdateRagConfig, onOpenPage, effectiveScenarioPolicies }: Props) {
  const [draft, setDraft] = useState(ragConfig);
  const [dirty, setDirty] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const activeDraft = dirty ? draft : ragConfig;

  useBeforeUnload(dirty);
  const [confirmReset, setConfirmReset] = useState(false);
  const affectedScenarios = useMemo(
    () => effectiveScenarioPolicies.filter(item => item.manualReviewRequired || item.aiSuggestAllowed),
    [effectiveScenarioPolicies],
  );

  function mutate(recipe: (next: typeof draft) => void) {
    setDraft(prev => {
      const next = structuredClone(dirty ? prev : ragConfig);
      recipe(next);
      return next;
    });
    setDirty(true);
  }

  function applyPreset(key: string) {
    const preset = PRESETS[key as keyof typeof PRESETS];
    if (!preset) return;
    setActivePreset(key);
    setDraft(prev => {
      const next = structuredClone(key === 'balanced' ? ragConfig : dirty ? prev : ragConfig);
      if (key !== 'balanced') {
        preset.recipe(next);
      }
      return next;
    });
    setDirty(key !== 'balanced');
    if (key === 'balanced') setActivePreset(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="全局 RAG 配置" description="这里只定义环境级默认参数，不再直接操作具体文档资产。" />

      <SectionCard title="配置预设">
        <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-1">
          {(Object.entries(PRESETS) as Array<[string, typeof PRESETS[keyof typeof PRESETS]]>).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              className={`rounded-[18px] border p-4 text-left transition-colors ${activePreset === key ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)] shadow-[0_0_0_1px_rgba(179,92,32,0.12)]' : 'border-[var(--color-border-light)] bg-white hover:border-[var(--color-primary)]'}`}
              onClick={() => applyPreset(key)}
            >
              <div className="text-sm font-semibold">{preset.label}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-2 leading-5">{preset.description}</div>
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="text-xs text-[var(--color-text-secondary)]">最近更新：{activeDraft.updatedAt}</div>
          {affectedScenarios.length > 0 ? (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span>影响场景：</span>
              {affectedScenarios.slice(0, 6).map(item => (
                <Badge key={item.scenarioConfigId} variant={item.riskTone === 'red' ? 'red' : item.riskTone === 'yellow' ? 'yellow' : 'green'}>
                  {displayScenario(item.scenario)}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => dirty ? setConfirmReset(true) : undefined} disabled={!dirty}>恢复当前版本</Button>
          <Button variant="secondary" size="sm" onClick={() => onOpenPage('ai-console-rag-test-lab')}>在 RAG 调试台中测试</Button>
          <Button variant="secondary" size="sm" onClick={() => { const blob = new Blob([JSON.stringify(activeDraft, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `rag-config-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); }}>导出配置</Button>
          <Button variant="secondary" size="sm" onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'; input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (re) => { try { const parsed = JSON.parse(re.target?.result as string); if (parsed?.parser && parsed?.retrieval) { setDraft(parsed); setDirty(true); } } catch { /* invalid JSON ignored */ } }; reader.readAsText(file); }; input.click(); }}>导入配置</Button>
          <Button size="sm" disabled={!dirty} onClick={() => { void onUpdateRagConfig(activeDraft); setDirty(false); setActivePreset(null); }}>保存配置</Button>
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
          <Field label="Chunk Size"><input type="number" min="100" max="8000" className={inputCls} value={activeDraft.chunking.chunkSize} onChange={e => mutate(cfg => { cfg.chunking.chunkSize = Number(e.target.value); })} /></Field>
          <Field label="Chunk Overlap"><input type="number" min="0" max="8000" className={inputCls} value={activeDraft.chunking.chunkOverlap} onChange={e => mutate(cfg => { cfg.chunking.chunkOverlap = Number(e.target.value); })} /></Field>
          <Field label="Min Chunk Length"><input type="number" min="10" max="8000" className={inputCls} value={activeDraft.chunking.minChunkLength} onChange={e => mutate(cfg => { cfg.chunking.minChunkLength = Number(e.target.value); })} /></Field>
          <Field label="Max Chunk Length"><input type="number" min="10" max="8000" className={inputCls} value={activeDraft.chunking.maxChunkLength} onChange={e => mutate(cfg => { cfg.chunking.maxChunkLength = Number(e.target.value); })} /></Field>
          <Field label="保留源元数据"><div className="pt-2"><Toggle label="已启用" on={activeDraft.chunking.keepSourceMetadata} onClick={() => mutate(cfg => { cfg.chunking.keepSourceMetadata = !cfg.chunking.keepSourceMetadata; })} /></div></Field>
        </div>
      </SectionCard>

      <SectionCard title="向量配置">
        <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
          <Field label="向量模型"><input className={inputCls} value={activeDraft.embedding.model} onChange={e => mutate(cfg => { cfg.embedding.model = e.target.value; })} /></Field>
          <Field label="Batch Size"><input type="number" min="1" max="512" className={inputCls} value={activeDraft.embedding.batchSize} onChange={e => mutate(cfg => { cfg.embedding.batchSize = Number(e.target.value); })} /></Field>
          <Field label="Vector Dimension"><input type="number" min="128" max="4096" className={inputCls} value={activeDraft.embedding.vectorDimension} onChange={e => mutate(cfg => { cfg.embedding.vectorDimension = Number(e.target.value); })} /></Field>
          <Field label="Index Name"><input className={inputCls} value={activeDraft.embedding.indexName} onChange={e => mutate(cfg => { cfg.embedding.indexName = e.target.value; })} /></Field>
          <Field label="Index Version"><input className={inputCls} value={activeDraft.embedding.indexVersion} onChange={e => mutate(cfg => { cfg.embedding.indexVersion = e.target.value; })} /></Field>
          <Field label="文档级操作"><div className="pt-2 text-xs text-[var(--color-text-secondary)]">重建向量、发布、禁用等资产操作已移回知识库文档上下文，避免误操作到错误文档。</div></Field>
        </div>
      </SectionCard>

      <SectionCard title="检索配置">
        <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
          <Field label="Top K"><input type="number" min="1" max="20" className={inputCls} value={activeDraft.retrieval.topK} onChange={e => mutate(cfg => { cfg.retrieval.topK = Number(e.target.value); })} /></Field>
          <Field label="相似度阈值"><input type="number" min="0.1" max="1.0" step="0.01" className={inputCls} value={activeDraft.retrieval.similarityThreshold} onChange={e => mutate(cfg => { cfg.retrieval.similarityThreshold = Number(e.target.value); })} /></Field>
          <Field label="元数据过滤"><textarea className={`${inputCls} h-20 py-2 resize-none text-xs`} value={activeDraft.retrieval.metadataFilters.join('\n')} onChange={e => mutate(cfg => { cfg.retrieval.metadataFilters = e.target.value.split('\n').map(s => s.trim()).filter(Boolean); })} placeholder="每行一个过滤字段，如：scenario, language, country" /></Field>
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

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="恢复当前版本" actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>取消</Button>
          <Button size="sm" variant="danger" onClick={() => { setDraft(ragConfig); setDirty(false); setActivePreset(null); setConfirmReset(false); }}>确认恢复</Button>
        </div>
      }>
        <div className="text-sm">确定要恢复当前版本吗？所有未保存的更改将丢失。</div>
      </Modal>
    </div>
  );
}
