'use client';

import React from 'react';
import { useNotifications } from '@/lib/queries/use-notifications';
import { HeatSkeleton } from '../ui/heat-skeleton';
import { Activity, Clock } from 'lucide-react';

export function ActivityTicker() {
  const { data, isLoading } = useNotifications(false);
  const items = data?.items?.slice(0, 5) || [];

  return (
    <div className="hud-panel p-4 sm:p-5 bg-basalt border-steel">
      <div className="flex items-center justify-between mb-3 border-b border-steel/60 pb-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-3.5 h-3.5 text-ice animate-pulse" />
          <span className="font-mono text-[10px] text-ice tracking-wider uppercase font-bold">
            // TELEMETRY EVENT STREAM
          </span>
        </div>
        <span className="font-mono text-[10px] text-ash">LIVE TICKER</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <HeatSkeleton className="h-10 w-full" />
          <HeatSkeleton className="h-10 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-4 text-center font-mono text-xs text-ash/70">
          AWAITING INCOMING TELEMETRY SIGNALS
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((notif) => (
            <div
              key={notif.id}
              className="p-2.5 bg-graphite/60 border border-steel/40 rounded flex items-center justify-between text-xs hover:border-steel transition-colors"
            >
              <div className="flex items-center space-x-3 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-ice flex-shrink-0" />
                <div className="truncate">
                  <span className="font-hud uppercase text-bone font-medium mr-2">
                    {notif.title}
                  </span>
                  <span className="text-ash truncate">{notif.body}</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-ash/60 text-[10px] font-mono flex-shrink-0 ml-2">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(notif.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
