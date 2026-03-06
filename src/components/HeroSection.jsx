import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Text, Stars, Line, Billboard, Float, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import PlanetDetailModal from './energy/PlanetDetailModal'; // Adjust path if needed

const KEYWORDS = ["求索", "真实", "专注", "减负", "在场", "思考", "投入"];

// Planet Assets Configuration - Reduced Sizes
const PLANET_ASSETS = [
  { texture: `${import.meta.env.BASE_URL}images/planet_rocky.png`, color: '#ffaaaa', size: 0.8, radius: 5, inclination: 0.2, speed: 0.4 },
  { texture: `${import.meta.env.BASE_URL}images/planet_ice.png`, color: '#aaffff', size: 1.0, radius: 7, inclination: -0.3, speed: 0.35 },
  { texture: `${import.meta.env.BASE_URL}images/planet_lava.png`, color: '#ffaa00', size: 1.2, radius: 9, inclination: 0.5, speed: 0.3 },
  { texture: `${import.meta.env.BASE_URL}images/planet_void.png`, color: '#ddccff', size: 0.7, radius: 11, inclination: -0.6, speed: 0.25 },
  { texture: `${import.meta.env.BASE_URL}images/planet_forest.png`, color: '#aaffaa', size: 0.9, radius: 13, inclination: 0.8, speed: 0.2 },
  { texture: `${import.meta.env.BASE_URL}images/planet_gas.png`, color: '#ffccaa', size: 1.1, radius: 15, inclination: -0.4, speed: 0.18 },
  { texture: `${import.meta.env.BASE_URL}images/planet_desert.png`, color: '#ffeeaa', size: 0.7, radius: 17, inclination: 0.6, speed: 0.15 }
];

function Planet({ text, config, index, onClick }) {
  const meshRef = useRef();
  const texture = useLoader(THREE.TextureLoader, config.texture);
  const { radius, speed, size } = config;

  // Random start angle
  const initialAngle = useMemo(() => (index / KEYWORDS.length) * Math.PI * 2 + Math.random(), []);

  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + initialAngle;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
      meshRef.current.rotation.y += 0.002;
    }
  });

  // Cursor pointer on hover
  useFrame(() => {
    if (hovered) document.body.style.cursor = 'pointer';
    return () => { document.body.style.cursor = 'auto'; }
  });

  return (
    <group>
      <group
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(text); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.1}>
          {/* Planet Sphere */}
          <mesh>
            <sphereGeometry args={[size, 64, 64]} />
            <meshStandardMaterial
              map={texture}
              color="white"
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>

          {/* Hover White Overlay */}
          {hovered && (
            <mesh scale={[1.01, 1.01, 1.01]}>
              <sphereGeometry args={[size, 64, 64]} />
              <meshBasicMaterial
                color="white"
                transparent
                opacity={0.1}
                side={THREE.FrontSide}
                depthWrite={false}
              />
            </mesh>
          )}

          {/* Atmosphere Glow */}
          <mesh scale={[1.05, 1.05, 1.05]}>
            <sphereGeometry args={[size, 64, 64]} />
            <meshBasicMaterial
              color={config.color}
              transparent
              opacity={0.05}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Simplified Label: Text Only, Above Planet */}
          <Billboard position={[0, size * 1.5, 0]}>
            <Text
              font="/fonts/custom-font.ttf" // Use custom font if available, or fallback
              fontSize={0.5}
              color="white"
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.02}
              outlineColor="black"
              fontWeight="bold"
            >
              {text}
            </Text>
          </Billboard>
        </Float>
      </group>
    </group>
  );
}

function OrbitGroup({ text, config, index, onPlanetClick }) {
  const rotationEuler = new THREE.Euler(config.inclination, 0, 0);

  return (
    <group rotation={rotationEuler}>
      <Planet text={text} config={config} index={index} onClick={onPlanetClick} />
    </group>
  );
}

function Sun() {
  const texture = useLoader(THREE.TextureLoader, `${import.meta.env.BASE_URL}images/sun_texture.png`);

  return (
    <group>
      <Float speed={0.5} rotationIntensity={0.05} floatIntensity={0.05}>
        {/* Sun Sphere */}
        <mesh>
          <sphereGeometry args={[3, 64, 64]} />
          <meshBasicMaterial map={texture} color="#ffddaa" />
        </mesh>

        {/* Intense Glow */}
        <mesh scale={[1.2, 1.2, 1.2]}>
          <sphereGeometry args={[3, 64, 64]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.2} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
        </mesh>

        <Billboard>
        </Billboard>
      </Float>
    </group>
  );
}

function Scene({ onPlanetClick }) {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 0]} intensity={2.5} distance={100} decay={1} color="#ffaa55" />
      <ambientLight intensity={0.5} color="#4444ff" />


      {KEYWORDS.map((word, i) => (
        <OrbitGroup
          key={i}
          text={word}
          config={PLANET_ASSETS[i]}
          index={i}
          onPlanetClick={onPlanetClick}
        />
      ))}

      <Stars radius={90} depth={20} count={3000} factor={4} saturation={0} fade speed={0.2} />
    </>
  );
}

export default function HeroSection({ goTo }) {
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>

      <Canvas
        camera={{ position: [0, 4, 32], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        style={{ position: 'relative', zIndex: 2 }} // Above text
      >
        <React.Suspense fallback={null}>
          <Scene onPlanetClick={setSelectedPlanet} />
        </React.Suspense>
      </Canvas>

      {/* Modal */}
      {selectedPlanet && (
        <PlanetDetailModal keyword={selectedPlanet} onClose={() => setSelectedPlanet(null)} />
      )}


      {/* ENTER SYSTEM Button */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10
      }}>
        <motion.button
          whileHover={{ scale: 1.05, borderColor: '#4ECDC4', boxShadow: '0 0 20px rgba(78, 205, 196, 0.3)' }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'relative',
            padding: '16px 48px',
            background: 'rgba(10, 20, 30, 0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#4ECDC4',
            fontSize: '16px',
            letterSpacing: '4px',
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
            fontFamily: '"Rajdhani", sans-serif',
            fontWeight: '600',
            textTransform: 'uppercase',
            clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)',
            textShadow: '0 0 10px rgba(78, 205, 196, 0.3)'
          }}
          onClick={() => {
            if (goTo) goTo('annual');
          }}
        >
          <span style={{ marginRight: '10px' }}>▶</span>
          ENTER SYSTEM
        </motion.button>
      </div>
    </div>
  );
}
