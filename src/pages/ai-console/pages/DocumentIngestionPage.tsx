import { useState } from 'react';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import type { AIConsoleProps } from '../types';
import { DataTable, InlineAction, PageHeader, SectionCard, StatCard } from '../shared';
import { displayStageStatus, stageVariant } from '../sharedUtils';
import { displayLanguage, displayScenario } from '../../../utils/display';

type Props = Pick<AIConsoleProps, 'ingestionDocuments' | 'jobs' | 'onIngestionAction'>;

export function DocumentIngestionPage({ ingestionDocuments, jobs, onIngestionAction }: Props) {
  const [modalState, setModalState] = useState<{ title: string; lines: string[] } | null>(null);
  const processingCount = jobs.filter(item => ['uploaded', 'parsing', 'parsed', 'indexed'].includes(item.status)).length;
  const publishedCount = jobs.filter(item => item.status === 'published').length;
  const exceptionCount = jobs.filter(item => ['chunk_failed', 'embedding_failed', 'version_conflict', 'expired'].includes(item.status)).length;

  async function handleIngestionAction(documentId: string, action: 'view_parsed_text' | 'view_chunks' | 'rebuild_embedding' | 'publish' | 'disable') {
    const result = await onIngestionAction(documentId, action);
    if (action === 'view_parsed_text' && result.parsedText) {
      setModalState({ title: '解析文本预览', lines: [result.parsedText] });
    }
    if (action === 'view_chunks' && result.chunks) {
      setModalState({ title: '切片结果预览', lines: result.chunks });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="接入任务" description="这里只保留上传后的处理总览。所有新文档上传与知识入库统一从知识库主流程进入。" />
      <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
        <StatCard label="处理中" value={String(processingCount)} detail="还在解析、切片或等待发布确认的文档任务。" tone="warning" />
        <StatCard label="已发布" value={String(publishedCount)} detail="已经进入活动检索集，可被场景策略调用。" tone="success" />
        <StatCard label="异常任务" value={String(exceptionCount)} detail="版本冲突、过期或处理失败，必须人工介入。" tone="danger" />
      </div>
      <div className="grid grid-cols-[1.1fr_0.9fr] gap-4 max-[1200px]:grid-cols-1">
        <SectionCard title="处理阶段总览">
          <div className="space-y-3 text-xs text-[var(--color-text-secondary)]">
            <div className="border border-[var(--color-border-light)] rounded-[12px] p-3 bg-[var(--color-bg)]">
              主入口：知识库页面。当前页面只用于看上传后的任务进度、失败原因和发布状态。
            </div>
            <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.68)] p-3.5">
                <div className="text-[11px] text-[var(--color-text-light)] mb-1">处理中</div>
                <div className="text-lg font-semibold text-[var(--color-warning)] tabular-nums">{processingCount}</div>
              </div>
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.68)] p-3.5">
                <div className="text-[11px] text-[var(--color-text-light)] mb-1">已发布</div>
                <div className="text-lg font-semibold text-[var(--color-success)] tabular-nums">{publishedCount}</div>
              </div>
              <div className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.68)] p-3.5">
                <div className="text-[11px] text-[var(--color-text-light)] mb-1">异常任务</div>
                <div className="text-lg font-semibold text-[var(--color-danger)] tabular-nums">{exceptionCount}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {['上传', '解析', '分段', '向量化', '索引', '发布'].map(step => (
                <div key={step} className="rounded-[14px] border border-[var(--color-border-light)] px-3 py-1.5 bg-[rgba(255,255,255,0.74)]">{step}</div>
              ))}
            </div>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="最近接入任务">
            <div className="space-y-2">
              {jobs.slice(0, 4).map(job => (
                <div key={job.id} className="rounded-[18px] border border-[var(--color-border-light)] bg-[rgba(255,255,255,0.68)] p-3.5 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium">{job.documentName}</div>
                    <Badge variant={stageVariant(job.status)}>{displayStageStatus(job.status)}</Badge>
                  </div>
                  <div className="text-[var(--color-text-secondary)]">{job.detail}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <DataTable
        className="rounded-[24px]"
        emptyMessage="当前没有可查看的接入文档。"
        columns={[
          { key: 'name', label: '文档名', width: '18%' },
          { key: 'type', label: '知识类型' },
          { key: 'scenario', label: '场景' },
          { key: 'language', label: '语言' },
          { key: 'owner', label: '负责人' },
          { key: 'parse', label: '解析状态' },
          { key: 'chunk', label: '切片状态' },
          { key: 'embedding', label: '向量状态' },
          { key: 'index', label: '索引状态' },
          { key: 'chunkCount', label: '分块数' },
          { key: 'vectorCount', label: '向量数' },
          { key: 'version', label: '版本' },
          { key: 'lastSync', label: '最近同步', width: '12%' },
          { key: 'actions', label: '动作', width: '20%' },
        ]}
      >
            {ingestionDocuments.map(doc => (
              <tr key={doc.id}>
                <td className="px-4 py-3 text-[13px] border-b border-[var(--color-border-light)]"><div className="font-medium">{doc.documentName}</div><div className="text-[11px] text-[var(--color-text-light)]">{doc.sourceType}</div></td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{doc.knowledgeType}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{displayScenario(doc.scenario)}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{displayLanguage(doc.language)}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{doc.owner}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={stageVariant(doc.parseStatus)}>{displayStageStatus(doc.parseStatus)}</Badge></td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={stageVariant(doc.chunkStatus)}>{displayStageStatus(doc.chunkStatus)}</Badge></td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={stageVariant(doc.embeddingStatus)}>{displayStageStatus(doc.embeddingStatus)}</Badge></td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]"><Badge variant={stageVariant(doc.indexStatus)}>{displayStageStatus(doc.indexStatus)}</Badge></td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] tabular-nums">{doc.chunkCount}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] tabular-nums">{doc.vectorCount}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{doc.version}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] whitespace-nowrap">{doc.lastSync}</td>
                <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                  <div className="flex gap-2 flex-wrap">
                    <InlineAction label="查看解析文本" onClick={() => { void handleIngestionAction(doc.documentId, 'view_parsed_text'); }} />
                    <InlineAction label="查看分块" onClick={() => { void handleIngestionAction(doc.documentId, 'view_chunks'); }} />
                    <InlineAction label="重建向量" onClick={() => { void handleIngestionAction(doc.documentId, 'rebuild_embedding'); }} />
                    <InlineAction label="发布" onClick={() => { void handleIngestionAction(doc.documentId, 'publish'); }} />
                    <InlineAction label="禁用" onClick={() => { void handleIngestionAction(doc.documentId, 'disable'); }} />
                  </div>
                </td>
              </tr>
            ))}
      </DataTable>

      <Modal open={Boolean(modalState)} onClose={() => setModalState(null)} title={modalState?.title}>
        <div className="space-y-3 text-xs">
          {modalState?.lines.map((line, index) => (
            <div key={`${index}-${line.slice(0, 12)}`} className="border border-[var(--color-border-light)] rounded-[16px] p-3.5 bg-[rgba(255,255,255,0.72)] whitespace-pre-wrap leading-6">
              {line}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
