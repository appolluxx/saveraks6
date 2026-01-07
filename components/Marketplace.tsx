
import React, { useState } from 'react';
import { ShoppingBag, ChevronRight, X, Check, CreditCard, Sparkles } from 'lucide-react';
import { Reward, User } from '../types';
import { REWARDS } from '../constants';

interface MarketplaceProps {
  user: User;
  onRedeem: (points: number) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ user, onRedeem }) => {
  const [selected, setSelected] = useState<Reward | null>(null);
  const [ticketCode, setTicketCode] = useState<string | null>(null);

  const handleRedeem = () => {
    if (!selected) return;
    const code = "UNIT-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    onRedeem(selected.cost);
    setTicketCode(code);
  };

  return (
    <div className="space-y-8 px-6 pt-6 pb-12 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-eco-400 to-eco-600 p-10 rounded-unit flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden shadow-eco-strong">
        <CreditCard size={120} className="absolute -left-12 -bottom-12 text-white opacity-10 rotate-12" />
        <div className="relative z-10 space-y-1">
          <span className="text-[11px] font-bold text-eco-100 uppercase tracking-[0.4em]">Asset Exchange</span>
          <h2 className="text-4xl font-bold text-white tracking-tighter italic uppercase leading-none font-display">Market Unit</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {REWARDS.map(reward => (
          <button
            key={reward.id}
            onClick={() => { setSelected(reward); setTicketCode(null); }}
            className="bg-white p-6 rounded-unit flex items-center justify-between group hover:shadow-eco shadow-sm border border-eco-50 transition-all hover:-translate-y-1"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-eco-50 rounded-inner border border-eco-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                {reward.icon}
              </div>
              <div className="flex flex-col text-left">
                <h4 className="font-bold text-slate-900 text-lg tracking-tight uppercase italic">{reward.title}</h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-eco-600 font-black font-mono text-sm">{reward.cost} SRT</span>
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-eco-600 group-hover:bg-eco-100 transition-all">
              <ChevronRight size={18} strokeWidth={3} />
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm p-8 rounded-unit relative animate-in slide-in-from-bottom-10 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Sparkles size={100} className="text-eco-500" />
            </div>
            
            {!ticketCode ? (
              <div className="space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                     <span className="text-[10px] font-bold text-eco-500 uppercase tracking-widest">Asset Allocation</span>
                     <h3 className="text-3xl font-bold text-slate-900 tracking-tight uppercase leading-none italic font-display">{selected.title}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-2 text-slate-300 hover:text-slate-900"><X size={28} /></button>
                </div>
                
                <p className="text-sm text-slate-600 font-medium leading-relaxed italic border-l-4 border-eco-500 pl-4">"{selected.description}"</p>
                
                <div className="bg-eco-50 p-5 rounded-inner border border-eco-100 flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase text-eco-600 tracking-widest">Available Balance</span>
                  <span className="text-2xl font-black font-mono text-slate-900 tracking-tighter">{user.totalSRT.toLocaleString()} SRT</span>
                </div>

                <button
                  disabled={user.totalSRT < selected.cost}
                  onClick={handleRedeem}
                  className={`w-full py-5 rounded-inner font-bold uppercase text-xs tracking-widest transition-all active:scale-95 ${
                    user.totalSRT < selected.cost 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-eco-500 text-white shadow-eco hover:bg-eco-600'
                  }`}
                >
                  {user.totalSRT < selected.cost ? 'Insufficient Units' : `Authorize ${selected.cost} SRT`}
                </button>
              </div>
            ) : (
              <div className="space-y-8 text-center py-4 relative z-10">
                <div className="w-24 h-24 bg-eco-500 rounded-full flex items-center justify-center text-white mx-auto shadow-eco">
                  <Check size={48} strokeWidth={4} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-slate-900 uppercase tracking-tight font-display italic">Authorized</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Show code to system node</span>
                </div>
                
                <div className="bg-slate-50 py-8 rounded-inner border-2 border-dashed border-eco-200">
                  <span className="text-4xl font-black text-slate-900 font-mono tracking-[0.3em]">{ticketCode}</span>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-inner font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all"
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
