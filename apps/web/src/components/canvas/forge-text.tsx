'use client';

import React, { useRef, useState, useEffect } from 'react';
import { View, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TOKENS } from '@/lib/tokens';

interface ForgeTextProps {
  children: string;
  className?: string;
  fontSize?: number;
  color?: string;
  accentColor?: string;
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'div';
}

function KineticText3D({
  text,
  fontSize = 1.2,
  color = TOKENS.colors.bone,
  accentColor = TOKENS.colors.ember,
}: {
  text: string;
  fontSize?: number;
  color?: string;
  accentColor?: string;
}) {
  const textRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);
  const targetColor = useMemoColor(hovered ? accentColor : color);

  useFrame((state, delta) => {
    if (!textRef.current) return;
    const t = state.clock.getElapsedTime();

    // Subtle breathing displacement
    textRef.current.position.y = Math.sin(t * 1.5) * 0.04;
    textRef.current.rotation.y = THREE.MathUtils.lerp(
      textRef.current.rotation.y,
      hovered ? (state.pointer.x * 0.2) : 0,
      0.1,
    );

    if (textRef.current.material) {
      textRef.current.material.color.lerp(targetColor, 0.1);
    }
  });

  return (
    <group onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <Text
        ref={textRef}
        font={TOKENS.fonts.display}
        fontSize={fontSize}
        letterSpacing={-0.03}
        anchorX="center"
        anchorY="middle"
        characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-=_+[]{}|;:,.<>?"
      >
        {text}
        <meshBasicMaterial color={color} toneMapped={false} />
      </Text>
    </group>
  );
}

function useMemoColor(hex: string) {
  return React.useMemo(() => new THREE.Color(hex), [hex]);
}

export function ForgeText({
  children,
  className = '',
  fontSize = 1.2,
  color = TOKENS.colors.bone,
  accentColor = TOKENS.colors.ember,
  as: Component = 'div',
}: ForgeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Component className={`relative inline-block select-none ${className}`}>
      {/* Accessible DOM Screen-Reader Text */}
      <span className="sr-only" aria-label={children}>
        {children}
      </span>

      {/* DOM Placeholder to preserve bounding box and SSR */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center opacity-0 pointer-events-auto"
        aria-hidden="true"
      >
        <span className="font-display uppercase tracking-tight text-transparent">
          {children}
        </span>
      </div>

      {/* 3D WebGL View Portal */}
      {isMounted && containerRef.current && (
        <View track={containerRef as React.RefObject<HTMLElement>}>
          <KineticText3D
            text={children}
            fontSize={fontSize}
            color={color}
            accentColor={accentColor}
          />
        </View>
      )}
    </Component>
  );
}
