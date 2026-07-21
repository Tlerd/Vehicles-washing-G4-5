import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
  steps: string[];
  current: number; // 0-based index of the active step
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                done && 'bg-primary text-white',
                active && 'bg-primary-light text-primary-dark ring-2 ring-primary',
                !done && !active && 'bg-surface-soft text-text-muted',
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={cn(
                'hidden text-sm font-medium sm:inline',
                active ? 'text-text-primary' : 'text-text-muted',
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && <span className="h-px w-4 bg-border sm:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}
