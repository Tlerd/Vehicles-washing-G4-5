import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const FIELD =
  'w-full bg-surface-soft border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50';

interface FieldWrapProps {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, error, children }: FieldWrapProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(FIELD, className)} {...props}>
      {children}
    </select>
  );
}
