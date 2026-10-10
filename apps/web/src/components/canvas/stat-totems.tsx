'use client';

import React, { useRef, useMemo } from 'react';
import { View } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TOKENS, THREE_TOKENS } from '@/lib/tokens';
import { ForgeText } from './forge-text';

interface TotemData {
  label: string;
  count: number;
  color: THREE.Color;
  hexColor: string;
}

function TotemPillar({
  position,
  color,
  count,
  index,
}: {
  position: [number, number, number];
  color: THREE.Color;
  count: number;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Pillar height proportional to count, clamped between 1.2 and 3.0
  const targetHeight = Math.min(1.2 + Math.max(0, count) * 0.18, 3.2);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime() + index * 1.5;

    // Subtle levitation and slow rotation
    meshRef.current.position.y = Math.sin(t * 1.2) * 0.08;
    meshRef.current.rotation.y += delta * 0.4;

    if (glowRef.current) {
      glowRef.current.rotation.y -= delta * 0.6;
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
      glowMat.opacity = 0.4 + Math.sin(t * 2.5) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Outer brutalist hexagonal prism */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.55, 0.65, targetHeight, 6]} />
        <meshStandardMaterial
          color={THREE_TOKENS.basalt}
          roughness={0.3}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>

      {/* Emissive energy band in center */}
      <mesh ref={glowRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.58, 0.58, targetHeight * 0.4, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} wireframe />
      </mesh>

      {/* Top cap beacon */}
      <mesh position={[0, targetHeight / 2 + 0.1, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function TotemsScene({ totems }: { totems: TotemData[] }) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <pointLight position={[0, 0, 3]} intensity={2.0} color="#B8FF2C" />

      {totems.map((t, idx) => {
        // Distribute horizontally
        const xPos = (idx - 1.5) * 1.8;
        return (
          <TotemPillar
            key={t.label}
            position={[xPos, 0, 0]}
            color={t.color}
            count={t.count}
            index={idx}
          />
        );
      })}
    </>
  );
}

export function StatTotems({
  openTasks,
  dueSoon,
  inReview,
  unreadNotifications,
}: {
  openTasks: number;
  dueSoon: number;
  inReview: number;
  unreadNotifications: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const totems: TotemData[] = useMemo(
    () => [
      {
        label: 'OPEN TASKS',
        count: openTasks,
        color: THREE_TOKENS.plasma,
        hexColor: TOKENS.colors.plasma,
      },
      {
        label: 'DUE SOON',
        count: dueSoon,
        color: THREE_TOKENS.ember,
        hexColor: TOKENS.colors.ember,
      },
      {
        label: 'IN REVIEW',
        count: inReview,
        color: THREE_TOKENS.amber,
        hexColor: TOKENS.colors.amber,
      },
      {
        label: 'UNREAD NOTIFS',
        count: unreadNotifications,
        color: THREE_TOKENS.ice,
        hexColor: TOKENS.colors.ice,
      },
    ],
    [openTasks, dueSoon, inReview, unreadNotifications],
  );

  return (
    <div className="hud-panel p-4 sm:p-6 bg-basalt border-steel hud-corner-brackets overflow-hidden">
      {/* Header telemetry info */}
      <div className="flex items-center justify-between mb-4 border-b border-steel/60 pb-3">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-plasma animate-ping" />
          <span className="font-mono text-[10px] text-plasma uppercase tracking-widest">
            // TELEMETRY TOTEMS [INSTANCED 3D ARRAY]
          </span>
        </div>
        <span className="font-mono text-[10px] text-ash">ACTIVE CYCLE</span>
      </div>

      {/* 3D WebGL Totems View Portal (Desktop / Tablet) */}
      <div
        ref={containerRef}
        className="w-full h-40 sm:h-48 relative mb-6 rounded bg-void/50 border border-steel/40 flex items-center justify-center"
      >
        <View track={containerRef as React.RefObject<HTMLElement>}>
          <TotemsScene totems={totems} />
        </View>
      </div>

      {/* Counter Totem Cards with ForgeText count-up numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {totems.map((totem) => (
          <div
            key={totem.label}
            className="p-3 bg-graphite/70 border border-steel/60 rounded flex flex-col justify-between"
          >
            <span className="font-mono text-[10px] text-ash uppercase tracking-wider">
              {totem.label}
            </span>
            <div className="h-12 flex items-center mt-1">
              <ForgeText
                fontSize={0.9}
                color={totem.hexColor}
                accentColor={TOKENS.colors.bone}
              >
                {String(totem.count).padStart(2, '0')}
              </ForgeText>
            </div>
            <div className="w-full bg-steel/40 h-1 mt-2">
              <div
                className="h-1 transition-all duration-500"
                style={{
                  backgroundColor: totem.hexColor,
                  width: `${Math.min(totem.count * 10, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
