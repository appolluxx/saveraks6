
import React, { useState, useEffect } from 'react';
import { MapPin, Check, X, ShieldAlert, CheckCircle2, Crosshair, Loader2 } from 'lucide-react';
import { getPins, deployNode, getProfile } from '../services/api';
import { MapPin as PinType } from '../types';

interface IssueReporterProps {
  onActivityLogged: () => void;
}

const IssueReporter: React.FC<IssueReporterProps> = ({ onActivityLogged }) => {
  const [pins, setPins] = useState<PinType[]>([]);
  const [newPin, setNewPin] = useState<{ x: number, y: number } | null>(null);
  const [selectedPin, setSelectedPin] = useState<PinType | null>(null);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<PinType['type']>('HAZARD');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const MAP_IMAGE = "/map.jpg";

  // Fix: Handling async getPins in useEffect
  useEffect(() => {
    const loadPins = async () => {
      try {
        const data = await getPins();
        setPins(data);
      } catch (err) {
        console.error("Failed to load map nodes:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPins();
  }, []);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedPin) { setSelectedPin(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNewPin({ x, y });
  };

  const handlePinClick = (e: React.MouseEvent, pin: PinType) => {
    e.stopPropagation();
    setSelectedPin(pin);
    setNewPin(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin) return;
    setSubmitting(true);

    try {
      await deployNode({
        lat: newPin.x, // Using x/y as mock coordinates
        lng: newPin.y,
        type,
        description
      });
      // Fix: Handling async getPins result correctly
      const data = await getPins();
      setPins(data);
      setNewPin(null);
      setDescription('');
      onActivityLogged();
    } catch (err) {
      alert("Transmission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center p-20">
      <Loader2 className="animate-spin text-eco-500" size={32} />
    </div>
  );

  return (
    <div className="space-y-8 px-6 pt-6 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold text-eco-600 uppercase tracking-[0.4em]">Node Mapping</span>
        <h2 className="text-3xl font-bold text-slate-900 font-display italic uppercase tracking-tighter leading-none">Campus Matrix</h2>
      </div>

      <div className="bg-white p-2 rounded-unit shadow-eco relative overflow-hidden group border border-eco-50">
        <div
          className="relative w-full aspect-square bg-slate-100 rounded-inner overflow-hidden cursor-crosshair"
          onClick={handleMapClick}
        >
          <img src={MAP_IMAGE} alt="Campus Map" className="w-full h-full object-cover opacity-60 grayscale hover:opacity-80 transition-all duration-1000" />

          <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #0f172a 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          {pins.map(pin => (
            <button
              key={pin.id}
              onClick={(e) => handlePinClick(e, pin)}
              className={`absolute w-10 h-10 -ml-5 -mt-5 flex items-center justify-center transition-all hover:scale-125 ${pin.status === 'RESOLVED' ? 'text-eco-500' : 'text-red-500'
                }`}
              style={{ left: `${pin.lat}%`, top: `${pin.lng}%` }}
            >
              <div className="absolute inset-0 bg-current opacity-20 rounded-full animate-ping"></div>
              {pin.status === 'RESOLVED' ? <CheckCircle2 size={24} strokeWidth={3} /> : <MapPin fill="currentColor" size={24} />}
            </button>
          ))}

          {newPin && (
            <div
              className="absolute w-12 h-12 -ml-6 -mt-6 text-eco-600 animate-pulse pointer-events-none flex items-center justify-center"
              style={{ left: `${newPin.x}%`, top: `${newPin.y}%` }}
            >
              <div className="absolute inset-0 border-2 border-eco-500 rounded-full animate-spin"></div>
              <Crosshair size={32} strokeWidth={3} className="text-eco-500" />
            </div>
          )}
        </div>

        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold text-slate-900 shadow-sm flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-eco-500 animate-pulse" />
          SENSORS ACTIVE
        </div>
      </div>

      {selectedPin && (
        <div className="fixed inset-x-6 bottom-28 z-[60] animate-in slide-in-from-bottom-10">
          <div className="bg-white p-8 rounded-unit shadow-eco-strong border border-eco-100">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-inner flex items-center justify-center ${selectedPin.status === 'RESOLVED' ? 'bg-eco-100 text-eco-600' : 'bg-red-50 text-red-500'}`}>
                  <ShieldAlert size={28} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedPin.type}</span>
                  <h4 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{selectedPin.status} NODE</h4>
                </div>
              </div>
              <button onClick={() => setSelectedPin(null)} className="p-2 text-slate-300 hover:text-slate-900"><X size={24} /></button>
            </div>
            <p className="text-sm font-medium italic text-slate-600 mb-8 border-l-4 border-eco-500 pl-4 leading-relaxed">"{selectedPin.description}"</p>
            <div className="text-[9px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Reported By: {selectedPin.reportedBy}</div>
            <button onClick={() => setSelectedPin(null)} className="w-full py-4 bg-eco-500 text-white rounded-inner font-bold uppercase text-xs tracking-widest shadow-eco hover:bg-eco-600 transition-all active:scale-95">Close Record</button>
          </div>
        </div>
      )}

      {newPin && (
        <div className="fixed inset-x-6 bottom-28 z-[60] animate-in slide-in-from-bottom-10">
          <div className="bg-white p-8 rounded-unit shadow-eco-strong border border-eco-50">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold text-eco-600 uppercase tracking-[0.2em]">Deploy Node Alert</span>
              <button onClick={() => setNewPin(null)} className="p-2 text-slate-300 hover:text-slate-900"><X size={24} /></button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {(['FULL_BIN', 'HAZARD', 'MAINTENANCE'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-3 rounded-inner text-[9px] font-bold uppercase tracking-widest transition-all ${type === t ? 'bg-eco-500 text-white shadow-eco' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sensor detail input..."
              className="w-full bg-slate-50 border border-slate-100 rounded-inner p-4 text-sm mb-6 outline-none focus:border-eco-500 focus:bg-white transition-all"
              rows={3}
              required
            />

            <button onClick={handleSubmit} disabled={submitting || !description} className="w-full py-5 bg-eco-500 text-white rounded-inner font-bold uppercase text-xs tracking-widest shadow-eco hover:bg-eco-600 flex items-center justify-center gap-2 active:scale-95 transition-all">
              {submitting ? <Loader2 className="animate-spin" /> : <><Check size={20} /> Deploy Protocol</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueReporter;
