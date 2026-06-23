import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface MetricCardProps {
  label: string;
  value: string | number;
  change: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export function MetricCard({ label, value, change, icon: Icon, color, bg }: MetricCardProps) {
  return (
    <div className="p-4 bg-surface-elevated border border-border rounded-2xl">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', bg)}>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-foreground-muted mt-1">{label}</p>
      <p className="text-xs font-medium mt-1 text-foreground-muted">{change}</p>
    </div>
  );
}
