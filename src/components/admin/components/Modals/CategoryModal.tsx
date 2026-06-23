import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown, Loader2, X } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { cn } from '@/utils/cn';
import type { Category } from '@/types';

interface CategoryModalProps {
  open: boolean;
  category?: Category;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

type CategoryStatus = Category['status'];

const categoryFormSchema = z.object({
  nameAz: z.string().trim().min(1, 'admin.categories.validation.nameAzRequired').max(80, 'admin.categories.validation.translationMax'),
  nameEn: z.string().trim().min(1, 'admin.categories.validation.nameEnRequired').max(80, 'admin.categories.validation.translationMax'),
  nameRu: z.string().trim().min(1, 'admin.categories.validation.nameRuRequired').max(80, 'admin.categories.validation.translationMax'),
  nameTr: z.string().trim().min(1, 'admin.categories.validation.nameTrRequired').max(80, 'admin.categories.validation.translationMax'),
  icon: z.string().trim().max(300, 'admin.categories.validation.iconMax').optional(),
  status: z.enum(['active', 'inactive'], {
    required_error: 'admin.categories.validation.statusRequired',
    invalid_type_error: 'admin.categories.validation.statusRequired',
  }),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

function getDefaultValues(category?: Category): CategoryFormValues {
  return {
    nameAz: category?.nameAz || category?.name || '',
    nameEn: category?.nameEn || category?.name || '',
    nameRu: category?.nameRu || category?.name || '',
    nameTr: category?.nameTr || category?.name || '',
    icon: category?.icon || 'utensils',
    status: category?.status || 'active',
  };
}

export function CategoryModal({ open, category, loading = false, onClose, onSubmit }: CategoryModalProps) {
  const { t } = useTranslation();
  const [iconsOpen, setIconsOpen] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: getDefaultValues(category),
  });

  useEffect(() => {
    if (!open) return;
    reset(getDefaultValues(category));
    setIconsOpen(false);
  }, [category, open, reset]);

  const onValidSubmit = (data: CategoryFormValues) => {
    if (loading) return;
    const nameAz = data.nameAz.trim();
    const nameEn = data.nameEn.trim();
    const nameRu = data.nameRu.trim();
    const nameTr = data.nameTr.trim();
    onSubmit({
      name: nameAz,
      nameAz,
      nameEn,
      nameRu,
      nameTr,
      icon: data.icon?.trim() || undefined,
      status: data.status,
    });
  };

  const errorMessage = (message?: string) => (message ? t(message) : undefined);
  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-xl">
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
                {category ? t('admin.categories.editCategory') : t('admin.categories.addCategory')}
              </DialogTitle>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <fieldset disabled={loading} className="grid grid-cols-1 gap-3 disabled:opacity-70 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Controller
                    control={control}
                    name="icon"
                    render={({ field }) => (
                      <IconPicker
                        value={field.value || ''}
                        open={iconsOpen}
                        error={errorMessage(errors.icon?.message)}
                        disabled={loading}
                        onToggle={() => setIconsOpen((value) => !value)}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <Field label="AZ" error={errorMessage(errors.nameAz?.message)}>
                  <input {...register('nameAz')} aria-required aria-invalid={!!errors.nameAz} className={inputClassName(!!errors.nameAz)} />
                </Field>
                <Field label="EN" error={errorMessage(errors.nameEn?.message)}>
                  <input {...register('nameEn')} aria-required aria-invalid={!!errors.nameEn} className={inputClassName(!!errors.nameEn)} />
                </Field>
                <Field label="RU" error={errorMessage(errors.nameRu?.message)}>
                  <input {...register('nameRu')} aria-required aria-invalid={!!errors.nameRu} className={inputClassName(!!errors.nameRu)} />
                </Field>
                <Field label="TR" error={errorMessage(errors.nameTr?.message)}>
                  <input {...register('nameTr')} aria-required aria-invalid={!!errors.nameTr} className={inputClassName(!!errors.nameTr)} />
                </Field>
                <Field label={t('admin.status')} error={errorMessage(errors.status?.message)}>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <StatusListbox value={field.value} error={!!errors.status} disabled={loading} onChange={field.onChange} />
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

const iconOptions = [
  'utensils',
  'chef-hat',
  'pizza',
  'sandwich',
  'salad',
  'soup',
  'beef',
  'chicken',
  'fish',
  'shrimp',
  'ham',
  'egg-fried',
  'coffee',
  'cup-soda',
  'water',
  'milk',
  'beer',
  'wine',
  'martini',
  'cake',
  'cookie',
  'ice-cream',
  'candy',
  'croissant',
  'leaf',
  'vegan',
  'carrot',
  'apple',
  'cherry',
  'wheat',
  'sprout',
];

function inputClassName(error?: boolean) {
  return cn(
    'w-full rounded-xl border bg-surface px-3 py-2 text-sm transition-colors focus:outline-none',
    error ? 'border-danger-500 focus:border-danger-500' : 'border-border focus:border-primary-500/60',
  );
}

function IconPicker({
  value,
  open,
  error,
  disabled,
  onToggle,
  onChange,
}: {
  value: string;
  open: boolean;
  error?: string;
  disabled?: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const filteredIcons = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return iconOptions;
    return iconOptions.filter((icon) => icon.toLowerCase().includes(normalized));
  }, [query]);

  return (
    <div className={cn('rounded-xl border bg-surface p-3 transition-colors', error ? 'border-danger-500' : 'border-border')}>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left disabled:cursor-not-allowed"
      >
        <span className="flex min-w-0 items-center gap-3">
          <CategoryIcon value={value} className="h-10 w-10 rounded-xl border border-border bg-surface-elevated" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{t('admin.categories.icon')}</span>
            <span className="block truncate text-xs text-foreground-muted">{value || t('admin.categories.iconHint')}</span>
          </span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-foreground-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-foreground-muted">{t('admin.categories.icon')}</span>
            <span className="text-xs text-foreground-muted">{t('admin.categories.iconHint')}</span>
          </div>
          <input
            value={query}
            disabled={disabled}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('admin.categories.searchIcons')}
            className="mb-3 w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-sm disabled:cursor-not-allowed"
          />
          <div className="max-h-48 overflow-y-auto pr-1">
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
              {filteredIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(icon)}
                  className={cn(
                    'h-10 rounded-xl border flex items-center justify-center transition-colors disabled:cursor-not-allowed',
                    value === icon ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-border bg-surface-elevated hover:border-primary-500/40',
                  )}
                  title={icon}
                >
                  <CategoryIcon value={icon} className="h-7 w-7 rounded-lg bg-transparent" iconClassName="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <CategoryIcon value={value} className="h-10 w-10 rounded-xl border border-border bg-surface-elevated" />
            <input
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
              placeholder="utensils, pizza, https://..."
              className="min-w-0 flex-1 px-3 py-2 bg-surface-elevated border border-border rounded-xl text-sm disabled:cursor-not-allowed"
            />
          </div>
        </div>
      )}
      {error && <span className="mt-2 block text-[11px] leading-4 text-danger-500">{error}</span>}
    </div>
  );
}

function StatusListbox({
  value,
  error,
  disabled,
  onChange,
}: {
  value: CategoryStatus;
  error?: boolean;
  disabled?: boolean;
  onChange: (value: CategoryStatus) => void;
}) {
  const { t } = useTranslation();
  const options: Array<{ value: CategoryStatus; label: string }> = [
    { value: 'active', label: t('admin.categories.active') },
    { value: 'inactive', label: t('admin.categories.inactive') },
  ];
  const selected = options.find((option) => option.value === value) || options[0];

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <ListboxButton
        className={cn(
          'group flex h-10 w-full items-center justify-between gap-3 rounded-xl border bg-surface px-3 text-left text-sm transition-colors hover:border-primary-500/50 focus:outline-none disabled:cursor-not-allowed',
          error ? 'border-danger-500' : 'border-border',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              value === 'active' ? 'bg-success-500' : 'bg-foreground-muted',
            )}
          />
          <span className="truncate font-medium text-foreground">{selected.label}</span>
        </span>
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
            key={option.value}
            value={option.value}
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
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      option.value === 'active' ? 'bg-success-500' : 'bg-foreground-muted',
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </span>
                {selected && <Check className="h-4 w-4 shrink-0" />}
              </>
            )}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
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
