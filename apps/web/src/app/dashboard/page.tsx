'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ForgeText } from '@/components/canvas/forge-text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Layers, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Top Banner with ForgeText */}
      <div className="hud-panel p-6 sm:p-8 hud-corner-brackets bg-basalt/80 border-steel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] text-plasma tracking-widest uppercase block mb-1">
              // TELEMETRY RADAR
            </span>
            <div className="h-16 flex items-center">
              <ForgeText fontSize={1.1} className="w-full">
                OPERATIONS FORGE
              </ForgeText>
            </div>
            <p className="font-body text-xs text-ash mt-1">
              Welcome back, <span className="text-bone font-medium">{user?.name || 'Operator'}</span>. System status optimal.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/projects">
              <Button variant="primary">
                VIEW PROJECTS <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="hud-panel p-5 bg-basalt border-steel">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-ash uppercase">REALTIME SYNC</span>
            <Zap className="w-4 h-4 text-ice" />
          </div>
          <div className="font-hud text-3xl font-black text-bone">ACTIVE</div>
          <span className="font-mono text-[10px] text-ice">Post-commit event stream</span>
        </div>

        <div className="hud-panel p-5 bg-basalt border-steel">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-ash uppercase">CONCURRENCY ENGINE</span>
            <ShieldCheck className="w-4 h-4 text-plasma" />
          </div>
          <div className="font-hud text-3xl font-black text-bone">ATOMIC</div>
          <span className="font-mono text-[10px] text-plasma">HTTP 409 protection armed</span>
        </div>

        <div className="hud-panel p-5 bg-basalt border-steel">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-ash uppercase">ACTIVE PROJECTS</span>
            <Layers className="w-4 h-4 text-ember" />
          </div>
          <div className="font-hud text-3xl font-black text-bone">3</div>
          <span className="font-mono text-[10px] text-ash">Managed workloads</span>
        </div>

        <div className="hud-panel p-5 bg-basalt border-steel">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-ash uppercase">ACCESS LEVEL</span>
            <AlertCircle className="w-4 h-4 text-amber" />
          </div>
          <div className="font-hud text-2xl font-black text-bone truncate">
            {user?.globalRole || 'AUTHENTICATING'}
          </div>
          <span className="font-mono text-[10px] text-amber">Dual-tier policy enforced</span>
        </div>
      </div>
    </div>
  );
}
