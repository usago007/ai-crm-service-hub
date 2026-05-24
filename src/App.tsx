import { useMemo } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { PageShell } from './components/layout/PageShell';
import { ToastContainer } from './components/common/Toast';
import { Overview } from './pages/Overview';
import { CustomerService } from './pages/CustomerService';
import { TicketsPage } from './pages/Tickets';
import { CustomersPage } from './pages/Customers';
import { OrdersPage } from './pages/Orders';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { FollowUpTasks } from './pages/FollowUpTasks';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { AIConsole } from './pages/AIConsole';
import { getAIConsoleLabelFromNav, getAIConsolePageFromNav } from './pages/ai-console/types';
import { LanguageContext, getTranslations } from './i18n';
import { useServiceHubApp } from './shared/hooks/useServiceHubApp';
import type { NavKey } from './types';

function getBreadcrumbPath(page: NavKey, t: ReturnType<typeof getTranslations>, aiConsoleTitle: string | null) {
  if (page === 'knowledge') return [t.nav.aiControl, t.nav.knowledge];
  if (aiConsoleTitle) return [t.nav.aiControl, aiConsoleTitle.replace('AI 控制台 / ', '')];
  if (page === 'overview' || page === 'service' || page === 'tickets' || page === 'tasks') return [t.nav.workbench, t.page[page as keyof typeof t.page] ?? t.nav.workbench];
  if (page === 'customers' || page === 'orders') return [t.nav.customerOps, t.page[page as keyof typeof t.page] ?? t.nav.customerOps];
  if (page === 'insights' || page === 'admin-settings') return [t.nav.adminCenter, t.page[page === 'admin-settings' ? 'adminSettings' : 'insights']];
  return [t.page[page as keyof typeof t.page] ?? t.page.service];
}

export default function App() {
  const app = useServiceHubApp();
  const t = useMemo(() => getTranslations(app.lang), [app.lang]);
  const activeAIConsolePage = useMemo(() => getAIConsolePageFromNav(app.currentPage), [app.currentPage]);
  const aiConsoleTitle = useMemo(() => {
    const activeLabel = getAIConsoleLabelFromNav(app.currentPage);
    return activeLabel ? `AI 控制台 / ${activeLabel}` : null;
  }, [app.currentPage]);
  const breadcrumbPath = useMemo(() => getBreadcrumbPath(app.currentPage, t, aiConsoleTitle), [app.currentPage, t, aiConsoleTitle]);

  const handleNavigate = (page: NavKey) => {
    const nextAIPage = getAIConsolePageFromNav(page);
    if (nextAIPage) {
      app.setAIConsolePage(nextAIPage);
    }
    app.setCurrentPage(page);
  };

  const handleCreateTask = () => {
    app.pushToast('当前任务由工单执行结果自动驱动生成', 'info');
  };

  const renderPage = () => {
    switch (app.currentPage) {
      case 'overview':
        return (
          <Overview
            analytics={app.snapshot.analytics}
            activityLog={app.snapshot.activityLog}
            tickets={app.snapshot.tickets}
            feedbackLoop={app.snapshot.feedbackLoop}
            auditLogs={app.snapshot.auditLogs}
            aiOpsStages={app.snapshot.aiOpsStages}
          />
        );
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
            onCreateKnowledgeBase={app.createKnowledgeBase}
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
      case 'ai-console-ingestion':
      case 'ai-console-rag-config':
      case 'ai-console-scenario-policy':
      case 'ai-console-capability-nodes':
      case 'ai-console-rag-test-lab':
      case 'ai-console-evaluation-feedback':
      case 'ai-console-audit-logs':
        return (
          <AIConsole
            page={activeAIConsolePage ?? app.aiConsolePage}
            environment={app.aiConsole.environment}
            guardrails={app.aiConsole.guardrails}
            aiOpsStages={app.aiConsole.aiOpsStages}
            customers={app.snapshot.customers}
            orders={app.snapshot.orders}
            ingestionDocuments={app.aiConsole.ingestionDocuments}
            ragConfig={app.aiConsole.ragConfig}
            ragTestRuns={app.aiConsole.ragTestRuns}
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
            onReplayRun={ticketId => { void app.runRetrieve(ticketId); }}
            onIngestionAction={app.runIngestionAction}
            onUpdateRagConfig={app.updateRagConfig}
            onUpdateScenarioModelConfig={app.updateScenarioModelConfig}
            onUpdatePipelineNodeConfig={app.updatePipelineNodeConfig}
            onRunRagTest={app.runRagTest}
          />
        );
      case 'tasks':
        return <FollowUpTasks tasks={app.snapshot.tasks} customers={app.legacyCustomers} onCreateTask={handleCreateTask} />;
      case 'insights':
        return <Analytics analytics={app.snapshot.analytics} />;
      case 'admin-settings':
        return (
          <Settings
            lang={app.lang}
            onLanguageChange={app.setLang}
            settings={app.snapshot.settings}
            agents={app.snapshot.agents}
          />
        );
      default:
        return null;
    }
  };

  return (
    <LanguageContext.Provider value={{ lang: app.lang, t, setLang: app.setLang }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[4000] focus:rounded-[14px] focus:bg-white focus:px-4 focus:py-2 focus:text-[13px] focus:font-medium focus:text-[var(--color-text)] focus:shadow-[var(--shadow-lg)]"
      >
        跳转到主内容
      </a>
      <div className="flex h-screen overflow-hidden" style={{ fontFamily: 'var(--font-family-sans)' }}>
        <Sidebar currentPage={app.currentPage} tickets={app.legacyTickets} tasks={app.snapshot.tasks} onNavigate={handleNavigate} />
        <main id="main-content" className="flex-1 flex flex-col min-w-0 relative">
          <Topbar
            path={breadcrumbPath}
            aiEnabled={!app.aiConsole.environment.maintenanceMode}
          />
          <PageShell>
            {renderPage()}
          </PageShell>
        </main>
        <ToastContainer toasts={app.toasts} />
      </div>
    </LanguageContext.Provider>
  );
}
