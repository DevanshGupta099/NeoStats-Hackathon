'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'plasma' | 'ember' | 'ice' | 'amber' | 'crimson' | 'steel';
}

export function Badge({
  className = '',
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-graphite text-ash border-steel',
    plasma: 'bg-plasma/10 text-plasma border-plasma/40',
    ember: 'bg-ember/10 text-ember border-ember/40',
    ice: 'bg-ice/10 text-ice border-ice/40',
    amber: 'bg-amber/10 text-amber border-amber/40',
    crimson: 'bg-crimson/10 text-crimson border-crimson/40',
    steel: 'bg-steel/30 text-bone border-steel',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 font-mono text-[10px] uppercase font-bold tracking-widest border select-none ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
