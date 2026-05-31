import type {
  AIEnvironmentConfig,
  CapabilityPipelineNode,
  DerivedRoutingSummary,
  EffectiveNodePolicy,
  EffectiveScenarioPolicy,
  GuardrailCheckResult,
  PipelineNodeModelConfig,
  RagConfigSnapshot,
  ScenarioModelConfig,
} from '../../types';

const capabilityMap: Record<string, string> = {
  'intent-classification': 'issue-classification',
  'knowledge-retrieval': 'retrieval-debugger',
  'human-review-routing': 'review-gating',
  'feedback-capture': 'knowledge-gap-detection',
  'policy-check': 'crm-policy-link',
};

const highRiskScenarios = new Set(['Refund', 'Complaint', 'Compensation', 'Chargeback']);
const mediumRiskScenarios = new Set(['Payment']);

export function isSensitiveScenario(scenario: string) {
  return highRiskScenarios.has(scenario);
}

export function isMediumRiskScenario(scenario: string) {
  return mediumRiskScenarios.has(scenario);
}

function requiredByCondition(config: ScenarioModelConfig, node: PipelineNodeModelConfig) {
  return node.requiredWhen.some(rule => {
    if (rule === 'active') return config.status === 'active';
    if (rule === 'sensitive_scenario') return isSensitiveScenario(config.scenario);
    if (rule === 'manual_review_required') return config.manualReviewRequired;
    return false;
  });
}

export function getRequiredNodeIds(config: ScenarioModelConfig, nodeConfigs: PipelineNodeModelConfig[]) {
  return nodeConfigs.filter(node => requiredByCondition(config, node)).map(node => node.nodeId);
}

export function getMissingRequiredNodeIds(config: ScenarioModelConfig, nodeConfigs: PipelineNodeModelConfig[]) {
  const enabledNodeIds = new Set(config.nodeOverrides.filter(item => item.enabled).map(item => item.nodeId));
  return getRequiredNodeIds(config, nodeConfigs).filter(nodeId => !enabledNodeIds.has(nodeId));
}

export function getNodeLockReason(config: ScenarioModelConfig, node: PipelineNodeModelConfig) {
  if (node.lockedWhen.includes('active') && config.status === 'active') return 'Active 策略必须启用此节点';
  if (node.lockedWhen.includes('sensitive_scenario') && isSensitiveScenario(config.scenario)) return '高敏场景必须启用此节点';
  if (node.lockedWhen.includes('manual_review_required') && config.manualReviewRequired) return '当前场景已开启强制人工复核';
  return '';
}

export function validateScenarioPolicy(config: ScenarioModelConfig, nodeConfigs: PipelineNodeModelConfig[]) {
  const bindings = config.knowledgeBindings ?? [];
  const effectiveBindings = bindings.filter(binding => binding.enabled && binding.knowledgeBaseId && binding.collectionIds.length > 0);
  const enabledEmptyBindings = bindings.filter(binding => binding.enabled && binding.collectionIds.length === 0);
  const missingRequiredNodes = getMissingRequiredNodeIds(config, nodeConfigs);

  return [
    ...(effectiveBindings.length === 0 ? ['场景策略必须至少绑定一个知识库和一个知识集合'] : []),
    ...(enabledEmptyBindings.length > 0 ? ['请至少选择一个知识集合'] : []),
    ...(config.topK <= 0 ? ['检索 Top K 必须大于 0'] : []),
    ...(!config.systemPrompt?.trim() ? ['必须配置场景 Prompt 模板'] : []),
    ...(missingRequiredNodes.length > 0 ? [`缺少必选能力节点：${missingRequiredNodes.join('、')}`] : []),
    ...(isSensitiveScenario(config.scenario) && config.outputMode === 'low_risk_auto_reply' ? ['高敏场景不可启用低风险自动回复'] : []),
    ...(isMediumRiskScenario(config.scenario) && config.outputMode === 'low_risk_auto_reply' ? ['中高敏场景不可启用低风险自动回复'] : []),
  ];
}

export function findScenarioConfig(configs: ScenarioModelConfig[], scenario: string) {
  return configs.find(item => item.scenario === scenario)
    ?? configs.find(item => item.scenario === 'Shipping')
    ?? configs[0];
}

export function findNodeConfig(configs: PipelineNodeModelConfig[], nodeId: string) {
  return configs.find(item => item.nodeId === nodeId);
}

export function buildEffectiveScenarioPolicies(
  scenarioModelConfigs: ScenarioModelConfig[],
  pipelineNodeConfigs: PipelineNodeModelConfig[],
  ragConfig?: RagConfigSnapshot,
) : EffectiveScenarioPolicy[] {
  return scenarioModelConfigs.map(config => {
    const bindings = config.knowledgeBindings ?? [];
    const effectiveBindings = bindings.filter(binding => binding.enabled && binding.knowledgeBaseId && binding.collectionIds.length > 0);
    const hasKnowledgeBinding = effectiveBindings.length > 0;
    const enabledOverrides = config.nodeOverrides.filter(item => item.enabled);
    const validationIssues = validateScenarioPolicy(config, pipelineNodeConfigs);
    const activeNodeOverrideCount = config.nodeOverrides.filter(item => item.overrideMode === 'override').length;
    const riskTone: EffectiveScenarioPolicy['riskTone'] = !config.aiSuggestAllowed
      ? 'red'
      : validationIssues.length > 0 || config.manualReviewRequired
      ? 'yellow'
      : 'green';
    // Fall back to global RAG config when scenario-level field is undefined
    const effectiveTopK = config.topK ?? ragConfig?.retrieval.topK ?? 5;
    const effectiveThreshold = config.similarityThreshold ?? ragConfig?.retrieval.similarityThreshold ?? 0.78;
    const effectiveReranker = config.rerankerEnabled ?? ragConfig?.retrieval.rerankerEnabled ?? false;
    return {
      scenarioConfigId: config.id,
      scenario: config.scenario,
      strategyName: config.name,
      status: config.status,
      outputMode: config.outputMode,
      primaryModel: config.primaryModel,
      fallbackModel: config.fallbackModel || '无备用模型',
      knowledgeSummary: hasKnowledgeBinding
        ? `${effectiveBindings.length} 个知识库 / ${effectiveBindings.reduce((sum, item) => sum + item.collectionIds.length, 0)} 个集合`
        : '未绑定知识库',
      retrievalSummary: `Top K ${effectiveTopK} / 阈值 ${effectiveThreshold} / ${effectiveReranker ? '重排序开启' : '重排序关闭'}`,
      aiSuggestAllowed: config.aiSuggestAllowed,
      humanSendAllowed: config.humanSendAllowed,
      manualReviewRequired: config.manualReviewRequired,
      blockedClaims: config.blockedClaims,
      activeNodeOverrideCount,
      activeNodeCount: enabledOverrides.length,
      validationIssues,
      canActivate: validationIssues.length === 0,
      riskTone,
      lastUpdated: config.updatedAt,
    };
  });
}

export function buildEffectiveNodePolicies(
  capabilityPipeline: CapabilityPipelineNode[],
  pipelineNodeConfigs: PipelineNodeModelConfig[],
  scenarioModelConfigs: ScenarioModelConfig[],
) : EffectiveNodePolicy[] {
  return capabilityPipeline.map(node => {
    const config = findNodeConfig(pipelineNodeConfigs, node.id);
    const fallbackScenario = findScenarioConfig(scenarioModelConfigs, config?.allowedScenarios[0] ?? 'Shipping');
    const effectiveModel = config?.primaryModel ?? '由场景策略注入';
    const fallbackModel = config?.fallbackModel ?? '由场景策略注入';
    return {
      nodeId: node.id,
      nodeConfigId: config?.id ?? node.id,
      name: node.name,
      nodeName: config?.nodeName ?? node.name,
      nodeType: config?.nodeType ?? 'task',
      stage: config?.stage ?? 'post_process',
      executionMode: config?.executionMode ?? 'deterministic',
      enabled: config?.enabled ?? node.enabled,
      inheritFromScenario: config?.inheritFromScenario ?? false,
      appliesToScenarios: config?.allowedScenarios ?? [],
      effectiveModel,
      fallbackModel,
      inputFields: config?.inputFields ?? [],
      inputSource: config?.inputSource ?? node.input,
      outputSchema: config?.outputSchema ?? node.output,
      timeoutMs: config?.timeoutMs ?? 0,
      retryTimes: config?.retryTimes ?? config?.retryCount ?? 0,
      retryCount: config?.retryCount ?? 0,
      fallbackStrategy: config?.fallbackStrategy ?? node.fallback,
      dependsOn: config?.dependsOn ?? [],
      requiredWhen: config?.requiredWhen ?? ['optional'],
      usesKnowledgeBase: config?.usesKnowledgeBase ?? false,
      knowledgeScopeMode: config?.knowledgeScopeMode ?? 'none',
      citationRequired: config?.citationRequired ?? false,
      humanConfirmationRequired: config?.humanConfirmationRequired ?? node.requiresHumanConfirmation,
      overridableFields: config?.overridableFields ?? [],
      enabledByDefault: config?.enabledByDefault ?? node.enabled,
      lockedWhen: config?.lockedWhen ?? [],
      effectiveSource: 'node',
      sourceLabel: '节点库默认配置',
      mappedCapabilityId: capabilityMap[node.id],
      lastUpdated: config?.updatedAt ?? fallbackScenario.updatedAt,
    };
  });
}

export function buildDerivedRoutingSummary(
  environment: AIEnvironmentConfig,
  ragConfig: RagConfigSnapshot,
  effectiveScenarioPolicies: EffectiveScenarioPolicy[],
  effectiveNodePolicies: EffectiveNodePolicy[],
) : DerivedRoutingSummary {
  const overriddenNodeCount = effectiveScenarioPolicies.reduce((sum, item) => sum + item.activeNodeOverrideCount, 0);
  const disabledNodeCount = effectiveNodePolicies.filter(item => !item.enabled).length;
  return {
    defaultModel: environment.defaultModel,
    embeddingModel: ragConfig.embedding.model,
    rerankerModel: environment.rerankerModel,
    activeScenarioCount: effectiveScenarioPolicies.filter(item => item.status === 'active').length,
    fallbackEnabledScenarioCount: effectiveScenarioPolicies.filter(item => item.fallbackModel !== '无备用模型').length,
    manualReviewScenarioCount: effectiveScenarioPolicies.filter(item => item.manualReviewRequired).length,
    disabledNodeCount,
    overriddenNodeCount,
    summary: '能力节点提供固定默认能力，场景策略绑定知识范围并编排节点执行。',
  };
}

export function buildGuardrailDecision(
  scenario: string,
  citations: number,
  scenarioModelConfigs: ScenarioModelConfig[],
  pipelineNodeConfigs: PipelineNodeModelConfig[],
): GuardrailCheckResult {
  const scenarioConfig = findScenarioConfig(scenarioModelConfigs, scenario);
  const matchedNodes = pipelineNodeConfigs
    .filter(item => item.enabled && item.allowedScenarios.includes(scenario))
    .map(item => item.nodeId);
  const aiPermission: GuardrailCheckResult['aiPermission'] = scenarioConfig.aiSuggestAllowed ? 'suggest_only' : 'disabled';
  const riskLevel: GuardrailCheckResult['riskLevel'] = scenarioConfig.manualReviewRequired
    ? 'High'
    : scenario === 'Shipping'
    ? 'Medium'
    : 'Low';
  return {
    autoSend: 'disabled',
    aiPermission,
    confidence: scenarioConfig.manualReviewRequired ? 72 : 88,
    citationCoverage: Math.min(98, 72 + citations * 9),
    riskLevel,
    manualReviewRequired: scenarioConfig.manualReviewRequired,
    result: scenarioConfig.manualReviewRequired ? 'review_required' : 'passed',
    notes: [
      scenarioConfig.manualReviewRequired ? '命中场景复核策略，必须先经过人工复核。' : '当前场景允许继续生成建议草稿。',
      scenarioConfig.humanSendAllowed ? '人工发送权限已开放，但 AI 自动发送仍保持禁用。' : '当前场景不允许直接发送，需等待人工处理结论。',
      aiPermission === 'suggest_only' ? 'AI 仅保留建议权限，不能自动执行客户动作。' : '当前场景已禁用 AI 建议输出。',
    ],
    trace: {
      scenarioConfigId: scenarioConfig.id,
      scenarioStrategyName: scenarioConfig.name,
      matchedNodeIds: matchedNodes,
      blockedClaims: scenarioConfig.blockedClaims,
    },
  };
}
