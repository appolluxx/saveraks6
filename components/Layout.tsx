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
    <div className="min-h-screen relative flex flex-col font-sans bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Neon-Organic background blobs */}
      <div className="fixed -top-48 -left-48 w-[600px] h-[600px] bg-neon-green/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse"></div>
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-neon-blue/10 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse animation-delay-2000"></div>

      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-neon-green to-eco-600 rounded-inner flex items-center justify-center shadow-neon animate-in zoom-in duration-500">
            <Leaf className="text-zinc-900" size={24} fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight leading-none text-white font-display uppercase">Saveรักษ์</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse shadow-[0_0_10px_#00E978]"></div>
              <span className="font-mono text-[10px] text-neon-green font-bold uppercase tracking-widest">ECO-GUARDIAN UNIT</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <button className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-neon-green hover:border-neon-green/50 transition-all shadow-lg active:scale-95 relative group">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-zinc-900"></span>
          </button>

          <div
            onClick={() => setTab('profile')}
            className="w-10 h-10 rounded-full border-2 border-neon-green/30 overflow-hidden shadow-lg hover:scale-105 hover:border-neon-green transition-transform cursor-pointer relative group"
          >
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.schoolId}&backgroundColor=18181b`}
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