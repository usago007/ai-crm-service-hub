import { useState } from 'react';
import { useT } from '../i18n';
import { Badge } from '../components/common/Badge';
import { RAG_PIPELINE, KNOWLEDGE_SOURCES, PROMPT_TEMPLATES, MODEL_POLICY, GUARDRAILS, EVALUATION_METRICS, EVALUATION_ITEMS, FEEDBACK_ITEMS, AUDIT_LOGS } from '../data/aiOperations';
import { DocumentIngestion } from '../components/ai-ops/DocumentIngestion';
import { RAGConfiguration } from '../components/ai-ops/RAGConfiguration';
import { RAGTestLab } from '../components/ai-ops/RAGTestLab';
import { CapabilityPipeline } from '../components/ai-ops/CapabilityPipeline';

const TABS = ['rag', 'sources', 'ingestion', 'retrieval', 'prompts', 'model', 'guardrails', 'evaluation', 'feedback', 'audit', 'testlab', 'pipeline'];

export function AIOperations() {
  const { t } = useT();
  const [tab, setTab] = useState('rag');
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);

  const tabLabels: Record<string, string> = {
    rag: t.aiOps.ragPipeline,
    sources: t.aiOps.knowledgeSources,
    ingestion: t.aiOps.documentIngestion,
    retrieval: t.aiOps.retrievalConfig,
    prompts: t.aiOps.promptTemplates,
    model: t.aiOps.modelPolicy,
    guardrails: t.aiOps.guardrails,
    evaluation: t.aiOps.evaluation,
    feedback: t.aiOps.feedbackLoop,
    audit: t.aiOps.auditLogs,
    testlab: t.aiOps.ragTestLab,
    pipeline: t.aiOps.capabilityPipeline,
  };

  const showToast = (msg: string) => {
    const el = document.createElement('div');
    el.className = 'fixed bottom-4 right-4 bg-[var(--color-success)] text-white px-4 py-2 rounded-lg text-xs shadow-lg z-[9999]';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  };

  const statusColor = (s: string) => {
    if (s === 'Active') return 'badge-green';
    if (s === 'Warning') return 'badge-yellow';
    if (s === 'Disabled') return 'badge-gray';
    return 'badge-gray';
  };

  return (
    <div>
      <div className="text-xl font-bold mb-1">{t.page.aiOperations}</div>
      <div className="text-[13px] text-[var(--color-text-secondary)] mb-5">{t.page.subtitle_aiOperations}</div>

      <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4 mb-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
        AI Operations manages how customer service AI retrieves knowledge, assembles prompts, applies risk policies, generates draft replies, and collects human feedback. AI suggestions are grounded in CRM context, order data, knowledge base chunks, business rules, and human review policies.
      </div>

      <div className="flex gap-0 border-b border-[var(--color-border)] mb-4 overflow-x-auto">
        {TABS.map((k) => (
          <div key={k} className={`px-3 py-2 text-[13px] cursor-pointer border-b-2 transition-all duration-[var(--transition)] whitespace-nowrap flex-shrink-0 ${tab === k ? 'text-[var(--color-primary)] border-b-[var(--color-primary)] font-medium' : 'text-[var(--color-text-secondary)] border-b-transparent hover:text-[var(--color-text)]'}`} onClick={() => setTab(k)}>
            {tabLabels[k]}
          </div>
        ))}
      </div>

      {tab === 'rag' && (
        <div className="overflow-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr>
                {['Step', 'Description', 'Status', 'Last Run', 'Output'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RAG_PIPELINE.map((s, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-[var(--color-bg)]' : ''}>
                  <td className="px-3 py-2 text-[13px] border-b border-[var(--color-border-light)] font-medium">{s.step}</td>
                  <td className="px-3 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-light)]">{s.desc}</td>
                  <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">
                    <Badge variant={statusColor(s.status) as any}>{s.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-light)]">{s.lastRun}</td>
                  <td className="px-3 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-light)]">{s.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'sources' && (
        <div>
          <div className="flex gap-2 mb-3">
            <button className="btn btn-primary btn-sm" onClick={() => showToast('Sync initiated for all sources')}>Sync Source</button>
            <button className="btn btn-secondary btn-sm" onClick={() => showToast('Rebuild index queued')}>Rebuild Index</button>
            <button className="btn btn-secondary btn-sm" onClick={() => showToast('Opening chunk viewer')}>View Chunks</button>
          </div>
          <div className="overflow-auto">
            <table className="w-full border-collapse min-w-[1100px]">
              <thead>
                <tr>
                  {['Source Name', 'Source Type', 'Category', 'Language', 'Owner', 'Status', 'Last Sync', 'Docs', 'Chunks', 'Version', 'Actions'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {KNOWLEDGE_SOURCES.map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-[var(--color-bg)]' : ''}>
                    <td className="px-3 py-2 text-[13px] border-b border-[var(--color-border-light)] font-medium">{s.name}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{s.type}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]"><Badge variant="blue">{s.category}</Badge></td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{s.language}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{s.owner}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">
                      <Badge variant={statusColor(s.status) as any}>{s.status}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-light)]">{s.lastSync}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{s.docCount}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{s.chunkCount}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{s.version}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">
                      <button className="text-[var(--color-primary)] hover:underline" onClick={() => showToast(`Syncing ${s.name}...`)}>Sync</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'retrieval' && <RAGConfiguration />}

      {tab === 'prompts' && (
        <div className="overflow-auto">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr>
                {['Prompt Name', 'Scenario', 'Version', 'Status', 'Owner', 'Last Updated', 'Used By', 'Human Edit Rate', 'Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROMPT_TEMPLATES.map((p, i) => (
                <>
                  <tr key={i} className={i % 2 === 0 ? 'bg-[var(--color-bg)]' : ''}>
                    <td className="px-3 py-2 text-[13px] border-b border-[var(--color-border-light)] font-medium">{p.name}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{p.scenario}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{p.version}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]"><Badge variant="green">Active</Badge></td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{p.owner}</td>
                    <td className="px-3 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-light)]">{p.updated}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{p.usedBy}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{p.humanEditRate}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">
                      <button className="text-[var(--color-primary)] hover:underline" onClick={() => setExpandedPrompt(expandedPrompt === i ? null : i)}>
                        {expandedPrompt === i ? 'Hide' : 'View Prompt'}
                      </button>
                    </td>
                  </tr>
                  {expandedPrompt === i && (
                    <tr key={`${i}-detail`}>
                      <td colSpan={9} className="px-4 py-3 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div><span className="text-[var(--color-text-secondary)] font-semibold">System Role:</span> {p.systemRole}</div>
                          <div><span className="text-[var(--color-text-secondary)] font-semibold">Customer Context:</span> {p.customerContext}</div>
                          <div><span className="text-[var(--color-text-secondary)] font-semibold">Order Context:</span> {p.orderContext}</div>
                          <div><span className="text-[var(--color-text-secondary)] font-semibold">Retrieved Knowledge:</span> {p.retrievedKnowledge}</div>
                          <div><span className="text-[var(--color-text-secondary)] font-semibold">Business Rules:</span> {p.businessRules}</div>
                          <div><span className="text-[var(--color-text-secondary)] font-semibold">Tone Requirement:</span> {p.toneRequirement}</div>
                          <div className="col-span-2">
                            <span className="text-[var(--color-text-secondary)] font-semibold">Blocked Claims:</span>
                            <ul className="list-disc pl-4 mt-1">
                              {p.blockedClaims.map((c, j) => <li key={j} className="text-[var(--color-danger)]">{c}</li>)}
                            </ul>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[var(--color-text-secondary)] font-semibold">Output Format:</span> {p.outputFormat}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'model' && (
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
            <div className="text-sm font-semibold mb-3">Model Configuration</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ['Primary Model', MODEL_POLICY.primaryModel],
                ['Fallback Model', MODEL_POLICY.fallbackModel],
                ['Embedding Model', MODEL_POLICY.embeddingModel],
                ['Temperature', String(MODEL_POLICY.temperature)],
                ['Max Output Tokens', String(MODEL_POLICY.maxTokens)],
                ['Response Language', MODEL_POLICY.responseLanguage],
                ['Citation Required', MODEL_POLICY.citationRequired ? 'Yes' : 'No'],
                ['Auto Send', MODEL_POLICY.autoSend ? 'Enabled' : 'Disabled'],
                ['Human Confirmation', MODEL_POLICY.humanConfirmation ? 'Required' : 'Not Required'],
                ['Sensitive Case Routing', MODEL_POLICY.sensitiveCaseRouting ? 'Enabled' : 'Disabled'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-[var(--color-border-light)]">
                  <span className="text-[var(--color-text-secondary)]">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
            <div className="text-sm font-semibold mb-3">Scenario Policy Matrix</div>
            <div className="overflow-auto">
              <table className="w-full border-collapse min-w-[700px]">
                <thead>
                  <tr>
                    {['Scenario', 'Model', 'Temperature', 'Auto Send', 'Manual Review', 'Fallback'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODEL_POLICY.scenarioMatrix.map((s, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-[var(--color-bg)]' : ''}>
                      <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{s.scenario}</td>
                      <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{s.model}</td>
                      <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{s.temperature}</td>
                      <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]"><Badge variant={s.autoSend === 'Yes' ? 'green' : 'gray'}>{s.autoSend}</Badge></td>
                      <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]"><Badge variant={s.manualReview === 'Yes' ? 'red' : 'green'}>{s.manualReview}</Badge></td>
                      <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{s.fallback}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'guardrails' && (
        <div className="overflow-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                {['Risk Scenario', 'Detection Rule', 'AI Permission', 'Blocked Action', 'Required Human Action', 'Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GUARDRAILS.map((g, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-[var(--color-bg)]' : ''}>
                  <td className="px-3 py-2 text-[13px] border-b border-[var(--color-border-light)] font-medium">{g.scenario}</td>
                  <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{g.detectionRule}</td>
                  <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]"><Badge variant={g.aiPermission === 'No reply' ? 'red' : 'yellow'}>{g.aiPermission}</Badge></td>
                  <td className="px-3 py-2 text-xs text-[var(--color-danger)] border-b border-[var(--color-border-light)]">{g.blockedAction}</td>
                  <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{g.humanAction}</td>
                  <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]"><Badge variant="green">{g.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'evaluation' && (
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-4 gap-3 max-[1400px]:grid-cols-2">
            {EVALUATION_METRICS.map((m, i) => (
              <div key={i} className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
                <div className="text-2xl font-bold leading-tight" style={m.color ? { color: m.color } : undefined}>{m.value}</div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="overflow-auto border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)]">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr>
                  {['Evaluation Item', 'Scenario', 'AI Output', 'Human Feedback', 'Score', 'Issue Type', 'Action'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EVALUATION_ITEMS.map((e, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-[var(--color-bg)]' : ''}>
                    <td className="px-3 py-2 text-[13px] border-b border-[var(--color-border-light)]">{e.item}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{e.scenario}</td>
                    <td className="px-3 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-light)]">{e.aiOutput}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">
                      <Badge variant={e.humanFeedback === 'Good' ? 'green' : e.humanFeedback === 'Needs review' ? 'yellow' : 'red'}>{e.humanFeedback}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">
                      <span className={`font-semibold ${e.score >= 90 ? 'text-[var(--color-success)]' : e.score >= 75 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}`}>{e.score}</span>
                    </td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{e.issueType}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{e.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'feedback' && (
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
            <div className="text-sm font-semibold mb-3">Feedback Loop Flow</div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              {['AI Suggestion', 'Agent Action', 'Adopt / Edit / Reject', 'Feedback Label', 'Prompt Update / Rule Update', 'Training Dataset'].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="px-3 py-1.5 bg-[var(--color-primary-bg)] text-[var(--color-primary)] rounded-[var(--radius-sm)] font-medium">{step}</div>
                  {i < 5 && <span className="text-[var(--color-text-light)]">→</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-auto border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)]">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>
                  {['Ticket ID', 'Scenario', 'Agent Action', 'Edit Rate', 'Feedback Label', 'Suggested Improvement', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEEDBACK_ITEMS.map((f, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-[var(--color-bg)]' : ''}>
                    <td className="px-3 py-2 text-[13px] border-b border-[var(--color-border-light)] font-medium">{f.ticketId}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{f.scenario}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{f.agentAction}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{f.editRate}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">
                      <Badge variant={f.feedbackLabel === 'Good' ? 'green' : f.feedbackLabel === 'Too direct' ? 'yellow' : 'red'}>{f.feedbackLabel}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-light)]">{f.suggestedImprovement}</td>
                    <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">
                      <Badge variant={f.status === 'Pending Review' ? 'yellow' : f.status === 'In Progress' ? 'blue' : 'green'}>{f.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="overflow-auto">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr>
                {['Time', 'Ticket ID', 'Customer', 'AI Action', 'Model', 'Prompt Version', 'Retrieved Sources', 'Confidence', 'Risk Level', 'Agent Action'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOGS.map((a, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-[var(--color-bg)]' : ''}>
                  <td className="px-3 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-light)] whitespace-nowrap">{a.time}</td>
                  <td className="px-3 py-2 text-[13px] border-b border-[var(--color-border-light)] font-medium">{a.ticketId}</td>
                  <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{a.customer}</td>
                  <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{a.aiAction}</td>
                  <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{a.model}</td>
                  <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{a.promptVersion}</td>
                  <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{a.retrievedSources} sources</td>
                  <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">
                    <span className={`font-semibold ${parseInt(a.confidence) >= 85 ? 'text-[var(--color-success)]' : parseInt(a.confidence) >= 70 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}`}>{a.confidence}</span>
                  </td>
                  <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">
                    <Badge variant={a.riskLevel === 'High' ? 'red' : a.riskLevel === 'Medium' ? 'yellow' : 'green'}>{a.riskLevel}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs border-b border-[var(--color-border-light)]">{a.agentAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'ingestion' && <DocumentIngestion />}
      {tab === 'testlab' && <RAGTestLab />}
      {tab === 'pipeline' && <CapabilityPipeline />}
    </div>
  );
}
