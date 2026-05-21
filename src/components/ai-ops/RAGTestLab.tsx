import { useState } from 'react';
import { useT } from '../../i18n';
import { Badge } from '../common/Badge';
import { RAG_TEST_MOCK_CHUNKS, PROMPT_TEMPLATES } from '../../data/aiOperations';

const SENSITIVE_SCENARIOS = ['Refund', 'Compensation', 'Complaint', 'Chargeback'];

export function RAGTestLab() {
  const { t } = useT();
  const [question, setQuestion] = useState('Where is my order? Tracking has not updated.');
  const [customer, setCustomer] = useState('John Smith');
  const [scenario, setScenario] = useState('Shipping Delay');
  const [lang, setLang] = useState('EN');
  const [relatedOrder, setRelatedOrder] = useState('ORD-001');
  const [step, setStep] = useState(0);

  const isSensitive = SENSITIVE_SCENARIOS.some(s => scenario.includes(s));
  const confidence = isSensitive ? 72 : 89;
  const citationCoverage = isSensitive ? 76 : 91;
  const riskLevel = isSensitive ? 'High' : 'Low';
  const guardrailPass = !isSensitive;

  const promptTemplate = PROMPT_TEMPLATES.find(p => p.scenario === 'Logistics' || p.scenario === 'Refund') || PROMPT_TEMPLATES[0];

  const draftReply = isSensitive
    ? `Hi ${customer}, thank you for reaching out. We have received your request regarding order ${relatedOrder}. Our team is currently reviewing the details and will get back to you within 24 hours. A specialist will follow up with you shortly. [Manual review required before sending]`
    : `Hi ${customer}, I understand your concern about the tracking for order ${relatedOrder}. I've checked and it appears the package is still in transit with the carrier. The tracking should update within 24-48 hours. I'll set a follow-up to check back with you. Is there anything else I can help with?`;

  const stepHeaderCls = 'text-sm font-semibold mb-2 flex items-center gap-2';

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
        <div className={stepHeaderCls}>
          <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold">1</span>
          {t.aiOps.step1Input}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">{t.aiOps.customerQuestion}</label>
            <textarea className="w-full h-20 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-xs bg-white outline-none resize-none focus:border-[var(--color-primary)]" value={question} onChange={e => setQuestion(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Customer</label>
            <select className="h-8 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 text-xs bg-white outline-none w-full" value={customer} onChange={e => setCustomer(e.target.value)}>
              {['John Smith', 'Emily Carter', 'Ava Chen', 'Daniel Brown', 'Mike Johnson'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">{t.aiOps.scenarioLabel}</label>
            <select className="h-8 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 text-xs bg-white outline-none w-full" value={scenario} onChange={e => setScenario(e.target.value)}>
              {['Shipping Delay', 'Refund Request', 'Product Inquiry', 'Payment Issue', 'Complaint', 'Compensation', 'Chargeback'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Language</label>
            <select className="h-8 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 text-xs bg-white outline-none w-full" value={lang} onChange={e => setLang(e.target.value)}>
              {['EN', 'ZH', 'ES', 'RU', 'JA'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">{t.aiOps.relatedOrder}</label>
            <select className="h-8 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 text-xs bg-white outline-none w-full" value={relatedOrder} onChange={e => setRelatedOrder(e.target.value)}>
              {['ORD-001', 'ORD-002', 'ORD-005', 'ORD-008', 'ORD-012'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <button className="btn btn-primary btn-sm" onClick={() => setStep(2)}>{t.aiOps.runRetrieval}</button>
        </div>
      </div>

      {step >= 2 && (
        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
          <div className={stepHeaderCls}>
            <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold">2</span>
            {t.aiOps.step2Chunks}
          </div>
          {RAG_TEST_MOCK_CHUNKS.map((c, i) => (
            <div key={i} className="py-3 border-b border-[var(--color-border-light)] last:border-b-0">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary-bg)] text-[var(--color-primary)] flex items-center justify-center font-semibold flex-shrink-0 text-xs">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-medium">{c.source}</span>
                    <Badge variant="blue">{t.aiOps.score}: {c.score.toFixed(2)}</Badge>
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mb-1">{c.chunk}</div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {Object.entries(c.metadata).map(([k, v]) => (
                      <span key={k} className="px-1.5 py-0.5 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded text-[10px] text-[var(--color-text-secondary)]">{k}: {String(v)}</span>
                    ))}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-light)]">{t.aiOps.matchReason}: {c.matchReason}</div>
                </div>
              </div>
            </div>
          ))}
          <div className="mt-3">
            <button className="btn btn-secondary btn-sm" onClick={() => setStep(3)}>{t.aiOps.step3Prompt} →</button>
          </div>
        </div>
      )}

      {step >= 3 && (
        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
          <div className={stepHeaderCls}>
            <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold">3</span>
            {t.aiOps.step3Prompt}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="border border-[var(--color-border-light)] rounded p-2">
              <div className="text-[var(--color-text-secondary)] font-semibold mb-1">{t.aiOps.systemRole}</div>
              <div>{promptTemplate.systemRole}</div>
            </div>
            <div className="border border-[var(--color-border-light)] rounded p-2">
              <div className="text-[var(--color-text-secondary)] font-semibold mb-1">{t.aiOps.customerContext}</div>
              <div>{promptTemplate.customerContext}</div>
            </div>
            <div className="border border-[var(--color-border-light)] rounded p-2">
              <div className="text-[var(--color-text-secondary)] font-semibold mb-1">{t.aiOps.orderContext}</div>
              <div>{promptTemplate.orderContext}</div>
            </div>
            <div className="border border-[var(--color-border-light)] rounded p-2">
              <div className="text-[var(--color-text-secondary)] font-semibold mb-1">{t.aiOps.convSummary}</div>
              <div>Customer {customer} asked about order {relatedOrder}. Issue: {scenario}. No prior resolution.</div>
            </div>
            <div className="border border-[var(--color-border-light)] rounded p-2">
              <div className="text-[var(--color-text-secondary)] font-semibold mb-1">{t.aiOps.retrievedKnowledge}</div>
              <div>{RAG_TEST_MOCK_CHUNKS.map(c => c.source).join(', ')}</div>
            </div>
            <div className="border border-[var(--color-border-light)] rounded p-2">
              <div className="text-[var(--color-text-secondary)] font-semibold mb-1">{t.aiOps.businessRules}</div>
              <div>{promptTemplate.businessRules}</div>
            </div>
            <div className="col-span-2 border border-[var(--color-border-light)] rounded p-2">
              <div className="text-[var(--color-text-secondary)] font-semibold mb-1">{t.aiOps.blockedClaims}</div>
              <ul className="list-disc pl-4">
                {promptTemplate.blockedClaims.map((bc, j) => <li key={j} className="text-[var(--color-danger)]">{bc}</li>)}
              </ul>
            </div>
            <div className="col-span-2 border border-[var(--color-border-light)] rounded p-2">
              <div className="text-[var(--color-text-secondary)] font-semibold mb-1">{t.aiOps.outputFormat}</div>
              <div>{promptTemplate.outputFormat}</div>
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-secondary btn-sm" onClick={() => setStep(4)}>{t.aiOps.step4Draft} →</button>
          </div>
        </div>
      )}

      {step >= 4 && (
        <div className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
          <div className={stepHeaderCls}>
            <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold">4</span>
            {t.aiOps.step4Draft}
          </div>
          <div className="mb-3 p-3 bg-[var(--color-bg)] border border-[var(--color-border-light)] rounded text-xs whitespace-pre-wrap">{draftReply}</div>
          <div className="grid grid-cols-3 gap-3 text-xs max-[1000px]:grid-cols-2">
            <div className="border border-[var(--color-border-light)] rounded p-2">
              <div className="text-[var(--color-text-secondary)] mb-1">{t.aiOps.confidence}</div>
              <span className={`font-semibold text-lg ${confidence >= 85 ? 'text-[var(--color-success)]' : confidence >= 70 ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}`}>{confidence}%</span>
            </div>
            <div className="border border-[var(--color-border-light)] rounded p-2">
              <div className="text-[var(--color-text-secondary)] mb-1">{t.aiOps.citationCoverage}</div>
              <span className={`font-semibold text-lg ${citationCoverage >= 85 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>{citationCoverage}%</span>
            </div>
            <div className="border border-[var(--color-border-light)] rounded p-2">
              <div className="text-[var(--color-text-secondary)] mb-1">{t.aiOps.riskLevel}</div>
              <Badge variant={riskLevel === 'High' ? 'red' : riskLevel === 'Medium' ? 'yellow' : 'green'}><span className="text-sm">{riskLevel}</span></Badge>
            </div>
            <div className="border border-[var(--color-border-light)] rounded p-2">
              <div className="text-[var(--color-text-secondary)] mb-1">{t.aiOps.manualReviewRequired}</div>
              <Badge variant={isSensitive ? 'red' : 'green'}><span className="text-sm">{isSensitive ? t.aiOps.yes : t.aiOps.no}</span></Badge>
            </div>
            <div className="border border-[var(--color-border-light)] rounded p-2">
              <div className="text-[var(--color-text-secondary)] mb-1">{t.aiOps.guardrailResult}</div>
              <Badge variant={guardrailPass ? 'green' : 'red'}><span className="text-sm">{guardrailPass ? t.aiOps.guardrailPass : t.aiOps.guardrailFail}</span></Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
