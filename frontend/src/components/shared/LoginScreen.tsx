
import React, { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';
import { User } from '../types';
import Logo from './Logo';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [schoolId, setSchoolId] = useState('');
  const [name, setName] = useState('');
  const [classRoom, setClassRoom] = useState('M.4/1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user: User;
      if (isRegistering) {
        if (!name || !schoolId) throw new Error("Missing data points");
        user = await registerUser(name, schoolId);
      } else {
        if (!schoolId) throw new Error("Input ID required");
        user = await loginUser(schoolId);
      }
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Access denied");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <Logo size="lg" className="mb-10" />
        
        <h1 className="text-5xl font-black tracking-tighter text-white mb-2 italic">CoUnit</h1>
        <p className="text-muted font-bold text-[10px] uppercase tracking-[0.5em] mb-12">Eco-Infrastructure Access</p>

        <div className="w-full unit-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegistering && (
              <div className="space-y-6 animate-in slide-in-from-top-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest text-left ml-1">Identity Name</label>
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-5 py-4"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest text-left ml-1">Unit Assignment</label>
                  <select 
                     value={classRoom} onChange={(e) => setClassRoom(e.target.value)}
                     className="w-full px-5 py-4 appearance-none"
                  >
                    <option value="M.4/1">Class M.4/1</option>
                    <option value="M.5/1">Class M.5/1</option>
                    <option value="M.6/1">Class M.6/1</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest text-left ml-1">Secure ID Token</label>
              <input
                type="text" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}
                placeholder="SM-TOKEN-000"
                className="w-full px-5 py-4 font-mono tracking-widest"
              />
            </div>

            {error && (
              <div className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 py-4 rounded-xl border border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-5 bg-brand text-black rounded-inner font-black uppercase text-sm tracking-widest hover:bg-brand-dark transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(193,255,114,0.3)]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>{isRegistering ? 'Initialize Unit' : 'Request Access'} <ArrowRight size={20} /></>}
            </button>
          </form>

          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="w-full mt-10 text-[10px] font-bold text-muted uppercase tracking-widest hover:text-brand transition-colors pt-6 border-t border-brand-border"
          >
            {isRegistering ? "Connected? Request Access" : "No Identity? Create Unit"}
          </button>
        </div>
        
        <p className="mt-12 text-[9px] font-black text-muted uppercase tracking-widest">
          Integrated School Eco-Guardian System v2.0
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
