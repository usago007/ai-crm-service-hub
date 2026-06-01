import { ChevronDown, ChevronLeft, ChevronRight, CircleCheck, XCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/PageChrome';
import type { KnowledgeBaseRecord, KnowledgeProcessingResult, KnowledgeWizardDraft, KnowledgeWizardStep, RagConfigSnapshot } from '../../types/knowledge';
import { displayScenario } from '../../utils/display';
import { inputCls } from '../ai-console/sharedUtils';
import { scenarioOptions } from '../ai-console/types';

interface ImportWizardProps {
  selectedKnowledgeBase: KnowledgeBaseRecord | null;
  knowledgeWizardStep: KnowledgeWizardStep;
  knowledgeWizardDraft: KnowledgeWizardDraft;
  knowledgeProcessingResult: KnowledgeProcessingResult | null;
  ragConfig: RagConfigSnapshot;
  advancedOpen: boolean;
  onAdvancedOpenChange: (updater: (prev: boolean) => boolean) => void;
  onKnowledgeWizardDraftChange: (updater: (prev: KnowledgeWizardDraft) => KnowledgeWizardDraft) => void;
  onKnowledgeWizardStepChange: (step: KnowledgeWizardStep) => void;
  onSubmitKnowledgeImport: () => void;
  onFinishKnowledgeImport: (options?: { continueImport?: boolean; openRagTest?: boolean }) => void;
  onStartKnowledgeImport: (knowledgeBaseId?: string) => void;
  onBackToKnowledgeList: () => void;
}

const SOURCE_OPTIONS = [
  { key: 'file', label: '导入已有文本', enabled: true },
  { key: 'notion', label: '同步自 Notion 内容', enabled: false },
  { key: 'web', label: '同步自 Web 站点', enabled: false },
] as const;

const SAMPLE_FILES = [
  { fileName: '2026-05-08_调研 open-slide 使用方法.md', size: '408.97 KB', scenario: 'Product Inquiry', knowledgeType: 'Product Spec', language: 'ZH' },
  { fileName: '欧区退款说明_v3.0.docx', size: '1.8 MB', scenario: 'Refund', knowledgeType: 'Policy', language: 'EN' },
  { fileName: '投诉赔偿审批清单.pdf', size: '856 KB', scenario: 'Complaint', knowledgeType: 'Business Rule', language: 'ZH' },
] as const;

export function ImportWizard({
  selectedKnowledgeBase,
  knowledgeWizardStep,
  knowledgeWizardDraft,
  knowledgeProcessingResult,
  ragConfig,
  advancedOpen,
  onAdvancedOpenChange,
  onKnowledgeWizardDraftChange,
  onKnowledgeWizardStepChange,
  onSubmitKnowledgeImport,
  onFinishKnowledgeImport,
  onStartKnowledgeImport,
  onBackToKnowledgeList,
}: ImportWizardProps) {
  const canContinueStep1 = Boolean(knowledgeWizardDraft.fileName.trim());
  const stepTitle = knowledgeWizardStep === 1 ? '选择数据源' : knowledgeWizardStep === 2 ? '确认文档处理方式' : knowledgeProcessingResult?.status === 'failed' ? '处理未完成' : '处理完成';

  function handleBackToDetail() {
    if (selectedKnowledgeBase) {
      onFinishKnowledgeImport();
      return;
    }
    onBackToKnowledgeList();
  }

  function applySample(fileName: string) {
    const sample = SAMPLE_FILES.find(item => item.fileName === fileName);
    if (!sample) return;
    onKnowledgeWizardDraftChange(prev => ({
      ...prev,
      fileName: sample.fileName,
      fileSizeLabel: sample.size,
      documentName: sample.fileName,
      scenario: sample.scenario,
      knowledgeType: sample.knowledgeType,
      language: sample.language,
      sourceType: 'file',
    }));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[22px] border border-[var(--color-border)] bg-white p-6">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={handleBackToDetail}>
            <ChevronLeft size={14} />
            返回
          </Button>
        </div>
        <div className="text-2xl font-semibold mb-1">{stepTitle}</div>
        {knowledgeWizardStep === 1 ? (
          <div className="text-[13px] text-[var(--color-text-secondary)] mb-6">当前知识库：{selectedKnowledgeBase?.name ?? '未指定知识库'}</div>
        ) : knowledgeWizardStep === 2 ? (
          <div className="text-[13px] text-[var(--color-text-secondary)] mb-6">系统将根据以下规则清洗、分段并写入当前知识库。</div>
        ) : knowledgeProcessingResult?.status === 'failed' ? (
          <div className="text-[13px] text-[var(--color-text-secondary)] mb-6">文档未成功写入知识库，请根据提示调整后重新处理。</div>
        ) : (
          <div className="text-[13px] text-[var(--color-text-secondary)] mb-6">文档已写入知识库，可继续上传或前往召回测试验证效果。</div>
        )}

        {knowledgeWizardStep === 1 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-1">
              {SOURCE_OPTIONS.map(option => (
                <button
                  key={option.key}
                  className={`rounded-[18px] border p-5 text-left transition-colors ${knowledgeWizardDraft.sourceType === option.key ? 'border-[var(--color-primary)] shadow-[0_0_0_1px_rgba(52,112,255,0.18)]' : 'border-[var(--color-border)]'} ${option.enabled ? 'bg-white' : 'bg-[var(--color-bg)] opacity-65 cursor-not-allowed'}`}
                  onClick={() => option.enabled && onKnowledgeWizardDraftChange(prev => ({ ...prev, sourceType: option.key }))}
                  disabled={!option.enabled}
                  title={!option.enabled ? '此数据源接入方式即将支持' : option.label}
                >
                  <div className="text-sm font-semibold">{option.label}</div>
                  {!option.enabled ? <div className="text-[11px] text-[var(--color-text-light)] mt-1">即将支持</div> : null}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold">上传文本文件</div>
              <div className="rounded-[18px] border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-5">
                {knowledgeWizardDraft.fileName ? (
                  <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--color-border)] bg-white px-4 py-3">
                    <div>
                      <div className="font-medium">{knowledgeWizardDraft.fileName}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">MD · {knowledgeWizardDraft.fileSizeLabel || '待确认大小'}</div>
                    </div>
                    <button className="text-[var(--color-text-secondary)]" onClick={() => onKnowledgeWizardDraftChange(prev => ({ ...prev, fileName: '', fileSizeLabel: '', documentName: '' }))}>删除</button>
                  </div>
                ) : (
                  <div className="text-sm text-[var(--color-text-secondary)] leading-7">拖拽文件至此，或者从下方样例中选择一个文件。</div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
                {SAMPLE_FILES.map(file => (
                  <button key={file.fileName} className="rounded-[16px] border border-[var(--color-border)] bg-white p-4 text-left hover:border-[var(--color-primary)]" onClick={() => applySample(file.fileName)}>
                    <div className="font-medium text-sm">{file.fileName}</div>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-2">{file.size} · {displayScenario(file.scenario)} · {file.knowledgeType}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button disabled={!canContinueStep1} onClick={() => onKnowledgeWizardStepChange(2)}>下一步</Button>
            </div>
          </div>
        ) : null}

        {knowledgeWizardStep === 2 ? (
          <ImportRulesStep
            selectedKnowledgeBase={selectedKnowledgeBase}
            knowledgeWizardDraft={knowledgeWizardDraft}
            ragConfig={ragConfig}
            advancedOpen={advancedOpen}
            onAdvancedOpenChange={onAdvancedOpenChange}
            onKnowledgeWizardDraftChange={onKnowledgeWizardDraftChange}
            onKnowledgeWizardStepChange={onKnowledgeWizardStepChange}
            onSubmitKnowledgeImport={onSubmitKnowledgeImport}
          />
        ) : null}

        {knowledgeWizardStep === 3 ? (
          <ImportResultStep
            selectedKnowledgeBase={selectedKnowledgeBase}
            knowledgeProcessingResult={knowledgeProcessingResult}
            onFinishKnowledgeImport={onFinishKnowledgeImport}
            onKnowledgeWizardStepChange={onKnowledgeWizardStepChange}
            onStartKnowledgeImport={onStartKnowledgeImport}
          />
        ) : null}
      </div>
    </div>
  );
}

function ImportRulesStep({
  selectedKnowledgeBase,
  knowledgeWizardDraft,
  ragConfig,
  advancedOpen,
  onAdvancedOpenChange,
  onKnowledgeWizardDraftChange,
  onKnowledgeWizardStepChange,
  onSubmitKnowledgeImport,
}: Pick<
  ImportWizardProps,
  | 'selectedKnowledgeBase'
  | 'knowledgeWizardDraft'
  | 'ragConfig'
  | 'advancedOpen'
  | 'onAdvancedOpenChange'
  | 'onKnowledgeWizardDraftChange'
  | 'onKnowledgeWizardStepChange'
  | 'onSubmitKnowledgeImport'
>) {
  const isHighQuality = knowledgeWizardDraft.retrieval.rerankerEnabled;
  const hasCleanFormat = knowledgeWizardDraft.parser.removeBoilerplateText;
  const hasPreserveHeadings = knowledgeWizardDraft.parser.extractHeadings;
  const hasCitation = knowledgeWizardDraft.retrieval.citationRequired;
  const kbName = selectedKnowledgeBase?.name ?? '未指定知识库';

  function setQualityMode(high: boolean) {
    onKnowledgeWizardDraftChange(prev => ({
      ...prev,
      retrieval: {
        ...prev.retrieval,
        rerankerEnabled: high,
        topK: high ? 5 : 3,
        similarityThreshold: high ? 0.78 : 0.72,
      },
      chunking: {
        ...prev.chunking,
        chunkSize: high ? 500 : 400,
        chunkOverlap: high ? 80 : 50,
      },
    }));
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 max-[1100px]:grid-cols-1">
        <div className="rounded-[18px] border border-[var(--color-border)] p-4 space-y-4">
          <div className="text-sm font-semibold">文档信息</div>
          <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">文档名</label>
              <input className={inputCls} value={knowledgeWizardDraft.documentName} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, documentName: event.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">知识类型</label>
              <input className={inputCls} value={knowledgeWizardDraft.knowledgeType} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, knowledgeType: event.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">业务场景</label>
              <select className={inputCls} value={knowledgeWizardDraft.scenario} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, scenario: event.target.value }))}>
                {scenarioOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">语言</label>
              <input className={inputCls} value={knowledgeWizardDraft.language} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, language: event.target.value }))} />
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-[var(--color-border)] p-4 space-y-4">
          <div className="text-sm font-semibold">处理规则</div>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={hasCleanFormat} onChange={() => onKnowledgeWizardDraftChange(prev => ({ ...prev, parser: { ...prev.parser, removeBoilerplateText: !prev.parser.removeBoilerplateText } }))} /> 清洗文档格式</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={hasPreserveHeadings} onChange={() => onKnowledgeWizardDraftChange(prev => ({ ...prev, parser: { ...prev.parser, extractHeadings: !prev.parser.extractHeadings } }))} /> 保留标题结构</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={hasCitation} onChange={() => onKnowledgeWizardDraftChange(prev => ({ ...prev, retrieval: { ...prev.retrieval, citationRequired: !prev.retrieval.citationRequired } }))} /> 保留来源引用</label>
          </div>
        </div>

        <div className="rounded-[18px] border border-[var(--color-border)] p-4 space-y-4">
          <div className="text-sm font-semibold">检索质量模式</div>
          <button className={`w-full rounded-[16px] border p-4 text-left ${isHighQuality ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`} onClick={() => setQualityMode(true)}>
            <div className="font-medium">高质量检索</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-2">适合退款政策、投诉规则、售后说明等需要准确引用的知识。</div>
          </button>
          <button className={`w-full rounded-[16px] border p-4 text-left ${!isHighQuality ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`} onClick={() => setQualityMode(false)}>
            <div className="font-medium">标准检索</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-2">适合一般 FAQ、商品说明、普通运营文档，处理速度更快。</div>
          </button>
        </div>

        <div className="rounded-[18px] border border-[var(--color-border)] p-4 space-y-3">
          <div className="text-sm font-semibold">预计处理结果</div>
          <div className="space-y-1.5 text-sm text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2">{hasCleanFormat ? '✓' : '—'} 清洗文档格式</div>
            <div className="flex items-center gap-2">✓ 按标题与段落切分知识片段</div>
            <div className="flex items-center gap-2">{hasCitation ? '✓' : '—'} 保留来源引用</div>
            <div className="flex items-center gap-2">→ 写入：{kbName}</div>
            <div className="flex items-center gap-2">→ 检索模式：{isHighQuality ? '高质量检索' : '标准检索'}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-[var(--color-border)] p-4 space-y-3">
        <button className="flex items-center gap-1.5 text-sm font-semibold w-full text-left" onClick={() => onAdvancedOpenChange(prev => !prev)}>
          {advancedOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          高级设置
          <span className="text-xs text-[var(--color-text-secondary)] font-normal">仅建议 AI 配置人员调整。</span>
        </button>
        {advancedOpen ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">分段标识符</label>
                <input className={inputCls} value={'\\n\\n'} readOnly />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">分段最大长度</label>
                <input type="number" className={inputCls} value={knowledgeWizardDraft.chunking.chunkSize} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, chunking: { ...prev.chunking, chunkSize: Number(event.target.value) } }))} />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">分段重叠长度</label>
                <input type="number" className={inputCls} value={knowledgeWizardDraft.chunking.chunkOverlap} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, chunking: { ...prev.chunking, chunkOverlap: Number(event.target.value) } }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Top K</label>
                <input type="number" className={inputCls} value={knowledgeWizardDraft.retrieval.topK} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, retrieval: { ...prev.retrieval, topK: Number(event.target.value) } }))} />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Score 阈值</label>
                <input type="number" step="0.01" className={inputCls} value={knowledgeWizardDraft.retrieval.similarityThreshold} onChange={event => onKnowledgeWizardDraftChange(prev => ({ ...prev, retrieval: { ...prev.retrieval, similarityThreshold: Number(event.target.value) } }))} />
              </div>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">Embedding 模型：{ragConfig.embedding.model} · Index：{ragConfig.embedding.indexName}</div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => onKnowledgeWizardStepChange(1)}>上一步</Button>
        <Button onClick={onSubmitKnowledgeImport}>保存并处理</Button>
      </div>
    </div>
  );
}

function ImportResultStep({
  selectedKnowledgeBase,
  knowledgeProcessingResult,
  onFinishKnowledgeImport,
  onKnowledgeWizardStepChange,
  onStartKnowledgeImport,
}: Pick<
  ImportWizardProps,
  | 'selectedKnowledgeBase'
  | 'knowledgeProcessingResult'
  | 'onFinishKnowledgeImport'
  | 'onKnowledgeWizardStepChange'
  | 'onStartKnowledgeImport'
>) {
  return (
    <div className="space-y-5">
      {!knowledgeProcessingResult || knowledgeProcessingResult.status === 'processing' ? (
        <div className="min-h-[360px] flex items-center justify-center">
          <div className="w-full max-w-[560px]">
            <EmptyState title="正在处理文档" description="系统正在依次执行解析、文本分段、向量化与索引发布。完成后会自动展示处理结果与下一步运营入口。" />
          </div>
        </div>
      ) : null}

      {knowledgeProcessingResult?.status === 'success' ? (
        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-[16px] border border-[rgba(5,150,105,0.18)] bg-[linear-gradient(135deg,#F0FDF4_0%,#FFFFFF_100%)] p-5">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-success)] text-white">
              <CircleCheck size={20} />
            </div>
            <div>
              <div className="font-semibold text-base">入库成功</div>
              <div className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">文档已完成清洗、分段、向量化，并写入当前知识库。</div>
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--color-border)] p-5">
            <div className="text-sm font-semibold mb-4">处理结果</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-[900px]:grid-cols-1">
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">文档名</span><span className="font-semibold text-right max-w-[60%] truncate">{knowledgeProcessingResult.documentName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">当前知识库</span><span className="font-semibold">{selectedKnowledgeBase?.name ?? '未指定知识库'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">来源文件</span><span className="font-semibold text-right max-w-[60%] truncate">{knowledgeProcessingResult.sourceLabel}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">分段数量</span><span className="font-semibold">{knowledgeProcessingResult.chunkCount}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">向量数量</span><span className="font-semibold">{knowledgeProcessingResult.vectorCount}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">检索模式</span><span className="font-semibold">{knowledgeProcessingResult.indexMode}</span></div>
              <div className="flex justify-between text-sm col-span-full max-[900px]:col-span-1"><span className="text-[var(--color-text-secondary)]">处理时间</span><span className="font-semibold">{knowledgeProcessingResult.processedAt}</span></div>
            </div>
          </div>

          <div className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm text-[var(--color-text-secondary)]">
            <span className="font-medium text-[var(--color-text)]">建议下一步</span>：建议前往召回测试，使用真实客服问题验证该文档是否能被正确命中。
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button variant="secondary" onClick={() => onFinishKnowledgeImport()}>返回文档列表</Button>
            <Button variant="secondary" onClick={() => onFinishKnowledgeImport({ continueImport: true })}>继续上传</Button>
            <Button onClick={() => onFinishKnowledgeImport({ openRagTest: true })}>去召回测试</Button>
          </div>
        </div>
      ) : null}

      {knowledgeProcessingResult?.status === 'failed' ? (
        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-[16px] border border-[rgba(239,68,68,0.18)] bg-[linear-gradient(135deg,#FEF2F2_0%,#FFFFFF_100%)] p-5">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-danger)] text-white">
              <XCircle size={20} />
            </div>
            <div>
              <div className="font-semibold text-base">文档入库失败</div>
              <div className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">系统未能完成文档处理，当前文件尚未写入知识库。</div>
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--color-border)] p-5">
            <div className="text-sm font-semibold mb-4">异常信息</div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">文档名</span><span className="font-semibold text-right max-w-[60%] truncate">{knowledgeProcessingResult.documentName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">当前知识库</span><span className="font-semibold">{selectedKnowledgeBase?.name ?? '未指定知识库'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">失败阶段</span><span className="font-semibold">{knowledgeProcessingResult.failureStage ?? '未知'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">失败原因</span><span className="font-semibold text-right max-w-[60%]">{knowledgeProcessingResult.failureReason ?? '未知错误'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">检测时间</span><span className="font-semibold">{knowledgeProcessingResult.processedAt}</span></div>
            </div>
          </div>

          <div className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm text-[var(--color-text-secondary)]">
            <div className="font-medium text-[var(--color-text)] mb-2">建议处理方式</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>返回上一步检查文档类型、业务场景和处理规则</li>
              <li>确认是否已存在同名或相似版本文档</li>
              <li>如确认需要覆盖，请重新导入最新版本</li>
              <li>如多次失败，请联系管理员检查知识库写入状态</li>
            </ul>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button variant="secondary" onClick={() => onKnowledgeWizardStepChange(2)}>返回调整</Button>
            <Button onClick={() => onStartKnowledgeImport(selectedKnowledgeBase?.id)}>重新导入</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
