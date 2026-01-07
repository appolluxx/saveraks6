
import React from 'react';
import { User } from '../types';
import { Shield, Trophy, Activity, LogOut, Award, ChevronRight, Leaf, Zap, Sparkles } from 'lucide-react';
import { getProgressToNextRank } from '../services/api';

interface ProfileProps { 
  user: User; 
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const { currentRank, nextRank, progressPercent, srtNeededForNext } = getProgressToNextRank(user.totalSRT);

  return (
    <div className="space-y-10 pb-24 px-6 pt-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-eco-500 uppercase tracking-[0.4em]">Identity Profile</span>
          <h2 className="text-4xl font-bold text-slate-900 font-display italic uppercase tracking-tighter">{user.name}</h2>
        </div>
        <button 
          onClick={onLogout} 
          className="p-4 bg-red-50 text-red-500 border border-red-100 rounded-inner hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90 flex items-center justify-center"
          title="Terminate Session"
        >
          <LogOut size={22} />
        </button>
      </div>

      {/* Rank HUD - Soft Nature Gradient */}
      <div className="bg-white p-10 rounded-unit relative overflow-hidden group shadow-eco border border-eco-50">
        <div className="absolute -right-20 -top-20 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 rotate-12 group-hover:rotate-0">
          <Leaf size={320} strokeWidth={1} />
        </div>
        
        <div className="flex items-center gap-6 mb-12 relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-eco-400 to-eco-600 rounded-inner flex items-center justify-center text-white shadow-eco-strong rotate-3 group-hover:rotate-0 transition-transform duration-700">
            <Trophy size={40} strokeWidth={2} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-eco-600 uppercase tracking-widest">Global Ranking Status</span>
              <Sparkles size={12} className="text-eco-400" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 font-display italic uppercase tracking-tight leading-none">Rank {currentRank} Unit</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.classRoom || 'CENTRAL MATRIX'} DEPLOYMENT</p>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-end">
             <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Asset Calibration</span>
             <div className="flex items-baseline gap-1">
               <span className="font-mono text-3xl font-black text-eco-600 italic tracking-tighter">
                 {user?.totalSRT?.toLocaleString() || '0'}
               </span>
               <span className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">srt</span>
             </div>
          </div>
          
          <div className="h-5 w-full bg-slate-100 rounded-full border border-slate-200/50 overflow-hidden p-1 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-eco-400 via-eco-500 to-eco-600 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.3)] transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-3">
              <span className="text-eco-600 font-black">TIER {currentRank}</span>
              <div className="w-8 h-[1px] bg-slate-200" />
              <span>TIER {nextRank}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-900 italic font-black">{srtNeededForNext?.toLocaleString() || '0'} SRT</span>
              <span className="opacity-60">to evolution</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">Operational Merits</h4>
          <span className="text-[10px] font-black text-eco-600 bg-eco-100 px-4 py-1.5 rounded-full border border-eco-200 shadow-sm">{user?.badges?.length || 0} Secured</span>
        </div>
        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2 px-1">
          {user?.badges?.length === 0 ? (
            <div className="py-12 px-6 bg-white border-2 border-dashed border-slate-100 rounded-unit w-full text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <Sparkles size={24} />
              </div>
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.3em]">No merits authenticated in this cycle.</p>
            </div>
          ) : (
            (user?.badges || []).map(bId => (
              <div key={bId} className="shrink-0 w-28 h-28 bg-white border border-eco-100 rounded-inner flex flex-col items-center justify-center gap-3 shadow-eco hover:shadow-eco-strong hover:-translate-y-1 transition-all cursor-pointer group">
                <div className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">🌿</div>
                <span className="text-[9px] font-bold text-eco-700 uppercase tracking-widest text-center px-3 leading-tight">{bId.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {[
          { label: 'Logged Missions', value: user.history.length, icon: Activity, color: 'text-eco-500', bg: 'bg-eco-50' },
          { label: 'Delta Cycle', value: `+${user.currentMonthSRT}`, icon: Award, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Node Integrity', value: '100%', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Growth Vector', value: `V-${currentRank}`, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-7 rounded-unit space-y-4 shadow-eco border border-slate-50 hover:border-eco-100 hover:shadow-eco-strong transition-all duration-500 cursor-default group">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-inner flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
              <stat.icon size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="font-mono text-3xl font-black text-slate-900 leading-none tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full bg-white p-8 rounded-unit flex items-center justify-between group shadow-eco border border-eco-50 hover:bg-eco-50 hover:shadow-eco-strong transition-all duration-500">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-eco-100 rounded-inner flex items-center justify-center text-eco-600 shadow-inner group-hover:scale-105 transition-transform">
            <Shield size={26} strokeWidth={2} />
          </div>
          <div className="flex flex-col text-left space-y-1">
            <span className="text-base font-bold text-slate-900 uppercase tracking-tight font-display italic">Protocol Settings</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage unit keys and data authorization</span>
          </div>
        </div>
        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:text-eco-600 group-hover:bg-eco-100 transition-all">
          <ChevronRight size={24} />
        </div>
      </button>

      <div className="text-center pb-8 opacity-40">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">System Version 2.4.9-Eco</p>
      </div>
    </div>
  );
};

export default Profile;
