
import React from 'react';
import { LayoutGrid, Camera, MapPin, ShoppingBag, User, ShieldAlert, FileText } from 'lucide-react';
import { UserRole } from '../types';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, userRole }) => {
  const { t } = useTranslation();

  const items = [
    { id: 'feed', icon: LayoutGrid, label: t('common.nav.feed') },
    { id: 'vision', icon: Camera, label: t('common.nav.vision') },
    { id: 'logger', icon: FileText, label: 'Logs' },
    { id: 'matrix', icon: MapPin, label: t('common.nav.matrix') },
    { id: 'market', icon: ShoppingBag, label: t('common.nav.market') },
  ];

  if (activeTab === 'profile') {
    // User accesses profile via header, but we show state here if needed, or rely on profile tab highlighting nothing or special treatment
  }

  // Admin special item
  if (userRole === 'ADMIN') {
    items.splice(2, 0, { id: 'admin', icon: ShieldAlert, label: 'Root' });
  }

  return (
    <nav className="fixed bottom-6 left-6 right-6 h-20 bg-zinc-900/90 backdrop-blur-xl border border-white/5 rounded-[32px] shadow-2xl flex items-center justify-around px-2 z-50">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 group ${isActive ? 'text-neon-green -translate-y-2' : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            <div className={`p-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-neon-green/10 shadow-[0_0_15px_rgba(0,233,120,0.3)] scale-110' : 'group-hover:bg-zinc-800'
              }`}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-display font-medium absolute -bottom-3 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navbar;
