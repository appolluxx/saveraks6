
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
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-[0.4em] font-mono">{t('profile.title')}</span>
          <h2 className="text-4xl font-bold text-slate-800 font-display italic uppercase tracking-tighter drop-shadow-sm">{user.name}</h2>
        </div>
        <button
          onClick={onLogout}
          className="p-4 bg-red-50 text-red-500 border border-red-100 rounded-inner hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90 flex items-center justify-center backdrop-blur-md"
          title="Terminate Session"
        >
          <LogOut size={22} />
        </button>
      </div>

      {/* Rank HUD - Digital ID Card */}
      <div className="bg-white p-10 rounded-unit relative overflow-hidden group shadow-sm border border-slate-200">
        <div className="absolute -right-20 -top-20 opacity-10 group-hover:opacity-20 transition-opacity duration-1000 rotate-12 group-hover:rotate-0">
          <Leaf size={320} strokeWidth={1} className="text-emerald-500" />
        </div>

        <div className="flex items-center gap-6 mb-12 relative z-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-inner flex items-center justify-center text-emerald-500 shadow-sm rotate-3 group-hover:rotate-0 transition-transform duration-700 border border-emerald-100">
            <Trophy size={40} strokeWidth={2} className="drop-shadow-sm" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest font-mono">{t('profile.rank_status')}</span>
              <Sparkles size={12} className="text-emerald-500 animate-pulse" />
            </div>
            <h3 className="text-3xl font-bold text-slate-800 font-display italic uppercase tracking-tight leading-none">Rank {currentRank} Unit</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">{user.classRoom || 'CENTRAL MATRIX'} DEPLOYMENT</p>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-end">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">Asset Calibration</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl font-black text-emerald-500 italic tracking-tighter drop-shadow-sm">
                {user?.totalSRT?.toLocaleString() || '0'}
              </span>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1 font-mono">srt</span>
            </div>
          </div>

          <div className="h-5 w-full bg-slate-100 rounded-full border border-slate-200 overflow-hidden p-1 shadow-inner relative">
            {/* Grid background for progress bar */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_2px,#fff_2px)] bg-[size:10px_100%] opacity-30 z-20"></div>
            <div
              className="h-full bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-400 rounded-full shadow-sm transition-all duration-1000 relative z-10"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            <div className="flex items-center gap-3">
              <span className="text-emerald-600 font-black">TIER {currentRank}</span>
              <div className="w-8 h-[1px] bg-slate-300" />
              <span>TIER {nextRank}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-800 italic font-black">{srtNeededForNext?.toLocaleString() || '0'} SRT</span>
              <span className="opacity-60">to evolution</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] font-mono">{t('profile.merits')}</h4>
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm font-mono">{user?.badges?.length || 0} Secured</span>
        </div>
        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 px-1">
          {user?.badges?.length === 0 ? (
            <div className="py-12 px-6 bg-white border-2 border-dashed border-slate-200 rounded-unit w-full text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Sparkles size={24} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] font-mono">No merits authenticated in this cycle.</p>
            </div>
          ) : (
            (user?.badges || []).map(bId => (
              <div key={bId} className="shrink-0 w-28 h-28 bg-white border border-slate-200 rounded-inner flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-500">🌿</div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center px-3 leading-tight font-mono group-hover:text-emerald-600 transition-colors">{bId.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {[
          { label: 'Logged Missions', value: (user?.history || []).length, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Delta Cycle', value: `+${user?.currentMonthSRT || 0}`, icon: Award, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Node Integrity', value: '100%', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Growth Vector', value: `V-${currentRank}`, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
        ].map(stat => (
          <div key={stat.label} className={`bg-white p-7 rounded-unit space-y-4 shadow-sm border border-slate-200 hover:border-slate-300 transition-all duration-500 cursor-default group relative overflow-hidden`}>
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} ${stat.border} border rounded-inner flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
              <stat.icon size={24} />
            </div>
            <div className="space-y-1 relative z-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{stat.label}</p>
              <p className="font-mono text-3xl font-black text-slate-800 leading-none tracking-tighter group-hover:text-emerald-500 transition-colors">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full bg-white p-8 rounded-unit flex items-center justify-between group shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-emerald-200 transition-all duration-500 relative overflow-hidden">
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 bg-slate-50 rounded-inner flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner group-hover:scale-105 group-hover:text-emerald-500 group-hover:border-emerald-200 transition-all">
            <Shield size={26} strokeWidth={2} />
          </div>
          <div className="flex flex-col text-left space-y-1">
            <span className="text-base font-bold text-slate-800 uppercase tracking-tight font-display italic group-hover:text-emerald-600 transition-colors">Protocol Settings</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Manage unit keys and data authorization</span>
          </div>
        </div>
        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:bg-white transition-all">
          <ChevronRight size={24} />
        </div>
      </button>

      <div className="text-center pb-8 opacity-40">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">System Version 2.5.0-Light</p>
      </div>
    </div>
  );
};

export default Profile;
