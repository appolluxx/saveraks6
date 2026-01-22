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
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
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
        console.log("📸 [Frontend] Capture initiated...");
        setError(null);

        if (!webcamRef.current) {
            console.error("❌ [Frontend] Webcam ref is null");
            setError("Camera not initialized");
            return;
        }

        // Force a small delay to ensure video stream is stable
        // await new Promise(resolve => setTimeout(resolve, 100));

        let attempts = 0;
        let imageSrc = null;

        // Try to capture up to 3 times
        while (attempts < 3 && !imageSrc) {
            try {
                imageSrc = webcamRef.current.getScreenshot();
                if (!imageSrc) {
                    console.warn(`⚠️ [Frontend] Attempt ${attempts + 1}: Screenshot returned null. Retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 300)); // Wait 300ms
                    attempts++;
                }
            } catch (e) {
                console.error("Capture error:", e);
                attempts++;
            }
        }

        if (imageSrc) {
            console.log(`📦 [Frontend] Image captured successfully. Length: ${imageSrc.length}`);
            // Verify it's a valid base64 image string
            if (imageSrc.startsWith('data:image')) {
                setCapturedImage(imageSrc);
                processImage(imageSrc);
            } else {
                console.error("❌ [Frontend] Invalid image format captured");
                setError("Camera Error: Invalid Image Format");
            }
        } else {
            console.error("❌ [Frontend] Failed to capture image after multiple attempts");
            setError("Camera Capture Failed. Please try again or check camera permissions.");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
                processImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

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
            console.log(`📦 [Frontend] Original Size: ${base64Image.length} -> Resized: ${resizedBase64.length}`);

            const base64Data = resizedBase64.split(',')[1];
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

                            <button onClick={() => setUploadMode(!uploadMode)} className="p-4 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:border-white transition-all pointer-events-auto">
                                <RefreshCw size={24} />
                            </button>
                        </div>
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mx-6 mt-4 animate-in fade-in slide-in-from-bottom-5">
                                <p className="text-red-400 text-center font-mono text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    {error}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-bottom-10 space-y-6">

                        {/* 📸 Captured Image Preview */}
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-neon-green/30 shadow-[0_0_20px_rgba(0,233,120,0.1)]">
                            <img src={capturedImage || ''} alt="Analyzed Waste" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] text-neon-green font-mono border border-neon-green/30">
                                IMG_CAPTURE_001.JPG
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-neon-green/10 border border-neon-green/30 rounded-lg flex items-center justify-center text-neon-green shadow-[0_0_15px_rgba(0,233,120,0.2)]">
                                <Zap size={32} />
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] font-bold text-neon-green/60 uppercase tracking-widest font-mono">Detected Object</span>
                                <h2 className="text-2xl font-bold text-white font-display uppercase tracking-wide">
                                    {(() => {
                                        // 1. Try explicit Thai label from AI
                                        if (result.label && result.label !== 'Main Object Name' && result.label !== 'Unknown') return result.label;

                                        // 2. Try English item name and translate
                                        const engName = result.items?.[0]?.name || '';
                                        const lowerName = engName.toLowerCase();

                                        if (lowerName.includes('bottle')) return 'ขวดพลาสติก';
                                        if (lowerName.includes('can')) return 'กระป๋องอลูมิเนียม';
                                        if (lowerName.includes('snack') || lowerName.includes('bag')) return 'ถุงขนม/พลาสติก';
                                        if (lowerName.includes('cup')) return 'แก้วน้ำ';
                                        if (lowerName.includes('straw')) return 'หลอดพลาสติก';
                                        if (lowerName.includes('paper') || lowerName.includes('box') || lowerName.includes('carton')) return 'กระดาษ/กล่อง';
                                        if (lowerName.includes('food') || lowerName.includes('organic')) return 'เศษอาหาร/เปลือกผลไม้';
                                        if (lowerName.includes('glass')) return 'ขวดแก้ว';
                                        if (lowerName.includes('battery') || lowerName.includes('spray')) return 'ขยะอันตราย';

                                        // 3. Fallback
                                        return engName || result.category || 'วัตถุที่ตรวจพบ';
                                    })()}
                                </h2>
                                {/* Confidence Bar */}
                                <div className="mt-2 w-full max-w-[200px]">
                                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1 font-mono">
                                        <span>CONFIDENCE</span>
                                        <span className="text-neon-green">{Math.round((result.items?.[0]?.confidence || 0.95) * 100)}%</span>
                                    </div>
                                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-neon-green shadow-[0_0_5px_rgba(0,233,120,0.5)]"
                                            style={{ width: `${(result.items?.[0]?.confidence || 0.95) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-mono text-neon-blue">
                                        {(
                                            (
                                                (typeof result.confidence === 'number' && !isNaN(result.confidence)) ? result.confidence :
                                                    (result.items?.[0]?.confidence && typeof result.items[0].confidence === 'number' && !isNaN(result.items[0].confidence)) ? result.items[0].confidence :
                                                        0.98
                                            ) * 100
                                        ).toFixed(1)}% CONFIDENCE
                                    </span>
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
        </div >
    );
};

export default VisionUnit;
