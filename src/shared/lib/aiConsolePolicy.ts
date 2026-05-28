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
    const activeNodeOverrideCount = pipelineNodeConfigs.filter(item => item.enabled && !item.inheritFromScenario && item.allowedScenarios.includes(config.scenario)).length;
    const riskTone: EffectiveScenarioPolicy['riskTone'] = !config.aiSuggestAllowed
      ? 'red'
      : config.manualReviewRequired
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
      primaryModel: config.primaryModel,
      fallbackModel: config.fallbackModel || '无备用模型',
      retrievalSummary: `Top K ${effectiveTopK} / 阈值 ${effectiveThreshold} / ${effectiveReranker ? '重排序开启' : '重排序关闭'}`,
      aiSuggestAllowed: config.aiSuggestAllowed,
      humanSendAllowed: config.humanSendAllowed,
      manualReviewRequired: config.manualReviewRequired,
      blockedClaims: config.blockedClaims,
      activeNodeOverrideCount,
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
    const primaryScenario = findScenarioConfig(scenarioModelConfigs, config?.allowedScenarios[0] ?? 'Shipping');
    const effectiveModel = config?.inheritFromScenario
      ? primaryScenario.primaryModel
      : config?.primaryModel ?? primaryScenario.primaryModel;
    const fallbackModel = config?.inheritFromScenario
      ? primaryScenario.fallbackModel || '沿用场景回退'
      : config?.fallbackModel || primaryScenario.fallbackModel || '无备用模型';
    return {
      nodeId: node.id,
      nodeConfigId: config?.id ?? node.id,
      name: node.name,
      enabled: config?.enabled ?? node.enabled,
      inheritFromScenario: config?.inheritFromScenario ?? false,
      appliesToScenarios: config?.allowedScenarios ?? [],
      effectiveModel,
      fallbackModel,
      inputSource: config?.inputSource ?? node.input,
      outputSchema: config?.outputSchema ?? node.output,
      timeoutMs: config?.timeoutMs ?? 0,
      retryCount: config?.retryCount ?? 0,
      fallbackStrategy: config?.fallbackStrategy ?? node.fallback,
      citationRequired: config?.citationRequired ?? false,
      humanConfirmationRequired: config?.humanConfirmationRequired ?? node.requiresHumanConfirmation,
      effectiveSource: config?.inheritFromScenario ? 'scenario' : 'node',
      sourceLabel: config?.inheritFromScenario ? `继承场景策略：${primaryScenario.name}` : '节点独立覆盖',
      mappedCapabilityId: capabilityMap[node.id],
      lastUpdated: config?.updatedAt ?? primaryScenario.updatedAt,
    };
  });
}

export function buildDerivedRoutingSummary(
  environment: AIEnvironmentConfig,
  ragConfig: RagConfigSnapshot,
  effectiveScenarioPolicies: EffectiveScenarioPolicy[],
  effectiveNodePolicies: EffectiveNodePolicy[],
) : DerivedRoutingSummary {
  const overriddenNodeCount = effectiveNodePolicies.filter(item => item.effectiveSource === 'node').length;
  const disabledNodeCount = effectiveNodePolicies.filter(item => !item.enabled).length;
  return {
    defaultModel: environment.defaultModel,
    embeddingModel: ragConfig.embedding.model,
    rerankerModel: environment.rerankerModel,
    activeScenarioCount: effectiveScenarioPolicies.length,
    fallbackEnabledScenarioCount: effectiveScenarioPolicies.filter(item => item.fallbackModel !== '无备用模型').length,
    manualReviewScenarioCount: effectiveScenarioPolicies.filter(item => item.manualReviewRequired).length,
    disabledNodeCount,
    overriddenNodeCount,
    summary: '全局配置提供默认值，场景策略定义业务边界，节点策略仅在关闭继承时覆盖生效。',
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
