export const RAG_PIPELINE = [
  { step: 'Knowledge Source', desc: '5 active sources connected', status: 'Active', lastRun: '2026-05-21 08:00', output: '5 sources' },
  { step: 'Document Parsing', desc: 'All documents parsed successfully', status: 'Active', lastRun: '2026-05-21 08:00', output: '486 docs' },
  { step: 'Chunking', desc: 'Documents split into searchable chunks', status: 'Active', lastRun: '2026-05-21 08:00', output: '866 chunks' },
  { step: 'Embedding', desc: 'Chunks embedded via text-embedding-3-small', status: 'Active', lastRun: '2026-05-21 08:00', output: '866 vectors' },
  { step: 'Vector Index', desc: 'Vectors stored in pgvector index', status: 'Active', lastRun: '2026-05-21 08:00', output: '866 indexed' },
  { step: 'Query Rewrite', desc: 'Customer query rewritten for retrieval', status: 'Active', lastRun: '2026-05-21 08:00', output: '142 queries' },
  { step: 'Retrieval', desc: 'topK = 5, similarity threshold = 0.78', status: 'Active', lastRun: '2026-05-21 08:00', output: '5 per query' },
  { step: 'Reranking', desc: 'Cross-encoder reranks retrieved chunks', status: 'Active', lastRun: '2026-05-21 08:00', output: '3 per query' },
  { step: 'Prompt Assembly', desc: 'Context assembled with system prompt + rules', status: 'Active', lastRun: '2026-05-21 08:00', output: '142 prompts' },
  { step: 'LLM Generation', desc: 'GPT-4.1 mock generates draft reply', status: 'Active', lastRun: '2026-05-21 08:00', output: '142 drafts' },
  { step: 'Guardrail Check', desc: 'Refund / compensation / chargeback policies enabled', status: 'Active', lastRun: '2026-05-21 08:00', output: '3 risks caught' },
  { step: 'Human Review', desc: 'Low confidence / sensitive cases routed for review', status: 'Active', lastRun: '2026-05-21 08:00', output: '12 pending' },
  { step: 'Feedback Loop', desc: 'Human edits collected to improve system', status: 'Active', lastRun: '2026-05-21 08:00', output: '42 feedback items' },
];

export const KNOWLEDGE_SOURCES = [
  { name: 'Shipping Policy', type: 'Policy Doc', category: 'Shipping', language: 'EN', owner: 'Ops', status: 'Active', lastSync: '2026-05-20', docCount: 4, chunkCount: 128, version: 'v1.6' },
  { name: 'Refund Policy', type: 'Policy Doc', category: 'Refund', language: 'EN', owner: 'CS Lead', status: 'Active', lastSync: '2026-05-19', docCount: 3, chunkCount: 96, version: 'v2.3' },
  { name: 'Product Specs', type: 'Product Data', category: 'Product', language: 'Multi-language', owner: 'Product Team', status: 'Active', lastSync: '2026-05-18', docCount: 320, chunkCount: 342, version: 'v3.1' },
  { name: 'FAQ Center', type: 'FAQ', category: 'General', language: 'EN', owner: 'Support', status: 'Active', lastSync: '2026-05-20', docCount: 120, chunkCount: 220, version: 'v2.0' },
  { name: 'Reply Templates', type: 'Template', category: 'Support', language: 'EN', owner: 'CS Lead', status: 'Active', lastSync: '2026-05-17', docCount: 48, chunkCount: 80, version: 'v1.8' },
  { name: 'Promotion Rules', type: 'Business Rule', category: 'Promotion', language: 'EN', owner: 'Marketing', status: 'Warning', lastSync: '2026-05-12', docCount: 8, chunkCount: 38, version: 'v1.2' },
];

export const PROMPT_TEMPLATES = [
  { name: 'Shipping Delay Reply', scenario: 'Logistics', version: 'v1.4', status: 'Active', owner: 'CS Lead', updated: '2026-05-20', usedBy: 89, humanEditRate: '18%', systemRole: 'You are a customer service assistant for a cross-border ecommerce brand.', customerContext: 'Customer name, order ID, shipping address, current status', orderContext: 'Order date, carrier, tracking number, last update', retrievedKnowledge: 'Shipping Delay Policy, Logistics Tracking FAQ, Lost Package Handling Rule', businessRules: 'No refund promise without supervisor approval', toneRequirement: 'Empathetic, clear, solution-oriented', blockedClaims: ['Do not promise refund', 'Do not promise compensation', 'Do not invent delivery date', 'Do not close complaint without human review'], outputFormat: 'Greeting + Empathy + Update + Next Step + Closing' },
  { name: 'Refund Request Review', scenario: 'Refund', version: 'v1.8', status: 'Active', owner: 'Ops', updated: '2026-05-19', usedBy: 67, humanEditRate: '42%', systemRole: 'You are a customer service assistant processing refund requests.', customerContext: 'Customer name, order ID, refund reason', orderContext: 'Order date, amount, payment method, fulfillment status', retrievedKnowledge: 'Refund Policy, Compensation Guidelines', businessRules: 'Refund eligibility check, supervisor approval for amounts over $20', toneRequirement: 'Professional, transparent, policy-based', blockedClaims: ['Do not promise instant refund', 'Do not offer compensation without approval', 'Do not waive restocking fee'], outputFormat: 'Eligibility Check + Refund Amount + Processing Time + Next Steps' },
  { name: 'Product Inquiry Answer', scenario: 'Pre-sale', version: 'v1.2', status: 'Active', owner: 'Product', updated: '2026-05-18', usedBy: 45, humanEditRate: '12%', systemRole: 'You are a pre-sales assistant for an ecommerce brand.', customerContext: 'Customer name, inquiry type', orderContext: 'No order yet', retrievedKnowledge: 'Product Specs, FAQ Center', businessRules: 'No price guarantee beyond 7 days', toneRequirement: 'Helpful, enthusiastic, informative', blockedClaims: ['Do not promise stock availability', 'Do not guarantee delivery dates'], outputFormat: 'Answer + Product Details + Recommendation + CTA' },
  { name: 'Complaint Handling', scenario: 'Complaint', version: 'v2.1', status: 'Active', owner: 'Supervisor', updated: '2026-05-17', usedBy: 34, humanEditRate: '55%', systemRole: 'You are a senior customer service agent handling escalated complaints.', customerContext: 'Customer name, complaint type, previous interactions', orderContext: 'Order details, previous support history', retrievedKnowledge: 'Compensation Guidelines, Complaint Escalation Process, VIP Customer Protocol', businessRules: 'Complaint escalation flow, mandatory supervisor notification', toneRequirement: 'Apologetic, respectful, solution-focused', blockedClaims: ['Do not admit fault without legal review', 'Do not promise specific compensation amount', 'Do not close complaint without human review', 'Do not escalate without supervisor approval'], outputFormat: 'Apology + Acknowledgment + Investigation Plan + Timeline + Next Contact' },
];

export const MODEL_POLICY = {
  primaryModel: 'GPT-4.1 mock',
  fallbackModel: 'GPT-4.1-mini mock',
  embeddingModel: 'text-embedding-3-small mock',
  temperature: 0.2,
  maxTokens: 600,
  responseLanguage: 'Customer language',
  citationRequired: true,
  autoSend: false,
  humanConfirmation: true,
  sensitiveCaseRouting: true,
  scenarioMatrix: [
    { scenario: 'Product Inquiry', model: 'Fast model', temperature: 0.2, autoSend: 'No', manualReview: 'No', fallback: 'Human if low confidence' },
    { scenario: 'Shipping Delay', model: 'Standard model', temperature: 0.2, autoSend: 'No', manualReview: 'No', fallback: 'Create follow-up task' },
    { scenario: 'Refund Request', model: 'Standard model', temperature: 0.1, autoSend: 'No', manualReview: 'Yes', fallback: 'Supervisor review' },
    { scenario: 'Compensation', model: 'Standard model', temperature: 0.1, autoSend: 'No', manualReview: 'Yes', fallback: 'Supervisor review' },
    { scenario: 'Chargeback', model: 'Standard model', temperature: 0.0, autoSend: 'No', manualReview: 'Yes', fallback: 'Finance review' },
    { scenario: 'Complaint', model: 'Standard model', temperature: 0.1, autoSend: 'No', manualReview: 'Yes', fallback: 'Supervisor review' },
  ],
};

export const GUARDRAILS = [
  { scenario: 'Refund', detectionRule: 'refund_request intent', aiPermission: 'Suggest only', blockedAction: 'Cannot approve refund', humanAction: 'Check policy eligibility', status: 'Active' },
  { scenario: 'Compensation', detectionRule: 'compensation keywords', aiPermission: 'Suggest only', blockedAction: 'Cannot promise compensation', humanAction: 'Supervisor approval', status: 'Active' },
  { scenario: 'Chargeback', detectionRule: 'chargeback or dispute keyword', aiPermission: 'Notify only', blockedAction: 'Cannot respond directly', humanAction: 'Finance review', status: 'Active' },
  { scenario: 'Legal Threat', detectionRule: 'legal or lawsuit keyword', aiPermission: 'No reply', blockedAction: 'Cannot draft final response', humanAction: 'Escalate to legal', status: 'Active' },
  { scenario: 'Complaint', detectionRule: 'complaint sentiment high', aiPermission: 'Suggest only', blockedAction: 'Cannot close ticket', humanAction: 'Supervisor review', status: 'Active' },
];

export const EVALUATION_METRICS = [
  { label: 'Grounded Answer Rate', value: '91%', color: 'var(--color-success)' },
  { label: 'Citation Coverage', value: '88%', color: 'var(--color-success)' },
  { label: 'Hallucination Risk', value: '3.2%', color: 'var(--color-danger)' },
  { label: 'Human Edit Rate', value: '27%', color: 'var(--color-warning)' },
  { label: 'Suggestion Adoption Rate', value: '72%', color: 'var(--color-success)' },
  { label: 'Sensitive Detection Accuracy', value: '94%', color: 'var(--color-success)' },
  { label: 'FAQ Match Precision', value: '86%', color: 'var(--color-success)' },
  { label: 'Low Confidence Escalation Rate', value: '11%', color: 'var(--color-warning)' },
];

export const EVALUATION_ITEMS = [
  { item: 'Shipping delay reply', scenario: 'Shipping', aiOutput: 'Provided tracking info and apology', humanFeedback: 'Good', score: 92, issueType: 'Accurate', action: 'No action' },
  { item: 'Refund reply', scenario: 'Refund', aiOutput: 'Generated refund eligibility check', humanFeedback: 'Needs review', score: 78, issueType: 'Too direct', action: 'Update prompt' },
  { item: 'Complaint handling', scenario: 'Complaint', aiOutput: 'Drafted apology', humanFeedback: 'Needs improvement', score: 65, issueType: 'Tone too defensive', action: 'Update prompt' },
];

export const FEEDBACK_ITEMS = [
  { ticketId: 'TKT-002', scenario: 'Refund', agentAction: 'Edited', editRate: '42%', feedbackLabel: 'Too direct', suggestedImprovement: 'Add stronger refund boundary wording', status: 'Pending Review' },
  { ticketId: 'TKT-009', scenario: 'Complaint', agentAction: 'Edited', editRate: '55%', feedbackLabel: 'Tone issue', suggestedImprovement: 'Softer apology template needed', status: 'In Progress' },
  { ticketId: 'TKT-001', scenario: 'Shipping', agentAction: 'Adopted', editRate: '8%', feedbackLabel: 'Good', suggestedImprovement: 'No action', status: 'Closed' },
];

export const INGESTION_RECORDS = [
  { id: 'DOC-001', name: 'Shipping Delay Policy v2.1.pdf', sourceType: 'PDF', knowledgeType: 'Policy', scenario: 'Shipping', language: 'EN', owner: 'Ops', parseStatus: 'Parsed', chunkStatus: 'Indexed', embeddingStatus: 'Indexed', indexStatus: 'Published', chunkCount: 32, vectorCount: 32, version: 'v2.1', lastSync: '2026-05-20 08:30' },
  { id: 'DOC-002', name: 'Refund Policy v3.0.docx', sourceType: 'DOCX', knowledgeType: 'Policy', scenario: 'Refund', language: 'EN', owner: 'CS Lead', parseStatus: 'Parsed', chunkStatus: 'Indexed', embeddingStatus: 'Indexed', indexStatus: 'Published', chunkCount: 24, vectorCount: 24, version: 'v3.0', lastSync: '2026-05-19 14:00' },
  { id: 'DOC-003', name: 'Product Specs Catalog.xlsx', sourceType: 'XLSX', knowledgeType: 'Product Spec', scenario: 'Product Inquiry', language: 'Multi', owner: 'Product Team', parseStatus: 'Parsed', chunkStatus: 'Chunking', embeddingStatus: 'Pending', indexStatus: 'Pending', chunkCount: 86, vectorCount: 0, version: 'v3.1', lastSync: '2026-05-21 09:15' },
  { id: 'DOC-004', name: 'FAQ Center Export.csv', sourceType: 'CSV', knowledgeType: 'FAQ', scenario: 'Shipping', language: 'EN', owner: 'Support', parseStatus: 'Parsed', chunkStatus: 'Indexed', embeddingStatus: 'Indexed', indexStatus: 'Published', chunkCount: 48, vectorCount: 48, version: 'v2.0', lastSync: '2026-05-20 10:45' },
  { id: 'DOC-005', name: 'Compensation Guidelines.html', sourceType: 'HTML', knowledgeType: 'Business Rule', scenario: 'Complaint', language: 'EN', owner: 'Supervisor', parseStatus: 'Parsing', chunkStatus: 'Pending', embeddingStatus: 'Pending', indexStatus: 'Pending', chunkCount: 0, vectorCount: 0, version: 'v1.5', lastSync: '2026-05-21 10:00' },
  { id: 'DOC-006', name: 'Reply Templates.txt', sourceType: 'TXT', knowledgeType: 'Reply Template', scenario: 'Refund', language: 'EN', owner: 'CS Lead', parseStatus: 'Parsed', chunkStatus: 'Indexed', embeddingStatus: 'Indexed', indexStatus: 'Published', chunkCount: 16, vectorCount: 16, version: 'v1.8', lastSync: '2026-05-17 16:20' },
  { id: 'DOC-007', name: 'VIP Customer Protocol.pdf', sourceType: 'PDF', knowledgeType: 'Policy', scenario: 'Complaint', language: 'EN', owner: 'Supervisor', parseStatus: 'Parsed', chunkStatus: 'Embedded', embeddingStatus: 'Embedded', indexStatus: 'Pending', chunkCount: 12, vectorCount: 12, version: 'v2.0', lastSync: '2026-05-18 11:30' },
  { id: 'DOC-008', name: 'Promotion Rules Q2.docx', sourceType: 'DOCX', knowledgeType: 'Business Rule', scenario: 'Promotion', language: 'EN', owner: 'Marketing', parseStatus: 'Failed', chunkStatus: 'Failed', embeddingStatus: 'Failed', indexStatus: 'Failed', chunkCount: 0, vectorCount: 0, version: 'v1.2', lastSync: '2026-05-12 09:00' },
];

export const RAG_CONFIG_DEFAULTS = {
  parser: { enableOCR: true, extractTables: true, extractHeadings: true, preserveStructure: true },
  chunking: { strategy: 'by heading', chunkSize: 500, chunkOverlap: 80, minChunkLength: 50, maxChunkLength: 1000 },
  embedding: { model: 'text-embedding-3-small', batchSize: 64, indexName: 'crm_knowledge_v1', indexVersion: 'v1.3' },
  retrieval: { topK: 5, similarityThreshold: 0.78, rerankerEnabled: true, queryRewriteEnabled: true, metadataFilters: ['language', 'scenario', 'country', 'policy_version'], citationRequired: true, noMatchFallback: 'Ask agent to write manually', lowConfidenceFallback: 'Route to human review', sensitiveFallback: 'Supervisor review' },
  promptAssembly: { includeCustomerProfile: true, includeOrderContext: true, includeConvHistory: true, includeRetrievedChunks: true, includeBusinessRules: true, includeBlockedClaims: true, outputFormat: 'Greeting + Empathy + Update + Next Step + Closing' },
};

export const RAG_TEST_MOCK_CHUNKS = [
  { source: 'Shipping Delay Policy', chunk: 'Section 3.2: If tracking has not updated for 5+ business days, the agent should escalate to the carrier escalation team. Customer should be notified within 24 hours with a concrete update.', score: 0.92, metadata: { language: 'EN', scenario: 'Shipping', version: 'v2.1' }, matchReason: 'High keyword match on "tracking", "not updated", "shipping delay"' },
  { source: 'Logistics Tracking FAQ', chunk: 'Q: My tracking has not updated in days. What should I do? A: Contact our support team. We will open a carrier investigation and provide an update within 24 hours. Do not re-order — the package is likely still in transit.', score: 0.86, metadata: { language: 'EN', scenario: 'Shipping', version: 'v1.4' }, matchReason: 'Semantic similarity to tracking query and delay scenario' },
  { source: 'Lost Package Handling Rule', chunk: 'Rule 4.1: If a package shows no tracking updates for 7+ days after the expected delivery date, initiate a lost package claim. Offer customer the choice of reship or refund (requires supervisor approval for refund).', score: 0.78, metadata: { language: 'EN', scenario: 'Shipping', version: 'v1.5' }, matchReason: 'Partial match on tracking and delivery issue' },
];

export const CAPABILITY_PIPELINE = [
  { id: 'intent-classification', name: 'Intent Classification', enabled: true, input: 'Customer message text', output: 'Intent label + confidence', fallback: 'Default to "General Inquiry"', scenarios: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'], requiresHumanConfirmation: false },
  { id: 'customer-matching', name: 'Customer Matching', enabled: true, input: 'Customer identifier / email / name', output: 'Customer profile record', fallback: 'Create new customer record', scenarios: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'], requiresHumanConfirmation: false },
  { id: 'order-linking', name: 'Order Linking', enabled: true, input: 'Customer ID + order reference', output: 'Order details + fulfillment status', fallback: 'Ask customer for order number', scenarios: ['Shipping', 'Refund', 'Payment', 'Complaint'], requiresHumanConfirmation: false },
  { id: 'conversation-summary', name: 'Conversation Summary', enabled: true, input: 'Full conversation thread', output: 'Condensed summary + key points', fallback: 'Show last 3 messages', scenarios: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'], requiresHumanConfirmation: false },
  { id: 'knowledge-retrieval', name: 'Knowledge Retrieval', enabled: true, input: 'Intent + customer question + context', output: 'Top-K relevant knowledge chunks', fallback: 'No-match fallback → manual reply', scenarios: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'], requiresHumanConfirmation: false },
  { id: 'policy-check', name: 'Policy Check', enabled: true, input: 'Intent + retrieved knowledge + business rules', output: 'Applicable policies + blocked actions', fallback: 'Default to conservative policy', scenarios: ['Refund', 'Compensation', 'Chargeback', 'Complaint'], requiresHumanConfirmation: true },
  { id: 'reply-drafting', name: 'Reply Drafting', enabled: true, input: 'Context + knowledge + policies + tone', output: 'Draft reply text', fallback: 'Template-based fallback reply', scenarios: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'], requiresHumanConfirmation: false },
  { id: 'risk-detection', name: 'Risk Detection', enabled: true, input: 'Draft reply + scenario + customer risk flags', output: 'Risk level + flagged items', fallback: 'Route all risky cases to human review', scenarios: ['Refund', 'Compensation', 'Chargeback', 'Complaint'], requiresHumanConfirmation: true },
  { id: 'human-review-routing', name: 'Human Review Routing', enabled: true, input: 'Risk detection result + confidence score', output: 'Route decision: auto / review / escalate', fallback: 'Always route to human if uncertain', scenarios: ['Refund', 'Compensation', 'Chargeback', 'Complaint'], requiresHumanConfirmation: true },
  { id: 'followup-task', name: 'Follow-up Task Creation', enabled: true, input: 'Ticket outcome + unresolved items', output: 'Auto-created follow-up task', fallback: 'Manual task creation by agent', scenarios: ['Shipping', 'Refund', 'Complaint'], requiresHumanConfirmation: false },
  { id: 'feedback-capture', name: 'Feedback Capture', enabled: true, input: 'Agent action on AI suggestion (adopt/edit/reject)', output: 'Feedback record + improvement suggestion', fallback: 'No feedback captured', scenarios: ['Shipping', 'Refund', 'Product Inquiry', 'Payment', 'Complaint'], requiresHumanConfirmation: false },
];

export const AUDIT_LOGS = [
  { time: '2026-05-20 09:30', ticketId: 'TKT-001', customer: 'John Smith', aiAction: 'Suggested Reply', model: 'GPT-4.1 mock', promptVersion: 'Shipping v1.4', retrievedSources: 3, confidence: '89%', riskLevel: 'Medium', agentAction: 'Adopted' },
  { time: '2026-05-20 10:15', ticketId: 'TKT-002', customer: 'Emily Carter', aiAction: 'Refund Draft', model: 'GPT-4.1 mock', promptVersion: 'Refund v1.8', retrievedSources: 4, confidence: '76%', riskLevel: 'High', agentAction: 'Edited + Reviewed' },
  { time: '2026-05-20 10:30', ticketId: 'TKT-009', customer: 'Ava Chen', aiAction: 'Complaint Draft', model: 'GPT-4.1 mock', promptVersion: 'Complaint v2.1', retrievedSources: 5, confidence: '68%', riskLevel: 'High', agentAction: 'Escalated' },
  { time: '2026-05-20 11:00', ticketId: 'TKT-015', customer: 'Mike Johnson', aiAction: 'Suggested Reply', model: 'GPT-4.1 mock', promptVersion: 'Shipping v1.4', retrievedSources: 2, confidence: '92%', riskLevel: 'Low', agentAction: 'Adopted' },
  { time: '2026-05-20 11:45', ticketId: 'TKT-018', customer: 'Sarah Lee', aiAction: 'Refund Draft', model: 'GPT-4.1 mock', promptVersion: 'Refund v1.8', retrievedSources: 3, confidence: '71%', riskLevel: 'High', agentAction: 'Edited' },
];
