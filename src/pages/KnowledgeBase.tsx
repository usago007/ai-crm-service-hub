import type { FAQ, ReplyTemplate, BusinessRule } from '../types';
import { statCls } from '../utils/format';
import { Badge } from '../components/common/Badge';
import { useT } from '../i18n';

interface KnowledgeBaseProps {
  faqList: FAQ[];
  templates: ReplyTemplate[];
  rules: BusinessRule[];
  knowledgeTab: string;
  onKnowledgeTabChange: (tab: string) => void;
}

const POLICY_DOCS = [
  ['Shipping Delay Policy', 'Covers procedures for handling shipping delays over 5 days. Includes carrier escalation process and customer communication templates.', 'v2.1', '2026-05-01'],
  ['Return & Refund Policy', '30-day return window with condition requirements. Refund processing timeline and exception handling for special cases.', 'v3.0', '2026-04-15'],
  ['Compensation Guidelines', 'Defines scenarios where compensation is applicable. Requires supervisor approval for all compensation amounts over $20.', 'v1.5', '2026-04-28'],
  ['VIP Customer Protocol', 'Priority handling procedures for VIP tier customers. Includes express shipping upgrades, dedicated support, and personalized service.', 'v2.0', '2026-05-10'],
  ['Complaint Escalation Process', 'Step-by-step escalation flow for customer complaints. Mandatory supervisor notification for escalation requests.', 'v1.8', '2026-05-05'],
];

export function KnowledgeBase({ faqList, templates, rules, knowledgeTab, onKnowledgeTabChange }: KnowledgeBaseProps) {
  const { t } = useT();
  const tabs = ['faq', 'templates', 'rules', 'policies'];
  const tabLabels = [`${t.knowledge.faq} (${faqList.length})`, `${t.knowledge.templates} (${templates.length})`, `${t.knowledge.rules} (${rules.length})`, t.knowledge.policyDocuments];

  return (
    <div>
      <div className="text-xl font-bold mb-1">{t.page.knowledge}</div>
      <div className="text-[13px] text-[var(--color-text-secondary)] mb-5">{t.page.subtitle_knowledge}</div>

      <div className="flex gap-0 border-b border-[var(--color-border)] mb-4">
        {tabs.map((tab, i) => (
          <div
            key={tab}
            className={`px-4 py-2 text-[13px] cursor-pointer border-b-2 transition-all duration-[var(--transition)] whitespace-nowrap ${
              knowledgeTab === tab
                ? 'text-[var(--color-primary)] border-b-[var(--color-primary)] font-medium'
                : 'text-[var(--color-text-secondary)] border-b-transparent hover:text-[var(--color-text)]'
            }`}
            onClick={() => onKnowledgeTabChange(tab)}
          >
            {tabLabels[i]}
          </div>
        ))}
      </div>

      {knowledgeTab === 'faq' && (
        <div className="overflow-auto border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)]">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                {[t.tableHeader.question, t.tableHeader.category, t.tableHeader.answerSummary, t.tableHeader.language, t.tableHeader.status, t.tableHeader.usage, t.tableHeader.accuracy].map((h, i) => (
                  <th key={i} className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {faqList.map(f => (
                <tr key={f.id}>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{f.question}</td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle"><Badge variant="blue">{f.category}</Badge></td>
                  <td className="px-3 py-2.5 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-light)] align-middle">{f.answerSummary}</td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{f.language}</td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle"><Badge variant={statCls(f.status).replace('badge-', '') as any}>{f.status}</Badge></td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{f.usageCount}</td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                    {f.matchAccuracy}%
                    <div className="h-1 rounded-sm bg-[var(--color-border-light)] overflow-hidden mt-1">
                      <div className="h-full rounded-sm bg-[var(--color-success)]" style={{ width: `${f.matchAccuracy}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {knowledgeTab === 'templates' && (
        <div className="overflow-auto border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)]">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                {[t.tableHeader.templateName, t.tableHeader.scenario, t.tableHeader.language, t.tableHeader.tone, t.tableHeader.status, t.tableHeader.usage].map((h, i) => (
                  <th key={i} className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map(tm => (
                <tr key={tm.id}>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle"><strong>{tm.name}</strong></td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{tm.scenario}</td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{tm.language}</td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{tm.tone}</td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle"><Badge variant={statCls(tm.status).replace('badge-', '') as any}>{tm.status}</Badge></td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{tm.usageCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {knowledgeTab === 'rules' && (
        <div className="overflow-auto border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)]">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                {[t.tableHeader.ruleName, t.tableHeader.scenario, t.tableHeader.triggerCondition, t.tableHeader.aiPermission, t.ai.manualReview, t.tableHeader.status].map((h, i) => (
                  <th key={i} className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id}>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle"><strong>{r.name}</strong></td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{r.scenario}</td>
                  <td className="px-3 py-2.5 text-xs border-b border-[var(--color-border-light)] align-middle">{r.trigger}</td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">{r.aiPermission}</td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                    <Badge variant={r.manualReviewRequired === 'Yes' ? 'red' : 'green'}>{r.manualReviewRequired}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] border-b border-[var(--color-border-light)] align-middle">
                    <Badge variant={statCls(r.status).replace('badge-', '') as any}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {knowledgeTab === 'policies' && (
        <div className="border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--bg-card)]">
          <div className="p-4">
            <div className="text-sm font-semibold mb-3">{t.knowledge.policyDocuments}</div>
            {POLICY_DOCS.map((p, i) => (
              <div key={i} className="py-2.5 border-b border-[var(--color-border-light)] last:border-b-0">
                <div className="text-[13px] font-semibold">{p[0]}</div>
                <div className="text-xs text-[var(--color-text-secondary)] my-1">{p[1]}</div>
                <div className="text-[11px] text-[var(--color-text-light)]">v{p[2]} | Updated: {p[3]}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
