import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'primary-gradient text-white shadow-primary-btn hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0',
  secondary:
    'bg-surface text-text-primary border border-border hover:bg-surface-soft disabled:opacity-50',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-soft',
  danger: 'bg-danger text-white hover:opacity-90 disabled:opacity-50',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm min-h-[36px]',
  md: 'px-5 py-2.5 text-sm min-h-[44px]',
  lg: 'px-6 py-3.5 text-base min-h-[52px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
