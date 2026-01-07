import React, { useState, useEffect } from 'react';
import { Camera, Leaf, ArrowRight, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../../../services/api';

interface WasteSortingGuideProps {
    capturedImage: string;
    onSubmit: (analysis: any) => void;
    onRetake: () => void;
    onCancel: () => void;
}

const WasteSortingGuide: React.FC<WasteSortingGuideProps> = ({ capturedImage, onSubmit, onRetake, onCancel }) => {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        analyzeWaste();
    }, []);

    const analyzeWaste = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.post('/api/actions/analyze', {
                imageBase64: capturedImage
            });

            if (!result.success) {
                throw new Error(result.error || 'Analysis failed');
            }

            setAnalysis(result.wasteSorting);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const binColors: Record<string, any> = {
        green: { bg: 'bg-green-500', text: 'text-green-700', lightBg: 'bg-green-50', border: 'border-green-200', icon: '🟢' },
        blue: { bg: 'bg-blue-500', text: 'text-blue-700', lightBg: 'bg-blue-50', border: 'border-blue-200', icon: '🔵' },
        yellow: { bg: 'bg-yellow-500', text: 'text-yellow-700', lightBg: 'bg-yellow-50', border: 'border-yellow-200', icon: '🟡' },
        red: { bg: 'bg-red-500', text: 'text-red-700', lightBg: 'bg-red-50', border: 'border-red-200', icon: '🔴' }
    };

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 pb-8">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">Waste Sorting Guide</h1>
                    <button onClick={onCancel} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-green-50">AI identified items in your photo</p>
            </div>

            <div className="relative h-48 bg-black">
                <img src={capturedImage} alt="Captured waste" className="w-full h-full object-contain" />
                <button onClick={onRetake} className="absolute bottom-4 right-4 bg-white text-slate-900 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-gray-100 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Retake
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-32">
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
                            <Camera className="w-12 h-12 text-green-600 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Image...</h3>
                        <p className="text-slate-600">AI is identifying waste items</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-12">
                        <div className="inline-flex p-4 bg-red-100 rounded-full mb-4">
                            <AlertTriangle className="w-12 h-12 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Analysis Failed</h3>
                        <p className="text-slate-600 mb-4">{error}</p>
                        <button onClick={analyzeWaste} className="bg-green-500 text-white px-6 py-3 rounded-[24px] font-semibold hover:bg-green-600 transition-colors">
                            Try Again
                        </button>
                    </div>
                )}

                {!loading && !error && analysis && (
                    <div>
                        <div className="bg-green-50 border border-green-200 rounded-[24px] p-6 mb-6">
                            <h3 className="font-bold text-slate-900 mb-2">Summary</h3>
                            <p className="text-slate-700">{analysis.summary}</p>
                            <p className="text-slate-600 text-sm mt-1">{analysis.summaryThai}</p>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-4">Detected Items ({analysis.items.length})</h3>

                        <div className="space-y-4">
                            {analysis.items.map((item: any, index: number) => {
                                const colors = binColors[item.bin] || binColors.yellow;
                                return (
                                    <div key={index} className={`${colors.lightBg} border-2 ${colors.border} rounded-[24px] p-6`}>
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="text-4xl">{colors.icon}</div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-slate-900">{item.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-sm font-semibold ${colors.text}`}>{item.binNameThai}</span>
                                                    <span className="text-xs text-slate-500">• {(item.confidence * 100).toFixed(0)}% confident</span>
                                                </div>
                                            </div>
                                        </div>
                                        {item.instructions && (
                                            <div className="bg-white/50 rounded-[16px] p-4">
                                                <p className="text-sm font-medium text-slate-700 mb-1">📋 {item.instructions}</p>
                                                <p className="text-xs text-slate-600">{item.instructionsThai}</p>
                                            </div>
                                        )}
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                                                <span>AI Confidence</span>
                                                <span>{(item.confidence * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                                                <div className={`${colors.bg} h-full rounded-full transition-all duration-500`} style={{ width: `${item.confidence * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-[24px] p-6">
                            <div className="flex items-start gap-3">
                                <Leaf className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-bold text-blue-900 mb-2">💡 Pro Tip</h4>
                                    <p className="text-sm text-blue-800">Clean and dry recyclables before disposing.</p>
                                    <p className="text-sm text-blue-700 mt-2">ล้างและทำให้แห้งก่อนทิ้งขยะรีไซเคิล</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {!loading && !error && analysis && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-6 safe-area-bottom">
                    <div className="max-w-2xl mx-auto space-y-3">
                        <button onClick={() => onSubmit(analysis)} className="w-full bg-green-500 text-white font-bold py-4 rounded-[24px] hover:bg-green-600 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2">
                            <span>Submit Action</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button onClick={onRetake} className="w-full bg-slate-100 text-slate-700 font-semibold py-3 rounded-[24px] hover:bg-slate-200 active:scale-[0.98] transition-all">
                            Retake Photo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WasteSortingGuide;
