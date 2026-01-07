import React, { useState } from 'react';
import { User, Phone, Lock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { verifyStudentId, registerStudent } from '../../services/api';

interface StudentRegisterFormProps {
    onSuccess: (user: any) => void;
    onBack: () => void;
}

export const StudentRegisterForm: React.FC<StudentRegisterFormProps> = ({ onSuccess, onBack }) => {
    const [formData, setFormData] = useState({
        studentId: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const [studentInfo, setStudentInfo] = useState<any>(null);

    const handleVerifyStudentId = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await verifyStudentId(formData.studentId);
            if (!result.success) {
                throw new Error('Student ID not found in roster');
            }
            setStudentInfo(result.student);
            setStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
            const user = await registerStudent(formData);
            onSuccess(user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Student Registration"
            subtitle="Join SaveRaks to start your eco-journey"
        >
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 -mt-2"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Login</span>
            </button>

            <div className="flex items-center gap-2 mb-6">
                <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-green-500' : 'bg-slate-200'}`} />
                <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-green-500' : 'bg-slate-200'}`} />
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-[20px] p-4 mb-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {step === 1 && (
                <form onSubmit={handleVerifyStudentId} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Student ID (รหัสนักเรียน)
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <User className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={formData.studentId}
                                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                placeholder="Enter your 5-digit student ID"
                                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-[20px] focus:outline-none focus:border-green-500 transition-colors"
                                required
                                pattern="[0-9]{5}"
                                maxLength={5}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Your student ID must be registered in the school database</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 rounded-[24px] hover:shadow-lg hover:shadow-green-500/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Student ID'}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleRegister} className="space-y-4">
                    {studentInfo && (
                        <div className="bg-green-50 border border-green-200 rounded-[20px] p-4 mb-4">
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-green-800">✓ Student Verified</p>
                                <div className="text-sm text-green-700">
                                    <p><strong>Name:</strong> {studentInfo.fullName}</p>
                                    <p><strong>Classroom:</strong> {studentInfo.classRoom}</p>
                                    <p><strong>Student ID:</strong> {formData.studentId}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Phone Number (เบอร์โทรศัพท์)
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Phone className="w-5 h-5" />
                            </div>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="0812345678"
                                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-[20px] focus:outline-none focus:border-green-500 transition-colors"
                                required
                                pattern="[0-9]{10}"
                                maxLength={10}
                            />
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
                                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-[20px] focus:outline-none focus:border-green-500 transition-colors"
                                required
                                minLength={8}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 rounded-[24px] hover:shadow-lg hover:shadow-green-500/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                    </button>
                </form>
            )}
        </AuthLayout>
    );
};
