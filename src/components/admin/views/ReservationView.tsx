import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Phone, Plus, Check, X, RefreshCw } from 'lucide-react';
import { format, isSameDay, addDays, startOfDay } from 'date-fns';
import api from '@/services/api';
import { useActiveBranch } from '../hooks/useActiveBranch';
import { cn } from '@/utils/cn';
import type { TableReservation } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Təsdiqlənib',  color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  seated:    { label: 'Oturdulub',    color: 'bg-green-500/20 text-green-600 border-green-500/30' },
  completed: { label: 'Tamamlandı',   color: 'bg-foreground-muted/20 text-foreground-muted border-border' },
  cancelled: { label: 'Ləğv edildi',  color: 'bg-red-500/20 text-red-500 border-red-500/30' },
  no_show:   { label: 'Gəlmədi',      color: 'bg-orange-500/20 text-orange-600 border-orange-500/30' },
};

const RES_QUERY_KEY = (branchId: string | undefined) => ['reservations', branchId] as const;

export function ReservationView() {
  const { activeBranch } = useActiveBranch();
  const branchId = activeBranch?.id;
  const qc = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);

  const days = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i));

  // Single query — all branch reservations, no date filter.
  // Client-side filtering avoids any timezone/cache-key mismatch.
  const { data: allReservations = [], isLoading, isFetching, refetch } =
    useQuery<TableReservation[]>({
      queryKey: RES_QUERY_KEY(branchId),
      queryFn: async () => {
        const r: any = await api.get(`/reservations?branchId=${branchId}`);
        // api interceptor returns response.data = { success, data }
        if (r && Array.isArray(r.data)) return r.data;
        if (Array.isArray(r)) return r;
        return [];
      },
      enabled: !!branchId,
      staleTime: 30_000,
      refetchInterval: 60_000,
    });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/reservations/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RES_QUERY_KEY(branchId) });
    },
  });

  // Strip helpers
  const countByDay   = (d: Date) => allReservations.filter(r => isSameDay(new Date(r.dateTime), d)).length;
  const hasActiveDay = (d: Date) => allReservations.some(
    r => isSameDay(new Date(r.dateTime), d) && (r.status === 'confirmed' || r.status === 'seated'),
  );

  // Selected day list
  const dayReservations = allReservations
    .filter(r => isSameDay(new Date(r.dateTime), selectedDate))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rezervasiyalar</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Masa rezervasiyalarını idarə et</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl border border-border text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni rezervasiya
          </button>
        </div>
      </div>

      {/* Date scroller */}
      <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
        {days.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const count  = countByDay(day);
          const active = hasActiveDay(day);
          return (
            <motion.button
              key={day.toISOString()}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(day)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all min-w-[56px]',
                isSelected
                  ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                  : active
                    ? 'bg-primary-500/8 border-primary-500/40 hover:border-primary-500/70'
                    : 'bg-surface-elevated border-border hover:border-foreground-muted/30',
              )}
            >
              <span className="text-[10px] font-medium opacity-70 uppercase tracking-wide">
                {format(day, 'EEE')}
              </span>
              <span className="text-lg font-bold leading-none">{format(day, 'd')}</span>
              {count > 0 && (
                <span className={cn(
                  'text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center',
                  isSelected ? 'bg-white/25 text-white' : 'bg-primary-500 text-white',
                )}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Day heading */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground-muted">
          {format(selectedDate, 'd MMMM yyyy')}
          {dayReservations.length > 0 && (
            <span className="ml-2 text-primary-500 font-semibold">
              · {dayReservations.length} rezervasiya
            </span>
          )}
        </p>
        {isLoading && (
          <span className="text-xs text-foreground-muted animate-pulse">Yüklənir...</span>
        )}
      </div>

      {/* List */}
      <AnimatePresence mode="popLayout">
        {!isLoading && dayReservations.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-foreground-muted"
          >
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Bu tarix üçün rezervasiya yoxdur</p>
            <p className="text-sm mt-1 opacity-70">Yuxarıdakı düymə ilə yeni rezervasiya əlavə et</p>
          </motion.div>
        ) : (
          dayReservations.map(res => (
            <motion.div
              key={res.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-surface-elevated rounded-2xl border border-border p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Time block */}
                  <div className="flex flex-col items-center bg-primary-500/10 rounded-xl p-2.5 min-w-[56px]">
                    <Clock className="w-4 h-4 text-primary-500 mb-1" />
                    <span className="text-sm font-bold text-primary-500 tabular-nums">
                      {format(new Date(res.dateTime), 'HH:mm')}
                    </span>
                  </div>

                  {/* Info */}
                  <div>
                    <p className="font-bold">{res.customerName}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-foreground-muted mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {res.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {res.partySize} nəfər
                      </span>
                      {res.table && <span>Masa {res.table.number}</span>}
                    </div>
                    {res.notes && (
                      <p className="text-xs text-foreground-muted mt-1 italic">{res.notes}</p>
                    )}
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded-full border',
                    STATUS_CONFIG[res.status]?.color ?? 'bg-foreground-muted/10 text-foreground-muted border-border',
                  )}>
                    {STATUS_CONFIG[res.status]?.label ?? res.status}
                  </span>

                  {res.status === 'confirmed' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus.mutate({ id: res.id, status: 'seated' })}
                        title="Otur"
                        className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateStatus.mutate({ id: res.id, status: 'cancelled' })}
                        title="Ləğv et"
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {res.status === 'seated' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: res.id, status: 'completed' })}
                      className="text-xs px-2 py-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-lg transition-colors"
                    >
                      Tamamla
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>

      <CreateReservationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        branchId={branchId}
        defaultDate={selectedDate}
        onCreated={() => qc.invalidateQueries({ queryKey: RES_QUERY_KEY(branchId) })}
      />
    </div>
  );
}

// ─── Create Modal ──────────────────────────────────────────────────────────────
interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
  defaultDate: Date;
  onCreated: () => void;
}

const makeDefaultForm = (defaultDate: Date) => ({
  customerName: '',
  phone: '',
  partySize: 2,
  dateTime: format(defaultDate, "yyyy-MM-dd'T'HH:mm"),
  duration: 90,
  notes: '',
  tableId: '',   // '' = no table selected
});

function CreateReservationModal({ isOpen, onClose, branchId, defaultDate, onCreated }: CreateModalProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState(() => makeDefaultForm(defaultDate));

  const { data: tables = [] } = useQuery<any[]>({
    queryKey: ['tables', branchId],
    queryFn: async () => {
      const r: any = await api.get(`/qr/tables?branchId=${branchId}`);
      // Handle nested: r = { success, data: { data: [...] } } or r = { success, data: [...] }
      if (r?.data?.data && Array.isArray(r.data.data)) return r.data.data;
      if (r?.data && Array.isArray(r.data)) return r.data;
      if (Array.isArray(r)) return r;
      return [];
    },
    enabled: !!branchId && isOpen,
    staleTime: 5 * 60_000,
  });

  const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const create = useMutation({
    mutationFn: () =>
      api.post('/reservations', {
        branchId,
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        partySize: Number(form.partySize),
        dateTime: form.dateTime,
        duration: form.duration,
        notes: form.notes.trim() || undefined,
        // Only send tableId when actually selected
        tableId: form.tableId !== '' ? form.tableId : undefined,
      }),
    onSuccess: (result: any) => {
      // Instant cache update — insert new reservation without waiting for refetch
      const newRes: TableReservation = result?.data ?? result;
      if (newRes?.id && branchId) {
        qc.setQueryData(
          RES_QUERY_KEY(branchId),
          (old: TableReservation[] = []) =>
            [...old, newRes].sort(
              (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
            ),
        );
      }
      // Background consistency refetch
      onCreated();
      onClose();
      setForm(makeDefaultForm(defaultDate));
    },
  });

  const canSubmit =
    form.customerName.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.dateTime.length > 0 &&
    !create.isPending;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className="bg-surface rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold">Yeni Rezervasiya</h3>

            <input
              placeholder="Ad Soyad *"
              value={form.customerName}
              onChange={e => set('customerName', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:border-primary-500 transition-colors"
            />

            <input
              placeholder="Telefon *"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:border-primary-500 transition-colors"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="datetime-local"
                value={form.dateTime}
                onChange={e => set('dateTime', e.target.value)}
                className="px-3 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:border-primary-500 transition-colors text-sm"
              />
              <input
                type="number"
                placeholder="Nəfər sayı *"
                min={1}
                value={form.partySize}
                onChange={e => set('partySize', Number(e.target.value))}
                className="px-4 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {/* Chip-style table picker */}
            <div>
              <p className="text-xs font-medium text-foreground-muted mb-2">
                Masa <span className="opacity-50">(isteğe bağlı)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => set('tableId', '')}
                  className={cn(
                    'px-3 py-1.5 rounded-xl border text-sm font-medium transition-all',
                    form.tableId === ''
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'border-border text-foreground-muted hover:border-primary-500/50',
                  )}
                >
                  Seçilməyib
                </button>
                {tables.map((t: any) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set('tableId', t.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl border text-sm font-medium transition-all',
                      form.tableId === t.id
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'border-border text-foreground-muted hover:border-primary-500/50',
                    )}
                  >
                    {t.number}
                  </button>
                ))}
                {tables.length === 0 && (
                  <span className="text-xs text-foreground-muted/60 py-1.5">Masa tapılmadı</span>
                )}
              </div>
            </div>

            <textarea
              placeholder="Qeyd... (isteğe bağlı)"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:border-primary-500 transition-colors resize-none"
            />

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-border rounded-2xl font-medium hover:bg-foreground-muted/5 transition-colors"
              >
                Ləğv et
              </button>
              <button
                type="button"
                onClick={() => create.mutate()}
                disabled={!canSubmit}
                className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-medium transition-colors disabled:opacity-50"
              >
                {create.isPending ? 'Saxlanılır...' : 'Saxla'}
              </button>
            </div>

            {create.isError && (
              <p className="text-xs text-red-500 text-center">
                {(create.error as any)?.response?.data?.message ??
                 (create.error as Error)?.message ??
                 'Xəta baş verdi'}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
