
import React, { useEffect, useState } from 'react';
import { Crown, Loader2, Target, TrendingUp } from 'lucide-react';
import type { User } from '../../types';
import { getLeaderboard } from '../../services/api';
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
    if (index === 0) return "text-amber-500 drop-shadow-sm scale-125";
    if (index === 1) return "text-slate-600";
    if (index === 2) return "text-amber-700";
    return "text-slate-400";
  };

  return (
    <div className="space-y-8 px-6 pt-6 pb-24 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-white to-slate-50 p-10 rounded-unit relative overflow-hidden shadow-sm border border-slate-200">
        <Target className="absolute -right-8 -top-8 text-emerald-500 opacity-10 w-48 h-48 rotate-12 animate-pulse" />
        <div className="relative z-10 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.5em] font-mono">{t('leaderboard.performance')}</span>
          <h3 className="text-4xl font-bold text-slate-800 tracking-tighter italic uppercase leading-none font-display">{t('leaderboard.elite_units')}</h3>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-inner shadow-inner border border-slate-200 relative z-10">
        <button
          onClick={() => setView('INDIVIDUAL')}
          className={`flex-1 py-3 rounded-inner text-[10px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 font-mono ${view === 'INDIVIDUAL' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          {t('leaderboard.individual')}
        </button>
        <button
          onClick={() => setView('CLASS')}
          className={`flex-1 py-3 rounded-inner text-[10px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 font-mono ${view === 'CLASS' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          {t('leaderboard.deployment')}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest font-mono animate-pulse">{t('common.syncing')}...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold uppercase text-[10px] tracking-widest font-mono">No node data synchronized.</div>
          ) : (
            leaders.map((u, i) => (
              <div key={u.id} className="bg-white p-5 rounded-unit flex items-center justify-between group hover:shadow-lg border border-slate-100 transition-all hover:-translate-y-0.5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex items-center gap-5 relative z-10">
                  <div className={`w-8 h-8 flex items-center justify-center transition-transform ${getRankStyle(i)}`}>
                    {i === 0 ? <Crown size={24} strokeWidth={2.5} /> : <span className="font-mono text-lg font-black italic">{i + 1}</span>}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-bold text-slate-800 text-base tracking-tight uppercase italic group-hover:text-emerald-600 transition-colors font-display">{u.name}</h4>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">{u.schoolId}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="text-right">
                    <span className="font-mono text-xl font-black text-slate-800 tracking-tighter group-hover:text-emerald-600 transition-colors">{(u.totalSRT || 0).toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 ml-1.5 uppercase tracking-tighter italic font-mono">SRT</span>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm bg-white">
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
