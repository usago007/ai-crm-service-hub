import { useT } from '../../i18n';
import { Badge } from '../common/Badge';
import { Toggle } from '../common/Toggle';
import { CAPABILITY_PIPELINE } from '../../data/aiOperations';

export function CapabilityPipeline() {
  const { t } = useT();

  const nameKeyMap: Record<string, string> = {
    'intent-classification': 'intentClassification',
    'customer-matching': 'customerMatching',
    'order-linking': 'orderLinking',
    'conversation-summary': 'conversationSummary',
    'knowledge-retrieval': 'knowledgeRetrieval',
    'policy-check': 'policyCheck',
    'reply-drafting': 'replyDrafting',
    'risk-detection': 'riskDetection',
    'human-review-routing': 'humanReviewRouting',
    'followup-task': 'followupTask',
    'feedback-capture': 'feedbackCapture',
  };

  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto pb-3 mb-4">
        {CAPABILITY_PIPELINE.map((node, i) => (
          <div key={node.id} className="flex items-center gap-1 flex-shrink-0">
            <div className="px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-primary)] rounded-[var(--radius-sm)] text-[13px] font-medium text-[var(--color-primary)] whitespace-nowrap">
              {t.aiOps[nameKeyMap[node.id] as keyof typeof t.aiOps] || node.name}
            </div>
            {i < CAPABILITY_PIPELINE.length - 1 && <span className="text-[var(--color-text-light)] mx-0.5">→</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 max-[1200px]:grid-cols-2 max-[800px]:grid-cols-1">
        {CAPABILITY_PIPELINE.map(node => (
          <div key={node.id} className="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-semibold">{t.aiOps[nameKeyMap[node.id] as keyof typeof t.aiOps] || node.name}</div>
              <Badge variant={node.enabled ? 'green' : 'gray'}>{node.enabled ? t.aiOps.enabled : t.aiOps.disabled}</Badge>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between border-b border-[var(--color-border-light)] pb-1.5">
                <span className="text-[var(--color-text-secondary)]">{t.aiOps.input}</span>
                <span className="font-medium text-right max-w-[60%]">{node.input}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--color-border-light)] pb-1.5">
                <span className="text-[var(--color-text-secondary)]">{t.aiOps.output}</span>
                <span className="font-medium text-right max-w-[60%]">{node.output}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--color-border-light)] pb-1.5">
                <span className="text-[var(--color-text-secondary)]">{t.aiOps.fallback}</span>
                <span className="font-medium text-right max-w-[60%]">{node.fallback}</span>
              </div>
              <div className="border-b border-[var(--color-border-light)] pb-1.5">
                <span className="text-[var(--color-text-secondary)]">{t.aiOps.appliesTo}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {node.scenarios.map(s => <span key={s} className="px-1.5 py-0.5 bg-[var(--color-primary-bg)] text-[var(--color-primary)] rounded text-[10px] font-medium">{s}</span>)}
                </div>
              </div>
              <Toggle label={t.aiOps.requiresHuman} on={node.requiresHumanConfirmation} onClick={() => {}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
