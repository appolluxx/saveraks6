
import React, { useState, useRef, useEffect } from 'react';
import {
    MapPin,
    Camera,
    Train,
    CreditCard,
    Bus,
    Bike,
    Footprints,
    CheckCircle,
    AlertTriangle,
    Loader2,
    X,
    Navigation,
    Ticket,
    Sparkles,
    ArrowRight,
    RefreshCw,
    Locate
} from 'lucide-react';
import { submitAction } from '../services/api';
import { ActionType } from '../types';
import { compressImage, calculateImageHash } from '../utils/image';
import { useTranslation } from 'react-i18next';

interface CommuteVerificationProps {
    onComplete: () => void;
}

// โรงเรียนสุรศักดิ์มนตรี coordinates
const SCHOOL_LOCATION = {
    lat: 13.8196,
    lng: 100.5613,
    name: 'โรงเรียนสุรศักดิ์มนตรี'
};

const ACCEPTABLE_RADIUS_KM = 0.5; // 500 meters

type TransportType = 'walk' | 'bicycle' | 'public_transport';
type TicketType = 'mrt' | 'bts_rabbit' | 'hop_card' | 'bus' | 'boat' | 'none';

interface LocationData {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
}

const CommuteVerification: React.FC<CommuteVerificationProps> = ({ onComplete }) => {
    const { t } = useTranslation();

    // States
    const [step, setStep] = useState<'select' | 'location' | 'ticket' | 'preview' | 'success'>('select');
    const [transportType, setTransportType] = useState<TransportType | null>(null);
    const [ticketType, setTicketType] = useState<TicketType>('none');
    const [location, setLocation] = useState<LocationData | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [ticketImage, setTicketImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [distance, setDistance] = useState<number | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [showCamera, setShowCamera] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Transport options
    const transportOptions = [
        { id: 'walk' as TransportType, icon: Footprints, label: 'เดินเท้า', points: 15, color: 'text-green-500', bgColor: 'bg-green-500/10' },
        { id: 'bicycle' as TransportType, icon: Bike, label: 'จักรยาน', points: 12, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
        { id: 'public_transport' as TransportType, icon: Bus, label: 'ขนส่งสาธารณะ', points: 10, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    ];

    // Ticket type options
    const ticketOptions = [
        { id: 'mrt' as TicketType, icon: Train, label: 'MRT', color: 'text-blue-600' },
        { id: 'bts_rabbit' as TicketType, icon: CreditCard, label: 'BTS / Rabbit', color: 'text-green-600' },
        { id: 'hop_card' as TicketType, icon: CreditCard, label: 'Hop Card', color: 'text-purple-600' },
        { id: 'bus' as TicketType, icon: Bus, label: 'ตั๋วรถเมล์', color: 'text-orange-600' },
        { id: 'boat' as TicketType, icon: Navigation, label: 'ตั๋วเรือ', color: 'text-cyan-600' },
    ];

    // Calculate distance between two coordinates
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Get current location
    const getCurrentLocation = () => {
        setLoadingLocation(true);
        setLocationError(null);

        if (!navigator.geolocation) {
            setLocationError('ไม่รองรับ GPS บนอุปกรณ์นี้');
            setLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc: LocationData = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };
                setLocation(loc);

                // Calculate distance from school
                const dist = calculateDistance(
                    loc.lat, loc.lng,
                    SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng
                );
                setDistance(dist);
                setLoadingLocation(false);
            },
            (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setLocationError('กรุณาอนุญาตการเข้าถึงตำแหน่ง');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setLocationError('ไม่สามารถระบุตำแหน่งได้');
                        break;
                    case error.TIMEOUT:
                        setLocationError('หมดเวลาการค้นหาตำแหน่ง');
                        break;
                    default:
                        setLocationError('เกิดข้อผิดพลาดในการระบุตำแหน่ง');
                }
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // Start camera for ticket photo
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            setStream(mediaStream);
            setShowCamera(true);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch (err) {
            console.error('Camera error:', err);
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    // Capture ticket photo
    const captureTicket = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        const rawBase64 = canvas.toDataURL('image/jpeg', 0.9);
        const compressed = await compressImage(rawBase64, 1.0);
        setTicketImage(compressed);
        stopCamera();
    };

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            const compressed = await compressImage(base64, 1.0);
            setTicketImage(compressed);
        };
        reader.readAsDataURL(file);
    };

    // Submit verification
    const handleSubmit = async () => {
        if (!transportType || !location) return;
        setProcessing(true);

        try {
            const actionTypeMap: Record<TransportType, ActionType> = {
                walk: ActionType.WALK,
                bicycle: ActionType.BICYCLE,
                public_transport: ActionType.PUBLIC_TRANSPORT
            };

            const pointsMap: Record<TransportType, number> = {
                walk: 15,
                bicycle: 12,
                public_transport: 10
            };

            let imageHash: string | undefined;
            if (ticketImage) {
                imageHash = await calculateImageHash(ticketImage);
            }

            await submitAction({
                type: actionTypeMap[transportType],
                description: `เดินทางมาโรงเรียนด้วย${transportOptions.find(o => o.id === transportType)?.label} ${ticketType !== 'none' ? `(${ticketOptions.find(o => o.id === ticketType)?.label})` : ''}`,
                imageBase64: ticketImage || undefined,
                imageHash,
                locationLat: location.lat,
                locationLng: location.lng,
                ticketType: ticketType !== 'none' ? ticketType : undefined,
                distanceKm: distance,
                srtOverride: pointsMap[transportType]
            });

            setStep('success');
        } catch (err: any) {
            console.error('Submit error:', err);
        } finally {
            setProcessing(false);
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, [stream]);

    // Auto-get location when moving to location step
    useEffect(() => {
        if (step === 'location' && !location) {
            getCurrentLocation();
        }
    }, [step]);

    const isNearSchool = distance !== null && distance <= ACCEPTABLE_RADIUS_KM;

    return (
        <div className="space-y-6 pb-24 px-6 pt-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col gap-0.5">
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-display uppercase italic">
                    หลักฐานการเดินทาง
                </h2>
                <p className="text-eco-500 font-mono text-[10px] tracking-[0.3em] uppercase font-bold">
                    Commute Verification System
                </p>
            </div>

            {/* Step 1: Select Transport Type */}
            {step === 'select' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                        คุณเดินทางมาโรงเรียนด้วยวิธีใด?
                    </h3>

                    <div className="space-y-3">
                        {transportOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = transportType === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setTransportType(option.id)}
                                    className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${isSelected
                                            ? 'border-eco-500 bg-eco-50 dark:bg-eco-500/20 shadow-eco'
                                            : 'border-zinc-200 dark:border-zinc-700 hover:border-eco-300 bg-white dark:bg-zinc-800'
                                        }`}
                                >
                                    <div className={`w-14 h-14 rounded-xl ${option.bgColor} flex items-center justify-center`}>
                                        <Icon className={`w-7 h-7 ${option.color}`} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className={`font-bold text-lg ${isSelected ? 'text-eco-700 dark:text-eco-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                            {option.label}
                                        </p>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                            +{option.points} คะแนน
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <CheckCircle className="w-6 h-6 text-eco-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {transportType && (
                        <button
                            onClick={() => setStep('location')}
                            className="w-full py-4 bg-eco-500 text-white font-bold rounded-2xl hover:bg-eco-600 transition-all shadow-eco flex items-center justify-center gap-2"
                        >
                            <span>ถัดไป</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}

            {/* Step 2: Location Verification */}
            {step === 'location' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-eco-500" />
                        ยืนยันตำแหน่งของคุณ
                    </h3>

                    {/* Location Card */}
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 shadow-sm">
                        {loadingLocation ? (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <Loader2 className="w-12 h-12 text-eco-500 animate-spin" />
                                <p className="text-zinc-600 dark:text-zinc-400 font-medium">กำลังค้นหาตำแหน่ง...</p>
                            </div>
                        ) : locationError ? (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <AlertTriangle className="w-12 h-12 text-amber-500" />
                                <p className="text-amber-600 dark:text-amber-400 font-medium text-center">{locationError}</p>
                                <button
                                    onClick={getCurrentLocation}
                                    className="px-6 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-xl font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    ลองอีกครั้ง
                                </button>
                            </div>
                        ) : location ? (
                            <div className="space-y-4">
                                {/* Map Preview Placeholder */}
                                <div className="relative h-48 bg-gradient-to-br from-eco-100 to-teal-100 dark:from-eco-900/30 dark:to-teal-900/30 rounded-xl overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <MapPin className="w-12 h-12 text-eco-500 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                พิกัด: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Accuracy indicator */}
                                    <div className="absolute bottom-2 left-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-lg px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                        ความแม่นยำ: ±{location.accuracy.toFixed(0)}m
                                    </div>
                                </div>

                                {/* Distance from school */}
                                <div className={`p-4 rounded-xl ${isNearSchool ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30' : 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isNearSchool ? 'bg-green-500' : 'bg-amber-500'}`}>
                                            {isNearSchool ? <CheckCircle className="w-5 h-5 text-white" /> : <Navigation className="w-5 h-5 text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-bold ${isNearSchool ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                                {isNearSchool ? 'คุณอยู่ใกล้โรงเรียน!' : 'คุณยังอยู่ไกลจากโรงเรียน'}
                                            </p>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                                ห่างจาก{SCHOOL_LOCATION.name} {distance ? (distance < 1 ? `${(distance * 1000).toFixed(0)} เมตร` : `${distance.toFixed(2)} กม.`) : '...'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Refresh location */}
                                <button
                                    onClick={getCurrentLocation}
                                    className="w-full py-3 bg-zinc-100 dark:bg-zinc-700 rounded-xl font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Locate className="w-4 h-4" />
                                    รีเฟรชตำแหน่ง
                                </button>
                            </div>
                        ) : null}
                    </div>

                    {/* Continue button */}
                    {location && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep('select')}
                                className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all"
                            >
                                ย้อนกลับ
                            </button>
                            <button
                                onClick={() => {
                                    if (transportType === 'public_transport') {
                                        setStep('ticket');
                                    } else {
                                        setStep('preview');
                                    }
                                }}
                                className="flex-1 py-4 bg-eco-500 text-white font-bold rounded-2xl hover:bg-eco-600 transition-all shadow-eco flex items-center justify-center gap-2"
                            >
                                <span>ถัดไป</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Ticket Verification (for public transport) */}
            {step === 'ticket' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-eco-500" />
                        ถ่ายรูปตั๋ว/บัตรโดยสาร
                    </h3>

                    {/* Ticket Type Selection */}
                    <div className="grid grid-cols-3 gap-2">
                        {ticketOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = ticketType === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setTicketType(option.id)}
                                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${isSelected
                                            ? 'border-eco-500 bg-eco-50 dark:bg-eco-500/20'
                                            : 'border-zinc-200 dark:border-zinc-700 hover:border-eco-300 bg-white dark:bg-zinc-800'
                                        }`}
                                >
                                    <Icon className={`w-6 h-6 ${option.color}`} />
                                    <span className={`text-xs font-medium ${isSelected ? 'text-eco-700 dark:text-eco-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                        {option.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Camera / Upload Section */}
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        {showCamera ? (
                            <div className="relative">
                                <video ref={videoRef} autoPlay playsInline className="w-full aspect-[4/3] object-cover" />
                                <canvas ref={canvasRef} className="hidden" />
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                                    <button
                                        onClick={stopCamera}
                                        className="p-3 bg-zinc-900/80 backdrop-blur-sm rounded-full text-white hover:bg-zinc-800 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={captureTicket}
                                        className="p-4 bg-eco-500 rounded-full text-white hover:bg-eco-600 transition-colors shadow-lg"
                                    >
                                        <Camera className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        ) : ticketImage ? (
                            <div className="relative">
                                <img src={ticketImage} alt="Ticket" className="w-full aspect-[4/3] object-contain bg-zinc-100 dark:bg-zinc-900" />
                                <button
                                    onClick={() => setTicketImage(null)}
                                    className="absolute top-3 right-3 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="p-8 flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-eco-50 dark:bg-eco-500/10 rounded-2xl flex items-center justify-center">
                                    <Camera className="w-10 h-10 text-eco-500" />
                                </div>
                                <p className="text-zinc-600 dark:text-zinc-400 text-center text-sm">
                                    ถ่ายรูปหรืออัปโหลดรูปตั๋ว/บัตรโดยสาร<br />
                                    <span className="text-xs text-zinc-400">เพื่อยืนยันการใช้ขนส่งสาธารณะ</span>
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={startCamera}
                                        className="px-5 py-2.5 bg-eco-500 text-white font-medium rounded-xl hover:bg-eco-600 transition-colors flex items-center gap-2"
                                    >
                                        <Camera className="w-4 h-4" />
                                        ถ่ายรูป
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                                    >
                                        อัปโหลด
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Skip option */}
                    <p className="text-center text-xs text-zinc-400">
                        ถ้าไม่มีตั๋ว สามารถข้ามขั้นตอนนี้ได้
                    </p>

                    {/* Continue buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('location')}
                            className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all"
                        >
                            ย้อนกลับ
                        </button>
                        <button
                            onClick={() => setStep('preview')}
                            className="flex-1 py-4 bg-eco-500 text-white font-bold rounded-2xl hover:bg-eco-600 transition-all shadow-eco flex items-center justify-center gap-2"
                        >
                            <span>{ticketImage ? 'ถัดไป' : 'ข้าม'}</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Preview & Confirm */}
            {step === 'preview' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-eco-500" />
                        ตรวจสอบข้อมูล
                    </h3>

                    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 space-y-4">
                        {/* Transport Type */}
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${transportOptions.find(o => o.id === transportType)?.bgColor} flex items-center justify-center`}>
                                {transportType && React.createElement(transportOptions.find(o => o.id === transportType)?.icon || Footprints, {
                                    className: `w-6 h-6 ${transportOptions.find(o => o.id === transportType)?.color}`
                                })}
                            </div>
                            <div>
                                <p className="font-bold text-zinc-800 dark:text-zinc-200">
                                    {transportOptions.find(o => o.id === transportType)?.label}
                                </p>
                                <p className="text-sm text-eco-500 font-medium">
                                    +{transportOptions.find(o => o.id === transportType)?.points} คะแนน
                                </p>
                            </div>
                        </div>

                        {/* Location info */}
                        {location && (
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-xl">
                                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                    <MapPin className="w-4 h-4" />
                                    <span>
                                        ห่างจากโรงเรียน {distance ? (distance < 1 ? `${(distance * 1000).toFixed(0)} เมตร` : `${distance.toFixed(2)} กม.`) : '...'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Ticket image */}
                        {ticketImage && (
                            <div className="rounded-xl overflow-hidden">
                                <img src={ticketImage} alt="Ticket" className="w-full aspect-video object-contain bg-zinc-100 dark:bg-zinc-900" />
                                {ticketType !== 'none' && (
                                    <div className="p-3 bg-zinc-50 dark:bg-zinc-700/50 text-center">
                                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                            {ticketOptions.find(o => o.id === ticketType)?.label}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submit buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                if (transportType === 'public_transport') {
                                    setStep('ticket');
                                } else {
                                    setStep('location');
                                }
                            }}
                            className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all"
                        >
                            ย้อนกลับ
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="flex-1 py-4 bg-eco-500 text-white font-bold rounded-2xl hover:bg-eco-600 transition-all shadow-eco flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>กำลังบันทึก...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>ยืนยัน</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 5: Success */}
            {step === 'success' && (
                <div className="space-y-6 animate-in zoom-in duration-500 text-center py-12">
                    <div className="w-24 h-24 bg-eco-100 dark:bg-eco-500/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-14 h-14 text-eco-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-zinc-800 dark:text-white mb-2">
                            บันทึกสำเร็จ!
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400">
                            คุณได้รับ +{transportOptions.find(o => o.id === transportType)?.points} คะแนน
                        </p>
                    </div>
                    <button
                        onClick={onComplete}
                        className="px-8 py-4 bg-eco-500 text-white font-bold rounded-2xl hover:bg-eco-600 transition-all shadow-eco"
                    >
                        กลับหน้าหลัก
                    </button>
                </div>
            )}
        </div>
    );
};

export default CommuteVerification;
