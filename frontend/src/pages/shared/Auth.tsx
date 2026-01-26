import React, { useState } from 'react';
import { loginUser, loginGuest, updateConsent } from '../services/api';
import { User } from '../types';
import { Leaf, ArrowRight, Loader2, UserPlus, Fingerprint, ShieldCheck, Sparkles } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [schoolId, setSchoolId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConsent, setShowConsent] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    setLoading(true);
    setError('');

    try {
      const u = await loginUser(schoolId);
      if (u) {
        if (!u.consentGiven) {
          setTempUser(u);
          setShowConsent(true);
        } else {
          onLogin(u);
        }
      } else {
        setError('Identity signature not found in our matrix.');
      }
    } catch (err) {
      setError('Uplink failed. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const guest = loginGuest();
      onLogin(guest);
      setLoading(false);
    }, 1000);
  };

  const handleConsent = async () => {
    if (!tempUser) return;
    setLoading(true);
    await updateConsent(tempUser.schoolId);
    onLogin({ ...tempUser, consentGiven: true });
  };

  return (
    <div className="min-h-screen bg-nature flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Nature Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-eco-100 to-transparent pointer-events-none opacity-40"></div>
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-eco-200/40 rounded-full blur-[120px]"></div>
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-100/40 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md space-y-10 relative z-10 animate-fade-up">
        <div className="text-center space-y-4">
          <div className="relative inline-block group">
             <div className="absolute inset-0 bg-eco-500 opacity-20 blur-3xl rounded-full group-hover:opacity-30 transition-opacity"></div>
             <div className="w-24 h-24 bg-gradient-to-br from-eco-400 to-eco-600 rounded-[35%] mx-auto flex items-center justify-center shadow-eco-strong rotate-3 group-hover:rotate-0 transition-transform duration-700 relative z-10">
               <Leaf className="text-white" size={48} strokeWidth={2} />
             </div>
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900 font-display">SAVERAKS</h1>
            <p className="text-eco-600 font-sans text-sm font-bold tracking-[0.2em] uppercase mt-2">Nurture the Future</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-unit space-y-8 shadow-eco border border-eco-100">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Welcome Unit</h2>
            <p className="text-slate-500 text-sm">Synchronize your school identity to begin.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Fingerprint size={14} className="text-eco-500" /> Identity Token
              </label>
              <input 
                type="text" 
                placeholder="TOKEN-XXXXXX"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-inner px-6 py-4 font-mono tracking-widest text-slate-900 outline-none focus:border-eco-500 focus:bg-white transition-all placeholder:text-slate-300 text-lg"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 py-3 px-4 rounded-inner animate-in fade-in zoom-in duration-300">
                <p className="text-red-500 text-[11px] font-bold uppercase text-center tracking-wider">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <button 
                disabled={loading}
                className="w-full py-5 bg-eco-500 text-white rounded-inner font-bold uppercase text-sm tracking-widest flex items-center justify-center gap-3 shadow-eco hover:bg-eco-600 hover:-translate-y-1 active:scale-95 transition-all group overflow-hidden relative"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Enter Terminal <ArrowRight size={20} /></>}
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-[1px] flex-1 bg-slate-100"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">or</span>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
              </div>

              <button 
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full py-4 bg-eco-50 text-eco-700 hover:bg-eco-100 rounded-inner font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all border border-eco-200"
              >
                <UserPlus size={16} /> Guest Protocol
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] leading-loose flex items-center justify-center gap-2">
            <Sparkles size={12} className="text-eco-400" /> Environment Guardian System <Sparkles size={12} className="text-eco-400" />
          </p>
        </div>
      </div>

      {showConsent && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white max-w-md p-10 rounded-unit space-y-8 shadow-2xl relative animate-in slide-in-from-bottom-10 overflow-hidden">
            {/* Decorative organic shape in modal */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-eco-100 rounded-full blur-2xl opacity-60"></div>
            
            <div className="relative text-center space-y-6">
              <div className="w-20 h-20 bg-eco-500 rounded-full flex items-center justify-center text-white shadow-eco mx-auto mb-6 scale-110">
                <ShieldCheck size={40} strokeWidth={2.5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold tracking-tight text-slate-900 font-display">PDPA PROTOCOL</h3>
                <div className="h-1 w-12 bg-eco-500 mx-auto rounded-full"></div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium px-4">
                Unit #<span className="text-eco-600 font-mono font-bold tracking-tighter">{tempUser?.schoolId}</span>, we process eco-performance data to award SRT. Biometric analysis is strictly restricted to environmental verification.
              </p>
            </div>
            
            <button 
              onClick={handleConsent}
              disabled={loading}
              className="w-full py-5 bg-eco-500 text-white rounded-inner font-bold uppercase tracking-widest shadow-eco hover:bg-eco-600 transition-all active:scale-95 relative z-10"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Authorize & Deploy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;