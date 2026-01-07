
import React, { useState, useRef } from 'react';
import { Bus, Sprout, Video, Zap, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { analyzeUtilityBill, fileToBase64 } from '../services/geminiService';
// Fix: compressImage moved to utils/image to resolve module export error
import { logActivity } from '../services/api';
import { compressImage } from '../utils/image';
import { ActionType } from '../types';

interface ActionLoggerProps {
  onActivityLogged: () => void;
}

const ActionLogger: React.FC<ActionLoggerProps> = ({ onActivityLogged }) => {
  const [activeTab, setActiveTab] = useState<'TRANS' | 'ENERGY' | 'GREEN'>('TRANS');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [transportMode, setTransportMode] = useState('Bus');
  const [billData, setBillData] = useState<{ units: number; points: number; month: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setBillData(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (activeTab === 'TRANS') {
        await logActivity(ActionType.COMMUTE, { label: `Eco-Travel: ${transportMode}`, points: 15 });
      } 
      else if (activeTab === 'ENERGY' && file) {
        const rawBase64 = await fileToBase64(file);
        const analysis = await analyzeUtilityBill(rawBase64);
        setBillData(analysis);
        await logActivity(ActionType.UTILITY, { 
            category: 'energy',
            label: `Utility Log - ${analysis.month}`, 
            points: 100,
            fileBase64: await compressImage(rawBase64),
            aiData: analysis 
        });
      } 
      else if (activeTab === 'GREEN' && file) {
        const rawBase64 = await fileToBase64(file);
        await logActivity(ActionType.GREEN_POINT, { 
            category: 'green',
            label: 'Green Impact Log', 
            points: 50,
            fileBase64: rawBase64
        });
      }
      onActivityLogged();
      if (activeTab !== 'ENERGY') {
        setFile(null);
        alert("Action Logged Successfully.");
      }
    } catch (err) {
      alert('Transmission Error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-6 pt-6 pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1 mb-8">
        <span className="text-[11px] font-bold text-eco-600 uppercase tracking-[0.4em]">Resource Logging</span>
        <h2 className="text-3xl font-bold text-slate-900 font-display italic uppercase tracking-tighter leading-none">Activity Hub</h2>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-inner shadow-sm">
        {[
          { id: 'TRANS', icon: Bus, label: 'Travel' },
          { id: 'GREEN', icon: Sprout, label: 'Green' },
          { id: 'ENERGY', icon: Zap, label: 'Energy' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setFile(null); setBillData(null); }}
            className={`flex-1 py-3 rounded-inner text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
              activeTab === tab.id ? 'bg-white text-eco-600 shadow-sm' : 'text-slate-400 hover:text-eco-500'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-unit shadow-eco border border-eco-50 transition-all min-h-[350px] flex flex-col justify-center">
        {activeTab === 'TRANS' && (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-xl font-bold text-slate-900 italic uppercase font-display">Log Eco-Transit</h3>
            <div className="grid grid-cols-2 gap-2">
              {['Bus', 'BTS/MRT', 'Walk', 'Bicycle', 'Carpool'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setTransportMode(mode)}
                  className={`p-4 rounded-inner border-2 text-left transition-all ${
                    transportMode === mode ? 'border-eco-500 bg-eco-50 text-eco-700' : 'border-slate-50 text-slate-500 hover:border-slate-100'
                  }`}
                >
                  <span className="block font-bold text-sm">{mode}</span>
                  <span className="text-[10px] opacity-60 font-mono tracking-tighter uppercase">+15 SRT</span>
                </button>
              ))}
            </div>
            <button onClick={handleSubmit} disabled={loading} className="w-full py-5 bg-eco-500 text-white rounded-inner font-bold uppercase text-xs tracking-widest shadow-eco active:scale-95 transition-all flex items-center justify-center gap-3 mt-4">
              {loading ? <Loader2 className="animate-spin" /> : <>Log Mission <ArrowRight size={18} /></>}
            </button>
          </div>
        )}

        {activeTab === 'GREEN' && (
          <div className="space-y-6 text-center animate-in fade-in py-6">
             <div className="bg-eco-50 p-6 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-eco-600 shadow-sm mb-2">
                <Video size={36} />
             </div>
             <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 italic uppercase font-display">Green Impact Evidence</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Upload proof of environmental merit</p>
             </div>
             <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-inner p-10 cursor-pointer hover:border-eco-400 transition-all group">
                {file ? <span className="text-eco-600 font-bold text-sm italic">{file.name}</span> : <span className="text-slate-300 font-bold uppercase text-[10px] tracking-widest group-hover:text-eco-400">Select Media Link</span>}
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept="video/*,image/*" onChange={handleFileChange} />
             <button onClick={handleSubmit} disabled={!file || loading} className="w-full py-5 bg-eco-500 text-white rounded-inner font-bold uppercase text-xs tracking-widest shadow-eco active:scale-95 transition-all mt-4">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Authorize Evidence (+50 SRT)'}
            </button>
          </div>
        )}

        {activeTab === 'ENERGY' && (
          <div className="space-y-6 animate-in fade-in py-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-inner flex items-center justify-center shadow-sm">
                  <Zap size={24} />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xl font-bold text-slate-900 italic uppercase font-display">Utility Tracker</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Verify electricity conservation</p>
                </div>
             </div>
             {!billData ? (
                 <>
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-blue-100 bg-blue-50/30 rounded-inner p-10 cursor-pointer text-center hover:border-blue-400 transition-all group">
                        {file ? <span className="text-blue-600 font-bold text-sm italic">{file.name}</span> : <span className="text-blue-200 font-bold uppercase text-[10px] tracking-widest group-hover:text-blue-400">Upload Receipt Insight</span>}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <button onClick={handleSubmit} disabled={!file || loading} className="w-full py-5 bg-blue-500 text-white rounded-inner font-bold uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all mt-4">
                         {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Process Matrix Analysis'}
                    </button>
                 </>
             ) : (
                 <div className="bg-eco-50 border border-eco-200 rounded-inner p-10 text-center animate-in zoom-in shadow-inner relative overflow-hidden">
                     <CheckCircle size={100} className="absolute -right-6 -bottom-6 text-eco-500 opacity-10 rotate-12" />
                     <h4 className="font-bold text-eco-700 text-2xl mb-6 italic uppercase font-display leading-tight tracking-tight">AI VERIFIED</h4>
                     <div className="space-y-2 mb-8 relative z-10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cycle: <span className="text-slate-900">{billData.month}</span></p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conservation: <span className="text-slate-900 font-mono">{billData.units} kWh</span></p>
                     </div>
                     <div className="bg-white py-4 rounded-inner shadow-sm relative z-10">
                         <span className="text-lg font-black text-eco-600 font-mono tracking-tighter">+100 SRT ALLOCATED</span>
                     </div>
                     <button onClick={() => { setBillData(null); setFile(null); }} className="mt-8 text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] hover:text-eco-500 transition-colors">Log New Cycle</button>
                 </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionLogger;
