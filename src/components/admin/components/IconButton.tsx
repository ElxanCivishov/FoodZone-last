import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface IconButtonProps {
  children: ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}

export function IconButton({ children, onClick, title, danger }: IconButtonProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-lg inline-flex ml-1',
        danger ? 'text-danger-500 hover:bg-danger-500/10' : 'text-foreground-muted hover:bg-foreground-muted/5',
      )}
    >
      {children}
    </button>
  );
}
