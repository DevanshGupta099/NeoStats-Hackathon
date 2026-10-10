import React from 'react';

export function HeatSkeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={`relative overflow-hidden bg-steel/30 rounded border border-steel/40 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-plasma/10 before:to-transparent ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="hud-panel p-5 bg-basalt border-steel space-y-3">
      <div className="flex items-center justify-between">
        <HeatSkeleton className="h-4 w-24" />
        <HeatSkeleton className="h-5 w-16" />
      </div>
      <HeatSkeleton className="h-8 w-3/4" />
      <div className="flex items-center space-x-2 pt-2">
        <HeatSkeleton className="h-6 w-6 rounded-full" />
        <HeatSkeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
