export type NavKey =
  | 'overview'
  | 'service'
  | 'tickets'
  | 'customers'
  | 'orders'
  | 'knowledge'
  | 'system-operation-logs'
  | 'ai-console-ingestion'
  | 'ai-console-rag-config'
  | 'ai-console-scenario-policy'
  | 'ai-console-capability-nodes'
  | 'ai-console-rag-test-lab'
  | 'ai-console-evaluation-feedback'
  | 'ai-console-service-health'
  | 'ai-console-audit-logs'
  | 'tasks'
  | 'admin-settings';

export type AIConsolePageKey =
  | 'rag-config'
  | 'scenario-policy'
  | 'rag-test-lab'
  | 'evaluation-feedback'
  | 'service-health';

export interface OverviewNavigationTarget {
  page: NavKey;
  search?: string;
  ticketId?: string;
  customerId?: string;
  orderId?: string;
  ticketFilters?: Partial<TicketFilters>;
  customerFilters?: Partial<CustomerFilters>;
  orderFilters?: Partial<OrderFilters>;
}

export interface OverviewMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  target?: OverviewNavigationTarget;
}

export interface OverviewEventItem {
  id: string;
  title: string;
  detail: string;
  meta: string;
  tone: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  target: OverviewNavigationTarget;
}

export interface OverviewTodoItem {
  id: string;
  title: string;
  detail: string;
  badge: string;
  tone: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  target: OverviewNavigationTarget;
}

export interface OverviewShortcutItem {
  id: string;
  label: string;
  description: string;
  countLabel: string;
  tone: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  target: OverviewNavigationTarget;
}

export interface OverviewSnapshot {
  metrics: OverviewMetric[];
  analytics: AnalyticsData;
  events: OverviewEventItem[];
  todos: OverviewTodoItem[];
  shortcuts: OverviewShortcutItem[];
}

export type TicketStatus = 'New' | 'In Progress' | 'Pending Review' | 'Waiting Customer' | 'Closed' | 'Escalated';
export type Priority = 'Urgent' | 'High' | 'Normal' | 'Low';
export type IssueType =
  | 'Shipping Delay'
  | 'Refund Request'
  | 'Product Inquiry'
  | 'Coupon Issue'
  | 'Payment Issue'
  | 'Payment Failed'
  | 'Complaint'
  | 'Address Change'
  | 'Return Request'
  | 'VIP Support'
  | 'Order Cancellation'
  | 'Reorder Request';
export type TicketChannel = 'Email' | 'Live Chat' | 'Ticket';
export type MessageSender = 'customer' | 'agent' | 'system';
export type MessageType = 'text' | 'system';
export type TicketWorkflowStage =
  | 'triage'
  | 'retrieve'
  | 'draft'
  | 'review'
  | 'execute'
  | 'follow-up'
  | 'resolved';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'escalated';
export type ActionStatus = 'pending' | 'blocked' | 'completed';
export type IngestionJobStatus =
  | 'uploaded'
  | 'parsing'
  | 'parsed'
  | 'chunk_failed'
  | 'embedding_failed'
  | 'indexed'
  | 'published'
  | 'expired'
  | 'version_conflict';

export type IngestionStageStatus =
  | 'pending'
  | 'uploaded'
  | 'parsing'
  | 'parsed'
  | 'chunking'
  | 'embedded'
  | 'indexed'
  | 'failed'
  | 'published'
  | 'disabled';

export type KnowledgeFlow = 'list' | 'detail' | 'wizard';
export type KnowledgeDetailTab = 'documents' | 'ingestion' | 'pipeline' | 'retrieval-test' | 'settings';
export type ScenarioSettingsTab = 'scenario' | 'nodes';
export type EvaluationCenterTab = 'evaluation' | 'audit';
export type KnowledgeWizardStep = 1 | 2 | 3;
export type KnowledgeWizardSource = 'file' | 'notion' | 'web';
export type KnowledgeBaseSource = 'service_api' | 'external_api';
export type KnowledgeBaseStatus = 'active' | 'syncing' | 'draft';
export type KnowledgeProcessingStatus = 'processing' | 'success' | 'failed';

export interface Customer {
  id: string;
  name: string;
  email: string;
  country: string;
  language: string;
  type: string;
  totalOrders: number;
  lifetimeValue: number;
  lastContact: string;
  tags: string[];
  avatarColor: string;
  riskFlags: string[];
}

export interface CustomerTimelineEvent {
  id: string;
  type: 'order' | 'ticket' | 'review' | 'action' | 'followup' | 'rag';
  title: string;
  detail: string;
  at: string;
}

export interface CustomerProfile extends Customer {
  segment: string;
  owner: string;
  preferredLanguage: string;
  regionStrategy: string;
  complaintHistory: number;
  refundHistory: number;
  promiseFulfillment: string;
  recentServiceTimeline: CustomerTimelineEvent[];
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  date: string;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  carrier: string;
  tracking: string;
  latestEvent: string;
  daysSinceUpdate: number;
  riskAlert: string;
  items: OrderItem[];
}

export interface Ticket {
  id: string;
  customerId: string;
  channel: TicketChannel;
  issueType: IssueType;
  priority: Priority;
  status: TicketStatus;
  assignee: string;
  sla: string;
  aiSummary: string;
  aiSuggested: boolean;
  needsReview: boolean;
  lastUpdated: string;
  summary: string;
}

export interface RetrievalCandidate {
  id: string;
  source: string;
  chunkId: string;
  score: number;
  rerankScore: number;
  selected: boolean;
  rejectReason?: string;
  metadata: Record<string, string>;
  snippet: string;
}

export interface Citation {
  source: string;
  chunkId: string;
  match: string;
}

export interface PromptAssembly {
  systemRole: string;
  customerContext: string;
  orderContext: string;
  businessRules: string[];
  riskPolicy: string[];
  blockedClaims: string[];
  outputFormat: string;
}

export interface IngestionDocumentRecord {
  id: string;
  documentId: string;
  documentName: string;
  sourceType: string;
  knowledgeType: string;
  scenario: string;
  language: string;
  owner: string;
  version: string;
  effectiveDate: string;
  parseStatus: IngestionStageStatus;
  chunkStatus: IngestionStageStatus;
  embeddingStatus: IngestionStageStatus;
  indexStatus: IngestionStageStatus;
  chunkCount: number;
  vectorCount: number;
  lastSync: string;
  parsedText: string;
  chunkIds: string[];
  disabled: boolean;
}

export interface KnowledgeBaseRecord {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  documentCount: number;
  updatedAt: string;
  owner: string;
  source: KnowledgeBaseSource;
  status: KnowledgeBaseStatus;
  documentIds: string[];
}

export interface KnowledgeWizardDraft {
  knowledgeBaseId: string | null;
  sourceType: KnowledgeWizardSource;
  fileName: string;
  fileSizeLabel: string;
  documentName: string;
  knowledgeType: string;
  scenario: string;
  language: string;
  owner: string;
  version: string;
  effectiveDate: string;
  parser: ParserConfig;
  chunking: ChunkingConfig;
  retrieval: RetrievalConfig;
}

export interface KnowledgeProcessingResult {
  status: KnowledgeProcessingStatus;
  knowledgeBaseId: string | null;
  documentId: string;
  documentName: string;
  sourceLabel: string;
  chunkCount: number;
  vectorCount: number;
  indexMode: string;
  processedAt: string;
  failureReason?: string;
}

export interface ParserConfig {
  enableOCR: boolean;
  extractTables: boolean;
  extractHeadings: boolean;
  preserveDocumentStructure: boolean;
  removeBoilerplateText: boolean;
  detectLanguage: boolean;
}

export interface ChunkingConfig {
  strategy: 'by heading' | 'by paragraph' | 'fixed tokens';
  chunkSize: number;
  chunkOverlap: number;
  minChunkLength: number;
  maxChunkLength: number;
  keepSourceMetadata: boolean;
}

export interface EmbeddingConfig {
  model: string;
  batchSize: number;
  vectorDimension: number;
  indexName: string;
  indexVersion: string;
}

export interface RetrievalConfig {
  topK: number;
  similarityThreshold: number;
  rerankerEnabled: boolean;
  queryRewriteEnabled: boolean;
  metadataFilters: string[];
  citationRequired: boolean;
  noMatchFallback: string;
  lowConfidenceFallback: string;
  sensitiveCaseFallback: string;
}

export interface PromptAssemblyConfig {
  includeCustomerProfile: boolean;
  includeOrderContext: boolean;
  includeConversationHistory: boolean;
  includeRetrievedChunks: boolean;
  includeBusinessRules: boolean;
  includeRiskPolicy: boolean;
  includeBlockedClaims: boolean;
  outputFormat: string;
}

export interface RagConfigSnapshot {
  parser: ParserConfig;
  chunking: ChunkingConfig;
  embedding: EmbeddingConfig;
  retrieval: RetrievalConfig;
  promptAssembly: PromptAssemblyConfig;
  updatedAt: string;
}

export interface PromptPreviewSnapshot {
  systemRole: string;
  customerContext: string;
  orderContext: string;
  conversationSummary: string;
  retrievedKnowledge: string[];
  businessRules: string[];
  riskPolicy: string[];
  blockedClaims: string[];
  outputFormat: string;
}

export interface GuardrailCheckResult {
  autoSend: 'disabled';
  aiPermission: 'suggest_only' | 'disabled';
  confidence: number;
  citationCoverage: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  manualReviewRequired: boolean;
  result: 'passed' | 'review_required';
  notes: string[];
  trace?: GuardrailDecisionTrace;
}

export interface RagTestRun {
  id: string;
  customerQuestion: string;
  customerId: string;
  customerName: string;
  scenario: string;
  language: string;
  relatedOrderId: string;
  ticketId?: string;
  retrievedChunks: RetrievalCandidate[];
  promptPreview: PromptPreviewSnapshot;
  aiDraftReply: string;
  guardrailCheck: GuardrailCheckResult;
  createdAt: string;
}

export interface CapabilityPipelineNode {
  id: string;
  name: string;
  enabled: boolean;
  input: string;
  output: string;
  fallback: string;
  appliesToScenarios: string[];
  requiresHumanConfirmation: boolean;
}

export interface ScenarioModelConfig {
  id: string;
  scenario: string;
  name: string;
  version: string;
  primaryModel: string;
  fallbackModel: string;
  modelChannel: string;
  temperature: number;
  maxOutputTokens: number;
  contextWindow: number;
  queryRewriteEnabled: boolean;
  rerankerEnabled: boolean;
  topK: number;
  similarityThreshold: number;
  citationRequired: boolean;
  aiSuggestAllowed: boolean;
  manualReviewRequired: boolean;
  humanSendAllowed: boolean;
  blockedClaims: string[];
  lowConfidenceFallback: string;
  noMatchFallback: string;
  sensitiveCaseFallback: string;
  updatedAt: string;
}

export interface PipelineNodeModelConfig {
  id: string;
  nodeId: string;
  name: string;
  primaryModel?: string;
  fallbackModel?: string;
  inputSource: string;
  outputSchema: string;
  timeoutMs: number;
  retryCount: number;
  fallbackStrategy: string;
  citationRequired: boolean;
  humanConfirmationRequired: boolean;
  allowedScenarios: string[];
  inheritFromScenario: boolean;
  enabled: boolean;
  updatedAt: string;
}

export interface ModelRoutingSummary {
  defaultModel: string;
  embeddingModel: string;
  rerankerModel: string;
  defaultScenarioConfigId: string;
  activeScenarioCount: number;
  fallbackEnabledScenarioCount: number;
  manualReviewScenarioCount: number;
  summary: string;
}

export interface EffectiveScenarioPolicy {
  scenarioConfigId: string;
  scenario: string;
  strategyName: string;
  primaryModel: string;
  fallbackModel: string;
  retrievalSummary: string;
  aiSuggestAllowed: boolean;
  humanSendAllowed: boolean;
  manualReviewRequired: boolean;
  blockedClaims: string[];
  activeNodeOverrideCount: number;
  riskTone: 'green' | 'yellow' | 'red';
  lastUpdated: string;
}

export interface EffectiveNodePolicy {
  nodeId: string;
  nodeConfigId: string;
  name: string;
  enabled: boolean;
  inheritFromScenario: boolean;
  appliesToScenarios: string[];
  effectiveModel: string;
  fallbackModel: string;
  inputSource: string;
  outputSchema: string;
  timeoutMs: number;
  retryCount: number;
  fallbackStrategy: string;
  citationRequired: boolean;
  humanConfirmationRequired: boolean;
  effectiveSource: 'scenario' | 'node';
  sourceLabel: string;
  mappedCapabilityId?: string;
  lastUpdated: string;
}

export interface DerivedRoutingSummary {
  defaultModel: string;
  embeddingModel: string;
  rerankerModel: string;
  activeScenarioCount: number;
  fallbackEnabledScenarioCount: number;
  manualReviewScenarioCount: number;
  disabledNodeCount: number;
  overriddenNodeCount: number;
  summary: string;
}

export interface GuardrailDecisionTrace {
  scenarioConfigId: string;
  scenarioStrategyName: string;
  matchedNodeIds: string[];
  blockedClaims: string[];
}

export interface SendGuardrailResult {
  blocked: boolean;
  manualReviewRequired: boolean;
  reason: string;
  scenario: string;
  aiPermission: 'suggest_only' | 'disabled';
  autoSend: 'disabled';
}

export interface DraftSourceTrace {
  scenario: string;
  scenarioConfigId: string;
  scenarioConfigName: string;
  scenarioConfigVersion: string;
  draftingModel: string;
  retrievalSummary: string;
  citationRequired: boolean;
  manualReviewRequired: boolean;
  guardrailResult: string;
  nodeModels: string[];
}

export interface ReplyDraft {
  id: string;
  language: string;
  confidence: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  content: string;
  explanation: string[];
  citations: Citation[];
  sourceTrace?: DraftSourceTrace;
}

export interface ReviewDecision {
  id: string;
  status: ReviewStatus;
  reviewer: string;
  reason: string;
  updatedAt: string;
}

export interface TicketAction {
  id: string;
  label: string;
  status: ActionStatus;
  owner: string;
  result: string;
}

export interface ExecutionOutcome {
  customerPromise: string;
  followUpNeeded: boolean;
  followUpAt?: string;
  finalState: string;
}

export interface ServiceTicket extends Ticket {
  workflowStage: TicketWorkflowStage;
  intent: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  region: string;
  manualReview: boolean;
  policyDecision: string;
  requiredAction: string;
  selectedKnowledgeIds: string[];
  retrievalRunId: string;
  draftId: string;
  reviewDecisionId: string;
  actionIds: string[];
  executionOutcome: ExecutionOutcome;
  lastReplyAt?: string;
  lastReplyBy?: string;
  draftSavedAt?: string;
  sendGuardrailResult?: SendGuardrailResult;
}

export interface Message {
  ticketId: string;
  sender: MessageSender;
  type: MessageType;
  content: string;
  timestamp: string;
}

export interface FAQ {
  id: string;
  question: string;
  category: string;
  answerSummary: string;
  language: string;
  status: string;
  usageCount: number;
  matchAccuracy: number;
}

export interface ReplyTemplate {
  id: string;
  name: string;
  scenario: string;
  language: string;
  tone: string;
  status: string;
  usageCount: number;
  content: string;
}

export interface BusinessRule {
  id: string;
  name: string;
  scenario: string;
  trigger: string;
  aiPermission: string;
  manualReviewRequired: string;
  status: string;
}

export interface FollowUpTask {
  id: string;
  description: string;
  customerId: string;
  ticketId: string;
  due: string;
  priority: Priority;
  triggeredBy: string;
  status: string;
  owner: string;
}

export interface PolicyDoc {
  name: string;
  description: string;
  version: string;
  updated: string;
}

export interface AISuggestion {
  content: string;
  confidence: number;
  sources: { name: string; match: string }[];
  needsReview: boolean;
}

export interface AnalyticsMetric {
  label: string;
  value: string;
  trend: string;
  direction: 'up' | 'down';
  subtitle: string;
  color: string;
}

export interface AnalyticsData {
  metrics: AnalyticsMetric[];
  ticketVolume: { labels: string[]; values: number[] };
  channelDist: { label: string; value: number; color: string }[];
  issueDist: { label: string; value: number; color: string }[];
  aiAdoptionTrend: { label: string; value: number }[];
  topFAQ: { label: string; count: number }[];
  manualReviewBreakdown: { label: string; pct: number }[];
}

export interface AICapability {
  id: string;
  name: string;
  enabled: boolean;
  desc: string;
}

export interface PermissionBoundary {
  scenario: string;
  aiSuggest: string;
  aiSend: string;
  manualReview: string;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  user: string;
  time: string;
  detail: string;
}

export interface Agent {
  name: string;
  role: string;
}

export interface TeamRolePermissionProfile {
  role: string;
  scopeSummary: string;
  aiSuggest: string;
  humanSend: string;
  manualReviewOverride: string;
  knowledgeAccess: string;
  settingsAccess: string;
  auditAccess: string;
}

export interface MemberPermissionAssignment {
  memberName: string;
  role: string;
  inheritsFromRole: boolean;
  overrideSummary: string;
  effectivePermissions: string;
}

export interface SettingsPermissionSnapshot {
  roleProfiles: TeamRolePermissionProfile[];
  memberAssignments: MemberPermissionAssignment[];
}

export interface GlobalOperationLogEntry {
  id: string;
  timestampLabel: string;
  sourceType: 'system_activity' | 'ai_audit';
  actor: string;
  action: string;
  scope: string;
  result: string;
  detail: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
}

export interface OperationLogFilters {
  sourceType?: GlobalOperationLogEntry['sourceType'];
  scope?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
  actor?: string;
}

export interface SettingsOperationLogSnapshot {
  entries: GlobalOperationLogEntry[];
}

export interface SettingsData {
  general: { language: string; timezone: string; notifications: string };
  team: Agent[];
  permissions: SettingsPermissionSnapshot;
  operationLogs: SettingsOperationLogSnapshot;
  channels: Record<string, boolean>;
  notifications: Record<string, boolean>;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  sourceType: string;
  knowledgeType: string;
  scenario: string;
  language: string;
  owner: string;
  version: string;
  publishStatus: IngestionJobStatus;
  effectiveDate: string;
  chunkCount: number;
  vectorCount: number;
  coverageScore: number;
  parseError?: string;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  title: string;
  content: string;
  language: string;
  scenario: string;
}

export interface RagRun {
  id: string;
  ticketId: string;
  scenario: string;
  locale: string;
  originalQuery: string;
  rewrittenQuery: string;
  metadataFilters: string[];
  topK: number;
  candidates: RetrievalCandidate[];
  citations: Citation[];
  citationCoverage: number;
  knowledgeGapType: string | null;
  fallbackReason: string;
  status: 'healthy' | 'warning' | 'failed';
  createdAt: string;
}

export interface IngestionJob {
  id: string;
  documentId: string;
  documentName: string;
  status: IngestionJobStatus;
  startedAt: string;
  updatedAt: string;
  detail: string;
}

export interface EvaluationRecord {
  id: string;
  scenario: string;
  metric: string;
  score: string;
  baseline: string;
  status: 'good' | 'watch' | 'risk';
}

export interface AIOpsStage {
  id: string;
  stage: string;
  owner: string;
  status: 'healthy' | 'watch' | 'risk';
  throughput: string;
  detail: string;
  controlPoint: string;
}

export interface FeedbackLoopRecord {
  id: string;
  source: string;
  scenario: string;
  signal: string;
  action: string;
  owner: string;
  status: 'new' | 'triaged' | 'shipped';
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  ticketId: string;
  eventType: string;
  actor: string;
  outcome: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  timestamp: string;
  detail: string;
}

export type ServiceHealthStatus = 'healthy' | 'degraded' | 'down';
export type ServiceHealthSeverity = 'info' | 'warning' | 'critical';
export type IngestionQueueTaskStage = 'Parse' | 'Chunk' | 'Embedding' | 'Index' | 'Publish';
export type IngestionQueueTaskStatus = 'pending' | 'running' | 'failed' | 'completed' | 'retrying';

export interface LLMStatus {
  provider: string;
  primaryModel: string;
  fallbackModel: string;
  status: ServiceHealthStatus;
  avgLatencyMs: number;
  errorRate: number;
  rateLimitUsage: number;
  tokenUsageToday: number;
  estimatedCostToday: number;
  lastError: string;
  lastChecked: string;
}

export interface EmbeddingServiceStatus {
  provider: string;
  model: string;
  status: ServiceHealthStatus;
  queueSize: number;
  avgLatencyMs: number;
  failedJobs: number;
  vectorDimension: number;
  lastSuccessfulRun: string;
  rebuildStatus: 'idle' | 'running' | 'failed';
}

export interface VectorDbStatus {
  store: string;
  indexName: string;
  indexStatus: 'ready' | 'building' | 'degraded' | 'failed';
  vectorCount: number;
  namespace: string;
  storageUsage: string;
  queryLatencyMs: number;
  indexVersion: string;
  lastRebuild: string;
  lastQueryError: string;
}

export interface FunctionalModelStatus {
  nodeId: string;
  nodeName: string;
  status: ServiceHealthStatus;
  primaryModel: string;
  fallbackModel: string;
  timeoutMs: number;
  retryCount: number;
  citationRequired: boolean;
  humanConfirmationRequired: boolean;
  avgLatencyMs: number;
  errorRate: number;
  lastChecked: string;
  usedBy: string;
}

export interface ScenarioModelStatus {
  scenario: string;
  strategyName: string;
  status: ServiceHealthStatus;
  primaryModel: string;
  fallbackModel: string;
  modelChannel: string;
  temperature: number;
  topK: number;
  similarityThreshold: number;
  citationRequired: boolean;
  manualReviewRequired: boolean;
  humanSendAllowed: boolean;
  avgLatencyMs: number;
  errorRate: number;
  lastChecked: string;
}

export interface ConnectorStatus {
  systemName: string;
  status: ServiceHealthStatus;
  latencyMs: number;
  lastSync: string;
  lastError: string;
  usedBy: string;
}

export interface IngestionQueueTask {
  jobId: string;
  documentName: string;
  stage: IngestionQueueTaskStage;
  status: IngestionQueueTaskStatus;
  startedAt: string;
  duration: string;
  errorMessage: string;
  retryCount: number;
}

export interface DocumentIngestionQueueStatus {
  queueStatus: ServiceHealthStatus;
  pendingJobs: number;
  runningJobs: number;
  failedJobs: number;
  lastSuccessfulSync: string;
  scheduledSync: string;
  retryPolicy: string;
  oldestPendingJob: string;
  recentTasks: IngestionQueueTask[];
}

export interface ServiceHealthError {
  id: string;
  source: string;
  status: ServiceHealthStatus;
  message: string;
  detectedAt: string;
  impact: string;
}

export interface ServiceHealthDiagnostic {
  id: string;
  issue: string;
  severity: ServiceHealthSeverity;
  possibleCauses: string[];
  evidence: string[];
  recommendedActions: string[];
}

export interface ServiceHealthCheckResult {
  checkedAt: string;
  overallStatus: ServiceHealthStatus;
  summary: string;
  findings: string[];
}

export interface ServiceHealthSnapshot {
  llmStatus: LLMStatus;
  functionalModelStatuses: FunctionalModelStatus[];
  scenarioModelStatuses: ScenarioModelStatus[];
  embeddingStatus: EmbeddingServiceStatus;
  vectorDbStatus: VectorDbStatus;
  connectors: ConnectorStatus[];
  ingestionQueue: DocumentIngestionQueueStatus;
  recentErrors: ServiceHealthError[];
  diagnostics: ServiceHealthDiagnostic[];
  lastHealthCheck: ServiceHealthCheckResult;
}

export interface AIEnvironmentConfig {
  defaultModel: string;
  embeddingModel: string;
  rerankerModel: string;
  regionStrategy: string;
  fallbackStrategy: string;
  releaseChannel: string;
  maintenanceMode: boolean;
  runtimeStatus: 'healthy' | 'warning' | 'risk';
}

export type FilterValue = string | boolean | number | undefined;

export interface ListQuery<TFilters extends object> {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  filters: TFilters;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CustomerFilters {
  segment?: string;
  country?: string;
  language?: string;
  riskFlag?: string;
}

export interface TicketFilters {
  status?: string;
  workflowStage?: string;
  channel?: string;
  riskLevel?: string;
  assignee?: string;
}

export interface OrderFilters {
  fulfillmentStatus?: string;
  paymentStatus?: string;
  country?: string;
  risk?: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  triggeredBy?: string;
}

export interface DocumentFilters {
  scenario?: string;
  language?: string;
  publishStatus?: string;
  owner?: string;
}

export interface RagRunFilters {
  scenario?: string;
  status?: string;
  locale?: string;
  hasFallback?: boolean;
  knowledgeGapType?: string;
}

export interface AdminSnapshot {
  settings: SettingsData;
  agents: Agent[];
}

export interface InsightsSnapshot {
  analytics: AnalyticsData;
  activityLog: ActivityLogItem[];
}

export interface AIConsoleSnapshot {
  environment: AIEnvironmentConfig;
  aiCapabilities: AICapability[];
  permissionBoundaries: PermissionBoundary[];
  guardrails: string[];
  aiOpsStages: AIOpsStage[];
  knowledgeDocuments: KnowledgeDocument[];
  knowledgeChunks: KnowledgeChunk[];
  ingestionDocuments: IngestionDocumentRecord[];
  ragConfig: RagConfigSnapshot;
  ragRuns: RagRun[];
  ragTestRuns: RagTestRun[];
  replyDrafts: ReplyDraft[];
  ingestionJobs: IngestionJob[];
  capabilityPipeline: CapabilityPipelineNode[];
  scenarioModelConfigs: ScenarioModelConfig[];
  pipelineNodeConfigs: PipelineNodeModelConfig[];
  modelRoutingSummary: ModelRoutingSummary;
  evaluations: EvaluationRecord[];
  feedbackLoop: FeedbackLoopRecord[];
  auditLogs: AuditLogRecord[];
  serviceHealth: ServiceHealthSnapshot;
}

export interface ServiceHubSnapshot {
  customers: CustomerProfile[];
  orders: Order[];
  tickets: ServiceTicket[];
  messages: Message[];
  tasks: FollowUpTask[];
  faqs: FAQ[];
  replyTemplates: ReplyTemplate[];
  businessRules: BusinessRule[];
  policyDocs: PolicyDoc[];
  agents: Agent[];
  settings: SettingsData;
  analytics: AnalyticsData;
  activityLog: ActivityLogItem[];
  operationLogs: GlobalOperationLogEntry[];
  aiEnvironment: AIEnvironmentConfig;
  aiCapabilities: AICapability[];
  permissionBoundaries: PermissionBoundary[];
  guardrails: string[];
  aiOpsStages: AIOpsStage[];
  knowledgeDocuments: KnowledgeDocument[];
  knowledgeChunks: KnowledgeChunk[];
  ingestionDocuments: IngestionDocumentRecord[];
  ragConfig: RagConfigSnapshot;
  ragRuns: RagRun[];
  ragTestRuns: RagTestRun[];
  replyDrafts: ReplyDraft[];
  reviewDecisions: ReviewDecision[];
  ticketActions: TicketAction[];
  ingestionJobs: IngestionJob[];
  capabilityPipeline: CapabilityPipelineNode[];
  scenarioModelConfigs: ScenarioModelConfig[];
  pipelineNodeConfigs: PipelineNodeModelConfig[];
  modelRoutingSummary: ModelRoutingSummary;
  evaluations: EvaluationRecord[];
  feedbackLoop: FeedbackLoopRecord[];
  auditLogs: AuditLogRecord[];
  serviceHealth: ServiceHealthSnapshot;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
