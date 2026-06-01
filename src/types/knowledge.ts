import type { GuardrailDecisionTrace } from './ai-console';

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
export type KnowledgeDetailTab = 'documents' | 'ingestion' | 'retrieval-test' | 'settings';
export type KnowledgeWizardStep = 1 | 2 | 3;
export type KnowledgeWizardSource = 'file' | 'notion' | 'web';
export type KnowledgeBaseSource = 'service_api' | 'external_api';
export type KnowledgeBaseStatus = 'active' | 'syncing' | 'draft';
export type KnowledgeProcessingStatus = 'processing' | 'success' | 'failed';

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
  collections: KnowledgeCollectionRecord[];
  referencedByScenarioIds: string[];
  referenceStats: {
    activeCount: number;
    draftCount: number;
    avgLatestScore?: number;
  };
  configOverrides?: {
    chunking?: { strategy?: string; chunkSize?: number; chunkOverlap?: number };
    retrieval?: { topK?: number; similarityThreshold?: number };
  };
}

export interface KnowledgeCollectionRecord {
  id: string;
  knowledgeBaseId: string;
  name: string;
  description: string;
  scenarioTags: string[];
  documentIds: string[];
  status: KnowledgeBaseStatus;
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
  failureStage?: string;
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
  replyTone: 'concise' | 'standard' | 'detailed';
  manualReviewStrategy: 'all' | 'high_risk_only' | 'low_risk_auto';
  defaultSystemPrompt?: string;
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
