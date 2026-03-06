import React, { useState, useEffect, useRef } from 'react';
import './MusicPlayer.css';

const TRACKS = [
    `${import.meta.env.BASE_URL}music/RADWIMPS - デート.mp3`,
    `${import.meta.env.BASE_URL}music/C418 - Alpha.mp3`,
    `${import.meta.env.BASE_URL}music/Martin Ermen - River Flows In You.mp3`,
    `${import.meta.env.BASE_URL}music/Roger Subirana - Between Worlds.mp3`
];

// Final parameters provided by the user
const PARAMS = {
    "particleCount": 200,
    "baseSize": 2,
    "sizeVariance": 1,
    "baseAlpha": 1,
    "baseSpeed": 0.005,
    "audioRadiusMultiplier": 39,
    "audioSizeMultiplier": 5,
    "audioAlphaMultiplier": 3,
    "audioSpeedMultiplier": 0.028,
    "hueCenter": 345,
    "hueVariance": 15,
    "saturation": 90,
    "lightness": 80,
    "innerRadiusClearance": 15
};

const MusicPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [trackIndex, setTrackIndex] = useState(0);

    const audioRef = useRef(null);
    const canvasRef = useRef(null);

    // Audio Context refs
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationRef = useRef(null);

    // Particles state ref
    const particlesRef = useRef([]);

    // Initialize Particles
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const size = 200;
        canvas.width = size;
        canvas.height = size;

        const pArray = [];
        const centerX = size / 2;
        const centerY = size / 2;

        for (let i = 0; i < PARAMS.particleCount; i++) {
            pArray.push({
                x: centerX,
                y: centerY,
                angle: Math.random() * Math.PI * 2,
                radius: PARAMS.innerRadiusClearance + Math.random() * (size / 2 - 20 - PARAMS.innerRadiusClearance),
                size: PARAMS.baseSize + Math.random() * PARAMS.sizeVariance,
                baseAlpha: PARAMS.baseAlpha * (0.6 + Math.random() * 0.4),
                speed: PARAMS.baseSpeed * (0.5 + Math.random() * 1.5),
                driftBaseX: Math.random() * Math.PI * 2,
                driftBaseY: Math.random() * Math.PI * 2,
                driftSpeed: Math.random() * 0.01 + 0.005
            });
        }
        particlesRef.current = pArray;
    }, []);

    // Handle auto-advance
    useEffect(() => {
        const audioEl = audioRef.current;
        if (!audioEl) return;

        const handleEnded = () => {
            setTrackIndex((prev) => (prev + 1) % TRACKS.length);
        };

        audioEl.addEventListener('ended', handleEnded);
        return () => audioEl.removeEventListener('ended', handleEnded);
    }, []);

    // Handle TRACK switching
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.src = TRACKS[trackIndex];
            if (isPlaying) {
                audioRef.current.play().catch(e => console.log('Audio play failed', e));
            }
        }
    }, [trackIndex]);

    // Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        const audioEl = audioRef.current;
        if (!canvas || !audioEl) return;
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const centerX = size / 2;
        const centerY = size / 2;

        const renderFrame = () => {
            animationRef.current = requestAnimationFrame(renderFrame);
            ctx.clearRect(0, 0, size, size);

            let dataArray = null;
            if (analyserRef.current && isPlaying) {
                const bufferLength = analyserRef.current.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
                analyserRef.current.getByteFrequencyData(dataArray);
            }

            const particles = particlesRef.current;
            const maxDist = size / 2;

            particles.forEach((p, index) => {
                let pFreq = 0;
                if (dataArray) {
                    const binIndex = index % dataArray.length;
                    pFreq = dataArray[binIndex] / 256;
                }

                const targetSpeed = isPlaying ? p.speed + (pFreq * PARAMS.audioSpeedMultiplier) : p.speed;
                p.angle += targetSpeed;

                p.driftBaseX += p.driftSpeed;
                p.driftBaseY += p.driftSpeed;
                const driftX = Math.cos(p.driftBaseX) * 10;
                const driftY = Math.sin(p.driftBaseY) * 10;

                const audioOffset = isPlaying ? (pFreq * PARAMS.audioRadiusMultiplier) : 0;
                const currentRadius = p.radius + audioOffset;

                const rawX = centerX + Math.cos(p.angle) * currentRadius + driftX;
                const rawY = centerY + Math.sin(p.angle) * currentRadius + driftY;

                p.x = rawX;
                p.y = rawY;

                const distFromCenter = Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
                const edgeFade = Math.max(0, 1 - (distFromCenter / (maxDist - 10)));

                if (edgeFade > 0) {
                    ctx.beginPath();
                    const currentSize = Math.max(0.1, p.size + (isPlaying ? pFreq * PARAMS.audioSizeMultiplier : 0));
                    ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);

                    const audioAlpha = isPlaying ? (pFreq * PARAMS.audioAlphaMultiplier) : 0;
                    const finalAlpha = Math.min(1, PARAMS.baseAlpha * 0.5 + audioAlpha) * edgeFade;

                    ctx.fillStyle = `hsla(${PARAMS.hueCenter}, ${PARAMS.saturation}%, ${PARAMS.lightness}%, ${finalAlpha})`;
                    ctx.shadowBlur = isPlaying ? 3 + (pFreq * 5) : 2;
                    ctx.shadowColor = `hsla(${PARAMS.hueCenter}, ${PARAMS.saturation}%, ${PARAMS.lightness}%, ${finalAlpha * 0.5})`;

                    ctx.fill();
                }
            });
        };

        renderFrame();
        return () => cancelAnimationFrame(animationRef.current);
    }, [isPlaying]);

    const initializeAudioCtx = () => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtxRef.current = new AudioContext();
            analyserRef.current = audioCtxRef.current.createAnalyser();
            analyserRef.current.smoothingTimeConstant = 0.85;
            analyserRef.current.fftSize = 64;

            if (audioRef.current) {
                sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
                sourceRef.current.connect(analyserRef.current);
                analyserRef.current.connect(audioCtxRef.current.destination);
            }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;

        initializeAudioCtx();

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            // Start playing
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.error('Audio play failed:', e);
                    // If play fails, reset state to allow another attempt
                    setIsPlaying(false);
                });
            }
            setIsPlaying(true);
        }
    };

    const nextTrack = (e) => {
        if (e) e.preventDefault();
        if (!audioRef.current) return;

        initializeAudioCtx();

        setTrackIndex((prev) => (prev + 1) % TRACKS.length);
        setIsPlaying(true);
    };

    return (
        <div
            className="music-player-particles"
            onClick={togglePlay}
            onDoubleClick={nextTrack}
            title={isPlaying ? "Click to Pause / Double-Click for Next Track" : "Click to Play"}
        >
            <audio ref={audioRef} src={TRACKS[trackIndex]} crossOrigin="anonymous" />
            <canvas ref={canvasRef}></canvas>
        </div>
    );
};

export default MusicPlayer;
