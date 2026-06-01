import type { IngestionDocumentRecord, IngestionJob, KnowledgeChunk, KnowledgeDocument, RagConfigSnapshot, RagRun, RagTestRun } from './knowledge';
import type { ReplyDraft } from './ticket';
import type { ServiceHealthSnapshot } from './service-health';

export type ScenarioSettingsTab = 'scenario' | 'nodes';
export type EvaluationCenterTab = 'evaluation' | 'audit';

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
  status: 'draft' | 'active' | 'archived';
  outputMode: 'draft_reply' | 'agent_suggestion' | 'low_risk_auto_reply';
  knowledgeBindings: KnowledgeBinding[];
  evaluationSetIds: string[];
  safetyRuleIds: string[];
  nodeOverrides: ScenarioNodeOverride[];
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
  systemPrompt?: string;
  noMatchFallback: string;
  sensitiveCaseFallback: string;
  updatedAt: string;
}

export interface KnowledgeBinding {
  knowledgeBaseId: string;
  enabled: boolean;
  collectionIds: string[];
}

export interface ScenarioNodeOverride {
  nodeId: string;
  enabled: boolean;
  order: number;
  overrideMode: 'inherit' | 'override';
  primaryModel?: string;
  fallbackModel?: string;
  inputSource?: string;
  outputSchema?: string;
  timeoutMs?: number;
  retryCount?: number;
  fallbackStrategy?: string;
  citationRequired?: boolean;
  humanConfirmationRequired?: boolean;
}

export interface PipelineNodeModelConfig {
  id: string;
  nodeId: string;
  name: string;
  nodeName: string;
  nodeType: 'classification' | 'matching' | 'lookup' | 'summary' | 'retrieval' | 'policy_check' | 'generation' | 'risk_check' | 'routing' | 'task' | 'feedback';
  stage: 'pre_process' | 'context_enrichment' | 'knowledge_grounding' | 'decision_check' | 'response_generation' | 'review_routing' | 'post_process';
  executionMode: 'llm' | 'deterministic' | 'hybrid';
  defaultModel?: string;
  primaryModel?: string;
  fallbackModel?: string;
  inputFields: string[];
  inputSource: string;
  outputSchema: string;
  timeoutMs: number;
  retryTimes: number;
  retryCount: number;
  failureStrategy: string;
  fallbackStrategy: string;
  defaultScenarioTypes: string[];
  dependsOn: string[];
  requiredWhen: Array<'active' | 'sensitive_scenario' | 'manual_review_required' | 'shipping_refund_payment_recommended' | 'optional'>;
  usesKnowledgeBase: boolean;
  knowledgeScopeMode: 'strategy_bound' | 'retrieved_context' | 'optional_context' | 'none';
  requireCitation: boolean;
  citationRequired: boolean;
  humanConfirmationRequired: boolean;
  overridableFields: string[];
  enabledByDefault: boolean;
  lockedWhen: Array<'active' | 'sensitive_scenario' | 'manual_review_required'>;
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
  status: ScenarioModelConfig['status'];
  outputMode: ScenarioModelConfig['outputMode'];
  primaryModel: string;
  fallbackModel: string;
  knowledgeSummary: string;
  retrievalSummary: string;
  aiSuggestAllowed: boolean;
  humanSendAllowed: boolean;
  manualReviewRequired: boolean;
  blockedClaims: string[];
  activeNodeOverrideCount: number;
  activeNodeCount: number;
  validationIssues: string[];
  canActivate: boolean;
  riskTone: 'green' | 'yellow' | 'red';
  lastUpdated: string;
}

export interface EffectiveNodePolicy {
  nodeId: string;
  nodeConfigId: string;
  name: string;
  nodeName: string;
  nodeType: PipelineNodeModelConfig['nodeType'];
  stage: PipelineNodeModelConfig['stage'];
  executionMode: PipelineNodeModelConfig['executionMode'];
  enabled: boolean;
  inheritFromScenario: boolean;
  appliesToScenarios: string[];
  effectiveModel: string;
  fallbackModel: string;
  inputFields: string[];
  inputSource: string;
  outputSchema: string;
  timeoutMs: number;
  retryTimes: number;
  retryCount: number;
  fallbackStrategy: string;
  dependsOn: string[];
  requiredWhen: PipelineNodeModelConfig['requiredWhen'];
  usesKnowledgeBase: boolean;
  knowledgeScopeMode: PipelineNodeModelConfig['knowledgeScopeMode'];
  citationRequired: boolean;
  humanConfirmationRequired: boolean;
  overridableFields: string[];
  enabledByDefault: boolean;
  lockedWhen: PipelineNodeModelConfig['lockedWhen'];
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

export interface EvaluationRecord {
  id: string;
  target: string;
  refId: string;
  scenario: string;
  metric: string;
  score: string;
  issue: string;
  suggestion: string;
  conclusion: 'pass' | 'optimize' | 'high_risk';
  createdAt: string;
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
  refId: string;
  scenario: string;
  issueType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  action: string;
  createTodo: boolean;
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
