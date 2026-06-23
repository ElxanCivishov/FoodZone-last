import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Store,
  Users,
  Wifi,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAllStaff } from '@/hooks/useStaff';
import { get } from '@/services/api';
import type { Table } from '@/types';
import { SectionTitle } from '../components/SectionTitle';
import { StatusPill } from '../components/StatusPill';
import { useActiveBranch } from '../hooks/useActiveBranch';

export function ProfileView() {
  const { t } = useTranslation();
  const { activeBranch, activeBranchId, isLoading } = useActiveBranch();
  const { data: staff } = useAllStaff();
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['tables', activeBranchId],
    queryFn: () => get<Table[]>('/qr/tables', activeBranchId ? { branchId: activeBranchId } : undefined),
    enabled: !!activeBranchId,
  });

  const tableList = tables?.data || [];
  const staffList = staff?.data ?? [];
  const activeStaff = staffList.filter((member) => member.status === 'active');
  const qrReady = tableList.filter((table) => !!table.qrCode);
  const inactiveTables = tableList.filter((table) => table.status !== 'active');

  if (isLoading || tablesLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle title={t('admin.profile')} />

      <div className="rounded-2xl border border-border bg-surface-elevated p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center">
              <Store className="w-8 h-8 text-primary-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{activeBranch?.restaurant?.name || t('app.name')}</h2>
              <p className="text-sm text-foreground-muted">{activeBranch?.name || t('admin.profileView.mainBranch')}</p>
            </div>
          </div>
          <StatusPill status={activeBranch?.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <ProfileMetric label={t('admin.profileView.activeStaff')} value={`${activeStaff.length}/${staffList.length}`} icon={Users} tone="text-blue-500" bg="bg-blue-500/10" />
        <ProfileMetric label={t('admin.profileView.qrReady')} value={`${qrReady.length}/${tableList.length}`} icon={QrCode} tone="text-success-500" bg="bg-success-500/10" />
        <ProfileMetric label={t('admin.profileView.inactiveTables')} value={inactiveTables.length} icon={Building2} tone="text-orange-500" bg="bg-orange-500/10" />
        <ProfileMetric label={t('admin.profileView.branchStatus')} value={formatProfileStatus(activeBranch?.status, t)} icon={ShieldCheck} tone="text-primary-500" bg="bg-primary-500/10" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ProfilePanel title={t('admin.profileView.restaurantInfo')} icon={<Store className="w-4 h-4 text-primary-500" />}>
          <InfoRow label={t('admin.restaurantName')} value={activeBranch?.restaurant?.name || t('app.name')} />
          <InfoRow label={t('admin.profileView.restaurantSlug')} value={activeBranch?.restaurant?.slug || '-'} />
          <InfoRow label={t('admin.profileView.restaurantStatus')} value={formatProfileStatus(activeBranch?.restaurant?.status, t)} />
          <InfoRow label={t('admin.profileView.created')} value={formatDate(activeBranch?.restaurant?.createdAt)} icon={<CalendarDays className="w-4 h-4" />} />
        </ProfilePanel>

        <ProfilePanel title={t('admin.profileView.branchInfo')} icon={<Building2 className="w-4 h-4 text-blue-500" />}>
          <InfoRow label={t('admin.profileView.branchName')} value={activeBranch?.name || '-'} />
          <InfoRow label={t('admin.profileView.address')} value={activeBranch?.address || '-'} icon={<MapPin className="w-4 h-4" />} />
          <InfoRow label={t('admin.profileView.phone')} value={activeBranch?.phone || '-'} icon={<Phone className="w-4 h-4" />} />
          <InfoRow label={t('admin.profileView.created')} value={formatDate(activeBranch?.createdAt)} icon={<CalendarDays className="w-4 h-4" />} />
        </ProfilePanel>

        <ProfilePanel title={t('admin.profileView.wifiDetails')} icon={<Wifi className="w-4 h-4 text-success-500" />}>
          <InfoRow label={t('admin.profileView.wifiName')} value={activeBranch?.wifiName || '-'} />
          <InfoRow label={t('admin.profileView.wifiPassword')} value={activeBranch?.wifiPassword || '-'} />
          <InfoRow label={t('admin.currency')} value="USD ($)" />
        </ProfilePanel>

        <ProfilePanel title={t('admin.profileView.operationalSnapshot')} icon={<CheckCircle2 className="w-4 h-4 text-success-500" />}>
          <InfoRow label={t('admin.profileView.totalTables')} value={String(tableList.length)} />
          <InfoRow label={t('admin.profileView.activeTables')} value={String(tableList.filter((table) => table.status === 'active').length)} />
          <InfoRow label={t('admin.profileView.occupiedTables')} value={String(tableList.filter((table) => table.status === 'occupied').length)} />
          <InfoRow label={t('admin.profileView.staffRoles')} value={formatRoles(staffList.map((member) => member.role))} />
        </ProfilePanel>
      </div>
    </div>
  );
}

function ProfileMetric({
  label,
  value,
  icon: Icon,
  tone,
  bg,
}: {
  label: string;
  value: string | number;
  icon: typeof Store;
  tone: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
        <Icon className={`w-5 h-5 ${tone}`} />
      </div>
      <p className="text-2xl font-bold capitalize">{value}</p>
      <p className="text-sm text-foreground-muted mt-1">{label}</p>
    </div>
  );
}

function ProfilePanel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-xs text-foreground-muted mb-1">{label}</p>
      <p className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

function formatRoles(roles: string[]) {
  const uniqueRoles = Array.from(new Set(roles));
  return uniqueRoles.length > 0 ? uniqueRoles.join(', ') : '-';
}

function formatProfileStatus(status: string | undefined, t: (key: string) => string) {
  if (!status) return '-';
  return t(`admin.profileView.status.${status}`);
}
