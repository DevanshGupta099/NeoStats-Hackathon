'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/queries/keys';
import { ActivityLogItem } from '@/lib/queries/use-projects';
import { HeatSkeleton } from '@/components/ui/heat-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Activity, Clock, Filter, Layers, User } from 'lucide-react';

export default function ActivityStreamPage() {
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['activity', 'system', { entityType: entityFilter }],
    queryFn: () => {
      const qs = entityFilter !== 'ALL' ? `?entityType=${entityFilter}` : '';
      return apiClient.get<{ items: ActivityLogItem[]; nextCursor: string | null }>(
        `/activity${qs}`,
      );
    },
  });

  const items = data?.items || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="hud-panel p-5 sm:p-7 hud-corner-brackets bg-basalt/85 border-steel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-plasma mb-1">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="font-mono text-[10px] tracking-widest uppercase">
                // AUDIT TRAIL TELEMETRY
              </span>
            </div>
            <h1 className="font-hud uppercase tracking-wide text-2xl sm:text-3xl font-black text-bone">
              SYSTEM ACTIVITY TIMELINE
            </h1>
            <p className="font-body text-xs sm:text-sm text-ash mt-1">
              Immutable chronological record of project mutations, status updates, and collaborator dispatches.
            </p>
          </div>

          {/* Entity Type Filter Chips */}
          <div className="flex items-center space-x-1.5 bg-void p-1 rounded border border-steel overflow-x-auto self-start sm:self-auto">
            {['ALL', 'TASK', 'COMMENT', 'PROJECT', 'MEMBER'].map((type) => (
              <button
                key={type}
                onClick={() => setEntityFilter(type)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors whitespace-nowrap min-h-[36px] ${
                  entityFilter === type
                    ? 'bg-plasma text-void font-bold'
                    : 'text-ash hover:text-bone hover:bg-steel/30'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Timeline List */}
      {isLoading ? (
        <div className="space-y-3">
          <HeatSkeleton className="h-16 w-full" />
          <HeatSkeleton className="h-16 w-full" />
          <HeatSkeleton className="h-16 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="NO AUDIT TELEMETRY LOGS"
          description="No recent activity matches your current filter criteria."
        />
      ) : (
        <div className="hud-panel bg-basalt border-steel rounded divide-y divide-steel/50 overflow-hidden">
          {items.map((log) => (
            <div
              key={log.id}
              className="p-4 hover:bg-graphite/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start sm:items-center space-x-3.5 flex-1 min-w-0">
                <div className="w-2 h-2 rounded-full bg-plasma mt-1.5 sm:mt-0 flex-shrink-0" />

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="font-hud uppercase font-bold text-bone">
                      {log.actor?.name || 'Collaborator'}
                    </span>
                    <span className="font-mono text-[10px] text-plasma bg-plasma/10 border border-plasma/30 px-1.5 py-0.2 rounded font-bold">
                      {log.action}
                    </span>
                    <span className="font-mono text-[9px] text-ash bg-steel/30 px-1.5 py-0.2 rounded uppercase">
                      {log.entityType}
                    </span>
                  </div>

                  <p className="font-body text-xs text-ash">
                    Entity Target: <span className="font-mono text-bone">{log.entityId}</span>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <span className="text-ash/70 block sm:inline sm:ml-2">
                        Details: {JSON.stringify(log.metadata)}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-ash/60 text-[10px] font-mono flex-shrink-0 self-end sm:self-center">
                <Clock className="w-3 h-3" />
                <span>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
