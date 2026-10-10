'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error = false, type = 'text', ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={type}
          className={`w-full h-11 min-h-[44px] px-3.5 bg-basalt text-bone font-mono text-sm border ${
            error ? 'border-crimson focus:ring-crimson' : 'border-steel focus:border-plasma focus:ring-1 focus:ring-plasma/50'
          } placeholder:text-ash/40 outline-none transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {/* Subtle HUD micro-bracket on input corner */}
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-ash/30 pointer-events-none" />
      </div>
    );
  },
);

Input.displayName = 'Input';
