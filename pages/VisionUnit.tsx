
import React, { useState, useRef, useEffect } from 'react';
import { Camera, ShieldAlert, Trash2, Droplets, Receipt, CheckCircle, Leaf, Sparkles, Loader2, AlertTriangle, ShieldCheck, ArrowRight, X, RefreshCw } from 'lucide-react';
import { submitAction } from '../services/api';
import { ActionType, ScanResult } from '../types';
import { compressImage, calculateImageHash, generateThumbnail, ImageValidator } from '../utils/image';
import { analyzeEnvironmentImage, DetailedWasteResult } from '../services/geminiService';
import { imageStorage } from '../services/imageStorage';

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
  const binColors = {
    green: { bg: 'bg-eco-500', text: 'text-eco-700', lightBg: 'bg-eco-50', border: 'border-eco-200', icon: '🟢' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-700', lightBg: 'bg-blue-50', border: 'border-blue-200', icon: '🔵' },
    yellow: { bg: 'bg-amber-400', text: 'text-amber-700', lightBg: 'bg-amber-50', border: 'border-amber-200', icon: '🟡' },
    red: { bg: 'bg-red-500', text: 'text-red-700', lightBg: 'bg-red-50', border: 'border-red-200', icon: '🔴' }
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom-10 duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-eco-500 to-eco-600 text-white p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold font-display italic uppercase">Sorting Guide</h1>
          <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-eco-50 font-bold uppercase tracking-widest text-[10px]">AI identified items in your photo</p>
      </div>

      {/* Preview Image */}
      <div className="relative h-48 bg-slate-900">
        <img src={capturedImage} alt="Captured waste" className="w-full h-full object-contain" />
        <button onClick={onRetake} className="absolute bottom-4 right-4 bg-white text-slate-900 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-gray-100 transition-colors font-bold text-[10px] uppercase tracking-widest">
          <RefreshCw className="w-4 h-4" /> Retake
        </button>
      </div>

      {/* Analysis Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-40 no-scrollbar">
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-eco-50 border border-eco-200 rounded-inner p-6">
            <h3 className="font-bold text-slate-900 mb-2 uppercase text-xs tracking-widest">Summary</h3>
            <p className="text-slate-700 text-sm font-medium italic mb-1">{analysis.summary}</p>
            <p className="text-eco-600 text-[10px] font-bold uppercase tracking-widest">{analysis.summaryThai}</p>
          </div>

          {/* Items List */}
          <h3 className="text-lg font-bold text-slate-900 uppercase italic font-display">
            Detected Items ({analysis.items?.length || 0})
          </h3>

          <div className="space-y-4">
            {analysis.items?.map((item, index) => {
              const colors = binColors[item.bin] || binColors.yellow;
              return (
                <div key={index} className={`${colors.lightBg} border-2 ${colors.border} rounded-inner p-6 shadow-sm`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl">{colors.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-slate-900 italic uppercase tracking-tight">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${colors.text}`}>
                          {item.binNameThai}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          • {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {item.instructions && (
                    <div className="bg-white/50 rounded-xl p-4 border border-white/80">
                      <p className="text-[11px] font-bold text-slate-700 mb-1 leading-tight">
                         {item.instructions}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium italic">
                        {item.instructionsThai}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Educational Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-inner p-6 mb-8">
            <div className="flex items-start gap-4">
              <Leaf className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-blue-900 mb-2 text-xs uppercase tracking-widest">💡 Pro Tip</h4>
                <p className="text-xs text-blue-800 font-medium leading-relaxed italic">
                  Clean and dry recyclables before disposing. Contaminated items 
                  may not be recyclable and should go to the general waste bin.
                </p>
                <p className="text-[10px] text-blue-700 mt-2 font-bold uppercase tracking-widest">
                  ล้างและทำให้แห้งก่อนทิ้งขยะรีไซเคิล ขยะที่สกปรกอาจรีไซเคิลไม่ได้
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto space-y-3">
          <button
            onClick={onSubmit}
            className="w-full bg-eco-500 text-white font-bold py-5 rounded-inner hover:bg-eco-600 active:scale-[0.98] transition-all shadow-eco flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em]"
          >
            <span>Confirm & Submit</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={onRetake}
            className="w-full bg-slate-50 text-slate-500 font-bold py-4 rounded-inner hover:bg-slate-100 active:scale-[0.98] transition-all text-[10px] uppercase tracking-widest"
          >
            Retake Photo
          </button>
        </div>
      </div>
    </div>
  );
};

const VisionUnit: React.FC<VisionUnitProps> = ({ onComplete }) => {
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
    { id: ActionType.RECYCLE, icon: Trash2, label: 'WSTE', color: 'text-eco-500' },
    { id: ActionType.GREASE_TRAP, icon: Droplets, label: 'TRAP', color: 'text-blue-500' },
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
    setProcessingStep('Capturing Image...');
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failure');
      
      ctx.drawImage(video, 0, 0);
      const rawBase64 = canvas.toDataURL('image/jpeg', 0.9);
      
      setProcessingStep('Validating Security...');
      const isScreenshot = await ImageValidator.isLikelyScreenshot(rawBase64);
      if (isScreenshot) {
        throw new Error("SECURITY ALERT: Digital artifact detected. Please take a real photo.");
      }

      setProcessingStep('Analyzing Impact...');
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
        setProcessingStep('Syncing to Nexus...');
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
    setProcessingStep('Securing Manifest...');
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
    switch(color) {
      case 'GREEN': return { bg: 'bg-eco-500', border: 'border-eco-200', text: 'text-white' };
      case 'YELLOW': return { bg: 'bg-amber-400', border: 'border-amber-200', text: 'text-slate-900' };
      case 'BLUE': return { bg: 'bg-blue-500', border: 'border-blue-200', text: 'text-white' };
      case 'RED': return { bg: 'bg-red-500', border: 'border-red-200', text: 'text-white' };
      default: return { bg: 'bg-slate-500', border: 'border-slate-200', text: 'text-white' };
    }
  };

  return (
    <div className="space-y-6 pb-24 px-6 pt-6 animate-in fade-in duration-700">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display uppercase italic">Vision Unit</h2>
        <p className="text-eco-600 font-mono text-[10px] tracking-[0.4em] uppercase font-bold">Bio-Metric Analysis HUD</p>
      </div>

      <div className="grid grid-cols-4 gap-3 bg-white p-2 rounded-inner shadow-eco border border-eco-50">
        {modes.map(m => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button 
              key={m.id}
              onClick={() => { setMode(m.id as ActionType); setPreview(null); setError(null); setResult(null); }}
              className={`flex flex-col items-center gap-2 py-4 rounded-inner transition-all relative group ${
                isActive ? 'text-eco-700' : 'text-slate-400 hover:text-eco-500'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-eco-50 rounded-inner shadow-inner animate-in zoom-in duration-300 border border-eco-100"></div>
              )}
              <Icon size={22} className={`relative z-10 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] relative z-10">{m.label}</span>
            </button>
          );
        })}
      </div>

      <div className="relative aspect-[9/13] rounded-unit overflow-hidden border-8 border-white shadow-eco-strong bg-slate-950">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center gap-6 bg-slate-900 z-50">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 animate-pulse">
              <ShieldAlert size={48} />
            </div>
            <p className="font-mono text-xs text-red-400 uppercase tracking-widest leading-relaxed font-bold">{error}</p>
            <button onClick={() => { setError(null); setPreview(null); setResult(null); setProcessing(false); startCamera(); }} className="px-8 py-4 bg-white/5 rounded-inner text-[10px] font-bold uppercase text-white hover:bg-white/10 border border-white/10 transition-all tracking-widest">Retry Sensor</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover grayscale opacity-40 mix-blend-screen ${processing ? 'blur-sm' : ''}`} />
            
            {processing && (
              <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 z-[110] p-10">
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-eco-500/10 rounded-full border-t-eco-500 animate-spin" />
                  <div className="absolute inset-0 m-auto flex items-center justify-center text-eco-500">
                    <Leaf size={48} className="animate-pulse" />
                  </div>
                </div>
                <p className="font-mono text-[11px] text-eco-400 tracking-[0.4em] font-bold uppercase text-center">{processingStep}</p>
              </div>
            )}

            {preview && result && !processing && !showGuide && (
              <div className="absolute inset-0 bg-white flex flex-col p-8 animate-in zoom-in duration-700 z-40 overflow-y-auto no-scrollbar">
                <div className="space-y-8 flex-1">
                  <div className="w-full aspect-video rounded-inner overflow-hidden shadow-md border border-slate-100">
                    <img src={preview} className="w-full h-full object-cover" alt="Captured" />
                  </div>

                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">สิ่งนี้คือ:</span>
                      <h3 className="text-3xl font-bold text-slate-900 uppercase italic font-display">{result.label}</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">วิธีจัดการ:</span>
                         <div className={`p-6 rounded-inner border-2 ${getBinStyles(result.bin_color).bg} ${getBinStyles(result.bin_color).border} flex items-center gap-4`}>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                              <Trash2 className={getBinStyles(result.bin_color).text} size={24} />
                            </div>
                            <div>
                               <p className={`text-[10px] font-bold uppercase tracking-widest ${getBinStyles(result.bin_color).text} opacity-80`}>ทิ้งที่ถังขยะ</p>
                               <p className={`text-xl font-black uppercase italic ${getBinStyles(result.bin_color).text}`}>{result.bin_name}</p>
                            </div>
                         </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-inner border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">คำแนะนำเพิ่มเติม:</span>
                        <p className="text-sm text-slate-600 font-medium italic leading-relaxed">
                          "{result.upcycling_tip}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button onClick={onComplete} className="w-full py-5 bg-eco-500 text-white rounded-inner font-bold uppercase text-xs tracking-[0.3em] shadow-eco hover:bg-eco-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                    ยืนยันรายการ <ArrowRight size={18} />
                  </button>
                  <button onClick={() => { setPreview(null); setResult(null); startCamera(); }} className="w-full py-4 text-slate-400 font-bold uppercase text-[9px] tracking-[0.4em] hover:text-slate-600 transition-all mt-2">
                    ถ่ายใหม่
                  </button>
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
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full px-10">
                <button 
                  onClick={capture}
                  className="w-full py-7 bg-white/5 backdrop-blur-2xl border border-white/20 rounded-unit flex flex-col items-center justify-center gap-4 group hover:bg-white hover:border-eco-500 transition-all shadow-2xl"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-eco-400 to-eco-600 rounded-full flex items-center justify-center text-white shadow-eco-strong">
                    <Camera size={32} />
                  </div>
                  <span className="text-[11px] font-bold text-white group-hover:text-eco-800 uppercase tracking-[0.4em]">INITIATE SCAN</span>
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
