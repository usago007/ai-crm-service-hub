import { useMemo, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { PageShell } from './components/layout/PageShell';
import { ToastContainer } from './components/common/Toast';
import { LanguageContext, getTranslations } from './i18n';
import { useServiceHubApp } from './shared/hooks/useServiceHubApp';
import { getBreadcrumbPath, handleRegistryNavigate, renderRegisteredPage } from './routes/pageRegistry';
import type { NavKey } from './types/navigation';

export default function App() {
  const app = useServiceHubApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const t = useMemo(() => getTranslations(app.lang), [app.lang]);
  const breadcrumbPath = useMemo(
    () => getBreadcrumbPath(app, t),
    [app, t],
  );
  const handleNavigate = (page: NavKey) => {
    handleRegistryNavigate(app, page);
  };

  const handleOpenAdmin = () => {
    app.setCurrentPage('admin-settings');
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
        <Sidebar
          collapsed={sidebarCollapsed}
          currentPage={app.currentPage}
          tickets={app.legacyTickets}
          tasks={app.snapshot.tasks}
          onNavigate={handleNavigate}
          onToggleCollapsed={() => setSidebarCollapsed(prev => !prev)}
        />
        <main id="main-content" className="flex-1 flex flex-col min-w-0 relative">
          <Topbar
            path={breadcrumbPath}
            onOpenAdmin={handleOpenAdmin}
          />
          <PageShell>
            {renderRegisteredPage(app)}
          </PageShell>
        </main>
        <ToastContainer toasts={app.toasts} />
      </div>
    </LanguageContext.Provider>
  );
}
