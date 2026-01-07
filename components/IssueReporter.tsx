
import React, { useState, useEffect } from 'react';
import { MapPin, Check, X, ShieldAlert, CheckCircle2, Crosshair, Loader2 } from 'lucide-react';
import { getPins, deployNode, getProfile } from '../services/api';
import type { MapPin as PinType } from '../types';

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

  // Map interaction state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation(); // Stop page scrolling
    const zoomSensitivity = 0.001;
    const newScale = Math.min(Math.max(1, scale - e.deltaY * zoomSensitivity), 4);
    setScale(newScale);
  };

  // Touch handlers for mobile pan/zoom would go here (simplified for now to just pan)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handlePinClick = (e: React.MouseEvent, pin: PinType) => {
    e.stopPropagation();
    setSelectedPin(pin);
    setNewPin(null);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only register click if we aren't dragging significantly
    if (isDragging) return;

    if (selectedPin) { setSelectedPin(null); return; }

    // We need to calculate click position relative to the scaled/translated image
    const rect = e.currentTarget.getBoundingClientRect();

    // Reverse the transform to get the original 0-100% coordinates
    // This is complex because we need the click relative to the image content, not the viewport
    // Simplified approach: rely on the click target being the container
    // But since we are transforming the INNER div, we should attach clicking to THAT.

    // Correct approach:
    // The click coordinates (clientX/Y) are screen coordinates.
    // The image's displayed rectangle (rect) includes the transform.
    // So (clientX - rect.left) / rect.width gives us the % relative to the SCALED image.
    // This is actually what we want for pinning, because the pins are also inside the scaled container.

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNewPin({ x, y });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin) return;
    setSubmitting(true);

    try {
      await deployNode({
        lat: newPin.x,
        lng: newPin.y,
        type,
        description
      });
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

  // We wrap the map content in a transformable div
  return (
    <div className="space-y-8 px-6 pt-6 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold text-eco-600 uppercase tracking-[0.4em]">Node Mapping</span>
        <h2 className="text-3xl font-bold text-slate-900 font-display italic uppercase tracking-tighter leading-none">Campus Matrix</h2>
      </div>

      <div
        className="bg-white p-2 rounded-unit shadow-eco relative overflow-hidden group border border-eco-50 h-[80vh]" // Fixed height container
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
      >
        <div
          className="w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing bg-slate-100 rounded-inner"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Apply transform here */}
          <div
            className="w-full h-full relative origin-top-left transition-transform duration-75 ease-linear"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              // Using style for performance
            }}
            onClick={(e) => {
              // Verify we didn't just drag
              // Simple check: We can use a ref to track drag distance, or just check 'isDragging' state?
              // The issue is onClick fires after onMouseUp.
              // Let's settle for a simplified click logic that just checks if we are "dragging" state-wise.
              // However, isDragging is set to false in onMouseUp. 
              // Better is to allow pinning only if not dragged far. 
              // For MVP: Let's assume clicks are quick and drags take time/distance.
              handleMapClick(e);
            }}
          >
            <img
              src={MAP_IMAGE}
              alt="Campus Map"
              className="w-full h-full object-cover pointer-events-none" // prevent img drag
              draggable={false}
            />

            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #0f172a 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            {pins.map(pin => (
              <button
                key={pin.id}
                onClick={(e) => {
                  e.stopPropagation(); // Don't trigger map click
                  handlePinClick(e, pin);
                }}
                className={`absolute w-10 h-10 -ml-5 -mt-5 flex items-center justify-center transition-all hover:scale-125 ${pin.status === 'RESOLVED' ? 'text-eco-500' : 'text-red-500'
                  }`}
                style={{ left: `${pin.lat}%`, top: `${pin.lng}%`, transform: `scale(${1 / scale})` }} // Counter-scale pins to keep size consistent? Or let them grow? Let them grow for now for visibility, or scale inversely.
              >
                {/*  Inverse scaling for pins keeps them readable. style={{ transform: `scale(${1/scale})` }} */}
                <div className="relative" style={{ transform: `scale(${1 / scale})` }}>
                  <div className="absolute inset-0 bg-current opacity-20 rounded-full animate-ping"></div>
                  {pin.status === 'RESOLVED' ? <CheckCircle2 size={24} strokeWidth={3} /> : <MapPin fill="currentColor" size={24} />}
                </div>
              </button>
            ))}

            {newPin && (
              <div
                className="absolute w-12 h-12 -ml-6 -mt-6 text-eco-600 animate-pulse pointer-events-none flex items-center justify-center"
                style={{ left: `${newPin.x}%`, top: `${newPin.y}%` }}
              >
                <div className="relative" style={{ transform: `scale(${1 / scale})` }}>
                  <div className="absolute inset-0 border-2 border-eco-500 rounded-full animate-spin"></div>
                  <Crosshair size={32} strokeWidth={3} className="text-eco-500" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold text-slate-900 shadow-sm flex items-center gap-2 pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-eco-500 animate-pulse" />
          SENSORS ACTIVE
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <button className="w-10 h-10 bg-white rounded-full shadow-eco flex items-center justify-center font-bold text-slate-700 hover:bg-slate-50 active:scale-95" onMouseUp={() => setScale(s => Math.min(s + 0.5, 4))}>+</button>
          <button className="w-10 h-10 bg-white rounded-full shadow-eco flex items-center justify-center font-bold text-slate-700 hover:bg-slate-50 active:scale-95" onMouseUp={() => setScale(s => Math.max(s - 0.5, 1))}>-</button>
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
