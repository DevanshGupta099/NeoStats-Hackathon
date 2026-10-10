'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { HeroForge } from '@/components/canvas/hero-forge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield,
  KeyRound,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Zap,
  Lock,
  GitBranch,
  Bot,
  Activity,
  CheckCircle2,
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'ADMIN',
    roleBadge: 'ADMIN',
    name: 'Devansh Gupta',
    email: 'admin@forgeline.dev',
    desc: 'Full tenant-wide access, user governance, project deletion',
    variant: 'ember' as const,
  },
  {
    role: 'PROJECT_MANAGER',
    roleBadge: 'PM',
    name: 'Sarah Chen',
    email: 'pm@forgeline.dev',
    desc: 'Project administration, member rosters, task management',
    variant: 'plasma' as const,
  },
  {
    role: 'TEAM_MEMBER',
    roleBadge: 'MEMBER',
    name: 'Alex Rivera',
    email: 'member@forgeline.dev',
    desc: 'Task status updates, assigned work, comment feeds',
    variant: 'ice' as const,
  },
  {
    role: 'VIEWER',
    roleBadge: 'VIEWER',
    name: 'Morgan Vance',
    email: 'viewer@forgeline.dev',
    desc: 'Read-only inspection across assigned initiatives',
    variant: 'steel' as const,
  },
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
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-void overflow-hidden text-bone select-none">
      {/* 3D Background Canvas */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
        <HeroForge />
      </div>

      {/* LEFT PANEL: Branding, Features, Demo Roster & System Architecture */}
      <div className="relative z-10 w-full lg:w-7/12 xl:w-3/5 p-6 sm:p-10 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-steel/60 bg-gradient-to-br from-basalt/95 via-void/90 to-basalt/95 backdrop-blur-md">
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-4 h-4 bg-plasma rotate-45 shadow-[0_0_12px_rgba(184,255,44,0.8)] group-hover:scale-110 transition-transform" />
              <span className="font-display font-black text-2xl tracking-wider text-bone group-hover:text-plasma transition-colors">
                FORGELINE
              </span>
              <span className="hidden sm:inline-block font-mono text-[10px] text-plasma bg-plasma/10 border border-plasma/30 px-2 py-0.5 rounded font-semibold tracking-widest">
                ENTERPRISE OCC
              </span>
            </Link>

            <div className="flex items-center space-x-2 px-3 py-1 rounded bg-void border border-steel/60 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-plasma animate-pulse" />
              <span className="text-plasma font-semibold">ENGINE LIVE</span>
            </div>
          </div>

          {/* Hero Narrative */}
          <div className="space-y-4 max-w-2xl">
            <span className="font-mono text-xs text-plasma font-semibold tracking-widest uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              MULTI-USER COLLABORATIVE RUNTIME
            </span>
            <h1 className="font-hud text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-bone tracking-tight leading-none">
              High-Velocity Projects with Zero Write Overwrite
            </h1>
            <p className="font-body text-sm sm:text-base text-ash/90 leading-relaxed">
              Industrial project orchestration engineered with optimistic concurrency locks, dual-tier server-side authorization, sub-50ms Socket.IO real-time sync, and Mistral AI streaming digests.
            </p>
          </div>

          {/* Architectural Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8 max-w-2xl">
            <div className="p-3.5 rounded-lg bg-void/60 border border-steel/60 flex items-start space-x-3">
              <div className="p-2 rounded bg-plasma/10 border border-plasma/30 text-plasma shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-hud text-xs font-bold text-bone block uppercase">
                  Sub-50ms Realtime Mesh
                </span>
                <span className="font-mono text-[11px] text-ash/80 block leading-snug">
                  Socket.IO post-commit event bus with room scoping & presence tracking.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-void/60 border border-steel/60 flex items-start space-x-3">
              <div className="p-2 rounded bg-ember/10 border border-ember/30 text-ember shrink-0 mt-0.5">
                <GitBranch className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-hud text-xs font-bold text-bone block uppercase">
                  Optimistic Concurrency
                </span>
                <span className="font-mono text-[11px] text-ash/80 block leading-snug">
                  Atomic SQL version lock with interactive 409 visual merge drawers.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-void/60 border border-steel/60 flex items-start space-x-3">
              <div className="p-2 rounded bg-ice/10 border border-ice/30 text-ice shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-hud text-xs font-bold text-bone block uppercase">
                  Dual-Tier Rule of Cap
                </span>
                <span className="font-mono text-[11px] text-ash/80 block leading-snug">
                  Pure functional PolicyService guards prevent privilege escalation.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-void/60 border border-steel/60 flex items-start space-x-3">
              <div className="p-2 rounded bg-amber/10 border border-amber/30 text-amber shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="font-hud text-xs font-bold text-bone block uppercase">
                  Mistral AI Synthesis
                </span>
                <span className="font-mono text-[11px] text-ash/80 block leading-snug">
                  SSE streaming standup digests & automated task draft generator.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="pt-6 border-t border-steel/50">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-bone font-bold uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-plasma" />
              Select Demo Clearance (Auto-Fill Credentials)
            </span>
            <span className="font-mono text-[10px] text-plasma bg-plasma/10 px-2 py-0.5 rounded border border-plasma/30">
              Pass: Forge@12345
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = email === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickFill(acc.email)}
                  className={`p-3 rounded-lg border text-left group cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-plasma/15 border-plasma text-bone shadow-[0_0_15px_rgba(184,255,44,0.2)]'
                      : 'bg-void/70 border-steel/70 hover:border-plasma/60 hover:bg-void/90 text-bone'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-hud text-xs font-bold uppercase text-bone group-hover:text-plasma transition-colors truncate">
                      {acc.roleBadge}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        acc.variant === 'plasma'
                          ? 'bg-plasma shadow-[0_0_6px_#B8FF2C]'
                          : acc.variant === 'ember'
                          ? 'bg-ember shadow-[0_0_6px_#FF3B30]'
                          : acc.variant === 'ice'
                          ? 'bg-ice shadow-[0_0_6px_#00F0FF]'
                          : 'bg-steel'
                      }`}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-ash/90 truncate block">
                    {acc.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Telemetry Status Line */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-5 text-[10px] font-mono text-ash/70">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-plasma" />
              POSTGRES 5434: CONNECTED
            </span>
            <span>API PORT 4000: HEALTHY</span>
            <span>SOCKET.IO REALTIME: ARMED</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Auth Card Form */}
      <div className="relative z-10 w-full lg:w-5/12 xl:w-2/5 p-6 sm:p-10 lg:p-12 flex items-center justify-center bg-void/95">
        <div className="w-full max-w-md space-y-6">
          <div className="hud-panel p-6 sm:p-8 shadow-2xl backdrop-blur-2xl bg-basalt/95 border-steel/80 rounded-xl">
            {/* Form Header */}
            <div className="mb-6 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-plasma tracking-wider uppercase font-semibold">
                  OPERATOR CLEARANCE
                </span>
                <Link
                  href="/"
                  className="font-mono text-[11px] text-ash hover:text-plasma transition-colors"
                >
                  Landing Page →
                </Link>
              </div>
              <h2 className="font-hud text-2xl sm:text-3xl font-black uppercase text-bone tracking-wide">
                Sign In to Forge
              </h2>
              <p className="font-body text-xs text-ash">
                Authenticate your operator token to enter active sprint spaces.
              </p>
            </div>

            {/* Error Message Banner */}
            {error && (
              <div className="mb-5 p-3.5 bg-crimson/15 border border-crimson/60 rounded-md flex items-start space-x-2 text-crimson font-mono text-xs">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 select-text">
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
                  className="bg-void/80 border-steel focus:border-plasma h-11 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-ash uppercase tracking-wider mb-1.5 font-medium">
                  Master Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                  className="bg-void/80 border-steel focus:border-plasma h-11 text-sm font-mono"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-4 h-12 font-hud font-bold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(184,255,44,0.25)] hover:shadow-[0_0_25px_rgba(184,255,44,0.4)]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    VERIFYING CLEARANCE...
                  </>
                ) : (
                  <>
                    AUTHENTICATE & ENTER FORGE
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Helper Info */}
            <div className="mt-6 pt-5 border-t border-steel/50 flex flex-col items-center space-y-2 text-center">
              <span className="font-mono text-[11px] text-ash/80">
                Evaluating the API directly?
              </span>
              <div className="flex items-center space-x-3">
                <a
                  href="http://localhost:4000/api/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-plasma hover:underline"
                >
                  Interactive Swagger Docs ↗
                </a>
                <span className="text-steel">•</span>
                <Link
                  href="/"
                  className="font-mono text-xs text-bone hover:text-plasma transition-colors"
                >
                  System Specs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
