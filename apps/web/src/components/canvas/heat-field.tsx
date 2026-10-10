'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { THREE_TOKENS } from '@/lib/tokens';
import { useQualityStore } from '@/lib/stores/quality-store';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uScrollVelocity;
  uniform vec3 uColorVoid;
  uniform vec3 uColorBasalt;
  uniform vec3 uColorEmber;
  uniform vec3 uColorPlasma;
  uniform float uIntensity;
  varying vec2 vUv;

  // Simplex-style procedural noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  void main() {
    vec2 uv = vUv;
    
    // Wave motion influenced by time and scroll velocity
    float t = uTime * 0.15;
    float distToPointer = length(uv - (uPointer * 0.5 + 0.5));
    float pointerHeat = smoothstep(0.4, 0.0, distToPointer) * 0.25;

    float n1 = noise(uv * 3.0 + vec2(t * 0.2, t * 0.3));
    float n2 = noise(uv * 6.0 - vec2(t * 0.4, -t * 0.1));
    float heat = (n1 * 0.7 + n2 * 0.3) + pointerHeat + (uScrollVelocity * 0.05);

    vec3 color = mix(uColorVoid, uColorBasalt, uv.y);
    
    // Subtle ember/plasma heat glows in bottom corner
    float bottomHeat = smoothstep(0.6, 0.0, uv.y) * heat * uIntensity;
    vec3 heatColor = mix(uColorEmber, uColorPlasma, n2);
    color = mix(color, heatColor, bottomHeat * 0.18);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function HeatField() {
  const meshRef = useRef<THREE.Mesh>(null);
  const tier = useQualityStore((s) => s.tier);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uScrollVelocity: { value: 0 },
      uColorVoid: { value: THREE_TOKENS.void },
      uColorBasalt: { value: THREE_TOKENS.basalt },
      uColorEmber: { value: THREE_TOKENS.ember },
      uColorPlasma: { value: THREE_TOKENS.plasma },
      uIntensity: { value: tier === 'HIGH' ? 1.0 : 0.5 },
    }),
    [tier],
  );

  let lastScrollY = 0;
  let scrollVelocity = 0;

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value += delta;
    mat.uniforms.uPointer.value.lerp(state.pointer, 0.05);

    if (typeof window !== 'undefined') {
      const currentScrollY = window.scrollY || 0;
      const rawVelocity = Math.abs(currentScrollY - lastScrollY) / (delta * 1000 + 1);
      scrollVelocity = THREE.MathUtils.lerp(scrollVelocity, Math.min(rawVelocity, 5), 0.1);
      lastScrollY = currentScrollY;
      mat.uniforms.uScrollVelocity.value = scrollVelocity;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -10]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
