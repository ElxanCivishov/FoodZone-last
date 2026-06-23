import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { QrCode, Link2, Link2Off, BarChart3, Settings, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { get } from '@/services/api';
import api from '@/services/api';
import type { Table, TableStats } from '@/types';
import { cn } from '@/utils/cn';
import { SectionTitle } from '../components/SectionTitle';
import { StatusPill } from '../components/StatusPill';
import { useActiveBranchId } from '../hooks/useActiveBranch';
import { useQrMutations } from '../hooks/useAdminMutations';
import { TableMap } from './TableMap';

type QRTab = 'tables' | 'map' | 'stats';

export function QRView() {
  const { t } = useTranslation();
  const branchId = useActiveBranchId();
  const qc = useQueryClient();
  const { generateQr, updateTable } = useQrMutations();
  const [tab, setTab] = useState<QRTab>('tables');
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [mergingTable, setMergingTable] = useState<Table | null>(null);
  const [editForm, setEditForm] = useState({ section: '', shape: 'square', capacity: '' });

  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables', branchId],
    queryFn: () => get<Table[]>('/qr/tables', branchId ? { branchId } : undefined),
    enabled: !!branchId,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<TableStats[]>({
    queryKey: ['table-stats', branchId],
    queryFn: () => api.get(`/qr/tables/stats?branchId=${branchId}`).then((r: any) => r.data.data),
    enabled: !!branchId && tab === 'stats',
  });

  const mergeMutation = useMutation({
    mutationFn: ({ id, primaryTableId }: { id: string; primaryTableId: string }) =>
      api.post(`/qr/tables/${id}/merge`, { primaryTableId }),
    onSuccess: () => {
      toast.success('Masalar birləşdirildi');
      qc.invalidateQueries({ queryKey: ['tables'] });
      setMergingTable(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta'),
  });

  const unmergeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/qr/tables/${id}/unmerge`),
    onSuccess: () => {
      toast.success('Masa ayrıldı');
      qc.invalidateQueries({ queryKey: ['tables'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta'),
  });

  const updateDetailsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/qr/tables/${id}`, data),
    onSuccess: () => {
      toast.success('Yeniləndi');
      qc.invalidateQueries({ queryKey: ['tables'] });
      setEditingTable(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta'),
  });

  const tableList: Table[] = (tables?.data || []);
  const mergedTableIds = new Set(tableList.filter(t => t.mergedWith).map(t => t.mergedWith!));

  const openEdit = (table: Table) => {
    setEditForm({
      section: table.section ?? '',
      shape: table.shape ?? 'square',
      capacity: table.capacity?.toString() ?? '',
    });
    setEditingTable(table);
  };

  return (
    <div className="space-y-6">
      <SectionTitle title={t('admin.tables')} />

      {/* Tab seçimi */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface-elevated p-1 w-fit">
        {([
          { id: 'tables', label: 'Masalar', icon: QrCode },
          { id: 'map', label: 'Xəritə', icon: Map },
          { id: 'stats', label: 'Statistika', icon: BarChart3 },
        ] as { id: QRTab; label: string; icon: typeof QrCode }[]).map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === item.id ? 'bg-primary-500 text-white' : 'text-foreground-muted hover:text-foreground')}>
            <item.icon className="h-4 w-4" />{item.label}
          </button>
        ))}
      </div>

      {/* ─── Masalar tabı ─── */}
      {tab === 'tables' && (
        isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {tableList.map((table) => {
              const isPrimary = mergedTableIds.has(table.id);
              const mergedIntoTable = table.mergedWith
                ? tableList.find(t => t.id === table.mergedWith)
                : null;

              return (
                <div key={table.id} className={cn(
                  'p-4 bg-surface-elevated border rounded-2xl space-y-3',
                  table.mergedWith ? 'border-warning-500/40 bg-warning-500/5' : 'border-border',
                )}>
                  {/* QR sahəsi */}
                  <div className="aspect-square bg-white rounded-xl flex items-center justify-center relative">
                    <QrCode className="w-16 h-16 text-black" />
                    {table.mergedWith && (
                      <div className="absolute top-2 right-2 bg-warning-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        MERGE
                      </div>
                    )}
                  </div>

                  {/* Başlıq */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">Masa {table.number}</p>
                      <p className="text-xs text-foreground-muted">
                        {table.section && `${table.section} · `}
                        {table.capacity ? `${table.capacity} nəfər` : ''}
                      </p>
                      {mergedIntoTable && (
                        <p className="text-xs text-warning-600 font-medium">
                          → Masa {mergedIntoTable.number} ilə birləşib
                        </p>
                      )}
                      {isPrimary && (
                        <p className="text-xs text-primary-500 font-medium">
                          ← {tableList
                            .filter(t => t.mergedWith === table.id)
                            .map(t => `Masa ${t.number}`)
                            .join(', ')} qoşulub
                        </p>
                      )}
                    </div>
                    <StatusPill status={table.status} />
                  </div>

                  {/* Düymələr */}
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => generateQr.mutate(table.id)}
                      className="py-2 bg-primary-500 text-white rounded-xl text-xs font-medium hover:bg-primary-600 transition-colors">
                      QR Yarat
                    </button>
                    <button onClick={() => updateTable.mutate({ id: table.id, status: table.status === 'active' ? 'inactive' : 'active' })}
                      className="py-2 bg-foreground-muted/10 rounded-xl text-xs font-medium hover:bg-foreground-muted/20 transition-colors">
                      {table.status === 'active' ? 'Deaktiv' : 'Aktiv'}
                    </button>
                  </div>

                  {/* Əlavə əməliyyatlar */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => openEdit(table)}
                      className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-border text-xs text-foreground-muted hover:bg-surface hover:text-foreground transition-colors">
                      <Settings className="h-3 w-3" /> Redaktə
                    </button>
                    {table.mergedWith ? (
                      <button onClick={() => unmergeMutation.mutate(table.id)}
                        className="col-span-2 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-warning-500/40 text-xs text-warning-600 hover:bg-warning-500/10 transition-colors">
                        <Link2Off className="h-3 w-3" /> Ayır
                      </button>
                    ) : (
                      <button onClick={() => setMergingTable(table)}
                        className="col-span-2 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-border text-xs text-foreground-muted hover:bg-surface hover:text-foreground transition-colors">
                        <Link2 className="h-3 w-3" /> Birləşdir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ─── Xəritə tabı ─── */}
      {tab === 'map' && <TableMap tables={tableList} branchId={branchId ?? ''} />}

      {/* ─── Statistika tabı ─── */}
      {tab === 'stats' && (
        statsLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-foreground-muted/5">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted">Masa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted">Bölmə</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted">Sifarişlər</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted">Ort. oturma</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted">Ort. çek</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted">Tutum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(statsData ?? []).map(stat => (
                  <tr key={stat.tableId} className="hover:bg-foreground-muted/5">
                    <td className="px-4 py-3 text-sm font-medium">Masa {stat.number}</td>
                    <td className="px-4 py-3 text-sm text-foreground-muted">{stat.section ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right">{stat.totalOrders}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {stat.avgDurationMin > 0 ? (
                        <span className={cn('font-medium', stat.avgDurationMin > 90 ? 'text-danger-500' : stat.avgDurationMin > 60 ? 'text-warning-600' : 'text-success-600')}>
                          {stat.avgDurationMin} dəq
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {stat.avgRevenue > 0 ? `${stat.avgRevenue.toFixed(2)} ₼` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-foreground-muted">
                      {stat.capacity ? `${stat.capacity} nəf.` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ─── Redaktə modalı ─── */}
      {editingTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold">Masa {editingTable.number} — Redaktə</h3>
            <div>
              <label className="text-xs font-medium text-foreground-muted">Bölmə (Section)</label>
              <input value={editForm.section} onChange={e => setEditForm(f => ({ ...f, section: e.target.value }))}
                placeholder="VIP, Terrace, Indoor..."
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground-muted">Forma</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {(['square', 'round', 'rectangle'] as const).map(s => (
                  <button key={s} onClick={() => setEditForm(f => ({ ...f, shape: s }))}
                    className={cn('py-2 rounded-lg text-xs font-medium border transition-colors',
                      editForm.shape === s ? 'border-primary-500 bg-primary-500/10 text-primary-500' : 'border-border text-foreground-muted hover:bg-surface')}>
                    {s === 'square' ? '■ Kvadrat' : s === 'round' ? '● Dairəvi' : '▬ Uzun'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground-muted">Tutum (nəfər)</label>
              <input type="number" value={editForm.capacity} onChange={e => setEditForm(f => ({ ...f, capacity: e.target.value }))}
                placeholder="4"
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditingTable(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface transition-colors">
                Ləğv et
              </button>
              <button
                onClick={() => updateDetailsMutation.mutate({
                  id: editingTable.id,
                  data: {
                    section: editForm.section || null,
                    shape: editForm.shape,
                    capacity: editForm.capacity ? Number(editForm.capacity) : null,
                  },
                })}
                disabled={updateDetailsMutation.isPending}
                className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
                {updateDetailsMutation.isPending ? 'Yüklənir...' : 'Saxla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Birləşdirmə modalı ─── */}
      {mergingTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold">Masa {mergingTable.number} — Birləşdir</h3>
            <p className="text-sm text-foreground-muted">Hansı masaya qoşulsun?</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tableList
                .filter(t => t.id !== mergingTable.id && !t.mergedWith)
                .map(t => (
                  <button
                    key={t.id}
                    onClick={() => mergeMutation.mutate({ id: mergingTable.id, primaryTableId: t.id })}
                    disabled={mergeMutation.isPending}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:border-primary-500/50 hover:bg-primary-500/5 transition-colors text-left">
                    <span className="text-sm font-medium">Masa {t.number}</span>
                    <span className="text-xs text-foreground-muted">{t.section ?? ''} {t.capacity ? `· ${t.capacity} nəf.` : ''}</span>
                  </button>
                ))}
            </div>
            <button onClick={() => setMergingTable(null)}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface transition-colors">
              Ləğv et
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
