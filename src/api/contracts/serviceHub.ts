import type {
  AdminSnapshot,
  AIConsoleSnapshot,
  CustomerFilters,
  CustomerProfile,
  DocumentFilters,
  EvaluationRecord,
  FollowUpTask,
  GuardrailCheckResult,
  IngestionDocumentRecord,
  IngestionJob,
  InsightsSnapshot,
  FAQ,
  KnowledgeDocument,
  ListQuery,
  PipelineNodeModelConfig,
  Order,
  OrderFilters,
  PolicyDoc,
  PagedResult,
  PromptPreviewSnapshot,
  RagRun,
  RagConfigSnapshot,
  RagRunFilters,
  RagTestRun,
  ReplyDraft,
  ReplyTemplate,
  ReviewDecision,
  ScenarioModelConfig,
  SendGuardrailResult,
  ServiceHubSnapshot,
  ServiceTicket,
  TicketFilters,
  TicketAction,
  BusinessRule,
} from '../../types';

export interface TicketRetrieveRequest {
  ticketId: string;
}

export interface TicketDraftRequest {
  ticketId: string;
}

export interface TicketReviewRequest {
  ticketId: string;
  decision: ReviewDecision['status'];
  reviewer: string;
  reason: string;
}

export interface TicketActionRequest {
  ticketId: string;
  actionId: string;
}

export interface TicketReplySendRequest {
  ticketId: string;
  content: string;
  agentName: string;
}

export interface TicketDraftSaveRequest {
  ticketId: string;
  content: string;
}

export interface TicketCloseRequest {
  ticketId: string;
  actor: string;
}

export interface CreateKnowledgeDocumentRequest {
  name: string;
  sourceType: string;
  knowledgeType: string;
  scenario: string;
  language: string;
  owner: string;
  version: string;
  effectiveDate: string;
}

export interface UpdateRagConfigRequest {
  ragConfig: RagConfigSnapshot;
}

export interface UpdateScenarioModelConfigRequest {
  config: ScenarioModelConfig;
}

export interface UpdatePipelineNodeConfigRequest {
  config: PipelineNodeModelConfig;
}

export interface RunRagTestRequest {
  customerQuestion: string;
  customerId: string;
  scenario: string;
  language: string;
  relatedOrderId: string;
}

export interface IngestionActionRequest {
  documentId: string;
  action: 'view_parsed_text' | 'view_chunks' | 'rebuild_embedding' | 'publish' | 'disable';
}

export interface IngestionActionResult {
  snapshot: ServiceHubSnapshot;
  document: IngestionDocumentRecord | undefined;
  parsedText?: string;
  chunks?: string[];
  message: string;
}

export interface TicketReplySendResult {
  snapshot: ServiceHubSnapshot;
  ticket: ServiceTicket | undefined;
  guardrail: SendGuardrailResult | undefined;
}

export interface TicketDraftSaveResult {
  snapshot: ServiceHubSnapshot;
  draft: ReplyDraft | undefined;
}

export interface TicketCloseResult {
  snapshot: ServiceHubSnapshot;
  ticket: ServiceTicket | undefined;
  blocked: boolean;
  message: string;
}

export interface RagTestRunResult {
  snapshot: ServiceHubSnapshot;
  run: RagTestRun;
  promptPreview: PromptPreviewSnapshot;
  guardrailCheck: GuardrailCheckResult;
}

export interface ServiceHubApi {
  getSnapshot(): Promise<ServiceHubSnapshot>;
  getCustomers(query: ListQuery<CustomerFilters>): Promise<PagedResult<CustomerProfile>>;
  getCustomer(id: string): Promise<CustomerProfile | undefined>;
  getTickets(query: ListQuery<TicketFilters>): Promise<PagedResult<ServiceTicket>>;
  getTicket(id: string): Promise<ServiceTicket | undefined>;
  getOrders(query: ListQuery<OrderFilters>): Promise<PagedResult<Order>>;
  retrieveTicket(request: TicketRetrieveRequest): Promise<{ snapshot: ServiceHubSnapshot; ragRun: RagRun | undefined }>;
  draftTicket(request: TicketDraftRequest): Promise<{ snapshot: ServiceHubSnapshot; draft: ReplyDraft | undefined }>;
  sendTicketReply(request: TicketReplySendRequest): Promise<TicketReplySendResult>;
  saveTicketDraft(request: TicketDraftSaveRequest): Promise<TicketDraftSaveResult>;
  closeTicket(request: TicketCloseRequest): Promise<TicketCloseResult>;
  reviewTicket(request: TicketReviewRequest): Promise<{ snapshot: ServiceHubSnapshot; review: ReviewDecision | undefined }>;
  runTicketAction(request: TicketActionRequest): Promise<{ snapshot: ServiceHubSnapshot; action: TicketAction | undefined; tasks: FollowUpTask[] }>;
  getKnowledgeDocuments(query: ListQuery<DocumentFilters>): Promise<PagedResult<KnowledgeDocument>>;
  getKnowledgeDocument(id: string): Promise<KnowledgeDocument | undefined>;
  getFaqs(): Promise<FAQ[]>;
  getReplyTemplates(): Promise<ReplyTemplate[]>;
  getBusinessRules(): Promise<BusinessRule[]>;
  getPolicyDocs(): Promise<PolicyDoc[]>;
  createKnowledgeDocument(request: CreateKnowledgeDocumentRequest): Promise<{ snapshot: ServiceHubSnapshot; job: IngestionJob; document: KnowledgeDocument }>;
  reindexKnowledgeDocument(id: string): Promise<{ snapshot: ServiceHubSnapshot; job: IngestionJob | undefined }>;
  runIngestionAction(request: IngestionActionRequest): Promise<IngestionActionResult>;
  updateRagConfig(request: UpdateRagConfigRequest): Promise<{ snapshot: ServiceHubSnapshot; ragConfig: RagConfigSnapshot }>;
  updateScenarioModelConfig(request: UpdateScenarioModelConfigRequest): Promise<{ snapshot: ServiceHubSnapshot; config: ScenarioModelConfig }>;
  updatePipelineNodeConfig(request: UpdatePipelineNodeConfigRequest): Promise<{ snapshot: ServiceHubSnapshot; config: PipelineNodeModelConfig }>;
  getRagRuns(query: ListQuery<RagRunFilters>): Promise<PagedResult<RagRun>>;
  getRagRun(id: string): Promise<RagRun | undefined>;
  runRagTest(request: RunRagTestRequest): Promise<RagTestRunResult>;
  getEvaluations(): Promise<EvaluationRecord[]>;
  getAIConsoleSnapshot(): Promise<AIConsoleSnapshot>;
  getInsightsSnapshot(): Promise<InsightsSnapshot>;
  getAdminSnapshot(): Promise<AdminSnapshot>;
}
