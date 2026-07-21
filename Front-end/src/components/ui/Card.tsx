import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
  selected?: boolean;
}

export function Card({ children, className, interactive, selected, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface border rounded-[var(--d-radius-card,16px)] p-[var(--d-pad-card,20px)] transition-all',
        selected ? 'border-primary ring-1 ring-primary' : 'border-border',
        interactive && 'cursor-pointer hover:border-primary/60 hover:shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
