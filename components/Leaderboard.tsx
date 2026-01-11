
import React, { useEffect, useState } from 'react';
import { Crown, Loader2, Target, TrendingUp } from 'lucide-react';
import type { User } from '../types';
import { getLeaderboard } from '../services/api';
import { useTranslation } from 'react-i18next';

const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
  const [leaders, setLeaders] = useState<User[]>([]);
  const [view, setView] = useState<'INDIVIDUAL' | 'CLASS'>('INDIVIDUAL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getLeaderboard();
      setLeaders(data);
      setLoading(false);
    };
    load();
  }, []);

  const getRankStyle = (index: number) => {
    if (index === 0) return "text-neon-green drop-shadow-[0_0_10px_rgba(0,233,120,0.8)] scale-125";
    if (index === 1) return "text-white";
    if (index === 2) return "text-amber-500";
    return "text-zinc-600";
  };

  return (
    <div className="space-y-8 px-6 pt-6 pb-24 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-10 rounded-unit relative overflow-hidden shadow-lg border border-zinc-700">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 grayscale"></div>
        <Target className="absolute -right-8 -top-8 text-neon-green opacity-10 w-48 h-48 rotate-12 animate-pulse" />
        <div className="relative z-10 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-neon-green uppercase tracking-[0.5em] font-mono">{t('leaderboard.performance')}</span>
          <h3 className="text-4xl font-bold text-white tracking-tighter italic uppercase leading-none font-display drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{t('leaderboard.elite_units')}</h3>
        </div>
      </div>

      <div className="flex bg-zinc-900 p-1.5 rounded-inner shadow-lg border border-zinc-800 relative z-10">
        <button
          onClick={() => setView('INDIVIDUAL')}
          className={`flex-1 py-3 rounded-inner text-[10px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 font-mono ${view === 'INDIVIDUAL' ? 'bg-neon-green text-zinc-900 shadow-[0_0_15px_rgba(0,233,120,0.4)]' : 'text-zinc-500 hover:text-white'}`}
        >
          {t('leaderboard.individual')}
        </button>
        <button
          onClick={() => setView('CLASS')}
          className={`flex-1 py-3 rounded-inner text-[10px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 font-mono ${view === 'CLASS' ? 'bg-neon-green text-zinc-900 shadow-[0_0_15px_rgba(0,233,120,0.4)]' : 'text-zinc-500 hover:text-white'}`}
        >
          {t('leaderboard.deployment')}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <Loader2 className="animate-spin text-neon-green" size={32} />
          <p className="text-[10px] font-bold text-neon-green uppercase tracking-widest font-mono animate-pulse">{t('common.syncing')}...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.length === 0 ? (
            <div className="text-center py-10 text-zinc-600 font-bold uppercase text-[10px] tracking-widest font-mono">No node data synchronized.</div>
          ) : (
            leaders.map((u, i) => (
              <div key={u.id} className="bg-zinc-900 p-5 rounded-unit flex items-center justify-between group hover:shadow-[0_0_20px_rgba(0,233,120,0.1)] border border-zinc-800 transition-all hover:-translate-y-0.5 hover:border-zinc-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex items-center gap-5 relative z-10">
                  <div className={`w-8 h-8 flex items-center justify-center transition-transform ${getRankStyle(i)}`}>
                    {i === 0 ? <Crown size={24} strokeWidth={2.5} /> : <span className="font-mono text-lg font-black italic">{i + 1}</span>}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-bold text-white text-base tracking-tight uppercase italic group-hover:text-neon-green transition-colors font-display">{u.name}</h4>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-mono">{u.schoolId}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="text-right">
                    <span className="font-mono text-xl font-black text-white tracking-tighter group-hover:text-neon-green transition-colors">{(u.totalSRT || 0).toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-zinc-500 ml-1.5 uppercase tracking-tighter italic font-mono">SRT</span>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center text-neon-green opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(0,233,120,0.2)] bg-zinc-800">
                    <TrendingUp size={14} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
