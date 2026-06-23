import type { ReactNode } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/utils/cn';

interface DataTableProps {
  children: ReactNode;
  loading?: boolean;
  colSpan: number;
}

export function DataTable({ children, loading, colSpan }: DataTableProps) {
  return (
    <div className="bg-surface-elevated border border-border rounded-2xl overflow-auto">
      <table className="w-full text-sm min-w-[760px]">
        {loading ? (
          <tbody>
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center">
                <LoadingSpinner />
              </td>
            </tr>
          </tbody>
        ) : (
          children
        )}
      </table>
    </div>
  );
}

export function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return <th className={cn('px-4 py-3 font-medium', right ? 'text-right' : 'text-left')}>{children}</th>;
}

export function Td({
  children,
  right,
  muted,
  className,
}: {
  children: ReactNode;
  right?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return <td className={cn('px-4 py-3', right && 'text-right', muted && 'text-foreground-muted', className)}>{children}</td>;
}
