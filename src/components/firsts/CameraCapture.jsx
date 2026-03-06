import React, { useRef, useState, useCallback, useEffect } from 'react';
import './FirstsTimeline.css';

export default function CameraCapture({ onCapture, onCancel }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [error, setError] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // default to rear camera

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const startCamera = useCallback(async (mode) => {
        stopCamera();
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Camera error:', err);
            // If environment fails (e.g., on PC), fallback to user camera
            if (mode === 'environment') {
                console.log('Falling back to user camera');
                setFacingMode('user');
                try {
                    const fallbackStream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } }
                    });
                    streamRef.current = fallbackStream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = fallbackStream;
                    }
                } catch (fallbackErr) {
                    setError('无法访问摄像头，请确保浏览器已授权并运行在 HTTPS 环境中。');
                }
            } else {
                setError('无法访问摄像头，请确保浏览器已授权并运行在 HTTPS 环境中。');
            }
        }
    }, [stopCamera]);

    useEffect(() => {
        // Only run when facingMode intended changes
        startCamera(facingMode);
        return () => stopCamera();
    }, [facingMode, startCamera, stopCamera]);

    const handleCancel = useCallback(() => {
        stopCamera();
        onCancel();
    }, [stopCamera, onCancel]);

    const handleSwitchCamera = useCallback(() => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    }, []);

    const capture = useCallback(() => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');

        // Only flip horizontally if using front camera
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        stopCamera();
        onCapture(dataUrl);
    }, [onCapture, stopCamera, facingMode]);

    // Check if on mobile device (simple heuristic)
    const isMobile = window.innerWidth <= 600 || /Mobi|Android/i.test(navigator.userAgent);

    return (
        <div className={`camera-capture-container ${isMobile ? 'mobile-fullscreen' : ''}`}>
            {error ? (
                <div className="camera-error">
                    <p>{error}</p>
                    <button type="button" onClick={handleCancel} className="btn-cancel-camera">返回</button>
                </div>
            ) : (
                <div className="camera-view">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                    />

                    {/* Capture Frame Overlay */}
                    {!isMobile && (
                        <div className="camera-overlay">
                            <div className="camera-frame"></div>
                        </div>
                    )}

                    <div className="camera-controls">
                        <button type="button" className="btn-cancel-camera" onClick={handleCancel} title="取消">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        <button type="button" className="btn-capture" onClick={capture} title="拍照">
                            <div className="shutter-inner"></div>
                        </button>

                        {isMobile ? (
                            <button type="button" className="btn-switch-camera" onClick={handleSwitchCamera} title="翻转镜头">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 4v6h-6"></path>
                                    <path d="M1 20v-6h6"></path>
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                </svg>
                            </button>
                        ) : (
                            <div style={{ width: '44px' }}></div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
