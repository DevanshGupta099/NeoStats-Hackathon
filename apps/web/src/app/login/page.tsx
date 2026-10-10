'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { HeroForge } from '@/components/canvas/hero-forge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, KeyRound, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'ADMIN', email: 'admin@forgeline.dev', label: 'Admin', variant: 'ember' as const },
  { role: 'PROJECT_MANAGER', email: 'pm@forgeline.dev', label: 'Manager', variant: 'plasma' as const },
  { role: 'TEAM_MEMBER', email: 'member@forgeline.dev', label: 'Member', variant: 'ice' as const },
  { role: 'VIEWER', email: 'viewer@forgeline.dev', label: 'Viewer', variant: 'steel' as const },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Forge@12345');
    setError(null);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-void">
      {/* 3D Kinetic Background Scene */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <HeroForge />
      </div>

      {/* Top Telemetry Header */}
      <header className="relative z-10 p-6 flex justify-between items-center select-none">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-plasma rotate-45" />
          <span className="font-mono text-xs text-ash tracking-widest uppercase">
            FORGELINE // CLUSTER.NODE.01
          </span>
        </div>
        <Badge variant="plasma">STATUS: READY</Badge>
      </header>

      {/* Main HUD Form Panel */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        <div className="hud-panel p-6 sm:p-8 hud-corner-brackets shadow-2xl backdrop-blur-md bg-basalt/90 border-steel">
          {/* Header */}
          <div className="mb-6">
            <span className="font-mono text-[10px] text-plasma tracking-widest uppercase block mb-1">
              // AUTHENTICATION GATEWAY
            </span>
            <h2 className="font-hud text-2xl font-black uppercase text-bone tracking-wide">
              OPERATOR ACCESS
            </h2>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-crimson/10 border border-crimson/60 flex items-start space-x-2 text-crimson font-mono text-xs">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] text-ash uppercase tracking-wider mb-1.5">
                OPERATOR ID / EMAIL
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@forgeline.dev"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] text-ash uppercase tracking-wider mb-1.5">
                ACCESS KEY / PASSWORD
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  VERIFYING CREDENTIALS...
                </>
              ) : (
                <>
                  INITIALIZE FORGE
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Quick-Fill Demo Chips */}
          <div className="mt-8 pt-6 border-t border-steel/60">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] text-ash uppercase tracking-wider">
                DEMO CREDENTIAL SELECTOR
              </span>
              <span className="font-mono text-[10px] text-plasma">Forge@12345</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickFill(acc.email)}
                  className="flex items-center justify-between p-2.5 bg-void/80 border border-steel hover:border-plasma transition-all text-left group cursor-pointer"
                >
                  <div>
                    <span className="block font-hud text-xs font-bold text-bone group-hover:text-plasma transition-colors uppercase">
                      {acc.label}
                    </span>
                    <span className="block font-mono text-[10px] text-ash/70 truncate max-w-[120px]">
                      {acc.email}
                    </span>
                  </div>
                  <Badge variant={acc.variant} className="ml-1 text-[9px]">
                    DEMO
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Telemetry */}
      <footer className="relative z-10 p-6 flex flex-col sm:flex-row justify-between items-center text-ash/60 font-mono text-[10px] select-none space-y-2 sm:space-y-0">
        <span>FORGELINE OS v0.1 // ZERO-OVERWRITE OPTIMISTIC CONCURRENCY</span>
        <span>SECURITY PROTOCOL: ARGON2ID + ROTATING HTTPONLY REFRESH</span>
      </footer>
    </div>
  );
}
