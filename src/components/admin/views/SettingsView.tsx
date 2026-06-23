import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Bell,
  Building2,
  Check,
  ChefHat,
  Clock,
  Copy,
  Eye,
  EyeOff,
  LayoutGrid,
  Save,
  Store,
  Undo2,
  UserCheck,
  Wifi,
} from 'lucide-react';
import { type ChangeEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { patch } from '@/services/api';
import { DEFAULT_SETTINGS, useAppSettings } from '@/hooks/useAppSettings';
import type { AppSettings } from '@/hooks/useAppSettings';
import { cn } from '@/utils/cn';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { SectionTitle } from '../components/SectionTitle';
import { useBranches } from '../hooks/useActiveBranch';

interface FormState {
  restaurantName: string;
  restaurantDescription: string;
  branchName: string;
  address: string;
  phone: string;
  wifiName: string;
  wifiPassword: string;
  defaultPrepTime: number;
  urgencyWarnMin: number;
  urgencyDangerMin: number;
  kitchenAutoPrint: boolean;
  kitchenSoundOn: boolean;
  waiterSoundOn: boolean;
}

function buildInitial(branch: any, settings: AppSettings | undefined): FormState {
  const s = settings ?? DEFAULT_SETTINGS;
  return {
    restaurantName: branch?.restaurant?.name ?? '',
    restaurantDescription: branch?.restaurant?.description ?? '',
    branchName: branch?.name ?? '',
    address: branch?.address ?? '',
    phone: branch?.phone ?? '',
    wifiName: branch?.wifiName ?? '',
    wifiPassword: branch?.wifiPassword ?? '',
    defaultPrepTime: s.defaultPrepTime,
    urgencyWarnMin: s.urgencyWarnMin,
    urgencyDangerMin: s.urgencyDangerMin,
    kitchenAutoPrint: s.kitchenAutoPrint,
    kitchenSoundOn: s.kitchenSoundOn,
    waiterSoundOn: s.waiterSoundOn,
  };
}

const PREP_PRESETS = [5, 10, 15, 20, 30, 45];

export function SettingsView() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: branches, isLoading: branchLoading } = useBranches();
  const { data: settingsData, isLoading: settingsLoading } = useAppSettings();
  const saveBarRef = useRef<HTMLDivElement>(null);

  const branch = branches?.data?.[0];
  const settings = settingsData?.data;

  const [form, setForm] = useState<FormState>(() => buildInitial(branch, settings));
  const [initial, setInitial] = useState<FormState>(() => buildInitial(branch, settings));
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (branch || settings) {
      const next = buildInitial(branch, settings);
      setForm(next);
      setInitial(next);
    }
  }, [branch, settings]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initial);

  const isFieldDirty = (key: keyof FormState) => form[key] !== initial[key];

  const restaurantDirty = isFieldDirty('restaurantName') || isFieldDirty('restaurantDescription');
  const branchDirty = isFieldDirty('branchName') || isFieldDirty('address') || isFieldDirty('phone');
  const wifiDirty = isFieldDirty('wifiName') || isFieldDirty('wifiPassword');
  const kitchenDirty = isFieldDirty('defaultPrepTime');
  const panelsDirty =
    isFieldDirty('urgencyWarnMin') ||
    isFieldDirty('urgencyDangerMin') ||
    isFieldDirty('kitchenAutoPrint') ||
    isFieldDirty('kitchenSoundOn') ||
    isFieldDirty('waiterSoundOn');

  const updateBranch = useMutation({
    mutationFn: (data: Record<string, unknown>) => patch(`/branches/${branch?.id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  });

  const updateRestaurant = useMutation({
    mutationFn: (data: Record<string, unknown>) => patch(`/branches/${branch?.id}/restaurant`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  });

  const updateSettings = useMutation({
    mutationFn: (data: Record<string, unknown>) => patch('/settings', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  const isSaving = updateBranch.isPending || updateRestaurant.isPending || updateSettings.isPending;

  const handleSave = async () => {
    try {
      const promises: Promise<any>[] = [];
      if (restaurantDirty) promises.push(updateRestaurant.mutateAsync({ name: form.restaurantName, description: form.restaurantDescription }));
      if (branchDirty || wifiDirty) promises.push(updateBranch.mutateAsync({ name: form.branchName, address: form.address, phone: form.phone, wifiName: form.wifiName, wifiPassword: form.wifiPassword }));
      if (kitchenDirty || panelsDirty) {
        promises.push(updateSettings.mutateAsync({
          defaultPrepTime: form.defaultPrepTime,
          urgencyWarnMin: form.urgencyWarnMin,
          urgencyDangerMin: form.urgencyDangerMin,
          kitchenAutoPrint: form.kitchenAutoPrint,
          kitchenSoundOn: form.kitchenSoundOn,
          waiterSoundOn: form.waiterSoundOn,
        }));
      }
      await Promise.all(promises);
      setInitial(form);
      toast.success(t('admin.settingsView.savedSuccess'));
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleDiscard = () => setForm(initial);

  const NUMERIC_FIELDS: Array<keyof FormState> = ['defaultPrepTime', 'urgencyWarnMin', 'urgencyDangerMin'];
  const set = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = NUMERIC_FIELDS.includes(key) ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setDirect = (key: keyof FormState, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  if (branchLoading || settingsLoading) {
    return (
      <div className="space-y-6">
        <SectionTitle title={t('admin.settings')} />
        <div className="max-w-2xl space-y-4">
          {[180, 140, 140, 160].map((h, i) => (
            <div key={i} style={{ height: h }} className="rounded-2xl border border-border bg-surface-elevated animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <SectionTitle title={t('admin.settings')} />

      <div className="max-w-2xl space-y-4">
        {/* Restaurant */}
        <SettingsSection
          icon={<Store className="h-4 w-4 text-primary-500" />}
          iconBg="bg-primary-500/10"
          title={t('admin.settingsView.restaurantSection')}
          dirty={restaurantDirty}
        >
          <Field label={t('admin.restaurantName')} dirty={isFieldDirty('restaurantName')}>
            <Input value={form.restaurantName} onChange={set('restaurantName')} dirty={isFieldDirty('restaurantName')} />
          </Field>
          <Field label={t('admin.settingsView.description')} dirty={isFieldDirty('restaurantDescription')}>
            <div className="relative">
              <Textarea
                value={form.restaurantDescription}
                onChange={set('restaurantDescription')}
                rows={2}
                dirty={isFieldDirty('restaurantDescription')}
                maxLength={300}
              />
              <span className="absolute bottom-2 right-3 text-xs text-foreground-muted/60 pointer-events-none">
                {form.restaurantDescription.length}/300
              </span>
            </div>
          </Field>
        </SettingsSection>

        {/* Branch */}
        <SettingsSection
          icon={<Building2 className="h-4 w-4 text-blue-500" />}
          iconBg="bg-blue-500/10"
          title={t('admin.settingsView.branchSection')}
          dirty={branchDirty}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('admin.profileView.branchName')} dirty={isFieldDirty('branchName')}>
              <Input value={form.branchName} onChange={set('branchName')} dirty={isFieldDirty('branchName')} />
            </Field>
            <Field label={t('admin.profileView.phone')} dirty={isFieldDirty('phone')}>
              <Input value={form.phone} onChange={set('phone')} type="tel" dirty={isFieldDirty('phone')} />
            </Field>
          </div>
          <Field label={t('admin.profileView.address')} dirty={isFieldDirty('address')}>
            <Input value={form.address} onChange={set('address')} dirty={isFieldDirty('address')} />
          </Field>
        </SettingsSection>

        {/* Wi-Fi */}
        <SettingsSection
          icon={<Wifi className="h-4 w-4 text-emerald-600" />}
          iconBg="bg-emerald-500/10"
          title={t('admin.settingsView.wifiSection')}
          dirty={wifiDirty}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('admin.profileView.wifiName')} dirty={isFieldDirty('wifiName')}>
              <div className="relative">
                <Input value={form.wifiName} onChange={set('wifiName')} dirty={isFieldDirty('wifiName')} className="pr-10" />
                <CopyButton value={form.wifiName} field="wifiName" copiedField={copiedField} onCopy={copyToClipboard} />
              </div>
            </Field>
            <Field label={t('admin.profileView.wifiPassword')} dirty={isFieldDirty('wifiPassword')}>
              <div className="relative">
                <Input
                  value={form.wifiPassword}
                  onChange={set('wifiPassword')}
                  type={showPassword ? 'text' : 'password'}
                  dirty={isFieldDirty('wifiPassword')}
                  className="pr-16"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <CopyButton value={form.wifiPassword} field="wifiPassword" copiedField={copiedField} onCopy={copyToClipboard} static />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-foreground-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </Field>
          </div>
        </SettingsSection>

        {/* Kitchen */}
        <SettingsSection
          icon={<ChefHat className="h-4 w-4 text-orange-500" />}
          iconBg="bg-orange-500/10"
          title={t('admin.settingsView.kitchenSection')}
          dirty={kitchenDirty}
        >
          <Field label={t('admin.settingsView.defaultPrepTime')} dirty={isFieldDirty('defaultPrepTime')}>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-10 w-20 items-center justify-center rounded-xl border text-sm font-semibold transition-colors',
                    kitchenDirty
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-border bg-surface text-foreground',
                  )}
                >
                  {form.defaultPrepTime} min
                </span>
                <Clock className="h-4 w-4 shrink-0 text-foreground-muted" />
                <input
                  type="range"
                  min={1}
                  max={120}
                  step={1}
                  value={form.defaultPrepTime}
                  onChange={set('defaultPrepTime')}
                  className="flex-1 accent-orange-500 cursor-pointer"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PREP_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDirect('defaultPrepTime', preset)}
                    className={cn(
                      'h-7 rounded-lg border px-3 text-xs font-medium transition-colors',
                      form.defaultPrepTime === preset
                        ? 'border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                        : 'border-border text-foreground-muted hover:border-orange-500/30 hover:text-orange-500',
                    )}
                  >
                    {preset} min
                  </button>
                ))}
              </div>
            </div>
          </Field>
        </SettingsSection>

        {/* Panels */}
        <SettingsSection
          icon={<LayoutGrid className="h-4 w-4 text-violet-500" />}
          iconBg="bg-violet-500/10"
          title={t('admin.settingsView.panelsSection')}
          dirty={panelsDirty}
        >
          {/* Urgency thresholds */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              {t('admin.settingsView.urgencyThresholds')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t('admin.settingsView.urgencyWarnMin')} dirty={isFieldDirty('urgencyWarnMin')}>
                <div className="flex items-center gap-2">
                  <Input
                    value={form.urgencyWarnMin}
                    onChange={set('urgencyWarnMin')}
                    type="number"
                    min={1}
                    max={59}
                    dirty={isFieldDirty('urgencyWarnMin')}
                    className="w-24"
                  />
                  <span className="text-sm text-yellow-500 font-medium">⚠ {form.urgencyWarnMin} min</span>
                </div>
              </Field>
              <Field label={t('admin.settingsView.urgencyDangerMin')} dirty={isFieldDirty('urgencyDangerMin')}>
                <div className="flex items-center gap-2">
                  <Input
                    value={form.urgencyDangerMin}
                    onChange={set('urgencyDangerMin')}
                    type="number"
                    min={1}
                    max={60}
                    dirty={isFieldDirty('urgencyDangerMin')}
                    className="w-24"
                  />
                  <span className="text-sm text-danger-500 font-medium">🔴 {form.urgencyDangerMin} min</span>
                </div>
              </Field>
            </div>
          </div>

          {/* Kitchen defaults */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              {t('admin.settingsView.kitchenDefaults')}
            </p>
            <div className="space-y-2.5">
              <ToggleRow
                label={t('admin.settingsView.kitchenAutoPrint')}
                hint={t('admin.settingsView.kitchenAutoPrintHint')}
                icon={<ChefHat className="h-4 w-4 text-orange-500" />}
                checked={form.kitchenAutoPrint}
                dirty={isFieldDirty('kitchenAutoPrint')}
                onChange={(v) => setDirect('kitchenAutoPrint', v)}
              />
              <ToggleRow
                label={t('admin.settingsView.kitchenSoundOn')}
                hint={t('admin.settingsView.soundOnHint')}
                icon={<Bell className="h-4 w-4 text-orange-500" />}
                checked={form.kitchenSoundOn}
                dirty={isFieldDirty('kitchenSoundOn')}
                onChange={(v) => setDirect('kitchenSoundOn', v)}
              />
            </div>
          </div>

          {/* Waiter defaults */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              {t('admin.settingsView.waiterDefaults')}
            </p>
            <ToggleRow
              label={t('admin.settingsView.waiterSoundOn')}
              hint={t('admin.settingsView.soundOnHint')}
              icon={<UserCheck className="h-4 w-4 text-blue-500" />}
              checked={form.waiterSoundOn}
              dirty={isFieldDirty('waiterSoundOn')}
              onChange={(v) => setDirect('waiterSoundOn', v)}
            />
          </div>
        </SettingsSection>
      </div>

      {/* Sticky save bar */}
      <div
        ref={saveBarRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface-elevated/95 backdrop-blur-sm transition-all duration-300',
          isDirty ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none',
        )}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{t('admin.settingsView.unsavedChanges')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:border-foreground-muted/40 hover:text-foreground disabled:opacity-50"
            >
              <Undo2 className="h-4 w-4" />
              {t('admin.settingsView.discard')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? '...' : t('admin.saveChanges')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyButton({
  value,
  field,
  copiedField,
  onCopy,
  static: isStatic,
}: {
  value: string;
  field: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  static?: boolean;
}) {
  const copied = copiedField === field;
  return (
    <button
      type="button"
      onClick={() => onCopy(value, field)}
      disabled={!value}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:text-foreground disabled:opacity-30',
        !isStatic && 'absolute right-2 top-1/2 -translate-y-1/2',
      )}
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function SettingsSection({
  title,
  icon,
  iconBg,
  children,
  dirty,
}: {
  title: string;
  icon: ReactNode;
  iconBg: string;
  children: ReactNode;
  dirty?: boolean;
}) {
  return (
    <div className={cn('rounded-2xl border bg-surface-elevated p-5 space-y-4 transition-colors', dirty ? 'border-amber-500/30' : 'border-border')}>
      <div className="flex items-center gap-3">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl', iconBg)}>{icon}</div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {dirty && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            edited
          </span>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  dirty,
}: {
  label: string;
  children: ReactNode;
  dirty?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className={cn('text-sm font-medium', dirty && 'text-amber-600 dark:text-amber-400')}>{label}</span>
      {children}
    </label>
  );
}

function Input({
  className,
  dirty,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { dirty?: boolean }) {
  return (
    <input
      {...props}
      className={cn(
        'h-10 w-full rounded-xl border bg-surface px-3 text-sm outline-none transition-colors',
        dirty
          ? 'border-amber-500/50 focus:border-amber-500/80'
          : 'border-border focus:border-primary-500/60',
        className,
      )}
    />
  );
}

function ToggleRow({
  label,
  hint,
  icon,
  checked,
  dirty,
  onChange,
}: {
  label: string;
  hint?: string;
  icon?: ReactNode;
  checked: boolean;
  dirty?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={cn('flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors', dirty ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-surface')}>
      <div className="flex items-center gap-2.5">
        {icon}
        <div>
          <p className={cn('text-sm font-medium', dirty && 'text-amber-600 dark:text-amber-400')}>{label}</p>
          {hint && <p className="text-xs text-foreground-muted">{hint}</p>}
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

function Textarea({
  rows = 3,
  dirty,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { dirty?: boolean }) {
  return (
    <textarea
      rows={rows}
      {...props}
      className={cn(
        'w-full rounded-xl border bg-surface px-3 py-2 text-sm outline-none transition-colors resize-none',
        dirty
          ? 'border-amber-500/50 focus:border-amber-500/80'
          : 'border-border focus:border-primary-500/60',
      )}
    />
  );
}
