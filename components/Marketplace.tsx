
import React, { useState } from 'react';
import { ShoppingBag, ChevronRight, X, Check, CreditCard, Sparkles } from 'lucide-react';
import type { Reward, User } from '../types';
import { REWARDS } from '../constants';
import { useTranslation } from 'react-i18next';

interface MarketplaceProps {
  user: User;
  onRedeem: (points: number) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ user, onRedeem }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Reward | null>(null);
  const [ticketCode, setTicketCode] = useState<string | null>(null);

  const handleRedeem = () => {
    if (!selected) return;
    const code = "UNIT-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    onRedeem(selected.cost);
    setTicketCode(code);
  };

  return (
    <div className="space-y-8 px-6 pt-6 pb-24 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-10 rounded-unit flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden shadow-lg border border-zinc-700/50">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 grayscale"></div>
        <CreditCard size={120} className="absolute -left-12 -bottom-12 text-zinc-700 opacity-20 rotate-12" />
        <div className="relative z-10 space-y-1">
          <span className="text-[11px] font-bold text-neon-green uppercase tracking-[0.4em] font-mono">{t('market.title')}</span>
          <h2 className="text-4xl font-bold text-white tracking-tighter italic uppercase leading-none font-display drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            {t('market.subtitle')}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {REWARDS.map(reward => (
          <button
            key={reward.id}
            onClick={() => { setSelected(reward); setTicketCode(null); }}
            className="bg-zinc-900 p-6 rounded-unit flex items-center justify-between group hover:border-neon-green/50 hover:shadow-[0_0_20px_rgba(0,233,120,0.15)] shadow-md border border-zinc-800 transition-all hover:-translate-y-1 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-neon-green/5 to-transparent rounded-bl-full pointer-events-none group-hover:from-neon-green/10 transition-colors`}></div>

            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-zinc-800 rounded-inner border border-zinc-700 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform group-hover:border-neon-green/30 group-hover:bg-zinc-900">
                {reward.icon}
              </div>
              <div className="flex flex-col text-left">
                <h4 className="font-bold text-zinc-100 text-lg tracking-tight uppercase italic font-display group-hover:text-neon-green transition-colors">{reward.title}</h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-neon-blue font-black font-mono text-sm">{reward.cost} SRT</span>
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-neon-green group-hover:bg-zinc-900 transition-all border border-zinc-700/50 group-hover:border-neon-green/30">
              <ChevronRight size={18} strokeWidth={3} />
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-zinc-900 w-full max-w-sm p-8 rounded-unit relative animate-in slide-in-from-bottom-10 shadow-2xl overflow-hidden border border-zinc-700">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Sparkles size={100} className="text-neon-green" />
            </div>

            {!ticketCode ? (
              <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neon-green uppercase tracking-widest font-mono">Asset Allocation</span>
                    <h3 className="text-3xl font-bold text-white tracking-tight uppercase leading-none italic font-display">{selected.title}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-2 text-zinc-500 hover:text-white transition-colors"><X size={28} /></button>
                </div>

                <p className="text-sm text-zinc-400 font-medium leading-relaxed italic border-l-4 border-neon-green pl-4">"{selected.description}"</p>

                <div className="bg-zinc-950 p-5 rounded-inner border border-zinc-800 flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-widest font-mono">{t('market.balance')}</span>
                  <span className="text-2xl font-black font-mono text-white tracking-tighter">{user.totalSRT.toLocaleString()} SRT</span>
                </div>

                <button
                  disabled={user.totalSRT < selected.cost}
                  onClick={handleRedeem}
                  className={`w-full py-5 rounded-inner font-bold uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${user.totalSRT < selected.cost
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-neon-green text-zinc-900 shadow-[0_0_20px_rgba(0,233,120,0.4)] hover:bg-green-400'
                    }`}
                >
                  {user.totalSRT < selected.cost ? 'Insufficient Units' : t('market.authorize')}
                </button>
              </div>
            ) : (
              <div className="space-y-8 text-center py-4 relative z-10">
                <div className="w-24 h-24 bg-neon-green rounded-full flex items-center justify-center text-zinc-900 mx-auto shadow-[0_0_30px_rgba(0,233,120,0.6)] animate-in zoom-in spin-in-180 duration-500">
                  <Check size={48} strokeWidth={4} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-white uppercase tracking-tight font-display italic">Authorized</h3>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] font-mono">Show code to system node</span>
                </div>

                <div className="bg-zinc-950 py-8 rounded-inner border-2 border-dashed border-zinc-700 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-neon-green/5 animate-pulse"></div>
                  <span className="text-4xl font-black text-neon-green font-mono tracking-[0.2em] relative z-10">{ticketCode}</span>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="w-full py-4 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-inner font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all"
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
