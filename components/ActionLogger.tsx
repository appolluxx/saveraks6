
import React, { useState, useRef } from 'react';
import { Bus, Sprout, Video, Zap, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { logActivity } from '../services/api';
import { ActionType } from '../types';

interface ActionLoggerProps {
  onActivityLogged: () => void;
}

const ActionLogger: React.FC<ActionLoggerProps> = ({ onActivityLogged }) => {
  const [activeTab, setActiveTab] = useState<'TRANS' | 'ENERGY' | 'GREEN'>('TRANS');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [transportMode, setTransportMode] = useState('Walk');

  const transportModes = [
    { id: 'Walk', label: 'เดิน', points: 10, type: ActionType.WALK },
    { id: 'Bicycle', label: 'ปั่นจักรยาน', points: 8, type: ActionType.BICYCLE },
    { id: 'Public', label: 'นั่งรถสาธารณะ', points: 5, type: ActionType.PUBLIC_TRANSPORT },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (activeTab === 'TRANS') {
        const mode = transportModes.find(m => m.id === transportMode) || transportModes[0];
        await logActivity(mode.type, { label: `การเดินทาง: ${mode.label}`, points: mode.points });
      }
      else if (activeTab === 'ENERGY' && file) {
        await logActivity(ActionType.ENERGY_SAVING, {
          category: 'energy',
          label: 'ประหยัดพลังงาน (ปิดไฟ/พัดลม/แอร์)',
          points: 5
        });
      }
      else if (activeTab === 'GREEN' && file) {
        await logActivity(ActionType.TREE_PLANTING, {
          category: 'green',
          label: 'ปลูกต้นไม้/เพิ่มพื้นที่สีเขียว',
          points: 10
        });
      }
      onActivityLogged();
      setFile(null);
      alert("บันทึกกิจกรรมสำเร็จ! ขอบคุณที่ช่วยรักษ์โลก");
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
          { id: 'TRANS', icon: Bus, label: 'เดินทาง' },
          { id: 'GREEN', icon: Sprout, label: 'ปลูกต้นไม้' },
          { id: 'ENERGY', icon: Zap, label: 'พลังงาน' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setFile(null); }}
            className={`flex-1 py-3 rounded-inner text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${activeTab === tab.id ? 'bg-white text-eco-600 shadow-sm' : 'text-slate-400 hover:text-eco-500'
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
            <div className="grid grid-cols-1 gap-2">
              {transportModes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setTransportMode(mode.id)}
                  className={`p-4 rounded-inner border-2 text-left transition-all flex justify-between items-center ${transportMode === mode.id ? 'border-eco-500 bg-eco-50 text-eco-700' : 'border-slate-50 text-slate-500 hover:border-slate-100'
                    }`}
                >
                  <span className="font-bold text-sm">{mode.label}</span>
                  <span className="text-[10px] font-mono tracking-tighter uppercase">+{mode.points} SRT</span>
                </button>
              ))}
            </div>
            <button onClick={handleSubmit} disabled={loading} className="w-full py-5 bg-eco-500 text-white rounded-inner font-bold uppercase text-xs tracking-widest shadow-eco active:scale-95 transition-all flex items-center justify-center gap-3 mt-4">
              {loading ? <Loader2 className="animate-spin" /> : <>บันทึกกิจกรรม <ArrowRight size={18} /></>}
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
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">แนบหลักฐานการปลูกต้นไม้ (รูปภาพ/วิดีโอ)</p>
            </div>
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-inner p-10 cursor-pointer hover:border-eco-400 transition-all group">
              {file ? <span className="text-eco-600 font-bold text-sm italic">{file.name}</span> : <span className="text-slate-300 font-bold uppercase text-[10px] tracking-widest group-hover:text-eco-400">เลือกรูปภาพ/วิดีโอ</span>}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="video/*,image/*" onChange={handleFileChange} />
            <button onClick={handleSubmit} disabled={!file || loading} className="w-full py-5 bg-eco-500 text-white rounded-inner font-bold uppercase text-xs tracking-widest shadow-eco active:scale-95 transition-all mt-4">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'ส่งหลักฐาน (+10 SRT)'}
            </button>
          </div>
        )}

        {activeTab === 'ENERGY' && (
          <div className="space-y-6 animate-in fade-in py-4 text-center">
            <div className="bg-blue-50 p-6 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-blue-600 shadow-sm mb-2">
              <Zap size={36} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 italic uppercase font-display">Energy Conservation</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">ถ่ายรูปเมื่อปิดไฟ พัดลม หรือแอร์</p>
            </div>
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-blue-100 bg-blue-50/30 rounded-inner p-10 cursor-pointer text-center hover:border-blue-400 transition-all group">
              {file ? <span className="text-blue-600 font-bold text-sm italic">{file.name}</span> : <span className="text-blue-200 font-bold uppercase text-[10px] tracking-widest group-hover:text-blue-400">เลือกรูปภาพหลักฐาน</span>}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <button onClick={handleSubmit} disabled={!file || loading} className="w-full py-5 bg-blue-500 text-white rounded-inner font-bold uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all mt-4">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'ส่งหลักฐาน (+5 SRT)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionLogger;
