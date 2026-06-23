import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Package, AlertTriangle, XCircle, CheckCircle, Plus, History
} from 'lucide-react';
import api from '@/services/api';
import { useActiveBranch } from '../hooks/useActiveBranch';
import { SectionTitle } from '../components/SectionTitle';
import type { Product, StockMovement, StockSummary } from '@/types';

type StockFilter = 'all' | 'low';
type MovementType = 'purchase' | 'waste' | 'adjustment' | 'return';

interface AdjustForm {
  productId: string;
  productName: string;
  type: MovementType;
  quantity: string;
  unitCost: string;
  note: string;
}

export function InventoryView() {
  const { activeBranch } = useActiveBranch();
  const branchId = activeBranch?.id;
  const qc = useQueryClient();
  const [filter, setFilter] = useState<StockFilter>('all');
  const [adjustForm, setAdjustForm] = useState<AdjustForm | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: products = [], isLoading } = useQuery<(Product & { stockStatus: string })[]>({
    queryKey: ['inventory-products', branchId, filter],
    queryFn: () => api.get(`/inventory/products?branchId=${branchId}${filter === 'low' ? '&filter=low' : ''}`).then((r: any) => r.data.data),
    enabled: !!branchId,
    refetchInterval: 60000,
  });

  const { data: summary } = useQuery<StockSummary>({
    queryKey: ['stock-summary', branchId],
    queryFn: () => api.get(`/inventory/summary?branchId=${branchId}`).then((r: any) => r.data.data),
    enabled: !!branchId,
    refetchInterval: 60000,
  });

  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ['stock-movements', branchId],
    queryFn: () => api.get(`/inventory/movements?branchId=${branchId}&limit=30`).then((r: any) => r.data.data),
    enabled: !!branchId && showHistory,
  });

  const adjustMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/adjust', data),
    onSuccess: () => {
      toast.success('Stok yeniləndi');
      qc.invalidateQueries({ queryKey: ['inventory-products'] });
      qc.invalidateQueries({ queryKey: ['stock-summary'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
      setAdjustForm(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });


  const handleAdjust = () => {
    if (!adjustForm || !adjustForm.quantity) return;
    adjustMutation.mutate({
      productId: adjustForm.productId,
      branchId,
      type: adjustForm.type,
      quantity: Number(adjustForm.quantity),
      unitCost: adjustForm.unitCost ? Number(adjustForm.unitCost) : undefined,
      note: adjustForm.note || undefined,
    });
  };

  const statusIcon = (status: string) => {
    if (status === 'out') return <XCircle className="h-4 w-4 text-danger-500" />;
    if (status === 'low') return <AlertTriangle className="h-4 w-4 text-warning-500" />;
    return <CheckCircle className="h-4 w-4 text-success-500" />;
  };

  const statusBg = (status: string) => {
    if (status === 'out') return 'border-danger-500/30 bg-danger-500/5';
    if (status === 'low') return 'border-warning-500/30 bg-warning-500/5';
    return 'border-border bg-surface';
  };

  const movementTypeLabel: Record<MovementType, string> = {
    purchase: 'Alış', waste: 'İsraf', adjustment: 'Düzəliş', return: 'İade'
  };

  const movementColors: Record<string, string> = {
    purchase: 'text-success-600 bg-success-500/10',
    sale: 'text-primary-500 bg-primary-500/10',
    waste: 'text-danger-500 bg-danger-500/10',
    adjustment: 'text-warning-600 bg-warning-500/10',
    return: 'text-info-500 bg-info-500/10',
  };

  return (
    <div className="space-y-8">
      <SectionTitle title="İnventar & Stok" subtitle="Məhsul stok idarəetməsi" />

      {/* Xülasə */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Ümumi', value: summary.total, color: 'text-foreground', bg: 'bg-surface-elevated' },
            { label: 'Normal', value: summary.healthy, color: 'text-success-600', bg: 'bg-success-500/5' },
            { label: 'Az qalıb', value: summary.lowStock, color: 'text-warning-600', bg: 'bg-warning-500/5' },
            { label: 'Bitmişdir', value: summary.outOfStock, color: 'text-danger-500', bg: 'bg-danger-500/5' },
          ].map(item => (
            <div key={item.label} className={`rounded-2xl border border-border ${item.bg} p-4 text-center`}>
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-foreground-muted mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter & Tarix */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'all' ? 'bg-primary-500 text-white' : 'border border-border text-foreground-muted hover:bg-surface-elevated'}`}>
            Hamısı
          </button>
          <button onClick={() => setFilter('low')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'low' ? 'bg-warning-500 text-white' : 'border border-border text-foreground-muted hover:bg-surface-elevated'}`}>
            <AlertTriangle className="h-3.5 w-3.5" /> Az & Bitmiş
          </button>
        </div>
        <button onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground-muted hover:bg-surface-elevated transition-colors">
          <History className="h-4 w-4" /> {showHistory ? 'Siyahı' : 'Tarix'}
        </button>
      </div>

      {/* Stok hərəkəti tarixi */}
      {showHistory ? (
        <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold">Stok Hərəkəti Tarixi</h3>
          </div>
          <div className="divide-y divide-border">
            {movements.length === 0 ? (
              <p className="text-center text-sm text-foreground-muted py-12">Hərəkət yoxdur</p>
            ) : movements.map(m => (
              <div key={m.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${movementColors[m.type] ?? 'text-foreground-muted bg-surface'}`}>
                    {m.type === 'sale' ? 'Satış' : movementTypeLabel[m.type as MovementType] ?? m.type}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{m.product?.nameAz ?? m.productId}</p>
                    {m.note && <p className="text-xs text-foreground-muted">{m.note}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{m.type === 'waste' || m.type === 'sale' ? '-' : '+'}{m.quantity} {m.product?.unit ?? 'ədəd'}</p>
                  <p className="text-xs text-foreground-muted">{new Date(m.createdAt).toLocaleDateString('az-AZ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Məhsul siyahısı */
        <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12 text-sm text-foreground-muted">Yüklənir...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-sm text-foreground-muted">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Stok aktiv məhsul tapılmadı</p>
              <p className="text-xs mt-1">Məhsulun stok idarəsini aktiv etmək üçün düzəliş edin</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {products.map(product => (
                <div key={product.id} className={`flex items-center justify-between px-6 py-4 ${statusBg(product.stockStatus)}`}>
                  <div className="flex items-center gap-3">
                    {statusIcon(product.stockStatus)}
                    <div>
                      <p className="text-sm font-medium">{product.nameAz}</p>
                      <p className="text-xs text-foreground-muted">{product.category?.nameAz}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${product.stockStatus === 'out' ? 'text-danger-500' : product.stockStatus === 'low' ? 'text-warning-600' : 'text-foreground'}`}>
                        {product.stockQuantity ?? '∞'}
                      </p>
                      <p className="text-xs text-foreground-muted">{product.unit ?? 'ədəd'}</p>
                    </div>

                    <button
                      onClick={() => setAdjustForm({
                        productId: product.id,
                        productName: product.nameAz,
                        type: 'purchase',
                        quantity: '',
                        unitCost: '',
                        note: '',
                      })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 text-xs font-medium hover:bg-primary-500/20 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Əlavə et
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stok Əlavə Modal */}
      {adjustForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold">Stok dəyiş — {adjustForm.productName}</h3>

            <div>
              <label className="text-xs font-medium text-foreground-muted">Əməliyyat növü</label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {(['purchase', 'waste', 'adjustment', 'return'] as MovementType[]).map(t => (
                  <button key={t} onClick={() => setAdjustForm(f => f ? { ...f, type: t } : f)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${adjustForm.type === t ? 'bg-primary-500 text-white' : 'border border-border text-foreground-muted hover:bg-surface'}`}>
                    {movementTypeLabel[t]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground-muted">Miqdar *</label>
              <input type="number" value={adjustForm.quantity} onChange={e => setAdjustForm(f => f ? { ...f, quantity: e.target.value } : f)}
                placeholder="0" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            {adjustForm.type === 'purchase' && (
              <div>
                <label className="text-xs font-medium text-foreground-muted">Alış qiyməti (₼)</label>
                <input type="number" value={adjustForm.unitCost} onChange={e => setAdjustForm(f => f ? { ...f, unitCost: e.target.value } : f)}
                  placeholder="0.00" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-foreground-muted">Qeyd</label>
              <input value={adjustForm.note} onChange={e => setAdjustForm(f => f ? { ...f, note: e.target.value } : f)}
                placeholder="İstəyə bağlı..." className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setAdjustForm(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface transition-colors">Ləğv et</button>
              <button onClick={handleAdjust} disabled={!adjustForm.quantity || adjustMutation.isPending}
                className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
                {adjustMutation.isPending ? 'Yüklənir...' : 'Yadda saxla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
