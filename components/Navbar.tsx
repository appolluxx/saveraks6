
import React from 'react';
import { LayoutGrid, Camera, MapPin, Trophy, ShoppingBag, User, ShieldAlert, FileText } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, userRole }) => {
  const items = [
    { id: 'feed', icon: LayoutGrid, label: 'Feed' },
    { id: 'vision', icon: Camera, label: 'Scan' },
    { id: 'logger', icon: FileText, label: 'Logs' }, // Added Manual Logs
    { id: 'matrix', icon: MapPin, label: 'Matrix' },
    { id: 'market', icon: ShoppingBag, label: 'Exch' },
    { id: 'profile', icon: User, label: 'Unit' },
  ];

  if (userRole === 'ADMIN') {
    // For admin, we might replace one or add
    items.splice(3, 0, { id: 'admin', icon: ShieldAlert, label: 'Root' });
  }

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[96%] max-w-lg z-50">
      <div className="glass rounded-[40px] p-2 flex justify-between items-center shadow-eco-strong border-white/80">
        {items.slice(0, 6).map((item) => { // Keep to 6 items for layout
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 py-3.5 flex flex-col items-center gap-1.5 transition-all rounded-[32px] relative group active:scale-90 ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-eco-600'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-eco-400 to-eco-600 rounded-[32px] animate-in zoom-in duration-300 shadow-eco shadow-eco-500/40"></div>
              )}
              <Icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`relative z-10 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
              />
              {isActive && (
                <span className="text-[8px] font-black uppercase tracking-widest relative z-10 font-sans animate-in slide-in-from-bottom-2 duration-300">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
