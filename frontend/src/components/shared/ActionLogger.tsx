import React, { useState, useRef } from 'react';
import { Bus, Sprout, Video, Zap, Upload, Loader2, Clock } from 'lucide-react';
import { logActivity } from '../../services/api';
import { ActionType, User } from '../../types';
import { useTranslation } from 'react-i18next';
import VisionUnit from '../../pages/VisionUnit';

// Added for camera capture
const getMediaStream = async () => {
  return await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
};

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

  // Camera related state & refs
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await getMediaStream();
      mediaStreamRef.current = stream;
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Unable to access camera');
    }
  };

  const capturePhoto = () => {
    if (!cameraRef.current || !canvasRef.current) return;
    const video = cameraRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
          setFile(capturedFile);
          stopCamera();
        }
      }, 'image/jpeg');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  // Transport mode state
  const [transportMode, setTransportMode] = useState('walk');

  const transportModes = [
    { id: 'walk', label: 'Walk', points: 10, type: ActionType.WALK, icon: <Video size={16} />, desc: 'Walking to school' },
    { id: 'bicycle', label: 'Bicycle', points: 10, type: ActionType.BICYCLE, icon: <Video size={16} />, desc: 'Cycling to school' },
    { id: 'bus', label: 'Bus', points: 15, type: ActionType.PUBLIC_TRANSPORT, icon: <Bus size={16} />, desc: 'Taking public transport' },
  ];

  // Time-based status
  const getStatus = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // Allowed: 00:00-08:30 and 15:30-18:00
    const morningEnd = 8 * 60 + 30; // 08:30
    const eveningStart = 15 * 60 + 30; // 15:30
    const eveningEnd = 18 * 60; // 18:00

    if (timeInMinutes <= morningEnd || (timeInMinutes >= eveningStart && timeInMinutes <= eveningEnd)) {
      return { canLog: true, reason: '' };
    }

    return { canLog: false, reason: 'Logging only allowed during morning (until 8:30 AM) and evening (3:30-6:00 PM)' };
  };

  const status = getStatus();

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
        onActivityLogged();
        alert(t('logger.success'));
      }
      else if (activeTab === 'ENERGY' && file) {
        // AI Verification for Energy
        const base64 = await convertToBase64(file);
        const analysis = await import('../../services/api').then(m => m.analyzeImage(base64));

        // Simple keywords check based on analysis summary or label
        const keywords = ['switch', 'light', 'lamp', 'plug', 'off', 'dark', 'electronic', 'appliance', 'air conditioner', 'fan'];
        const text = (analysis.summary + ' ' + analysis.label + ' ' + (analysis.items?.[0]?.name || '')).toLowerCase();

        const isEnergyRelated = keywords.some(k => text.includes(k));

        if (!isEnergyRelated && !analysis.isValid) { // Allow if marked valid by AI logic directly
          if (!window.confirm("AI ไม่มั่นใจว่าเป็นรูปเกี่ยวกับการประหยัดพลังงาน (เช่น ปิดไฟ, ถอดปลั๊ก) ต้องการส่งต่อหรือไม่?")) {
            setLoading(false);
            return;
          }
        }

        await logActivity(ActionType.ENERGY_SAVING, {
          category: 'energy',
          label: t('logger.energy_saving'),
          points: 5,
          fileBase64: base64
        });
        onActivityLogged();
        setFile(null);
        alert(`${t('logger.success')} (+5 PTS)`);
      }
      else if (activeTab === 'GREEN' && file) {
        // AI Verification for Green
        const base64 = await convertToBase64(file);
        const analysis = await import('../../services/api').then(m => m.analyzeImage(base64));

        const keywords = ['tree', 'plant', 'flower', 'garden', 'nature', 'leaf', 'grass', 'soil', 'planting', 'pot'];
        const text = (analysis.summary + ' ' + analysis.label + ' ' + (analysis.items?.[0]?.name || '')).toLowerCase();

        const isGreenRelated = keywords.some(k => text.includes(k));

        if (!isGreenRelated && !analysis.isValid) {
          if (!window.confirm("AI ไม่มั่นใจว่าเป็นรูปเกี่ยวกับการปลูกต้นไม้หรือพื้นที่สีเขียว ต้องการส่งต่อหรือไม่?")) {
            setLoading(false);
            return;
          }
        }

        await logActivity(ActionType.TREE_PLANTING, {
          category: 'green',
          label: t('logger.green_action'),
          points: 10,
          fileBase64: base64
        });
        onActivityLogged();
        setFile(null);
        alert(`${t('logger.success')} (+10 PTS)`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit activity');
    } finally {
      setLoading(false);
    }
  };

  // Vision Overlay State
  const [visionMode, setVisionMode] = useState<'ENERGY' | 'GREEN' | null>(null);

  const startVision = (mode: 'ENERGY' | 'GREEN') => {
    setVisionMode(mode);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-[32px] shadow-xl">
      {/* Vision Unit Overlay - Renders when visionMode is active */}
      {visionMode && (
        <div className="fixed inset-0 z-[100]">
          <VisionUnit
            mode={visionMode}
            onBack={() => setVisionMode(null)}
            onComplete={() => {
              setVisionMode(null);
              onActivityLogged();
            }}
          />
        </div>
      )}

      <div className="flex justify-around mb-6 bg-slate-100 rounded-[24px] p-1">
        <button
          onClick={() => setActiveTab('TRANS')}
          className={`flex-1 py-3 px-4 rounded-[20px] font-bold text-xs transition-all ${activeTab === 'TRANS' ? 'bg-white text-green-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Bus className="w-5 h-5 mx-auto mb-1" />
          {t('logger.transport')}
        </button>
        <button
          onClick={() => setActiveTab('ENERGY')}
          className={`flex-1 py-3 px-4 rounded-[20px] font-bold text-xs transition-all ${activeTab === 'ENERGY' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Zap className="w-5 h-5 mx-auto mb-1" />
          {t('logger.energy')}
        </button>
        <button
          onClick={() => setActiveTab('GREEN')}
          className={`flex-1 py-3 px-4 rounded-[20px] font-bold text-xs transition-all ${activeTab === 'GREEN' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Sprout className="w-5 h-5 mx-auto mb-1" />
          {t('logger.green')}
        </button>
      </div>

      {activeTab === 'TRANS' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-green-50 border border-green-100 p-5 rounded-[28px] w-20 h-20 mx-auto flex items-center justify-center text-green-600 shadow-sm mb-4">
            <Bus size={32} fill="currentColor" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800 font-sans">{t('logger.transport_title')}</h3>
            <p className="text-slate-500 text-sm font-medium">{t('logger.transport_desc')}</p>
          </div>

          <div className="space-y-3">
            {transportModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setTransportMode(mode.id)}
                className={`w-full p-4 rounded-[20px] border-2 transition-all flex items-center justify-between group ${transportMode === mode.id
                  ? 'border-green-400 bg-green-50'
                  : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transportMode === mode.id ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-green-100 group-hover:text-green-600'
                    }`}>
                    {mode.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">{mode.label}</div>
                    <div className="text-xs text-slate-500">{mode.desc}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">+{mode.points}</div>
                  <div className="text-xs text-slate-500">{t('logger.points')}</div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!status.canLog || loading}
            className={`w-full py-4 bg-green-500 text-white rounded-[24px] font-bold text-sm shadow-xl shadow-green-500/20 hover:bg-green-600 active:scale-[0.98] transition-all flex justify-center items-center gap-2 ${(!status.canLog || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <>{t('logger.log_transport')} <span className="font-mono opacity-80">(+{transportModes.find(m => m.id === transportMode)?.points || 10} PTS)</span></>}
          </button>

          {!status.canLog && (
            <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-3 flex items-start gap-2">
              <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-amber-800">{t('logger.cooldown_active')}</div>
                <div className="text-xs text-amber-700">{status.reason}</div>
              </div>
            </div>
          )}
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

          <button
            onClick={() => startVision('ENERGY')}
            className="w-full group border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-400 rounded-[24px] p-8 cursor-pointer transition-all duration-300 ease-out flex flex-col items-center gap-4 py-12"
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Video className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-slate-700 font-bold text-lg">OPEN AI CAMERA</p>
              <span className="text-slate-400 text-xs mt-1 block">Scan turning off lights, unplugging devices</span>
            </div>
          </button>
        </div>
      )}

      {activeTab === 'GREEN' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-4">
          <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-[28px] w-20 h-20 mx-auto flex items-center justify-center text-emerald-600 shadow-sm mb-4">
            <Sprout size={32} fill="currentColor" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800 font-sans">Green Actions</h3>
            <p className="text-slate-500 text-sm font-medium">{t('logger.green_evidence')}</p>
          </div>

          <button
            onClick={() => startVision('GREEN')}
            className="w-full group border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-400 rounded-[24px] p-8 cursor-pointer transition-all duration-300 ease-out flex flex-col items-center gap-4 py-12"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Video className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <p className="text-slate-700 font-bold text-lg">OPEN AI CAMERA</p>
              <span className="text-slate-400 text-xs mt-1 block">Scan plants, trees, or nature activities</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionLogger;