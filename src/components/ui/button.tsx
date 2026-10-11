import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 shadow-sm font-medium',
      destructive: 'bg-red-900/60 text-red-200 border border-red-800 hover:bg-red-900',
      outline: 'border border-zinc-800 bg-transparent text-zinc-200 hover:bg-zinc-900 hover:text-white',
      secondary: 'bg-zinc-900 text-zinc-100 border border-zinc-800 hover:bg-zinc-800',
      ghost: 'hover:bg-zinc-900 text-zinc-300 hover:text-white',
      link: 'text-zinc-300 underline-offset-4 hover:underline',
    }[variant];

    const sizeStyles = {
      default: 'h-9 px-4 py-2 text-xs',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-10 px-8 text-sm',
      icon: 'h-8 w-8 p-0',
    }[size];

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
          variantStyles,
          sizeStyles,
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
