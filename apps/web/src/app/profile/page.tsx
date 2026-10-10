'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { useQualityStore, QualityTier } from '@/lib/stores/quality-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Activity,
  Sliders,
  Shield,
  Monitor,
  Zap,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const tier = useQualityStore((s) => s.tier);
  const setTier = useQualityStore((s) => s.setTier);

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* 1. Header Banner */}
      <div className="hud-panel p-5 sm:p-7 hud-corner-brackets bg-basalt/85 border-steel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded bg-graphite border-2 border-plasma/80 flex items-center justify-center font-hud text-2xl font-black text-plasma flex-shrink-0">
              {user?.name?.charAt(0) || 'O'}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-hud uppercase tracking-wide text-xl sm:text-2xl font-black text-bone">
                  {user?.name}
                </h1>
                <Badge
                  variant={
                    user?.globalRole === 'ADMIN'
                      ? 'ember'
                      : user?.globalRole === 'PROJECT_MANAGER'
                      ? 'plasma'
                      : 'steel'
                  }
                >
                  {user?.globalRole}
                </Badge>
              </div>

              <span className="font-mono text-xs text-plasma mt-0.5 block">
                @{user?.handle} &bull; <span className="text-ash">{user?.email}</span>
              </span>
            </div>
          </div>

          <div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => logout()}
              className="min-h-[44px]"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> LOGOUT
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Visual & Performance Controls */}
      <div className="hud-panel p-6 bg-basalt border-steel space-y-5">
        <div className="flex items-center space-x-2 border-b border-steel/60 pb-3">
          <Sliders className="w-4 h-4 text-plasma" />
          <h3 className="font-hud uppercase tracking-wider text-sm font-bold text-bone">
            GRAPHICS PIPELINE & PERFORMANCE CONTROLS
          </h3>
        </div>

        {/* Quality Tier Selector */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono uppercase text-bone font-bold mb-1">
              WebGL Shader & Scene Quality Tier
            </label>
            <p className="font-body text-xs text-ash">
              Control Three.js procedural HeatField rendering resolution, post-processing bloom, and instanced particle budgets.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setTier('HIGH');
                toast.success('HIGH QUALITY ARMED', { description: 'Full postprocessing & high-DPR shaders enabled.' });
              }}
              className={`p-4 rounded border text-left transition-all min-h-[44px] ${
                tier === 'HIGH'
                  ? 'bg-plasma/10 border-plasma text-plasma ring-1 ring-plasma/50'
                  : 'bg-void border-steel text-ash hover:text-bone hover:border-steel/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-hud uppercase font-bold text-sm">HIGH TIER</span>
                <Zap className="w-4 h-4" />
              </div>
              <p className="font-body text-[11px] text-ash">
                Full-rate post-processing bloom, dpr up to 2.0, dynamic heat ripples.
              </p>
            </button>

            <button
              onClick={() => {
                setTier('LOW');
                toast.info('LOW TIER ARMED', { description: 'Optimized performance for mobile/battery.' });
              }}
              className={`p-4 rounded border text-left transition-all min-h-[44px] ${
                tier === 'LOW'
                  ? 'bg-plasma/10 border-plasma text-plasma ring-1 ring-plasma/50'
                  : 'bg-void border-steel text-ash hover:text-bone hover:border-steel/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-hud uppercase font-bold text-sm">LOW TIER</span>
                <Monitor className="w-4 h-4" />
              </div>
              <p className="font-body text-[11px] text-ash">
                DPR 1.0 clamped, post-processing bypassed, minimal GPU thermals.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Security Telemetry */}
      <div className="hud-panel p-6 bg-basalt border-steel space-y-4">
        <div className="flex items-center space-x-2 border-b border-steel/60 pb-3">
          <Shield className="w-4 h-4 text-ice" />
          <h3 className="font-hud uppercase tracking-wider text-sm font-bold text-bone">
            SECURITY & TELEMETRY IDENTIFIERS
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 bg-void border border-steel/60 rounded">
            <span className="text-ash/70 block text-[10px]">OPERATOR UUID</span>
            <span className="text-bone truncate block mt-0.5">{user?.id || '---'}</span>
          </div>

          <div className="p-3 bg-void border border-steel/60 rounded">
            <span className="text-ash/70 block text-[10px]">SESSION REVISION</span>
            <span className="text-plasma block mt-0.5">Token Epoch #{user?.tokenVersion ?? 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
