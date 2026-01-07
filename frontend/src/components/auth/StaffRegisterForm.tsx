import React, { useState } from 'react';
import { Mail, Phone, Lock, Eye, EyeOff, Loader2, ArrowLeft, User, Building } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { registerStaff } from '../../../../services/api';

interface StaffRegisterFormProps {
    onSuccess: () => void;
    onBack: () => void;
}

export const StaffRegisterForm: React.FC<StaffRegisterFormProps> = ({ onSuccess, onBack }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const positions = [
        'TEACHER',
        'ADMIN_STAFF',
        'MAINTENANCE',
        'OTHER'
    ];

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await registerStaff(formData);
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Staff Registration"
            subtitle="Join the SaveRaks team as a staff member"
        >
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 -mt-2"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Login</span>
            </button>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-[20px] p-4 mb-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <User className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="Enter your first name"
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-[20px] focus:outline-none focus:border-purple-500 transition-colors"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <User className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="Enter your last name"
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-[20px] focus:outline-none focus:border-purple-500 transition-colors"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Mail className="w-5 h-5" />
                        </div>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your.email@school.ac.th"
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-[20px] focus:outline-none focus:border-purple-500 transition-colors"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Phone className="w-5 h-5" />
                        </div>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="0812345678"
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-[20px] focus:outline-none focus:border-purple-500 transition-colors"
                            required
                            pattern="[0-9]{10}"
                            maxLength={10}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Position</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Building className="w-5 h-5" />
                        </div>
                        <select
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-[20px] focus:outline-none focus:border-purple-500 transition-colors appearance-none bg-white"
                            required
                        >
                            <option value="">Select your position</option>
                            {positions.map((position) => (
                                <option key={position} value={position}>{position.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Lock className="w-5 h-5" />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Minimum 8 characters"
                            className="w-full pl-12 pr-12 py-3 border-2 border-slate-200 rounded-[20px] focus:outline-none focus:border-purple-500 transition-colors"
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

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Lock className="w-5 h-5" />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="Re-enter your password"
                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-[20px] focus:outline-none focus:border-purple-500 transition-colors"
                            required
                            minLength={8}
                        />
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-4">
                    <p className="text-sm text-amber-700">
                        ⚠️ Staff accounts require admin approval before activation
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-4 rounded-[24px] hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Registration'}
                </button>
            </form>
        </AuthLayout>
    );
};
