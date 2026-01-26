import React, { useRef, useState, useEffect } from 'react';
import { Zap, Scan, ChevronRight, Minimize, Sprout, Leaf } from 'lucide-react';
import Webcam from 'react-webcam';
import { analyzeImage, logActivity } from '../services/api';
import { ActionType, ScanResult } from '../types';
import { useTranslation } from 'react-i18next';

export type VisionMode = 'WASTE' | 'ENERGY' | 'GREEN';

interface VisionUnitProps {
    user?: any;
    onBack?: () => void;
    onComplete?: () => void;
    mode?: VisionMode;
}

const VisionUnit: React.FC<VisionUnitProps> = ({ onBack, onComplete, mode = 'WASTE' }) => {
    const { t } = useTranslation();
    const webcamRef = useRef<Webcam>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    // Theme Config based on Mode
    const theme = {
        WASTE: { color: 'text-neon-green', border: 'border-neon-green', bg: 'bg-neon-green', title: t('vision.title') || 'AI WASTE SCANNER', icon: <Scan size={32} /> },
        ENERGY: { color: 'text-blue-400', border: 'border-blue-400', bg: 'bg-blue-400', title: 'ENERGY SAVER', icon: <Zap size={32} /> },
        GREEN: { color: 'text-emerald-400', border: 'border-emerald-400', bg: 'bg-emerald-400', title: 'GREEN ACTION', icon: <Sprout size={32} /> }
    }[mode];

    const capture = async () => {
        console.log("📸 [Frontend] Capture initiated...");
        setError(null);

        if (!webcamRef.current) {
            setError("Camera not initialized");
            return;
        }

        let attempts = 0;
        let imageSrc = null;

        while (attempts < 3 && !imageSrc) {
            try {
                imageSrc = webcamRef.current.getScreenshot();
                if (!imageSrc) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    attempts++;
                }
            } catch (e) {
                console.error("Capture error:", e);
                attempts++;
            }
        }

        if (imageSrc && imageSrc.startsWith('data:image')) {
            setCapturedImage(imageSrc);
            processImage(imageSrc);
        } else {
            setError("Camera Capture Failed. Please try again or check camera permissions.");
        }
    };

    const processImage = async (base64Image: string) => {
        setAnalyzing(true);
        setError(null);
        try {
            const img = new Image();
            img.src = base64Image;
            await new Promise((resolve) => { img.onload = resolve; });

            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

            const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            const base64Data = resizedBase64.split(',')[1];

            // Call API
            const data = await analyzeImage(base64Data);

            if (data && data.wasteSorting) {
                setResult(data.wasteSorting); // Legacy support
            } else if (data) {
                setResult(data);
            } else {
                throw new Error("Invalid response");
            }

        } catch (err) {
            console.error("Analysis failed", err);
            setError("AI Analysis Failed. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleConfirm = async () => {
        if (!result || isSubmitting) return;
        setIsSubmitting(true);
        try {
            let actionType = ActionType.RECYCLE; // Default

            // Logic to determine ActionType based on AI result AND current mode
            if (mode === 'ENERGY') {
                actionType = ActionType.ENERGY_SAVING;
            } else if (mode === 'GREEN') {
                actionType = ActionType.TREE_PLANTING;
            } else {
                // Waste Mode Logic
                const bin = result.bin_color || result.items?.[0]?.bin || 'general';
                if (bin === 'yellow') actionType = ActionType.RECYCLE;
                else if (bin === 'green') actionType = ActionType.ZERO_WASTE;
                else if (bin === 'red') actionType = ActionType.ECO_PRODUCT;
                else if (bin === 'blue') actionType = ActionType.RECYCLE;
            }

            // Verify with AI result if possible (Optional stricter check)
            // if (result.action_type && result.action_type !== mode.toLowerCase()) { ... warn user? ... }

            await logActivity(actionType, {
                label: result.label || result.items?.[0]?.name || `${mode} Action`,
                points: 0, // Server calculates based on type
                description: result.summary || result.description,
                fileBase64: capturedImage
            });

            alert(t('logger.success'));
            setResult(null);

            if (onComplete) onComplete();
            else if (onBack) onBack();

        } catch (e: any) {
            alert(e.message || t('common.error'));
            setIsSubmitting(false);
        }
    };

    const reset = () => {
        setResult(null);
        setError(null);
        setIsSubmitting(false);
        setCapturedImage(null);
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
            {/* HUD Overlay */}
            <div className={`absolute inset-0 pointer-events-none z-20`}>
                <div className={`absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 ${theme.border} opacity-50 rounded-tl-3xl m-4`}></div>
                <div className={`absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 ${theme.border} opacity-50 rounded-tr-3xl m-4`}></div>
                <div className={`absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 ${theme.border} opacity-50 rounded-bl-3xl m-4`}></div>
                <div className={`absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 ${theme.border} opacity-50 rounded-br-3xl m-4`}></div>

                {/* Center Crosshair */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border ${theme.border} opacity-30 rounded-full flex items-center justify-center`}>
                    <div className={`w-2 h-2 ${theme.bg} rounded-full`}></div>
                </div>
            </div>

            {/* Top Bar */}
            <div className="absolute top-0 w-full p-6 flex justify-between items-start z-30 bg-gradient-to-b from-black/80 to-transparent">
                <div>
                    <h1 className={`${theme.color} font-display text-xl uppercase tracking-[0.2em]`}>{theme.title}</h1>
                    <p className={`text-xs ${theme.color} opacity-60 font-mono`}>MODE: {mode} // ONLINE</p>
                </div>
                <button onClick={onBack || onComplete} className="p-2 border border-red-500/30 text-red-500 rounded hover:bg-red-500/20 transition-colors pointer-events-auto">
                    <Minimize size={24} />
                </button>
            </div>

            {/* Main Viewport */}
            <div className="flex-1 relative bg-zinc-900 flex items-center justify-center overflow-hidden">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    className="w-full h-full object-cover opacity-80"
                />

                {/* Analyzing Overlay */}
                {analyzing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-40 backdrop-blur-sm">
                        <div className={`w-24 h-24 border-t-4 ${theme.border} rounded-full animate-spin mb-4`}></div>
                        <p className={`${theme.color} font-mono text-lg animate-pulse`}>{t('vision.analyzing')}</p>
                    </div>
                )}
            </div>

            {/* Bottom Controls / Results */}
            <div className={`absolute bottom-0 w-full bg-zinc-900/90 border-t ${theme.border} border-opacity-30 p-6 pb-24 z-30 backdrop-blur-lg rounded-t-3xl safe-area-bottom`}>
                {!result ? (
                    <div className="flex flex-col gap-4">
                        <p className={`text-center ${theme.color} opacity-70 font-mono text-xs uppercase tracking-widest mb-2`}>
                            {mode === 'WASTE' && t('vision.scan_tip')}
                            {mode === 'ENERGY' && "Capture turned off lights, unplugged devices, or energy saving actions."}
                            {mode === 'GREEN' && "Capture plants, gardens, or tree planting activities."}
                        </p>
                        <div className="flex justify-center items-center gap-8">
                            <button
                                onClick={capture}
                                className={`w-20 h-20 rounded-full border-4 ${theme.border} ${theme.bg} bg-opacity-20 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-opacity-40 active:scale-95 transition-all pointer-events-auto`}
                            >
                                {theme.icon}
                            </button>
                        </div>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mx-6 mt-4">
                                <p className="text-red-400 text-center font-mono text-[10px] uppercase">{error}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-bottom-10 space-y-6">

                        {/* 📸 Captured Image Preview */}
                        <div className={`relative w-full h-48 rounded-2xl overflow-hidden border ${theme.border} border-opacity-30`}>
                            <img src={capturedImage || ''} alt="Analyzed" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className={`w-16 h-16 ${theme.bg} bg-opacity-10 border ${theme.border} border-opacity-30 rounded-lg flex items-center justify-center ${theme.color}`}>
                                {theme.icon}
                            </div>
                            <div className="flex-1">
                                <span className={`text-[10px] font-bold ${theme.color} opacity-60 uppercase tracking-widest font-mono`}>Detected Object</span>
                                <h2 className="text-2xl font-bold text-white font-display uppercase tracking-wide">
                                    {result.label || result.items?.[0]?.name || 'Unknown Object'}
                                </h2>
                            </div>
                        </div>

                        <div className="bg-black/40 p-4 rounded-lg border border-white/5 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-xs text-zinc-400 uppercase font-mono">Type</span>
                                <span className="text-xs text-white uppercase font-bold tracking-wider">{result.action_type || mode}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-zinc-400 uppercase font-mono">Summary</span>
                                <span className="text-xs text-white uppercase tracking-wider text-right ml-4 line-clamp-2">{result.summary || result.description}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={reset} disabled={isSubmitting} className="flex-1 py-4 bg-zinc-800 text-white rounded-inner font-bold uppercase text-xs tracking-widest hover:bg-zinc-700 transition-all pointer-events-auto">
                                {t('vision.reset')}
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                                className={`flex-[2] py-4 text-zinc-900 rounded-inner font-bold uppercase text-xs tracking-widest transition-all pointer-events-auto flex items-center justify-center gap-2 ${isSubmitting ? 'bg-zinc-600 cursor-wait' : `${theme.bg} hover:opacity-90 shadow-lg`
                                    }`}
                            >
                                {isSubmitting ? 'PROCESSING...' : (
                                    <>
                                        {t('vision.confirm')} <ChevronRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default VisionUnit;
