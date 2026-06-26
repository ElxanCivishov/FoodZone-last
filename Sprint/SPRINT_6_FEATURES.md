# Sprint 6 — Rezervasiya UI + Loyalty + KDS Advanced

**Məqsəd:** Mövcud backend modelləri üçün frontend UI-lar, sadiq müştəri proqramı, mətbəx ekranı yeniləməsi.  
**Ön şərt:** Sprint 1 tamamlanmış olmalıdır.

---

## Cari Vəziyyət

**Mövcud olan:**

- `TableReservation` Prisma modeli — tam strukturu var
- `Customer` + `CustomerFeedback` modeli — var
- `Reward` modeli — var
- `server/src/routes/reservations.ts` — API mövcuddur
- `server/src/routes/customers.ts` — API mövcuddur
- `server/src/routes/feedback.ts` — API mövcuddur
- `src/components/admin/views/CustomersView.tsx` — var
- `src/components/customer/RewardsScreen.tsx` — var (lakin sadə)
- `KitchenPanel.tsx` + `KanbanColumn.tsx` + `OrderCard.tsx` — mövcuddur

**Mövcud olmayan:**

- Admin reservasiya UI (calendar/list görünüşü)
- Müştəri səviyyəsində loyalty points real hesablama
- Checkout-da loyalty points istifadəsi
- Advanced KDS (item-level status, bump bar, stat panel)
- Post-order feedback UI (müştəri tərəfi)
- Modifier Group UI (menu idarəetməsi)

---

## BÖLMƏ A — Rezervasiya UI

### Tapşırıq A1 — `ReservationView.tsx` yaradılması

**Yeni fayl:** `src/components/admin/views/ReservationView.tsx`

```tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Users, Phone, Plus, Check, X } from "lucide-react";
import { format, isSameDay, addDays } from "date-fns";
import api from "@/services/api";
import { useActiveBranch } from "../hooks/useActiveBranch";
import type { TableReservation } from "@/types";

type ViewMode = "list" | "calendar";

const STATUS_CONFIG = {
  confirmed: {
    label: "Təsdiqlənib",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  },
  seated: {
    label: "Oturdulub",
    color: "bg-success-500/20 text-success-600 border-success-500/30",
  },
  completed: {
    label: "Tamamlandı",
    color: "bg-foreground-muted/20 text-foreground-muted border-border",
  },
  cancelled: {
    label: "Ləğv edildi",
    color: "bg-danger-500/20 text-danger-500 border-danger-500/30",
  },
  no_show: {
    label: "Gəlmədi",
    color: "bg-orange-500/20 text-orange-600 border-orange-500/30",
  },
};

export function ReservationView() {
  const { activeBranch } = useActiveBranch();
  const branchId = activeBranch?.id;
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: reservations = [] } = useQuery<TableReservation[]>({
    queryKey: ["reservations", branchId, format(selectedDate, "yyyy-MM-dd")],
    queryFn: () =>
      api
        .get(
          `/reservations?branchId=${branchId}&date=${format(selectedDate, "yyyy-MM-dd")}`,
        )
        .then((r: any) => r.data.data),
    enabled: !!branchId,
    refetchInterval: 60000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/reservations/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });

  // Tarix seçici — 7 günlük sürüşdürülən panel
  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rezervasiyalar</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Yeni rezervasiya
        </button>
      </div>

      {/* Tarix sürüşdürməsi */}
      <div className="flex gap-2 overflow-x-auto scroll-hide pb-1">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const count = reservations.filter((r) =>
            isSameDay(new Date(r.dateTime), day),
          ).length;
          return (
            <motion.button
              key={day.toISOString()}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all min-w-[52px]",
                isSelected
                  ? "bg-primary-500 text-white border-primary-500"
                  : "bg-surface-elevated border-border hover:border-primary-500",
              )}
            >
              <span className="text-[10px] font-medium opacity-75">
                {format(day, "EEE", { locale: undefined })}
              </span>
              <span className="text-lg font-bold leading-none">
                {format(day, "d")}
              </span>
              {count > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center",
                    isSelected ? "bg-white/20" : "bg-primary-500 text-white",
                  )}
                >
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Rezervasiya kartları */}
      <AnimatePresence>
        {reservations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-foreground-muted"
          >
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Bu gün üçün rezervasiya yoxdur</p>
          </motion.div>
        ) : (
          <motion.div className="space-y-3">
            {reservations
              .sort(
                (a, b) =>
                  new Date(a.dateTime).getTime() -
                  new Date(b.dateTime).getTime(),
              )
              .map((res) => (
                <motion.div
                  key={res.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-surface-elevated rounded-2xl border border-border p-4 card-lift"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Zaman */}
                      <div className="flex flex-col items-center bg-primary-500/10 rounded-xl p-2 min-w-[52px]">
                        <Clock className="w-4 h-4 text-primary-500 mb-1" />
                        <span className="text-sm font-bold text-primary-500">
                          {format(new Date(res.dateTime), "HH:mm")}
                        </span>
                      </div>

                      {/* Info */}
                      <div>
                        <p className="font-bold">{res.customerName}</p>
                        <div className="flex items-center gap-3 text-sm text-foreground-muted mt-0.5">
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
                          <p className="text-xs text-foreground-muted mt-1 italic">
                            {res.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-1 rounded-full border",
                          STATUS_CONFIG[res.status]?.color,
                        )}
                      >
                        {STATUS_CONFIG[res.status]?.label}
                      </span>

                      {res.status === "confirmed" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              updateStatus.mutate({
                                id: res.id,
                                status: "seated",
                              })
                            }
                            className="p-1.5 rounded-lg bg-success-500/10 text-success-600 hover:bg-success-500/20 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              updateStatus.mutate({
                                id: res.id,
                                status: "cancelled",
                              })
                            }
                            className="p-1.5 rounded-lg bg-danger-500/10 text-danger-500 hover:bg-danger-500/20 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal — aşağıda Tapşırıq A2 */}
    </div>
  );
}
```

### Tapşırıq A2 — Rezervasiya Yaratma Modal

```tsx
// ReservationView.tsx içinə əlavə et:

function CreateReservationModal({ isOpen, onClose, branchId }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    partySize: 2,
    dateTime: "",
    duration: 90,
    notes: "",
    tableId: "",
  });

  const { data: tables } = useQuery({
    queryKey: ["tables", branchId],
    queryFn: () =>
      api.get(`/branches/${branchId}/tables`).then((r) => r.data.data),
    enabled: !!branchId && isOpen,
  });

  const create = useMutation({
    mutationFn: () => api.post("/reservations", { ...form, branchId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      onClose();
    },
  });

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
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <h3 className="text-lg font-bold">Yeni Rezervasiya</h3>

            {/* Form fields — standard input-lar */}
            <input
              placeholder="Ad Soyad"
              value={form.customerName}
              onChange={(e) =>
                setForm((p) => ({ ...p, customerName: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:border-primary-500"
            />

            <input
              placeholder="Telefon"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:border-primary-500"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="datetime-local"
                value={form.dateTime}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dateTime: e.target.value }))
                }
                className="px-4 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:border-primary-500"
              />
              <input
                type="number"
                placeholder="Nəfər sayı"
                min={1}
                value={form.partySize}
                onChange={(e) =>
                  setForm((p) => ({ ...p, partySize: Number(e.target.value) }))
                }
                className="px-4 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:border-primary-500"
              />
            </div>

            <select
              value={form.tableId}
              onChange={(e) =>
                setForm((p) => ({ ...p, tableId: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:border-primary-500"
            >
              <option value="">Masa seçilməyib</option>
              {tables?.map((t: any) => (
                <option key={t.id} value={t.id}>
                  Masa {t.number}
                </option>
              ))}
            </select>

            <textarea
              placeholder="Qeyd..."
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface-elevated focus:outline-none focus:border-primary-500 resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-border rounded-2xl font-medium"
              >
                Ləğv et
              </button>
              <button
                onClick={() => create.mutate()}
                disabled={create.isPending}
                className="flex-1 py-3 btn-primary rounded-2xl font-medium"
              >
                {create.isPending ? "Saxlanılır..." : "Saxla"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Tapşırıq A3 — Navigation-a əlavə et

**Fayl:** `src/components/admin/navigation.ts`

```typescript
import { CalendarCheck } from 'lucide-react';
// operations section-a əlavə et:
{ id: 'reservations', label: 'admin.reservations', icon: CalendarCheck },
```

**Fayl:** `src/components/admin/AdminApp.tsx`

```typescript
import { ReservationView } from './views/ReservationView';
// Routes-a əlavə et:
<Route path="reservations" element={<ReservationView />} />
```

**Fayl:** `src/i18n/az.json` — `"reservations": "Rezervasiyalar"` əlavə et.

---

## BÖLMƏ B — Loyalty Points

### Tapşırıq B1 — Points Hesablama (Checkout)

**Fayl:** `server/src/routes/orders.ts`  
**Dəyişiklik:** Sifariş `paid` olduqda loyalty points qazandır.

```typescript
// Order ödənildiyi zaman (paymentStatus="paid" update handler-ında):
async function awardLoyaltyPoints(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order?.customerId) return;

    // 1 ₼ = 1 point
    const pointsEarned = Math.floor(order.total);

    await prisma.customer.update({
      where: { id: order.customerId },
      data: {
        points: { increment: pointsEarned },
        totalSpent: { increment: order.total },
        totalOrders: { increment: 1 },
        lastVisit: new Date(),
      },
    });
  } catch {
    /* silent */
  }
}
```

### Tapşırıq B2 — Points Redemption (Checkout)

**Fayl:** `server/src/routes/orders.ts`  
**Dəyişiklik:** Sifariş yaradılarkən `redeemPoints` parametri qəbul et.

```typescript
// createOrderSchema-ya əlavə et:
// redeemPoints: z.number().optional()

// Order yaradılarkən:
if (body.redeemPoints && body.customerId) {
  const customer = await prisma.customer.findUnique({
    where: { id: body.customerId },
  });
  if (customer && customer.points >= body.redeemPoints) {
    const pointDiscount = body.redeemPoints * 0.01; // 100 point = 1 ₼
    discount += pointDiscount;
    await prisma.customer.update({
      where: { id: body.customerId },
      data: { points: { decrement: body.redeemPoints } },
    });
  }
}
```

### Tapşırıq B3 — `RewardsScreen.tsx` Yeniləmə

**Fayl:** `src/components/customer/RewardsScreen.tsx`  
**Dəyişiklik:** Mövcud sadə ekranı genişləndir.

```tsx
// Yeniləmələr:
// 1. Müştərinin point balansını göstər
// 2. Progress bar — növbəti seviyyəyə nə qədər qaldı
// 3. Mövcud reward-ları göstər + redeem düyməsi

function LoyaltyTierBadge({ points }: { points: number }) {
  const tiers = [
    { name: "Bronze", min: 0, color: "text-amber-700", bg: "bg-amber-100" },
    { name: "Silver", min: 500, color: "text-slate-600", bg: "bg-slate-100" },
    { name: "Gold", min: 1500, color: "text-yellow-600", bg: "bg-yellow-100" },
    {
      name: "Platinum",
      min: 5000,
      color: "text-violet-600",
      bg: "bg-violet-100",
    },
  ];
  const tier = [...tiers].reverse().find((t) => points >= t.min) ?? tiers[0];
  const next = tiers[tiers.indexOf(tier) + 1];
  const progress = next
    ? ((points - tier.min) / (next.min - tier.min)) * 100
    : 100;

  return (
    <div className={cn("rounded-2xl p-4", tier.bg)}>
      <div className="flex justify-between items-center mb-2">
        <span className={cn("font-bold text-lg", tier.color)}>{tier.name}</span>
        <span className="text-2xl font-black">{points} pt</span>
      </div>
      {next && (
        <>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                tier.color.replace("text", "bg"),
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, type: "spring" }}
            />
          </div>
          <p className="text-xs mt-1 opacity-70">
            {next.min - points} pt daha {next.name} üçün
          </p>
        </>
      )}
    </div>
  );
}
```

---

## BÖLMƏ C — Advanced KDS (Kitchen Display System)

### Tapşırıq C1 — Item-Level Status

**Fayl:** `src/components/kitchen/OrderCard.tsx`  
**Dəyişiklik:** Hər order item ayrı-ayrılıqda "hazır" işarələnə bilsin.

```tsx
// Item-level status toggle:
function KitchenOrderItem({ item, orderId, onToggleItem }) {
  const isDone = item.status === "ready";

  return (
    <motion.div
      layout
      onClick={() => onToggleItem(item.id, isDone ? "preparing" : "ready")}
      className={cn(
        "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all select-none",
        isDone
          ? "bg-success-500/15 line-through opacity-60"
          : "bg-surface hover:bg-surface-elevated",
      )}
    >
      <motion.div
        animate={
          isDone
            ? { scale: 1, backgroundColor: "#22c55e" }
            : { scale: 1, backgroundColor: "transparent" }
        }
        className="w-5 h-5 rounded-full border-2 border-success-500 flex items-center justify-center flex-shrink-0"
      >
        {isDone && <Check className="w-3 h-3 text-white" />}
      </motion.div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{item.productName}</span>
        {item.selectedExtras?.length > 0 && (
          <p className="text-xs text-foreground-muted truncate">
            + {item.selectedExtras.join(", ")}
          </p>
        )}
      </div>
      <span className="text-sm font-bold text-foreground-muted">
        ×{item.quantity}
      </span>
    </motion.div>
  );
}
```

**Backend — item status endpoint (`server/src/routes/orders.ts`):**

```typescript
// Mövcud faylın sonuna:
router.patch(
  "/:orderId/items/:itemId/status",
  authenticate,
  async (req, res, next) => {
    try {
      const { status } = req.body;
      const item = await prisma.orderItem.update({
        where: { id: req.params.itemId },
        data: { status },
      });

      // Bütün item-lər "ready" olduqda order-i avtomatik "ready" et:
      const allItems = await prisma.orderItem.findMany({
        where: { orderId: req.params.orderId },
      });
      if (allItems.every((i) => i.status === "ready")) {
        const order = await prisma.order.update({
          where: { id: req.params.orderId },
          data: { status: "ready" },
        });
        (req as any).io
          ?.to(order.branchId)
          .emit("order_status_updated", { orderId: order.id, status: "ready" });
      }

      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  },
);
```

### Tapşırıq C3 — Klaviatura Shortcut-ları (Bump Bar)

**Fayl:** `src/components/kitchen/KitchenPanel.tsx`

```typescript
// useEffect ilə klaviatura shortcut-ları:
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    // Space — seçilmiş sifarişi növbəti statusa keçir
    // Arrow keys — sifariş seçimi
    // B — bump (ready → served)
    // R — recall son served order

    if (e.key === " " && selectedOrderId) {
      e.preventDefault();
      const order = orders.find((o) => o.id === selectedOrderId);
      if (order?.status === "pending") bumpOrder(selectedOrderId, "preparing");
      if (order?.status === "preparing") bumpOrder(selectedOrderId, "ready");
    }
    if (e.key === "ArrowRight") selectNextOrder();
    if (e.key === "ArrowLeft") selectPrevOrder();
  };

  window.addEventListener("keydown", handleKey);
  return () => window.removeEventListener("keydown", handleKey);
}, [selectedOrderId, orders]);
```

---

## BÖLMƏ D — Post-Order Feedback (Müştəri Tərəfi)

### Tapşırıq D1 — Feedback Ekranı

**Yeni fayl:** `src/components/customer/FeedbackScreen.tsx`

```tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { post } from "@/services/api";
import { useSessionStore } from "@/stores/sessionStore";
import { useUIStore } from "@/stores/uiStore";

export function FeedbackScreen({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const setScreen = useUIStore((s) => s.setScreen);
  const session = useSessionStore((s) => s.session);

  const submit = async () => {
    await post("/feedback", {
      orderId,
      branchId: session?.branchId,
      rating,
      comment,
    });
    setSent(true);
    setTimeout(() => setScreen("home"), 2500);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="text-6xl mb-4">🙏</div>
          <h2 className="text-xl font-bold">Təşəkkür edirik!</h2>
          <p className="text-foreground-muted mt-2">Rəyiniz qeyd edildi</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Sifarişiniz necə idi?</h2>
        <p className="text-foreground-muted text-sm">
          Rəyiniz bizim üçün çox vacibdir
        </p>
      </div>

      {/* Ulduzlar */}
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setRating(star)}
          >
            <Star
              className={cn(
                "w-10 h-10 transition-colors",
                star <= rating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-foreground-muted/30",
              )}
            />
          </motion.button>
        ))}
      </div>

      {/* Şərh */}
      {rating > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Əlavə şərhiniz var? (isteğe bağlı)"
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-border bg-surface-elevated resize-none focus:outline-none focus:border-primary-500"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={submit}
            className="w-full mt-3 py-4 btn-primary text-base font-semibold rounded-2xl"
          >
            Göndər
          </motion.button>
        </motion.div>
      )}

      <button
        onClick={() => setScreen("home")}
        className="text-sm text-foreground-muted underline"
      >
        Keç
      </button>
    </div>
  );
}
```

**`App.tsx`-ə əlavə et:**

```typescript
import { FeedbackScreen } from '@/components/customer/FeedbackScreen';
// customerScreens-ə:
'feedback': () => <FeedbackScreen orderId={lastOrderId} />,
```

**`OrderSuccessScreen.tsx`-ə əlavə et:**

```tsx
// 3 saniyə sonra feedback-ə yönləndir:
useEffect(() => {
  const timer = setTimeout(() => setScreen("feedback"), 3000);
  return () => clearTimeout(timer);
}, []);
```

---

## Tamamlanma Vəziyyəti

### Bölmə A — Rezervasiya

- [ ] `ReservationView.tsx` yaradıldı
- [ ] `CreateReservationModal` əlavə edildi
- [ ] `navigation.ts` — reservations əlavə edildi
- [ ] `AdminApp.tsx` — Route əlavə edildi
- [ ] i18n fayllarına `reservations` açarı əlavə edildi

### Bölmə B — Loyalty

- [ ] `orders.ts` — `awardLoyaltyPoints()` əlavə edildi
- [ ] `orders.ts` — `redeemPoints` parametri əlavə edildi
- [ ] `RewardsScreen.tsx` — tier badge + progress bar + redeem UI

### Bölmə D — Feedback

- [ ] `FeedbackScreen.tsx` yaradıldı
- [ ] `App.tsx` — `feedback` screen əlavə edildi
- [ ] `OrderSuccessScreen.tsx` — feedback yönləndirməsi

---

## Növbəti Sprint

Sprint 6 tamamlandıqdan sonra **SPRINT_7_PWA.md** faylına keç.
