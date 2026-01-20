
import React, { useState, useRef, useEffect } from 'react';
import { Camera, ShieldAlert, Trash2, Droplets, Receipt, CheckCircle, Leaf, Sparkles, Loader2, AlertTriangle, ShieldCheck, ArrowRight, X, RefreshCw, Scan } from 'lucide-react';
import { submitAction } from '../services/api';
import { ActionType, ScanResult } from '../types';
import { compressImage, calculateImageHash, generateThumbnail, ImageValidator } from '../utils/image';
import { analyzeEnvironmentImage, DetailedWasteResult } from '../services/geminiService';
import { imageStorage } from '../services/imageStorage';
import { useTranslation } from 'react-i18next';

interface VisionUnitProps {
  onComplete: () => void;
}

const WasteSortingGuide: React.FC<{
  capturedImage: string;
  analysis: DetailedWasteResult;
  onSubmit: () => void;
  onRetake: () => void;
  onCancel: () => void;
}> = ({ capturedImage, analysis, onSubmit, onRetake, onCancel }) => {
  const { t } = useTranslation();
  const binColors = {
    green: { bg: 'bg-green-500', text: 'text-green-200', borderColor: 'border-green-400', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.4)]', icon: '🟢' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-200', borderColor: 'border-blue-400', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]', icon: '🔵' },
    yellow: { bg: 'bg-yellow-500', text: 'text-yellow-200', borderColor: 'border-yellow-400', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.4)]', icon: '🟡' },
    red: { bg: 'bg-red-500', text: 'text-red-200', borderColor: 'border-red-400', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]', icon: '🔴' }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-xl z-[100] flex flex-col animate-in slide-in-from-bottom-10 duration-500">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display italic uppercase text-white tracking-widest">{t('vision.identified')}</h1>
          <p className="text-[10px] text-neon-green font-mono uppercase tracking-[0.2em]">AI VALIDATED</p>
        </div>
        <button onClick={onCancel} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Preview Image */}
      <div className="relative h-64 bg-black border-b border-zinc-800 group overflow-hidden">
        <img src={capturedImage} alt="Captured waste" className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
        <button onClick={onRetake} className="absolute bottom-4 right-4 bg-zinc-900/80 backdrop-blur-md text-white border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 hover:bg-zinc-800 transition-all font-bold text-[10px] uppercase tracking-widest shadow-lg">
          <RefreshCw className="w-3 h-3 text-neon-green" /> {t('vision.reset')}
        </button>
      </div>

      {/* Analysis Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-40 no-scrollbar">
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-inner p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 p-full bg-neon-green/50"></div>
            <h3 className="font-bold text-zinc-300 mb-2 uppercase text-xs tracking-widest font-mono">Analysis Summary</h3>
            <p className="text-zinc-100 text-sm font-medium italic mb-1 leading-relaxed">{analysis.summary}</p>
            <p className="text-neon-green text-[10px] font-bold uppercase tracking-widest font-mono mt-2">{analysis.summaryThai}</p>
          </div>

          {/* Items List */}
          <h3 className="text-lg font-bold text-white uppercase italic font-display flex items-center gap-2">
            <Scan size={18} className="text-neon-blue" /> Detected Object
          </h3>

          <div className="space-y-4">
            {analysis.items?.map((item, index) => {
              const colors = binColors[item.bin] || binColors.yellow;
              return (
                <div key={index} className={`bg-zinc-900 border ${colors.borderColor} rounded-inner p-6 shadow-lg relative overflow-hidden group`}>
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-${colors.bg}/20 to-transparent rounded-bl-full pointer-events-none`}></div>

                  <div className="flex items-start gap-4 mb-4 relative z-10">
                    <div className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{colors.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white italic uppercase tracking-tight font-display">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${colors.text} bg-white/5 px-2 py-0.5 rounded`}>
                          {item.binNameThai}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">
                          CONF: {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {item.instructions && (
                    <div className="bg-black/30 rounded-xl p-4 border border-white/5 relative z-10">
                      <p className="text-[11px] font-bold text-zinc-300 mb-1 leading-tight">
                        {item.instructions}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-medium italic mt-1">
                        {item.instructionsThai}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-800 p-6 z-[110]">
        <div className="max-w-2xl mx-auto space-y-3">
          <button
            onClick={onSubmit}
            className="w-full bg-neon-green text-zinc-900 font-black py-5 rounded-inner hover:bg-green-400 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,233,120,0.4)] flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em] font-display"
          >
            <span>{t('vision.confirm')}</span>
            <ArrowRight className="w-5 h-5" strokeWidth={3} />
          </button>
          <button
            onClick={onRetake}
            className="w-full bg-transparent text-zinc-500 font-bold py-3 rounded-inner hover:text-white transition-all text-[10px] uppercase tracking-[0.3em]"
          >
            {t('vision.reset')}
          </button>
        </div>
      </div>
    </div>
  );
};

const VisionUnit: React.FC<VisionUnitProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ActionType>(ActionType.RECYCLE);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetailedWasteResult | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const modes = [
    { id: ActionType.RECYCLE, icon: Trash2, label: 'WSTE', color: 'text-neon-green' },
    { id: ActionType.GREASE_TRAP, icon: Droplets, label: 'TRAP', color: 'text-neon-blue' },
    { id: ActionType.HAZARD_SCAN, icon: ShieldAlert, label: 'RISK', color: 'text-red-500' },
    { id: ActionType.UTILITY, icon: Receipt, label: 'NRGY', color: 'text-amber-500' },
  ] as const;

  useEffect(() => {
    imageStorage.init();
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      setError('SENSOR LINK DENIED. PLEASE RE-ENABLE CAMERA.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setProcessing(true);
    setError(null);
    setProcessingStep(t('vision.analyzing'));

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failure');

      ctx.drawImage(video, 0, 0);
      const rawBase64 = canvas.toDataURL('image/jpeg', 0.9);

      const [compressed, thumbnail, hash] = await Promise.all([
        compressImage(rawBase64, 1.0),
        generateThumbnail(rawBase64),
        calculateImageHash(rawBase64)
      ]);

      setPreview(compressed);
      stopCamera();

      const aiResponse = await analyzeEnvironmentImage(compressed, mode);
      setResult(aiResponse);

      if (mode === ActionType.RECYCLE && !aiResponse.isFraud) {
        setShowGuide(true);
        setProcessing(false);
      } else {
        await submitAction({
          type: mode,
          imageBase64: compressed,
          description: aiResponse.isFraud ? 'Fraud detected' : `Verified ${aiResponse.label}`,
          imageHash: hash,
          isFraud: aiResponse.isFraud,
          fraudScore: aiResponse.confidence,
          rejectReason: aiResponse.reason
        });
        setProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'System error during analysis.');
      setProcessing(false);
      startCamera();
    }
  };

  const confirmAndSubmit = async () => {
    if (!preview || !result) return;
    setProcessing(true);
    try {
      const hash = await calculateImageHash(preview);
      await submitAction({
        type: mode,
        imageBase64: preview,
        description: `Sorted ${result.items?.length || 1} items correctly: ${result.label}`,
        imageHash: hash,
        isFraud: false,
        fraudScore: result.confidence
      });
      setShowGuide(false);
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getBinStyles = (color?: string) => {
    switch (color) {
      case 'GREEN': return { bg: 'bg-green-500', border: 'border-green-800', text: 'text-green-500' };
      case 'YELLOW': return { bg: 'bg-yellow-500', border: 'border-yellow-800', text: 'text-yellow-500' };
      case 'BLUE': return { bg: 'bg-blue-500', border: 'border-blue-800', text: 'text-blue-500' };
      case 'RED': return { bg: 'bg-red-500', border: 'border-red-800', text: 'text-red-500' };
      default: return { bg: 'bg-zinc-700', border: 'border-zinc-600', text: 'text-zinc-400' };
    }
  };

  return (
    <div className="space-y-6 pb-24 px-6 pt-6 animate-in fade-in duration-700">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-3xl font-bold tracking-tight text-white font-display uppercase italic">{t('vision.title')}</h2>
        <p className="text-neon-green font-mono text-[10px] tracking-[0.3em] uppercase font-bold">Bio-Metric Analysis HUD</p>
      </div>

      <div className="grid grid-cols-4 gap-3 bg-zinc-900 p-2 rounded-inner shadow-lg border border-zinc-800">
        {modes.map(m => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { setMode(m.id as ActionType); setPreview(null); setError(null); setResult(null); }}
              className={`flex flex-col items-center gap-2 py-4 rounded-inner transition-all relative group ${isActive ? 'text-neon-green' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-neon-green/10 rounded-inner shadow-[inset_0_0_10px_rgba(0,233,120,0.2)] animate-in zoom-in duration-300 border border-neon-green/30"></div>
              )}
              <Icon size={22} className={`relative z-10 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,233,120,0.5)]' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] relative z-10 font-mono">{m.label}</span>
            </button>
          );
        })}
      </div>

      <div className="relative aspect-[9/13] rounded-unit overflow-hidden border-2 border-zinc-800 shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] bg-black group">
        {/* Scanner HUD Overlay */}
        <div className="absolute inset-0 z-20 pointer-events-none opacity-50">
          <div className="absolute top-6 left-6 w-16 h-16 border-l-2 border-t-2 border-neon-green/50 rounded-tl-xl"></div>
          <div className="absolute top-6 right-6 w-16 h-16 border-r-2 border-t-2 border-neon-green/50 rounded-tr-xl"></div>
          <div className="absolute bottom-6 left-6 w-16 h-16 border-l-2 border-b-2 border-neon-green/50 rounded-bl-xl"></div>
          <div className="absolute bottom-6 right-6 w-16 h-16 border-r-2 border-b-2 border-neon-green/50 rounded-br-xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/10 rounded-full"></div>

          {/* Scanning Line */}
          {!processing && !preview && (
            <div className="absolute top-0 left-0 w-full h-1 bg-neon-green/40 shadow-[0_0_20px_#00E978] animate-scan z-30"></div>
          )}
        </div>

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center gap-6 bg-zinc-950 z-50">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 animate-pulse border border-red-500/30">
              <ShieldAlert size={48} />
            </div>
            <p className="font-mono text-xs text-red-400 uppercase tracking-widest leading-relaxed font-bold">{error}</p>
            <button onClick={() => { setError(null); setPreview(null); setResult(null); setProcessing(false); startCamera(); }} className="px-8 py-4 bg-white/5 rounded-inner text-[10px] font-bold uppercase text-white hover:bg-white/10 border border-white/10 transition-all tracking-widest">Retry Sensor</button>
          </div>
        ) : (
          <>
            <canvas ref={canvasRef} className="hidden" />
            <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover opacity-80 ${processing ? 'blur-sm brightness-125' : ''}`} />

            {processing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-8 z-[110] p-10">
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-neon-green/20 rounded-full border-t-neon-green animate-spin shadow-[0_0_30px_rgba(0,233,120,0.2)]" />
                  <div className="absolute inset-0 m-auto flex items-center justify-center text-neon-green">
                    <Leaf size={40} className="animate-pulse" />
                  </div>
                </div>
                <p className="font-mono text-[11px] text-neon-green tracking-[0.4em] font-bold uppercase text-center animate-pulse">{processingStep}</p>
              </div>
            )}

            {preview && result && !processing && !showGuide && (
              <div className="absolute inset-0 bg-zinc-950 flex flex-col p-8 animate-in zoom-in duration-700 z-40 overflow-y-auto no-scrollbar">
                {/* Result screen logic mirroring the guide above... */}
                <div className="space-y-4 text-center mt-20">
                  <CheckCircle size={64} className="text-neon-green mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white uppercase italic">{t('vision.identified')}</h3>
                  <p className="text-zinc-400 text-sm">{result.label}</p>

                  <div className="pt-8">
                    <button onClick={onComplete} className="w-full py-5 bg-neon-green text-zinc-900 rounded-inner font-black uppercase text-xs tracking-[0.2em] shadow-neon hover:scale-[1.02] transition-transform">
                      {t('vision.confirm')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showGuide && preview && result && (
              <WasteSortingGuide
                capturedImage={preview}
                analysis={result}
                onSubmit={confirmAndSubmit}
                onRetake={() => { setShowGuide(false); setPreview(null); setResult(null); startCamera(); }}
                onCancel={() => { setShowGuide(false); setPreview(null); setResult(null); startCamera(); }}
              />
            )}

            {!preview && !processing && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full px-10 z-50">
                <button
                  onClick={capture}
                  className="w-full py-6 bg-black/40 backdrop-blur-xl border border-white/20 rounded-unit flex items-center justify-between px-6 gap-4 group hover:bg-neon-green hover:border-neon-green transition-all shadow-2xl active:scale-95"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-zinc-900 shadow-lg group-hover:scale-110 transition-transform">
                    <Camera size={24} />
                  </div>
                  <span className="flex-1 text-left text-[11px] font-bold text-white group-hover:text-zinc-900 uppercase tracking-[0.3em] font-mono">{t('vision.engage')}</span>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VisionUnit;
