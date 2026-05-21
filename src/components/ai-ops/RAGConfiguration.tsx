import { useState } from 'react';
import { useT } from '../../i18n';
import { Toggle } from '../common/Toggle';
import { RAG_CONFIG_DEFAULTS } from '../../data/aiOperations';

type RagConfig = typeof RAG_CONFIG_DEFAULTS;

export function RAGConfiguration() {
  const { t } = useT();
  const [cfg, setCfg] = useState<RagConfig>({ ...RAG_CONFIG_DEFAULTS, parser: { ...RAG_CONFIG_DEFAULTS.parser }, chunking: { ...RAG_CONFIG_DEFAULTS.chunking }, embedding: { ...RAG_CONFIG_DEFAULTS.embedding }, retrieval: { ...RAG_CONFIG_DEFAULTS.retrieval, metadataFilters: [...RAG_CONFIG_DEFAULTS.retrieval.metadataFilters] }, promptAssembly: { ...RAG_CONFIG_DEFAULTS.promptAssembly } });

  const updateParser = (k: keyof RagConfig['parser'], v: boolean) => setCfg(prev => ({ ...prev, parser: { ...prev.parser, [k]: v } }));
  const updateChunking = (k: keyof RagConfig['chunking'], v: string | number) => setCfg(prev => ({ ...prev, chunking: { ...prev.chunking, [k]: v } }));
  const updateEmbedding = (k: keyof RagConfig['embedding'], v: string | number) => setCfg(prev => ({ ...prev, embedding: { ...prev.embedding, [k]: v } }));
  const updateRetrieval = (k: keyof RagConfig['retrieval'], v: any) => setCfg(prev => ({ ...prev, retrieval: { ...prev.retrieval, [k]: v } }));
  const updatePrompt = (k: keyof RagConfig['promptAssembly'], v: boolean | string) => setCfg(prev => ({ ...prev, promptAssembly: { ...prev.promptAssembly, [k]: v } }));

  const showToast = (msg: string) => {
    const el = document.createElement('div');
    el.className = 'fixed bottom-4 right-4 bg-[var(--color-success)] text-white px-4 py-2 rounded-lg text-xs shadow-lg z-[9999]';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  };

  const cardCls = 'bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4';
  const titleCls = 'text-sm font-semibold mb-3';
  const inputCls = 'h-8 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 text-xs bg-white outline-none focus:border-[var(--color-primary)] w-full';
  const labelCls = 'text-xs text-[var(--color-text-secondary)] mb-1 block';

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className={cardCls}>
        <div className={titleCls}>{t.aiOps.parserConfig}</div>
        <Toggle label={t.aiOps.enableOCR} on={cfg.parser.enableOCR} onClick={() => updateParser('enableOCR', !cfg.parser.enableOCR)} />
        <Toggle label={t.aiOps.extractTables} on={cfg.parser.extractTables} onClick={() => updateParser('extractTables', !cfg.parser.extractTables)} />
        <Toggle label={t.aiOps.extractHeadings} on={cfg.parser.extractHeadings} onClick={() => updateParser('extractHeadings', !cfg.parser.extractHeadings)} />
        <Toggle label={t.aiOps.preserveStructure} on={cfg.parser.preserveStructure} onClick={() => updateParser('preserveStructure', !cfg.parser.preserveStructure)} />
      </div>

      <div className={cardCls}>
        <div className={titleCls}>{t.aiOps.chunkingConfig}</div>
        <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
          <div>
            <label className={labelCls}>{t.aiOps.strategy}</label>
            <select className={inputCls} value={cfg.chunking.strategy} onChange={e => updateChunking('strategy', e.target.value)}>
              {['by heading', 'paragraph', 'fixed tokens'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.chunkSize}</label>
            <input type="number" className={inputCls} value={cfg.chunking.chunkSize} onChange={e => updateChunking('chunkSize', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.chunkOverlap}</label>
            <input type="number" className={inputCls} value={cfg.chunking.chunkOverlap} onChange={e => updateChunking('chunkOverlap', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.minChunkLength}</label>
            <input type="number" className={inputCls} value={cfg.chunking.minChunkLength} onChange={e => updateChunking('minChunkLength', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.maxChunkLength}</label>
            <input type="number" className={inputCls} value={cfg.chunking.maxChunkLength} onChange={e => updateChunking('maxChunkLength', Number(e.target.value))} />
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <div className={titleCls}>{t.aiOps.embeddingConfig}</div>
        <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
          <div>
            <label className={labelCls}>{t.aiOps.embeddingModel}</label>
            <select className={inputCls} value={cfg.embedding.model} onChange={e => updateEmbedding('model', e.target.value)}>
              {['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.batchSize}</label>
            <input type="number" className={inputCls} value={cfg.embedding.batchSize} onChange={e => updateEmbedding('batchSize', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.indexName}</label>
            <input className={inputCls} value={cfg.embedding.indexName} onChange={e => updateEmbedding('indexName', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.indexVersion}</label>
            <input className={inputCls} value={cfg.embedding.indexVersion} onChange={e => updateEmbedding('indexVersion', e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="btn btn-secondary btn-sm" onClick={() => showToast(t.aiOps.rebuildStarted)}>{t.aiOps.rebuildIndex}</button>
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <div className={titleCls}>{t.aiOps.retrievalConfigCard}</div>
        <div className="grid grid-cols-3 gap-3 max-[1000px]:grid-cols-2">
          <div>
            <label className={labelCls}>{t.aiOps.topK}</label>
            <input type="number" className={inputCls} value={cfg.retrieval.topK} onChange={e => updateRetrieval('topK', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.similarityThreshold}</label>
            <input type="number" step="0.01" className={inputCls} value={cfg.retrieval.similarityThreshold} onChange={e => updateRetrieval('similarityThreshold', Number(e.target.value))} />
          </div>
          <div className="col-span-3 max-[1000px]:col-span-2">
            <Toggle label={t.aiOps.rerankerEnabled} on={cfg.retrieval.rerankerEnabled} onClick={() => updateRetrieval('rerankerEnabled', !cfg.retrieval.rerankerEnabled)} />
            <Toggle label={t.aiOps.queryRewriteEnabled} on={cfg.retrieval.queryRewriteEnabled} onClick={() => updateRetrieval('queryRewriteEnabled', !cfg.retrieval.queryRewriteEnabled)} />
            <Toggle label={t.aiOps.citationRequired} on={cfg.retrieval.citationRequired} onClick={() => updateRetrieval('citationRequired', !cfg.retrieval.citationRequired)} />
          </div>
          <div className="col-span-3 max-[1000px]:col-span-2">
            <label className={labelCls}>{t.aiOps.metadataFilters}</label>
            <div className="flex flex-wrap gap-1.5">
              {cfg.retrieval.metadataFilters.map(f => (
                <span key={f} className="px-2 py-0.5 bg-[var(--color-primary-bg)] text-[var(--color-primary)] rounded text-[11px] font-medium">{f}</span>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.noMatchFallback}</label>
            <select className={inputCls} value={cfg.retrieval.noMatchFallback} onChange={e => updateRetrieval('noMatchFallback', e.target.value)}>
              {['Ask agent to write manually', 'Use template reply', 'Route to human review'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.lowConfidenceFallback}</label>
            <select className={inputCls} value={cfg.retrieval.lowConfidenceFallback} onChange={e => updateRetrieval('lowConfidenceFallback', e.target.value)}>
              {['Route to human review', 'Use template reply', 'Show disclaimer'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.aiOps.sensitiveFallback}</label>
            <select className={inputCls} value={cfg.retrieval.sensitiveFallback} onChange={e => updateRetrieval('sensitiveFallback', e.target.value)}>
              {['Supervisor review', 'Route to human review', 'Block AI reply'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <div className={titleCls}>{t.aiOps.promptConfig}</div>
        <Toggle label={t.aiOps.includeCustomerProfile} on={cfg.promptAssembly.includeCustomerProfile} onClick={() => updatePrompt('includeCustomerProfile', !cfg.promptAssembly.includeCustomerProfile)} />
        <Toggle label={t.aiOps.includeOrderContext} on={cfg.promptAssembly.includeOrderContext} onClick={() => updatePrompt('includeOrderContext', !cfg.promptAssembly.includeOrderContext)} />
        <Toggle label={t.aiOps.includeConvHistory} on={cfg.promptAssembly.includeConvHistory} onClick={() => updatePrompt('includeConvHistory', !cfg.promptAssembly.includeConvHistory)} />
        <Toggle label={t.aiOps.includeRetrievedChunks} on={cfg.promptAssembly.includeRetrievedChunks} onClick={() => updatePrompt('includeRetrievedChunks', !cfg.promptAssembly.includeRetrievedChunks)} />
        <Toggle label={t.aiOps.includeBusinessRules} on={cfg.promptAssembly.includeBusinessRules} onClick={() => updatePrompt('includeBusinessRules', !cfg.promptAssembly.includeBusinessRules)} />
        <Toggle label={t.aiOps.includeBlockedClaims} on={cfg.promptAssembly.includeBlockedClaims} onClick={() => updatePrompt('includeBlockedClaims', !cfg.promptAssembly.includeBlockedClaims)} />
        <div className="mt-2">
          <label className={labelCls}>{t.aiOps.outputFormat}</label>
          <input className={inputCls} value={cfg.promptAssembly.outputFormat} onChange={e => updatePrompt('outputFormat', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
