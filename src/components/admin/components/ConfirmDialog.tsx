import type { ReactNode } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  children?: ReactNode;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  children,
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const handleCancel = () => {
    if (!loading) onCancel();
  };
  const handleConfirm = () => {
    if (!loading) onConfirm();
  };

  return (
    <Dialog open={open} onClose={handleCancel} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel aria-busy={loading} className="relative w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-4 shadow-xl">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            aria-label={t('common.close')}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-foreground-muted hover:bg-foreground-muted/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        <DialogTitle className="pr-8 font-semibold">{title}</DialogTitle>
        <p className="mt-2 text-sm text-foreground-muted">{message}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-3 py-2 rounded-xl text-sm font-medium bg-foreground-muted/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-danger-500 text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
