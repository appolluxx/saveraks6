import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, User } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { loginUser } from '../../../../services/api';

interface LoginFormProps {
    onSuccess: (user: any) => void;
    onSwitchToRegister: (type: 'student' | 'staff') => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
    const [formData, setFormData] = useState({
        identifier: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await loginUser(formData.identifier, formData.password);
            if (!user) throw new Error('Login failed');
            onSuccess(user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Login to continue your eco-mission"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-[20px] p-4">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Student ID / Email / Phone
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <User className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={formData.identifier}
                            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                            placeholder="12345 / email@example.com / 0812345678"
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-[20px] focus:outline-none focus:border-green-500 transition-colors"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Lock className="w-5 h-5" />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Enter your password"
                            className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-[20px] focus:outline-none focus:border-green-500 transition-colors"
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="text-right">
                    <button type="button" className="text-sm text-green-600 hover:text-green-700 font-medium">
                        Forgot password?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 rounded-[24px] hover:shadow-lg hover:shadow-green-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Logging in...
                        </>
                    ) : (
                        'Login'
                    )}
                </button>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-slate-500">Don't have an account?</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => onSwitchToRegister('student')}
                        className="bg-blue-50 border-2 border-blue-200 text-blue-700 font-semibold py-3 rounded-[20px] hover:bg-blue-100 active:scale-[0.98] transition-all"
                    >
                        Register as Student
                    </button>
                    <button
                        type="button"
                        onClick={() => onSwitchToRegister('staff')}
                        className="bg-purple-50 border-2 border-purple-200 text-purple-700 font-semibold py-3 rounded-[20px] hover:bg-purple-100 active:scale-[0.98] transition-all"
                    >
                        Register as Staff
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};
