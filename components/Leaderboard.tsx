
import React, { useEffect, useState } from 'react';
import { Trophy, Crown, Loader2, Users, Target, Sparkles, TrendingUp } from 'lucide-react';
import { User } from '../types';
import { getLeaderboard } from '../services/api';

const Leaderboard: React.FC = () => {
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
    if (index === 0) return "text-eco-600 scale-125";
    if (index === 1) return "text-slate-600";
    if (index === 2) return "text-amber-600";
    return "text-slate-300";
  };

  return (
    <div className="space-y-8 px-6 pt-6 pb-12 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-eco-500 to-eco-700 p-10 rounded-unit relative overflow-hidden shadow-eco-strong">
        <Target className="absolute -right-8 -top-8 text-white opacity-10 w-48 h-48 rotate-12" />
        <div className="relative z-10 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-eco-100 uppercase tracking-[0.5em]">System Performance</span>
          <h3 className="text-4xl font-bold text-white tracking-tighter italic uppercase leading-none font-display">Elite Units</h3>
        </div>
      </div>

      <div className="flex bg-white p-1.5 rounded-inner shadow-sm border border-eco-50">
        <button 
          onClick={() => setView('INDIVIDUAL')}
          className={`flex-1 py-3 rounded-inner text-[10px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 ${view === 'INDIVIDUAL' ? 'bg-eco-500 text-white shadow-eco' : 'text-slate-400 hover:text-eco-600'}`}
        >
          Individual
        </button>
        <button 
          onClick={() => setView('CLASS')}
          className={`flex-1 py-3 rounded-inner text-[10px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 ${view === 'CLASS' ? 'bg-eco-500 text-white shadow-eco' : 'text-slate-400 hover:text-eco-600'}`}
        >
          Deployment
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <Loader2 className="animate-spin text-eco-500" size={32} />
          <p className="text-[10px] font-bold text-eco-600 uppercase tracking-widest">Syncing Matrix...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold uppercase text-[10px] tracking-widest">No node data synchronized.</div>
          ) : (
            leaders.map((u, i) => (
              <div key={u.id} className="bg-white p-5 rounded-unit flex items-center justify-between group hover:shadow-eco border border-slate-50 transition-all hover:-translate-y-0.5">
                <div className="flex items-center gap-5">
                  <div className={`w-8 h-8 flex items-center justify-center transition-transform ${getRankStyle(i)}`}>
                    {i === 0 ? <Crown size={24} strokeWidth={2.5} /> : <span className="font-mono text-lg font-black italic">{i + 1}</span>}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-bold text-slate-900 text-base tracking-tight uppercase italic group-hover:text-eco-600 transition-colors">{u.name}</h4>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{u.schoolId}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-mono text-xl font-black text-slate-900 tracking-tighter">{(u.totalSRT || 0).toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-eco-600 ml-1.5 uppercase tracking-tighter italic">SRT</span>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-slate-50 flex items-center justify-center text-eco-400 opacity-0 group-hover:opacity-100 transition-opacity">
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
