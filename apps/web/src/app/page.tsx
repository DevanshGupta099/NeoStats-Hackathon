'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Shield,
  Zap,
  GitBranch,
  Bot,
  Activity,
  Layers,
  Terminal,
  CheckCircle2,
  Lock,
  Users,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-void text-bone selection:bg-plasma selection:text-void font-body overflow-x-hidden">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-plasma/10 border-b border-plasma/20 px-4 py-2 text-center text-xs font-mono text-plasma flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-plasma animate-pulse" />
        <span>NEOSTATS HACKATHON 2026: FORGELINE MULTI-USER CONCURRENCY ENGINE READY</span>
        <span className="hidden sm:inline-block text-ash">•</span>
        <a
          href="http://localhost:4000/api/docs"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1 font-bold underline hover:text-bone transition-colors"
        >
          INTERACTIVE SWAGGER API DOCS ↗
        </a>
      </div>

      {/* 2. NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-void/85 border-b border-steel/60 px-6 sm:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3.5 h-3.5 bg-plasma rotate-45 shadow-[0_0_12px_rgba(184,255,44,0.7)]" />
          <span className="font-display font-black text-xl tracking-wider text-bone">
            FORGELINE
          </span>
          <span className="hidden md:inline-block font-mono text-[10px] text-plasma bg-plasma/10 border border-plasma/30 px-2 py-0.5 rounded font-semibold tracking-widest">
            v1.0 OCC
          </span>
        </div>

        <div className="hidden lg:flex items-center space-x-8 text-xs font-mono text-ash font-medium tracking-wide">
          <a href="#features" className="hover:text-plasma transition-colors">
            CORE TENETS
          </a>
          <a href="#concurrency" className="hover:text-plasma transition-colors">
            OCC CONCURRENCY
          </a>
          <a href="#roles" className="hover:text-plasma transition-colors">
            ROLE MATRIX
          </a>
          <a href="http://localhost:4000/api/docs" target="_blank" rel="noreferrer" className="hover:text-plasma transition-colors flex items-center gap-1">
            OPENAPI DOCS <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="font-hud font-bold text-xs uppercase tracking-wider">
                GO TO DASHBOARD <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-hud text-xs uppercase tracking-wider text-bone hover:text-plasma">
                  SIGN IN
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="primary" size="sm" className="font-hud font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(184,255,44,0.3)]">
                  LAUNCH FORGE <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* 3. HERO SECTION */}
      <section className="relative px-6 sm:px-12 pt-16 sm:pt-24 pb-20 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 -translate-y-1/2 w-96 sm:w-[600px] h-96 sm:h-[400px] bg-plasma/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-basalt border border-steel/80 mb-6 text-xs font-mono text-ash">
          <span className="w-2 h-2 rounded-full bg-plasma animate-ping" />
          <span className="text-bone font-semibold">ZERO SILENT DATA LOSS</span>
          <span className="text-steel">•</span>
          <span className="text-plasma">ATOMIC VERSION LOCKS</span>
        </div>

        <h1 className="font-hud text-4xl sm:text-6xl lg:text-7xl font-black uppercase text-bone tracking-tight max-w-5xl leading-none">
          Industrial Collaborative Workflows With <span className="text-plasma drop-shadow-[0_0_25px_rgba(184,255,44,0.35)]">Zero Write Collisions</span>
        </h1>

        <p className="font-body text-base sm:text-xl text-ash max-w-3xl mt-6 leading-relaxed">
          Forgeline is a high-velocity project management platform built for engineering teams. Engineered with strict optimistic concurrency control, dual-tier server authorization with the Rule of Cap, and sub-50ms Socket.IO real-time sync.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full justify-center">
          <Link href={user ? '/dashboard' : '/login'}>
            <Button variant="primary" size="lg" className="w-full sm:w-auto min-h-[52px] px-8 font-hud font-bold text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(184,255,44,0.35)] hover:shadow-[0_0_40px_rgba(184,255,44,0.5)]">
              {user ? 'OPEN OPERATIONS DASHBOARD' : 'ENTER WORKSPACE WITH DEMO ROLES'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a
            href="http://localhost:4000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto"
          >
            <Button variant="secondary" size="lg" className="w-full sm:w-auto min-h-[52px] px-6 font-hud font-bold text-sm uppercase tracking-wider border-steel/80 hover:border-plasma/60">
              EXPLORE SWAGGER API (PORT 4000)
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </a>
        </div>

        {/* Live Metrics Ticker Bar */}
        <div className="w-full max-w-5xl mt-16 p-4 sm:p-5 rounded-xl bg-basalt/80 border border-steel/70 grid grid-cols-2 md:grid-cols-4 gap-4 text-left shadow-2xl backdrop-blur-md">
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-ash uppercase tracking-wider block">
              CONCURRENCY ENGINE
            </span>
            <span className="font-hud text-xl sm:text-2xl font-black text-plasma block">
              100% OCC SAFE
            </span>
            <span className="font-mono text-[11px] text-ash/80">
              Atomic SQL version locks
            </span>
          </div>

          <div className="space-y-1">
            <span className="font-mono text-[10px] text-ash uppercase tracking-wider block">
              REALTIME SYNC MESH
            </span>
            <span className="font-hud text-xl sm:text-2xl font-black text-ice block">
              &lt; 28MS LATENCY
            </span>
            <span className="font-mono text-[11px] text-ash/80">
              Post-commit domain events
            </span>
          </div>

          <div className="space-y-1">
            <span className="font-mono text-[10px] text-ash uppercase tracking-wider block">
              SECURITY PROTOCOL
            </span>
            <span className="font-hud text-xl sm:text-2xl font-black text-ember block">
              DUAL-TIER CAP
            </span>
            <span className="font-mono text-[11px] text-ash/80">
              Server-authoritative guards
            </span>
          </div>

          <div className="space-y-1">
            <span className="font-mono text-[10px] text-ash uppercase tracking-wider block">
              AI SYNTHESIS
            </span>
            <span className="font-hud text-xl sm:text-2xl font-black text-amber block">
              MISTRAL STREAM
            </span>
            <span className="font-mono text-[11px] text-ash/80">
              Live SSE standup digests
            </span>
          </div>
        </div>
      </section>

      {/* 4. CORE ARCHITECTURAL TENETS */}
      <section id="features" className="py-20 px-6 sm:px-12 max-w-7xl mx-auto border-t border-steel/60">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="font-mono text-xs text-plasma font-semibold uppercase tracking-widest block">
            THE 4 ARCHITECTURAL PILLARS
          </span>
          <h2 className="font-hud text-3xl sm:text-4xl font-black uppercase text-bone">
            Engineered For Zero Silent Overwrites
          </h2>
          <p className="font-body text-ash text-sm sm:text-base">
            Conventional collaboration tools silently discard simultaneous edits. Forgeline mathematically guarantees data consistency through four battle-tested systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: OCC */}
          <div className="hud-panel p-6 sm:p-8 bg-basalt/90 border-steel/80 rounded-xl space-y-4 hover:border-plasma/60 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-plasma/10 border border-plasma/30 flex items-center justify-center text-plasma group-hover:scale-110 transition-transform">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="font-hud text-xl font-bold uppercase text-bone">
              1. Optimistic Concurrency Control (OCC)
            </h3>
            <p className="font-body text-sm text-ash leading-relaxed">
              Every task and project model contains an integer <code className="text-plasma font-mono font-bold">version</code> counter. Writes execute an atomic conditional statement:
            </p>
            <div className="p-3 rounded bg-void border border-steel/60 font-mono text-xs text-bone/90 overflow-x-auto">
              <code>UPDATE tasks SET ..., version = version + 1 WHERE id = $1 AND version = $knownVersion;</code>
            </div>
            <p className="font-body text-xs text-ash/90">
              If another user modified the row first, zero rows are affected. The API responds with an HTTP 409 conflict envelope and displays an inline interactive side-by-side diff drawer.
            </p>
          </div>

          {/* Card 2: Real-Time Mesh */}
          <div className="hud-panel p-6 sm:p-8 bg-basalt/90 border-steel/80 rounded-xl space-y-4 hover:border-ice/60 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-ice/10 border border-ice/30 flex items-center justify-center text-ice group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-hud text-xl font-bold uppercase text-bone">
              2. Post-Commit Domain Event Mesh
            </h3>
            <p className="font-body text-sm text-ash leading-relaxed">
              Real-time events are never emitted inside an open transaction. Once the PostgreSQL transaction commits successfully, the service notifies the <code className="text-ice font-mono">DomainEventBus</code>.
            </p>
            <div className="p-3 rounded bg-void border border-steel/60 font-mono text-xs text-bone/90 overflow-x-auto">
              <code>Socket.IO &rarr; Rooms: user:&#123;id&#125; + project:&#123;id&#125; &rarr; Cache Invalidation</code>
            </div>
            <p className="font-body text-xs text-ash/90">
              Multi-window state synchronization updates within 30 milliseconds across normal, incognito, and mobile browser sessions without polling.
            </p>
          </div>

          {/* Card 3: Dual-Tier Authorization */}
          <div className="hud-panel p-6 sm:p-8 bg-basalt/90 border-steel/80 rounded-xl space-y-4 hover:border-ember/60 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-ember/10 border border-ember/30 flex items-center justify-center text-ember group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-hud text-xl font-bold uppercase text-bone">
              3. Dual-Tier Policy Matrix & Rule of Cap
            </h3>
            <p className="font-body text-sm text-ash leading-relaxed">
              Every operation is validated on the server by a pure deterministic function in <code className="text-ember font-mono">PolicyService.can(...)</code>. 
            </p>
            <div className="p-3 rounded bg-void border border-steel/60 font-mono text-xs text-bone/90 overflow-x-auto">
              <code>Effective Clearance = Math.min(GlobalRole, ProjectRole)</code>
            </div>
            <p className="font-body text-xs text-ash/90">
              Even if a user with global Viewer clearance is assigned as Project Manager, the Rule of Cap rejects mutations with HTTP 403 Forbidden.
            </p>
          </div>

          {/* Card 4: AI Standup Digest */}
          <div className="hud-panel p-6 sm:p-8 bg-basalt/90 border-steel/80 rounded-xl space-y-4 hover:border-amber/60 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-amber/10 border border-amber/30 flex items-center justify-center text-amber group-hover:scale-110 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-hud text-xl font-bold uppercase text-bone">
              4. Mistral AI Executive Synthesis
            </h3>
            <p className="font-body text-sm text-ash leading-relaxed">
              Integrated with Mistral LLM via SSE text streaming. Generates executive sprint digests and structured JSON task drafts from natural language prompts.
            </p>
            <div className="p-3 rounded bg-void border border-steel/60 font-mono text-xs text-bone/90 overflow-x-auto">
              <code>POST /projects/:id/ai/digest &rarr; text/event-stream (Streaming Terminal)</code>
            </div>
            <p className="font-body text-xs text-ash/90">
              Includes exponential 429 backoff handling, token budgeting, and a 100% deterministic offline fallback if the AI flag is disabled.
            </p>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE ROLE ACCESS MATRIX */}
      <section id="roles" className="py-20 px-6 sm:px-12 max-w-7xl mx-auto border-t border-steel/60">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="font-mono text-xs text-plasma font-semibold uppercase tracking-widest block">
            ROLE-BASED CLEARANCE MATRIX
          </span>
          <h2 className="font-hud text-3xl sm:text-4xl font-black uppercase text-bone">
            4 Granular Operator Roles
          </h2>
          <p className="font-body text-ash text-sm sm:text-base">
            Every user is classified globally, with per-project scoping enforced at the NestJS guard layer.
          </p>
        </div>

        <div className="overflow-x-auto hud-panel p-4 sm:p-6 bg-basalt/90 border-steel/80 rounded-xl">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-steel/60 text-ash uppercase">
                <th className="py-3 px-4">Action / Capability</th>
                <th className="py-3 px-4 text-ember">Admin</th>
                <th className="py-3 px-4 text-plasma">Project Manager</th>
                <th className="py-3 px-4 text-ice">Team Member</th>
                <th className="py-3 px-4 text-steel">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel/40">
              <tr>
                <td className="py-3 px-4 font-body text-bone font-medium">Create New Projects</td>
                <td className="py-3 px-4 text-plasma font-bold">YES</td>
                <td className="py-3 px-4 text-crimson font-bold">NO</td>
                <td className="py-3 px-4 text-crimson font-bold">NO</td>
                <td className="py-3 px-4 text-crimson font-bold">NO</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-body text-bone font-medium">Manage Team Roster & Roles</td>
                <td className="py-3 px-4 text-plasma font-bold">YES</td>
                <td className="py-3 px-4 text-plasma font-bold">YES</td>
                <td className="py-3 px-4 text-crimson font-bold">NO</td>
                <td className="py-3 px-4 text-crimson font-bold">NO</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-body text-bone font-medium">Create Tasks & Assign Work</td>
                <td className="py-3 px-4 text-plasma font-bold">YES</td>
                <td className="py-3 px-4 text-plasma font-bold">YES</td>
                <td className="py-3 px-4 text-crimson font-bold">NO</td>
                <td className="py-3 px-4 text-crimson font-bold">NO</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-body text-bone font-medium">Transition Workflow Status (Drag & Drop)</td>
                <td className="py-3 px-4 text-plasma font-bold">YES</td>
                <td className="py-3 px-4 text-plasma font-bold">YES</td>
                <td className="py-3 px-4 text-plasma font-bold">YES (Assigned)</td>
                <td className="py-3 px-4 text-crimson font-bold">NO</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-body text-bone font-medium">Post & Moderate Task Comments</td>
                <td className="py-3 px-4 text-plasma font-bold">YES (All)</td>
                <td className="py-3 px-4 text-plasma font-bold">YES (All)</td>
                <td className="py-3 px-4 text-plasma font-bold">YES (Own)</td>
                <td className="py-3 px-4 text-crimson font-bold">NO</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-body text-bone font-medium">Stream AI Executive Digest</td>
                <td className="py-3 px-4 text-plasma font-bold">YES</td>
                <td className="py-3 px-4 text-plasma font-bold">YES</td>
                <td className="py-3 px-4 text-plasma font-bold">YES</td>
                <td className="py-3 px-4 text-plasma font-bold">YES</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. CALL TO ACTION & FOOTER */}
      <footer className="border-t border-steel/60 bg-basalt/60 py-16 px-6 sm:px-12 text-center select-none">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="w-4 h-4 bg-plasma rotate-45 mx-auto shadow-[0_0_12px_rgba(184,255,44,0.8)]" />
          <h2 className="font-hud text-3xl sm:text-4xl font-black uppercase text-bone">
            Ready to Experience the Forge?
          </h2>
          <p className="font-body text-ash text-sm sm:text-base max-w-xl mx-auto">
            Test simultaneous multi-client mutations in live split windows and verify conflict-free resolution.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/login">
              <Button variant="primary" size="lg" className="min-h-[48px] px-8 font-hud font-bold text-xs uppercase tracking-wider">
                SIGN IN WITH DEMO ACCOUNT <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <a href="http://localhost:4000/api/docs" target="_blank" rel="noreferrer">
              <Button variant="secondary" size="lg" className="min-h-[48px] px-6 font-hud font-bold text-xs uppercase tracking-wider">
                OPENAPI 3.0 CONSOLE ↗
              </Button>
            </a>
          </div>

          <div className="pt-10 border-t border-steel/40 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-ash/70 gap-4">
            <span>FORGELINE // NEOSTATS HACKATHON 2026 • CREATED BY DEVANSH GUPTA</span>
            <div className="flex items-center space-x-4">
              <a href="https://github.com/DevanshGupta099/NeoStats-Hackathon" target="_blank" rel="noreferrer" className="hover:text-plasma transition-colors">
                GITHUB REPOSITORY
              </a>
              <span>•</span>
              <a href="http://localhost:4000/api/docs" target="_blank" rel="noreferrer" className="hover:text-plasma transition-colors">
                SWAGGER UI
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
