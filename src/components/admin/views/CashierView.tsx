import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Wallet, Lock, Unlock, Banknote,
  Clock, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Printer
} from 'lucide-react';
import api from '@/services/api';
import { useActiveBranch } from '../hooks/useActiveBranch';
import { SectionTitle } from '../components/SectionTitle';
import { printShiftReport } from '@/utils/printShiftReport';
import type { CashDrawer, Shift } from '@/types';

export function CashierView() {
  const { activeBranch } = useActiveBranch();
  const branchId = activeBranch?.id;
  const qc = useQueryClient();
  const [openingCash, setOpeningCash] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [closeDrawerNotes, setCloseDrawerNotes] = useState('');
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [showCloseDrawer, setShowCloseDrawer] = useState(false);
  const [expandedShift, setExpandedShift] = useState<string | null>(null);

  const { data: activeDrawer } = useQuery<CashDrawer | null>({
    queryKey: ['active-drawer', branchId],
    queryFn: () => api.get(`/cash/active?branchId=${branchId}`).then((r: any) => r.data.data),
    enabled: !!branchId,
    refetchInterval: 30000,
  });

  const { data: activeShift } = useQuery<Shift | null>({
    queryKey: ['active-shift', branchId],
    queryFn: () => api.get(`/shifts/active?branchId=${branchId}`).then((r: any) => r.data.data),
    enabled: !!branchId,
    refetchInterval: 30000,
  });

  useQuery<CashDrawer[]>({
    queryKey: ['drawers', branchId],
    queryFn: () => api.get(`/cash?branchId=${branchId}&limit=5`).then((r: any) => r.data.data),
    enabled: !!branchId,
  });

  const { data: recentShifts } = useQuery<Shift[]>({
    queryKey: ['shifts', branchId],
    queryFn: () => api.get(`/shifts?branchId=${branchId}&limit=5`).then((r: any) => r.data.data),
    enabled: !!branchId,
  });

  const openDrawer = useMutation({
    mutationFn: () => api.post('/cash/open', { branchId, openingCash: Number(openingCash) || 0 }),
    onSuccess: () => { toast.success('Kassa açıldı'); qc.invalidateQueries({ queryKey: ['active-drawer'] }); setOpeningCash(''); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });

  const closeDrawer = useMutation({
    mutationFn: () => api.post(`/cash/${activeDrawer?.id}/close`, { actualCash: Number(actualCash) || undefined, notes: closeDrawerNotes }),
    onSuccess: () => {
      toast.success('Kassa bağlandı');
      qc.invalidateQueries({ queryKey: ['active-drawer'] });
      qc.invalidateQueries({ queryKey: ['drawers'] });
      setShowCloseDrawer(false); setActualCash(''); setCloseDrawerNotes('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });

  const openShift = useMutation({
    mutationFn: () => api.post('/shifts/open', { branchId, openingCash: Number(openingCash) || 0, notes: shiftNotes }),
    onSuccess: () => {
      toast.success('Smena açıldı');
      qc.invalidateQueries({ queryKey: ['active-shift'] });
      setOpeningCash(''); setShiftNotes('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });

  const closeShift = useMutation({
    mutationFn: () => api.post(`/shifts/${activeShift?.id}/close`, { notes: shiftNotes }),
    onSuccess: () => {
      toast.success('Smena bağlandı');
      qc.invalidateQueries({ queryKey: ['active-shift'] });
      qc.invalidateQueries({ queryKey: ['shifts'] });
      setShowCloseShift(false); setShiftNotes('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });

  const fmtTime = (iso: string) => new Date(iso).toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const fmtMoney = (n?: number) => `${(n ?? 0).toFixed(2)} ₼`;

  return (
    <div className="space-y-8">
      <SectionTitle title="Kassa & Smena" subtitle="Günlük kassa idarəetməsi" />

      {/* ─── Kassa Paneli ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Kassa */}
        <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary-500" /> Kassa
            </h3>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${activeDrawer ? 'bg-success-500/10 text-success-600' : 'bg-foreground-muted/10 text-foreground-muted'}`}>
              {activeDrawer ? 'Açıq' : 'Bağlı'}
            </span>
          </div>

          {activeDrawer ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-success-500/5 border border-success-500/20 p-3">
                  <p className="text-xs text-foreground-muted mb-1">Açılış pulu</p>
                  <p className="text-lg font-bold text-success-600">{fmtMoney(activeDrawer.openingCash)}</p>
                </div>
                <div className="rounded-xl bg-primary-500/5 border border-primary-500/20 p-3">
                  <p className="text-xs text-foreground-muted mb-1">Açıldı</p>
                  <p className="text-sm font-semibold">{fmtTime(activeDrawer.openedAt)}</p>
                  <p className="text-xs text-foreground-muted">{activeDrawer.openedBy?.name}</p>
                </div>
              </div>

              {!showCloseDrawer ? (
                <button onClick={() => setShowCloseDrawer(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-danger-500/10 border border-danger-500/20 py-2.5 text-sm font-medium text-danger-500 hover:bg-danger-500/20 transition-colors">
                  <Lock className="h-4 w-4" /> Kassanı Bağla
                </button>
              ) : (
                <div className="space-y-3 rounded-xl border border-danger-500/20 bg-danger-500/5 p-4">
                  <p className="text-sm font-medium text-danger-600">Kassa bağlama</p>
                  <div>
                    <label className="text-xs text-foreground-muted">Real nağd məbləğ (₼)</label>
                    <input type="number" value={actualCash} onChange={e => setActualCash(e.target.value)}
                      placeholder="0.00" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="text-xs text-foreground-muted">Qeyd</label>
                    <input value={closeDrawerNotes} onChange={e => setCloseDrawerNotes(e.target.value)}
                      placeholder="İstəyə bağlı..." className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCloseDrawer(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-surface-elevated transition-colors">Ləğv et</button>
                    <button onClick={() => closeDrawer.mutate()} disabled={closeDrawer.isPending}
                      className="flex-1 rounded-lg bg-danger-500 py-2 text-sm font-medium text-white hover:bg-danger-600 disabled:opacity-50 transition-colors">
                      {closeDrawer.isPending ? 'Bağlanır...' : 'Bağla'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-foreground-muted">Açılış nağd məbləği (₼)</label>
                <input type="number" value={openingCash} onChange={e => setOpeningCash(e.target.value)}
                  placeholder="0.00" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button onClick={() => openDrawer.mutate()} disabled={openDrawer.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
                <Unlock className="h-4 w-4" /> {openDrawer.isPending ? 'Açılır...' : 'Kasanı Aç'}
              </button>
            </div>
          )}
        </div>

        {/* Smena */}
        <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning-500" /> Smena
            </h3>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${activeShift ? 'bg-success-500/10 text-success-600' : 'bg-foreground-muted/10 text-foreground-muted'}`}>
              {activeShift ? 'Aktiv' : 'Bağlı'}
            </span>
          </div>

          {activeShift ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-warning-500/5 border border-warning-500/20 p-3">
                  <p className="text-xs text-foreground-muted mb-1">Açıldı</p>
                  <p className="text-sm font-semibold">{fmtTime(activeShift.openedAt)}</p>
                </div>
                <div className="rounded-xl bg-surface p-3 border border-border">
                  <p className="text-xs text-foreground-muted mb-1">Kassir</p>
                  <p className="text-sm font-semibold">{activeShift.openedBy?.name}</p>
                </div>
              </div>

              {!showCloseShift ? (
                <button onClick={() => setShowCloseShift(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-warning-500/10 border border-warning-500/20 py-2.5 text-sm font-medium text-warning-600 hover:bg-warning-500/20 transition-colors">
                  <Lock className="h-4 w-4" /> Smenanı Bağla
                </button>
              ) : (
                <div className="space-y-3 rounded-xl border border-warning-500/20 bg-warning-500/5 p-4">
                  <p className="text-sm font-medium text-warning-600">Smena bağlama</p>
                  <div>
                    <label className="text-xs text-foreground-muted">Qeyd</label>
                    <input value={shiftNotes} onChange={e => setShiftNotes(e.target.value)}
                      placeholder="İstəyə bağlı..." className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCloseShift(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-surface-elevated transition-colors">Ləğv et</button>
                    <button onClick={() => closeShift.mutate()} disabled={closeShift.isPending}
                      className="flex-1 rounded-lg bg-warning-500 py-2 text-sm font-medium text-white hover:bg-warning-600 disabled:opacity-50 transition-colors">
                      {closeShift.isPending ? 'Bağlanır...' : 'Bağla & Hesabat'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-foreground-muted">Açılış nağd məbləği (₼)</label>
                <input type="number" value={openingCash} onChange={e => setOpeningCash(e.target.value)}
                  placeholder="0.00" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="text-xs text-foreground-muted">Qeyd</label>
                <input value={shiftNotes} onChange={e => setShiftNotes(e.target.value)}
                  placeholder="İstəyə bağlı..." className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button onClick={() => openShift.mutate()} disabled={openShift.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-warning-500 py-2.5 text-sm font-medium text-white hover:bg-warning-600 disabled:opacity-50 transition-colors">
                <Unlock className="h-4 w-4" /> {openShift.isPending ? 'Açılır...' : 'Smena Aç'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Keçmiş Smena Hesabatları ─── */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6">
        <h3 className="text-base font-semibold mb-4">Keçmiş Smenalar</h3>
        {!recentShifts?.length ? (
          <p className="text-center text-sm text-foreground-muted py-8">Smena tapılmadı</p>
        ) : (
          <div className="space-y-3">
            {recentShifts.map(shift => (
              <div key={shift.id} className="rounded-xl border border-border bg-surface overflow-hidden">
                <button
                  onClick={() => setExpandedShift(expandedShift === shift.id ? null : shift.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-elevated transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-2.5 w-2.5 rounded-full ${shift.status === 'open' ? 'bg-success-500' : 'bg-foreground-muted/30'}`} />
                    <div>
                      <p className="text-sm font-medium">{fmtTime(shift.openedAt)}</p>
                      <p className="text-xs text-foreground-muted">{shift.openedBy?.name}</p>
                    </div>
                    {shift.status === 'closed' && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-success-600"><Banknote className="h-3.5 w-3.5" />{fmtMoney(shift.totalRevenue)}</span>
                        <span className="text-foreground-muted">{shift.totalOrders} sifariş</span>
                      </div>
                    )}
                  </div>
                  {expandedShift === shift.id ? <ChevronUp className="h-4 w-4 text-foreground-muted" /> : <ChevronDown className="h-4 w-4 text-foreground-muted" />}
                </button>

                {expandedShift === shift.id && shift.status === 'closed' && (
                  <div className="border-t border-border p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-foreground-muted">Nağd</p>
                        <p className="text-sm font-semibold text-success-600">{fmtMoney(shift.totalCash)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground-muted">Kart</p>
                        <p className="text-sm font-semibold text-primary-500">{fmtMoney(shift.totalCard)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground-muted">Bahşiş</p>
                        <p className="text-sm font-semibold">{fmtMoney(shift.totalTips)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground-muted">Endirim</p>
                        <p className="text-sm font-semibold text-danger-500">-{fmtMoney(shift.totalDiscount)}</p>
                      </div>
                      {shift.cashDifference !== undefined && shift.cashDifference !== null && (
                        <div className="col-span-2 md:col-span-4 flex items-center gap-2">
                          {shift.cashDifference === 0
                            ? <><CheckCircle className="h-4 w-4 text-success-500" /><span className="text-sm text-success-600">Kassa balansı düzgündür</span></>
                            : shift.cashDifference < 0
                              ? <><XCircle className="h-4 w-4 text-danger-500" /><span className="text-sm text-danger-500">Kassa kəsiri: {fmtMoney(Math.abs(shift.cashDifference))}</span></>
                              : <><AlertTriangle className="h-4 w-4 text-warning-500" /><span className="text-sm text-warning-600">Artıq pul: {fmtMoney(shift.cashDifference)}</span></>
                          }
                        </div>
                      )}
                    </div>
                    {/* Print düymələri */}
                    <div className="flex gap-2 pt-1 border-t border-border">
                      <button
                        onClick={() => printShiftReport(shift, activeBranch?.restaurant?.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5" /> A4 Çap
                      </button>
                      <button
                        onClick={() => printShiftReport(shift, activeBranch?.restaurant?.name, true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5" /> Termal (80mm)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
