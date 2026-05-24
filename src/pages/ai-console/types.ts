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
  RagRun,
  RagRunFilters,
  RagTestRun,
  ScenarioModelConfig,
  NavKey,
} from '../../types';

export interface AIConsoleProps {
  page: AIConsolePageKey;
  environment: AIEnvironmentConfig;
  guardrails: string[];
  aiOpsStages: { id: string; stage: string; owner: string; status: 'healthy' | 'watch' | 'risk'; throughput: string; detail: string; controlPoint: string }[];
  customers: CustomerProfile[];
  orders: Order[];
  ingestionDocuments: IngestionDocumentRecord[];
  ragConfig: RagConfigSnapshot;
  ragTestRuns: RagTestRun[];
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
  onReplayRun: (ticketId: string) => void;
  onIngestionAction: (documentId: string, action: 'view_parsed_text' | 'view_chunks' | 'rebuild_embedding' | 'publish' | 'disable') => Promise<{ parsedText?: string; chunks?: string[]; message: string }>;
  onUpdateRagConfig: (config: RagConfigSnapshot) => Promise<unknown>;
  onUpdateScenarioModelConfig: (config: ScenarioModelConfig) => Promise<unknown>;
  onUpdatePipelineNodeConfig: (config: PipelineNodeModelConfig) => Promise<unknown>;
  onRunRagTest: (payload: { customerQuestion: string; customerId: string; scenario: string; language: string; relatedOrderId: string }) => Promise<{ run: RagTestRun }>;
}

export const AI_CONSOLE_PAGES: Array<{ key: AIConsolePageKey; navKey: NavKey; label: string; description: string }> = [
  { key: 'ingestion', navKey: 'ai-console-ingestion', label: '接入任务', description: '查看上传后的解析、分段、向量化、索引与发布状态' },
  { key: 'rag-config', navKey: 'ai-console-rag-config', label: '全局 RAG 配置', description: '维护环境级默认解析、切片、检索与 Prompt 组装参数' },
  { key: 'scenario-policy', navKey: 'ai-console-scenario-policy', label: '场景策略', description: '按业务场景统一管理模型、复核、发送权限与回退策略' },
  { key: 'capability-nodes', navKey: 'ai-console-capability-nodes', label: '能力节点', description: '按节点管理启停、继承关系、模型覆盖与运行约束' },
  { key: 'rag-test-lab', navKey: 'ai-console-rag-test-lab', label: 'RAG 调试台', description: '问题输入、检索结果、Prompt 预览与护栏结果' },
  { key: 'evaluation-feedback', navKey: 'ai-console-evaluation-feedback', label: '评测与反馈', description: '评测指标、反馈闭环与优化规则' },
  { key: 'audit-logs', navKey: 'ai-console-audit-logs', label: '审计日志', description: '记录发送、拦截、知识事件与人工改判' },
];

export const AI_CONSOLE_NAV_KEYS = new Set<NavKey>(AI_CONSOLE_PAGES.map(item => item.navKey));

export function getAIConsolePageFromNav(page: NavKey): AIConsolePageKey | null {
  return AI_CONSOLE_PAGES.find(item => item.navKey === page)?.key ?? null;
}

export function getAIConsoleLabelFromNav(page: NavKey): string | null {
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
