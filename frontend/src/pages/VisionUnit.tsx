import React, { useRef, useState, useEffect } from 'react';
import { Zap, Scan, ChevronRight, Minimize } from 'lucide-react';
import Webcam from 'react-webcam';
import { analyzeImage, logActivity } from '../services/api';
import { ActionType, ScanResult } from '../types';
import { useTranslation } from 'react-i18next';

// Define the component using the correct prop type
const VisionUnit: React.FC<{ user?: any; onBack?: () => void; onComplete?: () => void }> = ({ onBack, onComplete }) => {
    const { t } = useTranslation();
    const webcamRef = useRef<Webcam>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Fix: Prevent double submission
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    // const [uploadMode, setUploadMode] = useState(false); // REMOVED: Gallery Upload
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    // Animation states
    // const [scanLine, setScanLine] = useState(false); // Unused

    useEffect(() => {
        // Start camera effect
        // setCamActive(true); 
    }, []);

    const capture = async () => {
        console.log("📸 [Frontend] Capture initiated...");
        setError(null);

        if (!webcamRef.current) {
            console.error("❌ [Frontend] Webcam ref is null");
            setError("Camera not initialized");
            return;
        }

        let attempts = 0;
        let imageSrc = null;

        // Try to capture up to 3 times
        while (attempts < 3 && !imageSrc) {
            try {
                imageSrc = webcamRef.current.getScreenshot();
                if (!imageSrc) {
                    console.warn(`⚠️ [Frontend] Attempt ${attempts + 1}: Screenshot returned null. Retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    attempts++;
                }
            } catch (e) {
                console.error("Capture error:", e);
                attempts++;
            }
        }

        if (imageSrc) {
            // Verify it's a valid base64 image string
            if (imageSrc.startsWith('data:image')) {
                setCapturedImage(imageSrc);
                processImage(imageSrc);
            } else {
                setError("Camera Error: Invalid Image Format");
            }
        } else {
            setError("Camera Capture Failed. Please try again or check camera permissions.");
        }
    };

    // REMOVED: handleFileUpload

    const processImage = async (base64Image: string) => {
        setAnalyzing(true);
        setError(null);
        try {
            // Resize Image Logic
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

            const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality

            const base64Data = resizedBase64.split(',')[1];
            const data = await analyzeImage(base64Data);

            if (data && data.wasteSorting) {
                setResult(data.wasteSorting);
            } else {
                setResult(data);
            }
        } catch (err) {
            console.error("Analysis failed", err);
            setError("AI Analysis Failed. Please try again."); // Generic error
        } finally {
            setAnalyzing(false);
        }
    };

    const handleConfirm = async () => {
        if (!result || isSubmitting) return; // Prevent Double Click
        setIsSubmitting(true);
        try {
            // Fix: Use detected label for ActionType mapping if possible or just pass a generic type
            // The backend now calculates points, so we define the type.
            // Map AI bin to ActionType
            let actionType = ActionType.RECYCLE;
            const bin = result.items?.[0]?.bin || 'general'; // Fix: Access bin from items

            if (bin === 'yellow') actionType = ActionType.RECYCLE;
            else if (bin === 'green') actionType = ActionType.ZERO_WASTE; // Or organic
            else if (bin === 'red') actionType = ActionType.ECO_PRODUCT; // Hazardous? Maybe Report? Using generic mapping.
            else if (bin === 'blue') actionType = ActionType.RECYCLE; // General/Recycle

            // Pass 0 as points to indicate "Backend Decide" (or modify api to allow undefined)
            // But logActivity might require it. We'll pass 0.
            await logActivity(actionType, {
                label: result.label || result.items?.[0]?.name || 'Waste Scan',
                points: 0, // SERVER SIDE CALCULATION
                description: result.summary,
                fileBase64: capturedImage // Fix: Send the captured image for deduplication!
            });

            alert(t('logger.success'));
            setResult(null);

            // Call onComplete or onBack
            if (onComplete) onComplete();
            else if (onBack) onBack();

        } catch (e: any) {
            alert(e.message || t('common.error'));
            setIsSubmitting(false); // Enable buttons again if error
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
            <div className="absolute inset-0 pointer-events-none z-20">
                <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-neon-green/50 rounded-tl-3xl m-4"></div>
                <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-neon-green/50 rounded-tr-3xl m-4"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-neon-green/50 rounded-bl-3xl m-4"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-neon-green/50 rounded-br-3xl m-4"></div>

                {/* Center Crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-neon-green/30 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                </div>

                {/* Scan Line Animation - Removed unused */}
            </div>

            {/* Top Bar */}
            <div className="absolute top-0 w-full p-6 flex justify-between items-start z-30 bg-gradient-to-b from-black/80 to-transparent">
                <div>
                    <h1 className="text-neon-green font-display text-xl uppercase tracking-[0.2em]">{t('vision.title')}</h1>
                    <p className="text-xs text-neon-green/60 font-mono">SYS.VER.2.5 // ONLINE</p>
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
                        <div className="w-24 h-24 border-t-4 border-neon-green rounded-full animate-spin mb-4"></div>
                        <p className="text-neon-green font-mono text-lg animate-pulse">{t('vision.analyzing')}</p>
                    </div>
                )}
            </div>

            {/* Bottom Controls / Results */}
            <div className="absolute bottom-0 w-full bg-zinc-900/90 border-t border-neon-green/30 p-6 pb-24 z-30 backdrop-blur-lg rounded-t-3xl safe-area-bottom">
                {!result ? (
                    <div className="flex flex-col gap-4">
                        <p className="text-center text-neon-green/70 font-mono text-xs uppercase tracking-widest mb-2">
                            {t('vision.scan_tip')}
                        </p>
                        <div className="flex justify-center items-center gap-8">
                            <button
                                onClick={capture}
                                className="w-20 h-20 rounded-full border-4 border-neon-green bg-neon-green/20 flex items-center justify-center shadow-[0_0_30px_rgba(0,233,120,0.3)] hover:bg-neon-green/40 active:scale-95 transition-all pointer-events-auto"
                            >
                                <Scan size={32} className="text-white" />
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
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-neon-green/30 shadow-[0_0_20px_rgba(0,233,120,0.1)]">
                            <img src={capturedImage || ''} alt="Analyzed Waste" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-neon-green/10 border border-neon-green/30 rounded-lg flex items-center justify-center text-neon-green">
                                <Zap size={32} />
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] font-bold text-neon-green/60 uppercase tracking-widest font-mono">Detected Object</span>
                                <h2 className="text-2xl font-bold text-white font-display uppercase tracking-wide">
                                    {result.label || result.items?.[0]?.name || 'Unknown Object'}
                                </h2>
                                {/* Confidence Bar */}
                            </div>
                        </div>

                        <div className="bg-black/40 p-4 rounded-lg border border-white/5 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-xs text-zinc-400 uppercase font-mono">Waste Type</span>
                                <span className="text-xs text-white uppercase font-bold tracking-wider">{result.bin_name || 'GENERAL WASTE'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-zinc-400 uppercase font-mono">Est. Points</span>
                                <span className="text-xs text-neon-green uppercase font-bold tracking-wider">+ {
                                    // Rough estimate for UI only
                                    ['yellow', 'green', 'blue'].includes(result.items?.[0]?.bin || '') ? '10' : '5'
                                } SRT</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={reset} disabled={isSubmitting} className="flex-1 py-4 bg-zinc-800 text-white rounded-inner font-bold uppercase text-xs tracking-widest hover:bg-zinc-700 transition-all pointer-events-auto">
                                {t('vision.reset')}
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                                className={`flex-[2] py-4 text-zinc-900 rounded-inner font-bold uppercase text-xs tracking-widest transition-all pointer-events-auto flex items-center justify-center gap-2 ${isSubmitting ? 'bg-zinc-600 cursor-wait' : 'bg-neon-green hover:bg-green-400 shadow-[0_0_20px_rgba(0,233,120,0.4)]'
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
