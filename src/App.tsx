import { useState, useCallback, useRef, useMemo } from 'react';
import type { NavKey, Toast as ToastType } from './types';
import type { Language } from './i18n';
import { CUSTOMERS } from './data/customers';
import { ORDERS } from './data/orders';
import { TICKETS } from './data/tickets';
import { MESSAGES } from './data/messages';
import { FAQLIST, REPLY_TEMPLATES, BUSINESS_RULES, AI_CAPABILITIES } from './data/knowledge';
import { TASKS } from './data/tasks';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ToastContainer } from './components/common/Toast';
import { Modal } from './components/common/Modal';
import { Overview } from './pages/Overview';
import { CustomerService } from './pages/CustomerService';
import { TicketsPage } from './pages/Tickets';
import { CustomersPage } from './pages/Customers';
import { OrdersPage } from './pages/Orders';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { AIAssistant } from './pages/AIAssistant';
import { AIOperations } from './pages/AIOperations';
import { FollowUpTasks } from './pages/FollowUpTasks';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { getAISug } from './utils/ai';
import { LanguageContext, getTranslations } from './i18n';

export default function App() {
  const [lang, setLang] = useState<Language>('zh');
  const t = useMemo(() => getTranslations(lang), [lang]);
  const [currentPage, setCurrentPage] = useState<NavKey>('service');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>('TKT-001');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [ticketFilter, setTicketFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');
  const [knowledgeTab, setKnowledgeTab] = useState('faq');
  const [settingsTab, setSettingsTab] = useState('general');
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [aiEnabled] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  const [customers] = useState(CUSTOMERS);
  const [orders] = useState(ORDERS);
  const [tickets, setTickets] = useState(TICKETS);
  const [messages, setMessages] = useState(MESSAGES);
  const [tasks, setTasks] = useState(TASKS);
  const [faqList] = useState(FAQLIST);
  const [templates] = useState(REPLY_TEMPLATES);
  const [rules] = useState(BUSINESS_RULES);
  const [aiCapabilities, setAiCapabilities] = useState(AI_CAPABILITIES.map(c => ({ ...c })));
  const [pendingSend, setPendingSend] = useState<{ tid: string; text: string } | null>(null);

  const toastIdCounter = useRef(0);

  const showToast = useCallback((message: string, type: ToastType['type'] = 'success') => {
    const id = String(++toastIdCounter.current);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(item => item.id !== id));
    }, 3000);
  }, []);

  const openModal = useCallback((content: React.ReactNode) => {
    setModalContent(content);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalContent(null);
  }, []);

  const handleNavigate = useCallback((page: NavKey) => {
    setCurrentPage(page);
    setSearchQuery('');
    setReplyText('');
  }, []);

  const handleSelectTicket = useCallback((id: string | null) => {
    setSelectedTicketId(id);
    setReplyText('');
  }, []);

  const handleTicketFilterChange = useCallback((filter: string) => {
    setTicketFilter(filter);
    setSelectedTicketId(null);
  }, []);

  const handleViewTicket = useCallback((id: string) => {
    setSelectedTicketId(id);
    setCurrentPage('tickets');
  }, []);

  const handleInsertAI = useCallback(() => {
    const tk = tickets.find(tk => tk.id === selectedTicketId);
    if (!tk) return;
    const sugs = getAISug(tickets, customers, tk.id);
    if (sugs.length > 0) {
      setReplyText('[AI] ' + sugs[0].content);
      showToast('AI suggestion inserted to reply editor', 'info');
    }
  }, [tickets, customers, selectedTicketId, showToast]);

  const doSendReply = useCallback((tid: string, text: string) => {
    const now = new Date().toISOString();
    setMessages(prev => [...prev, { ticketId: tid, sender: 'agent', type: 'text', content: text, timestamp: now }]);
    setReplyText('');
    setTickets(prev => prev.map(tk => tk.id === tid && tk.status === 'New' ? { ...tk, status: 'In Progress' } : tk));
    setMessages(prev => [...prev, { ticketId: tid, sender: 'system', type: 'system', content: 'Reply sent by agent. Ticket updated.', timestamp: now }]);
    showToast('Reply sent successfully!', 'success');
  }, [showToast]);

  const handleSendReply = useCallback(() => {
    const text = replyText;
    if (!text || !text.trim()) { showToast('Please type a reply first', 'error'); return; }
    const tid = selectedTicketId;
    if (!tid) return;
    const tk = tickets.find(tk => tk.id === tid);
    if (!tk) return;

    if (tk.needsReview) {
      setPendingSend({ tid, text });
      openModal(
        <div>
          <div className="text-base font-semibold mb-4">Confirm Manual Review</div>
          <p className="text-[13px] text-[var(--color-text-secondary)] mb-3">This ticket requires manual review before sending. Are you sure you want to proceed?</p>
          <div className="flex gap-2 justify-end mt-4">
            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn btn-danger" onClick={() => {
              if (pendingSend) {
                doSendReply(pendingSend.tid, pendingSend.text);
                setPendingSend(null);
              }
              closeModal();
            }}>Send Anyway</button>
          </div>
        </div>
      );
      return;
    }
    doSendReply(tid, text);
  }, [replyText, selectedTicketId, tickets, showToast, openModal, closeModal, doSendReply, pendingSend]);

  const handleSaveDraft = useCallback(() => {
    if (replyText.trim()) { showToast('Draft saved', 'info'); }
    else { showToast('Nothing to save', 'error'); }
  }, [replyText, showToast]);

  const handleEscalate = useCallback(() => {
    if (!selectedTicketId) return;
    setTickets(prev => prev.map(tk => tk.id === selectedTicketId ? { ...tk, status: 'Escalated' as const } : tk));
    showToast('Ticket escalated to supervisor', 'warning');
  }, [selectedTicketId, showToast]);

  const handleCloseTicket = useCallback(() => {
    if (!selectedTicketId) return;
    setTickets(prev => prev.map(tk => tk.id === selectedTicketId ? { ...tk, status: 'Closed' as const } : tk));
    showToast('Ticket closed', 'success');
  }, [selectedTicketId, showToast]);

  const handleToggleCapability = useCallback((id: string) => {
    setAiCapabilities(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  }, []);

  const handleCreateTask = useCallback(() => {
    openModal(
      <div>
        <div className="text-base font-semibold mb-4">Create Follow-up Task</div>
        <div className="mb-3">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">Task Description</label>
          <textarea id="new-task-desc" className="w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-2 text-xs font-[var(--font-family-sans)] outline-none resize-vertical bg-white" rows={2} placeholder="Describe the task..." />
        </div>
        <div className="mb-3">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">Customer</label>
          <select id="new-task-customer" className="w-full h-9 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 text-xs bg-white text-[var(--color-text)] cursor-pointer outline-none">
            <option value="">Select customer...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">Priority</label>
          <select id="new-task-priority" className="w-full h-9 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 text-xs bg-white text-[var(--color-text)] cursor-pointer outline-none">
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            const desc = (document.getElementById('new-task-desc') as HTMLTextAreaElement)?.value;
            const cust = (document.getElementById('new-task-customer') as HTMLSelectElement)?.value;
            const prio = (document.getElementById('new-task-priority') as HTMLSelectElement)?.value;
            if (desc && desc.trim()) {
              setTasks(prev => [...prev, {
                id: 'TSK-' + String(prev.length + 1).padStart(3, '0'),
                description: desc.trim(),
                customerId: cust || '',
                ticketId: selectedTicketId || '',
                due: new Date(Date.now() + 86400000).toISOString(),
                priority: (prio as any) || 'Normal',
                triggeredBy: 'Manual',
                status: 'Pending',
                owner: 'You',
              }]);
              closeModal();
              showToast('Task created successfully', 'success');
            } else {
              showToast('Please enter a task description', 'error');
            }
          }}>Create Task</button>
        </div>
      </div>
    );
  }, [customers, selectedTicketId, openModal, closeModal, showToast]);

  const title = t.page[currentPage as keyof typeof t.page] || t.page.service;

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview />;
      case 'service':
        return (
          <CustomerService
            tickets={tickets}
            customers={customers}
            orders={orders}
            messages={messages}
            selectedTicketId={selectedTicketId}
            replyText={replyText}
            channelFilter={channelFilter}
            searchQuery={searchQuery}
            onSelectTicket={handleSelectTicket}
            onReplyTextChange={setReplyText}
            onInsertAI={handleInsertAI}
            onSendReply={handleSendReply}
            onSaveDraft={handleSaveDraft}
            onEscalate={handleEscalate}
            onCloseTicket={handleCloseTicket}
          />
        );
      case 'tickets':
        return (
          <TicketsPage
            tickets={tickets}
            customers={customers}
            tasks={tasks}
            messages={messages}
            ticketFilter={ticketFilter}
            selectedTicketId={selectedTicketId}
            onSelectTicket={handleSelectTicket}
            onTicketFilterChange={handleTicketFilterChange}
            onViewTicket={handleViewTicket}
          />
        );
      case 'customers':
        return (
          <CustomersPage
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            searchQuery={searchQuery}
            onSelectCustomer={setSelectedCustomerId}
          />
        );
      case 'orders':
        return (
          <OrdersPage
            orders={orders}
            customers={customers}
            selectedOrderId={selectedOrderId}
            orderFilter={orderFilter}
            onSelectOrder={setSelectedOrderId}
            onOrderFilterChange={setOrderFilter}
          />
        );
      case 'knowledge':
        return (
          <KnowledgeBase
            faqList={faqList}
            templates={templates}
            rules={rules}
            knowledgeTab={knowledgeTab}
            onKnowledgeTabChange={setKnowledgeTab}
          />
        );
      case 'ai-assistant':
        return (
          <AIAssistant
            aiCapabilities={aiCapabilities}
            onToggleCapability={handleToggleCapability}
          />
        );
      case 'ai-operations':
        return <AIOperations />;
      case 'tasks':
        return (
          <FollowUpTasks
            tasks={tasks}
            customers={customers}
            onCreateTask={handleCreateTask}
          />
        );
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return (
          <Settings
            lang={lang}
            onLanguageChange={setLang}
            settingsTab={settingsTab}
            onSettingsTabChange={setSettingsTab}
          />
        );
      default:
        return null;
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      <div className="flex h-screen overflow-hidden" style={{ fontFamily: 'var(--font-family-sans)' }}>
        <Sidebar
          currentPage={currentPage}
          tickets={tickets}
          tasks={tasks}
          onNavigate={handleNavigate}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            title={title}
            searchQuery={searchQuery}
            channelFilter={channelFilter}
            aiEnabled={aiEnabled}
            onSearchChange={setSearchQuery}
            onSearchEnter={() => {}}
            onChannelFilterChange={setChannelFilter}
          />
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 min-h-0">
            {renderPage()}
          </div>
        </div>
        <ToastContainer toasts={toasts} />
        <Modal open={modalOpen} onClose={closeModal}>
          {modalContent}
        </Modal>
      </div>
    </LanguageContext.Provider>
  );
}
