import type {
  AIConsolePageKey,
  AIEnvironmentConfig,
  AuditLogRecord,
  CustomerProfile,
  DocumentFilters,
  DerivedRoutingSummary,
  EffectiveNodePolicy,
  EffectiveScenarioPolicy,
  EvaluationRecord,
  FeedbackLoopRecord,
  IngestionDocumentRecord,
  ListQuery,
  Order,
  PagedResult,
  PipelineNodeModelConfig,
  RagConfigSnapshot,
  ReplyDraft,
  RagRun,
  RagRunFilters,
  RagTestRun,
  ScenarioSettingsTab,
  ReviewDecision,
  ScenarioModelConfig,
  ServiceHealthCheckResult,
  ServiceHealthError,
  ServiceHealthSnapshot,
  ServiceTicket,
  FollowUpTask,
  KnowledgeBaseRecord,
  KnowledgeDocument,
  NavKey,
  EvaluationCenterTab,
} from '../../types';

export interface AIConsoleBusinessCase {
  ticket: ServiceTicket | null;
  customer: CustomerProfile | null;
  order: Order | null;
  review: ReviewDecision | null;
  draft: ReplyDraft | null;
  ragRun: RagRun | null;
  knowledgeDocuments: KnowledgeDocument[];
  auditLogs: AuditLogRecord[];
  followUpTasks: FollowUpTask[];
  messageCount: number;
}

export interface AIConsoleProps {
  page: AIConsolePageKey;
  environment: AIEnvironmentConfig;
  guardrails: string[];
  aiOpsStages: { id: string; stage: string; owner: string; status: 'healthy' | 'watch' | 'risk'; throughput: string; detail: string; controlPoint: string }[];
  customers: CustomerProfile[];
  orders: Order[];
  businessCase: AIConsoleBusinessCase;
  ingestionDocuments: IngestionDocumentRecord[];
  ragConfig: RagConfigSnapshot;
  ragTestRuns: RagTestRun[];
  knowledgeBases: KnowledgeBaseRecord[];
  scenarioModelConfigs: ScenarioModelConfig[];
  pipelineNodeConfigs: PipelineNodeModelConfig[];
  effectiveScenarioPolicies: EffectiveScenarioPolicy[];
  effectiveNodePolicies: EffectiveNodePolicy[];
  routingSummary: DerivedRoutingSummary;
  documentResult: PagedResult<unknown>;
  documentQuery: ListQuery<DocumentFilters>;
  onDocumentQueryChange: (updater: (prev: ListQuery<DocumentFilters>) => ListQuery<DocumentFilters>) => void;
  ragRunResult: PagedResult<RagRun>;
  ragRunQuery: ListQuery<RagRunFilters>;
  onRagRunQueryChange: (updater: (prev: ListQuery<RagRunFilters>) => ListQuery<RagRunFilters>) => void;
  jobs: { id: string; documentName: string; status: string; detail: string }[];
  evaluations: EvaluationRecord[];
  feedbackLoop: FeedbackLoopRecord[];
  auditLogs: AuditLogRecord[];
  serviceHealth: ServiceHealthSnapshot;
  scenarioSettingsTab: ScenarioSettingsTab;
  evaluationCenterTab: EvaluationCenterTab;
  onOpenPage: (page: NavKey) => void;
  onSelectBusinessTicket: (ticketId: string) => void;
  onIngestionAction: (documentId: string, action: 'view_parsed_text' | 'view_chunks' | 'rebuild_embedding' | 'publish' | 'disable') => Promise<{ parsedText?: string; chunks?: string[]; message: string }>;
  onScenarioSettingsTabChange: (tab: ScenarioSettingsTab) => void;
  onUpdateRagConfig: (config: RagConfigSnapshot) => Promise<unknown>;
  onUpdateScenarioModelConfig: (config: ScenarioModelConfig) => Promise<unknown>;
  onUpdatePipelineNodeConfig: (config: PipelineNodeModelConfig) => Promise<unknown>;
  onEvaluationCenterTabChange: (tab: EvaluationCenterTab) => void;
  onRunRagTest: (payload: { customerQuestion: string; customerId: string; scenario: string; language: string; relatedOrderId: string }) => Promise<{ run: RagTestRun }>;
  onRefreshServiceHealth: () => Promise<ServiceHealthSnapshot>;
  onRunServiceHealthCheck: () => Promise<ServiceHealthCheckResult>;
  onRetryFailedJobs: () => Promise<{ retriedJobs: string[] }>;
  onRebuildVectorIndex: () => Promise<{ message: string }>;
  onViewServiceHealthLastError: (id?: string) => Promise<ServiceHealthError | undefined>;
}

export const AI_CONSOLE_PAGES: Array<{ key: AIConsolePageKey; navKey: NavKey; label: string; description: string }> = [
  { key: 'rag-config', navKey: 'ai-console-rag-config', label: '全局 RAG 配置', description: '维护环境级默认解析、切片、检索与 Prompt 组装参数' },
  { key: 'scenario-policy', navKey: 'ai-console-scenario-policy', label: 'AI 场景策略', description: '按业务场景统一管理模型、复核、发送权限与回退策略' },
  { key: 'rag-test-lab', navKey: 'ai-console-rag-test-lab', label: 'RAG 调试台', description: '问题输入、检索结果、Prompt 预览与护栏结果' },
  { key: 'evaluation-feedback', navKey: 'ai-console-evaluation-feedback', label: 'AI 质量监控', description: '监控 AI 客服回复质量，追踪风险事件与优化闭环' },
  { key: 'service-health', navKey: 'ai-console-service-health', label: '运行状态', description: '定位模型、向量库、连接器与文档接入链路异常' },
];

export const AI_CONSOLE_NAV_KEYS = new Set<NavKey>(AI_CONSOLE_PAGES.map(item => item.navKey));

export function getAIConsolePageFromNav(page: NavKey): AIConsolePageKey | null {
  if (page === 'ai-console-capability-nodes') return 'scenario-policy';
  if (page === 'ai-console-audit-logs') return 'evaluation-feedback';
  if (page === 'ai-console-service-health') return 'service-health';
  return AI_CONSOLE_PAGES.find(item => item.navKey === page)?.key ?? null;
}

export function getAIConsoleLabelFromNav(page: NavKey): string | null {
  if (page === 'ai-console-capability-nodes') return 'AI 场景策略';
  if (page === 'ai-console-audit-logs') return 'AI 质量监控';
  if (page === 'ai-console-service-health') return '运行状态';
  return AI_CONSOLE_PAGES.find(item => item.navKey === page)?.label ?? null;
}

export const scenarioOptions = [
  ['Shipping', '物流'],
  ['Refund', '退款'],
  ['Product Inquiry', '商品咨询'],
  ['Payment', '支付'],
  ['Complaint', '投诉'],
  ['Promotion', '促销'],
  ['Compensation', '赔偿'],
  ['Chargeback', '拒付'],
] as const;

export const knowledgeTypeOptions = ['FAQ', 'Policy', 'Product Spec', 'Business Rule', 'Reply Template'] as const;
export const sourceTypeOptions = ['PDF', 'DOCX', 'XLSX', 'CSV', 'HTML', 'TXT'] as const;
export const languageOptions = ['EN', 'ZH', 'DE', 'FR', 'ES', 'JA'] as const;
