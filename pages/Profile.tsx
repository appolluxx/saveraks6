
import React from 'react';
import type { User } from '../types';
import { Shield, Trophy, Activity, LogOut, Award, ChevronRight, Leaf, Zap, Sparkles } from 'lucide-react';
import { getProgressToNextRank } from '../services/api';
import { useTranslation } from 'react-i18next';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const { t } = useTranslation();
  const { currentRank, nextRank, progressPercent, srtNeededForNext } = getProgressToNextRank(user?.totalSRT || 0);

  return (
    <div className="space-y-10 pb-24 px-6 pt-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-neon-green uppercase tracking-[0.4em] font-mono">{t('profile.title')}</span>
          <h2 className="text-4xl font-bold text-white font-display italic uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{user.name}</h2>
        </div>
        <button
          onClick={onLogout}
          className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-inner hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90 flex items-center justify-center backdrop-blur-md"
          title="Terminate Session"
        >
          <LogOut size={22} />
        </button>
      </div>

      {/* Rank HUD - Digital ID Card */}
      <div className="bg-zinc-900 p-10 rounded-unit relative overflow-hidden group shadow-lg border border-zinc-700">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 brightness-100 contrast-150 grayscale mix-blend-overlay"></div>
        <div className="absolute -right-20 -top-20 opacity-10 group-hover:opacity-20 transition-opacity duration-1000 rotate-12 group-hover:rotate-0">
          <Leaf size={320} strokeWidth={1} className="text-neon-green" />
        </div>

        <div className="flex items-center gap-6 mb-12 relative z-10">
          <div className="w-20 h-20 bg-zinc-800 rounded-inner flex items-center justify-center text-neon-green shadow-[0_0_20px_rgba(0,233,120,0.3)] rotate-3 group-hover:rotate-0 transition-transform duration-700 border border-neon-green/30">
            <Trophy size={40} strokeWidth={2} className="drop-shadow-[0_0_5px_rgba(0,233,120,0.8)]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-neon-green uppercase tracking-widest font-mono">{t('profile.rank_status')}</span>
              <Sparkles size={12} className="text-neon-green animate-pulse" />
            </div>
            <h3 className="text-3xl font-bold text-white font-display italic uppercase tracking-tight leading-none">Rank {currentRank} Unit</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">{user.classRoom || 'CENTRAL MATRIX'} DEPLOYMENT</p>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-end">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Asset Calibration</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl font-black text-neon-green italic tracking-tighter drop-shadow-[0_0_8px_rgba(0,233,120,0.5)]">
                {user?.totalSRT?.toLocaleString() || '0'}
              </span>
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest ml-1 font-mono">srt</span>
            </div>
          </div>

          <div className="h-5 w-full bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden p-1 shadow-inner relative">
            {/* Grid background for progress bar */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_2px,#000_2px)] bg-[size:10px_100%] opacity-30 z-20"></div>
            <div
              className="h-full bg-gradient-to-r from-neon-green/50 via-neon-green to-white rounded-full shadow-[0_0_15px_rgba(0,233,120,0.5)] transition-all duration-1000 relative z-10"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
            <div className="flex items-center gap-3">
              <span className="text-neon-green font-black">TIER {currentRank}</span>
              <div className="w-8 h-[1px] bg-zinc-700" />
              <span>TIER {nextRank}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white italic font-black">{srtNeededForNext?.toLocaleString() || '0'} SRT</span>
              <span className="opacity-60">to evolution</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.3em] font-mono">{t('profile.merits')}</h4>
          <span className="text-[10px] font-black text-neon-green bg-neon-green/10 px-4 py-1.5 rounded-full border border-neon-green/20 shadow-[0_0_10px_rgba(0,233,120,0.1)] font-mono">{user?.badges?.length || 0} Secured</span>
        </div>
        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 px-1">
          {user?.badges?.length === 0 ? (
            <div className="py-12 px-6 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-unit w-full text-center space-y-3 shadow-md">
              <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-600">
                <Sparkles size={24} />
              </div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.3em] font-mono">No merits authenticated in this cycle.</p>
            </div>
          ) : (
            (user?.badges || []).map(bId => (
              <div key={bId} className="shrink-0 w-28 h-28 bg-zinc-900 border border-zinc-700 rounded-inner flex flex-col items-center justify-center gap-3 shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-3xl filter drop-shadow-lg group-hover:scale-110 transition-transform duration-500">🌿</div>
                <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest text-center px-3 leading-tight font-mono group-hover:text-white transition-colors">{bId.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {[
          { label: 'Logged Missions', value: (user?.history || []).length, icon: Activity, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
          { label: 'Delta Cycle', value: `+${user?.currentMonthSRT || 0}`, icon: Award, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
          { label: 'Node Integrity', value: '100%', icon: Shield, color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/20' },
          { label: 'Growth Vector', value: `V-${currentRank}`, icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
        ].map(stat => (
          <div key={stat.label} className={`bg-zinc-900 p-7 rounded-unit space-y-4 shadow-lg border border-zinc-800 hover:border-zinc-600 transition-all duration-500 cursor-default group relative overflow-hidden`}>
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} ${stat.border} border rounded-inner flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
              <stat.icon size={24} />
            </div>
            <div className="space-y-1 relative z-10">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">{stat.label}</p>
              <p className="font-mono text-3xl font-black text-white leading-none tracking-tighter group-hover:text-neon-green transition-colors">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full bg-zinc-900 p-8 rounded-unit flex items-center justify-between group shadow-lg border border-zinc-800 hover:bg-zinc-800 hover:border-neon-green/30 transition-all duration-500 relative overflow-hidden">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 bg-zinc-950 rounded-inner flex items-center justify-center text-zinc-400 border border-zinc-800 shadow-inner group-hover:scale-105 group-hover:text-neon-green group-hover:border-neon-green/30 transition-all">
            <Shield size={26} strokeWidth={2} />
          </div>
          <div className="flex flex-col text-left space-y-1">
            <span className="text-base font-bold text-white uppercase tracking-tight font-display italic group-hover:text-neon-green transition-colors">Protocol Settings</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Manage unit keys and data authorization</span>
          </div>
        </div>
        <div className="w-10 h-10 bg-zinc-950 rounded-full flex items-center justify-center text-zinc-600 group-hover:text-neon-green group-hover:bg-zinc-900 transition-all">
          <ChevronRight size={24} />
        </div>
      </button>

      <div className="text-center pb-8 opacity-20">
        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.5em] font-mono">System Version 2.5.0-Neon</p>
      </div>
    </div>
  );
};

export default Profile;
