import {
  Armchair,
  Car,
  CircleDot,
  Droplet,
  Shield,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  car: Car,
  armchair: Armchair,
  wrench: Wrench,
  droplet: Droplet,
  'circle-dot': CircleDot,
  shield: Shield,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Car;
  return <Icon className={className} />;
}
