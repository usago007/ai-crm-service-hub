import { useEffect, useMemo, useRef, useState } from 'react';
import type { AIConsoleProps } from '../../types';
import { Button } from '../../../../components/common/Button';
import { Modal } from '../../../../components/common/Modal';
import { useBeforeUnload } from '../../../../shared/hooks/useBeforeUnload';
import { ConfigStepSidebar } from './ConfigStepSidebar';
import { ParserPanel, ChunkingPanel, EmbeddingPanel, RetrievalPanel, PromptAssemblyPanel } from './StepPanels';
import type { RagConfigStep } from './configSteps';

/* -------------------------------------------------------------------------- */
/*  Types & constants                                                        */
/* -------------------------------------------------------------------------- */

type Props = Pick<AIConsoleProps, 'ragConfig' | 'onUpdateRagConfig' | 'onOpenPage' | 'effectiveScenarioPolicies'>;

const PRESET_LABELS: Record<string, string> = { balanced: '平衡', 'high-quality': '高质量', 'cost-optimized': '成本优先' };
const PRESET_ORDER = ['balanced', 'high-quality', 'cost-optimized'] as const;

const PRESETS = {
  'high-quality': {
    recipe: (cfg: AIConsoleProps['ragConfig']) => {
      cfg.retrieval.rerankerEnabled = true;
      cfg.retrieval.topK = 7;
      cfg.retrieval.similarityThreshold = 0.75;
      cfg.retrieval.queryRewriteEnabled = true;
      cfg.retrieval.citationRequired = true;
    },
  },
  'cost-optimized': {
    recipe: (cfg: AIConsoleProps['ragConfig']) => {
      cfg.retrieval.rerankerEnabled = false;
      cfg.retrieval.topK = 4;
      cfg.retrieval.similarityThreshold = 0.78;
      cfg.retrieval.queryRewriteEnabled = false;
      cfg.retrieval.citationRequired = false;
    },
  },
  balanced: {
    recipe: (_cfg: AIConsoleProps['ragConfig']) => {},
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function computeChangedKeys(saved: AIConsoleProps['ragConfig'], draft: AIConsoleProps['ragConfig']): Set<string> {
  const changed = new Set<string>();
  const sections = ['parser', 'chunking', 'embedding', 'retrieval', 'promptAssembly'] as const;
  for (const section of sections) {
    const orig = saved[section] as unknown as Record<string, unknown>;
    const curr = draft[section] as unknown as Record<string, unknown>;
    if (!orig || !curr) continue;
    for (const key of Object.keys(orig)) {
      if (JSON.stringify(orig[key]) !== JSON.stringify(curr[key])) {
        changed.add(`${section}.${key}`);
      }
    }
  }
  return changed;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                */
/* -------------------------------------------------------------------------- */

export function RagConfigPage({ ragConfig, onUpdateRagConfig, onOpenPage, effectiveScenarioPolicies }: Props) {
  const [draft, setDraft] = useState(ragConfig);
  const [dirty, setDirty] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeStep, setActiveStep] = useState<RagConfigStep>('parser');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeDraft = dirty ? draft : ragConfig;

  useBeforeUnload(dirty);

  /* ---- click-outside for menu ---- */

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  /* ---- responsive sidebar ---- */

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    setSidebarCollapsed(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarCollapsed(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* ---- changed keys ---- */

  const changedKeys = useMemo(
    () => (dirty ? computeChangedKeys(ragConfig, draft) : new Set<string>()),
    [ragConfig, draft, dirty],
  );

  /* ---- affected scenarios ---- */

  const affectedScenarios = useMemo(
    () => effectiveScenarioPolicies.filter(item => item.manualReviewRequired || item.aiSuggestAllowed),
    [effectiveScenarioPolicies],
  );

  /* ---- mutate & presets ---- */

  function mutate(recipe: (next: typeof draft) => void) {
    setDraft(prev => {
      const next = structuredClone(dirty ? prev : ragConfig);
      recipe(next);
      return next;
    });
    setDirty(true);
    setActivePreset(null);
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

  /* ---- save / discard ---- */

  function handleSave() {
    void onUpdateRagConfig(activeDraft);
    setDirty(false);
    setActivePreset(null);
  }

  function handleDiscard() {
    setDraft(ragConfig);
    setDirty(false);
    setActivePreset(null);
    setConfirmReset(false);
  }

  /* ---- export / import ---- */

  function handleExport() {
    const blob = new Blob([JSON.stringify(activeDraft, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rag-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      try {
        const parsed = JSON.parse(re.target?.result as string);
        if (parsed?.parser && parsed?.retrieval) {
          setDraft(parsed);
          setDirty(true);
          setActivePreset(null);
        } else {
          console.warn('导入的配置文件缺少必要字段 (parser / retrieval)');
        }
      } catch {
        console.warn('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  /* ---- render ---- */

  return (
    <div className="w-full max-w-[1280px] mx-auto">
      {/* Unified shell card */}
      <div className="shell-card rounded-[24px] overflow-hidden">

        {/* A. Header section */}
        <div className="px-6 py-5 border-b border-[var(--color-border-light)]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="text-[18px] font-semibold tracking-[-0.02em]">全局 RAG 配置</div>
              <div className="text-sm text-[var(--color-text-secondary)] mt-1 leading-6">
                定义所有场景共用的默认检索、切分、向量化与 Prompt 组装参数。
              </div>
              <div className="text-[11px] text-[var(--color-text-light)] mt-0.5">
                最近保存：{activeDraft.updatedAt} · {dirty ? <span className="text-[var(--color-warning)]">有未保存更改</span> : <span className="text-[var(--color-success)]">已保存</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 items-center">
              <div className="relative" ref={menuRef}>
                <Button variant="ghost" size="sm" onClick={() => setMenuOpen(v => !v)}>更多操作</Button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 rounded-[14px] border border-[var(--color-border-light)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] py-1 min-w-[140px]">
                    <button type="button" className="w-full text-left px-3 py-2 text-[13px] text-[var(--color-text)] hover:bg-[rgba(15,23,42,0.04)] transition-colors" onClick={() => { setMenuOpen(false); fileInputRef.current?.click(); }}>导入配置</button>
                    <button type="button" className="w-full text-left px-3 py-2 text-[13px] text-[var(--color-text)] hover:bg-[rgba(15,23,42,0.04)] transition-colors" onClick={() => { setMenuOpen(false); handleExport(); }}>导出配置</button>
                  </div>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => dirty ? setConfirmReset(true) : undefined} disabled={!dirty}>放弃更改</Button>
              <Button size="sm" disabled={!dirty} onClick={handleSave}>保存配置</Button>
            </div>
          </div>
        </div>

        {/* B. Preset toolbar */}
        <div className="px-6 py-3 border-b border-[var(--color-border-light)] bg-[rgba(255,255,255,0.4)] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[var(--color-text-secondary)] shrink-0">快速预设</span>
            <div className="rounded-[12px] bg-[rgba(15,23,42,0.05)] p-0.5 flex">
              {PRESET_ORDER.map(key => (
                <button
                  key={key}
                  type="button"
                  className={`px-3 py-1.5 text-xs rounded-[10px] transition-colors ${
                    activePreset === key
                      ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] text-[var(--color-text)] font-medium'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  }`}
                  onClick={() => applyPreset(key)}
                >
                  {PRESET_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenPage('ai-console-rag-test-lab')}>去调试台验证</Button>
        </div>

        {/* Hidden file input for import */}
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />

        {/* C. Main body */}
        <div className="flex">
          <ConfigStepSidebar activeStep={activeStep} onStepChange={setActiveStep} collapsed={sidebarCollapsed} />
          <div className="flex-1 min-w-0 p-6">
            <div className="max-w-[860px] w-full">
              {activeStep === 'parser' && <ParserPanel config={activeDraft.parser} mutate={mutate} changedKeys={changedKeys} />}
              {activeStep === 'chunking' && <ChunkingPanel config={activeDraft.chunking} mutate={mutate} changedKeys={changedKeys} />}
              {activeStep === 'embedding' && <EmbeddingPanel config={activeDraft.embedding} mutate={mutate} changedKeys={changedKeys} />}
              {activeStep === 'retrieval' && <RetrievalPanel config={activeDraft.retrieval} mutate={mutate} affectedScenarios={affectedScenarios} changedKeys={changedKeys} />}
              {activeStep === 'prompt' && <PromptAssemblyPanel config={activeDraft.promptAssembly} mutate={mutate} changedKeys={changedKeys} />}
            </div>
          </div>
        </div>

      </div>

      {/* Confirm reset modal */}
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="放弃更改" actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>取消</Button>
          <Button size="sm" variant="danger" onClick={handleDiscard}>确认放弃</Button>
        </div>
      }>
        <div className="text-sm">确定要放弃所有未保存的更改吗？此操作不可撤销。</div>
      </Modal>
    </div>
  );
}
