
import React, { useState, useEffect } from 'react';
import { getFeed } from '../services/api';
import type { Action } from '../types';
import { Heart, MessageSquare, Share2, ShieldCheck, Leaf, Clock, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Feed: React.FC = () => {
  const { t } = useTranslation();
  const [feed, setFeed] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Real-time update: poll feed every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="space-y-6 px-6 pt-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-unit animate-pulse space-y-5 shadow-lg">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-inner bg-zinc-800" />
            <div className="space-y-3 flex-1">
              <div className="h-5 bg-zinc-800 rounded-full w-1/3" />
              <div className="h-3 bg-zinc-800 rounded-full w-1/4" />
            </div>
          </div>
          <div className="h-48 bg-zinc-800 rounded-inner" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 px-6 pt-6 pb-24">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-neon-green uppercase tracking-[0.3em] font-mono">Surasakmontree Nexus</span>
          <h3 className="text-3xl font-bold text-white font-display drop-shadow-[0_0_10px_rgba(0,233,120,0.3)]">{t('home.title')}</h3>
          <p className="text-xs text-zinc-400 font-medium">{t('home.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-neon-green bg-zinc-900 px-4 py-2 rounded-full border border-neon-green/30 shadow-[0_0_15px_rgba(0,233,120,0.2)] transition-all hover:bg-zinc-800 cursor-default">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse shadow-[0_0_8px_#00E978]"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono">{t('home.network_live')}</span>
        </div>
      </div>

      <div className="space-y-8">
        {feed.length === 0 ? (
          <div className="bg-zinc-900/50 p-16 rounded-unit text-center space-y-6 border-2 border-dashed border-zinc-800 group hover:border-neon-green/50 transition-all duration-500 backdrop-blur-sm">
            <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto transition-transform group-hover:scale-110 duration-700 group-hover:bg-zinc-700">
              <Leaf className="text-zinc-600 group-hover:text-neon-green transition-colors" size={48} />
            </div>
            <div className="space-y-2">
              <p className="text-zinc-500 font-bold uppercase text-[11px] tracking-widest">{t('home.empty_state')}</p>
            </div>
          </div>
        ) : (
          feed.map((item) => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-8 rounded-unit space-y-6 group hover:border-neon-green/50 hover:shadow-[0_10px_40px_-10px_rgba(0,233,120,0.15)] transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
              {/* Glow effect on hover */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-inner bg-zinc-800 border border-zinc-700 flex items-center justify-center p-0.5 shadow-sm group-hover:border-neon-green/30 transition-colors">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.userId}&backgroundColor=18181b`}
                      className="w-full h-full object-cover rounded-inner"
                      alt="Unit"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-zinc-100 group-hover:text-neon-green transition-colors tracking-tight font-display">{item.userName}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-neon-blue uppercase tracking-widest font-mono">
                        <Sparkles size={10} />
                        <span>#{item.type}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-zinc-700" />
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold tracking-wider font-mono">
                        <Clock size={12} className="opacity-70" />
                        <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xl font-black text-neon-green tracking-tighter leading-none drop-shadow-[0_0_8px_rgba(0,233,120,0.4)]">+{item.srtEarned} SRT</div>
                  <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Validated</div>
                </div>
              </div>

              <div className="bg-zinc-950/50 p-5 rounded-inner border border-zinc-800/50 backdrop-blur-md">
                <p className="text-sm text-zinc-300 leading-relaxed font-medium italic">"{item.description}"</p>
              </div>

              {item.imageUrl && (
                <div className="rounded-inner overflow-hidden border border-zinc-800 aspect-[16/10] relative shadow-inner group-hover:shadow-lg transition-all duration-700">
                  <img src={item.imageUrl} alt="Mission log" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                  <div className="absolute top-4 right-4 bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-sm border border-white/10">
                    <ShieldCheck size={16} className="text-neon-green" />
                    <span className="text-[10px] font-bold uppercase text-zinc-200 tracking-widest font-mono">Vision Confirmed</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-8 pt-2 border-t border-zinc-800/50">
                <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-red-500 transition-all active:scale-90 group/btn">
                  <Heart size={20} className="transition-all group-active/btn:scale-125" /> <span className="font-mono group-hover/btn:text-red-400">12</span>
                </button>
                <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-all active:scale-90">
                  <MessageSquare size={20} /> <span className="font-mono">4</span>
                </button>
                <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-neon-blue transition-all active:scale-90 ml-auto">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-10 rounded-unit relative overflow-hidden group shadow-lg border border-zinc-700/50 animate-in slide-in-from-bottom-5 duration-700">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 grayscale"></div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-1000">
          <Leaf size={140} strokeWidth={1} className="text-white" />
        </div>

        <div className="relative z-10 text-white space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-green/10 rounded-full border border-neon-green/20 backdrop-blur-md">
            <Sparkles size={14} className="text-neon-green" />
            <span className="font-bold uppercase tracking-widest text-[10px] text-neon-green font-mono">Eco Insight</span>
          </div>
          <p className="text-xl font-bold leading-tight tracking-tight font-display italic text-zinc-100">
            "การคัดแยกขยะช่วยลดการปล่อยก๊าซเรือนกระจกได้ถึง 40% เมื่อเทียบกับการทิ้งรวม"
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 font-mono">Source: Saveรักษ์ Intelligence Node</p>
        </div>
      </div>
    </div>
  );
};

export default Feed;
