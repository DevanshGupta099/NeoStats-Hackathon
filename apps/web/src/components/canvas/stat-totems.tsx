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
        label: 'DUE SOON (<48h)',
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
        label: 'UNREAD ALERTS',
        count: unreadNotifications,
        color: THREE_TOKENS.ice,
        hexColor: TOKENS.colors.ice,
      },
    ],
    [openTasks, dueSoon, inReview, unreadNotifications],
  );

  const totalVolume = openTasks + dueSoon + inReview + unreadNotifications;
  const maxCount = Math.max(openTasks, dueSoon, inReview, unreadNotifications, 1);

  return (
    <div className="hud-panel p-5 sm:p-6 bg-basalt/95 border-steel/80 rounded-xl overflow-hidden shadow-2xl space-y-5">
      {/* 1. Header operations info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-steel/60 pb-3">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-plasma animate-pulse" />
          <span className="font-hud font-bold text-sm text-bone uppercase tracking-wider">
            OPERATIONS OVERVIEW
          </span>
          <span className="font-mono text-[11px] text-plasma/90 px-2 py-0.5 rounded bg-plasma/10 border border-plasma/30 font-semibold">
            Sprint Workload & Telemetry
          </span>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-void border border-steel/60">
            <span className="w-1.5 h-1.5 rounded-full bg-ice animate-ping" />
            <span className="text-[10px] text-ice font-semibold uppercase tracking-wider">
              SOCKET MESH: 28MS
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-void border border-steel/60">
            <span className="w-1.5 h-1.5 rounded-full bg-plasma" />
            <span className="text-[10px] text-bone/80 font-medium">
              CONCURRENCY: OCC ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Sprint Workload & Telemetry Graphs (Always Visible) */}
      <div className="p-4 sm:p-5 rounded-lg bg-void/80 border border-steel/60 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(184, 255, 44, 0.2) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        <div className="relative z-10 space-y-4">
          {/* Telemetry Bar Header */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-ash uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-plasma" />
              LIVE WORKLOAD DISTRIBUTION (TOTAL ACTIVE: {totalVolume})
            </span>
            <span className="text-[11px] text-ash/80">REAL-TIME TELEMETRY SPECTRUM</span>
          </div>

          {/* Continuous Multi-segment Telemetry Progress Bar */}
          <div className="w-full h-3.5 rounded-full bg-steel/30 p-0.5 flex overflow-hidden border border-steel/50">
            <div
              className="h-full bg-plasma rounded-l-full transition-all duration-700 relative group"
              style={{ width: `${totalVolume > 0 ? (openTasks / totalVolume) * 100 : 25}%` }}
              title={`Open Tasks: ${openTasks}`}
            />
            <div
              className="h-full bg-ember transition-all duration-700 relative group"
              style={{ width: `${totalVolume > 0 ? (dueSoon / totalVolume) * 100 : 25}%` }}
              title={`Due Soon: ${dueSoon}`}
            />
            <div
              className="h-full bg-amber transition-all duration-700 relative group"
              style={{ width: `${totalVolume > 0 ? (inReview / totalVolume) * 100 : 25}%` }}
              title={`In Review: ${inReview}`}
            />
            <div
              className="h-full bg-ice rounded-r-full transition-all duration-700 relative group"
              style={{ width: `${totalVolume > 0 ? (unreadNotifications / totalVolume) * 100 : 25}%` }}
              title={`Unread Alerts: ${unreadNotifications}`}
            />
          </div>

          {/* Visual Telemetry Chart Columns */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 pt-2">
            {totems.map((t) => {
              const heightPct = Math.max(12, Math.round((t.count / maxCount) * 100));
              return (
                <div key={t.label} className="flex flex-col items-center space-y-2 group">
                  {/* Bar column with background ruler */}
                  <div className="w-full h-24 sm:h-28 bg-steel/20 rounded-md p-1.5 flex flex-col justify-end items-center relative overflow-hidden border border-steel/40 group-hover:border-steel/80 transition-all">
                    {/* Horizontal baseline ticks */}
                    <div className="absolute inset-x-0 top-1/4 border-b border-steel/20 pointer-events-none" />
                    <div className="absolute inset-x-0 top-2/4 border-b border-steel/20 pointer-events-none" />
                    <div className="absolute inset-x-0 top-3/4 border-b border-steel/20 pointer-events-none" />

                    {/* Animated vertical bar */}
                    <div
                      className="w-full rounded transition-all duration-700 shadow-lg relative"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: t.hexColor,
                        boxShadow: `0 0 12px ${t.hexColor}40`,
                      }}
                    >
                      <span className="absolute -top-6 inset-x-0 text-center font-mono font-bold text-xs text-bone group-hover:scale-110 transition-transform">
                        {t.count}
                      </span>
                    </div>
                  </div>

                  {/* Legend Label */}
                  <div className="text-center w-full">
                    <span className="block font-mono text-[10px] sm:text-[11px] font-semibold text-ash group-hover:text-bone uppercase tracking-tight truncate">
                      {t.label}
                    </span>
                    <span
                      className="font-mono text-[9px] font-bold"
                      style={{ color: t.hexColor }}
                    >
                      {totalVolume > 0 ? Math.round((t.count / totalVolume) * 100) : 0}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Metric Cards with Bold High-Visibility Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {totems.map((totem) => (
          <div
            key={totem.label}
            className="p-3.5 sm:p-4 bg-void/70 hover:bg-void/90 border border-steel/70 hover:border-steel rounded-lg flex flex-col justify-between transition-all group shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-ash group-hover:text-bone font-semibold uppercase tracking-wider">
                {totem.label}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                style={{ backgroundColor: totem.hexColor, color: totem.hexColor }}
              />
            </div>
            
            <div className="my-2.5 flex items-baseline space-x-2">
              <span
                className="font-hud text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md"
                style={{ color: totem.hexColor }}
              >
                {String(totem.count).padStart(2, '0')}
              </span>
              <span className="font-mono text-[10px] text-ash/70 uppercase">
                ACTIVE
              </span>
            </div>

            <div className="w-full bg-steel/30 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="h-full transition-all duration-700 rounded-full"
                style={{
                  backgroundColor: totem.hexColor,
                  width: `${Math.min(Math.max((totem.count / maxCount) * 100, totem.count > 0 ? 12 : 0), 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
