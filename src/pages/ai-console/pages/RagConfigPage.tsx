import { useMemo, useState } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { Toggle } from '../../../components/common/Toggle';
import { useBeforeUnload } from '../../../shared/hooks/useBeforeUnload';
import type { AIConsoleProps } from '../types';
import { Field } from '../shared';
import { inputCls } from '../sharedUtils';
import { displayScenario } from '../../../utils/display';
import { FileSearch, Layers, Sparkles, Zap } from 'lucide-react';

type Props = Pick<AIConsoleProps, 'ragConfig' | 'onUpdateRagConfig' | 'onOpenPage' | 'effectiveScenarioPolicies'>;

const PRESETS = {
  'high-quality': {
    label: '高质量',
    description: '重排序 + 高召回，适合对准确率要求极高的场景',
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
    description: '关闭重排序，适合高频低风险查询',
    recipe: (cfg: AIConsoleProps['ragConfig']) => {
      cfg.retrieval.rerankerEnabled = false;
      cfg.retrieval.topK = 4;
      cfg.retrieval.similarityThreshold = 0.78;
      cfg.retrieval.queryRewriteEnabled = false;
      cfg.retrieval.citationRequired = false;
    },
  },
  balanced: {
    label: '平衡',
    description: '恢复为当前已保存的默认配置',
    recipe: (_cfg: AIConsoleProps['ragConfig']) => {},
  },
} as const;

function PhaseLabel({ icon: Icon, label, description, color }: { icon: typeof FileSearch; label: string; description: string; color: string }) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <div className={`w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={16} />
      </div>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-5">{description}</div>
      </div>
    </div>
  );
}

export function RagConfigPage({ ragConfig, onUpdateRagConfig, onOpenPage, effectiveScenarioPolicies }: Props) {
  const [draft, setDraft] = useState(ragConfig);
  const [dirty, setDirty] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const activeDraft = dirty ? draft : ragConfig;

  useBeforeUnload(dirty);

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
      if (key !== 'balanced') preset.recipe(next);
      return next;
    });
    setDirty(key !== 'balanced');
    if (key === 'balanced') setActivePreset(null);
  }

  return (
    <div className="space-y-4">
      {/* Header with pipeline overview */}
      <div className="rounded-[24px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFC_100%)] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[20px] font-semibold tracking-[-0.02em]">全局 RAG 配置</div>
            <div className="text-sm text-[var(--color-text-secondary)] mt-1 leading-6">
              定义所有场景共用的默认参数。每个场景可在「AI 场景策略」中覆盖这些默认值。
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="secondary" size="sm" onClick={() => dirty ? setConfirmReset(true) : undefined} disabled={!dirty}>放弃更改</Button>
            <Button size="sm" disabled={!dirty} onClick={() => { void onUpdateRagConfig(activeDraft); setDirty(false); setActivePreset(null); }}>保存配置</Button>
          </div>
        </div>

        {/* Pipeline flow mini diagram */}
        <div className="mt-5 flex items-center gap-2 text-xs text-[var(--color-text-secondary)] overflow-x-auto pb-1">
          {[
            { label: '文档上传', icon: '1' },
            { label: '文本解析', icon: '2' },
            { label: '切片分段', icon: '3' },
            { label: '向量化', icon: '4' },
            { label: '相似检索', icon: '5' },
            { label: 'Prompt 组装', icon: '6' },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-2 flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-[rgba(179,92,32,0.1)] text-[var(--color-primary)] flex items-center justify-center text-[10px] font-bold">{step.icon}</div>
              <span className="whitespace-nowrap">{step.label}</span>
              {i < arr.length - 1 ? <div className="w-4 h-px bg-[var(--color-border)] mx-1" /> : null}
            </div>
          ))}
        </div>

        {/* Presets + quick actions row */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border-light)] flex items-center gap-3 flex-wrap">
          <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-light)] shrink-0">快速预设</span>
          {(Object.entries(PRESETS) as Array<[string, typeof PRESETS[keyof typeof PRESETS]]>).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              className={`rounded-[12px] border px-3 py-1.5 text-xs transition-colors ${activePreset === key ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)] text-[var(--color-primary)] font-medium' : 'border-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]'}`}
              onClick={() => applyPreset(key)}
            >
              {preset.label}
            </button>
          ))}
          <div className="w-px h-5 bg-[var(--color-border-light)] mx-1" />
          <Button variant="ghost" size="sm" onClick={() => onOpenPage('ai-console-rag-test-lab')}>在调试台中验证</Button>
        </div>
      </div>

      {/* Phase 1: Document Processing */}
      <div className="rounded-[24px] border border-[var(--color-border)] bg-white overflow-hidden">
        <div className="px-6 pt-5 pb-4 bg-[linear-gradient(180deg,rgba(179,92,32,0.03),transparent)]">
          <PhaseLabel icon={FileSearch} label="文档处理" description="控制文档如何被解析、清洗和切分为可检索的片段。" color="bg-[rgba(179,92,32,0.1)] text-[var(--color-primary)]" />
        </div>
        <div className="px-6 pb-5 space-y-5">
          <div>
            <div className="text-xs font-semibold text-[var(--color-text)] mb-3">文本解析 — 从原始文档中提取结构化内容</div>
            <div className="grid grid-cols-3 gap-2 max-[1000px]:grid-cols-2">
              <Toggle label="启用 OCR" on={activeDraft.parser.enableOCR} onClick={() => mutate(cfg => { cfg.parser.enableOCR = !cfg.parser.enableOCR; })} />
              <Toggle label="提取表格" on={activeDraft.parser.extractTables} onClick={() => mutate(cfg => { cfg.parser.extractTables = !cfg.parser.extractTables; })} />
              <Toggle label="提取标题层级" on={activeDraft.parser.extractHeadings} onClick={() => mutate(cfg => { cfg.parser.extractHeadings = !cfg.parser.extractHeadings; })} />
              <Toggle label="保留文档结构" on={activeDraft.parser.preserveDocumentStructure} onClick={() => mutate(cfg => { cfg.parser.preserveDocumentStructure = !cfg.parser.preserveDocumentStructure; })} />
              <Toggle label="移除冗余文本" on={activeDraft.parser.removeBoilerplateText} onClick={() => mutate(cfg => { cfg.parser.removeBoilerplateText = !cfg.parser.removeBoilerplateText; })} />
              <Toggle label="自动识别语言" on={activeDraft.parser.detectLanguage} onClick={() => mutate(cfg => { cfg.parser.detectLanguage = !cfg.parser.detectLanguage; })} />
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border-light)]">
            <div className="text-xs font-semibold text-[var(--color-text)] mb-3">文本分段 — 将长文档切分为适合检索的小片段</div>
            <div className="grid grid-cols-4 gap-3 max-[1000px]:grid-cols-2">
              <Field label="分段策略">
                <select className={inputCls} value={activeDraft.chunking.strategy} onChange={e => mutate(cfg => { cfg.chunking.strategy = e.target.value as typeof activeDraft.chunking.strategy; })}>
                  <option value="by heading">按标题</option>
                  <option value="by paragraph">按段落</option>
                  <option value="fixed tokens">按 Token 数</option>
                </select>
              </Field>
              <Field label="片段大小 (tokens)"><input type="number" min="100" max="8000" className={inputCls} value={activeDraft.chunking.chunkSize} onChange={e => mutate(cfg => { cfg.chunking.chunkSize = Number(e.target.value); })} /></Field>
              <Field label="片段重叠 (tokens)"><input type="number" min="0" max="8000" className={inputCls} value={activeDraft.chunking.chunkOverlap} onChange={e => mutate(cfg => { cfg.chunking.chunkOverlap = Number(e.target.value); })} /></Field>
              <Field label="最小/最大长度">
                <div className="flex gap-2">
                  <input type="number" min="10" max="8000" className={inputCls} value={activeDraft.chunking.minChunkLength} onChange={e => mutate(cfg => { cfg.chunking.minChunkLength = Number(e.target.value); })} />
                  <input type="number" min="10" max="8000" className={inputCls} value={activeDraft.chunking.maxChunkLength} onChange={e => mutate(cfg => { cfg.chunking.maxChunkLength = Number(e.target.value); })} />
                </div>
              </Field>
            </div>
            <div className="mt-3">
              <Toggle label="保留文档来源元数据" on={activeDraft.chunking.keepSourceMetadata} onClick={() => mutate(cfg => { cfg.chunking.keepSourceMetadata = !cfg.chunking.keepSourceMetadata; })} />
            </div>
          </div>
        </div>
      </div>

      {/* Phase 2: Vector & Retrieval */}
      <div className="rounded-[24px] border border-[var(--color-border)] bg-white overflow-hidden">
        <div className="px-6 pt-5 pb-4 bg-[linear-gradient(180deg,rgba(45,107,93,0.03),transparent)]">
          <PhaseLabel icon={Layers} label="向量化与检索" description="控制文本如何转换为向量、以及检索时的召回精度和过滤策略。" color="bg-[rgba(45,107,93,0.1)] text-[var(--color-accent)]" />
        </div>
        <div className="px-6 pb-5 space-y-5">
          <div>
            <div className="text-xs font-semibold text-[var(--color-text)] mb-3">向量化 — 调用 Embedding 模型将文本转为向量</div>
            <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
              <Field label="Embedding 模型"><input className={inputCls} value={activeDraft.embedding.model} onChange={e => mutate(cfg => { cfg.embedding.model = e.target.value; })} /></Field>
              <Field label="批处理大小"><input type="number" min="1" max="512" className={inputCls} value={activeDraft.embedding.batchSize} onChange={e => mutate(cfg => { cfg.embedding.batchSize = Number(e.target.value); })} /></Field>
              <Field label="向量维度"><input type="number" min="128" max="4096" className={inputCls} value={activeDraft.embedding.vectorDimension} onChange={e => mutate(cfg => { cfg.embedding.vectorDimension = Number(e.target.value); })} /></Field>
              <Field label="索引名称"><input className={inputCls} value={activeDraft.embedding.indexName} onChange={e => mutate(cfg => { cfg.embedding.indexName = e.target.value; })} /></Field>
              <Field label="索引版本"><input className={inputCls} value={activeDraft.embedding.indexVersion} onChange={e => mutate(cfg => { cfg.embedding.indexVersion = e.target.value; })} /></Field>
            </div>
          </div>
          <div className="pt-4 border-t border-[var(--color-border-light)]">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-xs font-semibold text-[var(--color-text)]">检索策略 — 控制查询时的召回精度与安全边界</div>
              {affectedScenarios.length > 0 ? (
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-light)]">
                  影响
                  {affectedScenarios.slice(0, 5).map(item => (
                    <Badge key={item.scenarioConfigId} variant={item.riskTone === 'red' ? 'red' : item.riskTone === 'yellow' ? 'yellow' : 'green'}>{displayScenario(item.scenario)}</Badge>
                  ))}
                  等场景
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
              <Field label="Top K（召回片段数）"><input type="number" min="1" max="20" className={inputCls} value={activeDraft.retrieval.topK} onChange={e => mutate(cfg => { cfg.retrieval.topK = Number(e.target.value); })} /></Field>
              <Field label="相似度阈值"><input type="number" min="0.1" max="1.0" step="0.01" className={inputCls} value={activeDraft.retrieval.similarityThreshold} onChange={e => mutate(cfg => { cfg.retrieval.similarityThreshold = Number(e.target.value); })} /></Field>
              <Field label="元数据过滤字段"><textarea className={`${inputCls} h-[44px] py-2 resize-none text-xs`} value={activeDraft.retrieval.metadataFilters.join('\n')} onChange={e => mutate(cfg => { cfg.retrieval.metadataFilters = e.target.value.split('\n').map(s => s.trim()).filter(Boolean); })} placeholder="每行一个字段，如 scenario" /></Field>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 max-[1000px]:grid-cols-1">
              <Toggle label="启用重排序 (Reranker)" on={activeDraft.retrieval.rerankerEnabled} onClick={() => mutate(cfg => { cfg.retrieval.rerankerEnabled = !cfg.retrieval.rerankerEnabled; })} />
              <Toggle label="启用查询改写 (Query Rewrite)" on={activeDraft.retrieval.queryRewriteEnabled} onClick={() => mutate(cfg => { cfg.retrieval.queryRewriteEnabled = !cfg.retrieval.queryRewriteEnabled; })} />
              <Toggle label="回复必须引用知识来源" on={activeDraft.retrieval.citationRequired} onClick={() => mutate(cfg => { cfg.retrieval.citationRequired = !cfg.retrieval.citationRequired; })} />
            </div>
          </div>
        </div>
      </div>

      {/* Phase 3: Prompt Assembly */}
      <div className="rounded-[24px] border border-[var(--color-border)] bg-white overflow-hidden">
        <div className="px-6 pt-5 pb-4 bg-[linear-gradient(180deg,rgba(139,92,246,0.03),transparent)]">
          <PhaseLabel icon={Sparkles} label="Prompt 组装" description="控制哪些上下文信息会被注入到发送给大模型的 Prompt 中。" color="bg-[rgba(139,92,246,0.1)] text-purple-600" />
        </div>
        <div className="px-6 pb-5 space-y-4">
          <div className="grid grid-cols-2 gap-y-1.5 max-[800px]:grid-cols-1">
            <Toggle label="注入客户画像（姓名/地区/价值分层）" on={activeDraft.promptAssembly.includeCustomerProfile} onClick={() => mutate(cfg => { cfg.promptAssembly.includeCustomerProfile = !cfg.promptAssembly.includeCustomerProfile; })} />
            <Toggle label="注入订单上下文（履约/支付/物流）" on={activeDraft.promptAssembly.includeOrderContext} onClick={() => mutate(cfg => { cfg.promptAssembly.includeOrderContext = !cfg.promptAssembly.includeOrderContext; })} />
            <Toggle label="注入会话历史" on={activeDraft.promptAssembly.includeConversationHistory} onClick={() => mutate(cfg => { cfg.promptAssembly.includeConversationHistory = !cfg.promptAssembly.includeConversationHistory; })} />
            <Toggle label="注入检索到的知识片段" on={activeDraft.promptAssembly.includeRetrievedChunks} onClick={() => mutate(cfg => { cfg.promptAssembly.includeRetrievedChunks = !cfg.promptAssembly.includeRetrievedChunks; })} />
            <Toggle label="注入业务规则" on={activeDraft.promptAssembly.includeBusinessRules} onClick={() => mutate(cfg => { cfg.promptAssembly.includeBusinessRules = !cfg.promptAssembly.includeBusinessRules; })} />
            <Toggle label="注入风险策略" on={activeDraft.promptAssembly.includeRiskPolicy} onClick={() => mutate(cfg => { cfg.promptAssembly.includeRiskPolicy = !cfg.promptAssembly.includeRiskPolicy; })} />
            <Toggle label="注入禁止声明列表" on={activeDraft.promptAssembly.includeBlockedClaims} onClick={() => mutate(cfg => { cfg.promptAssembly.includeBlockedClaims = !cfg.promptAssembly.includeBlockedClaims; })} />
          </div>
          <div className="pt-3 border-t border-[var(--color-border-light)]">
            <Field label="输出格式">
              <input className={inputCls} value={activeDraft.promptAssembly.outputFormat} onChange={e => mutate(cfg => { cfg.promptAssembly.outputFormat = e.target.value; })} placeholder="如：可编辑的回复草稿" />
            </Field>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="rounded-[20px] border border-[var(--color-border)] bg-white px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
          <Zap size={14} className="text-[var(--color-warning)]" />
          <span>最近更新：{activeDraft.updatedAt}</span>
          {dirty ? <Badge variant="yellow">有未保存的更改</Badge> : <Badge variant="green">已保存</Badge>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { const blob = new Blob([JSON.stringify(activeDraft, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `rag-config-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); }}>导出</Button>
          <Button variant="secondary" size="sm" onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'; input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (re) => { try { const parsed = JSON.parse(re.target?.result as string); if (parsed?.parser && parsed?.retrieval) { setDraft(parsed); setDirty(true); } } catch { /* ignore */ } }; reader.readAsText(file); }; input.click(); }}>导入</Button>
        </div>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="放弃更改" actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>取消</Button>
          <Button size="sm" variant="danger" onClick={() => { setDraft(ragConfig); setDirty(false); setActivePreset(null); setConfirmReset(false); }}>确认放弃</Button>
        </div>
      }>
        <div className="text-sm">确定要放弃所有未保存的更改吗？此操作不可撤销。</div>
      </Modal>
    </div>
  );
}
