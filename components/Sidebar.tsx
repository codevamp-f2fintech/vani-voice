
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Grid2X2,
  FileAudio,
  Database,
  CreditCard,
  Settings,
  X,
  PlusCircle,
  PhoneCall,
  Upload
} from 'lucide-react';

const Sidebar: React.FC<{ isOpen: boolean, setOpen: (o: boolean) => void }> = ({ isOpen, setOpen }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Agents', path: '/agents' },
    { icon: PhoneCall, label: 'Phone Numbers', path: '/phone-numbers' },
    { icon: Grid2X2, label: 'Templates', path: '/templates' },
    { icon: PhoneCall, label: 'Test Call', path: '/test-call' },
    { icon: Upload, label: 'Bulk Calls', path: '/bulk-call' },
    { icon: FileAudio, label: 'Call Logs', path: '/call-logs' },
    { icon: Database, label: 'Knowledge Base', path: '/knowledge' },
    { icon: CreditCard, label: 'Billing & Usage', path: '/pricing' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 dark:border-white/10 dark:bg-[#0A0A0B] lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg vani-gradient text-white font-black group-hover:scale-110 transition-transform">
              V
            </div>
            <span className="text-xl font-bold tracking-tight dark:text-white">Vani</span>
          </Link>
          <button className="lg:hidden text-gray-500" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-4 px-3">
            <Link to="/agents/create" onClick={() => setOpen(false)}>
              <button className="flex w-full items-center justify-center gap-2 rounded-xl vani-gradient py-3 text-sm font-bold text-white vani-glow shadow-lg shadow-vani-plum/20">
                <PlusCircle size={18} />
                Create Agent
              </button>
            </Link>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all group
                  ${isActive
                    ? 'bg-vani-plum/10 text-vani-plum dark:bg-vani-plum/20 dark:text-vani-pink shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'}
                `}
              >
                <item.icon size={20} className="group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-gray-200 p-6 dark:border-white/10">
          <div className="rounded-[24px] bg-gradient-to-br from-vani-blue/5 to-vani-pink/5 p-5 border-2 border-vani-plum/10">
            <p className="text-[10px] font-black text-vani-plum uppercase tracking-widest mb-2">Wallet Balance</p>
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-black dark:text-white">₹450.00</span>
              <span className="text-xs text-gray-500 font-bold uppercase">Pro</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
              <div className="h-full vani-gradient w-[45%]" />
            </div>
            <button className="mt-4 w-full text-center text-xs font-black text-vani-plum hover:text-vani-pink transition-colors uppercase tracking-widest">
              Add Credits
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
