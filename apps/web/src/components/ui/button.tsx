'use client';

import React from 'react';
import { Slot } from '@radix-ui/react-slot';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'plasma';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'outline', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    const baseStyles =
      'inline-flex items-center justify-center font-hud uppercase tracking-wider text-xs font-semibold select-none transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-plasma active:scale-[0.98]';

    const variantStyles = {
      primary:
        'bg-plasma text-void border border-plasma hover:bg-[#c9ff4d] hover:shadow-[0_0_15px_rgba(184,255,44,0.35)]',
      plasma:
        'bg-plasma text-void border border-plasma hover:bg-[#c9ff4d] hover:shadow-[0_0_15px_rgba(184,255,44,0.35)]',
      secondary:
        'bg-graphite text-bone border border-steel hover:border-ash hover:bg-steel/30',
      outline:
        'bg-basalt/80 text-bone border border-steel hover:border-plasma hover:text-plasma',
      destructive:
        'bg-crimson/10 text-crimson border border-crimson/60 hover:bg-crimson hover:text-void',
      ghost:
        'bg-transparent text-ash hover:text-bone hover:bg-graphite border border-transparent',
    }[variant];

    const sizeStyles = {
      sm: 'h-8 px-3 text-[11px]',
      md: 'h-11 px-5 text-xs min-h-[44px]', // 44px mobile touch target
      lg: 'h-13 px-7 text-sm min-h-[48px]',
      icon: 'h-11 w-11 min-w-[44px] min-h-[44px] p-0',
    }[size];

    return (
      <Comp
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} clip-chamfer-tr ${className}`}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
