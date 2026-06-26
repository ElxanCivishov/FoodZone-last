import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Package, AlertTriangle, XCircle, CheckCircle, Plus, History,
  FlaskConical, BookOpen, ClipboardCheck, TrendingDown,
  Trash2, Pencil, X,
} from 'lucide-react';
import api from '@/services/api';
import { useActiveBranch } from '../hooks/useActiveBranch';
import { SectionTitle } from '../components/SectionTitle';
import { cn } from '@/utils/cn';
import type { Product, StockMovement, StockSummary } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────

type InvTab = 'products' | 'raw-materials' | 'recipes' | 'stocktake';
type StockFilter = 'all' | 'low';

interface RawMaterial {
  id: string;
  nameAz: string;
  nameEn: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit?: number;
  category?: string;
  stockStatus: 'ok' | 'low' | 'out';
  _count: { ingredients: number };
}

interface RecipeProduct {
  id: string;
  nameAz: string;
  recipe?: {
    id: string;
    yield: number;
    ingredients: { id: string; rawMaterialId: string; quantity: number; unit: string; rawMaterial: RawMaterial }[];
  } | null;
}

interface StocktakeItem {
  id: string;
  rawMaterialId: string;
  expected: number;
  actual: number | null;
  difference: number | null;
}

interface Stocktake {
  id: string;
  status: string;
  openedAt: string;
  items: StocktakeItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const movementTypeLabel: Record<string, string> = {
  purchase: 'Alış', waste: 'İsraf', adjustment: 'Düzəliş', return: 'İade',
  consumption: 'İstifadə', stocktake: 'Sayım',
};

const movementColors: Record<string, string> = {
  purchase: 'text-success-600 bg-success-500/10',
  sale: 'text-primary-500 bg-primary-500/10',
  waste: 'text-danger-500 bg-danger-500/10',
  adjustment: 'text-warning-600 bg-warning-500/10',
  return: 'text-blue-500 bg-blue-500/10',
  consumption: 'text-orange-500 bg-orange-500/10',
  stocktake: 'text-purple-500 bg-purple-500/10',
};

const TAB_ITEMS: { id: InvTab; label: string; icon: typeof Package }[] = [
  { id: 'products',      label: 'Məhsul Stoku',    icon: Package },
  { id: 'raw-materials', label: 'Xammal',           icon: FlaskConical },
  { id: 'recipes',       label: 'Reseptlər',        icon: BookOpen },
  { id: 'stocktake',     label: 'İnventar Sayımı',  icon: ClipboardCheck },
];

function StockBadge({ status }: { status: string }) {
  if (status === 'out') return <XCircle className="h-4 w-4 text-danger-500" />;
  if (status === 'low') return <AlertTriangle className="h-4 w-4 text-warning-500" />;
  return <CheckCircle className="h-4 w-4 text-success-500" />;
}

// ── Main Component ───────────────────────────────────────────────────────────

export function InventoryView() {
  const { activeBranch } = useActiveBranch();
  const branchId = activeBranch?.id;
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<InvTab>('products');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [adjustForm, setAdjustForm] = useState<any | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [rawForm, setRawForm] = useState<any | null>(null);
  const [selectedRecipeProduct, setSelectedRecipeProduct] = useState<string | null>(null);
  const [recipeForm, setRecipeForm] = useState<any | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data: products = [], isLoading: prodLoading } = useQuery<(Product & { stockStatus: string })[]>({
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
    enabled: !!branchId && showHistory && activeTab === 'products',
  });

  const { data: rawMaterials = [], isLoading: rawLoading } = useQuery<RawMaterial[]>({
    queryKey: ['raw-materials', branchId, filter],
    queryFn: () => api.get(`/raw-materials?branchId=${branchId}${filter === 'low' ? '&filter=low' : ''}`).then((r: any) => r.data.data),
    enabled: !!branchId && activeTab === 'raw-materials',
  });

  const { data: rawMovements = [] } = useQuery({
    queryKey: ['raw-movements', selectedMaterial?.id],
    queryFn: () => api.get(`/raw-materials/${selectedMaterial?.id}/movements?limit=60`).then((r: any) => r.data.data),
    enabled: !!selectedMaterial,
  });

  const { data: recipeProducts = [], isLoading: recipesLoading } = useQuery<RecipeProduct[]>({
    queryKey: ['recipe-products', branchId],
    queryFn: () =>
      api.get(`/inventory/products?branchId=${branchId}`).then((r: any) =>
        r.data.data.map((p: any) => ({ id: p.id, nameAz: p.nameAz, recipe: p.recipe }))
      ),
    enabled: !!branchId && activeTab === 'recipes',
  });

  const { data: activeStocktake, isLoading: stLoading } = useQuery<Stocktake | null>({
    queryKey: ['active-stocktake', branchId],
    queryFn: () => api.get(`/inventory/stocktake/active?branchId=${branchId}`).then((r: any) => r.data.data),
    enabled: !!branchId && activeTab === 'stocktake',
  });

  // Stok trend (raw material movements → running balance)
  const stockTrend = useMemo(() => {
    if (!Array.isArray(rawMovements) || rawMovements.length === 0) return [];
    const sorted = [...rawMovements].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let running = selectedMaterial?.currentStock ?? 0;
    const reversed = sorted.reverse();
    const result = reversed.map((m: any) => {
      const prev = running - m.quantity;
      running = prev;
      return {
        date: new Date(m.createdAt).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit' }),
        stock: parseFloat(prev.toFixed(2)),
      };
    });
    return result.reverse().slice(-20);
  }, [rawMovements, selectedMaterial]);

  // ── Mutations ────────────────────────────────────────────────────────────────

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

  const rawCreateMutation = useMutation({
    mutationFn: (data: any) => rawForm?.id
      ? api.patch(`/raw-materials/${rawForm.id}`, data)
      : api.post('/raw-materials', data),
    onSuccess: () => {
      toast.success(rawForm?.id ? 'Xammal yeniləndi' : 'Xammal yaradıldı');
      qc.invalidateQueries({ queryKey: ['raw-materials'] });
      setRawForm(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });

  const rawMovementMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.post(`/raw-materials/${id}/movement`, data),
    onSuccess: () => {
      toast.success('Hərəkət qeyd edildi');
      qc.invalidateQueries({ queryKey: ['raw-materials'] });
      qc.invalidateQueries({ queryKey: ['raw-movements', selectedMaterial?.id] });
      setAdjustForm(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });

  const recipeMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: any }) =>
      api.put(`/recipes/product/${productId}`, data),
    onSuccess: () => {
      toast.success('Resept yadda saxlandı');
      qc.invalidateQueries({ queryKey: ['recipe-products'] });
      setRecipeForm(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });

  const startStocktakeMutation = useMutation({
    mutationFn: () => api.post('/inventory/stocktake', { branchId }),
    onSuccess: () => {
      toast.success('Sayım başladıldı');
      qc.invalidateQueries({ queryKey: ['active-stocktake'] });
    },
  });

  const updateStocktakeItemMutation = useMutation({
    mutationFn: ({ stocktakeId, itemId, actual }: { stocktakeId: string; itemId: string; actual: number }) =>
      api.patch(`/inventory/stocktake/${stocktakeId}/items/${itemId}`, { actual }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['active-stocktake'] }),
  });

  const completeStocktakeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/inventory/stocktake/${id}/complete`, {}),
    onSuccess: () => {
      toast.success('Sayım tamamlandı, stoklar yeniləndi');
      qc.invalidateQueries({ queryKey: ['active-stocktake'] });
      qc.invalidateQueries({ queryKey: ['raw-materials'] });
    },
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <SectionTitle title="İnventar & Stok" subtitle="Məhsul stok, xammal, resept və inventar sayımı" />

      {/* Tab selector */}
      <div className="flex gap-1 p-1 bg-surface-elevated border border-border rounded-2xl w-fit flex-wrap">
        {TAB_ITEMS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-glow-sm'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {/* ── TAB: Products ─────────────────────────────────────────────── */}
          {activeTab === 'products' && (
            <div className="space-y-6">
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

              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex gap-2">
                  <button onClick={() => setFilter('all')} className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-colors', filter === 'all' ? 'bg-primary-500 text-white' : 'border border-border text-foreground-muted hover:bg-surface-elevated')}>Hamısı</button>
                  <button onClick={() => setFilter('low')} className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors', filter === 'low' ? 'bg-warning-500 text-white' : 'border border-border text-foreground-muted hover:bg-surface-elevated')}>
                    <AlertTriangle className="h-3.5 w-3.5" /> Az & Bitmiş
                  </button>
                </div>
                <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground-muted hover:bg-surface-elevated transition-colors">
                  <History className="h-4 w-4" /> {showHistory ? 'Siyahı' : 'Tarix'}
                </button>
              </div>

              {showHistory ? (
                <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
                  <div className="border-b border-border px-6 py-4"><h3 className="text-sm font-semibold">Stok Hərəkəti Tarixi</h3></div>
                  <div className="divide-y divide-border">
                    {movements.length === 0 ? (
                      <p className="text-center text-sm text-foreground-muted py-12">Hərəkət yoxdur</p>
                    ) : movements.map(m => (
                      <div key={m.id} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${movementColors[m.type] ?? 'text-foreground-muted bg-surface'}`}>
                            {movementTypeLabel[m.type] ?? m.type}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{(m as any).product?.nameAz ?? m.productId}</p>
                            {m.note && <p className="text-xs text-foreground-muted">{m.note}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{m.type === 'waste' || m.type === 'sale' ? '-' : '+'}{m.quantity}</p>
                          <p className="text-xs text-foreground-muted">{new Date(m.createdAt).toLocaleDateString('az-AZ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
                  {prodLoading ? (
                    <p className="text-center py-12 text-sm text-foreground-muted">Yüklənir...</p>
                  ) : products.length === 0 ? (
                    <div className="text-center py-12 text-sm text-foreground-muted">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Stok aktiv məhsul tapılmadı</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {products.map(product => (
                        <div key={product.id} className={cn('flex items-center justify-between px-6 py-4', product.stockStatus === 'out' ? 'border-danger-500/20 bg-danger-500/5' : product.stockStatus === 'low' ? 'border-warning-500/20 bg-warning-500/5' : '')}>
                          <div className="flex items-center gap-3">
                            <StockBadge status={product.stockStatus} />
                            <div>
                              <p className="text-sm font-medium">{product.nameAz}</p>
                              <p className="text-xs text-foreground-muted">{(product as any).category?.nameAz}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`text-lg font-bold ${product.stockStatus === 'out' ? 'text-danger-500' : product.stockStatus === 'low' ? 'text-warning-600' : 'text-foreground'}`}>{product.stockQuantity ?? '∞'}</p>
                              <p className="text-xs text-foreground-muted">{product.unit ?? 'ədəd'}</p>
                            </div>
                            <button onClick={() => setAdjustForm({ productId: product.id, productName: product.nameAz, type: 'purchase', quantity: '', unitCost: '', note: '', mode: 'product' })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 text-xs font-medium hover:bg-primary-500/20 transition-colors">
                              <Plus className="h-3.5 w-3.5" /> Əlavə et
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Raw Materials ──────────────────────────────────────────── */}
          {activeTab === 'raw-materials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-2">
                  <button onClick={() => setFilter('all')} className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-colors', filter === 'all' ? 'bg-primary-500 text-white' : 'border border-border text-foreground-muted hover:bg-surface-elevated')}>Hamısı</button>
                  <button onClick={() => setFilter('low')} className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors', filter === 'low' ? 'bg-warning-500 text-white' : 'border border-border text-foreground-muted hover:bg-surface-elevated')}>
                    <TrendingDown className="h-3.5 w-3.5" /> Az qalıb
                  </button>
                </div>
                <button onClick={() => setRawForm({ nameAz: '', nameEn: '', unit: 'kg', currentStock: '', minStock: '', category: '' })}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors">
                  <Plus className="h-4 w-4" /> Yeni Xammal
                </button>
              </div>

              {/* Trend qrafiki (seçilmiş material) */}
              <AnimatePresence>
                {selectedMaterial && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{selectedMaterial.nameAz} — Stok Trendi</h3>
                      <button onClick={() => setSelectedMaterial(null)} className="text-foreground-muted hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={stockTrend}>
                        <defs>
                          <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="stock" stroke="#f97316" fill="url(#stockGrad)" strokeWidth={2} dot={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} width={35} />
                        <Tooltip
                          contentStyle={{ background: 'hsl(var(--surface-elevated))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                          formatter={(v: any) => [`${v} ${selectedMaterial.unit}`, 'Stok']}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
                {rawLoading ? (
                  <p className="text-center py-12 text-sm text-foreground-muted">Yüklənir...</p>
                ) : rawMaterials.length === 0 ? (
                  <div className="text-center py-12">
                    <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm text-foreground-muted">Xammal tapılmadı</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {rawMaterials.map(m => (
                      <div key={m.id} className={cn('flex items-center justify-between px-6 py-4 group', m.stockStatus === 'out' ? 'bg-danger-500/5' : m.stockStatus === 'low' ? 'bg-warning-500/5' : '')}>
                        <div className="flex items-center gap-3">
                          <StockBadge status={m.stockStatus} />
                          <div>
                            <p className="text-sm font-medium">{m.nameAz}</p>
                            <p className="text-xs text-foreground-muted">{m.category || '—'} · {m._count.ingredients} reseptdə</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${m.stockStatus === 'out' ? 'text-danger-500' : m.stockStatus === 'low' ? 'text-warning-600' : 'text-foreground'}`}>{m.currentStock.toFixed(2)}</p>
                            <p className="text-xs text-foreground-muted">{m.unit} (min: {m.minStock})</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setSelectedMaterial(m)} title="Trend" className="p-1.5 rounded-lg hover:bg-surface-elevated text-foreground-muted">
                              <TrendingDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setAdjustForm({ rawMaterialId: m.id, name: m.nameAz, unit: m.unit, type: 'purchase', quantity: '', note: '', mode: 'raw' })}
                              className="p-1.5 rounded-lg hover:bg-surface-elevated text-foreground-muted"
                              title="Hərəkət"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setRawForm({ id: m.id, nameAz: m.nameAz, nameEn: m.nameEn, unit: m.unit, currentStock: m.currentStock, minStock: m.minStock, category: m.category || '' })}
                              className="p-1.5 rounded-lg hover:bg-surface-elevated text-foreground-muted"
                              title="Düzəliş"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: Recipes ───────────────────────────────────────────────── */}
          {activeTab === 'recipes' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
                {recipesLoading ? (
                  <p className="text-center py-12 text-sm text-foreground-muted">Yüklənir...</p>
                ) : recipeProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm text-foreground-muted">Məhsul tapılmadı</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recipeProducts.map(p => (
                      <div key={p.id}>
                        <div className="flex items-center justify-between px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-2 h-2 rounded-full', p.recipe ? 'bg-success-500' : 'bg-foreground-muted/30')} />
                            <p className="text-sm font-medium">{p.nameAz}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {p.recipe && (
                              <span className="text-xs text-foreground-muted">{p.recipe.ingredients.length} ingredient</span>
                            )}
                            <button
                              onClick={() => {
                                setSelectedRecipeProduct(selectedRecipeProduct === p.id ? null : p.id);
                                setRecipeForm(p.recipe
                                  ? { yield: p.recipe.yield, note: '', ingredients: p.recipe.ingredients.map(i => ({ rawMaterialId: i.rawMaterialId, name: i.rawMaterial.nameAz, quantity: i.quantity, unit: i.unit })) }
                                  : { yield: 1, note: '', ingredients: [] }
                                );
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 text-xs font-medium hover:bg-primary-500/20 transition-colors"
                            >
                              {p.recipe ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                              {p.recipe ? 'Düzəliş' : 'Resept əlavə et'}
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {selectedRecipeProduct === p.id && recipeForm && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-border bg-surface px-6 py-4 space-y-3"
                            >
                              <div className="flex items-center gap-4">
                                <div>
                                  <label className="text-xs font-medium text-foreground-muted">Porsiya sayı</label>
                                  <input type="number" value={recipeForm.yield} onChange={e => setRecipeForm((f: any) => ({ ...f, yield: Number(e.target.value) }))}
                                    className="mt-1 w-24 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">Ingredientlər</p>
                                {recipeForm.ingredients.map((ing: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <span className="flex-1 text-foreground">{ing.name || ing.rawMaterialId}</span>
                                    <input type="number" value={ing.quantity} onChange={e => setRecipeForm((f: any) => ({ ...f, ingredients: f.ingredients.map((x: any, i: number) => i === idx ? { ...x, quantity: Number(e.target.value) } : x) }))}
                                      className="w-20 rounded-lg border border-border bg-surface px-2 py-1 text-xs" />
                                    <span className="text-xs text-foreground-muted w-10">{ing.unit}</span>
                                    <button onClick={() => setRecipeForm((f: any) => ({ ...f, ingredients: f.ingredients.filter((_: any, i: number) => i !== idx) }))} className="text-danger-500">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                                <p className="text-xs text-foreground-muted mt-1">Ingredient əlavə etmək üçün Xammal tabından seçin</p>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => setSelectedRecipeProduct(null)} className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-surface-elevated transition-colors">Ləğv</button>
                                <button onClick={() => recipeMutation.mutate({ productId: p.id, data: recipeForm })} disabled={recipeMutation.isPending}
                                  className="flex-1 rounded-xl bg-primary-500 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
                                  {recipeMutation.isPending ? 'Yüklənir...' : 'Yadda saxla'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: Stocktake ─────────────────────────────────────────────── */}
          {activeTab === 'stocktake' && (
            <div className="space-y-4">
              {stLoading ? (
                <p className="text-center py-12 text-sm text-foreground-muted">Yüklənir...</p>
              ) : !activeStocktake ? (
                <div className="text-center py-16 space-y-4">
                  <ClipboardCheck className="h-12 w-12 mx-auto text-foreground-muted/30" />
                  <p className="text-sm text-foreground-muted">Aktiv sayım yoxdur</p>
                  <button
                    onClick={() => startStocktakeMutation.mutate()}
                    disabled={startStocktakeMutation.isPending}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    {startStocktakeMutation.isPending ? 'Başladılır...' : 'Yeni Sayım Başlat'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Aktiv Sayım</p>
                      <p className="text-xs text-foreground-muted">{new Date(activeStocktake.openedAt).toLocaleString('az-AZ')} tarixindən açıqdır</p>
                    </div>
                    <button
                      onClick={() => completeStocktakeMutation.mutate(activeStocktake.id)}
                      disabled={completeStocktakeMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-success-500 text-white rounded-xl text-sm font-medium hover:bg-success-600 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {completeStocktakeMutation.isPending ? 'Tamamlanır...' : 'Sayımı Tamamla'}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
                    <div className="border-b border-border px-6 py-3 grid grid-cols-4 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                      <span>Xammal</span>
                      <span className="text-center">Sistem</span>
                      <span className="text-center">Faktiki</span>
                      <span className="text-center">Fərq</span>
                    </div>
                    <div className="divide-y divide-border">
                      {activeStocktake.items.map(item => (
                        <div key={item.id} className="grid grid-cols-4 items-center px-6 py-3 gap-2">
                          <p className="text-sm font-medium truncate">{item.rawMaterialId}</p>
                          <p className="text-sm text-center text-foreground-muted">{item.expected.toFixed(2)}</p>
                          <div className="flex justify-center">
                            <input
                              type="number"
                              defaultValue={item.actual ?? ''}
                              onBlur={e => {
                                const val = Number(e.target.value);
                                if (!isNaN(val)) {
                                  updateStocktakeItemMutation.mutate({ stocktakeId: activeStocktake.id, itemId: item.id, actual: val });
                                }
                              }}
                              className="w-20 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <p className={cn('text-sm text-center font-medium', item.difference !== null && item.difference < 0 ? 'text-danger-500' : item.difference !== null && item.difference > 0 ? 'text-success-500' : 'text-foreground-muted')}>
                            {item.difference !== null ? (item.difference > 0 ? `+${item.difference.toFixed(2)}` : item.difference.toFixed(2)) : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Stok Əlavə Modal (product & raw) ─────────────────────────────── */}
      <AnimatePresence>
        {adjustForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated shadow-2xl p-6 space-y-4">
              <h3 className="text-base font-semibold">
                {adjustForm.mode === 'raw' ? `Xammal hərəkəti — ${adjustForm.name}` : `Stok dəyiş — ${adjustForm.productName}`}
              </h3>

              <div>
                <label className="text-xs font-medium text-foreground-muted">Əməliyyat növü</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {(adjustForm.mode === 'raw'
                    ? ['purchase', 'waste', 'adjustment'] as const
                    : ['purchase', 'waste', 'adjustment', 'return'] as const
                  ).map(t => (
                    <button key={t} onClick={() => setAdjustForm((f: any) => ({ ...f, type: t }))}
                      className={cn('py-2 rounded-lg text-sm font-medium transition-colors', adjustForm.type === t ? 'bg-primary-500 text-white' : 'border border-border text-foreground-muted hover:bg-surface')}>
                      {movementTypeLabel[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground-muted">Miqdar *</label>
                <input type="number" value={adjustForm.quantity} onChange={e => setAdjustForm((f: any) => ({ ...f, quantity: e.target.value }))}
                  placeholder="0" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              {adjustForm.type === 'purchase' && (
                <div>
                  <label className="text-xs font-medium text-foreground-muted">Alış qiyməti (₼)</label>
                  <input type="number" value={adjustForm.unitCost ?? ''} onChange={e => setAdjustForm((f: any) => ({ ...f, unitCost: e.target.value }))}
                    placeholder="0.00" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-foreground-muted">Qeyd</label>
                <input value={adjustForm.note} onChange={e => setAdjustForm((f: any) => ({ ...f, note: e.target.value }))}
                  placeholder="İstəyə bağlı..." className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setAdjustForm(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface transition-colors">Ləğv et</button>
                <button
                  onClick={() => {
                    if (!adjustForm.quantity) return;
                    if (adjustForm.mode === 'raw') {
                      rawMovementMutation.mutate({ id: adjustForm.rawMaterialId, data: { type: adjustForm.type, quantity: Number(adjustForm.quantity), unitCost: adjustForm.unitCost ? Number(adjustForm.unitCost) : undefined, note: adjustForm.note || undefined } });
                    } else {
                      adjustMutation.mutate({ productId: adjustForm.productId, branchId, type: adjustForm.type, quantity: Number(adjustForm.quantity), unitCost: adjustForm.unitCost ? Number(adjustForm.unitCost) : undefined, note: adjustForm.note || undefined });
                    }
                  }}
                  disabled={!adjustForm.quantity || adjustMutation.isPending || rawMovementMutation.isPending}
                  className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
                  {adjustMutation.isPending || rawMovementMutation.isPending ? 'Yüklənir...' : 'Yadda saxla'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Xammal Yarat/Düzəlt Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {rawForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated shadow-2xl p-6 space-y-4">
              <h3 className="text-base font-semibold">{rawForm.id ? 'Xammal Düzəliş' : 'Yeni Xammal'}</h3>

              {[
                { key: 'nameAz', label: 'Ad (AZ) *', type: 'text' },
                { key: 'nameEn', label: 'Ad (EN)', type: 'text' },
                { key: 'category', label: 'Kateqoriya', type: 'text' },
                { key: 'unit', label: 'Ölçü vahidi (kg/litr/ədəd)', type: 'text' },
                { key: 'currentStock', label: 'Cari stok', type: 'number' },
                { key: 'minStock', label: 'Min stok (xəbərdarlıq)', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-foreground-muted">{f.label}</label>
                  <input type={f.type} value={(rawForm as any)[f.key]} onChange={e => setRawForm((form: any) => ({ ...form, [f.key]: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              ))}

              <div className="flex gap-3">
                <button onClick={() => setRawForm(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface transition-colors">Ləğv et</button>
                <button
                  onClick={() => rawCreateMutation.mutate({ ...rawForm, branchId, currentStock: Number(rawForm.currentStock), minStock: Number(rawForm.minStock) })}
                  disabled={!rawForm.nameAz || !rawForm.unit || rawCreateMutation.isPending}
                  className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
                  {rawCreateMutation.isPending ? 'Yüklənir...' : 'Yadda saxla'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
