import React from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Download, X } from 'lucide-react';

const InstallBanner: React.FC = () => {
  const { prompt, install, isInstalled } = useInstallPrompt();
  const [dismissed, setDismissed] = React.useState(false);

  if (isInstalled || !prompt || dismissed) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[60] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white/90 backdrop-blur-xl border border-eco-100 p-5 rounded-unit shadow-eco-strong flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-eco-500 rounded-inner flex items-center justify-center text-white shadow-eco">
            <Download size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">Install SaveRaks</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Fast Offline Access</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={install}
            className="px-6 py-2.5 bg-eco-500 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-eco active:scale-95 transition-all"
          >
            Install
          </button>
          <button 
            onClick={() => setDismissed(true)}
            className="p-2 text-slate-300 hover:text-slate-500"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;