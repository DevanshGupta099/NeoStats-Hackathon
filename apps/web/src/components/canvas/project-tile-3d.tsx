'use client';

import React, { useRef, useState } from 'react';
import { View } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TOKENS, THREE_TOKENS } from '@/lib/tokens';
import { ProjectRole, ProjectStatus } from '@forgeline/shared';

function Slab3D({
  color,
  isArchived,
  hovered,
}: {
  color: THREE.Color;
  isArchived: boolean;
  hovered: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.LineSegments>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Pointer-driven tilt
    const targetRotX = hovered ? -state.pointer.y * 0.35 : 0;
    const targetRotY = hovered ? state.pointer.x * 0.35 : 0;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, 0.1);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, 0.1);

    if (wireRef.current) {
      wireRef.current.rotation.x = meshRef.current.rotation.x;
      wireRef.current.rotation.y = meshRef.current.rotation.y;
    }
  });

  const baseColor = isArchived
    ? new THREE.Color('#171A1F')
    : THREE_TOKENS.basalt;
  const edgeColor = isArchived
    ? new THREE.Color('#2A2F37')
    : color;

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 3]} intensity={1.2} />

      {/* Solid slab */}
      <mesh ref={meshRef}>
        <boxGeometry args={[2.8, 1.8, 0.2]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>

      {/* Glowing neon edge rim */}
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[2.7, 1.7]} />
        <meshBasicMaterial
          color={edgeColor}
          wireframe
          transparent
          opacity={isArchived ? 0.2 : hovered ? 0.9 : 0.4}
        />
      </mesh>
    </group>
  );
}

export function ProjectTile3D({
  role,
  status,
  children,
  className = '',
}: {
  role?: ProjectRole;
  status: ProjectStatus;
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const isArchived = status === ProjectStatus.ARCHIVED;

  const roleColor =
    role === ProjectRole.MANAGER
      ? THREE_TOKENS.plasma
      : role === ProjectRole.MEMBER
      ? THREE_TOKENS.ice
      : THREE_TOKENS.steel;

  const roleBorderClass =
    isArchived
      ? 'border-steel/40 opacity-70'
      : role === ProjectRole.MANAGER
      ? 'border-l-4 border-l-plasma border-steel'
      : role === ProjectRole.MEMBER
      ? 'border-l-4 border-l-ice border-steel'
      : 'border-l-4 border-l-ash border-steel';

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden rounded bg-basalt transition-all duration-200 group ${roleBorderClass} ${className}`}
    >
      {/* 3D WebGL Background Tilt Portal */}
      <div className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity">
        <View track={containerRef as React.RefObject<HTMLElement>}>
          <Slab3D color={roleColor} isArchived={isArchived} hovered={hovered} />
        </View>
      </div>

      {/* Foreground DOM Content */}
      <div className="relative z-10 p-5">{children}</div>
    </div>
  );
}
