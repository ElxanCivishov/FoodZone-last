import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Package,
  CheckCircle2,
  XCircle,
  MapPin,
  Receipt,
  Star,
  Truck,
  CreditCard,
  AlertCircle,
  X,
  ShoppingBag,
  UtensilsCrossed,
  Flame,
  Utensils,
  Clock,
} from "lucide-react";
import { useUIStore, useOrderStore } from "@/store";
import type { OrderStatus, OrderType } from "@/types";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 28 };

const STATUS_CONFIG = {
  payment_pending: {
    label: "Ödəniş gözlənilir",
    color: "text-warning",
    bg: "bg-warning/10",
    icon: CreditCard,
    step: 0,
  },
  new: {
    label: "Qəbul edildi",
    color: "text-info",
    bg: "bg-info/10",
    icon: Package,
    step: 1,
  },
  preparing: {
    label: "Hazırlanır",
    color: "text-warning",
    bg: "bg-warning/10",
    icon: Clock,
    step: 2,
  },
  ready: {
    label: "Hazırdır",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 3,
  },
  served: {
    label: "Təqdim edildi",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 4,
  },
  on_the_way: {
    label: "Yoldadır",
    color: "text-primary",
    bg: "bg-primary/10",
    icon: Truck,
    step: 4,
  },
  delivered: {
    label: "Çatdırıldı",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 5,
  },
  completed: {
    label: "Tamamlandı",
    color: "text-success",
    bg: "bg-success/10",
    icon: CheckCircle2,
    step: 5,
  },
  cancelled: {
    label: "Ləğv edildi",
    color: "text-coral",
    bg: "bg-coral/10",
    icon: XCircle,
    step: 0,
  },
};

interface TimelineStep {
  status: OrderStatus;
  title: string;
  subtitle: string;
  icon: typeof CheckCircle2;
}

const STEPS_BY_TYPE: Record<OrderType, TimelineStep[]> = {
  dine_in: [
    {
      status: "new",
      title: "Qəbul edildi",
      subtitle: "Sifarişiniz sistemə daxil oldu",
      icon: CheckCircle2,
    },
    {
      status: "preparing",
      title: "Hazırlanır",
      subtitle: "Aşpazımız işə başladı",
      icon: Flame,
    },
    {
      status: "ready",
      title: "Hazırdır",
      subtitle: "Sifarişiniz hazırlanıb",
      icon: Package,
    },
    {
      status: "served",
      title: "Xidmət edildi",
      subtitle: "Masanıza gətirildi",
      icon: Utensils,
    },
    {
      status: "completed",
      title: "Tamamlandı",
      subtitle: "Nuş olsun!",
      icon: Star,
    },
  ],
  take_away: [
    {
      status: "new",
      title: "Qəbul edildi",
      subtitle: "Sifarişiniz sistemə daxil oldu",
      icon: CheckCircle2,
    },
    {
      status: "preparing",
      title: "Hazırlanır",
      subtitle: "Aşpazımız işə başladı",
      icon: Flame,
    },
    {
      status: "ready",
      title: "Hazırdır",
      subtitle: "Götürməyə hazırdır",
      icon: Package,
    },
    {
      status: "completed",
      title: "Tamamlandı",
      subtitle: "Nuş olsun!",
      icon: Star,
    },
  ],
  delivery: [
    {
      status: "new",
      title: "Qəbul edildi",
      subtitle: "Sifarişiniz sistemə daxil oldu",
      icon: CheckCircle2,
    },
    {
      status: "preparing",
      title: "Hazırlanır",
      subtitle: "Aşpazımız işə başladı",
      icon: Flame,
    },
    {
      status: "ready",
      title: "Hazırdır",
      subtitle: "Kuryerimiz sifarişinizi təhvil alır",
      icon: Package,
    },
    {
      status: "on_the_way",
      title: "Yoldadır",
      subtitle: "Kuryerimiz sizə doğru gəlir",
      icon: Truck,
    },
    {
      status: "delivered",
      title: "Çatdırıldı",
      subtitle: "Nuş olsun!",
      icon: CheckCircle2,
    },
  ],
};

const CANCEL_REASONS = [
  "Fikir dəyişdim",
  "Yanlış sifariş verdim",
  "Çox gözləmək istəmirəm",
  "Şəxsi səbəb",
  "Digər",
];

export default function OrderDetailScreen() {
  const { goBack, setScreen } = useUIStore();
  const { currentOrder, cancelOrder, payOrder } = useOrderStore();

  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  if (!order_guard(currentOrder)) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-canvas flex flex-col items-center justify-center gap-4"
      >
        <Receipt size={40} className="text-text-tertiary" />
        <p className="text-text-secondary text-[15px]">Sifariş tapılmadı</p>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={goBack}
          className="px-6 py-2.5 rounded-xl bg-primary text-white text-[14px] font-semibold"
        >
          Geri qayıt
        </motion.button>
      </motion.div>
    );
  }

  const order = currentOrder!;
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.new;
  const StatusIcon = cfg.icon;
  const orderType = (order.orderType ?? "dine_in") as OrderType;
  const steps = STEPS_BY_TYPE[orderType] ?? STEPS_BY_TYPE.dine_in;

  /* Can cancel: within 2 min AND not cancelled/completed */
  const elapsedMs = Date.now() - (order.createdAtMs ?? 0);
  const canCancel =
    elapsedMs < 120_000 &&
    !["cancelled", "completed", "delivered"].includes(order.status);
  const canPay = order.status === "payment_pending";

  const submitCancel = () => {
    const reason =
      selectedReason === "Digər" ? customReason.trim() : selectedReason;
    if (!reason) return;
    cancelOrder(order.id, reason);
    setShowCancelSheet(false);
  };

  const handlePayNow = () => {
    payOrder(order.id);
    setScreen("payment");
  };

  const currentStatusIndex = Math.max(
    0,
    steps.findIndex((s) => s.status === order.status),
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={SPRING}
        className="absolute inset-0 bg-canvas flex flex-col"
      >
        {/* Header */}
        <div className="bg-white dark:bg-[#1a1a2e] px-4 pt-12 pb-4 border-b border-border-light flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={goBack}
            className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-text-primary" />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-outfit text-[20px] font-bold text-text-primary">
              Sifariş #{order.id.slice(-6)}
            </h1>
            <p className="text-text-secondary text-[13px]">{order.createdAt}</p>
          </div>
          {/* Order type icon */}
          <div className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center">
            {orderType === "dine_in" && (
              <UtensilsCrossed size={16} className="text-text-secondary" />
            )}
            {orderType === "take_away" && (
              <ShoppingBag size={16} className="text-text-secondary" />
            )}
            {orderType === "delivery" && (
              <Truck size={16} className="text-text-secondary" />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 pb-24 space-y-3">
          {/* ── Payment pending banner ── */}
          <AnimatePresence>
            {canPay && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                  <CreditCard size={18} className="text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-warning">
                    Ödəniş gözlənilir
                  </p>
                  <p className="text-[12px] text-warning/70">
                    Sifarişi təsdiqləmək üçün ödəyin
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePayNow}
                  className="px-3 py-1.5 rounded-lg bg-warning text-white text-[12px] font-bold shrink-0"
                >
                  İndi Ödə
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Cancellation reason banner ── */}
          {order.status === "cancelled" && order.cancellationReason && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-coral/10 border border-coral/20 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <XCircle size={15} className="text-coral shrink-0" />
                <p className="text-[14px] font-bold text-coral">Ləğv edildi</p>
              </div>
              <p className="text-[12px] text-coral/70">
                <span className="font-semibold">Səbəb:</span>{" "}
                {order.cancellationReason}
              </p>
            </motion.div>
          )}

          {/* ── Status card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, ...SPRING }}
            className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-border-light shadow-xs p-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center`}
              >
                <StatusIcon size={18} className={cfg.color} />
              </div>
              <div>
                <p className="text-[16px] font-bold text-text-primary">
                  {cfg.label}
                </p>
                <p className="text-[12px] text-text-secondary">
                  {orderType === "dine_in" && `Masa ${order.tableNumber}`}
                  {orderType === "take_away" && "Take Away"}
                  {orderType === "delivery" && "Çatdırılma"} • ~
                  {order.estimatedTime} dəq
                </p>
              </div>
            </div>

            {order.status !== "cancelled" &&
              order.status !== "payment_pending" && (
                <div className="relative mt-4">
                  {/* Vertical background line */}
                  <div className="absolute left-[15px] top-8 bottom-8 w-0.5 bg-border-light">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{
                        height: `${(currentStatusIndex / Math.max(steps.length - 1, 1)) * 100}%`,
                      }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                      className="w-full bg-success"
                    />
                  </div>
                  <div className="flex flex-col">
                    {steps.map((step, i) => {
                      const done = i < currentStatusIndex;
                      const active = i === currentStatusIndex;
                      const pending = i > currentStatusIndex;
                      const Icon = step.icon;
                      return (
                        <motion.div
                          key={step.status}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.08, ...SPRING }}
                          className="flex gap-4 pb-5 last:pb-0 relative"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-[1] transition-all ${
                              done
                                ? "bg-success text-white"
                                : active
                                  ? "bg-primary text-white"
                                  : "bg-surface-elevated text-text-tertiary border-2 border-border"
                            }`}
                            style={
                              active
                                ? { animation: "pulseGlow 2s infinite" }
                                : {}
                            }
                          >
                            <Icon size={14} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p
                              className={`text-[13px] font-semibold ${pending ? "text-text-tertiary" : "text-text-primary"}`}
                            >
                              {step.title}
                            </p>
                            <p className="text-[11px] text-text-tertiary mt-0.5">
                              {step.subtitle}
                            </p>
                          </div>
                          {done && (
                            <CheckCircle2
                              size={15}
                              className="text-success self-center shrink-0"
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
          </motion.div>

          {/* ── Items ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ...SPRING }}
            className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-border-light shadow-xs overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border-light">
              <p className="font-outfit text-[15px] font-bold text-text-primary">
                Sifarişin tərkibi
              </p>
            </div>
            {order.items.map((item, i) => (
              <div
                key={`${item.product.id}-${i}`}
                className={`flex items-center gap-3 px-4 py-3 ${i < order.items.length - 1 ? "border-b border-border-light" : ""}`}
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text-primary truncate">
                    {item.product.name}
                  </p>
                  <p className="text-[12px] text-text-secondary">
                    {item.selectedSize.label}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-semibold text-text-primary">
                    x{item.quantity}
                  </p>
                  <p className="text-primary font-bold text-[13px]">
                    {(item.unitPrice * item.quantity).toFixed(2)} AZN
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* ── Totals ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ...SPRING }}
            className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-border-light shadow-xs p-4 space-y-2"
          >
            <Row label="Aratoplam" value={`${order.subtotal.toFixed(2)} AZN`} />
            <Row
              label="Servis haqqı"
              value={`${order.serviceFee.toFixed(2)} AZN`}
            />
            {order.discount > 0 && (
              <Row
                label="Endirim"
                value={`-${order.discount.toFixed(2)} AZN`}
                valueClass="text-success"
              />
            )}
            <div className="flex justify-between text-[15px] pt-2 border-t border-border-light">
              <span className="font-bold text-text-primary">Cəmi</span>
              <span className="font-bold text-primary">
                {order.total.toFixed(2)} AZN
              </span>
            </div>
            {/* Payment status */}
            <div className="flex justify-between text-[12px] pt-1">
              <span className="text-text-secondary">Ödəniş üsulu</span>
              <span
                className={`font-semibold ${order.paymentStatus === "paid" ? "text-success" : "text-warning"}`}
              >
                {order.paymentMethod === "card" ? "Kart" : "Nağd"} •{" "}
                {order.paymentStatus === "paid" ? "Ödənildi" : "Gözlənilir"}
              </span>
            </div>
          </motion.div>

          {/* ── Delivery / Table info ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...SPRING }}
            className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-border-light shadow-xs p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-primary" />
              <p className="font-outfit text-[14px] font-bold text-text-primary">
                {orderType === "delivery" ? "Çatdırılma ünvanı" : "Məkan"}
              </p>
            </div>
            <p className="text-[13px] text-text-secondary">
              {orderType === "delivery" &&
                (order.deliveryAddress ?? "Ünvan göstərilməyib")}
              {orderType === "dine_in" && `Masa ${order.tableNumber}`}
              {orderType === "take_away" && "Take Away — özünüz alacaqsınız"}
            </p>
          </motion.div>

          {/* ── Cancel button (within 2 min) ── */}
          {canCancel && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, ...SPRING }}
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCancelSheet(true)}
                className="w-full flex items-center gap-3 p-4 bg-coral/5 border border-coral/20 rounded-2xl"
              >
                <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center shrink-0">
                  <XCircle size={18} className="text-coral" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-[14px] font-semibold text-coral">
                    Sifarişdən imtina et
                  </p>
                  <p className="text-[12px] text-coral/60">
                    Sifariş verildikdən 2 dəqiqə ərzində mümkündür
                  </p>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* ── Review (completed) ── */}
          {order.status === "completed" && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, ...SPRING }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center gap-3 p-4 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-border-light shadow-xs"
            >
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Star size={18} className="text-warning" />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-semibold text-text-primary">
                  Rəy bildir
                </p>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  Bu sifarişi qiymətləndir
                </p>
              </div>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ── Cancel bottom sheet ── */}
      <AnimatePresence>
        {showCancelSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelSheet(false)}
              className="absolute inset-0 z-[300] bg-black/50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={SPRING}
              className="absolute bottom-0 left-0 right-0 z-[301] bg-white dark:bg-[#1a1a2e] rounded-t-3xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-outfit text-[17px] font-bold text-text-primary">
                  İmtina səbəbi
                </h3>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setShowCancelSheet(false)}
                  className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center"
                >
                  <X size={14} className="text-text-secondary" />
                </motion.button>
              </div>

              {order.paymentMethod === "card" && (
                <div className="flex items-start gap-2.5 p-3 bg-warning/10 border border-warning/25 rounded-xl mb-4">
                  <AlertCircle
                    size={15}
                    className="text-warning shrink-0 mt-0.5"
                  />
                  <p className="text-[12px] text-warning leading-relaxed">
                    Ödənişinizin geri qaytarılması üçün restoran ilə əlaqə
                    saxlamağınız tələb olunur.
                  </p>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {CANCEL_REASONS.map((r) => (
                  <motion.button
                    key={r}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedReason(r)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                      selectedReason === r
                        ? "border-coral bg-coral/5"
                        : "border-transparent bg-surface-elevated"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedReason === r
                          ? "border-coral bg-coral"
                          : "border-border"
                      }`}
                    >
                      {selectedReason === r && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span
                      className={`text-[14px] font-medium ${selectedReason === r ? "text-coral" : "text-text-primary"}`}
                    >
                      {r}
                    </span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {selectedReason === "Digər" && (
                  <motion.input
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 44 }}
                    exit={{ opacity: 0, height: 0 }}
                    type="text"
                    placeholder="Səbəbi yazın…"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-3.5 rounded-xl border border-border-light bg-surface-elevated text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-coral mb-3"
                  />
                )}
              </AnimatePresence>

              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowCancelSheet(false)}
                  className="flex-1 py-3.5 rounded-xl border border-border-light bg-surface-elevated text-[14px] font-semibold text-text-secondary"
                >
                  Ləğv et
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={submitCancel}
                  disabled={
                    !selectedReason ||
                    (selectedReason === "Digər" && !customReason.trim())
                  }
                  className="flex-1 py-3.5 rounded-xl bg-coral text-white text-[14px] font-semibold disabled:opacity-50"
                >
                  İmtina et
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Row({
  label,
  value,
  valueClass = "text-text-primary",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function order_guard(o: unknown): o is NonNullable<typeof o> {
  return o !== null && o !== undefined;
}
