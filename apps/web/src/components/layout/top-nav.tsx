'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useQualityStore } from '@/lib/stores/quality-store';
import { Badge } from '@/components/ui/badge';
import { LogOut, Wifi, Activity } from 'lucide-react';

export function TopNav() {
  const { user, logout } = useAuth();
  const tier = useQualityStore((s) => s.tier);
  const setTier = useQualityStore((s) => s.setTier);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-basalt/95 backdrop-blur border-b border-steel z-40 px-4 lg:px-6 flex items-center justify-between">
      {/* Brand & Wordmark */}
      <div className="flex items-center space-x-3">
        <Link href="/dashboard" className="flex items-center space-x-2 select-none">
          <div className="w-2.5 h-2.5 bg-plasma rotate-45" />
          <span className="font-display text-xl font-black uppercase tracking-wider text-bone">
            FORGELINE
          </span>
        </Link>
        <span className="hidden sm:inline-block font-mono text-[10px] text-ash/60 uppercase">
          // SYS.01
        </span>
      </div>

      {/* Right Telemetry Controls */}
      <div className="flex items-center space-x-3">
        {/* Realtime Connection Status Indicator */}
        <div className="flex items-center space-x-1.5 px-2 py-1 bg-void border border-steel/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ice opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-ice" />
          </span>
          <span className="font-mono text-[10px] text-ice uppercase tracking-wider hidden sm:inline">
            SYNC LIVE
          </span>
        </div>

        {/* Quality Tier Toggle */}
        <button
          onClick={() => setTier(tier === 'HIGH' ? 'LOW' : 'HIGH')}
          className="flex items-center space-x-1 px-2 py-1 bg-void border border-steel/60 hover:border-plasma transition-colors cursor-pointer"
          title="Toggle WebGL Performance Tier"
        >
          <Activity className="w-3 h-3 text-plasma" />
          <span className="font-mono text-[10px] text-ash uppercase">
            TIER: <span className="text-plasma font-bold">{tier}</span>
          </span>
        </button>

        {/* Current User Role */}
        {user && (
          <div className="hidden md:flex items-center space-x-2">
            <span className="font-mono text-xs text-bone font-medium">@{user.handle}</span>
            <Badge
              variant={
                user.globalRole === 'ADMIN'
                  ? 'ember'
                  : user.globalRole === 'PROJECT_MANAGER'
                  ? 'plasma'
                  : 'steel'
              }
            >
              {user.globalRole}
            </Badge>
          </div>
        )}

        {/* Logout Button */}
        {user && (
          <button
            onClick={() => logout()}
            className="p-2 text-ash hover:text-crimson hover:bg-graphite border border-transparent hover:border-steel transition-colors cursor-pointer"
            title="Terminate Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
