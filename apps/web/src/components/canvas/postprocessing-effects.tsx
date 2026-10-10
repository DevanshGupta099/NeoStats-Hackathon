'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useQualityStore } from '@/lib/stores/quality-store';

export function PostprocessingEffects() {
  const pathname = usePathname();
  const postprocessing = useQualityStore((s) => s.postprocessing);

  const isHeroPage = pathname === '/' || pathname === '/login';

  if (!postprocessing || !isHeroPage) {
    return null;
  }

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.6}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.001, 0.001)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.15} darkness={0.8} />
      <Noise opacity={0.035} />
    </EffectComposer>
  );
}
