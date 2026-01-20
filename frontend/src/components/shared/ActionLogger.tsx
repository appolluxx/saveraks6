import React, { useState, useRef } from 'react';
import { Bus, Sprout, Video, Zap, Check, CloudUpload, ArrowRight, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { logActivity } from '../../services/api';
import { ActionType, User } from '../../types';
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
      console.error(err);
      alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 animate-in fade-in duration-700 bg-slate-50/50 rounded-[40px] mb-8">

      {/* Header */}
      <div className="flex flex-col gap-1 mb-6 px-2">
        <span className="text-xs font-bold text-green-600 uppercase tracking-[0.2em] font-mono flex items-center gap-2">
          <Zap size={12} className="fill-green-600" />
          {t('logger.resource_logging')}
        </span>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none font-sans">
          {t('logger.activity_hub')}
        </h2>
      </div>

      {/* Tabs: Segmented Control */}
      <div className="flex bg-slate-100 p-1.5 rounded-[20px] shadow-sm border border-slate-200">
        {[
          { id: 'TRANS', icon: Bus, label: t('logger.travel') },
          { id: 'GREEN', icon: Sprout, label: t('logger.planting') },
          { id: 'ENERGY', icon: Zap, label: t('logger.energy') }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setFile(null); }}
            className={`flex-1 py-3 rounded-[16px] text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ease-out active:scale-[0.98] ${activeTab === tab.id
                ? 'bg-white text-green-700 shadow-md shadow-slate-200 ring-1 ring-black/5'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
              }`}
          >
            <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="hidden sm:inline font-sans">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-green-500/5 border border-slate-100 min-h-[350px] transition-all relative overflow-hidden">

        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -z-10 opacity-60 translate-x-1/3 -translate-y-1/3"></div>

        {activeTab === 'TRANS' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 font-sans">{t('logger.eco_transit')}</h3>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${status.canLog
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                {status.canLog ? <Clock size={14} className="text-green-600" /> : <AlertTriangle size={14} />}
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
                  {status.canLog ? `${status.period} OPEN` : 'CLOSED'}
                </span>
              </div>
            </div>

            {!status.canLog && (
              <div className="bg-red-50/50 border border-red-100 p-4 rounded-[24px] text-center space-y-2">
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest leading-relaxed font-mono">
                  {status.reason}
                </p>
                <div className="flex justify-center gap-4 text-[10px] font-bold text-red-300 uppercase tracking-wider font-mono">
                  <span>Mrn: 06:00-09:00</span>
                  <span>Aft: 14:50-20:30</span>
                </div>
              </div>
            )}

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${!status.canLog ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              {transportModes.map(mode => (
                <button
                  key={mode.id}
                  disabled={!status.canLog}
                  onClick={() => setTransportMode(mode.id)}
                  className={`p-4 rounded-[24px] border-2 text-left transition-all duration-300 relative overflow-hidden group ${transportMode === mode.id
                      ? 'bg-green-50 border-green-500 text-green-800 shadow-lg shadow-green-500/10'
                      : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                >
                  {/* Checkmark for active state */}
                  {transportMode === mode.id && (
                    <div className="absolute top-3 right-3 text-green-600 bg-white rounded-full p-1 shadow-sm">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}

                  <span className="block font-bold text-sm mb-1">{mode.label}</span>
                  <span className={`text-xs font-mono font-medium ${transportMode === mode.id ? 'text-green-600' : 'text-slate-400'}`}>
                    +{mode.points} PTS
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !status.canLog}
              className={`w-full py-4 rounded-[24px] font-bold text-sm shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6 ${status.canLog
                  ? 'bg-green-500 text-white shadow-green-500/20 hover:bg-green-600'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
            >
              {loading ? <Loader2 className="animate-spin" /> : <>{t('logger.log_activity')} <ArrowRight size={18} /></>}
            </button>
          </div>
        )}

        {activeTab === 'GREEN' && (
          <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 py-4">
            <div className="bg-green-50 border border-green-100 p-5 rounded-[28px] w-20 h-20 mx-auto flex items-center justify-center text-green-600 shadow-sm mb-4">
              <Video size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 font-sans">Green Evidence</h3>
              <p className="text-slate-500 text-sm font-medium">{t('logger.green_evidence')}</p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-green-50 hover:border-green-400 rounded-[24px] p-8 cursor-pointer transition-all duration-300 ease-out"
            >
              <div className="flex flex-col items-center gap-3">
                <CloudUpload className="h-10 w-10 text-slate-400 group-hover:text-green-500 transition-colors" />
                {file ? (
                  <span className="text-green-600 font-bold text-sm bg-white px-3 py-1 rounded-full shadow-sm">
                    {file.name}
                  </span>
                ) : (
                  <div className="text-center">
                    <p className="text-slate-600 font-bold text-sm">Click to Upload</p>
                    <span className="text-slate-400 text-xs mt-1 block">MP4, JPG, PNG supported</span>
                  </div>
                )}
              </div>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" accept="video/*,image/*" onChange={handleFileChange} />

            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className={`w-full py-4 bg-green-500 text-white rounded-[24px] font-bold text-sm shadow-xl shadow-green-500/20 hover:bg-green-600 active:scale-[0.98] transition-all mt-4 flex justify-center items-center gap-2 ${(!file || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? <Loader2 className="animate-spin" /> : <>{t('logger.submit_evidence')} <span className="font-mono opacity-80">(+10 PTS)</span></>}
            </button>
          </div>
        )}

        {activeTab === 'ENERGY' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-4">
            <div className="bg-blue-50 border border-blue-100 p-5 rounded-[28px] w-20 h-20 mx-auto flex items-center justify-center text-blue-600 shadow-sm mb-4">
              <Zap size={32} fill="currentColor" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 font-sans">Energy Saver</h3>
              <p className="text-slate-500 text-sm font-medium">{t('logger.energy_evidence')}</p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-400 rounded-[24px] p-8 cursor-pointer transition-all duration-300 ease-out"
            >
              <div className="flex flex-col items-center gap-3">
                <CloudUpload className="h-10 w-10 text-slate-400 group-hover:text-blue-500 transition-colors" />
                {file ? (
                  <span className="text-blue-600 font-bold text-sm bg-white px-3 py-1 rounded-full shadow-sm">
                    {file.name}
                  </span>
                ) : (
                  <div className="text-center">
                    <p className="text-slate-600 font-bold text-sm">Upload Evidence</p>
                    <span className="text-slate-400 text-xs mt-1 block">Photos of turned off devices</span>
                  </div>
                )}
              </div>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className={`w-full py-4 bg-blue-600 text-white rounded-[24px] font-bold text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all mt-4 flex justify-center items-center gap-2 ${(!file || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? <Loader2 className="animate-spin" /> : <>{t('logger.submit_evidence')} <span className="font-mono opacity-80">(+5 PTS)</span></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionLogger;
