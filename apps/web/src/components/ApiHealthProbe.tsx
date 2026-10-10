'use client';

import { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertTriangle, ShieldCheck, Database, RefreshCw } from 'lucide-react';

interface HealthResponse {
  status: string;
  cors?: boolean;
  credentials?: boolean;
  message?: string;
  timestamp?: string;
}

export function ApiHealthProbe() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const res = await fetch(`${apiUrl}/health/probe-cors`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`API responded with status ${res.status}`);
      }

      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reach API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApi();
  }, []);

  return (
    <div className="rounded-lg border border-[#2A2F37] bg-[#0E1013] p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-[#2A2F37] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded border border-[#2A2F37] bg-[#171A1F]">
            <Activity className="h-5 w-5 text-[#B8FF2C]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wider uppercase text-[#ECE8DF]">
              Cross-Port CORS & Credential Probe
            </h2>
            <p className="text-xs text-[#9AA0A8]">
              Next.js (Port 3000) ↔ NestJS (Port 4000) with SameSite=Lax httpOnly Cookies
            </p>
          </div>
        </div>
        <button
          onClick={checkApi}
          disabled={loading}
          className="flex items-center gap-2 rounded border border-[#2A2F37] bg-[#171A1F] px-3 py-1.5 text-xs font-medium text-[#ECE8DF] hover:border-[#B8FF2C] hover:text-[#B8FF2C] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Re-test
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded border border-[#2A2F37] bg-[#171A1F]/60 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#9AA0A8]">
            <CheckCircle2 className="h-4 w-4 text-[#B8FF2C]" />
            CORS Preflight
          </div>
          <div className="mt-1 text-sm font-bold text-[#ECE8DF]">
            {data?.cors ? 'PASSED (Origin Allowed)' : loading ? 'Probing...' : 'Pending'}
          </div>
        </div>

        <div className="rounded border border-[#2A2F37] bg-[#171A1F]/60 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#9AA0A8]">
            <ShieldCheck className="h-4 w-4 text-[#5CE1E6]" />
            Credentials Exchange
          </div>
          <div className="mt-1 text-sm font-bold text-[#ECE8DF]">
            {data?.credentials ? 'PASSED (Cookie Received)' : loading ? 'Probing...' : 'Pending'}
          </div>
        </div>

        <div className="rounded border border-[#2A2F37] bg-[#171A1F]/60 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#9AA0A8]">
            <Database className="h-4 w-4 text-[#FFB020]" />
            API Port
          </div>
          <div className="mt-1 text-sm font-bold text-[#ECE8DF]">
            localhost:4000/api/v1
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded border border-[#FF2E4D]/30 bg-[#FF2E4D]/10 p-3 text-xs text-[#FF2E4D]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error} — ensure API server is running on port 4000.</span>
        </div>
      )}

      {data && (
        <div className="mt-4 rounded bg-[#060709] p-3 text-xs font-mono text-[#9AA0A8] border border-[#2A2F37]">
          <span className="text-[#B8FF2C]">$ response:</span> {JSON.stringify(data, null, 2)}
        </div>
      )}
    </div>
  );
}
