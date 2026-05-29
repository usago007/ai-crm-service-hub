import type { ParserConfig, ChunkingConfig, EmbeddingConfig, RetrievalConfig, PromptAssemblyConfig, RagConfigSnapshot } from '../../../../types';
import { Toggle } from '../../../../components/common/Toggle';
import { Field } from '../../shared';
import { inputCls } from '../../sharedUtils';
import { displayScenario } from '../../../../utils/display';
import { Badge } from '../../../../components/common/Badge';
import { ConfigRow } from './ConfigRow';

/* -------------------------------------------------------------------------- */
/*  Shared mutate type                                                       */
/* -------------------------------------------------------------------------- */

type Mutate = (recipe: (cfg: RagConfigSnapshot) => void) => void;

/* -------------------------------------------------------------------------- */
/*  ParserPanel                                                              */
/* -------------------------------------------------------------------------- */

interface ParserPanelProps { config: ParserConfig; mutate: Mutate; changedKeys: Set<string>; }

export function ParserPanel({ config, mutate, changedKeys }: ParserPanelProps) {
  return (
    <div>
      <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--color-text)]">文本解析</h3>
      <p className="text-[12px] text-[var(--color-text-secondary)] mt-1 leading-5">设置文档解析方式，控制 OCR、表格提取、标题层级和语言识别策略。</p>
      <div className="mt-4 mb-5 border-t border-[var(--color-border-light)]" />

      <div className="mt-4">
        <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">解析功能开关</div>
        <ConfigRow title="启用 OCR" description="从扫描件和图片中识别文字内容。" modified={changedKeys.has('parser.enableOCR')}>
          <Toggle on={config.enableOCR} onClick={() => mutate(cfg => { cfg.parser.enableOCR = !cfg.parser.enableOCR; })} />
        </ConfigRow>
        <ConfigRow title="提取表格" description="将表格内容保留为结构化文本。" modified={changedKeys.has('parser.extractTables')}>
          <Toggle on={config.extractTables} onClick={() => mutate(cfg => { cfg.parser.extractTables = !cfg.parser.extractTables; })} />
        </ConfigRow>
        <ConfigRow title="提取标题层级" description="识别文档的标题和子标题结构。" modified={changedKeys.has('parser.extractHeadings')}>
          <Toggle on={config.extractHeadings} onClick={() => mutate(cfg => { cfg.parser.extractHeadings = !cfg.parser.extractHeadings; })} />
        </ConfigRow>
        <ConfigRow title="保留文档结构" description="保留原文的段落和排版信息。" modified={changedKeys.has('parser.preserveDocumentStructure')}>
          <Toggle on={config.preserveDocumentStructure} onClick={() => mutate(cfg => { cfg.parser.preserveDocumentStructure = !cfg.parser.preserveDocumentStructure; })} />
        </ConfigRow>
        <ConfigRow title="移除冗余文本" description="自动移除页眉、页脚和重复内容。" modified={changedKeys.has('parser.removeBoilerplateText')}>
          <Toggle on={config.removeBoilerplateText} onClick={() => mutate(cfg => { cfg.parser.removeBoilerplateText = !cfg.parser.removeBoilerplateText; })} />
        </ConfigRow>
        <ConfigRow title="自动识别语言" description="检测文档语言并适配解析策略。" modified={changedKeys.has('parser.detectLanguage')}>
          <Toggle on={config.detectLanguage} onClick={() => mutate(cfg => { cfg.parser.detectLanguage = !cfg.parser.detectLanguage; })} />
        </ConfigRow>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ChunkingPanel                                                            */
/* -------------------------------------------------------------------------- */

interface ChunkingPanelProps { config: ChunkingConfig; mutate: Mutate; changedKeys: Set<string>; }

export function ChunkingPanel({ config, mutate, changedKeys }: ChunkingPanelProps) {
  return (
    <div>
      <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--color-text)]">切片分段</h3>
      <p className="text-[12px] text-[var(--color-text-secondary)] mt-1 leading-5">控制文档切片大小、重叠比例、长度限制和来源元数据保留。</p>
      <div className="mt-4 mb-5 border-t border-[var(--color-border-light)]" />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Field label="分段策略">
          <select className={`${inputCls} max-w-[200px]`} value={config.strategy} onChange={e => mutate(cfg => { cfg.chunking.strategy = e.target.value as ChunkingConfig['strategy']; })}>
            <option value="by heading">按标题</option>
            <option value="by paragraph">按段落</option>
            <option value="fixed tokens">按 Token 数</option>
          </select>
        </Field>
        <Field label="片段大小 (tokens)">
          <input type="number" min={100} max={8000} className={`${inputCls} max-w-[160px]`} value={config.chunkSize} onChange={e => mutate(cfg => { cfg.chunking.chunkSize = Number(e.target.value); })} />
        </Field>
        <Field label="片段重叠 (tokens)">
          <input type="number" min={0} max={8000} className={`${inputCls} max-w-[160px]`} value={config.chunkOverlap} onChange={e => mutate(cfg => { cfg.chunking.chunkOverlap = Number(e.target.value); })} />
        </Field>
        <Field label="最小长度">
          <input type="number" min={10} max={8000} className={`${inputCls} max-w-[160px]`} value={config.minChunkLength} onChange={e => mutate(cfg => { cfg.chunking.minChunkLength = Number(e.target.value); })} />
        </Field>
        <Field label="最大长度">
          <input type="number" min={10} max={8000} className={`${inputCls} max-w-[160px]`} value={config.maxChunkLength} onChange={e => mutate(cfg => { cfg.chunking.maxChunkLength = Number(e.target.value); })} />
        </Field>
      </div>
      <div className="mt-4">
        <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">元数据保留</div>
        <ConfigRow title="保留文档来源元数据" description="在切片中保留原始文件名和路径信息。" modified={changedKeys.has('chunking.keepSourceMetadata')}>
          <Toggle on={config.keepSourceMetadata} onClick={() => mutate(cfg => { cfg.chunking.keepSourceMetadata = !cfg.chunking.keepSourceMetadata; })} />
        </ConfigRow>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  EmbeddingPanel                                                           */
/* -------------------------------------------------------------------------- */

interface EmbeddingPanelProps { config: EmbeddingConfig; mutate: Mutate; changedKeys: Set<string>; }

export function EmbeddingPanel({ config, mutate }: EmbeddingPanelProps) {
  return (
    <div>
      <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--color-text)]">向量化</h3>
      <p className="text-[12px] text-[var(--color-text-secondary)] mt-1 leading-5">配置 Embedding 模型、批处理大小、向量维度和索引信息。</p>
      <div className="mt-4 mb-5 border-t border-[var(--color-border-light)]" />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Embedding 模型">
          <input className={`${inputCls} max-w-[300px]`} value={config.model} onChange={e => mutate(cfg => { cfg.embedding.model = e.target.value; })} />
        </Field>
        <Field label="批处理大小">
          <input type="number" min={1} max={512} className={`${inputCls} max-w-[140px]`} value={config.batchSize} onChange={e => mutate(cfg => { cfg.embedding.batchSize = Number(e.target.value); })} />
        </Field>
        <Field label="向量维度">
          <input type="number" min={128} max={4096} className={`${inputCls} max-w-[160px]`} value={config.vectorDimension} onChange={e => mutate(cfg => { cfg.embedding.vectorDimension = Number(e.target.value); })} />
        </Field>
        <Field label="索引名称">
          <input className={`${inputCls} max-w-[250px]`} value={config.indexName} onChange={e => mutate(cfg => { cfg.embedding.indexName = e.target.value; })} />
        </Field>
        <Field label="索引版本">
          <input className={`${inputCls} max-w-[180px]`} value={config.indexVersion} onChange={e => mutate(cfg => { cfg.embedding.indexVersion = e.target.value; })} />
        </Field>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  RetrievalPanel                                                           */
/* -------------------------------------------------------------------------- */

interface ScenarioItem {
  scenarioConfigId: string;
  scenario: string;
  riskTone: 'red' | 'yellow' | 'green';
}

interface RetrievalPanelProps { config: RetrievalConfig; mutate: Mutate; affectedScenarios: ScenarioItem[]; changedKeys: Set<string>; }

export function RetrievalPanel({ config, mutate, affectedScenarios, changedKeys }: RetrievalPanelProps) {
  return (
    <div>
      <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--color-text)]">相似检索</h3>
      <p className="text-[12px] text-[var(--color-text-secondary)] mt-1 leading-5">控制召回数量、相似度阈值、元数据过滤字段和重排策略。</p>
      <div className="mt-4 mb-5 border-t border-[var(--color-border-light)]" />

      {affectedScenarios.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-light)] mb-4">
          <span>应用场景：</span>
          {affectedScenarios.slice(0, 5).map(item => (
            <Badge key={item.scenarioConfigId} variant={item.riskTone === 'red' ? 'red' : item.riskTone === 'yellow' ? 'yellow' : 'green'}>{displayScenario(item.scenario)}</Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Field label="Top K（召回片段数）">
          <input type="number" min={1} max={20} className={`${inputCls} max-w-[100px]`} value={config.topK} onChange={e => mutate(cfg => { cfg.retrieval.topK = Number(e.target.value); })} />
        </Field>
        <Field label="相似度阈值">
          <input type="number" min={0.1} max={1.0} step={0.01} className={`${inputCls} max-w-[140px]`} value={config.similarityThreshold} onChange={e => mutate(cfg => { cfg.retrieval.similarityThreshold = Number(e.target.value); })} />
        </Field>
      </div>

      <div className="mb-4">
        <Field label="元数据过滤字段">
          <textarea className={`${inputCls} w-full max-w-[500px] min-h-[80px] py-2 resize-y text-xs`} value={config.metadataFilters.join('\n')} onChange={e => mutate(cfg => { cfg.retrieval.metadataFilters = e.target.value.split('\n').map(s => s.trim()).filter(Boolean); })} placeholder="每行一个字段，如 scenario" />
        </Field>
      </div>

      <div className="rounded-[14px] border border-[var(--color-border-light)] bg-white overflow-hidden max-w-[760px] mt-4">
        <div className="px-5 py-3 border-b border-[var(--color-border-light)]">
          <div className="text-[13px] font-semibold text-[var(--color-text)]">检索增强功能</div>
          <div className="text-[11px] text-[var(--color-text-light)] mt-0.5">控制重排序、查询改写和引用策略。</div>
        </div>
        <div>
          <ConfigRow title="启用重排序" description="使用 Reranker 对召回结果二次排序以提高相关性。" modified={changedKeys.has('retrieval.rerankerEnabled')}>
            <Toggle on={config.rerankerEnabled} onClick={() => mutate(cfg => { cfg.retrieval.rerankerEnabled = !cfg.retrieval.rerankerEnabled; })} />
          </ConfigRow>
          <ConfigRow title="启用查询改写" description="自动改写用户查询以提高召回率。" modified={changedKeys.has('retrieval.queryRewriteEnabled')}>
            <Toggle on={config.queryRewriteEnabled} onClick={() => mutate(cfg => { cfg.retrieval.queryRewriteEnabled = !cfg.retrieval.queryRewriteEnabled; })} />
          </ConfigRow>
          <ConfigRow title="回复必须引用知识来源" description="未引用知识来源时拒绝生成回复。" modified={changedKeys.has('retrieval.citationRequired')}>
            <Toggle on={config.citationRequired} onClick={() => mutate(cfg => { cfg.retrieval.citationRequired = !cfg.retrieval.citationRequired; })} />
          </ConfigRow>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PromptAssemblyPanel                                                      */
/* -------------------------------------------------------------------------- */

interface PromptAssemblyPanelProps { config: PromptAssemblyConfig; mutate: Mutate; changedKeys: Set<string>; }

export function PromptAssemblyPanel({ config, mutate, changedKeys }: PromptAssemblyPanelProps) {
  return (
    <div>
      <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--color-text)]">Prompt 组装</h3>
      <p className="text-[12px] text-[var(--color-text-secondary)] mt-1 leading-5">控制客户上下文、知识片段、业务规则注入和输出格式。</p>
      <div className="mt-4 mb-5 border-t border-[var(--color-border-light)]" />

      <div className="space-y-5 mt-2">
        {/* Card 1: 客户与会话上下文 */}
        <div className="rounded-[14px] border border-[var(--color-border-light)] bg-white overflow-hidden max-w-[760px]">
          <div className="px-5 py-3 border-b border-[var(--color-border-light)]">
            <div className="text-[13px] font-semibold text-[var(--color-text)]">客户与会话上下文</div>
            <div className="text-[11px] text-[var(--color-text-light)] mt-0.5">控制客户画像、订单和会话历史信息是否注入 Prompt。</div>
          </div>
          <div>
            <ConfigRow title="注入客户画像" description="姓名、地区、价值分层。" modified={changedKeys.has('promptAssembly.includeCustomerProfile')}>
              <Toggle on={config.includeCustomerProfile} onClick={() => mutate(cfg => { cfg.promptAssembly.includeCustomerProfile = !cfg.promptAssembly.includeCustomerProfile; })} />
            </ConfigRow>
            <ConfigRow title="注入订单上下文" description="履约、支付、物流信息。" modified={changedKeys.has('promptAssembly.includeOrderContext')}>
              <Toggle on={config.includeOrderContext} onClick={() => mutate(cfg => { cfg.promptAssembly.includeOrderContext = !cfg.promptAssembly.includeOrderContext; })} />
            </ConfigRow>
            <ConfigRow title="注入会话历史" description="当前工单的完整对话记录。" modified={changedKeys.has('promptAssembly.includeConversationHistory')}>
              <Toggle on={config.includeConversationHistory} onClick={() => mutate(cfg => { cfg.promptAssembly.includeConversationHistory = !cfg.promptAssembly.includeConversationHistory; })} />
            </ConfigRow>
          </div>
        </div>

        {/* Card 2: 知识与规则上下文 */}
        <div className="rounded-[14px] border border-[var(--color-border-light)] bg-white overflow-hidden max-w-[760px]">
          <div className="px-5 py-3 border-b border-[var(--color-border-light)]">
            <div className="text-[13px] font-semibold text-[var(--color-text)]">知识与规则上下文</div>
            <div className="text-[11px] text-[var(--color-text-light)] mt-0.5">控制检索片段、业务规则、风险策略和禁止声明是否注入 Prompt。</div>
          </div>
          <div>
            <ConfigRow title="注入检索到的知识片段" description="将向量检索命中的文档片段注入 Prompt。" modified={changedKeys.has('promptAssembly.includeRetrievedChunks')}>
              <Toggle on={config.includeRetrievedChunks} onClick={() => mutate(cfg => { cfg.promptAssembly.includeRetrievedChunks = !cfg.promptAssembly.includeRetrievedChunks; })} />
            </ConfigRow>
            <ConfigRow title="注入业务规则" description="当前场景适用的业务约束和规则。" modified={changedKeys.has('promptAssembly.includeBusinessRules')}>
              <Toggle on={config.includeBusinessRules} onClick={() => mutate(cfg => { cfg.promptAssembly.includeBusinessRules = !cfg.promptAssembly.includeBusinessRules; })} />
            </ConfigRow>
            <ConfigRow title="注入风险策略" description="针对高风险场景的特殊处理策略。" modified={changedKeys.has('promptAssembly.includeRiskPolicy')}>
              <Toggle on={config.includeRiskPolicy} onClick={() => mutate(cfg => { cfg.promptAssembly.includeRiskPolicy = !cfg.promptAssembly.includeRiskPolicy; })} />
            </ConfigRow>
            <ConfigRow title="注入禁止声明列表" description="禁止模型输出的声明和承诺。" modified={changedKeys.has('promptAssembly.includeBlockedClaims')}>
              <Toggle on={config.includeBlockedClaims} onClick={() => mutate(cfg => { cfg.promptAssembly.includeBlockedClaims = !cfg.promptAssembly.includeBlockedClaims; })} />
            </ConfigRow>
          </div>
        </div>

        {/* Card 3: 输出控制 */}
        <div className="rounded-[14px] border border-[var(--color-border-light)] bg-white overflow-hidden max-w-[760px]">
          <div className="px-5 py-3 border-b border-[var(--color-border-light)]">
            <div className="text-[13px] font-semibold text-[var(--color-text)]">输出控制</div>
            <div className="text-[11px] text-[var(--color-text-light)] mt-0.5">配置输出格式、回复口径和人工审核策略。</div>
          </div>
          <div className="px-5 divide-y divide-[var(--color-border-light)]">
            <div className="py-3">
              <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block">输出格式</label>
              <select className={`${inputCls} max-w-[320px]`} value={config.outputFormat} onChange={e => mutate(cfg => { cfg.promptAssembly.outputFormat = e.target.value; })}>
                <option value="可编辑回复草稿">可编辑回复草稿</option>
                <option value="结构化处理建议">结构化处理建议</option>
                <option value="直接回复模板">直接回复模板</option>
                <option value="内部处理摘要">内部处理摘要</option>
              </select>
            </div>
            <div className="py-3">
              <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block">回复口径</label>
              <select className={`${inputCls} max-w-[320px]`} value={config.replyTone} onChange={e => mutate(cfg => { cfg.promptAssembly.replyTone = e.target.value as PromptAssemblyConfig['replyTone']; })}>
                <option value="concise">简洁</option>
                <option value="standard">标准</option>
                <option value="detailed">详细</option>
              </select>
            </div>
            <div className="py-3">
              <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block">人工审核策略</label>
              <select className={`${inputCls} max-w-[320px]`} value={config.manualReviewStrategy} onChange={e => mutate(cfg => { cfg.promptAssembly.manualReviewStrategy = e.target.value as PromptAssemblyConfig['manualReviewStrategy']; })}>
                <option value="all">全部需要人工确认</option>
                <option value="high_risk_only">仅高风险场景需要人工确认</option>
                <option value="low_risk_auto">低风险场景可自动发送</option>
              </select>
            </div>
            <div className="py-3">
              <label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block">示例预览</label>
              <div className="rounded-[10px] border border-[var(--color-border-light)] bg-[rgba(15,23,42,0.02)] px-4 py-3 text-[12px] text-[var(--color-text-secondary)] leading-5 max-w-[760px]">
                根据客户订单状态和知识库内容，生成一段可编辑的客服回复草稿，客服确认后再发送给客户。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
