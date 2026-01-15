
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import DashboardHome from './pages/DashboardHome';
import AgentTemplates from './pages/AgentTemplates';
import CreateAgentWizard from './pages/CreateAgentWizard';
import LogsRecordings from './pages/LogsRecordings';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import AgentsPage from './pages/AgentsPage';
import KnowledgeBase from './pages/KnowledgeBase';
import TestCall from './pages/TestCall';
import BulkCall from './pages/BulkCall';
import PhoneNumbers from './pages/PhoneNumbers';
import TestAgent from './pages/TestAgent';
import CallDetails from './pages/CallDetails';
import Sidebar from './components/Sidebar';
import { AppTheme } from './types';
import { Sun, Moon, Bell, Search, ChevronDown, Menu, X } from 'lucide-react';

const TopBar: React.FC<{ theme: AppTheme, toggleTheme: () => void, isSidebarOpen: boolean, setSidebarOpen: (o: boolean) => void }> = ({ theme, toggleTheme, isSidebarOpen, setSidebarOpen }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md dark:border-white/10 dark:bg-vani-dark/80 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="lg:hidden text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-transparent hover:border-vani-plum/30 cursor-pointer group transition-all">
          <div className="w-5 h-5 rounded-md vani-gradient" />
          <span className="text-sm font-medium dark:text-gray-200">Main Project</span>
          <ChevronDown size={14} className="text-gray-400 group-hover:text-vani-plum" />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-transparent focus-within:border-vani-plum/50">
          <Search size={16} className="text-gray-400 mr-2" />
          <input
            placeholder="Quick search..."
            className="bg-transparent border-none text-sm focus:ring-0 text-gray-700 dark:text-white w-32 xl:w-64 outline-none"
          />
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vani-pink" />
        </button>

        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-white/10 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold dark:text-white leading-none">Amit Sharma</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-tighter">Pro Plan</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-vani-plum/20 border border-vani-plum flex items-center justify-center text-vani-plum font-bold text-xs group-hover:scale-105 transition-transform">
            AS
          </div>
        </div>
      </div>
    </header>
  );
};

const Layout: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const isPublicPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup';

  if (isPublicPage) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="bg-vani-light dark:bg-vani-dark transition-colors duration-200">
          {React.cloneElement(children, { theme, toggleTheme })}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex w-full bg-vani-light dark:bg-vani-dark transition-colors duration-200 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <TopBar theme={theme} toggleTheme={toggleTheme} isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 p-4 lg:p-8">
            <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage theme="dark" toggleTheme={() => { }} />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/create" element={<CreateAgentWizard />} />
          <Route path="/agents/:id/edit" element={<CreateAgentWizard />} />
          <Route path="/agents/:id/test" element={<TestAgent />} />
          <Route path="/templates" element={<AgentTemplates />} />
          <Route path="/call-logs" element={<LogsRecordings />} />
          <Route path="/call-logs/:callId" element={<CallDetails />} />
          <Route path="/logs" element={<Navigate to="/call-logs" replace />} />
          <Route path="/recordings" element={<Navigate to="/call-logs" replace />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/test-call" element={<TestCall />} />
          <Route path="/bulk-call" element={<BulkCall />} />
          <Route path="/phone-numbers" element={<PhoneNumbers />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
