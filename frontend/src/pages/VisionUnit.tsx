import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Zap, Scan, RefreshCw, CheckCircle, Upload, ChevronRight, Minimize } from 'lucide-react';
import Webcam from 'react-webcam';
import { analyzeImage, logActivity } from '../services/api';
import { ActionType, ScanResult } from '../types';
import { useTranslation } from 'react-i18next';

// Define the component using the correct prop type if it receives props, 
// otherwise use empty interface or just React.FC
const VisionUnit: React.FC<{ user?: any; onBack?: () => void }> = ({ user, onBack }) => {
    const { t } = useTranslation();
    const webcamRef = useRef<Webcam>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [camActive, setCamActive] = useState(false);
    const [uploadMode, setUploadMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Animation states
    const [scanLine, setScanLine] = useState(false);

    useEffect(() => {
        // Start camera effect
        setCamActive(true);
        const interval = setInterval(() => {
            setScanLine(prev => !prev);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const capture = async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            processImage(imageSrc);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                processImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const processImage = async (base64Image: string) => {
        setAnalyzing(true);
        setError(null);
        try {
            // Strip prefix if needed, though analyzeImage might handle it
            const base64Data = base64Image.split(',')[1];
            const data = await analyzeImage(base64Data);
            setResult(data);
        } catch (err) {
            console.error("Analysis failed", err);
            setError("AI Systems Offline. Manual Override Required.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleConfirm = async () => {
        if (!result) return;
        try {
            // Map result label to action type (simplified logic)
            // In a real app, the AI should return the suggested ActionType
            const actionType = ActionType.RECYCLE; // Default or map from result

            await logActivity(actionType, {
                label: result.label,
                points: 10, // Example points
                description: result.summary
            });
            alert(t('logger.success'));
            setResult(null);
            if (onBack) onBack();
        } catch (e) {
            alert(t('common.error'));
        }
    };

    const reset = () => {
        setResult(null);
        setError(null);
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
            {/* HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
                <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-neon-green/50 rounded-tl-3xl m-4"></div>
                <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-neon-green/50 rounded-tr-3xl m-4"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-neon-green/50 rounded-bl-3xl m-4"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-neon-green/50 rounded-br-3xl m-4"></div>

                {/* Center Crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-neon-green/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                    <div className="absolute top-0 w-1 h-4 bg-neon-green/50"></div>
                    <div className="absolute bottom-0 w-1 h-4 bg-neon-green/50"></div>
                    <div className="absolute left-0 w-4 h-1 bg-neon-green/50"></div>
                    <div className="absolute right-0 w-4 h-1 bg-neon-green/50"></div>
                </div>

                {/* Scan Line Animation */}
                {analyzing && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-neon-green/80 shadow-[0_0_20px_rgba(0,233,120,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                )}
            </div>

            {/* Top Bar */}
            <div className="absolute top-0 w-full p-6 flex justify-between items-start z-30 bg-gradient-to-b from-black/80 to-transparent">
                <div>
                    <h1 className="text-neon-green font-display text-xl uppercase tracking-[0.2em]">{t('vision.title')}</h1>
                    <p className="text-xs text-neon-green/60 font-mono">SYS.VER.2.5 // ONLINE</p>
                </div>
                <button onClick={onBack} className="p-2 border border-red-500/30 text-red-500 rounded hover:bg-red-500/20 transition-colors pointer-events-auto">
                    <Minimize size={24} />
                </button>
            </div>

            {/* Main Viewport */}
            <div className="flex-1 relative bg-zinc-900 flex items-center justify-center overflow-hidden">
                {!uploadMode ? (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "environment" }}
                        className="w-full h-full object-cover opacity-80"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                        <p className="text-zinc-500 font-mono">{t('vision.ready')}</p>
                    </div>
                )}

                {/* Analyzing Overlay */}
                {analyzing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-40 backdrop-blur-sm">
                        <div className="w-24 h-24 border-t-4 border-neon-green rounded-full animate-spin mb-4"></div>
                        <p className="text-neon-green font-mono text-lg animate-pulse">{t('vision.analyzing')}</p>
                        <div className="mt-2 text-xs text-neon-green/50 font-mono">
                            PROCESSING NEURAL NETWORK...
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Controls / Results */}
            <div className="absolute bottom-0 w-full bg-zinc-900/90 border-t border-neon-green/30 p-6 z-30 backdrop-blur-lg rounded-t-3xl">
                {!result ? (
                    <div className="flex flex-col gap-4">
                        <p className="text-center text-neon-green/70 font-mono text-xs uppercase tracking-widest mb-2">
                            {t('vision.scan_tip')}
                        </p>
                        <div className="flex justify-center items-center gap-8">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-4 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:border-white transition-all pointer-events-auto"
                            >
                                <Upload size={24} />
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                            <button
                                onClick={capture}
                                className="w-20 h-20 rounded-full border-4 border-neon-green bg-neon-green/20 flex items-center justify-center shadow-[0_0_30px_rgba(0,233,120,0.3)] hover:bg-neon-green/40 active:scale-95 transition-all pointer-events-auto"
                            >
                                <Scan size={32} className="text-white" />
                            </button>

                            <button onClick={() => setUploadMode(!uploadMode)} className="p-4 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:border-white transition-all pointer-events-auto">
                                <RefreshCw size={24} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-bottom-10 space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-neon-green/10 border border-neon-green/30 rounded-lg flex items-center justify-center text-neon-green shadow-[0_0_15px_rgba(0,233,120,0.2)]">
                                <Zap size={32} />
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] font-bold text-neon-green/60 uppercase tracking-widest font-mono">Detected Object</span>
                                <h2 className="text-2xl font-bold text-white font-display uppercase tracking-wide">{result.label}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-1.5 w-24 bg-zinc-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-neon-blue w-3/4 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                    </div>
                                    <span className="text-[10px] font-mono text-neon-blue">{(result.confidence * 100).toFixed(1)}% CONFIDENCE</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/40 p-4 rounded-lg border border-white/5 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-xs text-zinc-400 uppercase font-mono">Waste Type</span>
                                <span className="text-xs text-white uppercase font-bold tracking-wider">{result.bin_name || 'GENERAL WASTE'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-zinc-400 uppercase font-mono">Action Protocol</span>
                                <span className="text-xs text-neon-green uppercase font-bold tracking-wider">RECYCLE +10 SRT</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={reset} className="flex-1 py-4 bg-zinc-800 text-white rounded-inner font-bold uppercase text-xs tracking-widest hover:bg-zinc-700 transition-all pointer-events-auto">
                                {t('vision.reset')}
                            </button>
                            <button onClick={handleConfirm} className="flex-[2] py-4 bg-neon-green text-zinc-900 rounded-inner font-bold uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(0,233,120,0.4)] hover:bg-green-400 transition-all pointer-events-auto flex items-center justify-center gap-2">
                                {t('vision.confirm')} <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisionUnit;
