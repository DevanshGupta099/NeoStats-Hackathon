'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { View, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TOKENS, THREE_TOKENS } from '@/lib/tokens';
import { useQualityStore } from '@/lib/stores/quality-store';

function EmberParticles({ count = 80 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8; // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6 - 2; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4; // z
      spd[i] = 0.5 + Math.random() * 1.5;
    }
    return [pos, spd];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posArr = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += speeds[i] * delta;
      // Slight sinusoidal sway
      posArr[i * 3] += Math.sin(posArr[i * 3 + 1] * 2.0) * 0.005;

      // Wrap around when rising past top
      if (posArr[i * 3 + 1] > 4) {
        posArr[i * 3 + 1] = -3;
        posArr[i * 3] = (Math.random() - 0.5) * 8;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color={THREE_TOKENS.ember}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function HeroScene() {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<any>(null);
  const tier = useQualityStore((s) => s.tier);

  useFrame((state) => {
    if (!groupRef.current) return;
    const { pointer } = state;

    // Smooth parallax tilt
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      pointer.x * 0.15,
      0.05,
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -pointer.y * 0.1,
      0.05,
    );

    if (textRef.current) {
      const t = state.clock.getElapsedTime();
      // Heat shimmer pulse
      const scale = 1.0 + Math.sin(t * 2.0) * 0.01;
      textRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group ref={groupRef}>
      <Text
        ref={textRef}
        font={TOKENS.fonts.display}
        fontSize={1.6}
        letterSpacing={-0.04}
        anchorX="center"
        anchorY="middle"
        position={[0, 0.4, 0]}
      >
        FORGELINE
        <meshBasicMaterial color={TOKENS.colors.bone} toneMapped={false} />
      </Text>

      <Text
        font={TOKENS.fonts.hud}
        fontSize={0.24}
        letterSpacing={0.2}
        anchorX="center"
        anchorY="middle"
        position={[0, -0.6, 0]}
      >
        HIGH-CONCURRENCY PROJECT ENGINE
        <meshBasicMaterial color={TOKENS.colors.plasma} toneMapped={false} />
      </Text>

      <EmberParticles count={tier === 'HIGH' ? 120 : 40} />
    </group>
  );
}

export function HeroForge({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[320px] ${className}`}>
      {/* Fallback DOM Typography during initial render / SSR */}
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none z-0">
        <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter text-bone opacity-20">
          FORGELINE
        </h1>
        <p className="font-hud text-xs md:text-sm text-plasma tracking-widest uppercase mt-2 opacity-30">
          HIGH-CONCURRENCY PROJECT ENGINE
        </p>
      </div>

      {mounted && containerRef.current && (
        <View track={containerRef as React.RefObject<HTMLElement>}>
          <HeroScene />
        </View>
      )}
    </div>
  );
}
