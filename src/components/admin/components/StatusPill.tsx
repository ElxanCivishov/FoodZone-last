import { useMemo } from 'react';
import { cn } from '@/utils/cn';

export function StatusPill({ status }: { status?: string }) {
  const palette = useMemo(() => {
    if (status === 'active' || status === 'served' || status === 'ready') return 'bg-success-500/10 text-success-500';
    if (status === 'pending' || status === 'preparing') return 'bg-yellow-500/10 text-yellow-500';
    if (status === 'inactive' || status === 'cancelled') return 'bg-danger-500/10 text-danger-500';
    return 'bg-primary-500/10 text-primary-500';
  }, [status]);

  return <span className={cn('inline-flex px-2 py-1 text-xs rounded-full font-medium capitalize', palette)}>{status || '-'}</span>;
}
