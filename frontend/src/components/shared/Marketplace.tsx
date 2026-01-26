import React, { useState } from 'react';
import { ChevronRight, X, Check, CreditCard, Sparkles } from 'lucide-react';
import type { User, Reward } from '../../types';
import { REWARDS } from '../../../../constants';
import { useTranslation } from 'react-i18next';

interface MarketplaceProps {
  user: User;
  onRedeem: (points: number) => void;
}

import { redeemItem } from '../../services/api';

const Marketplace: React.FC<MarketplaceProps> = ({ user, onRedeem }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Reward | null>(null);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visualBalance, setVisualBalance] = useState(user.totalSRT);

  // Sync with prop when it updates (e.g. after refresh completes)
  React.useEffect(() => {
    setVisualBalance(user.totalSRT);
  }, [user.totalSRT]);

  const handleRedeem = async () => {
    if (!selected) return;

    // Show confirmation dialog
    const confirmed = window.confirm("กรุณาอย่ากดเอง หากกดเองแล้วโปรดแค้ปไว้\n\nPlease do not press yourself. If you press yourself, please keep the proof.");

    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const res = await redeemItem(selected.id, selected.cost, selected.title);

      // Update local visual immediately
      const cost = selected.cost;
      const newBalance = (res && typeof res.remainingPoints === 'number') ? res.remainingPoints : (visualBalance - cost);

      setVisualBalance(newBalance);
      onRedeem(cost); // Notify parent to refresh

      const code = "SRT-" + Math.random().toString(36).substr(2, 6).toUpperCase();
      setTicketCode(code);
    } catch (error: any) {
      alert(error.message || "Redemption failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 px-6 pt-6 pb-24 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-white to-slate-50 p-10 rounded-unit flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden shadow-sm border border-slate-200">
        <CreditCard size={120} className="absolute -left-12 -bottom-12 text-slate-200 opacity-50 rotate-12" />
        <div className="relative z-10 space-y-1">
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.4em] font-mono">{t('market.title')}</span>
          <h2 className="text-4xl font-bold text-slate-800 tracking-tighter italic uppercase leading-none font-display">
            {t('market.subtitle')}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {REWARDS.map(reward => (
          <button
            key={reward.id}
            onClick={() => { setSelected(reward); setTicketCode(null); }}
            className="bg-white p-6 rounded-unit flex items-center justify-between group hover:border-emerald-200 hover:shadow-lg shadow-sm border border-slate-200 transition-all hover:-translate-y-1 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full pointer-events-none group-hover:from-emerald-100 transition-colors`}></div>

            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-slate-50 rounded-inner border border-slate-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform group-hover:border-emerald-200 group-hover:bg-emerald-50">
                {reward.icon}
              </div>
              <div className="flex flex-col text-left">
                <h4 className="font-bold text-slate-800 text-lg tracking-tight uppercase italic font-display group-hover:text-emerald-600 transition-colors">{reward.title}</h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-blue-500 font-black font-mono text-sm">{reward.cost} SRT</span>
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all border border-slate-100 group-hover:border-emerald-200">
              <ChevronRight size={18} strokeWidth={3} />
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm p-8 rounded-unit relative animate-in slide-in-from-bottom-10 shadow-2xl overflow-hidden border border-slate-200">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Sparkles size={100} className="text-emerald-500" />
            </div>

            {!ticketCode ? (
              <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest font-mono">Asset Allocation</span>
                    <h3 className="text-3xl font-bold text-slate-800 tracking-tight uppercase leading-none italic font-display">{selected.title}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={28} /></button>
                </div>

                <p className="text-sm text-slate-600 font-medium leading-relaxed italic border-l-4 border-emerald-500 pl-4">"{selected.description}"</p>

                <div className="bg-slate-50 p-5 rounded-inner border border-slate-200 flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest font-mono">{t('market.balance')}</span>
                  <span className="text-2xl font-black font-mono text-slate-800 tracking-tighter">{visualBalance.toLocaleString()} SRT</span>
                </div>

                <button
                  disabled={visualBalance < selected.cost || loading}
                  onClick={handleRedeem}
                  className={`w-full py-5 rounded-inner font-bold uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${visualBalance < selected.cost
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : loading ? 'bg-emerald-400 cursor-wait' : 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600'
                    }`}
                >
                  {loading ? 'Purchasing...' : (visualBalance < selected.cost ? 'Insufficient Units' : t('market.authorize'))}
                </button>
              </div>
            ) : (
              <div className="space-y-8 text-center py-4 relative z-10">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg animate-in zoom-in spin-in-180 duration-500">
                  <Check size={48} strokeWidth={4} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-slate-800 uppercase tracking-tight font-display italic">Authorized</h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] font-mono">Show code to system node</span>
                </div>

                <div className="bg-slate-50 py-8 rounded-inner border-2 border-dashed border-slate-300 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
                  <span className="text-4xl font-black text-emerald-600 font-mono tracking-[0.2em] relative z-10">{ticketCode}</span>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="w-full py-4 bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-inner font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                >
                  Close Secure Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
