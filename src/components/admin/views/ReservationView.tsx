import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Users, Phone, Plus, Check, X, RefreshCw,
  MapPin, StickyNote, Timer, Edit2, Trash2, ChevronLeft, ChevronRight,
  Zap, Star, LayoutList, BarChart2,
} from 'lucide-react';
import api from '@/services/api';
import { useActiveBranchId } from '../hooks/useActiveBranch';
import { cn } from '@/utils/cn';
import type { TableReservation } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}
function fmtTime(v: unknown) {
  const d = safeDate(v);
  return d ? d.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) : '--:--';
}
function fmtDateLong(d: Date) {
  return d.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' });
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function toDatetimeLocal(d: Date, h = 19) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(h).padStart(2,'0')}:00`;
}
function overlaps(as: number, ad: number, bs: number, bd: number) {
  return as < bs + bd * 60000 && as + ad * 60000 > bs;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  confirmed: { label: 'Təsdiqlənib', color: 'bg-blue-500/15 text-blue-600 border-blue-500/30',      dot: 'bg-blue-500'    },
  seated:    { label: 'Oturdulub',   color: 'bg-success-500/15 text-success-600 border-success-500/30', dot: 'bg-success-500' },
  completed: { label: 'Tamamlandı',  color: 'bg-foreground-muted/15 text-foreground-muted border-border', dot: 'bg-foreground-muted' },
  cancelled: { label: 'Ləğv edildi', color: 'bg-danger-500/15 text-danger-500 border-danger-500/30', dot: 'bg-danger-500'   },
  no_show:   { label: 'Gəlmədi',     color: 'bg-orange-500/15 text-orange-600 border-orange-500/30', dot: 'bg-orange-500'  },
};

const TIMELINE_COLOR: Record<string, string> = {
  confirmed: 'bg-blue-500/80 border-blue-600',
  seated:    'bg-success-500/80 border-success-600',
  completed: 'bg-foreground-muted/40 border-foreground-muted',
  cancelled: 'bg-danger-500/50 border-danger-600',
  no_show:   'bg-orange-500/50 border-orange-600',
};

const DURATION_OPTS = [
  { value: 30, label: '30 dəq' }, { value: 60, label: '1 saat' },
  { value: 90, label: '1.5 saat' }, { value: 120, label: '2 saat' },
  { value: 150, label: '2.5 saat' }, { value: 180, label: '3 saat' },
];

type StatusFilter = 'all' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Hamısı' }, { id: 'confirmed', label: 'Təsdiqlənib' },
  { id: 'seated', label: 'Oturdulub' }, { id: 'completed', label: 'Tamamlandı' },
  { id: 'cancelled', label: 'Ləğv' }, { id: 'no_show', label: 'Gəlmədi' },
];

type ViewMode = 'list' | 'timeline';
const RES_QK = (b?: string) => ['reservations', b] as const;

// ─── Main View ────────────────────────────────────────────────────────────────

export function ReservationView() {
  const branchId = useActiveBranchId();

  const today = startOfDay(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreate, setShowCreate] = useState(false);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [editRes, setEditRes] = useState<TableReservation | null>(null);
  const qc = useQueryClient();

  const days = Array.from({ length: 14 }, (_, i) => addDays(today, weekOffset * 7 + i));

  const { data: allReservations = [], isLoading, isFetching, refetch } =
    useQuery<TableReservation[]>({
      queryKey: RES_QK(branchId),
      queryFn: async () => {
        const r: any = await api.get(`/reservations?branchId=${branchId}`);
        const d = r?.data ?? r;
        return Array.isArray(d) ? d : [];
      },
      enabled: !!branchId,
      staleTime: 30_000,
      refetchInterval: 60_000,
    });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/reservations/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: RES_QK(branchId) }),
  });

  const deleteRes = useMutation({
    mutationFn: (id: string) => api.delete(`/reservations/${id}`),
    onSuccess: (_, id) => qc.setQueryData(RES_QK(branchId),
      (old: TableReservation[] = []) => old.filter(r => r.id !== id)),
  });

  const dayCount = (d: Date) => allReservations.filter(r => { const rd = safeDate(r.dateTime); return rd && isSameDay(rd, d); }).length;
  const hasActive = (d: Date) => allReservations.some(r => {
    const rd = safeDate(r.dateTime);
    return rd && isSameDay(rd, d) && ['confirmed', 'seated'].includes(r.status);
  });

  const dayAll = allReservations
    .filter(r => { const rd = safeDate(r.dateTime); return rd && isSameDay(rd, selectedDate); })
    .sort((a, b) => (safeDate(a.dateTime)?.getTime() ?? 0) - (safeDate(b.dateTime)?.getTime() ?? 0));

  const dayFiltered = statusFilter === 'all' ? dayAll : dayAll.filter(r => r.status === statusFilter);

  const todayAll = allReservations.filter(r => { const rd = safeDate(r.dateTime); return rd && isSameDay(rd, today); });
  const todayCounts = {
    total: todayAll.length,
    confirmed: todayAll.filter(r => r.status === 'confirmed').length,
    seated: todayAll.filter(r => r.status === 'seated').length,
    guests: todayAll.filter(r => ['confirmed', 'seated'].includes(r.status)).reduce((s, r) => s + r.partySize, 0),
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: RES_QK(branchId) });

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rezervasiyalar</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Masa rezervasiyalarını idarə et</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => refetch()} disabled={isFetching}
            className="p-2 rounded-xl border border-border text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40">
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          </button>
          <button onClick={() => setShowWalkIn(true)}
            className="px-4 py-2 bg-success-500 hover:bg-success-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <Zap className="w-4 h-4" />Walk-in
          </button>
          <button onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />Yeni rezervasiya
          </button>
        </div>
      </div>

      {/* ── Today summary ── */}
      {isSameDay(selectedDate, today) && todayAll.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Bu gün cəmi',  value: todayCounts.total,     color: 'text-foreground' },
            { label: 'Gözlənilir',   value: todayCounts.confirmed, color: 'text-blue-600'    },
            { label: 'Oturub',       value: todayCounts.seated,    color: 'text-success-600' },
            { label: 'Cəmi qonaq',   value: todayCounts.guests,    color: 'text-primary-500' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-border bg-surface-elevated p-3 flex items-center gap-3">
              <p className={cn('text-2xl font-bold tabular-nums', s.color)}>{s.value}</p>
              <p className="text-xs text-foreground-muted leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Date scroller ── */}
      <div className="flex items-center gap-2">
        <button onClick={() => setWeekOffset(w => w - 1)}
          className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground hover:border-primary-500/40 transition-colors shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1 flex-1">
          {days.map(day => {
            const isSel = isSameDay(day, selectedDate);
            const isT   = isSameDay(day, today);
            const cnt   = dayCount(day);
            const act   = hasActive(day);
            return (
              <motion.button key={day.toISOString()} whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all min-w-[56px]',
                  isSel ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                    : act ? 'bg-primary-500/8 border-primary-500/40 hover:border-primary-500/70'
                    : 'bg-surface-elevated border-border hover:border-foreground-muted/30',
                )}>
                <span className="text-[10px] font-medium opacity-70 uppercase tracking-wide">
                  {day.toLocaleDateString('az-AZ', { weekday: 'short' }).toUpperCase()}
                </span>
                <span className={cn('text-lg font-bold leading-none', isT && !isSel && 'text-primary-500')}>
                  {day.getDate()}
                </span>
                {cnt > 0
                  ? <span className={cn('text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center', isSel ? 'bg-white/25 text-white' : 'bg-primary-500 text-white')}>{cnt}</span>
                  : isT ? <span className={cn('w-1 h-1 rounded-full', isSel ? 'bg-white/50' : 'bg-primary-500')} /> : null}
              </motion.button>
            );
          })}
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)}
          className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground hover:border-primary-500/40 transition-colors shrink-0">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Controls row ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground-muted">
          {fmtDateLong(selectedDate)}
          {dayAll.length > 0 && <span className="ml-2 text-primary-500 font-semibold">· {dayAll.length} rezervasiya</span>}
          {isLoading && <span className="ml-2 animate-pulse opacity-60">Yüklənir...</span>}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode toggle */}
          <div className="flex gap-0.5 rounded-xl border border-border bg-surface-elevated p-1">
            {([['list', LayoutList, 'Siyahı'], ['timeline', BarChart2, 'Qrafik']] as const).map(([id, Icon, label]) => (
              <button key={id} onClick={() => setViewMode(id as ViewMode)}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  viewMode === id ? 'bg-primary-500 text-white' : 'text-foreground-muted hover:text-foreground')}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          {viewMode === 'list' && dayAll.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {STATUS_FILTERS.map(f => {
                const cnt = f.id === 'all' ? dayAll.length : dayAll.filter(r => r.status === f.id).length;
                if (f.id !== 'all' && cnt === 0) return null;
                return (
                  <button key={f.id} onClick={() => setStatusFilter(f.id)}
                    className={cn('px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors',
                      statusFilter === f.id ? 'bg-primary-500 text-white border-primary-500'
                        : 'border-border text-foreground-muted hover:text-foreground')}>
                    {f.label} <span className="opacity-60">({cnt})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Views ── */}
      {viewMode === 'list' && (
        <ListView
          reservations={dayFiltered}
          isLoading={isLoading}
          statusFilter={statusFilter}
          onUpdate={updateStatus.mutate}
          onEdit={setEditRes}
          onDelete={id => { if (confirm('Silinsin?')) deleteRes.mutate(id); }}
        />
      )}

      {viewMode === 'timeline' && (
        <TimelineView
          reservations={dayAll}
          branchId={branchId}
          selectedDate={selectedDate}
          onEdit={setEditRes}
        />
      )}

      {/* ── Modals ── */}
      {showCreate && (
        <ReservationModal mode="create" branchId={branchId} defaultDate={selectedDate}
          allReservations={allReservations}
          onClose={() => setShowCreate(false)}
          onSaved={r => { qc.setQueryData(RES_QK(branchId), (old: TableReservation[] = []) => [...old, r].sort((a, b) => (safeDate(a.dateTime)?.getTime() ?? 0) - (safeDate(b.dateTime)?.getTime() ?? 0))); setShowCreate(false); }}
        />
      )}
      {editRes && (
        <ReservationModal mode="edit" initial={editRes} branchId={branchId} defaultDate={selectedDate}
          allReservations={allReservations}
          onClose={() => setEditRes(null)}
          onSaved={r => { qc.setQueryData(RES_QK(branchId), (old: TableReservation[] = []) => old.map(o => o.id === r.id ? r : o)); setEditRes(null); }}
        />
      )}
      {showWalkIn && (
        <WalkInModal branchId={branchId} allReservations={allReservations}
          onClose={() => setShowWalkIn(false)}
          onSaved={() => { invalidate(); setShowWalkIn(false); }}
        />
      )}
    </div>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({ reservations, isLoading, statusFilter, onUpdate, onEdit, onDelete }: {
  reservations: TableReservation[];
  isLoading: boolean;
  statusFilter: StatusFilter;
  onUpdate: (v: { id: string; status: string }) => void;
  onEdit: (r: TableReservation) => void;
  onDelete: (id: string) => void;
}) {
  if (!isLoading && reservations.length === 0) {
    return (
      <div className="text-center py-16 text-foreground-muted">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">
          {statusFilter !== 'all'
            ? `"${STATUS_CFG[statusFilter]?.label}" statuslu rezervasiya yoxdur`
            : 'Bu tarix üçün rezervasiya yoxdur'}
        </p>
        <p className="text-sm mt-1 opacity-70">Yuxarıdakı düymə ilə yeni rezervasiya əlavə et</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map(res => {
        const resDate = safeDate(res.dateTime);
        const endDate = resDate ? new Date(resDate.getTime() + (res.duration ?? 90) * 60000) : null;
        const isVip   = res.customer?.tags?.includes('VIP');

        return (
          <motion.div key={res.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-surface-elevated rounded-2xl border border-border p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                {/* Time block */}
                <div className="flex flex-col items-center bg-primary-500/10 rounded-xl p-2.5 min-w-[62px] shrink-0">
                  <Clock className="w-4 h-4 text-primary-500 mb-1" />
                  <span className="text-sm font-bold text-primary-500 tabular-nums leading-none">{fmtTime(res.dateTime)}</span>
                  {endDate && <span className="text-[10px] text-primary-400 mt-0.5 tabular-nums">— {fmtTime(endDate)}</span>}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold truncate">{res.customerName}</p>
                    {isVip && <span className="flex items-center gap-0.5 text-[10px] font-bold bg-yellow-500/15 text-yellow-600 px-1.5 py-0.5 rounded-full border border-yellow-500/30"><Star className="w-2.5 h-2.5" />VIP</span>}
                    {res.customer && (
                      <span className="text-[10px] text-foreground-muted bg-foreground-muted/10 px-1.5 py-0.5 rounded-full">
                        {res.customer.totalOrders} gəliş
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-foreground-muted mt-0.5">
                    {res.phone && res.phone !== '—' && (
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" />{res.phone}</span>
                    )}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3 shrink-0" />{res.partySize} nəfər</span>
                    <span className="flex items-center gap-1"><Timer className="w-3 h-3 shrink-0" />{res.duration ?? 90} dəq</span>
                  </div>

                  {res.table ? (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold bg-primary-500/10 text-primary-600 px-2 py-0.5 rounded-full border border-primary-500/20">
                      <MapPin className="w-3 h-3" />Masa {res.table.number}
                      {res.table.section && ` · ${res.table.section}`}
                      {res.table.capacity && ` · ${res.table.capacity}n`}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-foreground-muted/50 px-2 py-0.5 rounded-full border border-border">Masa seçilməyib</span>
                  )}

                  {res.notes && (
                    <p className="text-xs text-foreground-muted mt-1.5 flex items-start gap-1 italic">
                      <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />{res.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', STATUS_CFG[res.status]?.color)}>
                  {STATUS_CFG[res.status]?.label ?? res.status}
                </span>
                <div className="flex gap-1">
                  {res.status === 'confirmed' && (<>
                    <Btn onClick={() => onUpdate({ id: res.id, status: 'seated' })}    title="Oturt"   cls="bg-success-500/10 text-success-600 hover:bg-success-500/20"><Check className="w-3.5 h-3.5" /></Btn>
                    <Btn onClick={() => onUpdate({ id: res.id, status: 'no_show' })}   title="Gəlmədi" cls="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"><Users className="w-3.5 h-3.5" /></Btn>
                    <Btn onClick={() => onUpdate({ id: res.id, status: 'cancelled' })} title="Ləğv et" cls="bg-danger-500/10 text-danger-500 hover:bg-danger-500/20"><X className="w-3.5 h-3.5" /></Btn>
                  </>)}
                  {res.status === 'seated' && (
                    <Btn onClick={() => onUpdate({ id: res.id, status: 'completed' })} title="Tamamla" cls="bg-success-500/10 text-success-600 hover:bg-success-500/20"><Check className="w-3.5 h-3.5" /></Btn>
                  )}
                  {['confirmed', 'seated'].includes(res.status) && (
                    <Btn onClick={() => onEdit(res)} title="Redaktə" cls="bg-foreground-muted/10 text-foreground-muted hover:bg-foreground-muted/20"><Edit2 className="w-3.5 h-3.5" /></Btn>
                  )}
                  {['completed', 'cancelled', 'no_show'].includes(res.status) && (
                    <Btn onClick={() => onDelete(res.id)} title="Sil" cls="bg-danger-500/10 text-danger-500 hover:bg-danger-500/20"><Trash2 className="w-3.5 h-3.5" /></Btn>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Timeline View ────────────────────────────────────────────────────────────

const COL_W = 80; // px per hour
const TIMELINE_START = 9;  // 09:00
const TIMELINE_END   = 24; // 24:00

function TimelineView({ reservations, branchId, selectedDate, onEdit }: {
  reservations: TableReservation[];
  branchId?: string;
  selectedDate: Date;
  onEdit: (r: TableReservation) => void;
}) {
  const { data: tables = [] } = useQuery<Array<{ id: string; number: string; section?: string | null }>>({
    queryKey: ['qr-tables', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      const r: any = await api.get(`/qr/tables?branchId=${branchId}`);
      const d = r?.data ?? r;
      return Array.isArray(d) ? d : [];
    },
    enabled: !!branchId,
    staleTime: 5 * 60_000,
  });

  const hours = Array.from({ length: TIMELINE_END - TIMELINE_START }, (_, i) => TIMELINE_START + i);
  const totalMin = (TIMELINE_END - TIMELINE_START) * 60;

  // Group reservations by tableId (null → unassigned row)
  const byTable = new Map<string | null, TableReservation[]>();
  byTable.set(null, []);
  tables.forEach(t => byTable.set(t.id, []));
  reservations.forEach(r => {
    const key = r.tableId ?? null;
    if (!byTable.has(key)) byTable.set(key, []);
    byTable.get(key)!.push(r);
  });

  function leftPct(dateTime: string) {
    const d = safeDate(dateTime);
    if (!d) return 0;
    const minFromStart = (d.getHours() - TIMELINE_START) * 60 + d.getMinutes();
    return Math.max(0, (minFromStart / totalMin) * 100);
  }
  function widthPct(dur: number) {
    return Math.min(100, (dur / totalMin) * 100);
  }

  const now = new Date();
  const nowPct = isSameDay(selectedDate, startOfDay(now))
    ? ((now.getHours() - TIMELINE_START) * 60 + now.getMinutes()) / totalMin * 100
    : null;

  if (tables.length === 0 && reservations.length === 0) {
    return (
      <div className="text-center py-16 text-foreground-muted">
        <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Bu tarix üçün qrafik məlumatı yoxdur</p>
      </div>
    );
  }

  const rows: Array<{ key: string | null; label: string; reservations: TableReservation[] }> = [];
  tables.forEach(t => rows.push({ key: t.id, label: `Masa ${t.number}${t.section ? ` · ${t.section}` : ''}`, reservations: byTable.get(t.id) ?? [] }));
  const unassigned = byTable.get(null) ?? [];
  if (unassigned.length > 0) rows.push({ key: null, label: 'Masasız', reservations: unassigned });

  return (
    <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${COL_W * hours.length + 120}px` }}>
          {/* Hour header */}
          <div className="flex border-b border-border">
            <div className="w-[120px] shrink-0 px-3 py-2 text-xs text-foreground-muted font-medium">Masa</div>
            <div className="flex-1 flex relative">
              {hours.map(h => (
                <div key={h} style={{ width: COL_W }} className="shrink-0 border-l border-border/50 px-1.5 py-2 text-xs text-foreground-muted">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {rows.map(row => (
            <div key={String(row.key)} className="flex border-b border-border/50 hover:bg-foreground-muted/[0.02] transition-colors min-h-[48px]">
              <div className="w-[120px] shrink-0 px-3 py-3 text-xs font-medium text-foreground truncate">{row.label}</div>
              <div className="flex-1 relative">
                {/* Hour grid lines */}
                {hours.map(h => (
                  <div key={h} style={{ left: `${((h - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * 100}%` }}
                    className="absolute top-0 bottom-0 border-l border-border/30" />
                ))}

                {/* Now indicator */}
                {nowPct !== null && nowPct >= 0 && nowPct <= 100 && (
                  <div style={{ left: `${nowPct}%` }} className="absolute top-0 bottom-0 w-0.5 bg-danger-500 z-10 pointer-events-none" />
                )}

                {/* Reservation blocks */}
                {row.reservations.map(res => {
                  const lp = leftPct(res.dateTime);
                  const wp = widthPct(res.duration ?? 90);
                  return (
                    <button
                      key={res.id}
                      onClick={() => onEdit(res)}
                      title={`${res.customerName} · ${fmtTime(res.dateTime)} · ${res.partySize}n`}
                      style={{ left: `${lp}%`, width: `${wp}%` }}
                      className={cn(
                        'absolute top-1.5 bottom-1.5 rounded-lg border text-[10px] text-white font-medium px-1.5 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity text-left',
                        TIMELINE_COLOR[res.status] ?? 'bg-foreground-muted/40 border-foreground-muted',
                      )}
                    >
                      <span className="truncate block leading-tight">{res.customerName}</span>
                      <span className="opacity-75">{res.partySize}n · {fmtTime(res.dateTime)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 flex flex-wrap gap-4 border-t border-border">
        {Object.entries(STATUS_CFG).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <span className={cn('w-3 h-3 rounded-sm border', TIMELINE_COLOR[k])} />{v.label}
          </span>
        ))}
        {nowPct !== null && (
          <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <span className="w-0.5 h-3 bg-danger-500 inline-block" />İndi
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Walk-in Modal ────────────────────────────────────────────────────────────

interface WalkTable { id: string; number: string; capacity?: number | null; section?: string | null; status?: string; }

function WalkInModal({ branchId, allReservations, onClose, onSaved }: {
  branchId?: string;
  allReservations: TableReservation[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tableId, setTableId] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const { data: tables = [], isLoading } = useQuery<WalkTable[]>({
    queryKey: ['qr-tables', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      const r: any = await api.get(`/qr/tables?branchId=${branchId}`);
      const d = r?.data ?? r;
      return Array.isArray(d) ? d : [];
    },
    enabled: !!branchId,
    staleTime: 5 * 60_000,
  });

  // Which tables are currently reserved/occupied?
  const now = new Date().getTime();
  const busyTableIds = new Set(
    allReservations
      .filter(r => ['confirmed', 'seated'].includes(r.status) && r.tableId)
      .filter(r => {
        const s = safeDate(r.dateTime)?.getTime();
        if (!s) return false;
        const e = s + (r.duration ?? 90) * 60000;
        return now >= s && now <= e;
      })
      .map(r => r.tableId!)
  );

  const save = useMutation({
    mutationFn: () => api.post('/reservations', {
      branchId,
      tableId: tableId || undefined,
      customerName: name.trim() || 'Walk-in',
      phone: phone.trim() || '—',
      partySize,
      dateTime: new Date().toISOString(),
      duration: 90,
      walkIn: true,
    }),
    onSuccess: () => onSaved(),
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Xəta baş verdi'),
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-surface rounded-3xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-success-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-success-600" />
            </span>
            <h3 className="font-bold">Walk-in</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-foreground-muted/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Party size */}
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-2">Nəfər sayı</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setPartySize(p => Math.max(1, p - 1))}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-lg font-bold hover:border-primary-500/40 transition-colors">−</button>
              <span className="text-3xl font-bold w-12 text-center tabular-nums">{partySize}</span>
              <button onClick={() => setPartySize(p => Math.min(20, p + 1))}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-lg font-bold hover:border-primary-500/40 transition-colors">+</button>
            </div>
          </div>

          {/* Optional name/phone */}
          <div className="grid grid-cols-1 gap-2">
            <input placeholder="Ad (isteğe bağlı)" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-elevated text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
            <input placeholder="Telefon (isteğe bağlı)" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-elevated text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40" />
          </div>

          {/* Table grid */}
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-2">
              Masa <span className="opacity-50">(isteğe bağlı)</span>
            </label>
            {isLoading ? (
              <p className="text-xs text-foreground-muted animate-pulse">Yüklənir...</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => setTableId('')}
                  className={cn('py-2 rounded-xl border text-xs font-medium transition-all',
                    tableId === '' ? 'bg-primary-500 text-white border-primary-500' : 'border-border text-foreground-muted hover:border-primary-500/40')}>
                  Yoxdur
                </button>
                {tables.map(t => {
                  const busy = busyTableIds.has(t.id);
                  const sel  = tableId === t.id;
                  return (
                    <button key={t.id} onClick={() => { if (!busy) setTableId(t.id); }}
                      disabled={busy}
                      title={busy ? 'Hazırda doludur' : `Masa ${t.number}${t.capacity ? ` · ${t.capacity}n` : ''}`}
                      className={cn('py-2 rounded-xl border text-xs font-bold transition-all',
                        sel  ? 'bg-primary-500 text-white border-primary-500'
                          : busy ? 'bg-danger-500/10 border-danger-500/30 text-danger-500 cursor-not-allowed'
                          : 'border-border text-foreground-muted hover:border-success-500/50 hover:text-success-600')}>
                      {t.number}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-2 flex gap-3 text-[10px] text-foreground-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded border border-success-500/50" />Boş</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded border border-danger-500/30 bg-danger-500/10" />Dolu</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-primary-500" />Seçilib</span>
            </div>
          </div>

          {error && <p className="text-xs text-danger-500 bg-danger-500/10 rounded-xl px-3 py-2">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-3 border border-border rounded-2xl text-sm font-medium hover:bg-foreground-muted/5">
            Ləğv et
          </button>
          <button onClick={() => { setError(''); save.mutate(); }} disabled={save.isPending}
            className="flex-1 py-3 bg-success-500 hover:bg-success-600 text-white rounded-2xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            <Zap className="w-4 h-4" />
            {save.isPending ? 'Əlavə edilir...' : 'Oturdu'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Reservation Modal (create + edit + CRM lookup) ───────────────────────────

interface ModalTable { id: string; number: string; capacity?: number | null; section?: string | null; status?: string; }

interface ModalProps {
  mode: 'create' | 'edit';
  branchId?: string;
  defaultDate: Date;
  allReservations: TableReservation[];
  initial?: TableReservation;
  onClose: () => void;
  onSaved: (r: TableReservation) => void;
}

function buildForm(mode: 'create' | 'edit', date: Date, init?: TableReservation) {
  if (mode === 'edit' && init) {
    const d = safeDate(init.dateTime);
    return {
      customerName: init.customerName,
      phone:        init.phone,
      partySize:    init.partySize,
      dateStr:      d ? toDatetimeLocal(d, d.getHours()) : toDatetimeLocal(date, 19),
      duration:     init.duration ?? 90,
      notes:        init.notes ?? '',
      tableId:      init.tableId ?? '',
      customerId:   init.customerId ?? '',
    };
  }
  return { customerName: '', phone: '', partySize: 2, dateStr: toDatetimeLocal(date, 19), duration: 90, notes: '', tableId: '', customerId: '' };
}

function ReservationModal({ mode, branchId, defaultDate, allReservations, initial, onClose, onSaved }: ModalProps) {
  const [form, setForm] = useState(() => buildForm(mode, defaultDate, initial));
  const [error, setError]           = useState('');
  const [crmCustomer, setCrmCustomer] = useState<TableReservation['customer'] | null>(initial?.customer ?? null);
  const [crmLoading, setCrmLoading]   = useState(false);
  const phoneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(p => ({ ...p, [k]: v }));

  // CRM phone lookup
  const handlePhoneChange = (val: string) => {
    set('phone', val);
    if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
    const digits = val.replace(/\D/g, '');
    if (digits.length < 7 || !branchId) { setCrmCustomer(null); return; }
    phoneDebounceRef.current = setTimeout(async () => {
      setCrmLoading(true);
      try {
        const r: any = await api.get(`/customers/lookup/phone?branchId=${branchId}&phone=${encodeURIComponent(val)}`);
        const c = r?.data ?? null;
        setCrmCustomer(c);
        if (c && !form.customerName.trim()) set('customerName', c.name);
        if (c) set('customerId', c.id);
      } catch { setCrmCustomer(null); }
      finally { setCrmLoading(false); }
    }, 600);
  };

  const { data: tables = [] } = useQuery<ModalTable[]>({
    queryKey: ['qr-tables', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      const r: any = await api.get(`/qr/tables?branchId=${branchId}`);
      const d = r?.data ?? r;
      return Array.isArray(d) ? d : [];
    },
    enabled: !!branchId,
    staleTime: 5 * 60_000,
  });

  const selDt = safeDate(form.dateStr);
  const conflictIds = new Set<string>();
  if (selDt) {
    const ss = selDt.getTime();
    for (const r of allReservations) {
      if (!r.tableId || !['confirmed', 'seated'].includes(r.status)) continue;
      if (mode === 'edit' && initial && r.id === initial.id) continue;
      const rs = safeDate(r.dateTime)?.getTime();
      if (rs == null) continue;
      if (overlaps(ss, form.duration, rs, r.duration ?? 90)) conflictIds.add(r.tableId);
    }
  }

  const save = useMutation({
    mutationFn: () => {
      if (!branchId) throw new Error('Filial seçilməyib');
      const body = {
        branchId,
        customerName: form.customerName.trim(),
        phone:        form.phone.trim(),
        partySize:    Number(form.partySize),
        dateTime:     form.dateStr,
        duration:     form.duration,
        notes:        form.notes.trim() || undefined,
        tableId:      form.tableId || null,
        customerId:   form.customerId || null,
      };
      return mode === 'create'
        ? api.post('/reservations', body)
        : api.patch(`/reservations/${initial!.id}`, body);
    },
    onSuccess: (r: any) => {
      const saved = r?.data ?? r;
      if (saved?.id) onSaved(saved as TableReservation);
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? e?.message ?? 'Xəta baş verdi'),
  });

  const canSubmit = form.customerName.trim() && form.dateStr && !save.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="bg-surface rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-surface z-10 rounded-t-3xl">
          <h3 className="text-lg font-bold">{mode === 'edit' ? 'Rezervasiyanı Redaktə Et' : 'Yeni Rezervasiya'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-foreground-muted/10"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Phone — first, enables CRM lookup */}
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              <Phone className="inline w-3 h-3 mr-1" />Telefon
            </label>
            <div className="relative">
              <input
                placeholder="+994 XX XXX XX XX"
                value={form.phone}
                onChange={e => handlePhoneChange(e.target.value)}
                type="tel"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-primary-500/40 pr-10"
              />
              {crmLoading && (
                <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted animate-spin" />
              )}
            </div>

            {/* CRM card */}
            {crmCustomer && (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-primary-500/30 bg-primary-500/5 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-primary-600">{crmCustomer.name}</p>
                    {crmCustomer.tags?.includes('VIP') && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold bg-yellow-500/15 text-yellow-600 px-1.5 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5" />VIP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    {crmCustomer.totalOrders} gəliş · {crmCustomer.totalSpent.toFixed(0)} ₼ · {crmCustomer.points} xal
                  </p>
                </div>
                <button
                  onClick={() => { set('customerName', crmCustomer.name); set('customerId', crmCustomer.id); }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-primary-500 text-white hover:bg-primary-600 shrink-0"
                >Avtodoldur</button>
              </div>
            )}

            {!crmCustomer && form.phone.replace(/\D/g, '').length >= 7 && !crmLoading && (
              <p className="mt-1.5 text-xs text-foreground-muted flex items-center gap-1">
                <Users className="w-3 h-3" />Yeni müştəri — CRM-də qeyd tapılmadı
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">Ad Soyad *</label>
            <input ref={mode === 'edit' ? firstRef : undefined}
              placeholder="Ad Soyad *"
              value={form.customerName}
              onChange={e => set('customerName', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            />
          </div>

          {/* Datetime + Party size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                <Calendar className="inline w-3 h-3 mr-1" />Tarix və vaxt *
              </label>
              <input type="datetime-local" value={form.dateStr}
                onChange={e => { set('dateStr', e.target.value); setError(''); }}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                <Users className="inline w-3 h-3 mr-1" />Nəfər *
              </label>
              <input type="number" min={1} max={50} value={form.partySize}
                onChange={e => set('partySize', Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-sm" />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              <Timer className="inline w-3 h-3 mr-1" />Müddət
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTS.map(opt => (
                <button key={opt.value} type="button" onClick={() => { set('duration', opt.value); setError(''); }}
                  className={cn('px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
                    form.duration === opt.value ? 'bg-primary-500 text-white border-primary-500'
                      : 'border-border text-foreground-muted hover:border-primary-500/50 hover:text-foreground')}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table picker */}
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              <MapPin className="inline w-3 h-3 mr-1" />Masa <span className="opacity-50 font-normal">(isteğe bağlı)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <TChip label="Yoxdur" selected={form.tableId === ''} onClick={() => set('tableId', '')} />
              {tables.map(t => (
                <TChip key={t.id} label={`Masa ${t.number}${t.capacity ? ` (${t.capacity})` : ''}`}
                  selected={form.tableId === t.id} conflict={conflictIds.has(t.id)}
                  inactive={t.status === 'inactive'}
                  onClick={() => { if (t.status !== 'inactive') { set('tableId', t.id); setError(''); } }} />
              ))}
            </div>
            {form.tableId && conflictIds.has(form.tableId) && (
              <p className="mt-1.5 text-xs text-orange-600">⚠ Bu masa seçilmiş vaxtda artıq rezerv edilib</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              <StickyNote className="inline w-3 h-3 mr-1" />Qeyd
            </label>
            <textarea placeholder="Ad günü, allergiya, xüsusi istək..." value={form.notes}
              onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:ring-2 focus:ring-primary-500/40 resize-none text-sm" />
          </div>

          {error && (
            <div className="rounded-xl bg-danger-500/10 border border-danger-500/30 px-4 py-2.5 text-sm text-danger-600">{error}</div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 border border-border rounded-2xl text-sm font-medium hover:bg-foreground-muted/5">Ləğv et</button>
          <button onClick={() => { setError(''); save.mutate(); }} disabled={!canSubmit}
            className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            {mode === 'edit' ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {save.isPending ? 'Saxlanılır...' : mode === 'edit' ? 'Yenilə' : 'Saxla'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Mini helpers ─────────────────────────────────────────────────────────────

function Btn({ onClick, title, cls, children }: {
  onClick: () => void; title: string; cls: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} title={title} className={cn('p-1.5 rounded-lg transition-colors', cls)}>{children}</button>
  );
}

function TChip({ label, selected, conflict, inactive, onClick }: {
  label: string; selected: boolean; conflict?: boolean; inactive?: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} disabled={inactive}
      className={cn('relative px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
        selected  ? 'bg-primary-500 text-white border-primary-500'
          : conflict  ? 'border-orange-400/60 bg-orange-500/10 text-orange-600 hover:border-orange-400'
          : inactive  ? 'border-border text-foreground-muted/30 cursor-not-allowed'
          : 'border-border text-foreground-muted hover:border-success-500/50 hover:text-success-600')}>
      {label}
      {conflict && !selected && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-surface text-white flex items-center justify-center text-[8px] font-bold">!</span>
      )}
    </button>
  );
}
