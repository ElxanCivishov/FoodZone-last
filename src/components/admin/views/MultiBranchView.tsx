import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Building2, TrendingUp, ShoppingBag, AlertTriangle, Clock,
  Copy, CheckCircle, Edit2, MapPin, Phone, Wifi, LayoutList,
  ToggleLeft, ToggleRight, X, Save,
} from 'lucide-react';
import api from '@/services/api';
import { SectionTitle } from '../components/SectionTitle';
import { AppSelect } from '../components/AppSelect';
import type { BranchStat, Branch } from '@/types';
import { cn } from '@/utils/cn';

type MBTab = 'list' | 'compare' | 'copy';

export function MultiBranchView() {
  const [tab, setTab] = useState<MBTab>('list');

  return (
    <div className="space-y-6">
      <SectionTitle title="Filiallar" subtitle="Filial idarəetməsi, müqayisə və menyu kopyalama" />

      <div className="flex gap-1 rounded-xl border border-border bg-surface-elevated p-1 w-fit">
        {([
          { id: 'list',    label: 'Siyahı',           icon: LayoutList  },
          { id: 'compare', label: 'Müqayisə',          icon: TrendingUp  },
          { id: 'copy',    label: 'Menyu Kopyalama',   icon: Copy        },
        ] as { id: MBTab; label: string; icon: typeof LayoutList }[]).map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === item.id ? 'bg-primary-500 text-white' : 'text-foreground-muted hover:text-foreground')}>
            <item.icon className="h-4 w-4" />{item.label}
          </button>
        ))}
      </div>

      {tab === 'list'    && <BranchListTab />}
      {tab === 'compare' && <CompareTab />}
      {tab === 'copy'    && <CopyMenuTab />}
    </div>
  );
}

// ─── Filial Siyahısı ──────────────────────────────────────────────────────────

function BranchListTab() {
  const qc = useQueryClient();
  const [editBranch, setEditBranch] = useState<Branch | null>(null);

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ['branches-all'],
    queryFn: () => api.get('/branches').then((r: any) => {
      const d = r.data?.data ?? r.data;
      return Array.isArray(d) ? d : [];
    }),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/branches/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches-all'] }); toast.success('Status yeniləndi'); },
    onError: () => toast.error('Xəta baş verdi'),
  });

  if (isLoading) {
    return <div className="text-center py-20 text-sm text-foreground-muted">Yüklənir...</div>;
  }

  if (branches.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl border border-border bg-surface-elevated">
        <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p className="text-sm font-medium">Filial tapılmadı</p>
        <p className="text-xs text-foreground-muted mt-1">Hələ heç bir filial yaradılmayıb</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {branches.map(branch => (
        <div key={branch.id}
          className="rounded-2xl border border-border bg-surface-elevated p-5 flex flex-col sm:flex-row sm:items-center gap-4">

          {/* Icon */}
          <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary-500" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold truncate">{branch.name}</p>
              {branch.restaurant && (
                <span className="text-xs text-foreground-muted">— {branch.restaurant.name}</span>
              )}
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                branch.status === 'active'
                  ? 'bg-success-500/10 text-success-600'
                  : 'bg-foreground-muted/10 text-foreground-muted')}>
                {branch.status === 'active' ? 'Aktiv' : 'Deaktiv'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-foreground-muted">
              {branch.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{branch.address}
                </span>
              )}
              {branch.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />{branch.phone}
                </span>
              )}
              {branch.wifiName && (
                <span className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />{branch.wifiName}
                </span>
              )}
              {branch.tables && (
                <span className="flex items-center gap-1">
                  <LayoutList className="h-3 w-3" />{branch.tables.length} masa
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => toggleStatus.mutate({
                id: branch.id,
                status: branch.status === 'active' ? 'inactive' : 'active',
              })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground-muted hover:text-foreground hover:border-primary-500/40 transition-colors"
              title={branch.status === 'active' ? 'Deaktiv et' : 'Aktiv et'}
            >
              {branch.status === 'active'
                ? <ToggleRight className="h-4 w-4 text-success-600" />
                : <ToggleLeft  className="h-4 w-4" />}
              {branch.status === 'active' ? 'Aktiv' : 'Deaktiv'}
            </button>

            <button
              onClick={() => setEditBranch(branch)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground-muted hover:text-foreground hover:border-primary-500/40 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />Redaktə
            </button>
          </div>
        </div>
      ))}

      {editBranch && (
        <EditBranchModal
          branch={editBranch}
          onClose={() => setEditBranch(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['branches-all'] });
            setEditBranch(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Redaktə Modalı ───────────────────────────────────────────────────────────

function EditBranchModal({ branch, onClose, onSaved }: {
  branch: Branch;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name:        branch.name,
    address:     branch.address ?? '',
    phone:       branch.phone ?? '',
    wifiName:    branch.wifiName ?? '',
    wifiPassword: branch.wifiPassword ?? '',
  });

  const save = useMutation({
    mutationFn: () => api.patch(`/branches/${branch.id}`, form),
    onSuccess: () => { toast.success('Filial yeniləndi'); onSaved(); },
    onError:   () => toast.error('Xəta baş verdi'),
  });

  const field = (label: string, key: keyof typeof form, placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-foreground-muted mb-1">{label}</label>
      <input
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Filialı Redaktə Et</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-foreground-muted/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {field('Filial adı', 'name', 'Filial adı...')}
          {field('Ünvan', 'address', 'Küçə, şəhər...')}
          {field('Telefon', 'phone', '+994 XX XXX XX XX')}
          {field('WiFi adı', 'wifiName', 'FoodZone_WiFi')}
          {field('WiFi şifrəsi', 'wifiPassword', '...')}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
            Ləğv et
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !form.name.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors">
            <Save className="h-4 w-4" />
            {save.isPending ? 'Saxlanılır...' : 'Saxla'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Müqayisə Tabı ────────────────────────────────────────────────────────────

function CompareTab() {
  const { data: rawStats, isLoading } = useQuery<BranchStat[]>({
    queryKey: ['branch-stats'],
    queryFn: () => api.get('/dashboard/branches').then((r: any) => {
      const d = r.data?.data ?? r.data;
      return Array.isArray(d) ? d : [];
    }),
    refetchInterval: 60000,
  });

  // Fallback: if dashboard returns empty, use branch list to show placeholder stats
  const { data: branchList = [] } = useQuery<Branch[]>({
    queryKey: ['branches-all'],
    queryFn: () => api.get('/branches').then((r: any) => {
      const d = r.data?.data ?? r.data;
      return Array.isArray(d) ? d : [];
    }),
    enabled: (rawStats?.length ?? 0) === 0,
  });

  const stats: BranchStat[] = rawStats && rawStats.length > 0
    ? rawStats
    : branchList.map(b => ({
        branchId: b.id,
        branchName: b.name,
        restaurantName: b.restaurant?.name ?? '',
        today: { orders: 0, revenue: 0 },
        month: { orders: 0, revenue: 0 },
        activeOrders: 0,
        occupiedTables: 0,
        totalTables: b.tables?.length ?? 0,
        tableOccupancyPct: 0,
        lowStockAlerts: 0,
        shiftOpen: false,
      }));

  const fmt = (n: number) => `${n.toFixed(2)} ₼`;

  if (isLoading) {
    return <div className="text-center py-20 text-sm text-foreground-muted">Yüklənir...</div>;
  }

  if (stats.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl border border-border bg-surface-elevated">
        <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p className="text-sm text-foreground-muted">Filial tapılmadı</p>
        <p className="text-xs text-foreground-muted mt-1">
          <button onClick={() => {}} className="underline">Siyahı</button> tabından filialları yoxlayın
        </p>
      </div>
    );
  }

  const maxRevenue = Math.max(...stats.map(s => s.today.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Xülasə kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cəmi filial',    value: stats.length,                                           icon: Building2, color: 'text-primary-500',  bg: 'bg-primary-500/10'  },
          { label: 'Bu gün sifariş', value: stats.reduce((s, b) => s + b.today.orders, 0),          icon: ShoppingBag, color: 'text-success-600', bg: 'bg-success-500/10'  },
          { label: 'Bu gün gəlir',   value: fmt(stats.reduce((s, b) => s + b.today.revenue, 0)),    icon: TrendingUp, color: 'text-warning-600',  bg: 'bg-warning-500/10'  },
          { label: 'Aktiv sifariş',  value: stats.reduce((s, b) => s + b.activeOrders, 0),          icon: Clock, color: 'text-danger-500',        bg: 'bg-danger-500/10'   },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-border bg-surface-elevated p-4">
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.bg} mb-3`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-foreground-muted mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Gəlir bar chart */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6">
        <h3 className="text-sm font-semibold mb-4">Bu günün gəliri — filial üzrə</h3>
        <div className="space-y-3">
          {stats.map((branch, i) => (
            <div key={branch.branchId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  <span className="text-foreground-muted text-xs">#{i + 1}</span>
                  {branch.branchName}
                  {branch.shiftOpen && (
                    <span className="text-[10px] bg-success-500/10 text-success-600 px-1.5 py-0.5 rounded-full font-medium">AÇIQ</span>
                  )}
                </span>
                <span className="font-semibold text-success-600">{fmt(branch.today.revenue)}</span>
              </div>
              <div className="h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all"
                  style={{ width: `${Math.max(2, (branch.today.revenue / maxRevenue) * 100)}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs text-foreground-muted">
                <span>{branch.today.orders} sifariş</span>
                <span>{branch.occupiedTables}/{branch.totalTables} masa ({branch.tableOccupancyPct}%)</span>
                {branch.lowStockAlerts > 0 && (
                  <span className="text-warning-600 flex items-center gap-0.5">
                    <AlertTriangle className="h-3 w-3" />{branch.lowStockAlerts} az stok
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detallı cədvəl */}
      <div className="rounded-2xl border border-border bg-surface-elevated overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-foreground-muted/5">
              {['Filial', 'Bu gün', 'Bu ay', 'Aktiv sif.', 'Masa doluluğu', 'Stok xəbərdarlıq', 'Smena'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stats.map(branch => (
              <tr key={branch.branchId} className="hover:bg-foreground-muted/5">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium">{branch.branchName}</p>
                  <p className="text-xs text-foreground-muted">{branch.restaurantName}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-success-600">{fmt(branch.today.revenue)}</p>
                  <p className="text-xs text-foreground-muted">{branch.today.orders} sif.</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold">{fmt(branch.month.revenue)}</p>
                  <p className="text-xs text-foreground-muted">{branch.month.orders} sif.</p>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-sm font-semibold', branch.activeOrders > 0 ? 'text-primary-500' : 'text-foreground-muted')}>
                    {branch.activeOrders}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                      <div className={cn('h-full rounded-full', branch.tableOccupancyPct > 80 ? 'bg-danger-500' : branch.tableOccupancyPct > 50 ? 'bg-warning-500' : 'bg-success-500')}
                        style={{ width: `${branch.tableOccupancyPct}%` }} />
                    </div>
                    <span className="text-xs text-foreground-muted">{branch.tableOccupancyPct}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {branch.lowStockAlerts > 0 ? (
                    <span className="flex items-center gap-1 text-xs text-warning-600">
                      <AlertTriangle className="h-3.5 w-3.5" />{branch.lowStockAlerts}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-success-600">
                      <CheckCircle className="h-3.5 w-3.5" />Yaxşı
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {branch.shiftOpen ? (
                    <span className="text-xs bg-success-500/10 text-success-600 px-2 py-0.5 rounded-full font-medium">Açıq</span>
                  ) : (
                    <span className="text-xs bg-foreground-muted/10 text-foreground-muted px-2 py-0.5 rounded-full">Bağlı</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Menyu Kopyalama Tabı ─────────────────────────────────────────────────────

function CopyMenuTab() {
  const [sourceBranchId, setSourceBranchId] = useState('');
  const [targetBranchId, setTargetBranchId] = useState('');
  const [copyCategories, setCopyCategories] = useState(true);
  const [copyProducts, setCopyProducts] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const [result, setResult] = useState<{ categoriesCopied: number; categoriesSkipped: number; productsCopied: number; productsSkipped: number } | null>(null);

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches-all'],
    queryFn: () => api.get('/branches').then((r: any) => {
      const d = r.data?.data ?? r.data;
      return Array.isArray(d) ? d : [];
    }),
  });

  const copyMutation = useMutation({
    mutationFn: () => api.post('/branches/copy', { sourceBranchId, targetBranchId, copyCategories, copyProducts, overwrite }),
    onSuccess: (r: any) => {
      setResult(r.data.data);
      toast.success(r.data.message);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });

  const branchList = Array.isArray(branches) ? branches : [];

  return (
    <div className="space-y-6 max-w-xl">
      <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-5">
        <h3 className="text-sm font-semibold">Menyu Kopyalama</h3>
        <p className="text-xs text-foreground-muted">Bir filialın kateqoriya və məhsullarını başqa filialа köçür.</p>

        <div>
          <label className="text-xs font-medium text-foreground-muted">Mənbə filial (kopyalanacaq)</label>
          <div className="mt-1">
            <AppSelect
              value={sourceBranchId}
              onChange={setSourceBranchId}
              placeholder="Seçin..."
              options={branchList.map((b: Branch) => ({ value: b.id, label: b.name }))}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground-muted">Hədəf filial (kopyalanacaq yer)</label>
          <div className="mt-1">
            <AppSelect
              value={targetBranchId}
              onChange={setTargetBranchId}
              placeholder="Seçin..."
              options={branchList
                .filter((b: Branch) => b.id !== sourceBranchId)
                .map((b: Branch) => ({ value: b.id, label: b.name }))}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          {[
            { label: 'Kateqoriyaları kopyala',            value: copyCategories, set: setCopyCategories },
            { label: 'Məhsulları kopyala',                value: copyProducts,   set: setCopyProducts   },
            { label: 'Mövcudları üzərinə yaz (overwrite)', value: overwrite,      set: setOverwrite      },
          ].map(item => (
            <label key={item.label} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">{item.label}</span>
              <button
                onClick={() => item.set(!item.value)}
                className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  item.value ? 'bg-primary-500' : 'bg-foreground-muted/30')}>
                <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                  item.value ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            </label>
          ))}
        </div>

        {overwrite && (
          <div className="rounded-xl bg-warning-500/10 border border-warning-500/30 px-4 py-3 text-xs text-warning-700">
            ⚠ Overwrite rejimində mövcud məhsul/kateqoriyalar yenilənəcək. Bu əməliyyat geri qaytarıla bilməz.
          </div>
        )}

        <button
          onClick={() => copyMutation.mutate()}
          disabled={!sourceBranchId || !targetBranchId || copyMutation.isPending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
          <Copy className="h-4 w-4" />
          {copyMutation.isPending ? 'Kopyalanır...' : 'Kopyala'}
        </button>
      </div>

      {result && (
        <div className="rounded-2xl border border-success-500/30 bg-success-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2 text-success-600 font-semibold text-sm">
            <CheckCircle className="h-5 w-5" /> Kopyalama tamamlandı
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Kateqoriya kopyalandı', value: result.categoriesCopied,  color: 'text-success-600'       },
              { label: 'Kateqoriya atlandı',    value: result.categoriesSkipped, color: 'text-foreground-muted'  },
              { label: 'Məhsul kopyalandı',     value: result.productsCopied,    color: 'text-success-600'       },
              { label: 'Məhsul atlandı',        value: result.productsSkipped,   color: 'text-foreground-muted'  },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-border bg-surface p-3 text-center">
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-foreground-muted mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
