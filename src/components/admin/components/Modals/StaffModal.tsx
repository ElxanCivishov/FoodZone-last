import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown, Loader2, X } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { StaffMember } from '@/types';
import { cn } from '@/utils/cn';

interface StaffModalProps {
  open: boolean;
  staff?: StaffMember;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

type StaffRole = StaffMember['role'];
type StaffStatus = StaffMember['status'];

const staffRoles: StaffRole[] = ['admin', 'manager', 'kitchen', 'waiter'];
const staffStatuses: StaffStatus[] = ['active', 'inactive'];

function createStaffSchema(isEditing: boolean) {
  return z
    .object({
      name: z.string().trim().min(2, 'admin.staffView.validation.nameMin').max(80, 'admin.staffView.validation.nameMax'),
      email: z.string().trim().min(1, 'admin.staffView.validation.emailRequired').email('admin.staffView.validation.emailInvalid'),
      password: z.string().trim().optional(),
      role: z.enum(['admin', 'manager', 'kitchen', 'waiter'], {
        required_error: 'admin.staffView.validation.roleRequired',
        invalid_type_error: 'admin.staffView.validation.roleRequired',
      }),
      status: z.enum(['active', 'inactive'], {
        required_error: 'admin.staffView.validation.statusRequired',
        invalid_type_error: 'admin.staffView.validation.statusRequired',
      }),
    })
    .superRefine((data, ctx) => {
      const password = data.password?.trim() || '';
      if (!isEditing && !password) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'admin.staffView.validation.passwordRequired' });
      }
      if (password && password.length < 8) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'admin.staffView.validation.passwordMin' });
      }
    });
}

type StaffFormValues = z.infer<ReturnType<typeof createStaffSchema>>;

function getDefaultValues(staff?: StaffMember): StaffFormValues {
  return {
    name: staff?.name || '',
    email: staff?.email || '',
    password: '',
    role: (staff?.role === 'super_admin' ? 'admin' : staff?.role) || 'waiter',
    status: staff?.status || 'active',
  };
}

export function StaffModal({ open, staff, loading = false, onClose, onSubmit }: StaffModalProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => createStaffSchema(!!staff), [staff]);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(staff),
  });

  useEffect(() => {
    if (!open) return;
    reset(getDefaultValues(staff));
  }, [open, reset, staff]);

  const handleClose = () => {
    if (!loading) onClose();
  };

  const errorMessage = (message?: string) => (message ? t(message) : undefined);

  const onValidSubmit = (data: StaffFormValues) => {
    if (loading) return;
    const password = data.password?.trim();
    onSubmit({
      name: data.name.trim(),
      email: data.email.trim(),
      role: data.role,
      status: data.status,
      ...(password ? { password } : {}),
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-xl">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label={t('common.close')}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-foreground-muted hover:bg-foreground-muted/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>

          <form noValidate onSubmit={handleSubmit(onValidSubmit)} aria-busy={loading} className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-border px-4 py-4">
              <DialogTitle className="pr-8 font-semibold">
                {staff ? t('admin.staffView.editStaff') : t('admin.staffView.addStaff')}
              </DialogTitle>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <fieldset disabled={loading} className="grid grid-cols-1 gap-3 disabled:opacity-70 sm:grid-cols-2">
                <Field label={t('admin.staffView.name')} error={errorMessage(errors.name?.message)}>
                  <input {...register('name')} aria-required aria-invalid={!!errors.name} className={inputClassName(!!errors.name)} />
                </Field>

                <Field label={t('admin.staffView.email')} error={errorMessage(errors.email?.message)}>
                  <input {...register('email')} type="email" aria-required aria-invalid={!!errors.email} className={inputClassName(!!errors.email)} />
                </Field>

                <div className="sm:col-span-2">
                  <Field
                    label={t('admin.staffView.password')}
                    help={staff ? t('admin.staffView.passwordOptional') : t('admin.staffView.passwordRequiredHint')}
                    error={errorMessage(errors.password?.message)}
                  >
                    <input {...register('password')} type="password" aria-required={!staff} aria-invalid={!!errors.password} className={inputClassName(!!errors.password)} />
                  </Field>
                </div>

                <Field label={t('admin.staffView.role')} error={errorMessage(errors.role?.message)}>
                  <Controller
                    control={control}
                    name="role"
                    render={({ field }) => (
                      <StaffListbox
                        value={field.value}
                        options={staffRoles}
                        error={!!errors.role}
                        disabled={loading}
                        getLabel={(role) => t(`admin.roles.${role}`)}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </Field>

                <Field label={t('admin.status')} error={errorMessage(errors.status?.message)}>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <StaffListbox
                        value={field.value}
                        options={staffStatuses}
                        error={!!errors.status}
                        disabled={loading}
                        getLabel={(status) => t(`admin.staffView.status.${status}`)}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </Field>
              </fieldset>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-3 py-2 rounded-xl text-sm font-medium bg-foreground-muted/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-primary-500 text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('common.save')}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function StaffListbox<T extends string>({
  value,
  options,
  error,
  disabled,
  getLabel,
  onChange,
}: {
  value: T;
  options: T[];
  error?: boolean;
  disabled?: boolean;
  getLabel: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <ListboxButton
        className={cn(
          'group flex h-10 w-full items-center justify-between gap-3 rounded-xl border bg-surface px-3 text-left text-sm transition-colors hover:border-primary-500/50 focus:outline-none disabled:cursor-not-allowed',
          error ? 'border-danger-500' : 'border-border',
        )}
      >
        <span className="truncate font-medium text-foreground">{getLabel(value)}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-foreground-muted transition-transform group-data-[open]:rotate-180" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        transition
        className={cn(
          'z-[9999] w-[var(--button-width)] overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-xl focus:outline-none',
          '[--anchor-gap:6px]',
          'transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0',
        )}
      >
        {options.map((option) => (
          <ListboxOption
            key={option}
            value={option}
            className={({ focus, selected }) =>
              cn(
                'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm transition-colors',
                focus && 'bg-primary-500/10 text-primary-500',
                selected && !focus && 'text-primary-500',
                !focus && !selected && 'text-foreground',
              )
            }
          >
            {({ selected }) => (
              <>
                <span className="truncate">{getLabel(option)}</span>
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </>
            )}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

function inputClassName(error?: boolean) {
  return cn(
    'w-full rounded-xl border bg-surface px-3 py-2 text-sm transition-colors focus:outline-none',
    error ? 'border-danger-500 focus:border-danger-500' : 'border-border focus:border-primary-500/60',
  );
}

function Field({ label, help, error, children }: { label: string; help?: string; error?: string; children: ReactNode }) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground-muted">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] leading-4 text-danger-500">{error}</span>
      ) : (
        help && <span className="mt-1 block text-[11px] leading-4 text-foreground-muted">{help}</span>
      )}
    </div>
  );
}
