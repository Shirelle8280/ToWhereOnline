import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

// --- Particle System Component ---
function ParticleSystem({ mousePos, config }) {
  const meshRef = useRef();
  const [particleData, setParticleData] = useState(null);
  const { count, textRatio, textOpacityMin, textOpacityMax, bgOpacityMin, bgOpacityMax, textSize, bgSize, glowIntensity } = config;

  const curPos = useMemo(() => new Float32Array(count * 3), [count]);
  const vels = useMemo(() => new Float32Array(count * 3), [count]);

  // We only regenerate text points and spatial distribution if count or textRatio changes
  useEffect(() => {
    const generateParticles = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 2400;
      canvas.height = 1200;

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = 'italic bold 450px "Pacifico", "Brush Script MT", cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '45px';
      ctx.fillText('2026', canvas.width / 2, canvas.height / 2);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const textPoints = [];
      const step = 4;

      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const idx = (y * canvas.width + x) * 4;
          if (imageData[idx] > 50) {
            textPoints.push({
              x: (x / canvas.width - 0.5) * 20,
              y: (0.5 - y / canvas.height) * 10,
              alpha: imageData[idx] / 255
            });
          }
        }
      }

      const targetPositions = new Float32Array(count * 3);
      const isTextArray = new Float32Array(count); // 1.0 for text, 0.0 for bg
      const randomAlphas = new Float32Array(count); // store per-particle random component

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const isText = Math.random() < textRatio;
        isTextArray[i] = isText ? 1.0 : 0.0;
        randomAlphas[i] = Math.random();

        if (isText && textPoints.length > 0) {
          const p = textPoints[Math.floor(Math.random() * textPoints.length)];
          const spread = (1.1 - p.alpha) * 0.3;
          targetPositions[i3] = p.x + (Math.random() - 0.5) * spread;
          targetPositions[i3 + 1] = p.y + (Math.random() - 0.5) * spread;
          targetPositions[i3 + 2] = (Math.random() - 0.5) * 0.2;
        } else {
          targetPositions[i3] = (Math.random() - 0.5) * 45;
          targetPositions[i3 + 1] = (Math.random() - 0.5) * 28;
          targetPositions[i3 + 2] = (Math.random() - 0.5) * 10;
        }
      }

      // Initialize curPos with targetPositions immediately to skip the fly-in effect
      curPos.set(targetPositions);

      setParticleData({ targetPositions, isTextArray, randomAlphas });
    };

    generateParticles();
  }, [count, textRatio, curPos]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uGlow: { value: glowIntensity },
    uTextSize: { value: textSize },
    uBgSize: { value: bgSize },
    uTextOpacityMin: { value: textOpacityMin },
    uTextOpacityMax: { value: textOpacityMax },
    uBgOpacityMin: { value: bgOpacityMin },
    uBgOpacityMax: { value: bgOpacityMax }
  }), []);

  useEffect(() => {
    uniforms.uGlow.value = glowIntensity;
    uniforms.uTextSize.value = textSize;
    uniforms.uBgSize.value = bgSize;
    uniforms.uTextOpacityMin.value = textOpacityMin;
    uniforms.uTextOpacityMax.value = textOpacityMax;
    uniforms.uBgOpacityMin.value = bgOpacityMin;
    uniforms.uBgOpacityMax.value = bgOpacityMax;
  }, [glowIntensity, textSize, bgSize, textOpacityMin, textOpacityMax, bgOpacityMin, bgOpacityMax]);

  useFrame((state) => {
    if (!meshRef.current || !particleData) return;
    const attrPos = meshRef.current.geometry.attributes.position;
    const mouse = mousePos.current;
    uniforms.uTime.value = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const tx = particleData.targetPositions[i3];
      const ty = particleData.targetPositions[i3 + 1];
      const tz = particleData.targetPositions[i3 + 2];

      vels[i3] += (tx - curPos[i3]) * 0.035;
      vels[i3 + 1] += (ty - curPos[i3 + 1]) * 0.035;
      vels[i3 + 2] += (tz - curPos[i3 + 2]) * 0.035;

      const dx = curPos[i3] - mouse.x;
      const dy = curPos[i3 + 1] - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1.0) {
        const ease = Math.pow(1 - dist / 1.0, 2);
        vels[i3] += dx * ease * 0.1;
        vels[i3 + 1] += dy * ease * 0.1;
      }

      curPos[i3] += vels[i3];
      curPos[i3 + 1] += vels[i3 + 1];
      curPos[i3 + 2] += vels[i3 + 2];
      vels[i3] *= 0.88;
      vels[i3 + 1] *= 0.88;
      vels[i3 + 2] *= 0.88;
    }
    attrPos.needsUpdate = true;
  });

  if (!particleData) return null;

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={curPos} itemSize={3} />
        <bufferAttribute attach="attributes-isText" count={count} array={particleData.isTextArray} itemSize={1} />
        <bufferAttribute attach="attributes-randomAlpha" count={count} array={particleData.randomAlphas} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          uniform float uTextSize;
          uniform float uBgSize;
          uniform float uTime;
          attribute float isText;
          attribute float randomAlpha;
          varying float vFinalOpacity;
          
          uniform float uTextOpacityMin;
          uniform float uTextOpacityMax;
          uniform float uBgOpacityMin;
          uniform float uBgOpacityMax;

          void main() {
            float size = isText > 0.5 ? uTextSize : uBgSize;
            float opMin = isText > 0.5 ? uTextOpacityMin : uBgOpacityMin;
            float opMax = isText > 0.5 ? uTextOpacityMax : uBgOpacityMax;
            
            // Pulse effect for some extra geekyness
            float pulse = 0.8 + 0.2 * sin(uTime * 2.0 + randomAlpha * 6.28);
            vFinalOpacity = (opMin + randomAlpha * (opMax - opMin)) * pulse;

            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (size + randomAlpha * 0.03) * (180.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform float uGlow;
          varying float vFinalOpacity;
          void main() {
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            if (r > 1.0) discard;
            float alpha = pow(1.0 - r, 1.5);
            gl_FragColor = vec4(1.0, 1.1, 1.2, alpha * vFinalOpacity * uGlow);
          }
        `}
      />
    </points>
  );
}

// --- UI Components ---
const Panel = ({ children, onClose }) => (
  <motion.div
    initial={{ x: 300, y: '-50%', opacity: 0 }}
    animate={{ x: 0, y: '-50%', opacity: 1 }}
    exit={{ x: 300, y: '-50%', opacity: 0 }}
    style={{
      position: 'absolute', top: '50%', right: '0px', width: '280px',
      background: 'rgba(5, 12, 24, 0.9)', border: '1px solid rgba(78, 205, 196, 0.3)',
      borderRight: 'none',
      borderRadius: '16px 0 0 16px', padding: '20px', pointerEvents: 'auto', zIndex: 1000,
      backdropFilter: 'blur(20px)', boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
      fontFamily: '"Rajdhani", sans-serif', color: '#fff'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '18px' }}>
      <span style={{ fontSize: '14px', fontWeight: 600, color: '#4ECDC4', letterSpacing: '2px' }}>PARTICLE CALIBRATOR</span>
    </div>
    {children}
  </motion.div>
);

const Slider = ({ label, value, min, max, step, onChange }) => (
  <div style={{ marginBottom: '14px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginBottom: '4px', letterSpacing: '1px' }}>
      <span>{label}</span>
      <span style={{ color: '#4ECDC4', fontWeight: 600 }}>{typeof value === 'number' ? value.toFixed(step < 0.1 ? 3 : 2) : value}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      style={{
        width: '100%', height: '3px', appearance: 'none', background: 'rgba(255,255,255,0.1)',
        borderRadius: '2px', outline: 'none', cursor: 'pointer', accentColor: '#4ECDC4'
      }}
    />
  </div>
);

// --- Config Key for Supabase ---
const CONFIG_KEY = 'particle_config';
const DEFAULT_CONFIG = {
  count: 6000,
  textRatio: 0.55,
  textOpacityMin: 0.2,
  textOpacityMax: 0.9,
  bgOpacityMin: 0.1,
  bgOpacityMax: 0.6,
  textSize: 0.1,
  bgSize: 0.06,
  glowIntensity: 4.0
};

// --- Main App ---
export default function KeywordsParticle() {
  const mousePos = useRef({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef(null);
  const [particleKey, setParticleKey] = useState(0);

  // --- Load config: localStorage first, then try Supabase ---
  useEffect(() => {
    const loadConfig = async () => {
      // 1. Always load from localStorage first (instant)
      try {
        const local = localStorage.getItem(CONFIG_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          setConfig(prev => ({ ...prev, ...parsed }));
          console.log('✅ Particle config loaded from localStorage');
        }
      } catch (e) { /* ignore parse errors */ }

      // 2. Try Supabase as authoritative source (overrides localStorage if exists)
      try {
        const { data } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', CONFIG_KEY)
          .single();

        if (data && data.value) {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          setConfig(prev => ({ ...prev, ...parsed }));
          localStorage.setItem(CONFIG_KEY, JSON.stringify(parsed));
          console.log('✅ Particle config synced from Supabase');
        }
      } catch (e) {
        console.log('Supabase load skipped (table may not exist)');
      }
      setLoaded(true);
    };
    loadConfig();
  }, []);

  // --- Debounced save: always localStorage, best-effort Supabase ---
  useEffect(() => {
    if (!loaded) return;

    // Always save to localStorage immediately
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('app_config')
          .upsert({ key: CONFIG_KEY, value: config }, { onConflict: 'key' });

        if (error) {
          // Supabase failed but localStorage succeeded
          console.log('Supabase save skipped:', error.message);
          setSaveStatus('saved'); // Still show saved since localStorage works
          setTimeout(() => setSaveStatus('idle'), 1500);
        } else {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 1500);
        }
      } catch (e) {
        // localStorage already saved, so show success
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      }
    }, 600);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [config, loaded]);


  useEffect(() => {
    const handleMouse = (e) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 10,
        y: (0.5 - e.clientY / window.innerHeight) * 5
      };
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  const update = (key, val) => setConfig(prev => ({ ...prev, [key]: val }));

  const copyConfig = () => {
    const text = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(text);
    alert('Configuration copied to clipboard!');
  };

  const statusDot = {
    idle: { color: 'transparent', text: '' },
    saving: { color: '#f0ad4e', text: 'Saving...' },
    saved: { color: '#4ECDC4', text: 'Saved ✓' },
    error: { color: '#ff4444', text: 'Save failed' }
  }[saveStatus];

  return (
    <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <ParticleSystem key={particleKey} mousePos={mousePos} config={config} />
      </Canvas>

      <div style={{ position: 'absolute', top: '50%', right: '0', transform: 'translateY(-50%)', pointerEvents: 'auto', zIndex: 100 }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'rgba(10, 20, 30, 0.8)', border: '1px solid rgba(78, 205, 196, 0.4)', color: '#4ECDC4',
            width: '24px', height: '80px', padding: '0', borderRadius: '8px 0 0 8px', cursor: 'pointer', fontSize: '14px',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            borderRight: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(78, 205, 196, 0.1)';
            e.currentTarget.style.width = '30px';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(10, 20, 30, 0.8)';
            e.currentTarget.style.width = '24px';
          }}
        >
          {isOpen ? '▶' : '⚙'}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              style={{ position: 'absolute', inset: 0, zIndex: 997, pointerEvents: 'auto' }}
              onClick={() => setIsOpen(false)}
            />
            <Panel onClose={() => setIsOpen(false)}>
              {/* Save status indicator */}
              {saveStatus !== 'idle' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px',
                  fontSize: '11px', color: statusDot.color, letterSpacing: '1px'
                }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%', background: statusDot.color,
                    animation: saveStatus === 'saving' ? 'pulse-dot 1s infinite' : 'none'
                  }} />
                  {statusDot.text}
                </div>
              )}

              <Slider label="SYSTEM DENSITY" value={config.count} min={1000} max={40000} step={2000} onChange={v => { update('count', v); setParticleKey(k => k + 1); }} />
              <Slider label="FOCAL RATIO" value={config.textRatio} min={0.1} max={0.9} step={0.05} onChange={v => { update('textRatio', v); setParticleKey(k => k + 1); }} />

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '15px 0' }} />

              <Slider label="FOCAL GAIN MIN" value={config.textOpacityMin} min={0} max={1} step={0.02} onChange={v => update('textOpacityMin', v)} />
              <Slider label="FOCAL GAIN MAX" value={config.textOpacityMax} min={0} max={1} step={0.02} onChange={v => update('textOpacityMax', v)} />
              <Slider label="FOCAL SIZE" value={config.textSize} min={0.01} max={0.3} step={0.01} onChange={v => update('textSize', v)} />

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '15px 0' }} />

              <Slider label="VOID GAIN MIN" value={config.bgOpacityMin} min={0} max={1} step={0.02} onChange={v => update('bgOpacityMin', v)} />
              <Slider label="VOID GAIN MAX" value={config.bgOpacityMax} min={0} max={1} step={0.02} onChange={v => update('bgOpacityMax', v)} />
              <Slider label="VOID SIZE" value={config.bgSize} min={0.01} max={0.2} step={0.01} onChange={v => update('bgSize', v)} />

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '15px 0' }} />

              <Slider label="GLOW INTENSITY" value={config.glowIntensity} min={0.5} max={10} step={0.1} onChange={v => update('glowIntensity', v)} />

              <button
                onClick={copyConfig}
                style={{
                  width: '100%', marginTop: '10px', padding: '10px',
                  background: '#4ECDC4', color: '#0a141e', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                  border: 'none', letterSpacing: '1px', textTransform: 'uppercase'
                }}
              >
                Copy Parameters
              </button>
              <div style={{ fontSize: '10px', color: '#555', marginTop: '10px', textAlign: 'center', fontStyle: 'italic' }}>
                Auto-saved to database · Density requires re-sync
              </div>
            </Panel>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
