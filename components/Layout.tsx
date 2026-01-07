import React from 'react';
import Navbar from './Navbar';
import { User } from '../types';
import { Bell, Leaf, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  setTab: (tab: string) => void;
  user: User;
}

const Layout: React.FC<LayoutProps> = ({ children, currentTab, setTab, user }) => {
  const rank = Math.floor(user.totalSRT / 1000) + 1;

  return (
    <div className="min-h-screen relative flex flex-col font-sans">
      {/* Organic nature-inspired background blobs */}
      <div className="fixed -top-48 -left-48 w-[600px] h-[600px] bg-eco-100/50 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-blue-50/50 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <header className="sticky top-0 z-50 glass px-6 py-4 flex justify-between items-center transition-all duration-300 shadow-sm shadow-eco-500/5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-eco-400 to-eco-600 rounded-inner flex items-center justify-center shadow-eco animate-in zoom-in duration-500">
            <Leaf className="text-white" size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight leading-none text-slate-900 font-display uppercase">SAVERAKS</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-eco-500 animate-pulse"></div>
              <span className="font-mono text-[10px] text-eco-700 font-bold uppercase tracking-widest">RANK {rank} UNIT</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="w-10 h-10 bg-white border border-eco-100 rounded-full flex items-center justify-center text-slate-400 hover:text-eco-600 hover:bg-eco-50 transition-all shadow-sm">
            <Bell size={20} />
          </button>
          <div className="w-10 h-10 rounded-full border-2 border-eco-500/20 overflow-hidden shadow-sm hover:scale-105 transition-transform cursor-pointer">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.schoolId}&backgroundColor=dcfce7`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
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