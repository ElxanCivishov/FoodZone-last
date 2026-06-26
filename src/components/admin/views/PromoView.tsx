import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Tag, Plus, Trash2, CheckCircle, XCircle, Clock, AlertTriangle,
  TrendingDown, ShoppingBag, BarChart2, User, ChevronDown, ChevronUp,
  type LucideIcon,
} from 'lucide-react';
import api from '@/services/api';
import { useActiveBranch } from '../hooks/useActiveBranch';
import { SectionTitle } from '../components/SectionTitle';
import { AppSelect } from '../components/AppSelect';
import type { PromoCode, PromoStats, Customer, Product } from '@/types';

const DAY_LABELS = ['Bazar', 'B.ertəsi', 'Ç.axşamı', 'Çərşənbə', 'C.axşamı', 'Cümə', 'Şənbə'];

interface PromoForm {
  code: string;
  description: string;
  type: 'percent' | 'fixed';
  value: string;
  minOrderAmount: string;
  maxUses: string;
  validFrom: string;
  validTo: string;
  customerId: string;
  applicableItems: string[];
  happyHourStart: string;
  happyHourEnd: string;
  daysOfWeek: number[];
}

const defaultForm: PromoForm = {
  code: '', description: '', type: 'percent', value: '',
  minOrderAmount: '', maxUses: '', validFrom: '', validTo: '',
  customerId: '', applicableItems: [], happyHourStart: '', happyHourEnd: '', daysOfWeek: [],
};

export function PromoView() {
  const { activeBranch } = useActiveBranch();
  const branchId = activeBranch?.id;
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PromoForm>(defaultForm);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: promos = [], isLoading } = useQuery<PromoCode[]>({
    queryKey: ['promos', branchId],
    queryFn: () => api.get(`/promo?branchId=${branchId}`).then((r: any) => r.data),
    enabled: !!branchId,
  });

  const { data: stats } = useQuery<PromoStats>({
    queryKey: ['promo-stats', branchId],
    queryFn: () => api.get(`/promo/stats?branchId=${branchId}`).then((r: any) => r.data),
    enabled: !!branchId,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers', branchId],
    queryFn: () => api.get(`/customers?branchId=${branchId}&limit=200`).then((r: any) => r.data),
    enabled: !!branchId && showForm,
  });

  const { data: allProducts = [] } = useQuery<(Product & { category: { id: string; nameAz: string } })[]>({
    queryKey: ['branch-products', branchId],
    queryFn: () => api.get(`/menu/${branchId}/products`).then((r: any) => r.data),
    enabled: !!branchId && showForm && showAdvanced,
  });

  const productsByCategory = allProducts.reduce<Record<string, { nameAz: string; products: typeof allProducts }>>((acc, p) => {
    const catId = p.category?.id ?? 'other';
    const catName = p.category?.nameAz ?? 'Digər';
    if (!acc[catId]) acc[catId] = { nameAz: catName, products: [] };
    acc[catId].products.push(p);
    return acc;
  }, {});

  const createMutation = useMutation({
    mutationFn: () => api.post('/promo', {
      branchId,
      code: form.code,
      description: form.description || undefined,
      type: form.type,
      value: Number(form.value),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
      maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      validFrom: form.validFrom,
      validTo: form.validTo,
      customerId: form.customerId || undefined,
      applicableItems: form.applicableItems,
      happyHourStart: form.happyHourStart || undefined,
      happyHourEnd: form.happyHourEnd || undefined,
      daysOfWeek: form.daysOfWeek,
    }),
    onSuccess: () => {
      toast.success('Promo kod yaradıldı');
      qc.invalidateQueries({ queryKey: ['promos'] });
      qc.invalidateQueries({ queryKey: ['promo-stats'] });
      setShowForm(false); setForm(defaultForm); setShowAdvanced(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/promo/${id}`, { status }),
    onSuccess: () => { toast.success('Yeniləndi'); qc.invalidateQueries({ queryKey: ['promos'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/promo/${id}`),
    onSuccess: () => {
      toast.success('Silindi');
      qc.invalidateQueries({ queryKey: ['promos'] });
      qc.invalidateQueries({ queryKey: ['promo-stats'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });

  const statusBadge = (p: PromoCode) => {
    if (p.isExpired) return { label: 'Bitmişdir', icon: Clock, color: 'text-foreground-muted bg-foreground-muted/10' };
    if (p.isMaxed) return { label: 'Limitdədir', icon: AlertTriangle, color: 'text-warning-600 bg-warning-500/10' };
    if (p.status === 'inactive') return { label: 'Deaktiv', icon: XCircle, color: 'text-danger-500 bg-danger-500/10' };
    return { label: 'Aktiv', icon: CheckCircle, color: 'text-success-600 bg-success-500/10' };
  };

  const fmtDate = (s: string) => new Date(s).toLocaleDateString('az-AZ');
  const fmtAz = (n: number) => n.toFixed(2);

  const toggleDay = (day: number) => {
    setForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter(d => d !== day)
        : [...f.daysOfWeek, day],
    }));
  };

  const toggleProduct = (id: string) => {
    setForm(f => ({
      ...f,
      applicableItems: f.applicableItems.includes(id)
        ? f.applicableItems.filter(i => i !== id)
        : [...f.applicableItems, id],
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <SectionTitle title="Endirim & Promo Kodlar" subtitle="Aksiya və endirim idarəetməsi" />
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-sm font-medium text-white hover:bg-primary-600 transition-colors">
          <Plus className="h-4 w-4" /> Yeni Kod
        </button>
      </div>

      {/* ── Statistika ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Tag}
            label="Aktiv kodlar"
            value={String(stats.activeCount)}
            color="text-primary-500"
            bg="bg-primary-500/10"
          />
          <StatCard
            icon={TrendingDown}
            label="Bu ay endirim"
            value={`${fmtAz(stats.monthDiscountGiven)} ₼`}
            color="text-success-600"
            bg="bg-success-500/10"
          />
          <StatCard
            icon={ShoppingBag}
            label="Bu ay sifariş"
            value={String(stats.monthOrdersWithPromo)}
            color="text-warning-600"
            bg="bg-warning-500/10"
          />
          <StatCard
            icon={BarChart2}
            label="Ümumi endirim"
            value={`${fmtAz(stats.totalDiscountGiven)} ₼`}
            color="text-foreground-muted"
            bg="bg-foreground-muted/10"
          />
        </div>
      )}

      {/* ── Top kodlar ── */}
      {stats && stats.topCodes.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface-elevated p-5">
          <p className="text-sm font-semibold mb-3">Ən çox istifadə olunan kodlar</p>
          <div className="space-y-2">
            {stats.topCodes.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-foreground-muted w-4">{i + 1}.</span>
                  <span className="font-mono font-semibold">{c.code}</span>
                  {c.description && <span className="text-foreground-muted text-xs">{c.description}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-primary-500 font-medium">
                    {c.type === 'percent' ? `${c.value}%` : `${c.value} ₼`}
                  </span>
                  <span className="text-xs text-foreground-muted">{c.usedCount} istifadə</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Kod siyahısı ── */}
      {isLoading ? (
        <div className="text-center py-20 text-sm text-foreground-muted">Yüklənir...</div>
      ) : promos.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-border bg-surface-elevated">
          <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm text-foreground-muted">Promo kod tapılmadı</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-primary-500 hover:underline">İlk kodu yarat</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promos.map(p => {
            const badge = statusBadge(p);
            const BadgeIcon = badge.icon;
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-surface-elevated p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl font-bold tracking-wide">{p.code}</span>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                        <BadgeIcon className="h-3 w-3" /> {badge.label}
                      </span>
                    </div>
                    {p.description && <p className="text-sm text-foreground-muted mt-0.5">{p.description}</p>}
                    {p.customer && (
                      <p className="flex items-center gap-1 text-xs text-primary-500 mt-1">
                        <User className="h-3 w-3" /> {p.customer.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-500">
                      {p.type === 'percent' ? `${p.value}%` : `${p.value} ₼`}
                    </p>
                    <p className="text-xs text-foreground-muted">{p.type === 'percent' ? 'Faizli endirim' : 'Sabit endirim'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-lg bg-surface border border-border p-2">
                    <p className="font-semibold">{p.usedCount}{p.maxUses ? `/${p.maxUses}` : ''}</p>
                    <p className="text-foreground-muted">İstifadə</p>
                  </div>
                  <div className="rounded-lg bg-surface border border-border p-2">
                    <p className="font-semibold">{fmtDate(p.validFrom)}</p>
                    <p className="text-foreground-muted">Başlayır</p>
                  </div>
                  <div className="rounded-lg bg-surface border border-border p-2">
                    <p className="font-semibold">{fmtDate(p.validTo)}</p>
                    <p className="text-foreground-muted">Bitir</p>
                  </div>
                </div>

                {/* Meta məlumatlar */}
                <div className="space-y-1">
                  {p.minOrderAmount && (
                    <p className="text-xs text-foreground-muted">Min sifariş: {p.minOrderAmount} ₼</p>
                  )}
                  {p.happyHourStart && p.happyHourEnd && (
                    <p className="text-xs text-foreground-muted">Happy Hour: {p.happyHourStart} – {p.happyHourEnd}</p>
                  )}
                  {p.daysOfWeek.length > 0 && (
                    <p className="text-xs text-foreground-muted">
                      Günlər: {p.daysOfWeek.map(d => DAY_LABELS[d]).join(', ')}
                    </p>
                  )}
                  {p.applicableItems.length > 0 && (
                    <p className="text-xs text-foreground-muted">{p.applicableItems.length} məhsula tətbiq olunur</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleMutation.mutate({ id: p.id, status: p.status === 'active' ? 'inactive' : 'active' })}
                    disabled={p.isExpired || toggleMutation.isPending}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 ${p.status === 'active' ? 'bg-foreground-muted/10 text-foreground-muted hover:bg-foreground-muted/20' : 'bg-success-500/10 text-success-600 hover:bg-success-500/20'}`}>
                    {p.status === 'active' ? 'Deaktiv et' : 'Aktiv et'}
                  </button>
                  <button onClick={() => deleteMutation.mutate(p.id)}
                    className="p-2 rounded-xl text-danger-500 hover:bg-danger-500/10 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Yeni Kod Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface-elevated shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold">Yeni Promo Kod</h3>

            {/* Əsas sahələr */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-foreground-muted">Kod *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="YAYENDIRIM"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-foreground-muted">Açıqlama</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Yay sezonu endirimi"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground-muted">Növ</label>
                <div className="mt-1">
                  <AppSelect
                    value={form.type}
                    onChange={v => setForm(f => ({ ...f, type: v as 'percent' | 'fixed' }))}
                    options={[
                      { value: 'percent', label: 'Faizli (%)' },
                      { value: 'fixed', label: 'Sabit (₼)' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground-muted">Dəyər *</label>
                <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === 'percent' ? '10' : '5.00'}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground-muted">Min sifariş (₼)</label>
                <input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                  placeholder="Yoxdur"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground-muted">Max istifadə</label>
                <input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                  placeholder="Sınırsız"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground-muted">Başlama tarixi *</label>
                <input type="datetime-local" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground-muted">Bitmə tarixi *</label>
                <input type="datetime-local" value={form.validTo} onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            {/* Ətraflı parametrlər */}
            <div className="border border-border rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-surface hover:bg-surface-elevated transition-colors">
                Ətraflı parametrlər
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showAdvanced && (
                <div className="p-4 space-y-5 border-t border-border">
                  {/* Şəxsi müştəri */}
                  <div>
                    <label className="text-xs font-medium text-foreground-muted flex items-center gap-1">
                      <User className="h-3 w-3" /> Şəxsi müştəri (CRM)
                    </label>
                    <div className="mt-1">
                      <AppSelect
                        value={form.customerId}
                        onChange={v => setForm(f => ({ ...f, customerId: v }))}
                        options={[
                          { value: '', label: 'Hamı üçün (şəxsi deyil)' },
                          ...customers.map(c => ({
                            value: c.id,
                            label: `${c.name}${c.phone ? ` — ${c.phone}` : ''}`,
                          })),
                        ]}
                      />
                    </div>
                  </div>

                  {/* Happy Hour */}
                  <div>
                    <label className="text-xs font-medium text-foreground-muted">Happy Hour (saat aralığı)</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input type="time" value={form.happyHourStart}
                        onChange={e => setForm(f => ({ ...f, happyHourStart: e.target.value }))}
                        className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                      <span className="text-foreground-muted text-sm">–</span>
                      <input type="time" value={form.happyHourEnd}
                        onChange={e => setForm(f => ({ ...f, happyHourEnd: e.target.value }))}
                        className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>

                  {/* Həftənin günləri */}
                  <div>
                    <label className="text-xs font-medium text-foreground-muted">Həftənin günləri (boş = hər gün)</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {DAY_LABELS.map((label, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.daysOfWeek.includes(i)
                            ? 'bg-primary-500 border-primary-500 text-white'
                            : 'border-border text-foreground-muted hover:border-primary-500/40'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tətbiq olunan məhsullar */}
                  <div>
                    <label className="text-xs font-medium text-foreground-muted">
                      Tətbiq olunan məhsullar (boş = hamısına)
                    </label>
                    {allProducts.length === 0 ? (
                      <p className="mt-2 text-xs text-foreground-muted">Məhsullar yüklənir...</p>
                    ) : (
                      <div className="mt-2 max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                        {Object.entries(productsByCategory).map(([catId, cat]) => (
                          <div key={catId}>
                            <p className="px-3 py-1.5 text-xs font-semibold text-foreground-muted bg-surface sticky top-0">{cat.nameAz}</p>
                            {cat.products.map(prod => (
                              <label key={prod.id}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-surface cursor-pointer">
                                <input type="checkbox"
                                  checked={form.applicableItems.includes(prod.id)}
                                  onChange={() => toggleProduct(prod.id)}
                                  className="rounded border-border text-primary-500 focus:ring-primary-500" />
                                <span className="text-sm flex-1">{prod.nameAz}</span>
                                <span className="text-xs text-foreground-muted">{prod.price} ₼</span>
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                    {form.applicableItems.length > 0 && (
                      <p className="mt-1 text-xs text-primary-500">{form.applicableItems.length} məhsul seçildi</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowForm(false); setForm(defaultForm); setShowAdvanced(false); }}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface transition-colors">
                Ləğv et
              </button>
              <button onClick={() => createMutation.mutate()}
                disabled={!form.code || !form.value || !form.validFrom || !form.validTo || createMutation.isPending}
                className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
                {createMutation.isPending ? 'Yaradılır...' : 'Yarat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color, bg,
}: {
  icon: LucideIcon; label: string; value: string; color: string; bg: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-foreground-muted">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
