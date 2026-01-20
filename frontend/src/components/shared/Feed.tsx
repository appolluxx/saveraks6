
import React, { useState, useEffect } from 'react';
import { getFeed, getProfile } from '../../services/api';
import type { Action, User } from '../../types';
import { Leaf, Clock, Scan, PenTool, Map, Trophy, ShoppingBag, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FeedProps {
  setTab: (tab: string) => void;
}

const Feed: React.FC<FeedProps> = ({ setTab }) => {
  const { t } = useTranslation();
  const [feed, setFeed] = useState<Action[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const feedData = await getFeed();
        setFeed(feedData);
        setUser(getProfile());
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);


  const menuItems = [
    {
      id: 'vision',
      name: t('common.nav.vision', 'Vision'),
      icon: <Scan size={32} />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      tab: 'vision'
    },
    {
      id: 'logger',
      name: t('common.nav.logs', 'Logger'),
      icon: <PenTool size={32} />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      tab: 'logger'
    },
    {
      id: 'matrix',
      name: t('common.nav.matrix', 'Matrix'),
      icon: <Map size={32} />,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      tab: 'matrix'
    },
    {
      id: 'rank',
      name: t('common.nav.profile', 'Rank'),
      icon: <Trophy size={32} />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      tab: 'leaderboard'
    },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 px-6 pt-6 pb-24 animate-in fade-in duration-500">

      {/* 1. Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black font-display text-slate-800 italic tracking-tighter">
            HELLO, <span className="text-emerald-500">{user?.name?.split(' ')[0] || 'UNIT'}</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mt-1">
            STATUS: <span className="text-emerald-500">ONLINE</span> • {user?.totalSRT || 0} SRT
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-emerald-500/30 overflow-hidden">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'guest'}&backgroundColor=e2e8f0`}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 2. Main 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.tab)}
            className={`aspect-square rounded-[30px] ${item.bg} border ${item.border} flex flex-col items-center justify-center gap-4 transition-all active:scale-95 hover:shadow-lg hover:brightness-105`}
          >
            <div className={`${item.color} drop-shadow-sm`}>
              {item.icon}
            </div>
            <span className={`text-xs font-black uppercase tracking-widest ${item.color} font-mono`}>
              {item.name}
            </span>
          </button>
        ))}
      </div>

      {/* 3. Market Button (Full Width) */}
      <button
        onClick={() => setTab('market')}
        className="w-full py-6 rounded-[30px] bg-white border border-slate-200 flex items-center justify-center gap-6 shadow-sm active:scale-98 transition-all group overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50 to-transparent skew-x-12 translate-x-[-150%] md:group-hover:translate-x-[150%] transition-transform duration-700" />

        <div className="w-12 h-12 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500">
          <ShoppingBag size={24} />
        </div>
        <div className="text-left">
          <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-wider font-display">
            {t('common.nav.market', 'Marketplace')}
          </h3>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
            Redeem your SRT rewards
          </p>
        </div>
        <div className="ml-auto pr-8 opacity-50">
          <Leaf className="text-slate-300" size={40} />
        </div>
      </button>

      {/* 4. Stream Header (Moved down) */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-4 opacity-70">
          <Sparkles size={14} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 font-mono">
            Live Impact Stream
          </span>
          <div className="h-[1px] flex-1 bg-slate-200"></div>
        </div>

        {/* 5. Compact Feed List */}
        <div className="space-y-4">
          {feed.slice(0, 5).map((item) => (
            <div key={item.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.userId}&backgroundColor=e2e8f0`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-800 truncate">{item.userName}</h4>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock size={8} /> {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • #{item.type}
                </p>
              </div>
              <span className="text-emerald-600 font-black font-mono text-sm">
                +{item.srtEarned}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Feed;
