import React, { useState, useRef } from 'react';
import { Camera, ArrowLeft } from 'lucide-react';
import WasteSortingGuide from '../components/WasteSortingGuide';
import { api } from '../../../services/api';

const VisionUnit: React.FC<{ user: any; onBack: () => void }> = ({ user, onBack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [showGuide, setShowGuide] = useState(false);

    React.useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera error:", err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const takePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoRef.current, 0, 0);
            const imageBase64 = canvas.toDataURL('image/jpeg');
            setCapturedImage(imageBase64);
            setShowGuide(true);
        }
    };

    const handleSubmit = async (analysis: any) => {
        try {
            await api.post('/api/actions/submit', {
                userId: user.id,
                actionType: 'waste_sorting',
                description: `Sorted ${analysis.items.length} items`,
                imageBase64: capturedImage,
                sortingAnalysis: analysis
            });
            alert('Action Submitted Successfully! +10 Points');
            onBack();
        } catch (error) {
            alert('Failed to submit action');
        }
    };

    return (
        <div className="h-screen bg-black flex flex-col">
            {showGuide && capturedImage ? (
                <WasteSortingGuide
                    capturedImage={capturedImage}
                    onSubmit={handleSubmit}
                    onRetake={() => {
                        setShowGuide(false);
                        setCapturedImage(null);
                    }}
                    onCancel={onBack}
                />
            ) : (
                <>
                    <div className="flex-1 relative">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={onBack}
                            className="absolute top-4 left-4 p-2 bg-black/50 rounded-full text-white"
                        >
                            <ArrowLeft />
                        </button>
                    </div>

                    <div className="bg-black p-6 flex justify-center pb-12">
                        <button
                            onClick={takePhoto}
                            className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                            <Camera className="w-8 h-8 text-black" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default VisionUnit;
