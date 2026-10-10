import React from 'react';

export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-graphite border border-steel/40 ${className}`}
      {...props}
    />
  );
}
