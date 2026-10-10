import { ApiHealthProbe } from '@/components/ApiHealthProbe';
import { Flame, Layers, Lock, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#060709] px-4 py-12 md:px-8 max-w-5xl mx-auto">
      {/* Brand Header */}
      <div className="mb-10 text-center md:text-left border-b border-[#2A2F37] pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#2A2F37] bg-[#0E1013] px-3 py-1 text-xs font-mono uppercase tracking-widest text-[#B8FF2C] mb-4">
          <Flame className="h-3.5 w-3.5 text-[#FF5A1F]" />
          Forgeline Operations Engine · Phase 0 Bootstrapped
        </div>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-[#ECE8DF]">
          FORGELINE
        </h1>
        <p className="mt-2 text-sm md:text-base text-[#9AA0A8] max-w-2xl font-mono">
          Multi-user collaborative project management platform built for the NeoStats Hackathon. 
          Server-authoritative permissions, versioned optimistic concurrency, and transaction-safe real-time state.
        </p>
      </div>

      {/* Cross-Process Web <-> API Probe */}
      <div className="mb-10">
        <ApiHealthProbe />
      </div>

      {/* Core Non-Negotiables Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="rounded border border-[#2A2F37] bg-[#0E1013] p-5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#171A1F] border border-[#2A2F37] text-[#FF5A1F] mb-3">
            <Lock className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#ECE8DF]">Server-Side Authz</h3>
          <p className="mt-1 text-xs text-[#9AA0A8] leading-relaxed">
            PolicyService pure matrix enforced on all endpoints. Direct API requests without permission return HTTP 403.
          </p>
        </div>

        <div className="rounded border border-[#2A2F37] bg-[#0E1013] p-5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#171A1F] border border-[#2A2F37] text-[#B8FF2C] mb-3">
            <Layers className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#ECE8DF]">Optimistic Concurrency</h3>
          <p className="mt-1 text-xs text-[#9AA0A8] leading-relaxed">
            Every task has atomic version locking. Conflicting simultaneous edits yield HTTP 409 and launch the conflict resolution sheet.
          </p>
        </div>

        <div className="rounded border border-[#2A2F37] bg-[#0E1013] p-5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#171A1F] border border-[#2A2F37] text-[#5CE1E6] mb-3">
            <Zap className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#ECE8DF]">Post-Commit Realtime</h3>
          <p className="mt-1 text-xs text-[#9AA0A8] leading-relaxed">
            Socket.IO broadcasts strictly after DB transaction commit. Minimal envelopes directly patch TanStack Query cache.
          </p>
        </div>
      </div>

      {/* System Status Readout */}
      <div className="rounded border border-[#2A2F37] bg-[#0E1013] p-5 font-mono text-xs text-[#9AA0A8]">
        <div className="flex justify-between items-center border-b border-[#2A2F37] pb-3 mb-3">
          <span className="text-[#ECE8DF] font-bold uppercase">System Manifest</span>
          <span className="text-[#B8FF2C]">READY</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><span className="text-[#9AA0A8]">Monorepo:</span> <span className="text-[#ECE8DF]">pnpm workspaces</span></div>
          <div><span className="text-[#9AA0A8]">Frontend:</span> <span className="text-[#ECE8DF]">Next.js 15 (Port 3000)</span></div>
          <div><span className="text-[#9AA0A8]">Backend:</span> <span className="text-[#ECE8DF]">NestJS (Port 4000)</span></div>
          <div><span className="text-[#9AA0A8]">Database:</span> <span className="text-[#ECE8DF]">PostgreSQL 16 (:5432)</span></div>
        </div>
      </div>
    </main>
  );
}
