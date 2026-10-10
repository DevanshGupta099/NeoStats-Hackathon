'use client';

import React, { useEffect } from 'react';
import Lenis from 'lenis';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize smooth scroll on non-mobile and when motion is not reduced
    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isMobile || prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      prevent: (node) => {
        if (!node) return false;
        return (
          node.closest?.('[role="dialog"]') !== null ||
          node.closest?.('[data-radix-portal]') !== null ||
          node.closest?.('.overflow-y-auto') !== null ||
          node.closest?.('[data-scroll-locked]') !== null ||
          document.body.style.overflow === 'hidden'
        );
      },
    });

    // Pause Lenis when body scroll is locked by Radix dialogs or drawers
    const observer = new MutationObserver(() => {
      const isLocked =
        document.body.style.overflow === 'hidden' ||
        document.body.hasAttribute('data-scroll-locked') ||
        document.documentElement.hasAttribute('data-scroll-locked');
      if (isLocked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'data-scroll-locked'],
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-scroll-locked'],
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
