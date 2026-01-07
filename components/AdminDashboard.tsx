
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Users, AlertCircle, Terminal, Cpu, Zap, Loader2, Send, Database, BarChart3 } from 'lucide-react';
import { getSchoolStats, getLeaderboard, testLinePush } from '../services/api';
import { SchoolStats, User } from '../types';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingLine, setTestingLine] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const s = await getSchoolStats();
      setStats(s);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleTestPush = async () => {
    setTestingLine(true);
    await testLinePush();
    setTestingLine(false);
    alert("LINE Node Notification Dispatched.");
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-64 gap-4">
        <Loader2 className="animate-spin text-eco-500" size={32} />
        <span className="text-[10px] font-bold text-eco-600 uppercase tracking-widest">Accessing Root Interface...</span>
    </div>
  );

  return (
    <div className="space-y-8 px-6 pt-6 pb-24 animate-in fade-in duration-700">
      <div className="bg-slate-900 p-10 rounded-unit relative overflow-hidden shadow-2xl">
        <ShieldCheck className="absolute -right-6 -bottom-6 w-48 h-48 text-eco-500 opacity-10 rotate-12" />
        <div className="relative z-10 space-y-2">
          <span className="text-[11px] font-bold text-eco-500 uppercase tracking-[0.5em]">Root Matrix Level 0</span>
          <h2 className="text-4xl font-bold text-white italic tracking-tighter uppercase leading-none font-display">System Core</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-10">
            <div className="bg-white/5 backdrop-blur-md p-5 rounded-inner border border-white/10 flex flex-col items-center gap-2">
                <Users className="text-eco-400" size={24} />
                <div className="text-3xl font-black text-white font-mono tracking-tighter">{stats?.totalStudents || 0}</div>
                <span className="text-[9px] text-eco-200 uppercase font-bold tracking-widest">Active Units</span>
            </div>
            <div className="bg-white/5 backdrop-blur-md p-5 rounded-inner border border-white/10 flex flex-col items-center gap-2">
                <AlertCircle className="text-red-400" size={24} />
                <div className="text-3xl font-black text-white font-mono tracking-tighter">{stats?.pendingReports || 0}</div>
                <span className="text-[9px] text-red-200 uppercase font-bold tracking-widest">Alert Nodes</span>
            </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-unit space-y-6 shadow-eco border border-eco-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Terminal className="text-eco-600" size={20} />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">Messaging Gateway</h4>
          </div>
          <div className="w-2 h-2 rounded-full bg-eco-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
        </div>
        
        <div className="bg-slate-50 p-5 rounded-inner border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-white border border-eco-100 rounded-inner flex items-center justify-center text-eco-600 shadow-sm">
            <Send size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 uppercase tracking-tight italic">LINE API Webhook</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">v2/bot/message/push</span>
          </div>
        </div>

        <button 
          onClick={handleTestPush}
          disabled={testingLine}
          className="w-full py-5 bg-eco-500 text-white rounded-inner font-bold uppercase text-xs tracking-widest shadow-eco hover:bg-eco-600 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          {testingLine ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Dispatch Global Alert</>}
        </button>
      </div>

      <div className="bg-eco-500 p-10 rounded-unit flex items-center justify-between text-white group shadow-eco relative overflow-hidden">
        <BarChart3 className="absolute -left-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
        <div className="flex flex-col gap-1 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-eco-100">Cumulative Impact</span>
            <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none font-mono">{(stats?.totalPoints || 0).toLocaleString()} <span className="text-xs font-bold opacity-60">SRT</span></h3>
        </div>
        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:rotate-180 transition-transform duration-1000 relative z-10 border border-white/20">
            <Cpu size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button className="w-full py-6 bg-white border border-slate-100 rounded-unit text-slate-600 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 group hover:bg-eco-50 hover:text-eco-700 transition-all">
          <Database size={20} className="text-eco-500 group-hover:scale-110 transition-transform" /> Sync System Analytics
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
