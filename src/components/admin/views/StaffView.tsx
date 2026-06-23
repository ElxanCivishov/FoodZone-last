import { Menu, MenuButton, MenuItem, MenuItems, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Edit, MoreVertical, Plus, Search, Trash2, X, LogIn, LogOut, Trophy, Calendar, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStaff } from '@/hooks/useStaff';
import api from '@/services/api';
import type { StaffMember, StaffShift, LeaderboardEntry } from '@/types';
import { cn } from '@/utils/cn';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable, Td, Th } from '../components/DataTable';
import { SectionTitle } from '../components/SectionTitle';
import { StaffModal } from '../components/Modals/StaffModal';
import { StatusPill } from '../components/StatusPill';
import { ToggleSwitch } from '../components/ToggleSwitch';
import { useStaffMutations } from '../hooks/useAdminMutations';
import { useActiveBranch } from '../hooks/useActiveBranch';

type StaffTab = 'list' | 'schedule' | 'performance';
type StaffRoleFilter = 'all' | StaffMember['role'];
type StaffStatusFilter = 'all' | StaffMember['status'];

const roleFilters: StaffRoleFilter[] = ['all', 'admin', 'manager', 'kitchen', 'waiter'];
const statusFilters: StaffStatusFilter[] = ['all', 'active', 'inactive'];
const pageSizeFilters = ['10', '20', '50'];

type StaffPageSizeFilter = '10' | '20' | '50';

export function StaffView() {
  const { t } = useTranslation();
  const { createStaff, updateStaff, deleteStaff } = useStaffMutations();
  const [activeTab, setActiveTab] = useState<StaffTab>('list');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<StaffPageSizeFilter>('10');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | undefined>();
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | undefined>();
  const pageLimit = Number(pageSize);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter, pageSize]);

  const { data: staffResponse, isFetching, isLoading } = useStaff({
    page,
    limit: pageLimit,
    search: debouncedSearch || undefined,
    role: roleFilter,
    status: statusFilter,
  });

  const staffList = staffResponse?.data.data ?? [];
  const total = staffResponse?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageLimit));
  const startItem = total === 0 ? 0 : (page - 1) * pageLimit + 1;
  const endItem = Math.min(total, page * pageLimit);

  const modalLoading = editingStaff ? updateStaff.isPending : createStaff.isPending;
  const hasFilters = !!search.trim() || roleFilter !== 'all' || statusFilter !== 'all';

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openCreate = () => {
    setEditingStaff(undefined);
    setModalOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStaff(undefined);
  };

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editingStaff) {
      updateStaff.mutate({ id: editingStaff.id, data }, { onSuccess: closeModal });
      return;
    }
    createStaff.mutate(data, { onSuccess: closeModal });
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title={t('admin.staff')}
        action={
          activeTab === 'list' ? (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4" />
              {t('admin.staffView.addStaff')}
            </button>
          ) : null
        }
      />

      {/* Tab seçimi */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface-elevated p-1 w-fit">
        {([
          { id: 'list', label: 'İşçilər', icon: Users },
          { id: 'schedule', label: 'Cədvəl', icon: Calendar },
          { id: 'performance', label: 'Performans', icon: Trophy },
        ] as { id: StaffTab; label: string; icon: typeof Users }[]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.id ? 'bg-primary-500 text-white' : 'text-foreground-muted hover:text-foreground')}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'schedule' && <ScheduleTab />}
      {activeTab === 'performance' && <PerformanceTab />}
      {activeTab === 'list' && <>
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface-elevated p-3 lg:grid-cols-[1fr_180px_180px_auto]">
        <label className="relative">
          <span className="sr-only">{t('common.search')}</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('admin.staffView.searchPlaceholder')}
            className="h-10 w-full rounded-xl border border-border bg-surface px-9 text-sm outline-none transition-colors focus:border-primary-500/60"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-foreground-muted hover:bg-foreground-muted/10 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>

        <FilterSelect
          value={roleFilter}
          options={roleFilters}
          getLabel={(value) => (value === 'all' ? t('admin.staffView.allRoles') : t(`admin.roles.${value}`))}
          onChange={setRoleFilter}
        />

        <FilterSelect
          value={statusFilter}
          options={statusFilters}
          getLabel={(value) => (value === 'all' ? t('admin.staffView.allStatuses') : t(`admin.staffView.status.${value}`))}
          onChange={setStatusFilter}
        />

        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasFilters}
          className="h-10 rounded-xl border border-border px-3 text-sm font-medium text-foreground-muted transition-colors hover:border-primary-500/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('common.clearFilters')}
        </button>
      </div>

      <div className={cn('transition-opacity', isFetching && !isLoading && 'opacity-70')}>
        <DataTable loading={isLoading} colSpan={5}>
          <thead className="bg-foreground-muted/5">
            <tr>
              <Th>{t('admin.staffView.name')}</Th>
              <Th>{t('admin.staffView.email')}</Th>
              <Th>{t('admin.staffView.role')}</Th>
              <Th>{t('admin.status')}</Th>
              <Th right>{t('admin.actions')}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staffList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-foreground-muted">
                  {t('filters.noResults')}
                </td>
              </tr>
            ) : (
              staffList.map((member) => (
                <tr key={member.id} className="hover:bg-foreground-muted/5">
                  <Td className="font-medium">{member.name}</Td>
                  <Td muted>{member.email}</Td>
                  <Td>
                    <StatusPill status={member.role} />
                  </Td>
                  <Td>
                    <ToggleSwitch
                      checked={member.status === 'active'}
                      loading={updateStaff.isPending && updateStaff.variables?.id === member.id}
                      onChange={() => updateStaff.mutate({ id: member.id, data: { status: member.status === 'active' ? 'inactive' : 'active' } })}
                    />
                  </Td>
                  <Td right>
                    <StaffActionsMenu
                      member={member}
                      onEdit={() => openEdit(member)}
                      onDelete={() => setDeletingStaff(member)}
                    />
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </DataTable>
      </div>

      {total > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground-muted">
            {t('admin.staffView.pageSummary', { start: startItem, end: endItem, total })}
            <span className="ml-2 text-foreground-muted/60">
              {t('common.page')} {page} / {totalPages}
            </span>
          </p>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <div className="w-36">
              <FilterSelect
                value={pageSize}
                options={pageSizeFilters as StaffPageSizeFilter[]}
                getLabel={(value) => t('admin.staffView.rowsPerPage', { count: Number(value) })}
                onChange={setPageSize}
              />
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
              title={t('admin.staffView.previousPage')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground-muted transition-colors hover:border-primary-500/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isFetching}
              title={t('admin.staffView.nextPage')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground-muted transition-colors hover:border-primary-500/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <StaffModal
        open={modalOpen}
        staff={editingStaff}
        loading={modalLoading}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingStaff}
        title={t('admin.staffView.deleteTitle')}
        message={t('admin.staffView.deleteConfirm', { name: deletingStaff?.name || '' })}
        confirmLabel={t('common.delete')}
        loading={deleteStaff.isPending}
        onCancel={() => setDeletingStaff(undefined)}
        onConfirm={() => {
          if (!deletingStaff) return;
          deleteStaff.mutate(deletingStaff.id, {
            onSuccess: () => setDeletingStaff(undefined),
          });
        }}
      />
      </>}
    </div>
  );
}

// ─── Həftəlik Cədvəl Tabı ─────────────────────────────────────────────────────

function ScheduleTab() {
  const { activeBranch } = useActiveBranch();
  const branchId = activeBranch?.id;
  const qc = useQueryClient();

  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() + 1 + weekOffset * 7);
    return d;
  })();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const from = weekStart.toISOString().split('T')[0];
  const to = days[6].toISOString().split('T')[0];

  const { data: scheduleData = [], isLoading } = useQuery<StaffShift[]>({
    queryKey: ['schedule', branchId, from, to],
    queryFn: () => api.get(`/staff/schedule?branchId=${branchId}&from=${from}&to=${to}`).then((r: any) => r.data.data),
    enabled: !!branchId,
  });

  const { data: allStaff = [] } = useQuery<StaffMember[]>({
    queryKey: ['staff-all'],
    queryFn: () => api.get('/staff/all').then((r: any) => r.data.data),
    enabled: !!branchId,
  });

  const addShift = useMutation({
    mutationFn: (data: { userId: string; date: string }) => api.post('/staff/schedule', { branchId, ...data }),
    onSuccess: () => { toast.success('Əlavə edildi'); qc.invalidateQueries({ queryKey: ['schedule'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta'),
  });

  const removeShift = useMutation({
    mutationFn: (id: string) => api.delete(`/staff/schedule/${id}`),
    onSuccess: () => { toast.success('Silindi'); qc.invalidateQueries({ queryKey: ['schedule'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta'),
  });

  const checkIn = useMutation({
    mutationFn: (id: string) => api.post(`/staff/schedule/${id}/checkin`),
    onSuccess: () => { toast.success('Giriş qeyd edildi'); qc.invalidateQueries({ queryKey: ['schedule'] }); },
  });

  const checkOut = useMutation({
    mutationFn: (id: string) => api.post(`/staff/schedule/${id}/checkout`),
    onSuccess: () => { toast.success('Çıxış qeyd edildi'); qc.invalidateQueries({ queryKey: ['schedule'] }); },
  });

  const fmtDay = (d: Date) => d.toLocaleDateString('az-AZ', { weekday: 'short', day: 'numeric', month: 'numeric' });
  const isoDate = (d: Date) => d.toISOString().split('T')[0];
  const isToday = (d: Date) => isoDate(d) === isoDate(new Date());

  // Group shifts by userId+date
  const shiftMap = new Map<string, StaffShift>();
  scheduleData.forEach(s => shiftMap.set(`${s.userId}_${s.date.split('T')[0]}`, s));

  const statusColors: Record<string, string> = {
    scheduled: 'bg-primary-500/10 text-primary-500',
    present: 'bg-success-500/10 text-success-600',
    completed: 'bg-foreground-muted/10 text-foreground-muted',
    absent: 'bg-danger-500/10 text-danger-500',
  };

  const activeStaff = allStaff.filter(s => s.status === 'active' && (s.role === 'waiter' || s.role === 'kitchen' || s.role === 'manager'));

  return (
    <div className="space-y-4">
      {/* Həftə naviqasiyası */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-surface-elevated transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium px-2">
            {days[0].toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })} —{' '}
            {days[6].toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => setWeekOffset(o => o + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-surface-elevated transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button onClick={() => setWeekOffset(0)}
          className="text-xs text-primary-500 hover:underline">Bu həftə</button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-sm text-foreground-muted">Yüklənir...</div>
      ) : activeStaff.length === 0 ? (
        <div className="text-center py-16 text-sm text-foreground-muted">Aktiv işçi tapılmadı</div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface-elevated overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted w-36">İşçi</th>
                {days.map(d => (
                  <th key={d.toISOString()} className={cn('text-center px-2 py-3 text-xs font-semibold', isToday(d) ? 'text-primary-500' : 'text-foreground-muted')}>
                    {fmtDay(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeStaff.map(staff => (
                <tr key={staff.id} className="hover:bg-foreground-muted/5">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{staff.name}</p>
                    <p className="text-xs text-foreground-muted capitalize">{staff.role}</p>
                  </td>
                  {days.map(d => {
                    const key = `${staff.id}_${isoDate(d)}`;
                    const shift = shiftMap.get(key);
                    return (
                      <td key={d.toISOString()} className="px-1 py-2 text-center">
                        {shift ? (
                          <div className={cn('rounded-lg px-1.5 py-1 text-xs font-medium', statusColors[shift.status])}>
                            <p>{shift.status === 'present' ? '●' : shift.status === 'completed' ? '✓' : shift.status === 'absent' ? '✗' : '○'}</p>
                            {shift.checkIn && <p className="text-[10px] mt-0.5">{new Date(shift.checkIn).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}</p>}
                            <div className="flex gap-0.5 mt-1 justify-center">
                              {shift.status === 'scheduled' && (
                                <button onClick={() => checkIn.mutate(shift.id)}
                                  className="rounded p-0.5 hover:bg-success-500/20 text-success-600" title="Giriş">
                                  <LogIn className="h-3 w-3" />
                                </button>
                              )}
                              {shift.status === 'present' && (
                                <button onClick={() => checkOut.mutate(shift.id)}
                                  className="rounded p-0.5 hover:bg-warning-500/20 text-warning-600" title="Çıxış">
                                  <LogOut className="h-3 w-3" />
                                </button>
                              )}
                              {(shift.status === 'scheduled' || shift.status === 'absent') && (
                                <button onClick={() => removeShift.mutate(shift.id)}
                                  className="rounded p-0.5 hover:bg-danger-500/20 text-danger-500" title="Sil">
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => addShift.mutate({ userId: staff.id, date: isoDate(d) })}
                            className="w-8 h-8 rounded-lg border border-dashed border-border text-foreground-muted hover:border-primary-500/50 hover:text-primary-500 hover:bg-primary-500/5 transition-colors mx-auto flex items-center justify-center"
                            title="Əlavə et"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rəng izahı */}
      <div className="flex gap-4 flex-wrap text-xs text-foreground-muted">
        {[
          { color: 'bg-primary-500/10 text-primary-500', label: '○ Planlanmış' },
          { color: 'bg-success-500/10 text-success-600', label: '● Hazırda işdə' },
          { color: 'bg-foreground-muted/10 text-foreground-muted', label: '✓ Tamamlandı' },
          { color: 'bg-danger-500/10 text-danger-500', label: '✗ Gəlmədi' },
        ].map(item => (
          <span key={item.label} className={cn('px-2 py-0.5 rounded-full font-medium', item.color)}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Performans & Leaderboard Tabı ───────────────────────────────────────────

function PerformanceTab() {
  const { activeBranch } = useActiveBranch();
  const branchId = activeBranch?.id;
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');

  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', branchId, period],
    queryFn: () => api.get(`/staff/leaderboard?branchId=${branchId}&period=${period}`).then((r: any) => r.data.data),
    enabled: !!branchId,
  });

  const medals = ['🥇', '🥈', '🥉'];
  const periodLabels = { today: 'Bu gün', week: 'Bu həftə', month: 'Bu ay' };

  return (
    <div className="space-y-6">
      {/* Period seçimi */}
      <div className="flex gap-2">
        {(['today', 'week', 'month'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              period === p ? 'bg-primary-500 text-white' : 'border border-border text-foreground-muted hover:bg-surface-elevated')}>
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-sm text-foreground-muted">Yüklənir...</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-border bg-surface-elevated">
          <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm text-foreground-muted">Bu dövr üçün performans məlumatı yoxdur</p>
          <p className="text-xs text-foreground-muted/60 mt-1">Check-out edilmiş smenalardan avtomatik hesablanır</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {leaderboard.length >= 1 && (
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[leaderboard[1], leaderboard[0], leaderboard[2]].filter(Boolean).map((entry, i) => {
                const actualRank = i === 1 ? 1 : i === 0 ? 2 : 3;
                const heights = ['h-24', 'h-32', 'h-20'];
                return (
                  <div key={entry.user.id} className={cn('flex flex-col items-center justify-end', heights[i])}>
                    <p className="text-2xl mb-1">{medals[actualRank - 1]}</p>
                    <div className={cn('w-full rounded-t-2xl flex flex-col items-center justify-center p-2',
                      actualRank === 1 ? 'bg-warning-500/20 border border-warning-500/30' :
                      actualRank === 2 ? 'bg-foreground-muted/10 border border-border' :
                      'bg-orange-500/10 border border-orange-500/20')}>
                      <p className="text-xs font-bold text-center leading-tight">{entry.user.name}</p>
                      <p className="text-xs text-foreground-muted">{entry.ordersServed} sif.</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tam siyahı */}
          <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-foreground-muted/5">
                  <Th>#</Th>
                  <Th>İşçi</Th>
                  <Th>Sifarişlər</Th>
                  <Th>Bahşiş</Th>
                  <Th>Smenalar</Th>
                  <Th>Ort. xidmət</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaderboard.map((entry) => (
                  <tr key={entry.user.id} className={cn('hover:bg-foreground-muted/5', entry.rank <= 3 && 'bg-warning-500/3')}>
                    <Td>
                      <span className="font-bold text-sm">
                        {entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`}
                      </span>
                    </Td>
                    <Td>
                      <p className="font-medium text-sm">{entry.user.name}</p>
                      <p className="text-xs text-foreground-muted capitalize">{entry.user.role}</p>
                    </Td>
                    <Td><span className="font-semibold text-primary-500">{entry.ordersServed}</span></Td>
                    <Td><span className="text-success-600 font-medium">{entry.tips.toFixed(2)} ₼</span></Td>
                    <Td><span className="text-foreground-muted">{entry.shiftsWorked}</span></Td>
                    <Td>
                      <span className="text-foreground-muted">
                        {entry.avgServiceTime ? `${Math.round(entry.avgServiceTime)} dəq` : '—'}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StaffActionsMenu({
  onEdit,
  onDelete,
}: {
  member: StaffMember;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Menu>
      <MenuButton
        title={t('admin.actions')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground-muted hover:text-foreground hover:border-primary-500/50 focus:outline-none"
      >
        <MoreVertical className="h-4 w-4" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-[9999] w-56 rounded-xl border border-border bg-surface-elevated p-1 shadow-xl focus:outline-none"
      >
        <MenuAction icon={Edit} label={t('common.edit')} onClick={onEdit} />
        <MenuAction danger icon={Trash2} label={t('common.delete')} onClick={onDelete} />
      </MenuItems>
    </Menu>
  );
}

function MenuAction({
  icon: Icon,
  label,
  danger,
  onClick,
}: {
  icon: typeof Edit;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <MenuItem>
      {({ focus }) => (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
            danger ? 'text-red-600 dark:text-red-400' : 'text-foreground',
            focus && (danger ? 'bg-red-500/10' : 'bg-foreground-muted/10'),
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </button>
      )}
    </MenuItem>
  );
}

function FilterSelect<T extends string>({
  value,
  options,
  getLabel,
  onChange,
}: {
  value: T;
  options: T[];
  getLabel: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton className="group flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 text-left text-sm transition-colors hover:border-primary-500/50 focus:outline-none">
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
