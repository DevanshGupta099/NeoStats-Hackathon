'use client';

import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className:
          '!bg-basalt !text-bone !border-steel !font-mono !text-xs !shadow-2xl !rounded-none !border hud-corner-brackets',
        style: {
          backgroundColor: '#0E1013',
          borderColor: '#2A2F37',
          color: '#ECE8DF',
        },
      }}
    />
  );
}
