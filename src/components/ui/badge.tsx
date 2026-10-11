import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'border-transparent bg-zinc-100 text-zinc-950 shadow hover:bg-zinc-200',
    secondary: 'border-transparent bg-zinc-900 text-zinc-300 hover:bg-zinc-800',
    destructive: 'border-red-800 bg-red-950/60 text-red-300',
    outline: 'text-zinc-300 border-zinc-800',
  }[variant];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono tracking-wider uppercase',
        variantStyles,
        className
      )}
      {...props}
    />
  );
}
