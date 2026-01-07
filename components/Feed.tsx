
import React, { useState, useEffect } from 'react';
import { getFeed } from '../services/api';
import { Action } from '../types';
import { Heart, MessageSquare, Share2, ShieldCheck, Leaf, Clock, Sparkles } from 'lucide-react';

const Feed: React.FC = () => {
  const [feed, setFeed] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  // Fix: Handling async getFeed in useEffect
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getFeed();
        setFeed(data);
      } catch (err) {
        console.error("Failed to load impact stream:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return (
    <div className="space-y-6 px-6 pt-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white p-8 rounded-unit animate-pulse space-y-5 shadow-eco border border-eco-50">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-inner bg-slate-100" />
            <div className="space-y-3 flex-1">
              <div className="h-5 bg-slate-100 rounded-full w-1/3" />
              <div className="h-3 bg-slate-100 rounded-full w-1/4" />
            </div>
          </div>
          <div className="h-48 bg-slate-50 rounded-inner" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 px-6 pt-6 pb-12">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-eco-600 uppercase tracking-[0.3em]">Operational Nexus</span>
          <h3 className="text-3xl font-bold text-slate-900 font-display">Impact Stream</h3>
        </div>
        <div className="flex items-center gap-2 text-eco-700 bg-eco-100 px-4 py-2 rounded-full border border-eco-200 shadow-sm transition-all hover:bg-eco-200 cursor-default">
          <div className="w-2 h-2 rounded-full bg-eco-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Network Live</span>
        </div>
      </div>

      <div className="space-y-8">
        {feed.length === 0 ? (
          <div className="bg-white p-16 rounded-unit text-center space-y-6 shadow-eco border-2 border-dashed border-eco-100 group hover:border-eco-300 transition-all duration-500">
            <div className="w-24 h-24 bg-eco-50 rounded-full flex items-center justify-center mx-auto transition-transform group-hover:scale-110 duration-700">
              <Leaf className="text-eco-300" size={48} />
            </div>
            <div className="space-y-2">
              <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">Global silence detected.</p>
              <p className="text-slate-400 text-sm italic">Be the first unit to report impact.</p>
            </div>
            <button className="px-10 py-4 bg-eco-500 text-white rounded-inner font-bold text-xs uppercase tracking-widest shadow-eco hover:bg-eco-600 transition-all">Engage Sensors</button>
          </div>
        ) : (
          feed.map((item) => (
            <div key={item.id} className="bg-white p-8 rounded-unit space-y-6 group hover:shadow-eco-strong transition-all duration-500 shadow-eco border border-eco-50 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-inner bg-eco-50 border border-eco-100 flex items-center justify-center p-0.5 shadow-sm">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.userId}&backgroundColor=f0fdf4`} 
                      className="w-full h-full object-cover rounded-inner" 
                      alt="Unit"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-slate-900 group-hover:text-eco-600 transition-colors tracking-tight">{item.userName}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-eco-600 uppercase tracking-widest">
                        <Sparkles size={10} />
                        <span>#{item.type}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold tracking-wider">
                        <Clock size={12} className="opacity-70" />
                        <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xl font-black text-eco-600 tracking-tighter leading-none">+{item.srtEarned} SRT</div>
                  <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Validated</div>
                </div>
              </div>

              <div className="bg-slate-50/80 p-5 rounded-inner border border-slate-100/50">
                <p className="text-sm text-slate-600 leading-relaxed font-medium italic">"{item.description}"</p>
              </div>
              
              {item.imageUrl && (
                <div className="rounded-inner overflow-hidden border border-slate-100 aspect-[16/10] relative shadow-inner group-hover:shadow-md transition-all duration-700">
                  <img src={item.imageUrl} alt="Mission log" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-sm border border-white/50">
                    <ShieldCheck size={16} className="text-eco-600" />
                    <span className="text-[10px] font-bold uppercase text-slate-800 tracking-widest">Vision Confirmed</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-8 pt-2 border-t border-slate-50">
                <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-eco-600 transition-all active:scale-90">
                  <Heart size={20} className="transition-colors" /> <span className="font-mono">12</span>
                </button>
                <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-all active:scale-90">
                  <MessageSquare size={20} /> <span className="font-mono">4</span>
                </button>
                <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-eco-500 transition-all active:scale-90 ml-auto">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-gradient-to-br from-eco-500 via-eco-600 to-eco-700 p-10 rounded-unit relative overflow-hidden group shadow-eco-strong animate-in slide-in-from-bottom-5 duration-700">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000">
          <Leaf size={140} strokeWidth={2.5} className="text-white" />
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-white space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20">
            <Sparkles size={14} className="text-eco-200" />
            <span className="font-bold uppercase tracking-widest text-[10px] text-eco-100">Efficiency Insight</span>
          </div>
          <p className="text-2xl font-bold leading-tight tracking-tight font-display italic">SYSTEM DATA SHOWS RECYCLING SAVES 40% MORE ENERGY THAN TRADITIONAL WASTE CYCLES.</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Source: SaveRaks Intelligence Node</p>
        </div>
      </div>
    </div>
  );
};

export default Feed;
