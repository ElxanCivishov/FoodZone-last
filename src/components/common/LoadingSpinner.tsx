import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export function LoadingSpinner({ className, size = 24 }: { className?: string; size?: number }) {
  return <Loader2 className={cn("animate-spin text-primary-500", className)} style={{ width: size, height: size }} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-foreground-muted/10 rounded-lg", className)} />;
}
