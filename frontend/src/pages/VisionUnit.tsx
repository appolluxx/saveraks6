import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCcw, Box, CheckCircle, ArrowLeft } from 'lucide-react';
import { api } from '../../../services/api';

const VisionUnit: React.FC<{ user: any; onBack: () => void }> = ({ user, onBack }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [useCamera, setUseCamera] = useState(false);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // Fix: Assign stream to video element whenever stream/videoRef changes
    useEffect(() => {
        if (useCamera && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [useCamera, stream]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            setUseCamera(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            // Fallback to file input if camera access fails
            fileInputRef.current?.click();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setUseCamera(false);
    };

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setImagePreview(base64);
                setResult(null);
                handleAnalyze(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const takePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoRef.current, 0, 0);
            const imageBase64 = canvas.toDataURL('image/jpeg');
            setImagePreview(imageBase64);
            stopCamera(); // Stop live preview
            handleAnalyze(imageBase64);
        }
    };

    const handleAnalyze = async (base64: string) => {
        setAnalyzing(true);
        try {
            // Remove data:image... prefix if present for API
            // Actually relying on previous logic, let's keep it consistent
            // The service seems to handle split(',') but just in case

            const response = await api.post('/api/actions/analyze', {
                imageBase64: base64
            });

            if (response.success) {
                setResult(response.wasteSorting);

                // Auto-submit logic or wait for user confirmation?
                // The provided example auto-logs. Let's stick to the flow of confirmation.
                // Wait, based on the `Example` code, it logs activity AFTER analysis directly.
                // But for `waste sorting`, we usually show analysis first.
                // Let's mimic the UI provided but keep the logic robust.
            } else {
                throw new Error(response.error);
            }
        } catch (err) {
            alert("System Analysis Error.");
            setImagePreview(null);
        } finally {
            setAnalyzing(false);
        }
    };

    const confirmAction = async () => {
        if (!result || !imagePreview) return;
        try {
            await api.post('/api/actions/submit', {
                userId: user.id,
                actionType: 'waste_sorting',
                description: `Sorted ${result.items.length} items`,
                imageBase64: imagePreview,
                sortingAnalysis: result
            });
            alert('Action Submitted Successfully! +10 Points');
            onBack();
        } catch (e) {
            alert("Submission Failed");
        }
    }

    return (
        <div className="space-y-8 p-6 pb-24">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-900"><ArrowLeft /></button>
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Vision Unit</h2>
                    <p className="text-slate-500 text-xs font-medium">Deploy AI sensors to categorize environment data.</p>
                </div>
            </div>

            {!imagePreview && !useCamera ? (
                <button
                    onClick={() => startCamera()}
                    className="w-full aspect-square bg-white rounded-[32px] flex flex-col items-center justify-center gap-6 group hover:border-eco-500 transition-all border-2 border-dashed border-slate-200 shadow-sm"
                >
                    <div className="w-20 h-20 bg-eco-500 rounded-[24px] flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                        <Camera size={32} strokeWidth={2.5} />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-black uppercase tracking-widest mb-1 text-slate-900">Engage Sensor</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Environment Scanning Ready</p>
                    </div>
                </button>
            ) : useCamera && !imagePreview ? (
                <div className="relative aspect-square rounded-[32px] overflow-hidden bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <button
                        onClick={takePhoto}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-lg"
                    >
                        <div className="w-16 h-16 bg-white border-2 border-black rounded-full" />
                    </button>
                    <button
                        onClick={stopCamera}
                        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full"
                    >
                        <RefreshCcw size={20} />
                    </button>
                </div>
            ) : (
                <div className="space-y-6 animate-in zoom-in duration-300">
                    <div className="relative aspect-square rounded-[32px] overflow-hidden border border-eco-200 bg-eco-50 p-3">
                        <img src={imagePreview!} alt="Preview" className="w-full h-full object-cover rounded-[24px] opacity-90" />

                        {analyzing && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-10">
                                <div className="w-12 h-12 border-4 border-eco-500/20 rounded-full border-t-eco-500 animate-spin"></div>
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-eco-400">Analyzing Unit...</p>
                            </div>
                        )}

                        {!analyzing && !result && (
                            <div className="absolute inset-0 border-[2px] border-eco-500/40 m-12 rounded-[24px] pointer-events-none">
                                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-eco-500"></div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-eco-500"></div>
                                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-eco-500"></div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-eco-500"></div>
                            </div>
                        )}
                    </div>

                    {result && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-6">
                            <div className="bg-white p-6 rounded-[32px] shadow-eco border border-eco-100 flex items-center gap-6">
                                <div className="w-16 h-16 bg-eco-500 rounded-[24px] flex items-center justify-center text-white shrink-0">
                                    <Box size={28} />
                                </div>
                                <div className="flex flex-col gap-1 overflow-hidden">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identified Unit</p>
                                    <h4 className="text-lg font-extrabold text-slate-900 tracking-tight truncate">{result.summary || "Waste Object"}</h4>
                                    <div className="text-eco-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-1">
                                        <CheckCircle size={12} /> Allocation: +10 SRT
                                    </div>
                                </div>
                            </div>

                            {/* Detected Items List */}
                            <div className="space-y-2">
                                {result.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-slate-50 p-4 rounded-[24px] flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{item.bin === 'green' ? '🟢' : item.bin === 'blue' ? '🔵' : item.bin === 'yellow' ? '🟡' : '🔴'}</span>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase">{item.binNameThai}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-slate-400">{(item.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={confirmAction}
                                className="w-full py-5 bg-eco-500 text-white rounded-[24px] font-black uppercase text-xs tracking-widest shadow-eco hover:bg-eco-600 active:scale-95 transition-all"
                            >
                                Confirm Protocol
                            </button>

                            <button
                                onClick={() => { setImagePreview(null); setResult(null); setUseCamera(false); }}
                                className="w-full py-5 bg-white text-slate-900 border border-slate-200 rounded-[24px] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
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

export default VisionUnit;
