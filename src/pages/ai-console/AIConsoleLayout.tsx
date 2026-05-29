import type { AIConsoleProps } from './types';
import { RagConfigPage } from './pages/RagConfigPage';
import { ScenarioModelConfigPage } from './pages/ScenarioModelConfigPage';
import { RagTestLabPage } from './pages/RagTestLabPage';
import { EvaluationFeedbackPage } from './pages/EvaluationFeedbackPage';
import { ServiceHealthPage } from './pages/service-health';

export function AIConsole(props: AIConsoleProps) {
  return (
    <div className="min-w-0 space-y-4">
      {props.page === 'rag-config' ? <RagConfigPage ragConfig={props.ragConfig} onUpdateRagConfig={props.onUpdateRagConfig} onOpenPage={props.onOpenPage} effectiveScenarioPolicies={props.effectiveScenarioPolicies} /> : null}
      {props.page === 'scenario-policy' ? <ScenarioModelConfigPage scenarioModelConfigs={props.scenarioModelConfigs} effectiveScenarioPolicies={props.effectiveScenarioPolicies} routingSummary={props.routingSummary} pipelineNodeConfigs={props.pipelineNodeConfigs} effectiveNodePolicies={props.effectiveNodePolicies} activeTab={props.scenarioSettingsTab} onTabChange={props.onScenarioSettingsTabChange} onUpdateScenarioModelConfig={props.onUpdateScenarioModelConfig} onUpdatePipelineNodeConfig={props.onUpdatePipelineNodeConfig} /> : null}
      {props.page === 'rag-test-lab' ? <RagTestLabPage businessCase={props.businessCase} customers={props.customers} orders={props.orders} ragTestRuns={props.ragTestRuns} effectiveScenarioPolicies={props.effectiveScenarioPolicies} effectiveNodePolicies={props.effectiveNodePolicies} onRunRagTest={props.onRunRagTest} /> : null}
      {props.page === 'evaluation-feedback' ? <EvaluationFeedbackPage businessCase={props.businessCase} evaluations={props.evaluations} feedbackLoop={props.feedbackLoop} auditLogs={props.auditLogs} activeTab={props.evaluationCenterTab} onTabChange={props.onEvaluationCenterTabChange} onSelectBusinessTicket={props.onSelectBusinessTicket} onOpenPage={props.onOpenPage} /> : null}
      {props.page === 'service-health' ? <ServiceHealthPage serviceHealth={props.serviceHealth} onRefreshServiceHealth={props.onRefreshServiceHealth} onRunServiceHealthCheck={props.onRunServiceHealthCheck} onRetryFailedJobs={props.onRetryFailedJobs} onRebuildVectorIndex={props.onRebuildVectorIndex} /> : null}
    </div>
  );
}
