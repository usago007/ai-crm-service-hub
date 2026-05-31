import { useMemo, useState } from 'react';
import type { EvaluationRecord, IngestionJob, KnowledgeDocument, RagRun } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { DataTable } from '../components/common/DataTable';
import { PanelCard, StatCard, SummaryHeader, inputCls } from '../components/common/PageChrome';

interface AIOperationsProps {
  documents: KnowledgeDocument[];
  jobs: IngestionJob[];
  ragRuns: RagRun[];
  evaluations: EvaluationRecord[];
  selectedRunId?: string;
  onReplayRun: (ticketId: string) => void;
  onCreateDocument: (payload: {
    name: string;
    sourceType: string;
    knowledgeType: string;
    scenario: string;
    language: string;
    owner: string;
    version: string;
    effectiveDate: string;
  }) => void;
  onReindexDocument: (id: string) => void;
}

const TABS = ['registry', 'jobs', 'debugger', 'prompt', 'evaluation'] as const;

export function AIOperations({
  documents,
  jobs,
  ragRuns,
  evaluations,
  selectedRunId,
  onReplayRun,
  onCreateDocument,
  onReindexDocument,
}: AIOperationsProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('debugger');
  const [selectedDocumentScenario, setSelectedDocumentScenario] = useState('Shipping');
  const [selectedRun, setSelectedRun] = useState(selectedRunId ?? ragRuns[0]?.id ?? '');

  const activeRun = useMemo(
    () => ragRuns.find(item => item.id === selectedRun) ?? ragRuns[0],
    [ragRuns, selectedRun],
  );

  const activeDocumentCount = documents.filter(item => item.publishStatus === 'published').length;
  const failedJobCount = jobs.filter(item => ['chunk_failed', 'embedding_failed', 'version_conflict', 'expired'].includes(item.status)).length;
  const riskEvalCount = evaluations.filter(item => item.conclusion === 'high_risk').length;

  return (
    <div className="space-y-4">
      <SummaryHeader
        aside={
          <div className="grid grid-cols-3 gap-3 max-[1100px]:grid-cols-1">
            <StatCard label="Published knowledge assets" value={String(activeDocumentCount)} detail="Active documents available to retrieval filters." />
            <StatCard label="Knowledge incidents" value={String(failedJobCount)} detail="Expired, failed, or conflicting ingestion jobs requiring action." tone="warning" />
            <StatCard label="Evaluation risks" value={String(riskEvalCount)} detail="Scenarios below target and blocking stable agent autonomy." tone="danger" />
          </div>
        }
      />

      <div className="shell-card rounded-[24px] p-1.5 flex gap-1 overflow-x-auto">
        {TABS.map(item => (
          <button
            key={item}
            type="button"
            className={`px-4 py-2.5 rounded-[16px] text-[13px] whitespace-nowrap transition-all duration-200 ${
              tab === item
                ? 'bg-[rgba(179,92,32,0.14)] text-[var(--color-primary)] shadow-[inset_0_0_0_1px_rgba(179,92,32,0.16)] font-medium'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[rgba(255,255,255,0.52)]'
            }`}
            onClick={() => setTab(item)}
          >
            {item === 'registry'
              ? 'Knowledge Registry'
              : item === 'jobs'
              ? 'Ingestion Jobs'
              : item === 'debugger'
              ? 'Retrieval Debugger'
              : item === 'prompt'
              ? 'Prompt Assembly Inspector'
              : 'Evaluation & Feedback'}
          </button>
        ))}
      </div>

      {tab === 'registry' && (
        <div className="grid grid-cols-[1.3fr_0.7fr] gap-4 max-[1200px]:grid-cols-1">
          <DataTable
            className="min-w-0"
            columns={[
              { key: 'document', label: 'Document', width: '28%' },
              { key: 'scenario', label: 'Scenario' },
              { key: 'type', label: 'Type' },
              { key: 'language', label: 'Language' },
              { key: 'version', label: 'Version' },
              { key: 'status', label: 'Publish Status' },
              { key: 'coverage', label: 'Coverage' },
              { key: 'action', label: 'Action' },
            ]}
            emptyMessage="No knowledge assets found."
          >
                {documents.map(doc => (
                  <tr key={doc.id}>
                    <td className="px-4 py-3 text-[13px] border-b border-[var(--color-border-light)]">
                      <div className="font-medium">{doc.name}</div>
                      <div className="text-[11px] text-[var(--color-text-light)]">{doc.owner} · effective {doc.effectiveDate}</div>
                    </td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{doc.scenario}</td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{doc.knowledgeType}</td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{doc.language}</td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{doc.version}</td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                      <Badge variant={doc.publishStatus === 'published' ? 'green' : doc.publishStatus === 'version_conflict' || doc.publishStatus === 'expired' ? 'red' : 'yellow'}>
                        {doc.publishStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)] tabular-nums">{doc.coverageScore}%</td>
                    <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                      <Button variant="ghost" size="sm" onClick={() => onReindexDocument(doc.id)}>
                        Reindex
                      </Button>
                    </td>
                  </tr>
                ))}
          </DataTable>

          <PanelCard title="Create mock ingestion job">
            <div className="mb-3">
              <label className="text-xs text-[var(--color-text-secondary)] block mb-1">Scenario</label>
              <select className={inputCls} value={selectedDocumentScenario} onChange={e => setSelectedDocumentScenario(e.target.value)}>
                {['Shipping', 'Refund', 'Complaint', 'Address Change', 'Product Inquiry'].map(item => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              onClick={() =>
                onCreateDocument({
                  name: `${selectedDocumentScenario} Playbook ${Date.now()}.pdf`,
                  sourceType: 'PDF',
                  knowledgeType: selectedDocumentScenario === 'Complaint' ? 'Business Rule' : 'Policy',
                  scenario: selectedDocumentScenario,
                  language: selectedDocumentScenario === 'Complaint' ? 'ZH' : 'EN',
                  owner: 'Mock Ops',
                  version: 'v1.0',
                  effectiveDate: '2026-05-22',
                })
              }
            >
              Create mock document
            </Button>
          </PanelCard>
        </div>
      )}

      {tab === 'jobs' && (
        <DataTable
          columns={[
            { key: 'job', label: 'Job', width: '30%' },
            { key: 'status', label: 'Status' },
            { key: 'started', label: 'Started' },
            { key: 'updated', label: 'Updated' },
            { key: 'detail', label: 'Detail' },
          ]}
          emptyMessage="No ingestion jobs available."
        >
              {jobs.map(job => (
                <tr key={job.id}>
                  <td className="px-4 py-3 text-[13px] border-b border-[var(--color-border-light)]">
                    <div className="font-medium">{job.documentName}</div>
                    <div className="text-[11px] text-[var(--color-text-light)]">{job.id}</div>
                  </td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                    <Badge variant={job.status === 'published' || job.status === 'indexed' ? 'green' : job.status === 'version_conflict' || job.status === 'expired' ? 'red' : 'yellow'}>
                      {job.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{job.startedAt}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{job.updatedAt}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{job.detail}</td>
                </tr>
              ))}
        </DataTable>
      )}

      {tab === 'debugger' && activeRun && (
        <div className="grid grid-cols-[0.9fr_1.1fr] gap-4 max-[1200px]:grid-cols-1">
          <PanelCard title="Runs" description="Inspect query rewriting, filters, fallback reasons, and retrieval posture before replay.">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-light)]">Run selector</div>
              <select className={inputCls} value={activeRun.id} onChange={e => setSelectedRun(e.target.value)}>
                {ragRuns.map(run => (
                  <option key={run.id} value={run.id}>{run.id} · {run.ticketId}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <div className="text-[var(--color-text-secondary)] mb-1">Original query</div>
                <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded p-2">{activeRun.originalQuery}</div>
              </div>
              <div>
                <div className="text-[var(--color-text-secondary)] mb-1">Rewrite query</div>
                <div className="bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded p-2">{activeRun.rewrittenQuery}</div>
              </div>
              <div>
                <div className="text-[var(--color-text-secondary)] mb-1">Metadata filters</div>
                <div className="flex flex-wrap gap-1.5">
                  {activeRun.metadataFilters.map(filter => (
                    <span key={filter} className="px-2 py-0.5 bg-[var(--color-primary-bg)] text-[var(--color-primary)] rounded text-[11px]">
                      {filter}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-[var(--color-border-light)] rounded p-2">
                  <div className="text-[var(--color-text-secondary)]">Fallback reason</div>
                  <div className="mt-1">{activeRun.fallbackReason || 'None'}</div>
                </div>
                <div className="border border-[var(--color-border-light)] rounded p-2">
                  <div className="text-[var(--color-text-secondary)]">Run status</div>
                  <Badge variant={activeRun.status === 'healthy' ? 'green' : activeRun.status === 'warning' ? 'yellow' : 'red'}>
                    {activeRun.status}
                  </Badge>
                </div>
              </div>
              <Button size="sm" onClick={() => onReplayRun(activeRun.ticketId)}>
                Replay retrieval
              </Button>
            </div>
          </PanelCard>

          <PanelCard title="Candidates and rejection reasons" description="Track reranking outcomes, metadata alignment, and why candidates were suppressed.">
            <div className="space-y-3">
              {activeRun.candidates.map(candidate => (
                <div key={candidate.id} className="border border-[var(--color-border-light)] rounded-[var(--radius-sm)] p-3">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="font-medium text-[13px]">{candidate.source}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant={candidate.selected ? 'green' : 'gray'}>{candidate.selected ? 'selected' : 'dropped'}</Badge>
                      <span className="text-[11px] text-[var(--color-text-light)]">score {candidate.score.toFixed(2)} → rerank {candidate.rerankScore.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mb-2">{candidate.snippet}</div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {Object.entries(candidate.metadata).map(([key, value]) => (
                      <span key={key} className="px-1.5 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border-light)] text-[10px]">
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                  {!candidate.selected && (
                    <div className="text-[11px] text-[var(--color-danger)]">Rejected: {candidate.rejectReason}</div>
                  )}
                </div>
              ))}
            </div>
          </PanelCard>
        </div>
      )}

      {tab === 'prompt' && activeRun && (
        <div className="grid grid-cols-2 gap-4 max-[1200px]:grid-cols-1">
          <PanelCard title="Prompt inputs" description="Audit the exact retrieval payload flowing into prompt assembly.">
            <div className="space-y-3 text-xs">
              <div><span className="text-[var(--color-text-secondary)]">Query:</span> {activeRun.originalQuery}</div>
              <div><span className="text-[var(--color-text-secondary)]">Retrieved citations:</span> {activeRun.citations.map(item => `${item.source} ${item.match}`).join(', ')}</div>
              <div><span className="text-[var(--color-text-secondary)]">Filters:</span> {activeRun.metadataFilters.join(', ')}</div>
              <div><span className="text-[var(--color-text-secondary)]">Fallback:</span> {activeRun.fallbackReason || 'No fallback required'}</div>
            </div>
          </PanelCard>
        </div>
      )}

      {tab === 'evaluation' && (
        <DataTable
          columns={[
            { key: 'scenario', label: 'Scenario' },
            { key: 'metric', label: 'Metric' },
            { key: 'score', label: 'Score' },
            { key: 'baseline', label: 'Baseline' },
            { key: 'status', label: 'Status' },
          ]}
          emptyMessage="No evaluation feedback available."
        >
              {evaluations.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-[13px] border-b border-[var(--color-border-light)]">{item.scenario}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.metric}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">{item.score}</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">--</td>
                  <td className="px-4 py-3 text-xs border-b border-[var(--color-border-light)]">
                    <Badge variant={item.conclusion === 'pass' ? 'green' : item.conclusion === 'optimize' ? 'yellow' : 'red'}>
                      {item.conclusion}
                    </Badge>
                  </td>
                </tr>
              ))}
        </DataTable>
      )}
    </div>
  );
}
