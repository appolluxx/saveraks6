import React, { useState, useRef } from 'react';
import { Bus, Sprout, Video, Zap, CheckCircle, Loader2, ArrowRight, Clock, AlertTriangle, Upload } from 'lucide-react';
import { logActivity } from '../services/api';
import { ActionType, User } from '../types';
import { useTranslation } from 'react-i18next';

interface ActionLoggerProps {
  user: User;
  onActivityLogged: () => void;
}

const ActionLogger: React.FC<ActionLoggerProps> = ({ user, onActivityLogged }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'TRANS' | 'ENERGY' | 'GREEN'>('TRANS');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [transportMode, setTransportMode] = useState('Walk');

  const transportModes = [
    { id: 'Walk', label: t('logger.walk'), points: 10, type: ActionType.WALK },
    { id: 'Bicycle', label: t('logger.bicycle'), points: 8, type: ActionType.BICYCLE },
    { id: 'Public', label: t('logger.public_transport'), points: 5, type: ActionType.PUBLIC_TRANSPORT },
  ];

  // Logic for Time Constraint (TRANS)
  const getCurrentStatus = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;

    const morningStart = 6 * 60; // 06:00
    const morningEnd = 9 * 60; // 09:00
    const afternoonStart = 14 * 60 + 50; // 14:50
    const afternoonEnd = 20 * 60 + 30; // 20:30

    let period: 'MORNING' | 'AFTERNOON' | 'CLOSED' = 'CLOSED';
    if (currentTime >= morningStart && currentTime <= morningEnd) period = 'MORNING';
    else if (currentTime >= afternoonStart && currentTime <= afternoonEnd) period = 'AFTERNOON';

    // Check history for existing logs today in the same period
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const logsToday = (user?.history || []).filter(h => {
      const logDate = new Date(h.timestamp);
      return logDate >= startOfToday && (
        h.type === ActionType.WALK ||
        h.type === ActionType.BICYCLE ||
        h.type === ActionType.PUBLIC_TRANSPORT
      );
    });

    const morningDone = logsToday.some(l => {
      const d = new Date(l.timestamp);
      const m = d.getHours() * 60 + d.getMinutes();
      return m >= morningStart && m <= morningEnd;
    });

    const afternoonDone = logsToday.some(l => {
      const d = new Date(l.timestamp);
      const m = d.getHours() * 60 + d.getMinutes();
      return m >= afternoonStart && m <= afternoonEnd;
    });

    const canLog = (period === 'MORNING' && !morningDone) || (period === 'AFTERNOON' && !afternoonDone);

    let reason = "";
    if (period === 'CLOSED') reason = t('logger.out_of_time');
    else if (period === 'MORNING' && morningDone) reason = t('logger.morning_done');
    else if (period === 'AFTERNOON' && afternoonDone) reason = t('logger.afternoon_done');

    return { canLog, period, reason };
  };

  const status = getCurrentStatus();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (activeTab === 'TRANS' && !status.canLog) {
      alert(status.reason);
      return;
    }

    setLoading(true);
    try {
      if (activeTab === 'TRANS') {
        const mode = transportModes.find(m => m.id === transportMode) || transportModes[0];
        await logActivity(mode.type, { label: `${t('logger.transport')}: ${mode.label}`, points: mode.points });
      }
      else if (activeTab === 'ENERGY' && file) {
        await logActivity(ActionType.ENERGY_SAVING, {
          category: 'energy',
          label: t('logger.energy_saving'),
          points: 5
        });
      }
      else if (activeTab === 'GREEN' && file) {
        await logActivity(ActionType.TREE_PLANTING, {
          category: 'green',
          label: t('logger.green_area'),
          points: 10
        });
      }
      onActivityLogged();
      setFile(null);
      alert(t('logger.success'));
    } catch (err) {
      alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-6 pt-6 pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1 mb-8">
        <span className="text-[11px] font-bold text-neon-green uppercase tracking-[0.4em] font-mono">{t('logger.resource_logging')}</span>
        <h2 className="text-3xl font-bold text-white font-display italic uppercase tracking-tighter leading-none">{t('logger.activity_hub')}</h2>
      </div>

      <div className="flex bg-zinc-900 p-1.5 rounded-inner shadow-lg border border-zinc-800">
        {[
          { id: 'TRANS', icon: Bus, label: t('logger.travel') },
          { id: 'GREEN', icon: Sprout, label: t('logger.planting') },
          { id: 'ENERGY', icon: Zap, label: t('logger.energy') }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setFile(null); }}
            className={`flex-1 py-3 rounded-inner text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 font-mono ${activeTab === tab.id ? 'bg-neon-green text-zinc-900 shadow-[0_0_15px_rgba(0,233,120,0.4)]' : 'text-zinc-500 hover:text-white'
              }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 p-8 rounded-unit shadow-lg border border-zinc-700 transition-all min-h-[350px] flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 brightness-100 contrast-150 grayscale mix-blend-overlay"></div>
        <div className="relative z-10">
          {activeTab === 'TRANS' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white italic uppercase font-display">{t('logger.eco_transit')}</h3>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${status.canLog ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                  {status.canLog ? <Clock size={12} className="animate-pulse" /> : <AlertTriangle size={12} />}
                  <span className="text-[9px] font-black uppercase tracking-wider font-mono">
                    {status.canLog ? `OPEN: ${status.period}` : 'LOCKED'}
                  </span>
                </div>
              </div>

              {!status.canLog && (
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-inner text-center space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed font-mono">
                    {status.reason}
                  </p>
                  <div className="flex justify-center gap-4 text-[9px] font-black text-zinc-600 uppercase tracking-tighter font-mono">
                    <span>M: 06:00 - 09:00</span>
                    <span>E: 14:50 - 20:30</span>
                  </div>
                </div>
              )}

              <div className={`grid grid-cols-1 gap-2 ${!status.canLog ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                {transportModes.map(mode => (
                  <button
                    key={mode.id}
                    disabled={!status.canLog}
                    onClick={() => setTransportMode(mode.id)}
                    className={`p-4 rounded-inner border transition-all flex justify-between items-center group relative overflow-hidden ${transportMode === mode.id ? 'border-neon-green bg-neon-green/10 text-neon-green shadow-[0_0_10px_rgba(0,233,120,0.2)]' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-white bg-zinc-950'
                      }`}
                  >
                    <span className="font-bold text-sm font-display uppercase tracking-wide">{mode.label}</span>
                    <span className="text-[10px] font-mono tracking-tighter uppercase relative z-10">+{mode.points} SRT</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !status.canLog}
                className={`w-full py-5 rounded-inner font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 ${status.canLog ? 'bg-neon-green text-zinc-900 hover:bg-green-400 shadow-[0_0_20px_rgba(0,233,120,0.4)]' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
              >
                {loading ? <Loader2 className="animate-spin" /> : <>{t('logger.log_activity')} <ArrowRight size={18} strokeWidth={3} /></>}
              </button>
            </div>
          )}

          {activeTab === 'GREEN' && (
            <div className="space-y-6 text-center animate-in fade-in py-6">
              <div className="bg-zinc-950 p-6 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-neon-green shadow-inner border border-zinc-800 mb-2">
                <Video size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white italic uppercase font-display">Green Impact Evidence</h3>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest font-mono">{t('logger.green_evidence')}</p>
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-zinc-700 bg-zinc-950/50 rounded-inner p-10 cursor-pointer hover:border-neon-green hover:bg-zinc-900 transition-all group relative">
                <Upload className="mx-auto h-8 w-8 text-zinc-600 group-hover:text-neon-green mb-2 transition-colors" />
                {file ? <span className="text-neon-green font-bold text-sm italic">{file.name}</span> : <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest group-hover:text-white transition-colors">{t('logger.select_file')}</span>}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="video/*,image/*" onChange={handleFileChange} />
              <button onClick={handleSubmit} disabled={!file || loading} className="w-full py-5 bg-neon-green text-zinc-900 rounded-inner font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(0,233,120,0.4)] active:scale-95 transition-all mt-4 hover:bg-green-400 font-display">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : t('logger.submit_evidence')} (+10 SRT)
              </button>
            </div>
          )}

          {activeTab === 'ENERGY' && (
            <div className="space-y-6 animate-in fade-in py-4 text-center">
              <div className="bg-zinc-950 p-6 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-neon-blue shadow-inner border border-zinc-800 mb-2">
                <Zap size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white italic uppercase font-display">Energy Conservation</h3>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest font-mono">{t('logger.energy_evidence')}</p>
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-zinc-700 bg-zinc-950/50 rounded-inner p-10 cursor-pointer text-center hover:border-neon-blue hover:bg-zinc-900 transition-all group">
                <Upload className="mx-auto h-8 w-8 text-zinc-600 group-hover:text-neon-blue mb-2 transition-colors" />
                {file ? <span className="text-neon-blue font-bold text-sm italic">{file.name}</span> : <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest group-hover:text-white transition-colors">{t('logger.select_file')}</span>}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <button onClick={handleSubmit} disabled={!file || loading} className="w-full py-5 bg-neon-blue text-white rounded-inner font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.4)] active:scale-95 transition-all mt-4 hover:bg-blue-400 font-display">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : t('logger.submit_evidence')} (+5 SRT)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionLogger;
