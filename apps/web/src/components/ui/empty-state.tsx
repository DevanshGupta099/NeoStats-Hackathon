import React from 'react';
import { Layers, AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'NO RECORDS IN SECTOR',
  description = 'No active telemetry or tasks currently registered in this view.',
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="hud-panel p-8 md:p-12 text-center bg-basalt/60 border-steel border-dashed flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded bg-graphite border border-steel flex items-center justify-center text-ash">
        {icon || <Layers className="w-6 h-6 text-ash/80" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="font-hud uppercase tracking-wider text-sm font-bold text-bone">{title}</h4>
        <p className="font-body text-xs text-ash">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'TELEMETRY DISRUPTION',
  message = 'Failed to load remote record. Check connection or access permissions.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="hud-panel p-6 bg-crimson/10 border-crimson/40 text-center flex flex-col items-center justify-center space-y-3">
      <AlertTriangle className="w-8 h-8 text-crimson" />
      <div className="space-y-1">
        <h4 className="font-hud uppercase text-xs font-bold text-crimson">{title}</h4>
        <p className="font-body text-xs text-ash">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          RETRY TRANSMISSION
        </Button>
      )}
    </div>
  );
}
