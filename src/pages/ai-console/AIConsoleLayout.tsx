import type { AIConsoleProps } from './types';
import { DocumentIngestionPage } from './pages/DocumentIngestionPage';
import { RagConfigPage } from './pages/RagConfigPage';
import { ScenarioModelConfigPage } from './pages/ScenarioModelConfigPage';
import { PipelineNodeConfigPage } from './pages/PipelineNodeConfigPage';
import { RagTestLabPage } from './pages/RagTestLabPage';
import { EvaluationFeedbackPage } from './pages/EvaluationFeedbackPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

export function AIConsole(props: AIConsoleProps) {
  return (
    <div className="min-w-0">
      {props.page === 'ingestion' ? <DocumentIngestionPage ingestionDocuments={props.ingestionDocuments} jobs={props.jobs} onIngestionAction={props.onIngestionAction} /> : null}
      {props.page === 'rag-config' ? <RagConfigPage ragConfig={props.ragConfig} onUpdateRagConfig={props.onUpdateRagConfig} /> : null}
      {props.page === 'scenario-policy' ? <ScenarioModelConfigPage scenarioModelConfigs={props.scenarioModelConfigs} effectiveScenarioPolicies={props.effectiveScenarioPolicies} routingSummary={props.routingSummary} guardrails={props.guardrails} onUpdateScenarioModelConfig={props.onUpdateScenarioModelConfig} /> : null}
      {props.page === 'capability-nodes' ? <PipelineNodeConfigPage pipelineNodeConfigs={props.pipelineNodeConfigs} effectiveNodePolicies={props.effectiveNodePolicies} aiOpsStages={props.aiOpsStages} onUpdatePipelineNodeConfig={props.onUpdatePipelineNodeConfig} /> : null}
      {props.page === 'rag-test-lab' ? <RagTestLabPage customers={props.customers} orders={props.orders} ragTestRuns={props.ragTestRuns} effectiveScenarioPolicies={props.effectiveScenarioPolicies} effectiveNodePolicies={props.effectiveNodePolicies} onRunRagTest={props.onRunRagTest} /> : null}
      {props.page === 'evaluation-feedback' ? <EvaluationFeedbackPage evaluations={props.evaluations} feedbackLoop={props.feedbackLoop} /> : null}
      {props.page === 'audit-logs' ? <AuditLogsPage auditLogs={props.auditLogs} /> : null}
    </div>
  );
}
