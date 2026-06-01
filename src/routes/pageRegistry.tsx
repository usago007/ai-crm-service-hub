import { Overview } from '../pages/Overview';
import { CustomerService } from '../pages/CustomerService';
import { TicketsPage } from '../pages/Tickets';
import { CustomersPage } from '../pages/Customers';
import { OrdersPage } from '../pages/Orders';
import { OperationLogsPage } from '../pages/OperationLogs';
import { KnowledgeBase } from '../pages/KnowledgeBase';
import { FollowUpTasks } from '../pages/FollowUpTasks';
import { Settings } from '../pages/Settings';
import { AIConsole } from '../pages/AIConsole';
import { getAIConsoleLabelFromNav, getAIConsolePageFromNav } from '../pages/ai-console/types';
import type { getTranslations } from '../i18n';
import type { useServiceHubApp } from '../shared/hooks/useServiceHubApp';
import type { NavKey } from '../types/navigation';
import type { KnowledgeDetailTab, KnowledgeFlow, KnowledgeWizardStep } from '../types/knowledge';

type ServiceHubApp = ReturnType<typeof useServiceHubApp>;
type Translations = ReturnType<typeof getTranslations>;

export function getBreadcrumbPath(app: ServiceHubApp, t: Translations) {
  const aiConsoleLabel = getAIConsoleLabelFromNav(app.currentPage);
  if (app.currentPage === 'knowledge') {
    return getKnowledgeBreadcrumbPath(t, app.knowledgeFlow, app.selectedKnowledgeBase?.name ?? null, app.knowledgeDetailTab, app.knowledgeWizardStep);
  }
  if (app.currentPage === 'system-operation-logs') return ['系统', '操作日志'];
  if (app.currentPage.startsWith('admin-')) {
    const label = app.currentPage === 'admin-general' ? '通用设置' : '权限管理';
    return ['系统', label];
  }
  if (aiConsoleLabel) return ['AI 配置', aiConsoleLabel];
  if (app.currentPage === 'overview' || app.currentPage === 'service' || app.currentPage === 'tickets' || app.currentPage === 'tasks') {
    return [t.nav.workbench, t.page[app.currentPage as keyof typeof t.page] ?? t.nav.workbench];
  }
  if (app.currentPage === 'customers' || app.currentPage === 'orders') {
    return [t.nav.customerOps, t.page[app.currentPage as keyof typeof t.page] ?? t.nav.customerOps];
  }
  if (app.currentPage === 'admin-settings') return ['系统', '系统设置'];
  return [t.page[app.currentPage as keyof typeof t.page] ?? t.page.service];
}

export function handleRegistryNavigate(app: ServiceHubApp, page: NavKey) {
  const nextAIPage = getAIConsolePageFromNav(page);
  if (nextAIPage) {
    app.setAIConsolePage(nextAIPage);
  }
  app.setCurrentPage(page);
}

export function renderRegisteredPage(app: ServiceHubApp) {
  const activeAIConsolePage = getAIConsolePageFromNav(app.currentPage);
  const handleNavigate = (page: NavKey) => handleRegistryNavigate(app, page);

  switch (app.currentPage) {
    case 'overview':
      return <Overview overview={app.overview} onOpenTarget={app.openOverviewTarget} />;
    case 'service':
      return (
        <CustomerService
          result={app.ticketResult}
          query={app.ticketQuery}
          onQueryChange={app.setTicketQuery}
          customers={app.snapshot.customers}
          orders={app.snapshot.orders}
          messages={app.snapshot.messages}
          drafts={app.snapshot.replyDrafts}
          reviews={app.snapshot.reviewDecisions}
          actions={app.snapshot.ticketActions}
          selectedTicketId={app.selectedTicketId}
          replyText={app.replyText}
          onSelectTicket={app.setSelectedTicketId}
          onReplyTextChange={app.setReplyText}
          onInsertAI={ticketId => { app.insertDraftToReply(ticketId); }}
          onRetrieve={ticketId => { void app.runRetrieve(ticketId); }}
          onDraft={ticketId => { void app.runDraft(ticketId); }}
          onSendReply={ticketId => { void app.sendReply(ticketId); }}
          onSaveDraft={ticketId => { void app.saveReplyDraft(ticketId); }}
          onCloseTicket={ticketId => { void app.closeTicket(ticketId); }}
          onReview={(ticketId, decision) => { void app.runReview(ticketId, decision); }}
          onRunAction={(ticketId, actionId) => { void app.runAction(ticketId, actionId); }}
          replyTemplates={app.replyTemplates}
        />
      );
    case 'tickets':
      return (
        <TicketsPage
          result={app.ticketResult}
          reviews={app.snapshot.reviewDecisions}
          query={app.ticketQuery}
          onQueryChange={app.setTicketQuery}
          selectedTicketId={app.selectedTicketId}
          onSelectTicket={app.setSelectedTicketId}
          onViewTicket={ticketId => {
            app.setSelectedTicketId(ticketId);
            app.setCurrentPage('service');
          }}
        />
      );
    case 'customers':
      return (
        <CustomersPage
          result={app.customerResult}
          query={app.customerQuery}
          onQueryChange={app.setCustomerQuery}
          selectedCustomerId={app.selectedCustomerId}
          onSelectCustomer={app.setSelectedCustomerId}
        />
      );
    case 'orders':
      return (
        <OrdersPage
          result={app.orderResult}
          customers={app.snapshot.customers}
          query={app.orderQuery}
          onQueryChange={app.setOrderQuery}
          selectedOrderId={app.selectedOrderId}
          onSelectOrder={app.setSelectedOrderId}
        />
      );
    case 'knowledge':
      return (
        <KnowledgeBase
          knowledgeBases={app.knowledgeBases}
          selectedKnowledgeBase={app.selectedKnowledgeBase}
          knowledgeFlow={app.knowledgeFlow}
          knowledgeDetailTab={app.knowledgeDetailTab}
          knowledgeWizardStep={app.knowledgeWizardStep}
          knowledgeWizardDraft={app.knowledgeWizardDraft}
          knowledgeProcessingResult={app.knowledgeProcessingResult}
          knowledgeDocuments={app.snapshot.knowledgeDocuments}
          ingestionDocuments={app.aiConsole.ingestionDocuments}
          ragConfig={app.aiConsole.ragConfig}
          ragTestRuns={app.aiConsole.ragTestRuns}
          jobs={app.aiConsole.jobs}
          onIngestionAction={app.runIngestionAction}
          onCreateKnowledgeBase={app.createKnowledgeBase}
          onUpdateKnowledgeBaseMeta={app.updateKnowledgeBaseMeta}
          onUpdateKnowledgeBaseOverrides={app.updateKnowledgeBaseOverrides}
          onArchiveKnowledgeBase={app.archiveKnowledgeBase}
          onCloneKnowledgeBase={app.cloneKnowledgeBase}
          onNavigateToRagTestLab={() => { app.setCurrentPage('ai-console-rag-test-lab'); }}
          onOpenKnowledgeBase={app.openKnowledgeBase}
          onBackToKnowledgeList={app.backToKnowledgeList}
          onKnowledgeDetailTabChange={app.setKnowledgeDetailTab}
          onStartKnowledgeImport={app.startKnowledgeImport}
          onKnowledgeWizardDraftChange={app.updateKnowledgeWizardDraft}
          onKnowledgeWizardStepChange={app.setKnowledgeWizardStep}
          onSubmitKnowledgeImport={() => { void app.submitKnowledgeImport(); }}
          onFinishKnowledgeImport={app.finishKnowledgeImport}
        />
      );
    case 'system-operation-logs':
      return (
        <OperationLogsPage
          result={app.operationLogResult}
          query={app.operationLogQuery}
          onQueryChange={app.setOperationLogQuery}
        />
      );
    case 'ai-console-rag-config':
    case 'ai-console-scenario-policy':
    case 'ai-console-rag-test-lab':
    case 'ai-console-evaluation-feedback':
    case 'ai-console-service-health':
      return (
        <AIConsole
          page={activeAIConsolePage ?? app.aiConsolePage}
          environment={app.aiConsole.environment}
          guardrails={app.aiConsole.guardrails}
          aiOpsStages={app.aiConsole.aiOpsStages}
          customers={app.snapshot.customers}
          orders={app.snapshot.orders}
          businessCase={app.aiConsoleBusinessCase}
          ingestionDocuments={app.aiConsole.ingestionDocuments}
          ragConfig={app.aiConsole.ragConfig}
          ragTestRuns={app.aiConsole.ragTestRuns}
          knowledgeBases={app.knowledgeBases}
          scenarioModelConfigs={app.aiConsole.scenarioModelConfigs}
          pipelineNodeConfigs={app.aiConsole.pipelineNodeConfigs}
          effectiveScenarioPolicies={app.aiConsole.effectiveScenarioPolicies}
          effectiveNodePolicies={app.aiConsole.effectiveNodePolicies}
          routingSummary={app.aiConsole.routingSummary}
          documentResult={app.documentResult}
          documentQuery={app.documentQuery}
          onDocumentQueryChange={app.setDocumentQuery}
          ragRunResult={app.ragRunResult}
          ragRunQuery={app.ragRunQuery}
          onRagRunQueryChange={app.setRagRunQuery}
          jobs={app.aiConsole.jobs}
          evaluations={app.aiConsole.evaluations}
          feedbackLoop={app.aiConsole.feedbackLoop}
          auditLogs={app.aiConsole.auditLogs}
          serviceHealth={app.aiConsole.serviceHealth}
          scenarioSettingsTab={app.scenarioSettingsTab}
          evaluationCenterTab={app.evaluationCenterTab}
          onOpenPage={handleNavigate}
          onSelectBusinessTicket={app.setSelectedTicketId}
          onIngestionAction={app.runIngestionAction}
          onScenarioSettingsTabChange={app.setScenarioSettingsTab}
          onUpdateRagConfig={app.updateRagConfig}
          onUpdateScenarioModelConfig={app.updateScenarioModelConfig}
          onUpdatePipelineNodeConfig={app.updatePipelineNodeConfig}
          onEvaluationCenterTabChange={app.setEvaluationCenterTab}
          onRunRagTest={app.runRagTest}
          onRefreshServiceHealth={app.refreshServiceHealth}
          onRunServiceHealthCheck={app.runServiceHealthCheck}
          onRetryFailedJobs={app.retryFailedJobs}
          onRebuildVectorIndex={app.rebuildVectorIndex}
          onViewServiceHealthLastError={app.viewServiceHealthLastError}
        />
      );
    case 'tasks':
      return (
        <FollowUpTasks
          result={app.taskResult}
          query={app.taskQuery}
          onQueryChange={app.setTaskQuery}
          customers={app.legacyCustomers}
        />
      );
    case 'admin-settings':
    case 'admin-general':
    case 'admin-permissions': {
      const adminTab = app.currentPage === 'admin-settings' ? undefined : app.currentPage === 'admin-general' ? 'general' : 'permissions';
      return (
        <Settings
          key={app.currentPage}
          lang={app.lang}
          onLanguageChange={app.setLang}
          onUpdateSettings={app.updateSettings}
          onUpdatePermissionBoundaries={app.updatePermissionBoundaries}
          settings={app.snapshot.settings}
          agents={app.snapshot.agents}
          permissionBoundaries={app.snapshot.permissionBoundaries}
          initialTab={adminTab}
        />
      );
    }
    default:
      return null;
  }
}

function getKnowledgeDetailLabel(tab: KnowledgeDetailTab) {
  if (tab === 'documents') return '文档';
  if (tab === 'ingestion') return '接入流水线';
  if (tab === 'retrieval-test') return '召回测试';
  return '设置';
}

function getKnowledgeWizardLabel(step: KnowledgeWizardStep) {
  if (step === 1) return '选择数据源';
  if (step === 2) return '文本分段与清洗';
  return '处理并完成';
}

function getKnowledgeBreadcrumbPath(
  t: Translations,
  flow: KnowledgeFlow,
  selectedKnowledgeBaseName: string | null,
  detailTab: KnowledgeDetailTab,
  wizardStep: KnowledgeWizardStep,
) {
  const basePath = [t.nav.aiControl, t.nav.knowledge];
  if (flow === 'list' || !selectedKnowledgeBaseName) return basePath;
  if (flow === 'detail') return [...basePath, selectedKnowledgeBaseName, getKnowledgeDetailLabel(detailTab)];
  return [...basePath, selectedKnowledgeBaseName, '添加文件', getKnowledgeWizardLabel(wizardStep)];
}
