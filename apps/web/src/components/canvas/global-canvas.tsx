'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { View, Preload } from '@react-three/drei';
import { HeatField } from './heat-field';
import { PostprocessingEffects } from './postprocessing-effects';
import { useQualityStore } from '@/lib/stores/quality-store';

export function GlobalCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const dpr = useQualityStore((s) => s.dpr);
  const initializeQuality = useQualityStore((s) => s.initializeQuality);

  const isHeroPage = pathname === '/' || pathname === '/login';
  const effectiveDpr = isHeroPage ? dpr : 1;

  useEffect(() => {
    initializeQuality();
  }, [initializeQuality]);

  return (
    <div
      ref={containerRef}
      id="canvas-container"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <Canvas
        dpr={effectiveDpr}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: true,
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 0, 5], fov: 45 }}
        eventSource={typeof document !== 'undefined' ? (document.getElementById('app-root') as HTMLElement) : undefined}
        eventPrefix="client"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <HeatField />
        <View.Port />
        <PostprocessingEffects />
        <Preload all />
      </Canvas>
    </div>
  );
}
