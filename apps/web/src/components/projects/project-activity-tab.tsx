'use client';

import React from 'react';
import { useProjectActivity } from '@/lib/queries/use-projects';
import { HeatSkeleton } from '@/components/ui/heat-skeleton';
import { Activity, Clock } from 'lucide-react';

export function ProjectActivityTab({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectActivity(projectId);
  const items = data?.items || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <HeatSkeleton className="h-14 w-full" />
        <HeatSkeleton className="h-14 w-full" />
        <HeatSkeleton className="h-14 w-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="hud-panel p-8 text-center bg-basalt border-steel border-dashed rounded text-xs font-mono text-ash">
        NO AUDIT LOGS RECORDED FOR THIS SECTOR
      </div>
    );
  }

  return (
    <div className="hud-panel bg-basalt border-steel rounded divide-y divide-steel/50">
      {items.map((log) => (
        <div
          key={log.id}
          className="p-3.5 sm:p-4 hover:bg-graphite/40 transition-colors flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center space-x-3 truncate">
            <span className="w-2 h-2 rounded-full bg-plasma flex-shrink-0" />
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <span className="font-hud uppercase font-semibold text-bone">
                  {log.actor?.name || 'Operator'}
                </span>
                <span className="font-mono text-[10px] text-plasma bg-plasma/10 px-1.5 py-0.5 rounded">
                  {log.action}
                </span>
              </div>
              <p className="font-body text-ash text-xs mt-0.5 truncate">
                Entity: {log.entityType} ({log.entityId.slice(0, 8)}...)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 text-ash/60 text-[10px] font-mono flex-shrink-0">
            <Clock className="w-3 h-3" />
            <span>{new Date(log.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
