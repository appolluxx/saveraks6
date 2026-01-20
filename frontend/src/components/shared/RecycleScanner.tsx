
import React, { useState, useRef } from 'react';
import { Camera, RefreshCcw, Scan, Zap, Box, AlertTriangle, CheckCircle } from 'lucide-react';
import { analyzeEnvironmentImage, fileToBase64 } from '../services/geminiService';
// Fix: compressImage moved to utils/image to resolve module export error
import { logActivity } from '../services/api';
import { compressImage } from '../utils/image';
import { ActionType, ScanResult } from '../types';

interface EcoScannerProps { onActivityLogged: () => void; }

const EcoScanner: React.FC<EcoScannerProps> = ({ onActivityLogged }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      setImagePreview(`data:image/jpeg;base64,${base64}`);
      setResult(null);
      handleAnalyze(base64);
    }
  };

  const handleAnalyze = async (base64: string) => {
    setAnalyzing(true);
    try {
      // Fixed: analyzeEnvironmentImage expects 2 arguments
      const analysis = await analyzeEnvironmentImage(base64, 'recycle');
      setResult(analysis);
      
      // Updated point_reward to points based on ScanResult type
      if (analysis.points > 0) {
        const category = (analysis.category || '').toLowerCase();
        let actionType = ActionType.RECYCLE;
        if (category === 'grease_trap') actionType = ActionType.GREASE_TRAP;
        if (category === 'hazard') actionType = ActionType.HAZARD_SCAN;

        const compressed = await compressImage(base64);
        await logActivity(actionType, {
            category: analysis.category,
            label: analysis.label,
            points: analysis.points,
            fileBase64: compressed,
            aiData: analysis
        });
        onActivityLogged();
      }
    } catch (err) {
      alert("System Analysis Error.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tight">Vision Unit</h2>
        <p className="text-muted text-xs font-medium">Deploy AI sensors to categorize environment data.</p>
      </div>

      {!imagePreview ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-square unit-card flex flex-col items-center justify-center gap-6 group hover:border-brand transition-all border-dashed"
        >
          <div className="w-20 h-20 bg-brand rounded-inner flex items-center justify-center text-black group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(193,255,114,0.3)]">
            <Camera size={32} strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-widest mb-1">Engage Sensor</p>
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Environment Scanning Ready</p>
          </div>
        </button>
      ) : (
        <div className="space-y-6 animate-in zoom-in duration-300">
          <div className="relative aspect-square rounded-unit overflow-hidden border border-brand-border bg-brand-unit p-3">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-inner opacity-80" />
            
            {analyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-brand/20 rounded-full border-t-brand animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand">Analyzing Unit...</p>
              </div>
            )}

            {!analyzing && !result && (
              <div className="absolute inset-0 border-[2px] border-brand/40 m-12 rounded-inner pointer-events-none">
                 <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-brand"></div>
                 <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-brand"></div>
                 <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-brand"></div>
                 <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-brand"></div>
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-4 animate-in slide-in-from-bottom-6">
               <div className="unit-card p-6 flex items-center gap-6">
                 <div className="w-16 h-16 bg-brand rounded-inner flex items-center justify-center text-black">
                    {result.category === 'hazard' ? <AlertTriangle size={28} /> : 
                     result.category === 'grease_trap' ? <Zap size={28} /> : <Box size={28} />}
                 </div>
                 <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Identified Unit</p>
                    <h4 className="text-xl font-extrabold text-white tracking-tight">{result.label}</h4>
                    <div className="text-brand text-[11px] font-black uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle size={12} /> Allocation: +{result.points} SRT
                    </div>
                 </div>
               </div>
               
               {result.upcycling_tip && (
                 <div className="bg-brand text-black p-6 rounded-unit space-y-3 shadow-[0_10px_30px_rgba(193,255,114,0.2)]">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60">
                       Unit Strategy
                    </div>
                    <p className="text-sm font-extrabold leading-tight">{result.upcycling_tip}</p>
                 </div>
               )}

               <button 
                onClick={() => { setImagePreview(null); setResult(null); }}
                className="w-full py-5 unit-card text-white font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-brand-unit transition-colors"
               >
                <RefreshCcw size={16} /> Reset Sensor
               </button>
            </div>
          )}
        </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleCapture} />
    </div>
  );
};

export default EcoScanner;
