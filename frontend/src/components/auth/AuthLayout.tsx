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
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-[24px] mb-4 shadow-lg">
                        <Leaf className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
                        SaveRaks 2.0
                        <Sparkles className="w-6 h-6 text-green-500" />
                    </h1>

                    <p className="text-slate-600">
                        Surasakmontree School Eco-Guardian Platform
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-white rounded-[32px] shadow-2xl shadow-green-500/10 p-8 border border-slate-100">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">{title}</h2>
                        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
                    </div>

                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 mt-6">
                    © 2025 Surasakmontree School. All rights reserved.
                </p>
            </div>
        </div>
    );
};
