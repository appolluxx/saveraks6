import React from 'react';
import { Leaf, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
                <div className="absolute top-40 right-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-1/2 w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-inner mb-4 shadow-eco-strong animate-in zoom-in duration-500">
                        <Leaf className="w-10 h-10 text-white" />
                    </div>

                    <div className="flex flex-col gap-1 items-center justify-center">
                        <span className="text-[11px] font-bold text-eco-600 uppercase tracking-[0.5em] animate-pulse">Saveรักษ์ : Smart Sustainable Mindset</span>
                        <h1 className="text-4xl font-black text-slate-900 flex items-center justify-center gap-2 font-display italic uppercase tracking-tighter">
                            CORE INTERFACE
                            <Sparkles className="w-6 h-6 text-eco-500" />
                        </h1>
                    </div>

                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">
                        โรงเรียนสุรศักดิ์มนตรี x Youth Empowerment
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-unit shadow-eco-strong p-10 border border-white/50 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-eco-400 to-eco-600" />
                    <div className="mb-8 pl-2">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight uppercase italic leading-none">{title}</h2>
                        {subtitle && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 ml-1">{subtitle}</p>}
                    </div>

                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-[9px] font-bold text-slate-400 mt-8 uppercase tracking-[0.3em]">
                    © 2026 Surasakmontree School Matrix Unit. PROPRIETARY SYSTEM.
                </p>
            </div>
        </div>
    );
};
