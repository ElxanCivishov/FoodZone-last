import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Users, Plus, Search, Phone, Mail, Star,
  Calendar, CalendarClock, X, Edit2, Trash2,
  ShoppingBag, Heart, MessageSquare, ChevronRight,
  Gift, Crown, Cake,
} from 'lucide-react';
import api from '@/services/api';
import { useActiveBranch } from '../hooks/useActiveBranch';
import { SectionTitle } from '../components/SectionTitle';
import { AppSelect } from '../components/AppSelect';
import { cn } from '@/utils/cn';
import type {
  Customer, TableReservation, CustomerFeedback,
  CustomerFavorite, CustomerStats,
} from '@/types';

type ActiveTab = 'customers' | 'reservations' | 'feedback';

const PRESET_TAGS = ['VIP', 'Vegetarian', 'Vegan', 'Alerji var', 'Daimi müştəri', 'Doğum günü endirimi'];

const TAG_COLORS: Record<string, string> = {
  VIP: 'bg-warning-500/15 text-warning-700 border-warning-400/40',
  Vegetarian: 'bg-success-500/15 text-success-700 border-success-400/40',
  Vegan: 'bg-success-500/10 text-success-600 border-success-400/30',
  'Alerji var': 'bg-danger-500/15 text-danger-700 border-danger-400/40',
  'Daimi müştəri': 'bg-primary-500/15 text-primary-600 border-primary-400/40',
  'Doğum günü endirimi': 'bg-purple-500/15 text-purple-700 border-purple-400/40',
};

const tagColor = (tag: string) => TAG_COLORS[tag] ?? 'bg-foreground-muted/10 text-foreground-muted border-border';

const fmtDate = (s: string) => new Date(s).toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtMoney = (n: number) => `${n.toFixed(2)} ₼`;
const fmtShort = (s: string) => new Date(s).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

function isBirthdayToday(birthDate?: string) {
  if (!birthDate) return false;
  const bd = new Date(birthDate);
  const now = new Date();
  return bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate();
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn(sz, i <= rating ? 'text-warning-500 fill-warning-500' : 'text-foreground-muted/30')} />
      ))}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CustomersView() {
  const { activeBranch } = useActiveBranch();
  const branchId = activeBranch?.id;
  const qc = useQueryClient();

  const [tab, setTab] = useState<ActiveTab>('customers');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showResForm, setShowResForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState<Customer | null>(null);

  const { data: statsData } = useQuery<CustomerStats>({
    queryKey: ['customer-stats', branchId],
    queryFn: () => api.get(`/customers/stats?branchId=${branchId}`).then((r: any) => r.data),
    enabled: !!branchId,
  });

  const { data: rawCustomers, isLoading: custLoading } = useQuery({
    queryKey: ['customers', branchId, search, tagFilter],
    queryFn: () => api.get(`/customers?branchId=${branchId}${search ? `&search=${encodeURIComponent(search)}` : ''}&limit=60`),
    enabled: !!branchId && tab === 'customers',
  });
  const customers: Customer[] = (rawCustomers as any)?.data ?? [];

  const filteredCustomers = tagFilter
    ? customers.filter(c => c.tags?.includes(tagFilter))
    : customers;

  const { data: reservations = [], isLoading: resLoading } = useQuery<TableReservation[]>({
    queryKey: ['reservations', branchId],
    queryFn: () => api.get(`/reservations?branchId=${branchId}`).then((r: any) => r.data),
    enabled: !!branchId && tab === 'reservations',
  });

  const { data: todayRes = [] } = useQuery<TableReservation[]>({
    queryKey: ['reservations-today', branchId],
    queryFn: () => api.get(`/reservations/today?branchId=${branchId}`).then((r: any) => r.data),
    enabled: !!branchId && tab === 'reservations',
  });

  const { data: feedbackData } = useQuery({
    queryKey: ['feedback', branchId],
    queryFn: () => api.get(`/feedback?branchId=${branchId}&limit=50`).then((r: any) => r),
    enabled: !!branchId && tab === 'feedback',
  });

  const updateReservation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/reservations/${id}`, { status }),
    onSuccess: () => { toast.success('Yeniləndi'); qc.invalidateQueries({ queryKey: ['reservations'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta'),
  });

  const deleteCustomer = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      toast.success('Müştəri silindi');
      qc.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomer(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta'),
  });

  const deleteFeedback = useMutation({
    mutationFn: (id: string) => api.delete(`/feedback/${id}`),
    onSuccess: () => { toast.success('Rəy silindi'); qc.invalidateQueries({ queryKey: ['feedback'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta'),
  });

  const reservationStatus: Record<string, { label: string; color: string }> = {
    confirmed: { label: 'Təsdiqləndi', color: 'text-primary-500 bg-primary-500/10' },
    seated: { label: 'Oturdu', color: 'text-success-600 bg-success-500/10' },
    completed: { label: 'Tamamlandı', color: 'text-foreground-muted bg-foreground-muted/10' },
    cancelled: { label: 'Ləğv', color: 'text-danger-500 bg-danger-500/10' },
    no_show: { label: 'Gəlmədi', color: 'text-warning-600 bg-warning-500/10' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <SectionTitle title="Müştərilər & CRM" subtitle="Müştəri idarəetməsi, rezervasiyalar, rəylər" />
        <button
          onClick={() => { if (tab === 'customers') { setEditingCustomer(null); setShowForm(true); } else if (tab === 'reservations') setShowResForm(true); else if (tab === 'feedback') setShowFeedbackForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-sm font-medium text-white hover:bg-primary-600 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          {tab === 'customers' ? 'Müştəri' : tab === 'reservations' ? 'Rezervasiya' : 'Rəy'}
        </button>
      </div>

      {/* Stats */}
      {statsData && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Ümumi', value: statsData.total, icon: Users, color: 'text-primary-500', bg: 'bg-primary-500/10' },
            { label: 'VIP', value: statsData.vipCount, icon: Crown, color: 'text-warning-600', bg: 'bg-warning-500/10' },
            { label: 'Cəmi gəlir', value: fmtMoney(statsData.totalSpent), icon: ShoppingBag, color: 'text-success-600', bg: 'bg-success-500/10' },
            { label: 'Ort. xərc', value: fmtMoney(statsData.avgSpend), icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
            { label: 'Cəmi bal', value: statsData.totalPoints.toLocaleString(), icon: Star, color: 'text-warning-500', bg: 'bg-warning-500/10' },
            { label: 'Doğum günü', value: statsData.birthdayToday, icon: Cake, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          ].map(item => (
            <div key={item.label} className="rounded-2xl border border-border bg-surface-elevated p-3 flex flex-col gap-1.5">
              <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <p className={`text-lg font-bold leading-none ${item.color}`}>{item.value}</p>
              <p className="text-[11px] text-foreground-muted">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface-elevated p-1 w-fit">
        {([
          { id: 'customers', label: 'Müştərilər', icon: Users },
          { id: 'reservations', label: 'Rezervasiyalar', icon: CalendarClock },
          { id: 'feedback', label: 'Rəylər', icon: MessageSquare },
        ] as { id: ActiveTab; label: string; icon: typeof Users }[]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === id ? 'bg-primary-500 text-white' : 'text-foreground-muted hover:text-foreground')}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ─── Müştərilər tabı ─── */}
      {tab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol: siyahı */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Ad, telefon, email..."
                  className="w-full rounded-xl border border-border bg-surface-elevated pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            {/* Tag filter */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setTagFilter('')}
                className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  !tagFilter ? 'bg-primary-500 text-white border-primary-500' : 'border-border text-foreground-muted hover:text-foreground')}>
                Hamısı
              </button>
              {PRESET_TAGS.map(tag => (
                <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                  className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    tagFilter === tag ? tagColor(tag) + ' font-semibold' : 'border-border text-foreground-muted hover:text-foreground')}>
                  {tag}
                </button>
              ))}
            </div>

            {custLoading ? (
              <div className="text-center py-16 text-sm text-foreground-muted">Yüklənir...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-border bg-surface-elevated">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm text-foreground-muted">Müştəri tapılmadı</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
                <div className="divide-y divide-border">
                  {filteredCustomers.map(c => {
                    const isSelected = selectedCustomer?.id === c.id;
                    const birthday = isBirthdayToday(c.birthDate);
                    return (
                      <button key={c.id} onClick={() => setSelectedCustomer(isSelected ? null : c)}
                        className={cn('w-full flex items-center justify-between px-5 py-4 text-left transition-colors',
                          isSelected ? 'bg-primary-500/5' : 'hover:bg-surface')}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            'h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0',
                            birthday ? 'bg-purple-500/15 text-purple-600' : 'bg-primary-500/10 text-primary-500',
                          )}>
                            {birthday ? '🎂' : c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold">{c.name}</p>
                              {c.tags?.includes('VIP') && <Crown className="h-3.5 w-3.5 text-warning-500 shrink-0" />}
                              {birthday && <span className="text-[10px] font-semibold text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded-full">Doğum günü!</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {c.phone && <span className="text-xs text-foreground-muted flex items-center gap-0.5"><Phone className="h-3 w-3" />{c.phone}</span>}
                              {c.tags?.slice(0, 2).map(tag => (
                                <span key={tag} className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium', tagColor(tag))}>{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 ml-3">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-success-600">{fmtMoney(c.totalSpent)}</p>
                            <p className="text-xs text-foreground-muted">{c.totalOrders} sif.</p>
                          </div>
                          <div className="flex items-center gap-1 text-warning-500">
                            <Star className="h-3.5 w-3.5" />
                            <span className="text-sm font-semibold">{c.points}</span>
                          </div>
                          <ChevronRight className={cn('h-4 w-4 text-foreground-muted transition-transform', isSelected && 'rotate-90')} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sağ: Detail panel */}
          <div className="lg:col-span-1">
            {selectedCustomer ? (
              <CustomerDetail
                customer={selectedCustomer}
                onEdit={c => { setEditingCustomer(c); setShowForm(true); }}
                onPoints={c => setShowPointsModal(c)}
                onDelete={id => deleteCustomer.mutate(id)}
                onClose={() => setSelectedCustomer(null)}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-surface-elevated/50 flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-10 w-10 text-foreground-muted/30 mb-3" />
                <p className="text-sm text-foreground-muted">Müştərini seçin</p>
                <p className="text-xs text-foreground-muted/60 mt-1">Profil, tarixçə, rəylər</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Rezervasiyalar tabı ─── */}
      {tab === 'reservations' && (
        <div className="space-y-4">
          {todayRes.length > 0 && (
            <div className="rounded-2xl border border-primary-500/20 bg-primary-500/5 p-4">
              <h3 className="text-sm font-semibold text-primary-500 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Bu günün rezervasiyaları ({todayRes.length})
              </h3>
              <div className="space-y-2">
                {todayRes.map(r => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl bg-surface border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{r.customerName} · {r.partySize} nəfər</p>
                      <p className="text-xs text-foreground-muted">{fmtDate(r.dateTime)}{r.table && ` · Masa ${r.table.number}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', reservationStatus[r.status]?.color)}>
                        {reservationStatus[r.status]?.label}
                      </span>
                      {r.status === 'confirmed' && (
                        <button onClick={() => updateReservation.mutate({ id: r.id, status: 'seated' })}
                          className="text-xs px-2 py-1 rounded-lg bg-success-500/10 text-success-600 hover:bg-success-500/20 transition-colors">
                          Oturdu
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resLoading ? (
            <div className="text-center py-16 text-sm text-foreground-muted">Yüklənir...</div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-border bg-surface-elevated">
              <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm text-foreground-muted">Rezervasiya tapılmadı</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
              <div className="divide-y divide-border">
                {reservations.map(r => (
                  <div key={r.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium">{r.customerName}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-foreground-muted flex-wrap">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.partySize} nəfər</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(r.dateTime)}</span>
                        {r.table && <span>Masa {r.table.number}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', reservationStatus[r.status]?.color)}>
                        {reservationStatus[r.status]?.label}
                      </span>
                      {r.status === 'confirmed' && (
                        <TriggerSelect
                          onSelect={status => updateReservation.mutate({ id: r.id, status })}
                          options={[
                            { value: 'seated', label: 'Oturdu' },
                            { value: 'completed', label: 'Tamamlandı' },
                            { value: 'cancelled', label: 'Ləğv et' },
                            { value: 'no_show', label: 'Gəlmədi' },
                          ]}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Rəylər tabı ─── */}
      {tab === 'feedback' && (
        <div className="space-y-4">
          {feedbackData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 rounded-2xl border border-border bg-surface-elevated p-5 flex items-center gap-4">
                <div className="text-4xl font-black text-warning-500">{feedbackData.avgRating ?? '—'}</div>
                <div>
                  <StarRating rating={Math.round(Number(feedbackData.avgRating ?? 0))} size="lg" />
                  <p className="text-xs text-foreground-muted mt-1">{feedbackData.totalCount} rəy əsasında</p>
                </div>
              </div>
              {feedbackData.distribution?.slice().reverse().map((d: { rating: number; count: number }) => (
                <div key={d.rating} className="rounded-2xl border border-border bg-surface-elevated p-4 flex items-center gap-3">
                  <span className="text-sm font-bold w-4">{d.rating}</span>
                  <Star className="h-3.5 w-3.5 text-warning-500 fill-warning-500 shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full bg-warning-500 rounded-full" style={{ width: `${feedbackData.totalCount ? (d.count / feedbackData.totalCount) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-foreground-muted w-6 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
            {!feedbackData?.data?.length ? (
              <div className="text-center py-16">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm text-foreground-muted">Hələ rəy yoxdur</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(feedbackData.data as CustomerFeedback[]).map(fb => (
                  <div key={fb.id} className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-foreground-muted/10 flex items-center justify-center text-sm font-bold shrink-0">
                        {fb.customer?.name?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{fb.customer?.name ?? 'Anonim'}</p>
                          <StarRating rating={fb.rating} />
                          <span className="text-xs text-foreground-muted">{fmtShort(fb.createdAt)}</span>
                        </div>
                        {fb.comment && <p className="text-xs text-foreground-muted mt-1 leading-relaxed">{fb.comment}</p>}
                      </div>
                    </div>
                    <button onClick={() => deleteFeedback.mutate(fb.id)}
                      className="text-foreground-muted hover:text-danger-500 transition-colors shrink-0 p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Add/Edit Customer Modal ─── */}
      {showForm && (
        <CustomerFormModal
          customer={editingCustomer}
          branchId={branchId ?? ''}
          onClose={() => { setShowForm(false); setEditingCustomer(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['customers'] }); qc.invalidateQueries({ queryKey: ['customer-stats'] }); }}
        />
      )}

      {/* ─── Rezervasiya Modal ─── */}
      {showResForm && (
        <ReservationFormModal
          branchId={branchId ?? ''}
          onClose={() => setShowResForm(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['reservations'] }); qc.invalidateQueries({ queryKey: ['reservations-today'] }); }}
        />
      )}

      {/* ─── Feedback Modal ─── */}
      {showFeedbackForm && (
        <FeedbackFormModal
          branchId={branchId ?? ''}
          customers={customers}
          onClose={() => setShowFeedbackForm(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ['feedback'] })}
        />
      )}

      {/* ─── Points Modal ─── */}
      {showPointsModal && (
        <PointsModal
          customer={showPointsModal}
          onClose={() => setShowPointsModal(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ['customers'] })}
        />
      )}
    </div>
  );
}

// ─── Customer Detail Panel ─────────────────────────────────────────────────────

function CustomerDetail({
  customer, onEdit, onPoints, onDelete, onClose,
}: {
  customer: Customer;
  onEdit: (c: Customer) => void;
  onPoints: (c: Customer) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const { data: detail } = useQuery<Customer>({
    queryKey: ['customer-detail', customer.id],
    queryFn: () => api.get(`/customers/${customer.id}`).then((r: any) => r.data.data),
  });

  const { data: favorites = [] } = useQuery<CustomerFavorite[]>({
    queryKey: ['customer-favorites', customer.id],
    queryFn: () => api.get(`/customers/${customer.id}/favorites`).then((r: any) => r.data.data),
  });

  const { data: fbData } = useQuery({
    queryKey: ['customer-feedback', customer.id],
    queryFn: () => api.get(`/customers/${customer.id}/feedback`).then((r: any) => r.data),
  });

  const c = detail ?? customer;
  const birthday = isBirthdayToday(c.birthDate);

  return (
    <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-foreground-muted/5">
        <p className="text-sm font-semibold">Müştəri profili</p>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-foreground-muted/10">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-16rem)] p-4 space-y-4">
        {/* Identity */}
        <div className="flex items-start gap-3">
          <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0',
            birthday ? 'bg-purple-500/15 text-purple-600' : 'bg-primary-500/10 text-primary-500')}>
            {birthday ? '🎂' : c.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold">{c.name}</p>
              {c.tags?.includes('VIP') && <Crown className="h-4 w-4 text-warning-500" />}
              {birthday && <span className="text-[10px] bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded-full font-semibold">Doğum günü 🎉</span>}
            </div>
            {c.phone && <p className="text-xs text-foreground-muted flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{c.phone}</p>}
            {c.email && <p className="text-xs text-foreground-muted flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</p>}
          </div>
        </div>

        {/* Tags */}
        {c.tags?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {c.tags.map(tag => (
              <span key={tag} className={cn('text-[11px] px-2 py-0.5 rounded-full border font-medium', tagColor(tag))}>{tag}</span>
            ))}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Sifariş', value: c.totalOrders, color: 'text-foreground' },
            { label: 'Xərc', value: fmtMoney(c.totalSpent), color: 'text-success-600' },
            { label: 'Bal', value: c.points, color: 'text-warning-600' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-surface p-3 text-center">
              <p className={cn('text-base font-bold', s.color)}>{s.value}</p>
              <p className="text-[10px] text-foreground-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Avg feedback */}
        {fbData?.avgRating && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-surface">
            <MessageSquare className="h-4 w-4 text-foreground-muted shrink-0" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-warning-600">{fbData.avgRating}</span>
              <StarRating rating={Math.round(Number(fbData.avgRating))} />
              <span className="text-xs text-foreground-muted">({fbData.data?.length ?? 0} rəy)</span>
            </div>
          </div>
        )}

        {/* Notes */}
        {c.notes && (
          <div className="px-3 py-2.5 rounded-xl border border-border bg-surface text-xs text-foreground-muted leading-relaxed">
            {c.notes}
          </div>
        )}

        {/* Birthday */}
        {c.birthDate && (
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Gift className="h-3.5 w-3.5" />
            Doğum günü: {fmtShort(c.birthDate)}
          </div>
        )}

        {/* Favorites */}
        {favorites.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" /> Sevimli məhsullar
            </p>
            <div className="space-y-1.5">
              {favorites.slice(0, 4).map(fav => (
                <div key={fav.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                  <p className="text-xs font-medium truncate">{fav.nameAz ?? fav.name}</p>
                  <span className="text-[10px] text-foreground-muted shrink-0 ml-2">{fav.orderCount}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order history */}
        {c.orders && c.orders.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" /> Son sifarişlər
            </p>
            <div className="space-y-1.5">
              {c.orders.slice(0, 5).map(o => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
                  <div>
                    <p className="text-xs font-medium">#{o.orderNumber}</p>
                    <p className="text-[10px] text-foreground-muted">{fmtShort(o.createdAt)}</p>
                  </div>
                  <span className="text-xs font-semibold text-success-600">{fmtMoney(o.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1 border-t border-border">
          <button onClick={() => onPoints(c)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-warning-500/40 text-warning-600 text-sm font-medium hover:bg-warning-500/5 transition-colors">
            <Star className="h-4 w-4" /> Bal idarəet
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onEdit(c)}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-surface transition-colors">
              <Edit2 className="h-3.5 w-3.5" /> Redaktə
            </button>
            <button onClick={() => { if (confirm(`${c.name} silinsin?`)) onDelete(c.id); }}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-danger-500/40 text-danger-500 text-sm font-medium hover:bg-danger-500/5 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Customer Form Modal ───────────────────────────────────────────────────────

function CustomerFormModal({
  customer, branchId, onClose, onSaved,
}: {
  customer: Customer | null;
  branchId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: customer?.name ?? '',
    phone: customer?.phone ?? '',
    email: customer?.email ?? '',
    notes: customer?.notes ?? '',
    birthDate: customer?.birthDate ? customer.birthDate.slice(0, 10) : '',
    tags: customer?.tags ?? [] as string[],
  });

  const saveMutation = useMutation({
    mutationFn: () => customer
      ? api.patch(`/customers/${customer.id}`, { ...form, birthDate: form.birthDate || null })
      : api.post('/customers', { branchId, ...form, birthDate: form.birthDate || null }),
    onSuccess: () => { toast.success(customer ? 'Yeniləndi' : 'Müştəri əlavə edildi'); onSaved(); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });

  const toggleTag = (tag: string) =>
    setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold">{customer ? 'Müştəri redaktə' : 'Yeni müştəri'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-foreground-muted/10"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {[
            { key: 'name', label: 'Ad *', placeholder: 'Müştəri adı' },
            { key: 'phone', label: 'Telefon', placeholder: '+994...' },
            { key: 'email', label: 'Email', placeholder: 'email@example.com' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-foreground-muted">{f.label}</label>
              <input value={form[f.key as keyof typeof form] as string}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          ))}

          <div>
            <label className="text-xs font-medium text-foreground-muted">Doğum tarixi</label>
            <input type="date" value={form.birthDate}
              onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground-muted">Qeyd / tərcihlər</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2} placeholder="Alerji, tercihlər..."
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground-muted mb-2 block">Teqlər</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={cn('px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    form.tags.includes(tag) ? tagColor(tag) : 'border-border text-foreground-muted hover:text-foreground')}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5 pt-3 border-t border-border">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface transition-colors">Ləğv</button>
          <button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}
            className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
            {saveMutation.isPending ? 'Saxlanılır...' : 'Saxla'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Points Modal ─────────────────────────────────────────────────────────────

function PointsModal({ customer, onClose, onSaved }: { customer: Customer; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<'add' | 'remove'>('add');

  const pointsMutation = useMutation({
    mutationFn: () => api.post(`/customers/${customer.id}/points`, {
      amount: mode === 'add' ? Number(amount) : -Number(amount),
      reason,
    }),
    onSuccess: (r: any) => {
      toast.success(r.data.message);
      onSaved();
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2"><Star className="h-4 w-4 text-warning-500" /> Bal idarəetməsi</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-foreground-muted/10"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3">
          <div className="h-10 w-10 rounded-xl bg-warning-500/10 flex items-center justify-center text-sm font-bold text-warning-600">{customer.name.charAt(0)}</div>
          <div>
            <p className="text-sm font-medium">{customer.name}</p>
            <p className="text-xs text-foreground-muted flex items-center gap-1"><Star className="h-3 w-3 text-warning-500" /> {customer.points} bal</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(['add', 'remove'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={cn('py-2.5 rounded-xl text-sm font-medium border transition-colors',
                mode === m
                  ? m === 'add' ? 'bg-success-500 text-white border-success-500' : 'bg-danger-500 text-white border-danger-500'
                  : 'border-border text-foreground-muted hover:text-foreground')}>
              {m === 'add' ? '+ Əlavə et' : '− Çıxar'}
            </button>
          ))}
        </div>

        <div>
          <label className="text-xs font-medium text-foreground-muted">Bal miqdarı *</label>
          <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="10"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground-muted">Səbəb</label>
          <input value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Doğum günü bonusu..."
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface transition-colors">Ləğv</button>
          <button onClick={() => pointsMutation.mutate()} disabled={!amount || pointsMutation.isPending}
            className={cn('flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50',
              mode === 'add' ? 'bg-success-500 hover:bg-success-600' : 'bg-danger-500 hover:bg-danger-600')}>
            {pointsMutation.isPending ? 'Saxlanılır...' : mode === 'add' ? 'Əlavə et' : 'Çıxar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reservation Form Modal ────────────────────────────────────────────────────

function ReservationFormModal({ branchId, onClose, onSaved }: { branchId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ customerName: '', phone: '', partySize: '', dateTime: '', notes: '' });

  const createMutation = useMutation({
    mutationFn: () => api.post('/reservations', {
      branchId,
      customerName: form.customerName,
      phone: form.phone,
      partySize: Number(form.partySize),
      dateTime: form.dateTime,
      notes: form.notes || undefined,
    }),
    onSuccess: () => { toast.success('Rezervasiya əlavə edildi'); onSaved(); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Yeni rezervasiya</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-foreground-muted/10"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-foreground-muted">Müştəri adı *</label>
            <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
              placeholder="Ad Soyad"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground-muted">Telefon *</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+994..."
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground-muted">Nəfər *</label>
            <input type="number" value={form.partySize} onChange={e => setForm(f => ({ ...f, partySize: e.target.value }))}
              placeholder="2"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-foreground-muted">Tarix & Saat *</label>
            <input type="datetime-local" value={form.dateTime} onChange={e => setForm(f => ({ ...f, dateTime: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-foreground-muted">Qeyd</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Xüsusi istəklər..."
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface transition-colors">Ləğv</button>
          <button onClick={() => createMutation.mutate()}
            disabled={!form.customerName || !form.phone || !form.partySize || !form.dateTime || createMutation.isPending}
            className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
            {createMutation.isPending ? 'Əlavə edilir...' : 'Əlavə et'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Feedback Form Modal ──────────────────────────────────────────────────────

function FeedbackFormModal({
  branchId, customers, onClose, onSaved,
}: {
  branchId: string;
  customers: Customer[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [customerId, setCustomerId] = useState('');

  const createMutation = useMutation({
    mutationFn: () => api.post('/feedback', {
      branchId,
      rating,
      comment: comment.trim() || undefined,
      customerId: customerId || undefined,
    }),
    onSuccess: () => { toast.success('Rəy əlavə edildi'); onSaved(); onClose(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xəta baş verdi'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary-500" /> Yeni rəy
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-foreground-muted/10"><X className="h-4 w-4" /></button>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground-muted">Qiymət *</label>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} type="button"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(i)}
                className="transition-transform hover:scale-110">
                <Star className={cn('h-8 w-8', (hovered || rating) >= i
                  ? 'text-warning-500 fill-warning-500'
                  : 'text-foreground-muted/30')} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground-muted">Müştəri (ixtiyari)</label>
          <AppSelect
            value={customerId}
            onChange={setCustomerId}
            placeholder="Anonim"
            options={customers.map(c => ({ value: c.id, label: c.name + (c.phone ? ` · ${c.phone}` : '') }))}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground-muted">Şərh</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            rows={3} placeholder="Müştərinin rəyi..."
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface transition-colors">Ləğv</button>
          <button onClick={() => createMutation.mutate()} disabled={!rating || createMutation.isPending}
            className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
            {createMutation.isPending ? 'Əlavə edilir...' : 'Əlavə et'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Trigger Select ────────────────────────────────────────────────────────────

function TriggerSelect({ onSelect, options }: { onSelect: (v: string) => void; options: { value: string; label: string }[] }) {
  const [val, setVal] = useState('');
  return (
    <div className="w-32">
      <AppSelect value={val} placeholder="Dəyiş" options={options} onChange={v => { onSelect(v); setVal(''); }} />
    </div>
  );
}
