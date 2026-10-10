'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { HeroForge } from '@/components/canvas/hero-forge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, KeyRound, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'ADMIN', roleBadge: 'ADMIN', email: 'admin@forgeline.dev', label: 'Admin', variant: 'ember' as const },
  { role: 'PROJECT_MANAGER', roleBadge: 'PM', email: 'pm@forgeline.dev', label: 'Project Manager', variant: 'plasma' as const },
  { role: 'TEAM_MEMBER', roleBadge: 'MEMBER', email: 'member@forgeline.dev', label: 'Team Member', variant: 'ice' as const },
  { role: 'VIEWER', roleBadge: 'VIEWER', email: 'viewer@forgeline.dev', label: 'Viewer', variant: 'steel' as const },
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

      {/* Top Header */}
      <header className="relative z-10 p-6 flex justify-between items-center select-none">
        <div className="flex items-center space-x-2.5">
          <div className="w-3 h-3 bg-plasma rotate-45 shadow-[0_0_8px_rgba(184,255,44,0.6)]" />
          <span className="font-display font-black text-lg tracking-wider text-bone">
            FORGELINE
          </span>
          <span className="hidden sm:inline-block font-mono text-[11px] text-ash/60 px-2 py-0.5 rounded bg-steel/30">
            ENTERPRISE CONCURRENCY ENGINE
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-plasma animate-pulse" />
          <span className="font-mono text-xs text-plasma font-semibold">ONLINE</span>
        </div>
      </header>

      {/* Main Form Panel */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-6">
        <div className="hud-panel p-6 sm:p-8 shadow-2xl backdrop-blur-xl bg-basalt/95 border-steel/80 rounded-xl">
          {/* Header */}
          <div className="mb-6">
            <span className="font-mono text-[11px] text-plasma tracking-wider uppercase font-semibold block mb-1">
              SECURE WORKSPACE ACCESS
            </span>
            <h1 className="font-hud text-2xl sm:text-3xl font-black uppercase text-bone tracking-wide">
              Sign In to Forgeline
            </h1>
            <p className="font-body text-xs sm:text-sm text-ash mt-1">
              Industrial project orchestration with conflict-free optimistic concurrency.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-crimson/15 border border-crimson/60 rounded-md flex items-start space-x-2 text-crimson font-mono text-xs">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-xs text-ash uppercase tracking-wider mb-1.5 font-medium">
                Work Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@forgeline.dev"
                autoComplete="email"
                disabled={loading}
                required
                className="bg-void/80 border-steel focus:border-plasma h-11"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-ash uppercase tracking-wider mb-1.5 font-medium">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                disabled={loading}
                required
                className="bg-void/80 border-steel focus:border-plasma h-11"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 h-11 font-hud font-bold text-sm tracking-wider"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  SIGN IN TO WORKSPACE
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Quick-Fill Demo Selector */}
          <div className="mt-8 pt-5 border-t border-steel/60">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-bone font-semibold uppercase tracking-wider">
                Instant Demo Access
              </span>
              <span className="font-mono text-[11px] text-plasma bg-plasma/10 px-2 py-0.5 rounded border border-plasma/30">
                Password: Forge@12345
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickFill(acc.email)}
                    className={`p-3 rounded-lg border text-left group cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-plasma/10 border-plasma text-bone shadow-[0_0_12px_rgba(184,255,44,0.15)]'
                        : 'bg-void/70 border-steel/80 hover:border-plasma/60 hover:bg-void text-bone'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className="font-hud text-xs font-bold uppercase tracking-wider text-bone group-hover:text-plasma transition-colors truncate">
                          {acc.label}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-plasma shrink-0" />
                        )}
                      </div>
                      <span
                        className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 uppercase tracking-wider ${
                          acc.variant === 'plasma'
                            ? 'bg-plasma/15 text-plasma border-plasma/40'
                            : acc.variant === 'ember'
                            ? 'bg-ember/15 text-ember border-ember/40'
                            : acc.variant === 'ice'
                            ? 'bg-ice/15 text-ice border-ice/40'
                            : 'bg-steel/30 text-bone border-steel'
                        }`}
                      >
                        {acc.roleBadge}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-ash/80 truncate w-full block">
                      {acc.email}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="font-body text-[11px] text-ash/80 text-center mt-3">
              Click any role above to automatically populate email and password credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-6 flex flex-col sm:flex-row justify-between items-center text-ash/70 font-mono text-[11px] select-none space-y-2 sm:space-y-0">
        <span>FORGELINE v1.0 • ZERO-OVERWRITE OPTIMISTIC CONCURRENCY</span>
        <span>ARGON2ID • ROTATING HTTPONLY REFRESH TOKENS</span>
      </footer>
    </div>
  );
}
