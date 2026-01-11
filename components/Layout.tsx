import React from 'react';
import Navbar from './Navbar';
import type { User } from '../types';
import { Bell, Leaf } from 'lucide-react';
import { LanguageSwitcher } from '../frontend/src/components/LanguageSwitcher';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  setTab: (tab: string) => void;
  user: User;
}

const Layout: React.FC<LayoutProps> = ({ children, currentTab, setTab, user }) => {
  return (
    <div className="min-h-screen relative flex flex-col font-sans bg-slate-50 text-slate-900 overflow-hidden">
      {/* Light-Organic background blobs */}
      <div className="fixed -top-48 -left-48 w-[600px] h-[600px] bg-emerald-200/40 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse"></div>
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-blue-200/40 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse animation-delay-2000"></div>

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-100 rounded-inner flex items-center justify-center shadow-sm animate-in zoom-in duration-500 text-emerald-600">
            <Leaf size={24} fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight leading-none text-slate-800 font-display uppercase">Saveรักษ์</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-mono text-[10px] text-emerald-600 font-bold uppercase tracking-widest">ECO-GUARDIAN UNIT</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <button className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm active:scale-95 relative group">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>

          <div
            onClick={() => setTab('profile')}
            className="w-10 h-10 rounded-full border-2 border-emerald-500/30 overflow-hidden shadow-sm hover:scale-105 hover:border-emerald-500 transition-transform cursor-pointer relative group"
          >
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.schoolId}&backgroundColor=e2e8f0`}
              alt="Avatar"
              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 relative z-10">
        {children}
      </div>

      <div className="pb-32"></div> {/* Bottom nav padding */}
      <Navbar activeTab={currentTab} setActiveTab={setTab} userRole={user.role} />
    </div>
  );
};

export default Layout;